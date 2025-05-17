'use client';

import { useState, useEffect, FormEvent } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';

// Define interfaces for measurements
interface Measurement {
  id: string;
  type: 'height' | 'weight';
  value: number;
  date: string;
}

interface MeasurementSummary {
  type: 'height' | 'weight';
  name: string;
  unit: string;
  lastValue?: number;
  lastDate?: string;
  history: { date: string; value: number }[];
}

export default function MeasurementsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Measurement summaries
  const [heightData, setHeightData] = useState<MeasurementSummary>({
    type: 'height',
    name: 'Height',
    unit: 'cm',
    history: []
  });
  
  const [weightData, setWeightData] = useState<MeasurementSummary>({
    type: 'weight',
    name: 'Weight',
    unit: 'kg',
    history: []
  });
  
  // Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<'height' | 'weight'>('weight');
  const [newValue, setNewValue] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Fetch measurement data
  useEffect(() => {
    const fetchMeasurements = async () => {
      try {
        // Simulate API call with delay
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Mock data
        const heightMockData: MeasurementSummary = {
          type: 'height',
          name: 'Height',
          unit: 'cm',
          lastValue: 180,
          lastDate: '2025-05-10',
          history: [
            { date: '2025-01-15', value: 179.5 },
            { date: '2025-03-10', value: 179.8 },
            { date: '2025-05-10', value: 180 }
          ]
        };
        
        const weightMockData: MeasurementSummary = {
          type: 'weight',
          name: 'Weight',
          unit: 'kg',
          lastValue: 75.5,
          lastDate: '2025-05-15',
          history: [
            { date: '2025-01-15', value: 78 },
            { date: '2025-02-15', value: 77.2 },
            { date: '2025-03-15', value: 76.5 },
            { date: '2025-04-15', value: 76 },
            { date: '2025-05-15', value: 75.5 }
          ]
        };
        
        setHeightData(heightMockData);
        setWeightData(weightMockData);
        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching measurements:', err);
        setError('Failed to load measurements. Please try again later.');
        setIsLoading(false);
      }
    };

    fetchMeasurements();
  }, []);

  // Handle adding a new measurement
  const handleAddMeasurement = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedType || !newValue || isNaN(parseFloat(newValue))) return;
    
    setIsSaving(true);
    
    try {
      // Simulate API call with delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newMeasurement: Measurement = {
        id: Math.random().toString(36).substring(2, 9),
        type: selectedType,
        value: parseFloat(newValue),
        date: new Date().toISOString().split('T')[0]
      };
      
      // Update the appropriate state
      if (selectedType === 'height') {
        setHeightData(prev => ({
          ...prev,
          lastValue: newMeasurement.value,
          lastDate: newMeasurement.date,
          history: [
            { date: newMeasurement.date, value: newMeasurement.value },
            ...prev.history
          ]
        }));
      } else {
        setWeightData(prev => ({
          ...prev,
          lastValue: newMeasurement.value,
          lastDate: newMeasurement.date,
          history: [
            { date: newMeasurement.date, value: newMeasurement.value },
            ...prev.history
          ]
        }));
      }
      
      // Reset form and close modal
      setNewValue('');
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error adding measurement:', err);
      setError('Failed to add measurement. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Body Measurements</h1>
        <div className="mt-6 grid gap-5 grid-cols-1 sm:grid-cols-2">
          {[1, 2].map(i => (
            <div key={i} className="bg-white overflow-hidden shadow rounded-lg animate-pulse">
              <div className="px-4 py-5 sm:p-6 h-32"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="py-6">
        <h1 className="text-2xl font-semibold text-gray-900">Body Measurements</h1>
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
        <h1 className="text-2xl font-semibold text-gray-900">Body Measurements</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Add Measurement
        </button>
      </div>

      {/* Current Measurements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Height</h2>
            {heightData.lastDate && (
              <span className="text-sm text-gray-500">
                Last updated: {new Date(heightData.lastDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-indigo-600">{heightData.lastValue || '--'}</span>
            <span className="ml-2 text-gray-500">{heightData.unit}</span>
          </div>
          
          {/* History */}
          {heightData.history.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Recent History</h3>
              <div className="space-y-2">
                {heightData.history.slice(0, 3).map((entry, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="font-medium">{entry.value} {heightData.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-900">Weight</h2>
            {weightData.lastDate && (
              <span className="text-sm text-gray-500">
                Last updated: {new Date(weightData.lastDate).toLocaleDateString()}
              </span>
            )}
          </div>
          <div className="flex items-baseline">
            <span className="text-3xl font-bold text-indigo-600">{weightData.lastValue || '--'}</span>
            <span className="ml-2 text-gray-500">{weightData.unit}</span>
          </div>
          
          {/* History */}
          {weightData.history.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h3 className="text-sm font-medium text-gray-500 mb-2">Recent History</h3>
              <div className="space-y-2">
                {weightData.history.slice(0, 3).map((entry, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-600">{new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                    <span className="font-medium">{entry.value} {weightData.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Measurement History Graph */}
      <div className="bg-white shadow rounded-lg p-6 mb-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Measurement Trends</h2>
        
        <div className="flex justify-end mb-4">
          <div className="inline-flex rounded-md shadow-sm">
            <button 
              type="button"
              className="inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              Weight
            </button>
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:z-10 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              Height
            </button>
          </div>
        </div>
        
        {/* Simple graph placeholder */}
        <div className="relative h-64 mt-4">
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 border border-gray-200 rounded">
            {weightData.history.length > 0 ? (
              <div className="w-full h-full p-4">
                <div className="h-full flex items-end">
                  {weightData.history.slice(0, 7).reverse().map((entry, index) => {
                    // Simple calculation to show relative heights
                    const min = Math.min(...weightData.history.map(e => e.value));
                    const max = Math.max(...weightData.history.map(e => e.value));
                    const range = max - min || 1;
                    const percentage = ((entry.value - min) / range) * 70 + 10; // 10-80% height
                    
                    return (
                      <div key={index} className="flex-1 flex flex-col items-center">
                        <div 
                          className="w-4/5 bg-indigo-500 rounded-t"
                          style={{ height: `${percentage}%` }}
                        ></div>
                        <span className="text-xs text-gray-600 mt-1 truncate w-full text-center">
                          {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center text-gray-500">
                <p>Not enough data to display trends</p>
                <p className="text-sm mt-1">Add more measurements to see your progress</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Measurement Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900">Add Measurement</h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddMeasurement}>
              <div className="space-y-4">
                <div>
                  <label htmlFor="measurement-type" className="block text-sm font-medium text-gray-700 mb-1">
                    Measurement Type
                  </label>
                  <select
                    id="measurement-type"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as 'height' | 'weight')}
                    className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="weight">Weight</option>
                    <option value="height">Height</option>
                  </select>
                </div>
                
                <div>
                  <label htmlFor="measurement-value" className="block text-sm font-medium text-gray-700 mb-1">
                    Value
                  </label>
                  <div className="flex rounded-md shadow-sm">
                    <input
                      type="number"
                      id="measurement-value"
                      value={newValue}
                      onChange={(e) => setNewValue(e.target.value)}
                      placeholder="Enter value"
                      step="0.1"
                      required
                      className="flex-1 block w-full rounded-none rounded-l-md sm:text-sm border-gray-300 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 sm:text-sm">
                      {selectedType === 'height' ? 'cm' : 'kg'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                    isSaving ? 'opacity-75 cursor-not-allowed' : ''
                  }`}
                >
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
