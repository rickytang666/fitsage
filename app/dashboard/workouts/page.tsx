'use client';

export default function WorkoutsPage() {
  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-center mb-8">Workouts</h1>

      {/* Workout Cards */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900">Featured Workouts</h2>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {/* Cardio Workout */}
          <WorkoutCard
            title="Cardio Workout"
            duration="30 minutes"
            intensity="Moderate intensity"
            benefit="Improves heart health"
            level="Beginner Friendly"
            levelColor="green"
            iconPath="M13 10V3L4 14h7v7l9-11h-7z"
          />

          {/* Strength Training */}
          <WorkoutCard
            title="Strength Training"
            duration="45 minutes"
            intensity="High intensity"
            benefit="Builds muscle mass"
            level="Intermediate"
            levelColor="yellow"
            iconPath="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
          />

          {/* Flexibility Workout */}
          <WorkoutCard
            title="Flexibility Workout"
            duration="60 minutes"
            intensity="Low intensity"
            benefit="Improves mobility"
            level="All Levels"
            levelColor="blue"
            iconPath="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />

          {/* HIIT Workout */}
          <WorkoutCard
            title="HIIT Workout"
            duration="25 minutes"
            intensity="Very high intensity"
            benefit="Burns calories efficiently"
            level="Advanced"
            levelColor="red"
            iconPath="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"
          />

          {/* Yoga Session */}
          <WorkoutCard
            title="Yoga Session"
            duration="75 minutes"
            intensity="Low to moderate intensity"
            benefit="Improves balance and flexibility"
            level="All Levels"
            levelColor="blue"
            iconPath="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />

          {/* Swimming */}
          <WorkoutCard
            title="Swimming"
            duration="40 minutes"
            intensity="Moderate intensity"
            benefit="Full body workout, low impact"
            level="Intermediate"
            levelColor="cyan"
            iconPath="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />

          {/* Boxing */}
          <WorkoutCard
            title="Boxing"
            duration="50 minutes"
            intensity="High intensity"
            benefit="Improves coordination and strength"
            level="Intermediate-Advanced"
            levelColor="orange"
            iconPath="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
          />

          {/* Pilates */}
          <WorkoutCard
            title="Pilates"
            duration="55 minutes"
            intensity="Low to moderate intensity"
            benefit="Strengthens core and improves posture"
            level="Beginner-Intermediate"
            levelColor="pink"
            iconPath="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />

          {/* CrossFit */}
          <WorkoutCard
            title="CrossFit"
            duration="45 minutes"
            intensity="Very high intensity"
            benefit="Builds functional strength and endurance"
            level="Advanced"
            levelColor="red"
            iconPath="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />

          {/* Cycling */}
          <WorkoutCard
            title="Cycling"
            duration="60 minutes"
            intensity="Moderate to high intensity"
            benefit="Strengthens legs and cardiovascular system"
            level="All Levels"
            levelColor="green"
            iconPath="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />

          {/* Running */}
          <WorkoutCard
            title="Running"
            duration="35 minutes"
            intensity="Moderate to high intensity"
            benefit="Improves endurance and burns calories"
            level="Beginner Friendly"
            levelColor="green"
            iconPath="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
          />

          {/* Rock Climbing */}
          <WorkoutCard
            title="Rock Climbing"
            duration="70 minutes"
            intensity="High intensity"
            benefit="Builds upper body strength and problem-solving"
            level="Intermediate-Advanced"
            levelColor="orange"
            iconPath="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />

          {/* Meditation */}
          <WorkoutCard
            title="Meditation"
            duration="20 minutes"
            intensity="Low intensity"
            benefit="Reduces stress and improves mental clarity"
            level="All Levels"
            levelColor="blue"
            iconPath="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
          />

        </div>
      </div>
    </div>
  );
}

// Helper component
function WorkoutCard({ title, duration, intensity, benefit, level, levelColor, iconPath }: {
  title: string;
  duration: string;
  intensity: string;
  benefit: string;
  level: string;
  levelColor: string;
  iconPath: string;
}) {
  return (
    <div className="rounded-lg border border-gray-300 bg-white p-6">
      <div className="text-indigo-600">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="mx-auto h-10 w-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={iconPath}
          />
        </svg>
      </div>
      <h3 className="mt-2 text-center text-lg font-medium text-gray-900">
        {title}
      </h3>
      <div className="mt-3 text-center text-sm text-gray-500">
        <p>{duration}</p>
        <p className="mt-1">{intensity}</p>
        <p className="mt-1">{benefit}</p>
      </div>
      <div className="mt-4">
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-${levelColor}-100 text-${levelColor}-800`}>
          {level}
        </span>
      </div>
    </div>
  );
}
