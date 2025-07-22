'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../auth/AuthProvider';
import DatabaseService from '../../services/DatabaseService';
import { Log } from '../../models/User';
import styles from './DiaryPage.module.css';

export default function DiaryPage() {
  const { user: authUser } = useAuth();
  const [diaryEntries, setDiaryEntries] = useState<Log[]>([]);
  const [currentEntry, setCurrentEntry] = useState<Log | null>(null);
  const [entryText, setEntryText] = useState('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string>('');
  const [isDateValid, setIsDateValid] = useState(true);

  // Generate a simple ID
  const generateId = () => `diary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Format date for display (fix timezone issues)
  const formatDate = (date: Date): string => {
    // Create a new date using the date components to avoid timezone issues
    const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return localDate.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Load all diary entries
  const loadDiaryEntries = useCallback(async () => {
    if (!authUser?.id) return;
    
    setIsLoading(true);
    try {
      const entries = await DatabaseService.loadDiaryEntries(authUser.id);
      setDiaryEntries(entries);
    } catch (error) {
      console.error('Error loading diary entries:', error);
      setError('Failed to load diary entries');
    } finally {
      setIsLoading(false);
    }
  }, [authUser?.id]);

  // Find nearest available date and set as default
  const setDefaultDate = useCallback(async (forceToday: boolean = false) => {
    if (!authUser?.id) return;
    
    try {
      // When forceToday is true (like after deletion), start from today
      const startDate = forceToday ? new Date() : undefined;
      const availableDate = await DatabaseService.findNearestAvailableDate(authUser.id, startDate);
      // Fix timezone issue: format date properly for input
      const year = availableDate.getFullYear();
      const month = String(availableDate.getMonth() + 1).padStart(2, '0');
      const day = String(availableDate.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    } catch (error) {
      console.error('Error finding available date:', error);
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      setSelectedDate(`${year}-${month}-${day}`);
    }
  }, [authUser?.id]);

  // Validate selected date
  const validateDate = useCallback(async (dateStr: string, excludeEntryId?: string) => {
    if (!authUser?.id || !dateStr) return false;

    const selectedDateObj = new Date(dateStr);
    const today = new Date();
    
    // Check if future date
    if (selectedDateObj > today) {
      setError('Cannot create entries for future dates');
      setIsDateValid(false);
      return false;
    }

    // Check if date is available
    const isAvailable = await DatabaseService.isDateAvailable(authUser.id, selectedDateObj, excludeEntryId);
    if (!isAvailable) {
      setError('This date already has an entry. Choose a different date.');
      setIsDateValid(false);
      return false;
    }

    setError('');
    setIsDateValid(true);
    return true;
  }, [authUser?.id]);

  // Handle date change
  const handleDateChange = async (dateStr: string) => {
    setSelectedDate(dateStr);
    
    if (dateStr) {
      await validateDate(dateStr, currentEntry?.id);
    }
  };

  // Save entry and handle edit mode
  const saveEntry = useCallback(async () => {
    if (!authUser?.id || !selectedDate || !entryText.trim() || !isDateValid) {
      return;
    }

    setIsSaving(true);
    try {
      const entryId = currentEntry?.id || generateId();
      const success = await DatabaseService.saveDiaryEntry(
        authUser.id,
        entryId,
        entryText.trim(),
        new Date(selectedDate)
      );

      if (success) {
        // Reload entries to show updated list
        await loadDiaryEntries();
        
        // If editing, exit edit mode; if new entry, clear form
        if (currentEntry) {
          // Exit edit mode - clear everything first to avoid validation flash
          setCurrentEntry(null);
          setEntryText('');
          setError(''); // Clear any errors
          setIsDateValid(true); // Reset validation state
          await setDefaultDate(); // Find next available date
        } else {
          // Clear new entry form
          setEntryText('');
          setError(''); // Clear any errors
          await setDefaultDate(); // Find next available date
        }
        
        setError('');
      } else {
        setError('Failed to save diary entry. Please try again.');
      }
    } catch (error) {
      console.error('Error saving entry:', error);
      setError('An error occurred while saving the entry.');
    } finally {
      setIsSaving(false);
    }
  }, [authUser?.id, selectedDate, entryText, isDateValid, currentEntry, loadDiaryEntries, setDefaultDate]);

  // Edit an existing entry
  const editEntry = (entry: Log) => {
    setCurrentEntry(entry);
    setEntryText(entry.diaryEntry);
    // Fix timezone issue: format date properly for input
    const year = entry.date.getFullYear();
    const month = String(entry.date.getMonth() + 1).padStart(2, '0');
    const day = String(entry.date.getDate()).padStart(2, '0');
    setSelectedDate(`${year}-${month}-${day}`);
    setError('');
    setIsDateValid(true);
    
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Cancel editing
  const cancelEdit = async () => {
    setCurrentEntry(null);
    setEntryText('');
    setError('');
    await setDefaultDate();
  };

  // Delete entry
  const deleteEntry = async (entryId: string) => {
    if (!window.confirm('Are you sure you want to delete this diary entry?')) {
      return;
    }

    try {
      const success = await DatabaseService.deleteDiaryEntry(entryId);
      if (success) {
        // Reload entries to show updated list
        await loadDiaryEntries();
        
        // Small delay to ensure database changes are reflected
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // If we were editing this entry, clear the form and find new default date
        if (currentEntry?.id === entryId) {
          await cancelEdit();
        } else {
          // Even if we weren't editing the deleted entry, refresh the default date
          // Force starting from today to pick up the newly available date
          await setDefaultDate(true);
        }
      } else {
        setError('Failed to delete diary entry.');
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      setError('An error occurred while deleting the entry.');
    }
  };

  // Auto-save when text changes (debounced) - REMOVED
  // No more auto-save functionality - only save when user clicks save/update button

  // Initial load
  useEffect(() => {
    if (authUser?.id) {
      loadDiaryEntries();
      setDefaultDate();
    }
  }, [authUser?.id, loadDiaryEntries, setDefaultDate]);

  // Validate date when it changes
  useEffect(() => {
    if (selectedDate && !isSaving) { // Don't validate while saving
      validateDate(selectedDate, currentEntry?.id);
    }
  }, [selectedDate, validateDate, currentEntry?.id, isSaving]);

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
        <p className={styles.subtitle}>Track your fitness journey one entry at a time</p>
      </div>

      {/* Entry Form */}
      <div className={styles.entryForm}>
        <div className={styles.formHeader}>
          <h2>{currentEntry ? 'Edit Diary Entry' : 'New Diary Entry'}</h2>
          {currentEntry && (
            <button 
              onClick={cancelEdit}
              className={styles.cancelButton}
            >
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
              const month = String(today.getMonth() + 1).padStart(2, '0');
              const day = String(today.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            })()}
            className={`${styles.dateInput} ${!isDateValid ? styles.dateInputError : ''}`}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className={styles.error}>
            {error}
          </div>
        )}

        {/* Text Area */}
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

        {/* Save Button */}
        <button
          onClick={saveEntry}
          disabled={!entryText.trim() || !isDateValid || isSaving}
          className={`${styles.saveButton} ${(!entryText.trim() || !isDateValid) ? styles.saveButtonDisabled : ''}`}
        >
          {isSaving ? 'Saving...' : currentEntry ? 'Update Entry' : 'Save Entry'}
        </button>
      </div>

      {/* Entries List */}
      <div className={styles.entriesList}>
        <h2 className={styles.entriesTitle}>
          Previous Entries ({diaryEntries.length})
        </h2>
        
        {isLoading ? (
          <div className={styles.loading}>Loading your diary entries...</div>
        ) : diaryEntries.length > 0 ? (
          <div className={styles.entriesContainer}>
            {diaryEntries.map((entry) => (
              <div key={entry.id} className={styles.entryCard}>
                <div className={styles.entryHeader}>
                  <h3 className={styles.entryDate}>
                    {formatDate(entry.date)}
                  </h3>
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
                
                <div className={styles.entryContent}>
                  <p>{entry.diaryEntry}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p>No diary entries yet. Start by writing your first entry above!</p>
          </div>
        )}
      </div>
    </div>
  );
}
