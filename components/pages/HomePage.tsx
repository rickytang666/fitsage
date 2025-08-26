"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthProvider";
import DatabaseService from "../../services/DatabaseService";
import { User, Workout } from "../../models/User";
import logger from "@/utils/logger";
import styles from "./HomePage.module.css";
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
    if (bmi === 0) return { status: "Not set", color: "gray" };
    if (bmi < 18.5) return { status: "Underweight", color: "lightskyblue" };
    if (bmi < 25) return { status: "Normal", color: "springgreen" };
    if (bmi < 30) return { status: "Overweight", color: "yellow" };
    return { status: "Obese", color: "salmon" };
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
        pointBorderColor: "white",
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
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        titleColor: "white",
        bodyColor: "white",
        borderColor: "rgb(249, 115, 22)",
        borderWidth: 1,
        titleFont: {
          family:
            '"SF Mono", Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace',
        },
        bodyFont: {
          family:
            '"SF Mono", Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace',
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
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "white",
          stepSize: 1,
          font: {
            family:
              '"SF Mono", Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace',
          },
        },
      },
      x: {
        grid: {
          display: false,
          drawBorder: false,
        },
        ticks: {
          color: "white",
          font: {
            family:
              '"SF Mono", Monaco, Inconsolata, "Roboto Mono", Consolas, "Courier New", monospace',
          },
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
      <div className={styles.container}>
        <div className={styles.loading}>Loading your profile...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Please log in to view your profile.</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Profile not found. Try refreshing the page or contact support.
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(user.weight, user.height);
  const bmiStatus = getBMIStatus(bmi);

  return (
    <div className={styles.container}>
      {/* Greeting Banner with Fitness Decorations */}
      <div className="bg-orange-400 bg-opacity-60 shadow-lg mb-8 rounded-3xl">
        <div className="px-6 py-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">
              {greeting},{" "}
              {user?.name ||
                authUser?.email?.split("@")[0] ||
                "Fitness Enthusiast"}
              !
            </h1>
            <p className="text-purple-200 text-lg mt-2">
              Ready for your daily fitness journey?
            </p>
          </div>
        </div>
      </div>

      {/* Profile Information */}
      <div className={styles.profileCard}>
        <div className={styles.profileContent}>
          <h2>
            <i className="material-symbols-outlined">person</i> Profile
            Information
          </h2>

          {!isEditing ? (
            // View Mode
            <div className={styles.viewMode}>
              <div className={styles.profileField}>
                <label>Name:</label>
                <span>{user.name}</span>
              </div>

              <div className={styles.profileField}>
                <label>Height:</label>
                <span>{user.height > 0 ? `${user.height} cm` : "Not set"}</span>
              </div>

              <div className={styles.profileField}>
                <label>Weight:</label>
                <span>{user.weight > 0 ? `${user.weight} kg` : "Not set"}</span>
              </div>

              <div className={styles.profileField}>
                <label>BMI:</label>
                <span style={{ color: bmiStatus.color }}>
                  {bmi > 0 ? `${bmi} (${bmiStatus.status})` : "Not available"}
                </span>
              </div>

              <button onClick={handleEdit} className={styles.editButton}>
                <i className="material-symbols-outlined">edit</i>Edit Profile
              </button>
            </div>
          ) : (
            // Edit Mode
            <div className={styles.editMode}>
              <div className={styles.formField}>
                <label>Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={styles.input}
                />
              </div>

              <div className={styles.formField}>
                <label>Height (cm):</label>
                <input
                  type="number"
                  value={formData.height || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, height: Number(e.target.value) })
                  }
                  className={styles.input}
                  min="0"
                  max="300"
                />
              </div>

              <div className={styles.formField}>
                <label>Weight (kg):</label>
                <input
                  type="number"
                  value={formData.weight || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, weight: Number(e.target.value) })
                  }
                  className={styles.input}
                  min="0"
                  max="500"
                />
              </div>

              <div className={styles.buttonGroup}>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className={styles.saveButton}
                >
                  {isSaving ? "💾 Saving..." : "💾 Save"}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className={styles.cancelButton}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Fitness Stats</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.totalLogs}</div>
            <div className={styles.statLabel}>Total Logs</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.totalWorkouts}</div>
            <div className={styles.statLabel}>Total Workouts</div>
          </div>

          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.totalWorkoutMinutes}</div>
            <div className={styles.statLabel}>Minutes Exercised</div>
          </div>
        </div>
      </div>

      {/* Workout Chart */}
      <div className={styles.chartSectionWrapper}>
        <div className={styles.chartSection}>
          <h2 className={styles.chartTitle}>
            <span className="material-symbols-outlined">chart_data</span> Weekly
            Workout Intensity
          </h2>
          <p className={styles.chartSubtitle}>
            Intensity is calculated based on calories burned, duration,
            sets/reps, and weight used
          </p>
          <div className={styles.chartContainer}>
            {isLoadingChart ? (
              <div className={styles.chartLoading}>
                <div className={styles.loadingSpinner}></div>
                <p>Loading your workout data...</p>
              </div>
            ) : (
              <Line data={chartData} options={chartOptions} />
            )}
          </div>
          <div className={styles.intensityLegend}>
            <div className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: "#ef4444" }}
              ></span>
              <span>Very High (3.1-4.0)</span>
            </div>
            <div className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: "#f97316" }}
              ></span>
              <span>High (2.1-3.0)</span>
            </div>
            <div className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: "#eab308" }}
              ></span>
              <span>Moderate (1.1-2.0)</span>
            </div>
            <div className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: "#22c55e" }}
              ></span>
              <span>Light (0.1-1.0)</span>
            </div>
            <div className={styles.legendItem}>
              <span
                className={styles.legendDot}
                style={{ backgroundColor: "#9ca3af" }}
              ></span>
              <span>No workout (0)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Motivational Quote */}
      <div className={styles.motivationalQuote}>
        <p className={styles.quoteText}>
          &ldquo;The only bad workout is the one that didn&apos;t happen.&rdquo;
        </p>
      </div>
    </div>
  );
}
