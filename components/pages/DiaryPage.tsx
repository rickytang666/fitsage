"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthProvider";
import DatabaseService from "../../services/DatabaseService";
import { Log, Workout } from "../../models/User";
import VoiceRecorder from "../voice/VoiceRecorder";
import {
  IconKeyboard,
  IconMicrophone,
  IconFileText,
  IconChartBar,
  IconSelector,
} from "@tabler/icons-react";
import logger from "@/utils/logger";

export default function DiaryPage() {
  const { user: authUser } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState<Log[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Log | null>(null);
  const [entryText, setEntryText] = useState("");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>("");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [isDateValid, setIsDateValid] = useState(true);
  const [viewMode, setViewMode] = useState<"diary" | "summary">("summary"); // Default to summary view
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(
    new Set()
  ); // Track which entries are expanded
  const [isCanceling, setIsCanceling] = useState(false); // Track if we're canceling to prevent validation flash
  const [isVoiceMode, setIsVoiceMode] = useState(false); // Track voice vs type mode

  // Generate a simple ID
  const generateId = () =>
    `diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Toggle expanded state for diary entries
  const toggleEntryExpansion = (entryId: string) => {
    setExpandedEntries((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(entryId)) {
        newSet.delete(entryId);
      } else {
        newSet.add(entryId);
      }
      return newSet;
    });
  };

  // Format date for display (fix timezone issues)
  const formatDate = (date: Date): string => {
    // Create a new date using the date components to avoid timezone issues
    const localDate = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate()
    );
    return localDate.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Load all diary entries
  const loadDiaryEntries = useCallback(async () => {
    if (!authUser?.id) return;

    setIsLoading(true);
    try {
      const entries = await DatabaseService.loadDiaryEntries(authUser.id);
      setDiaryEntries(entries);
      logger.info(`📚 Loaded ${entries.length} diary entries`);
    } catch (error) {
      logger.error("Error loading diary entries:", error);
      setError("Failed to load diary entries");
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.id]);

  // Find nearest available date and set as default
  const setDefaultDate = useCallback(async () => {
    if (!authUser?.id) return;

    try {
      // Always start from today when looking for available dates
      const startDate = new Date();
      const availableDate = await DatabaseService.findNearestAvailableDate(
        authUser.id,
        startDate
      );
      // Fix timezone issue: format date properly for input
      const year = availableDate.getFullYear();
      const month = String(availableDate.getMonth() + 1).padStart(2, "0");
      const day = String(availableDate.getDate()).padStart(2, "0");
      setSelectedDate(`${year}-${month}-${day}`);
    } catch (error) {
      logger.error("Error finding available date:", error);
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, "0");
      const day = String(today.getDate()).padStart(2, "0");
      setSelectedDate(`${year}-${month}-${day}`);
    }
  }, [authUser?.id]);

  // Validate selected date
  const validateDate = useCallback(
    async (dateStr: string, excludeEntryId?: string) => {
      if (!authUser?.id || !dateStr) return false;

      const selectedDateObj = new Date(dateStr);
      const today = new Date();

      // Check if future date
      if (selectedDateObj > today) {
        setError("Cannot create entries for future dates");
        setIsDateValid(false);
        return false;
      }

      // Check if date is available
      const isAvailable = await DatabaseService.isDateAvailable(
        authUser.id,
        selectedDateObj,
        excludeEntryId
      );
      if (!isAvailable) {
        setError("This date already has an entry. Choose a different date.");
        setIsDateValid(false);
        return false;
      }

      setError("");
      setIsDateValid(true);
      return true;
    },
    [authUser?.id]
  );

  // Handle date change
  const handleDateChange = async (dateStr: string) => {
    setSelectedDate(dateStr);

    if (dateStr) {
      await validateDate(dateStr, currentEntry?.id);
    }
  };

  // AI pipeline function
  const processDiaryEntryWithAI = useCallback(
    async (
      diaryText: string,
      date: string,
      currentEntryId?: string,
      isEditing: boolean = false
    ) => {
      if (!authUser?.id) return;

      setIsSaving(true);
      setStatusMessage("Saving...");
      setError(""); // Clear any previous errors

      // 🚀 EXIT EDITOR IMMEDIATELY - Clear form first
      if (isEditing) {
        setCurrentEntry(null);
        setEntryText("");
        setError("");
        setStatusMessage("");
        setIsDateValid(true);
      } else {
        setEntryText("");
        setError("");
        setStatusMessage("");
      }
      setIsSaving(false);

      // 🎯 Background AI processing - don't block user
      (async () => {
        try {
          setStatusMessage("✅ Saved! Processing with AI...");

          // Call Gemini API to process the diary entry
          const geminiResponse = await fetch("/api/summarize", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              diaryText: diaryText,
              logDate: new Date(date).toISOString(),
            }),
          });

          if (!geminiResponse.ok) {
            // Handle AI failures gracefully
            if (geminiResponse.status === 429) {
              setStatusMessage(
                "✅ Saved! (AI analysis delayed due to rate limits)"
              );
              setTimeout(() => setStatusMessage(""), 4000);

              // Save basic entry without AI analysis
              const fallbackLog = new Log(
                currentEntryId || generateId(),
                diaryText,
                new Date(date),
                [
                  "📝 Entry saved. AI analysis will be available when quota resets.",
                ]
              );

              await DatabaseService.saveLog(fallbackLog, authUser.id);
              await loadDiaryEntries();
              return;
            }
            throw new Error("AI processing failed");
          }

          const { logData } = await geminiResponse.json();

          if (!logData) {
            throw new Error("Invalid AI response");
          }

          // Create Log object with AI-processed data
          const log = new Log(
            currentEntryId || generateId(),
            logData.diaryEntry,
            new Date(date),
            logData.suggestions
          );

          // Add workouts with proper structure
          logData.workouts.forEach((workoutData: Record<string, unknown>) => {
            const workout = new Workout(
              workoutData.id as string,
              workoutData.name as string,
              new Date(workoutData.date as string),
              {
                durationMinutes: workoutData.durationMinutes as number,
                sets: workoutData.sets as number,
                reps: workoutData.reps as number,
                weight: workoutData.weight as number,
                calories: (workoutData.calories as number) || 200,
              }
            );
            log.workouts.push(workout);
          });

          // Add injuries
          log.injuries = logData.injuries;

          // Save the complete log to database
          const success = await DatabaseService.saveLog(log, authUser.id);

          if (success) {
            await loadDiaryEntries();
            // Update default date after entries are reloaded
            await setDefaultDate();
            setStatusMessage(
              "✅ Saved with AI insights! Updating recommendations..."
            );

            // 🚀 REGENERATE FEATURED WORKOUTS CACHE in background
            try {
              // Get fresh diary entries for cache generation
              const freshDiaryEntries = await DatabaseService.loadDiaryEntries(
                authUser.id
              );

              // Generate new featured workouts and cache them
              const response = await fetch("/api/featured-workouts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  userId: authUser.id,
                  diaryEntries: freshDiaryEntries,
                  regenerateCache: true,
                }),
              });

              if (response.ok) {
                const data = await response.json();
                await DatabaseService.saveFeaturedWorkoutsCache(
                  authUser.id,
                  data.suggestions || [],
                  data.featuredWorkouts || [],
                  freshDiaryEntries
                );

                setStatusMessage("✅ Diary saved with AI insights!");
              } else {
                setStatusMessage("✅ Diary saved with AI insights!");
              }
            } catch {
              setStatusMessage("✅ Diary saved with AI insights!");
            }

            setTimeout(() => setStatusMessage(""), 4000);
          } else {
            setStatusMessage("❌ Failed to save processed diary entry");
            setTimeout(() => setStatusMessage(""), 4000);
          }
        } catch (error) {
          logger.error("Background AI processing error:", error);
          setStatusMessage("❌ AI processing failed");
          setTimeout(() => setStatusMessage(""), 4000);
        }
      })();
    },
    [authUser?.id, loadDiaryEntries, setDefaultDate]
  );

  // Save entry and handle edit mode
  const saveEntry = useCallback(async () => {
    if (!authUser?.id || !selectedDate || !entryText.trim() || !isDateValid) {
      return;
    }

    const entryToSave = entryText.trim();
    const dateToSave = selectedDate;
    const currentEntryId = currentEntry?.id;
    const isEditing = !!currentEntry;

    setIsSaving(true);
    setStatusMessage("Saving...");
    setError(""); // Clear any previous errors

    // 🚀 EXIT EDITOR IMMEDIATELY - Clear form first
    if (isEditing) {
      setCurrentEntry(null);
      setEntryText("");
      setError("");
      setStatusMessage("");
      setIsDateValid(true);
      await setDefaultDate();
    } else {
      setEntryText("");
      setError("");
      setStatusMessage("");
      await setDefaultDate();
    }
    setIsSaving(false);

    // 🎯 Use encapsulated AI pipeline
    await processDiaryEntryWithAI(
      entryToSave,
      dateToSave,
      currentEntryId,
      isEditing
    );
  }, [
    authUser?.id,
    selectedDate,
    entryText,
    isDateValid,
    currentEntry,
    setDefaultDate,
    processDiaryEntryWithAI,
  ]);

  // Voice mode submission handler (empty implementation for now)
  const handleVoiceSubmission = useCallback(
    async (transcribedText: string) => {
      if (
        !authUser?.id ||
        !selectedDate ||
        !transcribedText.trim() ||
        !isDateValid
      ) {
        return;
      }

      // 🎯 Use encapsulated AI pipeline (same as type mode)
      await processDiaryEntryWithAI(transcribedText, selectedDate);
    },
    [authUser?.id, selectedDate, isDateValid, processDiaryEntryWithAI]
  );

  // Edit an existing entry
  const editEntry = (entry: Log) => {
    setCurrentEntry(entry);
    setEntryText(entry.diaryEntry);
    // Force type mode when editing
    setIsVoiceMode(false);
    // Fix timezone issue: format date properly for input
    const year = entry.date.getFullYear();
    const month = String(entry.date.getMonth() + 1).padStart(2, "0");
    const day = String(entry.date.getDate()).padStart(2, "0");
    setSelectedDate(`${year}-${month}-${day}`);
    setError("");
    setStatusMessage("");
    setIsDateValid(true);

    // Start scrolling immediately, no delay
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });

    // Focus the textarea after a short delay to let the form update
    setTimeout(() => {
      const textarea = document.querySelector("textarea");
      if (textarea) {
        textarea.focus();
        // Move cursor to end of text
        textarea.setSelectionRange(
          textarea.value.length,
          textarea.value.length
        );
      }
    }, 200);
  };

  // Cancel editing
  const cancelEdit = async () => {
    // Set canceling flag to prevent validation
    setIsCanceling(true);
    // Clear everything immediately to prevent validation flash
    setCurrentEntry(null);
    setEntryText("");
    setError("");
    setStatusMessage("");
    setIsDateValid(true);
    // Reset to voice mode when not editing
    setIsVoiceMode(false);
    // Set default date last to avoid validation trigger
    await setDefaultDate();
    // Clear canceling flag
    setIsCanceling(false);
  };

  // Delete entry
  const deleteEntry = async (entryId: string) => {
    if (!window.confirm("Are you sure you want to delete this diary entry?")) {
      return;
    }

    try {
      const success = await DatabaseService.deleteDiaryEntry(entryId);
      if (success) {
        // Reload entries to show updated list
        await loadDiaryEntries();

        // Update default date after entries are reloaded
        // If we were editing this entry, clear the form and find new default date
        if (currentEntry?.id === entryId) {
          await cancelEdit();
        } else {
          // Even if we weren't editing the deleted entry, refresh the default date
          // Force starting from today to pick up the newly available date
          await setDefaultDate();
        }

        // 🚀 REGENERATE FEATURED WORKOUTS CACHE after deletion
        try {
          const freshDiaryEntries = await DatabaseService.loadDiaryEntries(
            authUser!.id
          );

          // Clear cache since data changed
          await DatabaseService.clearFeaturedWorkoutsCache(authUser!.id);

          // Generate new cache if there are still entries
          if (freshDiaryEntries.length > 0) {
            const response = await fetch("/api/featured-workouts", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                userId: authUser!.id,
                diaryEntries: freshDiaryEntries,
                regenerateCache: true,
              }),
            });

            if (response.ok) {
              const data = await response.json();
              await DatabaseService.saveFeaturedWorkoutsCache(
                authUser!.id,
                data.suggestions || [],
                data.featuredWorkouts || [],
                freshDiaryEntries
              );
            }
          }
        } catch {
          // Cache regeneration failed (non-critical)
        }
      } else {
        setError("Failed to delete diary entry.");
      }
    } catch (error) {
      logger.error("Error deleting entry:", error);
      setError("An error occurred while deleting the entry.");
    }
  };

  // Initial load
  useEffect(() => {
    const initializePage = async () => {
      if (authUser?.id) {
        // First load diary entries, then set default date
        await loadDiaryEntries();
        await setDefaultDate();
      }
    };

    initializePage();
  }, [authUser?.id, loadDiaryEntries, setDefaultDate]);

  // Validate date when it changes
  useEffect(() => {
    // Don't validate while saving, or if we're canceling edit (no currentEntry but entryText is empty)
    if (selectedDate && !isSaving && !isCanceling) {
      validateDate(selectedDate, currentEntry?.id);
    }
  }, [selectedDate, validateDate, currentEntry?.id, isSaving, isCanceling]);

  if (!authUser) {
    return (
      <div className="p-10 px-4 bg-background min-h-screen">
        <div className="text-center py-8 text-destructive">
          Please log in to access your diary.
        </div>
      </div>
    );
  }

  return (
    <div className="p-10 px-4 bg-background min-h-screen w-[85%] mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-foreground mb-4">
          📝 My Fitness Diary
        </h1>
        <p className="text-xl text-muted-foreground">
          Track your fitness journey one entry at a time
        </p>
      </div>

      {/* Entry Form */}
      <div className="bg-card backdrop-blur-xl border border-border rounded-2xl shadow-lg p-6 mb-8">
        {/* Voice/Type Toggle */}
        <div className="flex justify-center mb-6">
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setIsVoiceMode(false)}
              className={`flex items-center px-4 py-2 rounded-md text-sm transition-colors ${
                !isVoiceMode
                  ? "bg-background text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={!!currentEntry}
            >
              <IconKeyboard size={16} className="mr-2" />
              Type Mode
            </button>
            <button
              onClick={() => setIsVoiceMode(true)}
              className={`flex items-center px-4 py-2 rounded-md text-sm transition-colors ${
                isVoiceMode
                  ? "bg-background text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
              disabled={!!currentEntry}
            >
              <IconMicrophone size={16} className="mr-2" />
              Voice Mode
            </button>
          </div>
        </div>

        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-foreground">
            {currentEntry ? "Edit Diary Entry" : "New Diary Entry"}
          </h2>
          {currentEntry && (
            <button
              onClick={cancelEdit}
              className="px-4 py-2 text-sm font-medium bg-muted text-muted-foreground hover:bg-muted/80 rounded-lg transition-colors"
            >
              Cancel Edit
            </button>
          )}
        </div>

        {/* Date Picker */}
        <div className="mb-6">
          <label
            htmlFor="entry-date"
            className="block text-sm font-medium text-foreground mb-2"
          >
            Date:
          </label>
          <input
            id="entry-date"
            type="date"
            value={selectedDate}
            onChange={(e) => handleDateChange(e.target.value)}
            max={(() => {
              const today = new Date();
              const year = today.getFullYear();
              const month = String(today.getMonth() + 1).padStart(2, "0");
              const day = String(today.getDate()).padStart(2, "0");
              return `${year}-${month}-${day}`;
            })()}
            className={`max-w-36 text-sm px-3 py-4 rounded-lg font-semibold bg-foreground/7 focus:outline-none focus:ring-2 focus:border-transparent ${
              !isDateValid ? "focus:ring-destructive" : "focus:ring-primary"
            }`}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
            {error}
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className="mb-4 p-3 bg-primary/10 border border-primary/20 rounded-lg text-primary text-sm">
            {statusMessage}
          </div>
        )}

        {/* Voice Recorder or Text Area */}
        {isDateValid ? (
          isVoiceMode ? (
            <VoiceRecorder onSubmit={handleVoiceSubmission} />
          ) : (
            <>
              <div className="mb-6">
                <textarea
                  placeholder="Write about your fitness activities, how you felt, any insights..."
                  value={entryText}
                  onChange={(e) => setEntryText(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-foreground bg-background focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  rows={8}
                />

                <div className="flex justify-end mt-2">
                  <span className="text-sm text-muted-foreground">
                    {entryText.length} characters
                  </span>
                </div>
              </div>

              {/* Save Button - Only for Type Mode */}
              <button
                onClick={saveEntry}
                disabled={!entryText.trim() || isSaving}
                className={`w-40 px-6 py-3 rounded-lg font-medium transition-colors ${
                  !entryText.trim() || isSaving
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                {isSaving
                  ? "Saving..."
                  : currentEntry
                  ? "Update Entry"
                  : "Save Entry"}
              </button>
            </>
          )
        ) : null}
      </div>

      {/* Entries List */}
      <div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6 gap-4">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            Previous Entries ({diaryEntries.length})
          </h1>

          {/* View Toggle */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("diary")}
              className={`flex items-center px-4 py-2 rounded-md text-sm transition-colors ${
                viewMode === "diary"
                  ? "bg-background text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconFileText size={16} className="mr-2" />
              Diary View
            </button>
            <button
              onClick={() => setViewMode("summary")}
              className={`flex items-center px-4 py-2 rounded-md text-sm transition-colors ${
                viewMode === "summary"
                  ? "bg-background text-foreground font-bold shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <IconChartBar size={16} className="mr-2" />
              Summary View
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Loading your diary entries...
          </div>
        ) : diaryEntries.length > 0 ? (
          <div className="space-y-6">
            {diaryEntries.map((entry) => (
              <div
                key={entry.id}
                className="bg-background border border-border rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-[650] text-foreground">
                    {formatDate(entry.date)}
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={() => editEntry(entry)}
                      className="px-3 py-1 text-sm font-semibold text-primary bg-primary/30 hover:bg-primary/45 rounded-lg transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className="px-3 py-1 text-sm font-semibold text-red-700 dark:text-red-200 bg-red-400/20 hover:bg-red-400/35 rounded-lg transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Diary View - Show original text */}
                {viewMode === "diary" && (
                  <div className="mb-4">
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between w-full">
                        <h4 className="font-bold text-foreground">
                          📝 Original Diary:
                        </h4>
                        {entry.diaryEntry.length > 200 && (
                          <button
                            onClick={() => toggleEntryExpansion(entry.id)}
                            className="text-sm font-semibold bg-primary/20 hover:text-primary rounded-md px-3 py-1 flex items-center gap-2"
                          >
                            <IconSelector size={16} />
                            {expandedEntries.has(entry.id)
                              ? "Show Less"
                              : "View Full Entry"}
                          </button>
                        )}
                      </div>
                      <div>
                        {expandedEntries.has(entry.id) ||
                        entry.diaryEntry.length <= 200 ? (
                          <p className="px-8 mt-2 text-foreground/90 leading-relaxed font-normal">
                            {entry.diaryEntry}
                          </p>
                        ) : (
                          <p className="px-8 mt-2 text-foreground/80 leading-relaxed font-normal">
                            {entry.diaryEntry.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary View - Show AI-processed data */}
                {viewMode === "summary" && (
                  <div className="space-y-6">
                    {/* Workouts Section */}
                    {entry.workouts && entry.workouts.length > 0 && (
                      <div className="space-y-3">
                        <h3 className="font-semibold text-lg">Workouts</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
                          {entry.workouts.map((workout) => (
                            <div
                              key={workout.id}
                              className="bg-muted/30 border border-border rounded-lg p-3 shadow-sm"
                            >
                              <div className="font-medium text-foreground mb-2">
                                {workout.name}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {workout.isDurationBased && (
                                  <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2 py-1 rounded-full">
                                    ⏱️ {workout.durationMinutes} min
                                  </span>
                                )}
                                {workout.isSetsBased && (
                                  <>
                                    <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2 py-1 rounded-full">
                                      🔄 {workout.sets} sets
                                    </span>
                                    {workout.reps && (
                                      <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2 py-1 rounded-full">
                                        ↗️ {workout.reps} reps
                                      </span>
                                    )}
                                    {workout.weight && (
                                      <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2 py-1 rounded-full">
                                        🏋️ {workout.weight}kg
                                      </span>
                                    )}
                                  </>
                                )}
                                <span className="text-xs font-bold bg-blue-100 text-blue-900 px-2 py-1 rounded-full">
                                  🔥{" "}
                                  {(() => {
                                    const cal = workout.calories;
                                    if (
                                      typeof cal === "number" &&
                                      !isNaN(cal) &&
                                      cal > 0
                                    ) {
                                      return cal;
                                    }
                                    return 200; // Fallback
                                  })()}{" "}
                                  cal
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Injuries Section */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">Injuries & Pain</h3>
                      {entry.injuries && entry.injuries.length > 0 ? (
                        <ul className="space-y-2">
                          {entry.injuries.map((injury, index) => (
                            <li
                              key={index}
                              className="pl-4 border-l-4 border-red-400 bg-red-400/20 p-2"
                            >
                              {injury}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="bg-green-400/20 border-l-4 border-green-500 pl-4 p-2">
                          ✅ No injuries reported
                        </p>
                      )}
                    </div>

                    {/* Suggestions Section */}
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg">AI Suggestions</h3>
                      {entry.suggestions &&
                      Array.isArray(entry.suggestions) &&
                      entry.suggestions.length > 0 ? (
                        <div className="space-y-2">
                          {entry.suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="bg-primary/20 border-l-4 border-primary pl-4 p-2"
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="bg-blue-400/20 border-l-4 border-blue-500 p-2">
                          💭 No suggestions available
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <p>
              No diary entries yet. Start by writing your first entry above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
