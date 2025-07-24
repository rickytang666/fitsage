import { NextResponse } from 'next/server';

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
3. If sets/reps mentioned, include them; if weight mentioned, include it in kg
4. Provide 2-3 helpful suggestions for improvement or encouragement
5. Identify any injuries, pain, or discomfort mentioned

Return ONLY valid JSON in this exact format:
{
  "workouts": [
    {
      "name": "Exercise name",
      "durationMinutes": 30,
      "sets": 3,
      "reps": 10,
      "weight": 80,
      "calories": 250
    }
  ],
  "injuries": ["injury description"],
  "suggestions": ["suggestion 1", "suggestion 2", "suggestion 3"]
}

Rules:
- durationMinutes is MANDATORY for every workout (estimate if not given)
- calories is MANDATORY for every workout (estimate based on workout type, duration, and intensity)
- sets, reps, weight are optional (only include if mentioned or can be reasonably estimated)
- Include weight in kg (convert if needed)
- Always provide 2-3 constructive suggestions
- Return empty array [] if no workouts/injuries found

Diary entry for ${logDate}:
${diaryText}
`;

  try {
    // Retry logic for Gemini API with exponential backoff
    let response: Response | undefined;
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
            }),
          }
        );

        if (response.ok) {
          break; // Success, exit retry loop
        }
        
        if (response.status === 503 && attempts < maxAttempts - 1) {
          // 503 Service Unavailable - retry with exponential backoff
          const delay = Math.pow(2, attempts) * 1000; // 1s, 2s, 4s
          console.log(`⚠️ Gemini API returned 503, retrying in ${delay}ms (attempt ${attempts + 1}/${maxAttempts})`);
          await new Promise(resolve => setTimeout(resolve, delay));
          attempts++;
          continue;
        }
        
        // Non-503 error or max attempts reached
        throw new Error(`Gemini API returned ${response.status}`);
        
      } catch (fetchError) {
        if (attempts === maxAttempts - 1) {
          throw fetchError; // Last attempt failed
        }
        attempts++;
        const delay = Math.pow(2, attempts) * 1000;
        console.log(`⚠️ Gemini API request failed, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (!response || !response.ok) {
      throw new Error(`Gemini API failed after ${maxAttempts} attempts`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

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

      // Ensure every workout has duration and calories
      parsedData.workouts = parsedData.workouts.map(workout => ({
        ...workout,
        durationMinutes: workout.durationMinutes || 30, // Default 30 minutes if missing
        calories: workout.calories || 200, // Default 200 calories if missing
      }));

    } catch (err) {
      console.error('❌ Failed to parse Gemini JSON:', err);
      console.error('Raw response:', rawText);
      
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

    console.log('✅ Successfully processed diary with Gemini:', {
      workoutsFound: workoutsWithIds.length,
      injuriesFound: parsedData.injuries.length,
      suggestionsGenerated: parsedData.suggestions.length,
    });

    return NextResponse.json({ logData });

  } catch (error) {
    console.error('❌ Gemini API error:', error);
    
    // Return fallback response on error
    const fallbackLogData: Omit<LogData, 'id'> = {
      diaryEntry: diaryText,
      date: logDate,
      workouts: [],
      injuries: [],
      suggestions: ['❌ AI processing failed. Your diary has been saved as-is.'],
    };

    return NextResponse.json({ logData: fallbackLogData });
  }
}
