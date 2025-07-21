/**
 * Simple Database Service for FitSage
 * 
 * Simple structure:
 * - profiles table: stores user info (name, height, weight)
 * - diary_logs table: stores daily logs with workouts as JSON
 */

import { createSupabaseClient } from '@/utils/supabase-client';
import { User, Log, Workout } from '@/models/User';

const supabase = createSupabaseClient();

export class DatabaseService {
  
  /**
   * Load a user with all their diary logs
   */
  static async loadUser(userId: string): Promise<User | null> {
    try {
      // 1. Get user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('name, height_cm, weight_kg')
        .eq('id', userId)
        .single();

      // Handle case where profile doesn't exist yet (not an error)
      if (profileError) {
        if (profileError.code === 'PGRST116') {
          // No profile found - this is normal for new users
          console.log('No profile found for user, will create one later');
          return null;
        } else {
          console.error('Error loading profile:', profileError);
          return null;
        }
      }

      if (!profile) {
        console.log('Profile data is empty');
        return null;
      }

      // 2. Create user object
      const user = new User(
        userId,
        profile.name || 'User',
        profile.height_cm || 0,
        profile.weight_kg || 0
      );

      // 3. Load diary logs from diary_logs table
      const { data: logs, error: logsError } = await supabase
        .from('diary_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false });

      if (logsError) {
        console.error('Error loading logs:', logsError);
        // Don't fail completely, just return user with no logs
        return user;
      }

      // 4. Convert database logs to Log objects
      if (logs && logs.length > 0) {
        logs.forEach(dbLog => {
          const log = new Log(
            dbLog.id,
            dbLog.diary_entry || '',
            new Date(dbLog.log_date)
          );

          // Parse workouts from JSON
          if (dbLog.workouts && Array.isArray(dbLog.workouts)) {
            dbLog.workouts.forEach((workoutData: any) => {
              const workout = new Workout(
                workoutData.id,
                workoutData.name,
                new Date(workoutData.date),
                workoutData.durationMinutes
              );
              log.workouts.push(workout);
            });
          }

          // Add injuries
          if (dbLog.injuries) {
            log.injuries = dbLog.injuries;
          }

          user.addLog(log);
        });
      }
      
      return user;

    } catch (error) {
      console.error('Error loading user:', error);
      return null;
    }
  }

  /**
   * Save user profile 
   */
  static async saveUserProfile(user: User): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          name: user.name,
          height_cm: user.height,
          weight_kg: user.weight,
          updated_at: new Date().toISOString()
        });

      if (error) {
        console.error('Error saving profile:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error saving user profile:', error);
      return false;
    }
  }

  /**
   * Find the next available date for a log (starting from today, going backwards)
   */
  static async findAvailableDate(userId: string, startDate: Date = new Date()): Promise<Date> {
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 365; i++) { // Check up to a year back
      const dateStr = currentDate.toISOString().split('T')[0];
      
      const { data: existingLog } = await supabase
        .from('diary_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('log_date', dateStr)
        .single();
      
      if (!existingLog) {
        // Found an available date!
        console.log(`📅 Found available date: ${dateStr}`);
        return new Date(currentDate);
      }
      
      // Go back one day
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Fallback: just use today (shouldn't happen in practice)
    return new Date();
  }

  /**
   * Save a complete log (diary entry + workouts as JSON)
   */
  static async saveLog(log: Log, userId: string): Promise<boolean> {
    try {
      console.log('🔄 Saving log:', {
        logId: log.id,
        userId: userId,
        logDate: log.date,
        diaryEntry: log.diaryEntry,
        workoutsCount: log.workouts.length,
        injuriesCount: log.injuries.length
      });

      // Find available date if needed
      const availableDate = await this.findAvailableDate(userId, log.date);
      if (availableDate.getTime() !== log.date.getTime()) {
        console.log(`📅 Date conflict! Moving log from ${log.date.toDateString()} to ${availableDate.toDateString()}`);
        log.date = availableDate; // Update the log's date
      }

      // Convert workouts to plain objects for JSON storage
      const workoutsJson = log.workouts.map(workout => ({
        id: workout.id,
        name: workout.name,
        date: workout.date.toISOString(),
        durationMinutes: workout.durationMinutes
      }));

      console.log('📊 Workouts JSON:', workoutsJson);

      const logData = {
        id: log.id,
        user_id: userId,
        log_date: log.date.toISOString().split('T')[0], // YYYY-MM-DD
        diary_entry: log.diaryEntry,
        workouts: workoutsJson,
        injuries: log.injuries,
        updated_at: new Date().toISOString()
      };

      console.log('💾 About to save log data:', logData);

      // Insert new log (we already found an available date)
      const { data, error } = await supabase
        .from('diary_logs')
        .insert(logData)
        .select();

      if (error) {
        console.error('❌ Error saving log:', error);
        console.error('❌ Error details:', JSON.stringify(error, null, 2));
        return false;
      }

      console.log('✅ Log saved successfully:', data);
      return true;
    } catch (error) {
      console.error('❌ Exception while saving log:', error);
      return false;
    }
  }
}

export default DatabaseService;
