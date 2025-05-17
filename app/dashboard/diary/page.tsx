'use client';

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

import { useState } from 'react';

export default function DiaryPage() {
  const [entry, setEntry] = useState('');
  const [summary, setSummary] = useState<{ exercise: string[], injuries: string[], notes: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClientComponentClient();

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

      // 🟡 Get the user ID
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (!user || userError) {
        console.error('User not authenticated:', userError);
        return;
      }

      // 🟢 Save diary + summary to Supabase
      const { error: insertError } = await supabase.from('diary_entries').insert({
        user_id: user.id,
        content: entry,
        summary: data.summary, // optional: only if your table supports it
        created_at: new Date().toISOString(),
      });

      if (insertError) {
        console.error('Error saving diary:', insertError);
      }
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
          <div className="bg-gray-50 p-4 rounded-md border border-gray-300">
            <h2 className="text-lg font-bold mb-4 text-gray-800">Summary for {currentDate}</h2>
            {renderCategory('Exercise', summary.exercise, 'blue')}
            {renderCategory('Injuries / Symptoms', summary.injuries, 'red')}
            {renderCategory('Important Notes', summary.notes, 'yellow')}
          </div>
        )}
      </div>
    </div>
  );
}
