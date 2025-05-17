import { NextResponse } from 'next/server';

type Summary = {
  exercise: string[];
  injuries: string[];
  notes: string[];
};

export async function POST(req: Request) {
  const { text } = await req.json();

  const prompt = `
Summarize the following fitness diary entry as a JSON object.

Your response must use this format exactly:
{
  "exercise": ["activity — duration/sets/reps"],
  "injuries": ["description — what caused it or during what activity"],
  "notes": ["mood, hydration, sleep, or any other important note"]
}

Only return valid JSON. No commentary or headings.

Diary entry:
${text}
`;

  try {
    const response = await fetch(
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

    const data = await response.json();

    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    let summary: Summary = {
      exercise: [],
      injuries: [],
      notes: [],
    };

    try {
        // Clean the raw Gemini response
        const cleaned = rawText.trim()
        .replace(/^```json/, '')  // remove opening ```json
        .replace(/^```/, '')      // fallback if just ```
        .replace(/```$/, '')      // remove closing ```
        .trim();

        summary = JSON.parse(cleaned);

    } catch (err) {
      console.error('❌ Failed to parse Gemini JSON:', err);
      summary.notes = ['⚠️ AI returned invalid JSON.'];
    }

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json(
      {
        summary: {
          exercise: [],
          injuries: [],
          notes: ['❌ Failed to generate summary.'],
        },
      },
      { status: 500 }
    );
  }
}
