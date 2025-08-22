import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import logger from '@/utils/logger';

// Types matching our enhanced models
type WorkoutData = {
  id: string;
  name: string;
  date: string; // ISO string
  durationMinutes: number; // Now mandatory
  calories: number; // Now mandatory
  sets?: number;
  reps?: number;
  weight?: number; // in kg
};

type LogData = {
  id: string;
  diaryEntry: string;
  date: string; // ISO string
  workouts: WorkoutData[];
  injuries: string[];
  suggestions: string[]; // Always array for consistency
};

export async function POST(req: Request) {
  const { diaryText, logDate } = await req.json();

  if (!diaryText || !logDate) {
    return NextResponse.json(
      { error: 'Missing diaryText or logDate' },
      { status: 400 }
    );
  }

  const prompt = `
You are a fitness AI assistant. Analyze the following diary entry and return a structured JSON response.

CRITICAL REQUIREMENTS:
1. Extract ALL workouts mentioned (even casual activities)
2. For each workout, ALWAYS estimate duration in minutes (mandatory)
3. For each workout, ALWAYS estimate calories burned (mandatory)
4. Provide 2-3 helpful suggestions for improvement or encouragement
5. Identify any injuries, pain, or discomfort mentioned
6. Use CONSISTENT and STANDARDIZED workout names (see naming rules below)

🏷️ WORKOUT NAMING STANDARDS - BE RIGOROUS AND CONSISTENT:
Use these EXACT standard names (case-sensitive). Never create variations!

CARDIO ACTIVITIES:
- "Running" (not "jogging", "jog", "run")
- "Cycling" (not "bike ride", "biking", "bicycle")
- "Walking" (not "stroll", "walk")
- "Swimming" (not "swim")
- "Rowing" (not "row")
- "Elliptical" (not "elliptical machine")
- "Treadmill" (not "treadmill running")
- "Stair Climbing" (not "stairs", "stairmaster")
- "Dancing" (not "dance")
- "Hiking" (not "hike")
- "Jump Rope" (not "jumping rope", "skipping")

STRENGTH TRAINING:
- "Push-ups" (not "pushups", "push up")
- "Pull-ups" (not "pullups", "pull up")
- "Squats" (not "squat")
- "Deadlifts" (not "deadlift")
- "Bench Press" (not "bench pressing")
- "Overhead Press" (not "shoulder press", "military press")
- "Bicep Curls" (not "curls", "arm curls")
- "Tricep Dips" (not "dips")
- "Lunges" (not "lunge")
- "Planks" (not "plank", "plank hold")
- "Burpees" (not "burpee")
- "Mountain Climbers" (not "mountain climber")

FLEXIBILITY & RECOVERY:
- "Yoga" (not "yoga session")
- "Stretching" (not "stretch")
- "Pilates" (not "pilates class")
- "Foam Rolling" (not "foam roller")

SPORTS:
- "Basketball" (not "playing basketball")
- "Tennis" (not "playing tennis")
- "Table Tennis" (not "ping pong")
- "Badminton" (not "playing badminton")
- "Rugby" (not "playing rugby")
- "Horse Riding" (not "horse riding")
- "Gymnastics" (not "gymnastics class")
- "Golf" (not "playing golf")
- "Volleyball" (not "playing volleyball")
- "Baseball" (not "playing baseball")
- "Soccer" (not "football", "playing soccer")
- "Golf" (not "playing golf")
- "Volleyball" (not "playing volleyball")

🚨 IMPORTANT WORKOUT DATA STRUCTURE RULES:
For each workout, you can ONLY use one of these two patterns:

PATTERN 1 - Duration-based workouts (cardio, yoga, walking, etc):
{
  "name": "Running",
  "durationMinutes": 30,
  "calories": 300
  // NO sets, reps, or weight fields
}

PATTERN 2 - Sets-based workouts (strength training, weightlifting, etc):
{
  "name": "Bench Press",
  "durationMinutes": 20,
  "calories": 150,
  "sets": 3,
  "reps": 10,
  "weight": 80  // optional, only if mentioned
}

🚨 NEVER include sets without reps or reps without sets!
🚨 If you include sets, you MUST also include reps!
🚨 Weight is only optional when both sets AND reps are present!
🚨 ALWAYS use the EXACT standard names from the list above!

Return ONLY valid JSON in this exact format:
{
  "workouts": [
    {
      "name": "Exercise name",
      "durationMinutes": 30,
      "calories": 250,
      "sets": 3,
      "reps": 10,
      "weight": 80
    }
  ],
  "injuries": ["injury description"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Rules:
- durationMinutes is MANDATORY for every workout (estimate if not given)
- calories is MANDATORY for every workout (estimate based on workout type, duration, and intensity)
- If the workout involves sets/reps (strength training): BOTH sets AND reps are MANDATORY
- If the workout is duration-based (cardio, yoga): DO NOT include sets, reps, or weight
- Weight is optional and only valid when both sets AND reps are present
- Include weight in kg (convert if needed)
- Always provide 2-3 constructive suggestions
- Return empty array [] if no workouts/injuries found

Diary entry for ${logDate}:
${diaryText}
`;

  try {
    // Initialize the Google GenAI client
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    // Make API call
    logger.api('Making Gemini API call...');
    let rawText = '';
    
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt,      });
      rawText = response.text || '';
      logger.api('Gemini API call successful, response length:', rawText.length);
      
    } catch (genError: any) {
      logger.error('Gemini API Error Details:', {
        message: genError.message,
        status: genError.status,
        code: genError.code,
        name: genError.name
      });
      
      // Throw the original error so we can see Google's exact message
      throw genError;
    }

    if (!rawText) {
      throw new Error('No response from Gemini API');
    }

    let parsedData: {
      workouts: Omit<WorkoutData, 'id' | 'date'>[];
      injuries: string[];
      suggestions: string[];
    };

    try {
      // Clean the raw Gemini response
      const cleaned = rawText.trim()
        .replace(/^```json/, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      parsedData = JSON.parse(cleaned);

      // Validate required fields
      if (!Array.isArray(parsedData.workouts)) parsedData.workouts = [];
      if (!Array.isArray(parsedData.injuries)) parsedData.injuries = [];
      if (!Array.isArray(parsedData.suggestions)) parsedData.suggestions = [];

      // Validate and clean workout data structure
      parsedData.workouts = parsedData.workouts.map((workout, index) => {
        const cleanedWorkout: any = {
          name: workout.name || `Workout ${index + 1}`,
          durationMinutes: workout.durationMinutes || 30, // Default 30 minutes if missing
          calories: workout.calories || 200, // Default 200 calories if missing
        };

        // Validate sets/reps consistency
        const hasSets = workout.sets !== undefined && workout.sets !== null && workout.sets > 0;
        const hasReps = workout.reps !== undefined && workout.reps !== null && workout.reps > 0;
        const hasWeight = workout.weight !== undefined && workout.weight !== null && workout.weight > 0;

        if (hasSets && hasReps) {
          // Valid sets-based workout: both sets and reps are present
          cleanedWorkout.sets = workout.sets;
          cleanedWorkout.reps = workout.reps;
          if (hasWeight) {
            cleanedWorkout.weight = workout.weight;
          }
        } else if (hasSets && !hasReps) {
          // Invalid: sets without reps - convert to duration-based
          console.warn(`⚠️ Workout "${workout.name}" has sets but no reps - converting to duration-based`);
          // Don't include sets, reps, or weight
        } else if (!hasSets && hasReps) {
          // Invalid: reps without sets - convert to duration-based
          console.warn(`⚠️ Workout "${workout.name}" has reps but no sets - converting to duration-based`);
          // Don't include sets, reps, or weight
        } else {
          // Valid duration-based workout: no sets or reps
          // Don't include sets, reps, or weight
        }

        return cleanedWorkout;
      });

    } catch (err) {
      logger.error('Failed to parse Gemini JSON:', err);
      logger.debug('Raw response:', rawText);
      
      // Return fallback response
      parsedData = {
        workouts: [],
        injuries: [],
        suggestions: ['⚠️ AI parsing failed. Please try again with a clearer description.'],
      };
    }

    // Generate unique IDs and add dates to workouts
    const workoutsWithIds: WorkoutData[] = parsedData.workouts.map((workout, index) => ({
      ...workout,
      id: `workout_${Date.now()}_${index}`,
      date: logDate,
    }));

    // Create the complete log data structure
    const logData: Omit<LogData, 'id'> = {
      diaryEntry: diaryText,
      date: logDate,
      workouts: workoutsWithIds,
      injuries: parsedData.injuries,
      suggestions: parsedData.suggestions,
    };

    logger.api('Successfully processed diary with Gemini:', {
      workoutsFound: workoutsWithIds.length,
      injuriesFound: parsedData.injuries.length,
      suggestionsGenerated: parsedData.suggestions.length,
    });
    
    // Log workout structure for debugging
    workoutsWithIds.forEach((workout, index) => {
      const workoutType = (workout.sets && workout.reps) ? 'sets-based' : 'duration-based';
      logger.debug(`Workout ${index + 1}: "${workout.name}" (${workoutType})`, {
        durationMinutes: workout.durationMinutes,
        calories: workout.calories,
        sets: workout.sets,
        reps: workout.reps,
        weight: workout.weight
      });
    });

    return NextResponse.json({ logData });

  } catch (error) {
    logger.error('Gemini API error:', error);
    
    // Determine appropriate error message based on error type
    let errorMessage = '❗ AI processing failed. Your diary has been saved as-is.';
    let statusCode = 500;
    
    const errorString = error instanceof Error ? error.message : String(error);
    
    if (errorString.includes('Rate limit exceeded') || errorString.includes('429')) {
      errorMessage = '😅 AI is taking a break due to high usage. Your diary has been saved, but AI analysis is temporarily unavailable. Please try again in a few minutes.';
      statusCode = 429;
    } else if (errorString.includes('503') || errorString.includes('service unavailable')) {
      errorMessage = '🔧 AI service is temporarily unavailable. Your diary has been saved, but analysis will be added later.';
      statusCode = 503;
    } else if (errorString.includes('API key') || errorString.includes('401') || errorString.includes('403')) {
      errorMessage = '🔑 AI configuration issue. Your diary has been saved without AI analysis.';
      statusCode = 500;
    }
    
    // Return fallback response with appropriate error message
    const fallbackLogData: Omit<LogData, 'id'> = {
      diaryEntry: diaryText,
      date: logDate,
      workouts: [],
      injuries: [],
      suggestions: [errorMessage],
    };

    return NextResponse.json({ logData: fallbackLogData }, { status: statusCode });
  }
}
