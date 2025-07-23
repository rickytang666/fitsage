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
          // Fix timezone issue: parse date string as local date, not UTC
          const dateParts = dbLog.log_date.split('-').map((num: string) => parseInt(num));
          const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // Year, Month (0-indexed), Day
          
          const log = new Log(
            dbLog.id,
            dbLog.diary_entry || '',
            localDate,
            // Ensure suggestions is always an array
            Array.isArray(dbLog.suggestions) ? dbLog.suggestions : 
            (dbLog.suggestions ? [dbLog.suggestions] : [])
          );

          // Parse workouts from JSON
          if (dbLog.workouts && Array.isArray(dbLog.workouts)) {
            dbLog.workouts.forEach((workoutData: any) => {
              const workout = new Workout(
                workoutData.id,
                workoutData.name,
                new Date(workoutData.date),
                {
                  durationMinutes: workoutData.durationMinutes,
                  sets: workoutData.sets,
                  reps: workoutData.reps,
                  weight: workoutData.weight
                }
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
      console.log('🔄 Saving user profile:', { id: user.id, name: user.name, height: user.height, weight: user.weight });
      
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
        console.error('❌ Error saving profile:', error);
        return false;
      }

      console.log('✅ Profile saved successfully');
      return true;
    } catch (error) {
      console.error('❌ Error saving user profile:', error);
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

      // Check if the selected date is available for this log (excluding this entry ID for updates)
      const isDateAvailable = await this.isDateAvailable(userId, log.date, log.id);
      
      if (!isDateAvailable) {
        console.error('❌ Date is not available for this entry');
        return false;
      }

      // Convert workouts to plain objects for JSON storage
      const workoutsJson = log.workouts.map(workout => ({
        id: workout.id,
        name: workout.name,
        date: workout.date.toISOString(),
        durationMinutes: workout.durationMinutes,
        sets: workout.sets,
        reps: workout.reps,
        weight: workout.weight
      }));

      console.log('📊 Workouts JSON:', workoutsJson);

      const logData = {
        id: log.id,
        user_id: userId,
        log_date: log.date.toISOString().split('T')[0], // YYYY-MM-DD
        diary_entry: log.diaryEntry,
        workouts: workoutsJson,
        injuries: log.injuries,
        suggestions: log.suggestions, // Add suggestions field
        updated_at: new Date().toISOString()
      };

      console.log('💾 About to save log data:', logData);

      // Upsert log (handles both insert and update cases)
      const { data, error } = await supabase
        .from('diary_logs')
        .upsert(logData)
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

  /**
   * Load all diary entries for a user with complete data (workouts, injuries, suggestions)
   */
  static async loadDiaryEntries(userId: string): Promise<Log[]> {
    try {
      const { data: logs, error } = await supabase
        .from('diary_logs')
        .select('*')
        .eq('user_id', userId)
        .order('log_date', { ascending: false });

      if (error) {
        console.error('❌ Error loading diary entries:', error);
        return [];
      }

      return logs.map(dbLog => {
        // Fix timezone issue: parse date string as local date, not UTC
        const dateParts = dbLog.log_date.split('-').map((num: string) => parseInt(num));
        const localDate = new Date(dateParts[0], dateParts[1] - 1, dateParts[2]); // Year, Month (0-indexed), Day
        
        const log = new Log(
          dbLog.id,
          dbLog.diary_entry || '',
          localDate,
          // Ensure suggestions is always an array
          Array.isArray(dbLog.suggestions) ? dbLog.suggestions : 
          (dbLog.suggestions ? [dbLog.suggestions] : [])
        );

        // Parse workouts from JSON
        if (dbLog.workouts && Array.isArray(dbLog.workouts)) {
          dbLog.workouts.forEach((workoutData: any) => {
            const workout = new Workout(
              workoutData.id,
              workoutData.name,
              new Date(workoutData.date),
              {
                durationMinutes: workoutData.durationMinutes,
                sets: workoutData.sets,
                reps: workoutData.reps,
                weight: workoutData.weight
              }
            );
            log.workouts.push(workout);
          });
        }

        // Add injuries
        if (dbLog.injuries) {
          log.injuries = dbLog.injuries;
        }

        return log;
      });

    } catch (error) {
      console.error('❌ Exception loading diary entries:', error);
      return [];
    }
  }

  /**
   * Save or update a simple diary entry
   */
  static async saveDiaryEntry(userId: string, entryId: string, diaryEntry: string, date: Date): Promise<boolean> {
    try {
      const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
      
      // Check if this date is available (if we're creating new) or if it's the same entry (if updating)
      const { data: existingLog } = await supabase
        .from('diary_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('log_date', dateStr)
        .single();

      // If entry exists and it's not the same ID, this date is taken
      if (existingLog && existingLog.id !== entryId) {
        console.error('❌ Date already has an entry');
        return false;
      }

      const logData = {
        id: entryId,
        user_id: userId,
        log_date: dateStr,
        diary_entry: diaryEntry,
        workouts: [], // Empty as requested
        injuries: [], // Empty as requested
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('diary_logs')
        .upsert(logData);

      if (error) {
        console.error('❌ Error saving diary entry:', error);
        return false;
      }

      console.log('✅ Diary entry saved successfully');
      return true;

    } catch (error) {
      console.error('❌ Exception saving diary entry:', error);
      return false;
    }
  }

  /**
   * Delete a diary entry
   */
  static async deleteDiaryEntry(entryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('diary_logs')
        .delete()
        .eq('id', entryId);

      if (error) {
        console.error('❌ Error deleting diary entry:', error);
        return false;
      }

      console.log('✅ Diary entry deleted successfully');
      return true;

    } catch (error) {
      console.error('❌ Exception deleting diary entry:', error);
      return false;
    }
  }

  /**
   * Check if a date is available for diary entry
   */
  static async isDateAvailable(userId: string, date: Date, excludeEntryId?: string): Promise<boolean> {
    try {
      const dateStr = date.toISOString().split('T')[0];
      
      let query = supabase
        .from('diary_logs')
        .select('id')
        .eq('user_id', userId)
        .eq('log_date', dateStr);
      
      // Exclude a specific entry ID if provided (for editing)
      if (excludeEntryId) {
        query = query.neq('id', excludeEntryId);
      }
      
      const { data: existingLog } = await query.single();
      
      return !existingLog; // Available if no existing log found
      
    } catch (error) {
      // If error is "not found", then date is available
      return true;
    }
  }

  /**
   * Find the nearest available date (going backwards from given date, not future)
   */
  static async findNearestAvailableDate(userId: string, startDate: Date = new Date(), excludeEntryId?: string): Promise<Date> {
    const today = new Date();
    const currentDate = new Date(startDate);
    
    // Don't allow future dates
    if (currentDate > today) {
      currentDate.setTime(today.getTime());
    }
    
    for (let i = 0; i < 365; i++) { // Check up to a year back
      const isAvailable = await this.isDateAvailable(userId, currentDate, excludeEntryId);
      
      if (isAvailable) {
        return new Date(currentDate);
      }
      
      // Go back one day
      currentDate.setDate(currentDate.getDate() - 1);
    }
    
    // Fallback: return today (shouldn't happen in practice)
    return new Date(today);
  }
}

export default DatabaseService;
