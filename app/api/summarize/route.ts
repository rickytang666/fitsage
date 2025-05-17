import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const { text } = await req.json();

  const prompt = `
Please summarize the following diary entry into clear bullet points focusing on:
- workout (what exercises and how long for each)
- injury
- any important notes that may affect future workout plans suggestions

Text:
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

    // 🔍 This is the most important part to debug:
    console.log('=== GEMINI RAW RESPONSE ===');
    console.dir(data, { depth: null });

    // Try several fallback paths:
    const summary =
      data?.candidates?.[0]?.content?.parts?.[0]?.text ??
      data?.candidates?.[0]?.content?.text ??
      data?.candidates?.[0]?.output ??
      'No summary available.';

    return NextResponse.json({ summary });
  } catch (error) {
    console.error('Gemini API error:', error);
    return NextResponse.json({ summary: 'Failed to generate summary.' }, { status: 500 });
  }
}
