'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '../auth/AuthProvider';
import DatabaseService from '../../services/DatabaseService';
import { User } from '../../models/User';
import styles from './ProfilePage.module.css';

export default function ProfilePage() {
  const { user: authUser } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    height: 0,
    weight: 0
  });

  useEffect(() => {
    loadUserData();
  }, [authUser]);

  const loadUserData = async () => {
    if (!authUser?.id) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      const userData = await DatabaseService.loadUser(authUser.id);
      
      if (userData) {
        setUser(userData);
        setFormData({
          name: userData.name,
          height: userData.height,
          weight: userData.weight
        });
      } else {
        // Create new user profile with email-based name
        const userName = authUser.email?.split('@')[0] || 'User';
        const newUser = new User(authUser.id, userName, 0, 0);
        
        const saved = await DatabaseService.saveUserProfile(newUser);
        
        if (saved) {
          setUser(newUser);
          setFormData({
            name: newUser.name,
            height: newUser.height,
            weight: newUser.weight
          });
        } else {
          console.error('Failed to save new user profile');
        }
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name,
        height: user.height,
        weight: user.weight
      });
    }
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!authUser || !user) return;
    
    setIsSaving(true);
    try {
      // Update user object
      user.name = formData.name;
      user.height = formData.height;
      user.weight = formData.weight;

      // Save to database
      const saved = await DatabaseService.saveUserProfile(user);
      
      if (saved) {
        setIsEditing(false);
        // Reload data to ensure consistency
        await loadUserData();
      } else {
        alert('Failed to save profile. Please try again.');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Error saving profile. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const calculateBMI = (weight: number, height: number) => {
    if (height === 0 || weight === 0) return 0;
    const heightInMeters = height / 100;
    return Math.round((weight / (heightInMeters * heightInMeters)) * 10) / 10;
  };

  const getBMIStatus = (bmi: number) => {
    if (bmi === 0) return { status: "Not set", color: "gray" };
    if (bmi < 18.5) return { status: "Underweight", color: "blue" };
    if (bmi < 25) return { status: "Normal", color: "green" };
    if (bmi < 30) return { status: "Overweight", color: "yellow" };
    return { status: "Obese", color: "red" };
  };

  if (isLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading your profile...</div>
      </div>
    );
  }

  if (!authUser) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Please log in to view your profile.</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>
          Profile not found. Try refreshing the page or contact support.
        </div>
      </div>
    );
  }

  const bmi = calculateBMI(user.weight, user.height);
  const bmiStatus = getBMIStatus(bmi);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>🏋️‍♂️ {user.name}</h1>
        <p className={styles.subtitle}>Your Fitness Profile</p>
      </div>

      <div className={styles.profileCard}>
        <div className={styles.profileContent}>
          <h2>� Profile Information</h2>
          
          {!isEditing ? (
            // View Mode
            <div className={styles.viewMode}>
              <div className={styles.profileField}>
                <label>Name:</label>
                <span>{user.name}</span>
              </div>
              
              <div className={styles.profileField}>
                <label>Height:</label>
                <span>{user.height > 0 ? `${user.height} cm` : 'Not set'}</span>
              </div>
              
              <div className={styles.profileField}>
                <label>Weight:</label>
                <span>{user.weight > 0 ? `${user.weight} kg` : 'Not set'}</span>
              </div>
              
              <div className={styles.profileField}>
                <label>BMI:</label>
                <span style={{ color: bmiStatus.color }}>
                  {bmi > 0 ? `${bmi} (${bmiStatus.status})` : 'Not available'}
                </span>
              </div>

              <button onClick={handleEdit} className={styles.editButton}>
                ✏️ Edit Profile
              </button>
            </div>
          ) : (
            // Edit Mode
            <div className={styles.editMode}>
              <div className={styles.formField}>
                <label>Name:</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className={styles.input}
                />
              </div>
              
              <div className={styles.formField}>
                <label>Height (cm):</label>
                <input
                  type="number"
                  value={formData.height || ''}
                  onChange={(e) => setFormData({...formData, height: Number(e.target.value)})}
                  className={styles.input}
                  min="0"
                  max="300"
                />
              </div>
              
              <div className={styles.formField}>
                <label>Weight (kg):</label>
                <input
                  type="number"
                  value={formData.weight || ''}
                  onChange={(e) => setFormData({...formData, weight: Number(e.target.value)})}
                  className={styles.input}
                  min="0"
                  max="500"
                />
              </div>

              <div className={styles.buttonGroup}>
                <button 
                  onClick={handleSave} 
                  disabled={isSaving}
                  className={styles.saveButton}
                >
                  {isSaving ? '💾 Saving...' : '💾 Save'}
                </button>
                
                <button 
                  onClick={handleCancel}
                  disabled={isSaving}
                  className={styles.cancelButton}
                >
                  ❌ Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Summary */}
      <div className={styles.statsSection}>
        <h3 className={styles.sectionTitle}>Fitness Stats</h3>
        <div className={styles.statsGrid}>
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.totalLogs}</div>
            <div className={styles.statLabel}>Total Logs</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.totalWorkouts}</div>
            <div className={styles.statLabel}>Total Workouts</div>
          </div>
          
          <div className={styles.statCard}>
            <div className={styles.statValue}>{user.totalWorkoutMinutes}</div>
            <div className={styles.statLabel}>Minutes Exercised</div>
          </div>
        </div>
      </div>
    </div>
  );
}
