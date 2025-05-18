'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { useState, useEffect } from 'react';

export default function DiaryPage() {
  const [entry, setEntry] = useState('');
  const [summary, setSummary] = useState<{ exercise: string[], injuries: string[], notes: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState<'summary' | 'diary'>('summary');
  const [currentEntryDate, setCurrentEntryDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [allSummaries, setAllSummaries] = useState<Array<{
    date: string;
    formattedDate: string;
    entry: string;  // Store the original text
    summary: { exercise: string[], injuries: string[], notes: string[] };
  }>>([]);
  const supabase = createClientComponentClient();

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Format date for display
  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch (e) {
      return dateString;
    }
  };

  // Load all summaries from localStorage
  const loadAllSummariesFromLocalStorage = () => {
    const summaries = [];
    // Check all localStorage keys
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      // Ensure key is not null (TypeScript safety)
      if (!key) continue;
      
      if (key.startsWith('diary-summary-')) {
        const date = key.replace('diary-summary-', '');
        try {
          const summaryData = localStorage.getItem(key);
          const entryData = localStorage.getItem(`diary-entry-${date}`);
          
          if (summaryData) {
            const parsedSummary = JSON.parse(summaryData);
            // Only add valid entries (with proper date format)
            if (date && date.match(/^\d{4}-\d{2}-\d{2}$/)) {
              summaries.push({
                date,
                formattedDate: formatDate(date),
                entry: entryData || '', // Include the original entry text
                summary: parsedSummary
              });
            }
          }
        } catch (err) {
          console.error(`Error parsing summary for date ${date}:`, err);
        }
      }
    }
    
    // Ensure proper date sorting (newest first)
    summaries.sort((a, b) => {
      // Convert strings to Date objects for accurate comparison
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      // Sort in descending order (newest first)
      return dateB.getTime() - dateA.getTime();
    });
    
    console.log('Loaded summaries:', summaries);
    return summaries;
  };

  // Load saved summary from localStorage on component mount
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setCurrentEntryDate(today);
    
    // Load user's view preference
    const savedViewMode = localStorage.getItem('diary-view-mode');
    if (savedViewMode === 'diary' || savedViewMode === 'summary') {
      setViewMode(savedViewMode);
    }
    
    // Try to load today's entry from localStorage
    const savedEntry = localStorage.getItem(`diary-entry-${today}`);
    const savedSummary = localStorage.getItem(`diary-summary-${today}`);
    
    if (savedEntry) {
      setEntry(savedEntry);
    }
    
    if (savedSummary) {
      try {
        const parsedSummary = JSON.parse(savedSummary);
        setSummary(parsedSummary);
      } catch (err) {
        console.error('Error parsing saved summary:', err);
      }
    }
    
    // Load all saved summaries
    const loadedSummaries = loadAllSummariesFromLocalStorage();
    setAllSummaries(loadedSummaries);
  }, []);

  const handleSubmit = async () => {
    if (!entry.trim()) {
      alert('Please write a diary entry before submitting.');
      return;
    }
    
    setLoading(true);
    const entryText = entry; // Store the current entry text before clearing
    
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: entryText }),
      });

      const data = await res.json();
      setSummary(data.summary);
      
      // Use the selected date (currentEntryDate) instead of today
      // Save to localStorage using the selected date
      localStorage.setItem(`diary-entry-${currentEntryDate}`, entryText);
      localStorage.setItem(`diary-summary-${currentEntryDate}`, JSON.stringify(data.summary));
      
      // Create a new summary object for the current entry
      const newSummaryItem = {
        date: currentEntryDate,
        formattedDate: formatDate(currentEntryDate),
        entry: entryText, // Include the original entry text
        summary: data.summary
      };
      
      // Update allSummaries state directly
      // First, filter out any existing entry with the same date
      const updatedSummaries = allSummaries.filter(item => item.date !== currentEntryDate);
      // Then add the new entry and sort by date
      updatedSummaries.push(newSummaryItem);
      updatedSummaries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      // Update the state with the new list
      setAllSummaries(updatedSummaries);
    } catch (err) {
      setSummary({
        exercise: [],
        injuries: [],
        notes: ['Error generating summary.']
      });
    } finally {
      setEntry('');
      setLoading(false);
    }
  };


  const renderCategory = (title: string, items: string[], color: string) => {
    if (!items?.length) return null;

    return (
      <div className={`border-l-4 pl-4 py-2 mb-4 bg-${color}-50 border-${color}-400 rounded`}>
        <h3 className={`text-${color}-700 font-semibold mb-2`}>{title}</h3>
        <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
          {items.map((item, idx) => (
            <li key={idx}>{item}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-center mb-8">Fitness Diary</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center mb-4">
          <p className="text-lg font-medium text-gray-900">{currentDate}</p>
          <p className="text-sm text-gray-500 mt-2">AI-Powered Diary Summarizer</p>
        </div>
        
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Select date for this diary entry:
          </label>
          <input
            type="date"
            className="w-full sm:w-auto text-sm border border-gray-300 rounded-md p-2"
            value={currentEntryDate}
            onChange={(e) => {
                const selectedDate = e.target.value;
                setCurrentEntryDate(selectedDate);
                
                // Find in our state first for immediate update
                const existingEntry = allSummaries.find(item => item.date === selectedDate);
                
                if (existingEntry) {
                  setEntry(existingEntry.entry || '');
                  setSummary(existingEntry.summary);
                } else {
                  // Fall back to localStorage if not in state
                  const savedEntry = localStorage.getItem(`diary-entry-${selectedDate}`);
                  const savedSummary = localStorage.getItem(`diary-summary-${selectedDate}`);
                  
                  if (savedEntry) {
                    setEntry(savedEntry);
                  } else {
                    setEntry('');
                  }
                  
                  if (savedSummary) {
                    try {
                      setSummary(JSON.parse(savedSummary));
                    } catch (err) {
                      console.error('Error parsing saved summary:', err);
                      setSummary(null);
                    }
                  } else {
                    setSummary(null);
                  }
                }
              }}
              max={new Date().toISOString().split('T')[0]}
              min="2023-01-01"
            />
        </div>

        <div className="mb-6">
          <textarea
            className="w-full h-40 p-4 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Write your diary entry here..."
            value={entry}
            onChange={(e) => setEntry(e.target.value)}
          />
          <button
            onClick={handleSubmit}
            className="mt-4 px-6 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition"
            disabled={loading}
          >
            {loading ? 'Summarizing...' : 'Submit Entry'}
          </button>
        </div>

        <div className="mt-8">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="text-xl font-bold text-gray-800">
              {viewMode === 'summary' ? 'Diary Summaries' : 'Full Diary Entries'}
            </h2>
            <div className="flex items-center space-x-3">
              <span className={`text-sm ${viewMode === 'diary' ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>Diary</span>
              <button 
                className="relative inline-flex items-center h-6 rounded-full w-11 transition-colors focus:outline-none"
                onClick={() => {
                  const newMode = viewMode === 'summary' ? 'diary' : 'summary';
                  setViewMode(newMode);
                  localStorage.setItem('diary-view-mode', newMode);
                }}
                aria-checked={viewMode === 'summary'}
                role="switch"
              >
                <span
                  aria-hidden="true"
                  className={`${
                    viewMode === 'summary' ? 'bg-indigo-600 translate-x-5' : 'bg-gray-300 translate-x-0'
                  } pointer-events-none inline-block h-5 w-5 rounded-full shadow transform ring-0 transition ease-in-out duration-200 border border-white`}
                />
                <span
                  className={`${
                    viewMode === 'summary' ? 'bg-indigo-600' : 'bg-gray-300'
                  } absolute h-6 w-11 mx-auto rounded-full transition-colors duration-200 ease-in-out`}
                />
              </button>
              <span className={`text-sm ${viewMode === 'summary' ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>Summary</span>
            </div>
          </div>
          
          {/* Display all summaries in a list (newest to oldest) */}
          <div className="space-y-6">
            {allSummaries.length > 0 ? (
              allSummaries.map((item, index) => (
                <div key={index} className="bg-gray-50 p-4 rounded-md border border-gray-300 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-md font-bold text-gray-800">{item.formattedDate}</h3>
                    <button 
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium px-2 py-1 border border-indigo-200 rounded-md hover:bg-indigo-50"
                      onClick={() => {
                        setCurrentEntryDate(item.date);
                        // Use the entry stored in our state object
                        setEntry(item.entry || '');
                        setSummary(item.summary);
                        // Scroll back to the input area
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                    >
                      Edit this entry
                    </button>
                  </div>
                  
                  {viewMode === 'summary' ? (
                    <div className="space-y-2">
                      {item.entry && (
                        <div className="mb-3 text-sm text-gray-600 line-clamp-2">
                          <strong className="mr-2">Entry:</strong>
                          {item.entry.length > 100 ? item.entry.substring(0, 100) + '...' : item.entry}
                        </div>
                      )}
                      {renderCategory('Exercise', item.summary.exercise, 'blue')}
                      {renderCategory('Injuries / Symptoms', item.summary.injuries, 'red')}
                      {renderCategory('Important Notes', item.summary.notes, 'yellow')}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {item.entry ? (
                        <div className="text-sm text-gray-700 whitespace-pre-wrap bg-white p-4 rounded-md border border-gray-200">
                          {item.entry}
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500 italic">
                          No diary content available for this entry.
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center p-6 bg-gray-50 border border-gray-200 rounded-md">
                <p className="text-gray-500">No diary entries yet. Start by writing your first entry above!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
