// Server component for profile page

export default function ProfilePage() {
  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-center mb-8">User Profile</h1>
      <div className="bg-yellow-100 rounded-lg p-6 mb-6">
        <h2 className="text-xl font-medium text-yellow-900 mb-3">Profile Placeholder</h2>
        <p className="text-gray-700 mb-4">This is a placeholder for the user profile page. The full interactive profile management functionality will be implemented in the future.</p>
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
          If you can see this message, the routing to the profile page is working correctly.
        </p>
        <p className="mt-1 text-sm text-green-500">
          Path: /dashboard/profile
        </p>
      </div>
    </div>
  );
}

