export default function ProfilePage() {
  const userName = "Ricky"; // Example username

  return (
    <div className="py-10 px-4 bg-gradient-to-br from-gray-100 to-white min-h-screen">
      {/* Apple-style user name display */}
      <div className="text-center mb-10">
        <h1 className="text-5xl font-semibold text-gray-900 drop-shadow-sm">🏋️‍♂️ {userName}</h1>
        <p className="text-lg text-gray-500 mt-2 tracking-wide">Your Fitness Dashboard</p>
      </div>

      {/* Glassmorphism profile card */}
      <div className="mx-auto max-w-2xl bg-white/60 backdrop-blur-md border border-gray-200 rounded-2xl shadow-md p-8">
        <h2 className="text-2xl font-medium text-gray-800 mb-4">🔥 Fitness Profile Under Construction</h2>
        <p className="text-gray-600">
          We're building your ultimate fitness profile — tracking workouts, nutrition, progress,
          and goals. Stay tuned for personalized insights and motivational stats!
        </p>
      </div>

      {/* Fitness progress success box */}
      <div className="mt-12 mx-auto max-w-xl p-6 rounded-xl bg-[#f9f9f9] shadow-inner border border-gray-300">
        <div className="flex items-center space-x-3">
          <svg
            className="h-6 w-6 text-green-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4"
            />
          </svg>
          <h3 className="text-xl font-semibold text-green-700">Workout Log Updated!</h3>
        </div>
        <p className="mt-3 text-green-600">
          Great job! Your latest workout has been recorded. Keep crushing those fitness goals 💪
        </p>
        <p className="text-sm text-gray-400 mt-1">Last workout: Today, 7:00 AM</p>
      </div>
    </div>
  );
}
