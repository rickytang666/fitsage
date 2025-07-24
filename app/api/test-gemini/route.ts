import { NextResponse } from 'next/server';

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
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{ parts: [{ text: testText || 'Hello, are you working?' }] }],
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';

    return NextResponse.json({ 
      success: true, 
      response: rawText,
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
