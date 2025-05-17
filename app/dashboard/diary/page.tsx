'use client';

import { useState } from 'react';

export default function DiaryPage() {
  const [entry, setEntry] = useState('');
  const [summary, setSummary] = useState('');
  const [loading, setLoading] = useState(false);

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: entry }),
      });

      const data = await res.json();
      setSummary(data.summary);
    } catch (err) {
      setSummary('Error generating summary.');
    } finally {
      setEntry('');
      setLoading(false);
    }
  };

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-center mb-8">Fitness Diary</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-gray-900">{currentDate}</p>
          <p className="text-sm text-gray-500 mt-2">AI-Powered Diary Summarizer</p>
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

        {summary && (
          <div className="bg-red-50 border border-red-300 p-4 rounded-md">
            <h2 className="text-red-700 font-bold mb-2">AI Summary</h2>
            <p className="text-red-600 whitespace-pre-wrap">{summary}</p>
          </div>
        )}

        <div className="mt-8 p-4 border-2 border-green-500 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-lg font-bold text-green-700">Routing Success!</h3>
          </div>
          <p className="mt-2 text-green-600">If you can see this message, the routing to the diary page is working correctly.</p>
          <p className="mt-1 text-sm text-green-500">Path: /dashboard/diary</p>
        </div>
      </div>
    </div>
  );
}
