/**
 * Type definitions for Supabase database schema
 * These types provide type safety when interacting with the database
 */

/**
 * Generic JSON type for flexible data structures
 */
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/**
 * Main Database interface containing all table definitions
 */
export interface Database {
  public: {
    Tables: {
      /**
       * Profiles table - Extended user information
       * Linked to auth.users via the id foreign key
       */
      profiles: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string | null;
          first_name: string | null;
          last_name: string | null;
          avatar_url: string | null;
          height_cm: number | null;
          weight_kg: number | null;
          birth_date: string | null;
          gender: string | null;
          fitness_level: string | null;
          activity_level: string | null;
          bio: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          updated_at?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          birth_date?: string | null;
          gender?: string | null;
          fitness_level?: string | null;
          activity_level?: string | null;
          bio?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          first_name?: string | null;
          last_name?: string | null;
          avatar_url?: string | null;
          height_cm?: number | null;
          weight_kg?: number | null;
          birth_date?: string | null;
          gender?: string | null;
          fitness_level?: string | null;
          activity_level?: string | null;
          bio?: string | null;
        };
      };

      /**
       * Workouts table - Track exercise sessions
       */
      workouts: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string | null;
          user_id: string;
          name: string;
          workout_date: string;
          duration_minutes: number;
          workout_type: string;
          calories_burned: number | null;
          notes: string | null;
          completed: boolean;
          difficulty_level: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          user_id: string;
          name: string;
          workout_date: string;
          duration_minutes: number;
          workout_type: string;
          calories_burned?: number | null;
          notes?: string | null;
          completed?: boolean;
          difficulty_level?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          user_id?: string;
          name?: string;
          workout_date?: string;
          duration_minutes?: number;
          workout_type?: string;
          calories_burned?: number | null;
          notes?: string | null;
          completed?: boolean;
          difficulty_level?: string | null;
        };
      };

      /**
       * Workout_exercises table - Exercises within a workout
       */
      workout_exercises: {
        Row: {
          id: string;
          created_at: string;
          workout_id: string;
          exercise_name: string;
          sets: number;
          reps: number | null;
          weight_kg: number | null;
          duration_seconds: number | null;
          distance_meters: number | null;
          notes: string | null;
          order_in_workout: number;
        };
        Insert: {
          id?: string;
          created_at?: string;
          workout_id: string;
          exercise_name: string;
          sets: number;
          reps?: number | null;
          weight_kg?: number | null;
          duration_seconds?: number | null;
          distance_meters?: number | null;
          notes?: string | null;
          order_in_workout: number;
        };
        Update: {
          id?: string;
          created_at?: string;
          workout_id?: string;
          exercise_name?: string;
          sets?: number;
          reps?: number | null;
          weight_kg?: number | null;
          duration_seconds?: number | null;
          distance_meters?: number | null;
          notes?: string | null;
          order_in_workout?: number;
        };
      };

      /**
       * Nutrition_logs table - Track food and nutrition
       */
      nutrition_logs: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string | null;
          user_id: string;
          log_date: string;
          meal_type: string;
          food_name: string;
          calories: number;
          protein_g: number | null;
          carbs_g: number | null;
          fat_g: number | null;
          fiber_g: number | null;
          sugar_g: number | null;
          serving_size: number | null;
          serving_unit: string | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          user_id: string;
          log_date: string;
          meal_type: string;
          food_name: string;
          calories: number;
          protein_g?: number | null;
          carbs_g?: number | null;
          fat_g?: number | null;
          fiber_g?: number | null;
          sugar_g?: number | null;
          serving_size?: number | null;
          serving_unit?: string | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          user_id?: string;
          log_date?: string;
          meal_type?: string;
          food_name?: string;
          calories?: number;
          protein_g?: number | null;
          carbs_g?: number | null;
          fat_g?: number | null;
          fiber_g?: number | null;
          sugar_g?: number | null;
          serving_size?: number | null;
          serving_unit?: string | null;
          notes?: string | null;
        };
      };

      /**
       * Goals table - Track fitness goals
       */
      goals: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string | null;
          user_id: string;
          title: string;
          description: string | null;
          goal_type: string;
          target_value: number | null;
          current_value: number | null;
          start_date: string;
          target_date: string | null;
          completed: boolean;
          completed_date: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          user_id: string;
          title: string;
          description?: string | null;
          goal_type: string;
          target_value?: number | null;
          current_value?: number | null;
          start_date: string;
          target_date?: string | null;
          completed?: boolean;
          completed_date?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string | null;
          user_id?: string;
          title?: string;
          description?: string | null;
          goal_type?: string;
          target_value?: number | null;
          current_value?: number | null;
          start_date?: string;
          target_date?: string | null;
          completed?: boolean;
          completed_date?: string | null;
        };
      };

      /**
       * Measurements table - Track body measurements over time
       */
      measurements: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          measurement_date: string;
          weight_kg: number | null;
          body_fat_percentage: number | null;
          waist_cm: number | null;
          chest_cm: number | null;
          arms_cm: number | null;
          legs_cm: number | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          measurement_date: string;
          weight_kg?: number | null;
          body_fat_percentage?: number | null;
          waist_cm?: number | null;
          chest_cm?: number | null;
          arms_cm?: number | null;
          legs_cm?: number | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          measurement_date?: string;
          weight_kg?: number | null;
          body_fat_percentage?: number | null;
          waist_cm?: number | null;
          chest_cm?: number | null;
          arms_cm?: number | null;
          legs_cm?: number | null;
          notes?: string | null;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
