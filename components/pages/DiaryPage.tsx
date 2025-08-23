"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../auth/AuthProvider";
import DatabaseService from "../../services/DatabaseService";
import { Log, Workout } from "../../models/User";
import styles from "./DiaryPage.module.css";
import VoiceRecorder from "../voice/VoiceRecorder";
import {
  IconKeyboard,
  IconMicrophone,
  IconFileText,
  IconChartBar,
} from "@tabler/icons-react";

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
      console.log(`📚 Loaded ${entries.length} diary entries`);
    } catch (error) {
      console.error("Error loading diary entries:", error);
      setError("Failed to load diary entries");
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.id]);

  // Find nearest available date and set as default
  const setDefaultDate = useCallback(
    async (forceToday: boolean = false) => {
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
        console.error("Error finding available date:", error);
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, "0");
        const day = String(today.getDate()).padStart(2, "0");
        setSelectedDate(`${year}-${month}-${day}`);
      }
    },
    [authUser?.id]
  );

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
          logData.workouts.forEach((workoutData: any) => {
            const workout = new Workout(
              workoutData.id,
              workoutData.name,
              new Date(workoutData.date),
              {
                durationMinutes: workoutData.durationMinutes,
                sets: workoutData.sets,
                reps: workoutData.reps,
                weight: workoutData.weight,
                calories: workoutData.calories || 200,
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
            } catch (cacheError) {
              setStatusMessage("✅ Diary saved with AI insights!");
            }

            setTimeout(() => setStatusMessage(""), 4000);
          } else {
            setStatusMessage("❌ Failed to save processed diary entry");
            setTimeout(() => setStatusMessage(""), 4000);
          }
        } catch (error) {
          console.error("Background AI processing error:", error);
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
          await setDefaultDate(true);
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
        } catch (cacheError) {
          // Cache regeneration failed (non-critical)
        }
      } else {
        setError("Failed to delete diary entry.");
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
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
      <div className={styles.container}>
        <div className={styles.error}>Please log in to access your diary.</div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>📝 My Fitness Diary</h1>
        <p className={styles.subtitle}>
          Track your fitness journey one entry at a time
        </p>
      </div>

      {/* Entry Form */}
      <div className={styles.entryForm}>
        {/* Voice/Type Toggle */}
        <div className="flex justify-center mb-4">
          <div className={styles.viewToggle}>
            <button
              onClick={() => setIsVoiceMode(false)}
              className={`${styles.toggleButton} ${
                !isVoiceMode ? styles.toggleButtonActive : ""
              }`}
              disabled={!!currentEntry}
            >
              <IconKeyboard size={16} className="mr-2" />
              Type Mode
            </button>
            <button
              onClick={() => setIsVoiceMode(true)}
              className={`${styles.toggleButton} ${
                isVoiceMode ? styles.toggleButtonActive : ""
              }`}
              disabled={!!currentEntry}
            >
              <IconMicrophone size={16} className="mr-2" />
              Voice Mode
            </button>
          </div>
        </div>

        <div className={styles.formHeader}>
          <h2>{currentEntry ? "Edit Diary Entry" : "New Diary Entry"}</h2>
          {currentEntry && (
            <button onClick={cancelEdit} className={styles.cancelButton}>
              Cancel Edit
            </button>
          )}
        </div>

        {/* Date Picker */}
        <div className={styles.dateSection}>
          <label htmlFor="entry-date" className={styles.dateLabel}>
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
            className={`${styles.dateInput} ${
              !isDateValid ? styles.dateInputError : ""
            }`}
          />
        </div>

        {/* Error Message */}
        {error && <div className={styles.error}>{error}</div>}

        {/* Status Message */}
        {statusMessage && (
          <div className={styles.statusMessage}>{statusMessage}</div>
        )}

        {/* Voice Recorder or Text Area */}
        {isVoiceMode ? (
          <VoiceRecorder
            onTextChange={setEntryText}
            currentText={entryText}
            onSubmit={handleVoiceSubmission}
          />
        ) : (
          <>
            <div className={styles.textSection}>
              <textarea
                placeholder="Write about your fitness activities, how you felt, any insights..."
                value={entryText}
                onChange={(e) => setEntryText(e.target.value)}
                className={styles.textArea}
                rows={8}
              />

              <div className={styles.textMeta}>
                <span className={styles.charCount}>
                  {entryText.length} characters
                </span>
              </div>
            </div>

            {/* Save Button - Only for Type Mode */}
            <button
              onClick={saveEntry}
              disabled={!entryText.trim() || !isDateValid || isSaving}
              className={`${styles.saveButton} ${
                !entryText.trim() || !isDateValid
                  ? styles.saveButtonDisabled
                  : ""
              }`}
            >
              {isSaving
                ? "Saving..."
                : currentEntry
                ? "Update Entry"
                : "Save Entry"}
            </button>
          </>
        )}
      </div>

      {/* Entries List */}
      <div className={styles.entriesList}>
        <div className={styles.entriesHeader}>
          <h2 className={styles.entriesTitle}>
            Previous Entries ({diaryEntries.length})
          </h2>

          {/* View Toggle */}
          <div className={styles.viewToggle}>
            <button
              onClick={() => setViewMode("diary")}
              className={`${styles.toggleButton} ${
                viewMode === "diary" ? styles.toggleButtonActive : ""
              }`}
            >
              <IconFileText size={16} className="mr-2" />
              Diary View
            </button>
            <button
              onClick={() => setViewMode("summary")}
              className={`${styles.toggleButton} ${
                viewMode === "summary" ? styles.toggleButtonActive : ""
              }`}
            >
              <IconChartBar size={16} className="mr-2" />
              Summary View
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className={styles.loading}>Loading your diary entries...</div>
        ) : diaryEntries.length > 0 ? (
          <div className={styles.entriesContainer}>
            {diaryEntries.map((entry) => (
              <div key={entry.id} className={styles.entryCard}>
                <div className={styles.entryHeader}>
                  <h3 className={styles.entryDate}>{formatDate(entry.date)}</h3>
                  <div className={styles.entryActions}>
                    <button
                      onClick={() => editEntry(entry)}
                      className={styles.editButton}
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => deleteEntry(entry.id)}
                      className={styles.deleteButton}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Diary View - Show original text */}
                {viewMode === "diary" && (
                  <div className={styles.entryContent}>
                    <div className={styles.diaryText}>
                      <div className={styles.diaryHeader}>
                        <h4>📝 Original Entry:</h4>
                        {entry.diaryEntry.length > 200 && (
                          <button
                            onClick={() => toggleEntryExpansion(entry.id)}
                            className={styles.expandButton}
                          >
                            {expandedEntries.has(entry.id)
                              ? "Show Less"
                              : "View Full Entry"}
                          </button>
                        )}
                      </div>
                      <div className={styles.diaryContent}>
                        {expandedEntries.has(entry.id) ||
                        entry.diaryEntry.length <= 200 ? (
                          <p className={styles.diaryFullText}>
                            {entry.diaryEntry}
                          </p>
                        ) : (
                          <p className={styles.diaryTruncated}>
                            {entry.diaryEntry.substring(0, 200)}...
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Summary View - Show AI-processed data */}
                {viewMode === "summary" && (
                  <div className={styles.summaryContent}>
                    {/* Workouts Section */}
                    {entry.workouts && entry.workouts.length > 0 && (
                      <div className={styles.workoutsSection}>
                        <h4 className={styles.sectionTitle}>💪 Workouts</h4>
                        <div className={styles.workoutsGrid}>
                          {entry.workouts.map((workout) => (
                            <div
                              key={workout.id}
                              className={styles.workoutCard}
                            >
                              <div className={styles.workoutName}>
                                {workout.name}
                              </div>
                              <div className={styles.workoutDetails}>
                                {workout.isDurationBased && (
                                  <span className={styles.workoutStat}>
                                    ⏱️ {workout.durationMinutes} min
                                  </span>
                                )}
                                {workout.isSetsBased && (
                                  <>
                                    <span className={styles.workoutStat}>
                                      🔄 {workout.sets} sets
                                    </span>
                                    {workout.reps && (
                                      <span className={styles.workoutStat}>
                                        ↗️ {workout.reps} reps
                                      </span>
                                    )}
                                    {workout.weight && (
                                      <span className={styles.workoutStat}>
                                        🏋️ {workout.weight}kg
                                      </span>
                                    )}
                                  </>
                                )}
                                <span className={styles.workoutStat}>
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
                    <div className={styles.injuriesSection}>
                      <h4 className={styles.sectionTitle}>
                        🩹 Injuries & Pain
                      </h4>
                      {entry.injuries && entry.injuries.length > 0 ? (
                        <ul className={styles.injuriesList}>
                          {entry.injuries.map((injury, index) => (
                            <li key={index} className={styles.injuryItem}>
                              {injury}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className={styles.noInjuries}>
                          ✅ No injuries reported
                        </p>
                      )}
                    </div>

                    {/* Suggestions Section */}
                    <div className={styles.suggestionsSection}>
                      <h4 className={styles.sectionTitle}>💡 AI Suggestions</h4>
                      {entry.suggestions &&
                      Array.isArray(entry.suggestions) &&
                      entry.suggestions.length > 0 ? (
                        <div className={styles.suggestionsList}>
                          {entry.suggestions.map((suggestion, index) => (
                            <div key={index} className={styles.suggestionItem}>
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className={styles.noSuggestions}>
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
          <div className={styles.emptyState}>
            <p>
              No diary entries yet. Start by writing your first entry above!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
