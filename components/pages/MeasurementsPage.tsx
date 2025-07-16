'use client';

import { useState, useEffect } from 'react';

export default function MeasurementsPage() {
  // Mock user data
  const [userData, setUserData] = useState({
    height: 175, // cm
    weight: 70, // kg
    bodyFat: 18, // percentage
    muscleMass: 32, // percentage
    bmi: 22.9,
    bodyMeasurements: {
      chest: 96, // cm
      waist: 82, // cm
      hips: 94, // cm
      biceps: 32, // cm
      thighs: 54, // cm
      calves: 36, // cm
    },
    healthStats: {
      restingHeartRate: 68, // bpm
      bloodPressure: "120/80", // mmHg
      vo2Max: 42, // ml/kg/min
      hydration: 63, // percentage
      sleepQuality: 78, // percentage
    },
    history: [
      { date: '2024-12-01', weight: 74, bodyFat: 22 },
      { date: '2025-01-01', weight: 72, bodyFat: 20 },
      { date: '2025-02-01', weight: 71, bodyFat: 19 },
      { date: '2025-03-01', weight: 70.5, bodyFat: 18.5 },
      { date: '2025-04-01', weight: 70, bodyFat: 18 },
    ]
  });

  // BMI calculator function
  const calculateBMIStatus = (bmi: number) => {
    if (bmi < 18.5) return { status: "Underweight", color: "blue" };
    if (bmi < 25) return { status: "Normal", color: "green" };
    if (bmi < 30) return { status: "Overweight", color: "yellow" };
    return { status: "Obese", color: "red" };
  };

  const bmiStatus = calculateBMIStatus(userData.bmi);

  // Date formatting helper
  const formatDate = (dateStr: string) => {
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  return (
    <div className="py-6">
      <h1 className="text-3xl font-bold text-center mb-8">Body Measurements</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Body SVG and Height/Weight */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Body Visualization</h2>
            <div className="flex justify-center mb-4">
              {/* Human Body SVG */}
              <svg
                className="h-80"
                viewBox="0 0 100 280"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* Head */}
                <circle cx="50" cy="25" r="20" fill="#E2E8F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Neck */}
                <rect x="45" y="45" width="10" height="10" fill="#E2E8F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Torso */}
                <path d="M35 55 L35 120 L65 120 L65 55 Z" fill="#E2E8F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Arms */}
                <path d="M35 60 L15 90 L20 100 L35 80 Z" fill="#E2E8F0" stroke="#4A5568" strokeWidth="1.5" />
                <path d="M65 60 L85 90 L80 100 L65 80 Z" fill="#E2E8F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Legs */}
                <path d="M35 120 L30 200 L40 200 L45 120 Z" fill="#E2E8F0" stroke="#4A5568" strokeWidth="1.5" />
                <path d="M65 120 L70 200 L60 200 L55 120 Z" fill="#E2E8F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Feet */}
                <path d="M30 200 L20 210 L40 210 L40 200 Z" fill="#E2E8F0" stroke="#4A5568" strokeWidth="1.5" />
                <path d="M70 200 L80 210 L60 210 L60 200 Z" fill="#E2E8F0" stroke="#4A5568" strokeWidth="1.5" />
                
                {/* Measurement points with hover indicators */}
                <circle cx="50" cy="70" r="4" fill="#4F46E5" className="hover:r-6 transition-all duration-200" data-measurement="chest" />
                <circle cx="50" cy="90" r="4" fill="#4F46E5" className="hover:r-6 transition-all duration-200" data-measurement="waist" />
                <circle cx="50" cy="105" r="4" fill="#4F46E5" className="hover:r-6 transition-all duration-200" data-measurement="hips" />
                <circle cx="25" cy="75" r="4" fill="#4F46E5" className="hover:r-6 transition-all duration-200" data-measurement="biceps" />
                <circle cx="35" cy="150" r="4" fill="#4F46E5" className="hover:r-6 transition-all duration-200" data-measurement="thighs" />
                <circle cx="35" cy="180" r="4" fill="#4F46E5" className="hover:r-6 transition-all duration-200" data-measurement="calves" />
              </svg>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="text-center">
                <span className="block text-sm text-gray-500">Height</span>
                <span className="block text-xl font-bold text-indigo-600">{userData.height} cm</span>
                <div className="mt-1 h-40 w-6 bg-gray-200 rounded-full mx-auto relative">
                  <div 
                    className="absolute bottom-0 w-6 bg-indigo-500 rounded-full transition-all duration-500 ease-in-out"
                    style={{ height: `${Math.min(100, (userData.height / 200) * 100)}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <span className="block text-sm text-gray-500">Weight</span>
                <span className="block text-xl font-bold text-indigo-600">{userData.weight} kg</span>
                <div className="mt-1 h-40 w-6 bg-gray-200 rounded-full mx-auto relative">
                  <div 
                    className="absolute bottom-0 w-6 bg-indigo-500 rounded-full transition-all duration-500 ease-in-out"
                    style={{ height: `${Math.min(100, (userData.weight / 100) * 100)}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Middle Column - BMI and Progress */}
        <div className="lg:col-span-1">
          {/* BMI Card */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Body Mass Index (BMI)</h2>
            <div className="text-center mb-4">
              <span className="text-4xl font-bold text-indigo-600">{userData.bmi.toFixed(1)}</span>
              <div className="mt-3 flex items-center justify-center">
                <span className={`px-3 py-1 text-sm rounded-full bg-${bmiStatus.color}-100 text-${bmiStatus.color}-800`}>
                  {bmiStatus.status}
                </span>
              </div>
            </div>
            
            {/* BMI Scale */}
            <div className="mt-6 mb-2">
              <div className="h-4 w-full rounded-full flex overflow-hidden">
                <div className="h-full bg-blue-500" style={{ width: '20%' }}></div>
                <div className="h-full bg-green-500" style={{ width: '20%' }}></div>
                <div className="h-full bg-yellow-500" style={{ width: '25%' }}></div>
                <div className="h-full bg-orange-500" style={{ width: '15%' }}></div>
                <div className="h-full bg-red-500" style={{ width: '20%' }}></div>
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>16</span>
                <span>18.5</span>
                <span>25</span>
                <span>30</span>
                <span>35</span>
                <span>40+</span>
              </div>
            </div>
            
            {/* BMI Marker */}
            <div className="relative h-6 mt-[-24px]">
              <div 
                className="absolute h-6 w-2 bg-gray-800 rounded-sm transform translate-x-[-50%] transition-all duration-300"
                style={{ left: `${Math.min(100, Math.max(0, ((userData.bmi - 16) / 24) * 100))}%` }}
              ></div>
            </div>
            
            <p className="text-sm text-gray-600 mt-6">
              BMI is a measurement of body fat based on height and weight. A healthy BMI ranges from 18.5 to 24.9.
            </p>
          </div>
          
          {/* Progress Tracker */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Weight Progress</h2>
            <div className="space-y-2">
              {userData.history.map((entry, index) => (
                <div key={index} className="flex items-center">
                  <div className="w-24 text-sm text-gray-500">{formatDate(entry.date)}</div>
                  <div className="flex-grow h-2 bg-gray-200 rounded-full relative">
                    <div
                      className="absolute h-2 bg-indigo-500 rounded-full"
                      style={{ width: `${(entry.weight / 100) * 100}%` }}
                    ></div>
                  </div>
                  <div className="w-16 text-right text-sm font-medium">{entry.weight} kg</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Right Column - Detailed Measurements */}
        <div className="lg:col-span-1">
          {/* Body Measurements */}
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Body Measurements</h2>
            <div className="space-y-4">
              {Object.entries(userData.bodyMeasurements).map(([key, value]) => (
                <div key={key} className="flex items-center">
                  <div className="w-1/3 text-sm text-gray-500 capitalize">{key}</div>
                  <div className="w-2/3">
                    <div className="h-2 bg-gray-200 rounded-full">
                      <div
                        className="h-2 bg-indigo-500 rounded-full"
                        style={{ width: `${Math.min(100, value)}%` }}
                      ></div>
                    </div>
                    <div className="mt-1 text-sm font-medium text-right">{value} cm</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Health Stats */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Health & Fitness Stats</h2>
            
            {/* Resting Heart Rate */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-500">Resting Heart Rate</span>
                <span className="text-sm font-medium">{userData.healthStats.restingHeartRate} bpm</span>
              </div>
              <div className="relative pt-6">
                <div className="overflow-hidden h-2 text-xs flex rounded-full bg-gray-200">
                  <div 
                    className="transition-all duration-500 ease-out shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                    style={{ width: `${Math.min(100, (userData.healthStats.restingHeartRate / 100) * 100)}%` }}
                  ></div>
                </div>
                <div className="absolute flex w-full justify-between top-0 text-xs text-gray-400">
                  <span>40</span>
                  <span>60</span>
                  <span>80</span>
                  <span>100</span>
                </div>
              </div>
            </div>
            
            {/* Blood Pressure */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm text-gray-500">Blood Pressure</span>
                <span className="text-sm font-medium">{userData.healthStats.bloodPressure} mmHg</span>
              </div>
              <div className="flex items-center justify-center space-x-1 my-3">
                <div className="h-16 w-6 bg-gray-200 rounded-full relative overflow-hidden">
                  <div 
                    className="absolute bottom-0 w-full bg-green-500 transition-all duration-500"
                    style={{ height: `${parseInt(userData.healthStats.bloodPressure.split('/')[0]) / 2}%` }}
                  ></div>
                </div>
                <div className="h-16 w-6 bg-gray-200 rounded-full relative overflow-hidden">
                  <div 
                    className="absolute bottom-0 w-full bg-blue-500 transition-all duration-500"
                    style={{ height: `${parseInt(userData.healthStats.bloodPressure.split('/')[1]) / 1.5}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-xs text-center text-gray-500">Systolic / Diastolic</div>
            </div>
            
            {/* VO2 Max */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-500">VO2 Max</span>
                <span className="text-sm font-medium">{userData.healthStats.vo2Max} ml/kg/min</span>
              </div>
              <div className="relative">
                <svg className="w-full" height="50">
                  <defs>
                    <linearGradient id="vo2Gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#4338CA" />
                      <stop offset="100%" stopColor="#60A5FA" />
                    </linearGradient>
                  </defs>
                  <path 
                    d="M5,25 Q25,5 50,25 T100,25 T150,25 T200,25"
                    fill="none"
                    stroke="url(#vo2Gradient)"
                    strokeWidth="3"
                    strokeDasharray="205"
                    strokeDashoffset={205 - ((userData.healthStats.vo2Max / 60) * 205)}
                    className="transition-all duration-700 ease-in-out"
                  />
                  <circle 
                    cx={Math.min(200, (userData.healthStats.vo2Max / 60) * 200)} 
                    cy="25" 
                    r="6" 
                    fill="#4F46E5"
                    className="transition-all duration-700 ease-in-out"
                  />
                </svg>
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>Poor</span>
                  <span>Fair</span>
                  <span>Good</span>
                  <span>Excellent</span>
                </div>
              </div>
            </div>
            
            {/* Hydration and Sleep Quality */}
            <div className="grid grid-cols-2 gap-4">
              {/* Hydration */}
              <div>
                <div className="text-center">
                  <span className="text-sm text-gray-500 block">Hydration</span>
                  <div className="relative inline-flex items-center justify-center mt-2">
                    <svg className="w-20 h-20" viewBox="0 0 100 100">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke="#E2E8F0" 
                        strokeWidth="10"
                      />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke="#3B82F6" 
                        strokeWidth="10"
                        strokeDasharray="283"
                        strokeDashoffset={283 - ((userData.healthStats.hydration / 100) * 283)}
                        className="transition-all duration-700 ease-in-out"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold text-indigo-600">{userData.healthStats.hydration}%</span>
                  </div>
                </div>
              </div>
              
              {/* Sleep Quality */}
              <div>
                <div className="text-center">
                  <span className="text-sm text-gray-500 block">Sleep Quality</span>
                  <div className="relative inline-flex items-center justify-center mt-2">
                    <svg className="w-20 h-20" viewBox="0 0 100 100">
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke="#E2E8F0" 
                        strokeWidth="10"
                      />
                      <circle 
                        cx="50" 
                        cy="50" 
                        r="45" 
                        fill="none" 
                        stroke="#8B5CF6" 
                        strokeWidth="10"
                        strokeDasharray="283"
                        strokeDashoffset={283 - ((userData.healthStats.sleepQuality / 100) * 283)}
                        className="transition-all duration-700 ease-in-out"
                        transform="rotate(-90 50 50)"
                      />
                    </svg>
                    <span className="absolute text-xl font-bold text-indigo-600">{userData.healthStats.sleepQuality}%</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Add Measurement Button */}
            <div className="mt-8 text-center">
              <button className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 transition-colors duration-200">
                Update Measurements
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
