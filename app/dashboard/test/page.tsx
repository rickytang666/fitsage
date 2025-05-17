// Note: No 'use client' directive to keep it a server component

export default function TestPage() {
  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-center mb-8">Simple Test Page</h1>
      <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded-md shadow-md">
        <p className="font-medium">Routing Test Success!</p>
        <p className="mt-2">If you can see this message, routing to dashboard/test is working correctly.</p>
        <p className="mt-4 text-sm text-green-800">This is a simple server component with no authentication code.</p>
      </div>
    </div>
  );
}

