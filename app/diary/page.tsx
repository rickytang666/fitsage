'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

// Define interfaces for diary entries
interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  mood: string;
  workoutCompleted: boolean;
  nutritionTracked: boolean;
  aiAnalysis?: {
    insights: string[];
    suggestions: string[];
  };
}

export default function DiaryPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedEntry, setSelectedEntry] = useState<DiaryEntry | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // New entry form state
  const [newEntry, setNewEntry] = useState({
    title: '',
    content: '',
    mood: 'happy',
    workoutCompleted: false,
    nutritionTracked: false
  });

  // Simulate fetching diary entries
  useEffect(() => {
    const fetchEntries = async () => {
      try {
        // In a real app, this would be an API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        setEntries([
          {
            id: '1',
            date: '2025-05-16',
            title: 'Productive Day',
            content: 'Had a great workout and met my calorie goals. Feeling motivated!',
            mood: 'happy',
            workoutCompleted: true,
            nutritionTracked: true,
            aiAnalysis: {
              insights: [
                'You had a successful workout session',
                'You maintained your nutritional goals',
                'Your mood is positive and motivated'
              ],
              suggestions: [
                'Continue your current workout routine',
                'Maintain your nutritional balance',
                'Build on today\'s positivity for tomorrow'
              ]
            }
          },
          {
            id: '2',
            date: '2025-05-15',
            title: 'Rest Day',
            content: 'Took a rest day today. Focused on stretching and recovery.',
            mood: 'neutral',
            workoutCompleted: false,
            nutritionTracked: true
          },
          {
            id: '3',
            date: '2025-05-14',
            title: 'Challenging Workout',
            content: 'Push day was tough but rewarding. Increased weight on bench press.',
            mood: 'energized',
            workoutCompleted: true,
            nutritionTracked: false,
            aiAnalysis: {
              insights: [
                'You pushed yourself during your workout',
                'You made progress in your bench press',
                'You felt accomplished after the challenge'
              ],
              suggestions: [
                'Ensure proper recovery after intense sessions',
                'Track your progress on the bench press',
                'Balance challenging workouts with adequate rest'
              ]
            }
          }
        ]);
        
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching diary entries:', err);
        setError('Failed to load diary entries. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchEntries();
  }, []);

  // Get entry for selected date
  const getEntryForDate = (date: string) => {
    return entries.find(entry => entry.date === date) || null;
  };

  // Update selected entry when date changes
  useEffect(() => {
    if (selectedDate) {
      const entry = getEntryForDate(selectedDate);
      setSelectedEntry(entry);
      if (entry) {
        setIsCreating(false);
      }
    }
  }, [selectedDate, entries]);

  // Handle creating a new entry
  const handleCreateEntry = async (e: FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      // In a real app, this would be an API call to save the entry
      // and generate AI insights
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create new entry with mock AI analysis
      const newId = Math.random().toString(36).substring(2, 9);
      const aiAnalyzedEntry: DiaryEntry = {
        id: newId,
        date: selectedDate,
        title: newEntry.title,
        content: newEntry.content,
        mood: newEntry.mood,
        workoutCompleted: newEntry.workoutCompleted,
        nutritionTracked: newEntry.nutritionTracked,
        aiAnalysis: {
          insights: [
            'You have a positive outlook on your fitness journey',
            'You are tracking your progress consistently',
            newEntry.workoutCompleted ? 'You completed a workout today' : 'You took a rest day today'
          ],
          suggestions: [
            'Keep maintaining your current routine',
            'Consider adding variety to your workouts',
            'Focus on consistency rather than intensity'
          ]
        }
      };
      
      // Add to entries
      setEntries(prev => [aiAnalyzedEntry, ...prev]);
      setSelectedEntry(aiAnalyzedEntry);
      setIsCreating(false);
      
      // Reset form
      setNewEntry({
        title: '',
        content: '',
        mood: 'happy',
        workoutCompleted: false,
        nutritionTracked: false
      });
    } catch (err) {
      console.error('Error creating entry:', err);
      setError('Failed to create entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Fitness Diary</h1>
        <div className="mt-6 bg-white shadow rounded-lg animate-pulse">
          <div className="p-8 h-96"></div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Fitness Diary</h1>
        <div className="mt-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
              <div className="mt-4">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-red-700 bg-red-100 hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  Retry
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold text-gray-900">Fitness Diary</h1>
        <button
          onClick={() => {
            setIsCreating(!isCreating);
            if (isCreating) {
              setSelectedEntry(getEntryForDate(selectedDate));
            } else {
              setSelectedEntry(null);
            }
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          {isCreating ? 'Cancel' : 'Add Entry'}
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sidebar with date picker and entry list */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6">
            <div className="mb-6">
              <label htmlFor="date-select" className="block text-sm font-medium text-gray-700 mb-1">
                Select Date
              </label>
              <input 
                id="date-select"
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="block w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500 border-gray-300"
              />
            </div>
            
            <h3 className="font-medium text-gray-900 mb-4">Recent Entries</h3>
            {entries.length > 0 ? (
              <ul className="space-y-3">
                {entries.map((entry) => (
                  <li key={entry.id}>
                    <button
                      onClick={() => {
                        setSelectedDate(entry.date);
                        setSelectedEntry(entry);
                        setIsCreating(false);
                      }}
                      className={`block w-full text-left px-3 py-2 rounded-md ${
                        selectedEntry?.id === entry.id
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium truncate">{entry.title}</span>
                        <span className="text-xs text-gray-500">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">{entry.content.substring(0, 60)}...</p>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p>No entries yet. Start journaling today!</p>
              </div>
            )}
          </div>
        </div>
        
        {/* Main content area */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6">
            {isCreating ? (
              /* New Entry Form */
              <div>
                <h2 className="text-xl font-medium text-gray-900 mb-4">New Diary Entry</h2>
                {isSaving ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mb-4"></div>
                    <p className="text-gray-600">Analyzing your entry with AI...</p>
                  </div>
                ) : (
                  <form onSubmit={handleCreateEntry}>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                          Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          value={newEntry.title}
                          onChange={(e) => setNewEntry({...newEntry, title: e.target.value})}
                          required
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-700">
                          Entry Content
                        </label>
                        <textarea
                          id="content"
                          rows={6}
                          value={newEntry.content}
                          onChange={(e) => setNewEntry({...newEntry, content: e.target.value})}
                          required
                          placeholder="Write about your day, workouts, nutrition, and how you're feeling..."
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        ></textarea>
                      </div>
                      
                      <div>
                        <label htmlFor="mood" className="block text-sm font-medium text-gray-700">
                          Mood
                        </label>
                        <select
                          id="mood"
                          value={newEntry.mood}
                          onChange={(e) => setNewEntry({...newEntry, mood: e.target.value})}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                        >
                          <option value="happy">Happy</option>
                          <option value="energized">Energized</option>
                          <option value="neutral">Neutral</option>
                          <option value="tired">Tired</option>
                          <option value="sore">Sore</option>
                          <option value="stressed">Stressed</option>
                        </select>
                      </div>
                      
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div className="flex items-center">
                          <input
                            id="workout-completed"
                            type="checkbox"
                            checked={newEntry.workoutCompleted}
                            onChange={(e) => setNewEntry({...newEntry, workoutCompleted: e.target.checked})}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="workout-completed" className="ml-2 block text-sm text-gray-700">
                            I completed a workout today
                          </label>
                        </div>
                        
                        <div className="flex items-center">
                          <input
                            id="nutrition-tracked"
                            type="checkbox"
                            checked={newEntry.nutritionTracked}
                            onChange={(e) => setNewEntry({...newEntry, nutritionTracked: e.target.checked})}
                            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                          />
                          <label htmlFor="nutrition-tracked" className="ml-2 block text-sm text-gray-700">
                            I tracked my nutrition today
                          </label>
                        </div>
                      </div>
                      
                      <div className="flex justify-end">
                        <button
                          type="submit"
                          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                          Save Entry & Analyze
                        </button>
                      </div>
                    </div>
                  </form>
                )}
              </div>
            ) : selectedEntry ? (
              /* Entry View */
              <div>
                <div className="mb-4 flex justify-between items-start">
                  <div>
                    <h2 className="text-xl font-medium text-gray-900">{selectedEntry.title}</h2>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedEntry.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    {selectedEntry.workoutCompleted && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Workout Completed
                      </span>
                    )}
                    {selectedEntry.nutritionTracked && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Nutrition Tracked
                      </span>
                    )}
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 capitalize">
                      {selectedEntry.mood}
                    </span>
                  </div>
                </div>
                
                <div className="prose prose-indigo max-w-none mb-8">
                  <p className="text-gray-700 whitespace-pre-line">{selectedEntry.content}</p>
                </div>
                
                {selectedEntry.aiAnalysis && (
                  <div className="bg-indigo-50 rounded-lg p-4 mb-4">
                    <h3 className="font-medium text-indigo-800 mb-2">AI Insights</h3>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-indigo-600 mb-1">Observations</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {selectedEntry.aiAnalysis.insights.map((insight, index) => (
                          <li key={index}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-indigo-600 mb-1">Suggestions</h4>
                      <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                        {selectedEntry.aiAnalysis.suggestions.map((suggestion, index) => (
                          <li key={index}>{suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* No entry selected for this date */
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">No entry for this date</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Get started by creating a new diary entry for this date.
                </p>
                <div className="mt-6">
                  <button
                    onClick={() => setIsCreating(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    Create New Entry
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
