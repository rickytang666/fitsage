// Note: No 'use client' directive - this is a server component for simple routing test

export default function DiaryPage() {
  // Static date for display
  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-center mb-8">Fitness Diary</h1>
      <div className="bg-white shadow rounded-lg p-6">
        <div className="text-center mb-6">
          <p className="text-lg font-medium text-gray-900">{currentDate}</p>
          <p className="text-sm text-gray-500 mt-2">Simple Server Component Version</p>
        </div>
        
        <div className="bg-indigo-50 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-medium text-indigo-900 mb-3">Sample Diary Entry</h2>
          <p className="text-gray-700 mb-4">This is a static diary entry for testing routing purposes. The full interactive diary will be available once routing is confirmed to work properly.</p>
          
          <div className="flex space-x-3 mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
              Workout Completed
            </span>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
              Nutrition Tracked
            </span>
          </div>
          
          <div className="bg-white rounded-lg p-4 border border-indigo-100">
            <h3 className="font-medium text-gray-900 mb-2">Sample Activity Summary</h3>
            <ul className="list-disc pl-5 text-sm text-gray-600 space-y-1">
              <li>30 minutes of cardio training</li>
              <li>3 sets of strength exercises</li>
              <li>15 minutes of stretching</li>
              <li>1800 calories consumed</li>
              <li>8 glasses of water</li>
            </ul>
          </div>
        </div>

        {/* Success indicator for routing test */}
        <div className="mt-8 p-4 border-2 border-green-500 bg-green-50 rounded-lg">
          <div className="flex items-center">
            <svg className="h-6 w-6 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <h3 className="text-lg font-bold text-green-700">Routing Success!</h3>
          </div>
          <p className="mt-2 text-green-600">
            If you can see this message, the routing to the diary page is working correctly.
          </p>
          <p className="mt-1 text-sm text-green-500">
            Path: /dashboard/diary
          </p>
        </div>
      </div>
    </div>
  );
}
