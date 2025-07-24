import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export async function GET() {
  // Simple test to check if Gemini API key is configured
  const hasApiKey = !!process.env.GEMINI_API_KEY;
  
  return NextResponse.json({ 
    hasGeminiKey: hasApiKey,
    message: hasApiKey 
      ? '✅ Gemini API key is configured' 
      : '❌ GEMINI_API_KEY environment variable is missing'
  });
}

export async function POST(req: Request) {
  const { testText } = await req.json();
  
  if (!process.env.GEMINI_API_KEY) {
    return NextResponse.json(
      { error: 'GEMINI_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    // Initialize the Google GenAI client using the pattern from your guide
    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

    // Generate content using the API pattern from your guide
    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash-exp',
      contents: testText || 'Hello, are you working?',
    });

    return NextResponse.json({ 
      success: true, 
      response: response.text,
      message: '✅ Gemini API is working correctly'
    });

  } catch (error) {
    console.error('❌ Gemini test failed:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '❌ Gemini API test failed'
      },
      { status: 500 }
    );
  }
}
