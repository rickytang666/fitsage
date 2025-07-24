import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import DatabaseService from '@/services/DatabaseService';
import { FeaturedWorkout } from '@/models/User';

// Configure the number of days to look back for context (as per design: past 3 days)
const CONTEXT_DAYS = 3;

type AIResponseData = {
  suggestions: string[];
  featuredWorkouts: {
    name: string;
    durationMinutes?: number;
    sets?: number;
    reps?: number;
    weight?: number;
    difficultyLevel: 'all level' | 'beginner' | 'intermediate' | 'advanced';
    estimatedCalories?: number;
    description?: string;
  }[];
};

// Using shared rate limiter for consistency with diary API

export async function POST(req: Request) {
  const { userId, diaryEntries } = await req.json();

  console.log('🔍 Featured workouts API called with userId:', userId);
  console.log('📚 Received shared diary entries:', diaryEntries?.length || 0);
  
  // Note: Removed artificial rate limiting - let Google's API handle actual rate limits
  // This prevents confusing user experience where rate limit message shows even when API succeeds

  if (!userId) {
    console.log('❌ No userId provided to API');
    return NextResponse.json(
      { error: 'Missing userId' },
      { status: 400 }
    );
  }

  try {
    // Step 4: Use shared diary entries instead of loading again
    console.log(`🔍 Processing shared diary entries for context analysis...`);
    
    // Use shared diary entries or load them if not provided (fallback)
    let allDiaryEntries;
    if (diaryEntries && Array.isArray(diaryEntries)) {
      // Convert plain objects back to proper Log objects with Date objects
      allDiaryEntries = diaryEntries.map(entry => ({
        ...entry,
        date: new Date(entry.date) // Convert date string back to Date object
      }));
      console.log('� Using shared diary entries:', allDiaryEntries.length);
    } else {
      console.log('📚 Fallback: Loading diary entries from database...');
      allDiaryEntries = await DatabaseService.loadDiaryEntries(userId);
    }
    
    console.log(`📊 Total diary entries available: ${allDiaryEntries.length} (size: ${allDiaryEntries.length})`);
    console.log('📋 First few entries:', allDiaryEntries.slice(0, 3).map(entry => ({
      date: entry.date.toLocaleDateString(),
      hasEntry: !!entry.diaryEntry,
      entryLength: entry.diaryEntry?.length || 0
    })));
    
    // Calculate 3-day range for filtering (today, yesterday, day before yesterday)
    const today = new Date();
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(today.getDate() - (CONTEXT_DAYS - 1)); // 3 days ago including today
    threeDaysAgo.setHours(0, 0, 0, 0);
    today.setHours(23, 59, 59, 999);
    
    // Take top 3 most recent entries (they should be sorted latest to oldest)
    const topRecentEntries = allDiaryEntries.slice(0, 3);
    
    // Filter out entries that are outside the 3-day range
    const validRecentEntries = topRecentEntries.filter(entry => 
      entry.date >= threeDaysAgo && entry.date <= today
    );
    
    console.log(`🎯 Context collection strategy:`, {
      dateRange: `${threeDaysAgo.toLocaleDateString()} - ${today.toLocaleDateString()}`,
      top3Recent: topRecentEntries.map(e => e.date.toLocaleDateString()),
      validAfterFiltering: validRecentEntries.map(e => e.date.toLocaleDateString()),
      contextDays: CONTEXT_DAYS
    });
    
    // Create a complete 3-day context with empty entries for missing days
    const contextEntries: Array<{date: Date, diaryEntry: string | null}> = [];
    
    // Generate all 3 days (today, yesterday, day before)
    for (let i = 0; i < CONTEXT_DAYS; i++) {
      const targetDate = new Date();
      targetDate.setDate(today.getDate() - i);
      targetDate.setHours(12, 0, 0, 0); // Set to noon for consistent comparison
      
      // Find matching diary entry for this date
      const matchingEntry = validRecentEntries.find(entry => {
        const entryDate = new Date(entry.date);
        entryDate.setHours(12, 0, 0, 0);
        return entryDate.toDateString() === targetDate.toDateString();
      });
      
      contextEntries.push({
        date: targetDate,
        diaryEntry: matchingEntry?.diaryEntry || null
      });
    }

    // Prepare context text for AI
    let contextText = '';
    if (contextEntries.length === 0 || contextEntries.every(entry => !entry.diaryEntry)) {
      contextText = `User hasn't written any diary entries for the past ${CONTEXT_DAYS} days.`;
    } else {
      const diaryTexts: string[] = [];
      contextEntries.forEach(entry => {
        const dateStr = entry.date.toLocaleDateString('en-US', { 
          weekday: 'long', 
          month: 'short', 
          day: 'numeric' 
        });
        
        if (entry.diaryEntry && entry.diaryEntry.trim()) {
          diaryTexts.push(`${dateStr}:\n"${entry.diaryEntry.trim()}"`);
        } else {
          diaryTexts.push(`${dateStr}: No diary entry`);
        }
      });
      
      contextText = diaryTexts.join('\n\n');
    }

    console.log('📝 Final workout context prepared:', { 
      totalValidEntries: validRecentEntries.length,
      contextEntriesGenerated: contextEntries.length,
      contextLength: contextText.length,
      hasContent: contextEntries.some(entry => entry.diaryEntry)
    });

    // Prepare debug information for frontend - show diary entries count
    const debugText = `${allDiaryEntries.length}`;

    // Step 5: Generate AI recommendations with context
    const prompt = `
You are a professional fitness AI coach. Based on the user's diary entries from the past ${CONTEXT_DAYS} days, provide personalized workout recommendations.

USER'S DIARY ENTRIES:
${contextText}

REQUIREMENTS:
1. Analyze the user's fitness journey, mood, and activities from their diary entries
2. Generate 2-3 bullet points of helpful suggestions for future workouts based on their story
3. Generate 6-10 featured workout recommendations that fit their fitness level and preferences
4. Each workout should include: name, difficulty level, and workout details
5. Use realistic difficulty levels: "all level", "beginner", "intermediate", "advanced"
6. Include either duration (for cardio/yoga) OR sets/reps/weight (for strength training)
7. Estimate calories burned for each workout
8. Make recommendations varied and appropriate based on what you can understand from their diary entries

Return ONLY valid JSON in this exact format:
{
  "suggestions": [
    "suggestion 1",
    "suggestion 2", 
    "suggestion 3"
  ],
  "featuredWorkouts": [
    {
      "name": "Workout Name",
      "description": "Brief description (optional)",
      "durationMinutes": 30,
      "estimatedCalories": 250,
      "difficultyLevel": "beginner"
    },
    {
      "name": "Strength Workout",
      "sets": 3,
      "reps": 12,
      "weight": 20,
      "estimatedCalories": 180,
      "difficultyLevel": "intermediate"
    }
  ]
}

Rules:
- Provide 2-3 concise, actionable suggestions based on their diary stories
- Generate 6-10 diverse workout recommendations
- Match difficulty to user's fitness level based on what you understand from their entries
- Include realistic calorie estimates
- Use either durationMinutes OR sets/reps/weight, not both
- All difficulty levels must be one of: "all level", "beginner", "intermediate", "advanced"
- If no diary entries exist, provide general beginner-friendly recommendations
`;

    // Note: No artificial rate limiting - let Google's API handle actual limits

    // Initialize the Google GenAI client using the pattern from your guide
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

    // Retry logic for Gemini API with exponential backoff
    let rawText = '';
    let attempts = 0;
    const maxAttempts = 3;
    
    while (attempts < maxAttempts) {
      try {
        const response = await ai.models.generateContent({
          model: 'gemini-2.0-flash-exp',
          contents: prompt,
        });
        rawText = response.text;
        break; // Success, exit retry loop
        
      } catch (genError: any) {
        // Handle rate limiting and service unavailable errors
        const isRateLimited = genError.message?.includes('429') || genError.message?.includes('rate');
        const isServiceUnavailable = genError.message?.includes('503') || genError.message?.includes('unavailable');
        
        if ((isRateLimited || isServiceUnavailable) && attempts < maxAttempts - 1) {
          // Calculate delay: longer for rate limits, shorter for service issues
          const baseDelay = isRateLimited ? 5000 : 1000; // 5s for rate limit, 1s for service issues
          const delay = baseDelay * Math.pow(2, attempts); // Exponential backoff
          
          const errorType = isRateLimited ? 'rate limit exceeded' : 'service unavailable';
          console.log(`⚠️ Featured workouts: Gemini API ${errorType}, retrying in ${delay}ms (attempt ${attempts + 1}/${maxAttempts})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          attempts++;
          continue;
        }
        
        // Handle rate limit with specific error message
        if (isRateLimited) {
          throw new Error('Rate limit exceeded. AI recommendations are temporarily unavailable.');
        }
        
        // Last attempt failed or other errors
        if (attempts === maxAttempts - 1) {
          throw genError;
        }
        
        attempts++;
        const delay = Math.pow(2, attempts) * 1000;
        console.log(`⚠️ Featured workouts: Gemini API request failed, retrying in ${delay}ms (attempt ${attempts}/${maxAttempts})`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    if (!rawText) {
      throw new Error('No response from Gemini API');
    }

    let parsedData: AIResponseData;

    try {
      // Clean the raw Gemini response
      const cleaned = rawText.trim()
        .replace(/^```json/, '')
        .replace(/^```/, '')
        .replace(/```$/, '')
        .trim();

      parsedData = JSON.parse(cleaned);

      // Validate and clean the data
      if (!Array.isArray(parsedData.suggestions)) parsedData.suggestions = [];
      if (!Array.isArray(parsedData.featuredWorkouts)) parsedData.featuredWorkouts = [];

      // Validate difficulty levels and clean workout data
      parsedData.featuredWorkouts = parsedData.featuredWorkouts.map(workout => {
        // Clean up the workout data
        const cleanedWorkout: any = {
          ...workout,
          difficultyLevel: ['all level', 'beginner', 'intermediate', 'advanced'].includes(workout.difficultyLevel) 
            ? workout.difficultyLevel 
            : 'all level' // Default fallback
        };

        // Remove zero or invalid values for optional fields
        if (!cleanedWorkout.durationMinutes || cleanedWorkout.durationMinutes <= 0) {
          delete cleanedWorkout.durationMinutes;
        }
        if (!cleanedWorkout.sets || cleanedWorkout.sets <= 0) {
          delete cleanedWorkout.sets;
        }
        if (!cleanedWorkout.reps || cleanedWorkout.reps <= 0) {
          delete cleanedWorkout.reps;
        }
        if (!cleanedWorkout.weight || cleanedWorkout.weight <= 0) {
          delete cleanedWorkout.weight;
        }
        if (!cleanedWorkout.estimatedCalories || cleanedWorkout.estimatedCalories <= 0) {
          delete cleanedWorkout.estimatedCalories;
        }

        return cleanedWorkout;
      });

      // Ensure we have at least some suggestions and workouts
      if (parsedData.suggestions.length === 0) {
        parsedData.suggestions = ['Keep up the great work!', 'Try to maintain consistency in your workouts.'];
      }

      if (parsedData.featuredWorkouts.length === 0) {
        // Provide fallback workouts
        parsedData.featuredWorkouts = [
          {
            name: 'Morning Walk',
            durationMinutes: 30,
            estimatedCalories: 150,
            difficultyLevel: 'all level'
          },
          {
            name: 'Basic Push-ups',
            sets: 3,
            reps: 10,
            estimatedCalories: 50,
            difficultyLevel: 'beginner'
          }
        ];
      }

    } catch (err) {
      console.error('❌ Failed to parse Gemini JSON:', err);
      console.error('Raw response:', rawText);
      
      // Return fallback response
      parsedData = {
        suggestions: [
          '⚠️ AI recommendations temporarily unavailable.',
          'Try mixing cardio and strength training for balanced fitness.',
          'Remember to stay hydrated and get adequate rest.'
        ],
        featuredWorkouts: [
          {
            name: 'Quick Cardio',
            durationMinutes: 20,
            estimatedCalories: 120,
            difficultyLevel: 'all level'
          },
          {
            name: 'Bodyweight Squats',
            sets: 3,
            reps: 15,
            estimatedCalories: 80,
            difficultyLevel: 'beginner'
          },
          {
            name: 'Plank Hold',
            durationMinutes: 2,
            estimatedCalories: 20,
            difficultyLevel: 'intermediate'
          }
        ]
      };
    }

    console.log('✅ Successfully generated AI workout recommendations:', {
      suggestionsCount: parsedData.suggestions.length,
      workoutsCount: parsedData.featuredWorkouts.length,
      contextDays: CONTEXT_DAYS
    });

    // Convert to FeaturedWorkout objects
    const featuredWorkouts = parsedData.featuredWorkouts.map((workout, index) => {
      return new FeaturedWorkout(
        `ai_${Date.now()}_${index}`,
        workout.name,
        workout.difficultyLevel,
        {
          durationMinutes: workout.durationMinutes,
          sets: workout.sets,
          reps: workout.reps,
          weight: workout.weight,
          estimatedCalories: workout.estimatedCalories,
          description: workout.description
        }
      );
    });

    return NextResponse.json({ 
      success: true,
      suggestions: parsedData.suggestions,
      featuredWorkouts: featuredWorkouts.map(fw => ({
        id: fw.id,
        name: fw.name,
        durationMinutes: fw.durationMinutes,
        sets: fw.sets,
        reps: fw.reps,
        weight: fw.weight,
        difficultyLevel: fw.difficultyLevel,
        estimatedCalories: fw.estimatedCalories,
        description: fw.description
      })),
      debug: {
        contextText: debugText,
        meta: {
          validEntries: validRecentEntries.length,
          contextEntries: contextEntries.length,
          contextLength: contextText.length,
          hasContent: contextEntries.some(entry => entry.diaryEntry)
        }
      },
      meta: {
        contextDays: CONTEXT_DAYS,
        workoutHistory: validRecentEntries.length > 0 ? `${validRecentEntries.length} diary entries analyzed` : 'No recent diary entries'
      }
    });

  } catch (error) {
    console.error('❗ Featured workouts API error:', error);
    
    // Determine appropriate error message and suggestions based on error type
    let suggestions = [
      '❗ AI recommendations temporarily unavailable.',
      'Focus on consistency - even 10 minutes of daily activity helps!',
      'Mix different types of exercises to keep things interesting.'
    ];
    
    const errorString = error instanceof Error ? error.message : String(error);
    
    if (errorString.includes('Rate limit exceeded') || errorString.includes('429')) {
      suggestions = [
        '😅 AI workout recommendations are taking a break due to high usage.',
        '⏰ Please wait a few minutes and refresh the page to get personalized recommendations.',
        '💪 While waiting, try the basic workouts below or go for a walk!'
      ];
    } else if (errorString.includes('503') || errorString.includes('service unavailable')) {
      suggestions = [
        '🔧 AI service is temporarily down for maintenance.',
        '🏋️ Try the basic workouts below while we get things back up!',
        '✨ Your personalized recommendations will return soon.'
      ];
    }
    
    // Return fallback response on error
    const fallbackWorkouts = [
      new FeaturedWorkout('fallback_1', 'Simple Walk', 'all level', { 
        durationMinutes: 15, 
        estimatedCalories: 75,
        description: 'A gentle walk to stay active'
      }),
      new FeaturedWorkout('fallback_2', 'Basic Stretching', 'all level', { 
        durationMinutes: 10, 
        estimatedCalories: 30,
        description: 'Light stretching for flexibility'
      }),
      new FeaturedWorkout('fallback_3', 'Bodyweight Squats', 'beginner', { 
        sets: 2, 
        reps: 10,
        estimatedCalories: 40,
        description: 'Simple strength exercise'
      })
    ];

    return NextResponse.json({
      success: false,
      suggestions: suggestions,
      featuredWorkouts: fallbackWorkouts.map(fw => ({
        id: fw.id,
        name: fw.name,
        durationMinutes: fw.durationMinutes,
        sets: fw.sets,
        reps: fw.reps,
        weight: fw.weight,
        difficultyLevel: fw.difficultyLevel,
        estimatedCalories: fw.estimatedCalories,
        description: fw.description
      })),
      debug: {
        contextText: 'Error occurred before context could be prepared',
        meta: {
          validEntries: 0,
          contextEntries: 0,
          contextLength: 0,
          hasContent: false
        }
      },
      meta: {
        contextDays: CONTEXT_DAYS,
        error: 'AI processing failed, showing fallback recommendations'
      }
    });
  }
}
