"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthProvider";
import DatabaseService from "../../services/DatabaseService";
import { User, Workout } from "../../models/User";
import logger from "@/utils/logger";
import { IconUser, IconPencil, IconChartHistogram } from "@tabler/icons-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Line } from "react-chartjs-2";
import { useTheme } from "next-themes";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function HomePage() {
  const { user: authUser } = useAuth();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [greeting, setGreeting] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    height: 0,
    weight: 0,
  });
  const [weeklyIntensityData, setWeeklyIntensityData] = useState<number[]>([
    0, 0, 0, 0, 0, 0, 0,
  ]);
  const [isLoadingChart, setIsLoadingChart] = useState(true);

  // Set greeting based on time of day
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting("Good morning");
    else if (hour < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Prevent hydration mismatch with theme
  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe theme value to prevent hydration mismatch
  const safeTheme = mounted ? theme : "light";

  const loadUserData = useCallback(async () => {
    if (!authUser?.id) {
      return;
    }

    setIsLoading(true);

    try {
      const userData = await DatabaseService.loadUser(authUser.id);

      if (userData) {
        setUser(userData);
        setFormData({
          name: userData.name,
          height: userData.height,
          weight: userData.weight,
        });
      } else {
        // Create new user profile with email-based name
        const userName = authUser.email?.split("@")[0] || "User";
        const newUser = new User(authUser.id, userName, 0, 0);

        const saved = await DatabaseService.saveUserProfile(newUser);

        if (saved) {
          setUser(newUser);
          setFormData({
            name: newUser.name,
            height: newUser.height,
            weight: newUser.weight,
          });
        } else {
          console.error("Failed to save new user profile");
        }
      }
    } catch (error) {
      console.error("Error loading user data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.id, authUser?.email]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        height: user.height,
        weight: user.weight,
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!authUser || !user) return;

    setIsSaving(true);
    try {
      // Update user object
      user.name = formData.name;
      user.height = formData.height;
      user.weight = formData.weight;

      // Save to database
      const saved = await DatabaseService.saveUserProfile(user);

      if (saved) {
        setIsEditing(false);
        // Reload data to ensure consistency
        await loadUserData();
      } else {
        alert("Failed to save profile. Please try again.");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const calculateBMI = (weight: number, height: number) => {
    if (height === 0 || weight === 0) return 0;
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi === 0) return "Not set";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  };

  // Calculate workout intensity based on multiple factors
  const calculateWorkoutIntensity = useCallback(
    (workouts: Workout[]): number => {
      if (!workouts || workouts.length === 0) return 0;

      let totalIntensity = 0;

      workouts.forEach((workout) => {
        let intensity = 0;

        // Base intensity from calories (normalized to 0-1 scale)
        // 100 calories = 0.5 intensity, 500+ calories = 2.0 intensity
        const calorieIntensity = Math.min((workout.calories || 0) / 250, 2.0);
        intensity += calorieIntensity;

        // Duration intensity (normalized to 0-1 scale)
        // 30 minutes = 0.5 intensity, 90+ minutes = 1.5 intensity
        if (workout.durationMinutes) {
          const durationIntensity = Math.min(workout.durationMinutes / 60, 1.5);
          intensity += durationIntensity;
        }

        // Sets/reps intensity (for strength training)
        if (workout.sets && workout.reps) {
          // More sets and reps = higher intensity
          const setsRepsIntensity = Math.min(
            (workout.sets * workout.reps) / 50,
            1.0
          );
          intensity += setsRepsIntensity;
        }

        // Weight intensity bonus (for strength training)
        if (workout.weight && workout.weight > 0) {
          // Higher weight = slight intensity bonus
          const weightBonus = Math.min(workout.weight / 100, 0.5);
          intensity += weightBonus;
        }

        totalIntensity += intensity;
      });

      // Cap maximum daily intensity at 4.0 and round to 1 decimal
      return Math.round(Math.min(totalIntensity, 4.0) * 10) / 10;
    },
    []
  );

  // Load workout data for the past 7 days and calculate intensity
  const loadWeeklyChartData = useCallback(async () => {
    if (!authUser?.id) return;

    setIsLoadingChart(true);

    try {
      // Load diary entries
      const diaryEntries = await DatabaseService.loadDiaryEntries(authUser.id);

      // Get the past 7 days (Sunday to Saturday)
      const today = new Date();
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const weekData: number[] = [0, 0, 0, 0, 0, 0, 0]; // [Sun, Mon, Tue, Wed, Thu, Fri, Sat]

      // Calculate dates for each day of the current week
      for (let i = 0; i < 7; i++) {
        const targetDate = new Date(today);
        targetDate.setDate(today.getDate() - currentDay + i); // Go to Sunday + i days
        targetDate.setHours(12, 0, 0, 0); // Set to noon for consistent comparison

        // Find diary entry for this date
        const matchingEntry = diaryEntries.find((entry) => {
          const entryDate = new Date(entry.date);
          entryDate.setHours(12, 0, 0, 0);
          return entryDate.toDateString() === targetDate.toDateString();
        });

        if (matchingEntry && matchingEntry.workouts) {
          weekData[i] = calculateWorkoutIntensity(matchingEntry.workouts);
        }
      }

      logger.debug("Weekly intensity data calculated:", {
        weekData,
        totalEntries: diaryEntries.length,
        currentWeek: `${new Date(
          today.getTime() - currentDay * 24 * 60 * 60 * 1000
        ).toLocaleDateString()} - ${new Date(
          today.getTime() + (6 - currentDay) * 24 * 60 * 60 * 1000
        ).toLocaleDateString()}`,
      });

      setWeeklyIntensityData(weekData);
    } catch (error) {
      console.error("Error loading weekly chart data:", error);
      // Keep default zeros on error
    } finally {
      setIsLoadingChart(false);
    }
  }, [authUser?.id, calculateWorkoutIntensity]);

  // Single effect to load both user data and chart data together
  useEffect(() => {
    const loadAllData = async () => {
      if (authUser?.id) {
        // Load user data first
        await loadUserData();
        // Then load chart data
        await loadWeeklyChartData();
      }
    };

    loadAllData();
  }, [authUser?.id, loadUserData, loadWeeklyChartData]);

  // Chart data
  const chartData = {
    labels: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
    datasets: [
      {
        label: "Workout Intensity",
        data: weeklyIntensityData,
        borderColor: "rgb(249, 115, 22)",
        backgroundColor: "rgba(249, 115, 22, 0.1)",
        pointBackgroundColor: "rgb(249, 115, 22)",
        pointBorderWidth: 2,
        pointRadius: 6,
        pointHoverRadius: 8,
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        intersect: false,
        backgroundColor:
          safeTheme === "dark"
            ? "rgba(0, 0, 0, 0.8)"
            : "rgba(255, 255, 255, 0.8)",
        titleColor: safeTheme === "dark" ? "white" : "black",
        bodyColor: safeTheme === "dark" ? "white" : "black",
        borderColor: "rgb(249, 115, 22)",
        borderWidth: 1,
        titleFont: {
          family: "monospace",
        },
        bodyFont: {
          family: "monospace",
        },
        callbacks: {
          label: function (context: { parsed: { y: number } }) {
            const value = context.parsed.y;
            let intensityLevel = "No workout";
            if (value > 0) {
              if (value <= 1) intensityLevel = "Light";
              else if (value <= 2) intensityLevel = "Moderate";
              else if (value <= 3) intensityLevel = "High";
              else intensityLevel = "Very High";
            }
            return `Intensity: ${value} (${intensityLevel})`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 4,
        display: true,
        grid: {
          display: true,
          color:
            safeTheme === "dark"
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.2)",
          drawBorder: true,
        },
        ticks: {
          color: safeTheme === "dark" ? "white" : "black",
          stepSize: 1,
          font: {
            family: "monospace",
            size: 12,
          },
        },
        border: {
          display: true,
          color: "var(--border)",
        },
      },
      x: {
        display: true,
        grid: {
          display: true,
          color:
            safeTheme === "dark"
              ? "rgba(255, 255, 255, 0.2)"
              : "rgba(0, 0, 0, 0.2)",
          drawBorder: true,
        },
        ticks: {
          color: safeTheme === "dark" ? "white" : "black",
          font: {
            family: "monospace",
            size: 12,
          },
        },
        border: {
          display: true,
          color: "var(--border)",
        },
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
    },
  };

  if (isLoading) {
    return (
      <div className="p-10 px-4 bg-background min-h-screen">
        <div className="text-center text-xl text-foreground">
          Loading your profile...
        </div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className="p-10 px-4 bg-background min-h-screen">
        <div className="text-center text-xl text-foreground">
          Please log in to view your profile.
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="p-10 px-4 bg-background min-h-screen">
        <div className="text-center text-xl text-foreground">
          Profile not found. Try refreshing the page or contact support.
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(user.weight, user.height);

  return (
    <div className="p-10 px-4 bg-background min-h-screen">
      {/* Greeting Banner with Fitness Decorations */}
      <div className="bg-primary/80 shadow-lg mb-8 rounded-3xl">
        <div className="px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">
              {greeting},{" "}
              {user?.name ||
                authUser?.email?.split("@")[0] ||
                "Fitness Enthusiast"}
              !
            </h1>
            <p className="text-fuchsia-500 dark:text-fuchsia-300 text-lg mt-2">
              Ready for your daily fitness journey?
            </p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className="mx-auto max-w-md bg-card backdrop-blur-xl border border-border rounded-3xl shadow-lg p-8 mb-8">
        <div className="text-center">
          <h2 className="flex items-center justify-center text-xl sm:text-2xl font-semibold mb-6">
            <IconUser className="mr-2" /> Profile Information
          </h2>

          {!isEditing ? (
            // View Mode
            <div className="space-y-3">
              <div className="flex justify-between items-center py-3 border-b border-border">
                <label className="font-medium text-foreground text-sm sm:text-base">
                  Name:
                </label>
                <span className="text-foreground">{user.name}</span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border">
                <label className="font-medium text-foreground text-sm sm:text-base">
                  Height:
                </label>
                <span className="text-foreground">
                  {user.height > 0 ? `${user.height} cm` : "Not set"}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border">
                <label className="font-medium text-foreground text-sm sm:text-base">
                  Weight:
                </label>
                <span className="text-foreground">
                  {user.weight > 0 ? `${user.weight} kg` : "Not set"}
                </span>
              </div>

              <div className="flex justify-between items-center py-3 border-b border-border">
                <label className="font-medium text-foreground text-sm sm:text-base">
                  BMI:
                </label>
                <div className="flex items-center gap-2">
                  <span
                    className={
                      bmi > 0
                        ? bmi < 18.5
                          ? "text-bmi-underweight"
                          : bmi < 25
                          ? "text-bmi-normal"
                          : bmi < 30
                          ? "text-bmi-overweight"
                          : "text-bmi-obese"
                        : "text-bmi-not-set"
                    }
                  >
                    {bmi > 0 ? `${bmi}` : "Not available"}
                  </span>
                  {bmi > 0 && (
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bmi < 18.5
                          ? "bg-bmi-underweight/20 text-bmi-underweight border border-bmi-underweight/30"
                          : bmi < 25
                          ? "bg-bmi-normal/20 text-bmi-normal border border-bmi-normal/30"
                          : bmi < 30
                          ? "bg-bmi-overweight/20 text-bmi-overweight border border-bmi-overweight/30"
                          : "bg-bmi-obese/20 text-bmi-obese border border-bmi-obese/30"
                      }`}
                    >
                      {getBMIStatus(bmi)}
                    </span>
                  )}
                </div>
              </div>

              <button
                onClick={handleEdit}
                className="mt-6 px-6 py-3 bg-primary rounded-full font-medium hover:bg-primary/80 transition-colors flex items-center mx-auto"
              >
                <IconPencil className="mr-2" /> Edit Profile
              </button>
            </div>
          ) : (
            // Edit Mode
            <div className="space-y-4">
              <div className="text-left">
                <label className="block font-medium text-foreground mb-2">
                  Name:
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>

              <div className="text-left">
                <label className="block font-medium text-foreground mb-2">
                  Height (cm):
                </label>
                <input
                  type="number"
                  value={formData.height || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, height: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  min="0"
                  max="300"
                />
              </div>

              <div className="text-left">
                <label className="block font-medium text-foreground mb-2">
                  Weight (kg):
                </label>
                <input
                  type="number"
                  value={formData.weight || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: Number(e.target.value) })
                  }
                  className="w-full px-4 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  min="0"
                  max="500"
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? "💾 Saving..." : "💾 Save"}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex-1 px-6 py-3 bg-secondary text-secondary-foreground rounded-lg font-medium hover:bg-secondary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="mt-8 mb-8">
        <h3 className="text-xl sm:text-2xl font-semibold mb-6 text-center">
          Fitness Stats
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg text-center">
            <div className="text-3xl font-bold text-foreground mb-2">
              {user.totalLogs}
            </div>
            <div className="text-sm text-muted-foreground">Total Logs</div>
          </div>

          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg text-center">
            <div className="text-3xl font-bold text-foreground mb-2">
              {user.totalWorkouts}
            </div>
            <div className="text-sm text-muted-foreground">Total Workouts</div>
          </div>

          <div className="bg-card backdrop-blur-xl border border-border rounded-2xl p-6 shadow-lg text-center">
            <div className="text-3xl font-bold text-foreground mb-2">
              {user.totalWorkoutMinutes}
            </div>
            <div className="text-sm text-muted-foreground">
              Minutes Exercised
            </div>
          </div>
        </div>
      </div>

      {/* Workout Chart */}
      <div className="bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg p-8 mb-8">
        <div>
          <h2 className="flex items-center text-xl sm:text-2xl font-semibold mb-4 text-foreground">
            <IconChartHistogram className="w-6 h-6 mr-2" />
            Weekly Workout Intensity
          </h2>
          <p className="text-sm text-center mb-6">
            Intensity is calculated based on calories burned, duration,
            sets/reps, and weight used
          </p>
          <div className="p-4 flex items-center overflow-x-auto">
            <div className="min-h-[200px] md:min-h-[300px] min-w-[500px] md:min-w-full">
              {isLoadingChart ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-foreground text-sm sm:text-base">
                    Loading your workout data...
                  </p>
                </div>
              ) : (
                <Line data={chartData} options={chartOptions} />
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6 text-xs lg:text-sm">
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#ef4444" }}
              ></span>
              <span>
                Very High (3.1-4.0)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#f97316" }}
              ></span>
              <span>High (2.1-3.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#eab308" }}
              ></span>
              <span>
                Moderate (1.1-2.0)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#22c55e" }}
              ></span>
              <span>Light (0.1-1.0)</span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: "#9ca3af" }}
              ></span>
              <span>No workout (0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className="text-center py-8">
        <p className="text-xl italic text-muted-foreground bg-muted py-10 rounded-xl border-l-6 border-l-primary">
          &ldquo;The only bad workout is the one that didn&apos;t happen.&rdquo;
        </p>
      </div>
    </div>
  );
}
