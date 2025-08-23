import { NextRequest, NextResponse } from 'next/server';

async function query(data: any) {
	const response = await fetch(
		"https://api-inference.huggingface.co/models/oliverguhr/fullstop-punctuation-multilang-large",
		{
			headers: {
				Authorization: `Bearer ${process.env.HF_API_TOKEN}`,
				"Content-Type": "application/json",
			},
			method: "POST",
			body: JSON.stringify(data),
		}
	);
	const result = await response.json();
	return result;
}

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Text is required and must be a string' },
        { status: 400 }
      );
    }

    const result = await query({ inputs: text });
    
    // Reconstruct text with punctuation from token classification
    const punctuatedText = reconstructText(text, result);
    
    return NextResponse.json({
      originalText: text,
      punctuatedText: punctuatedText,
      success: true
    });

  } catch (error) {
    console.error('Punctuation API error:', error);
    return NextResponse.json({
      originalText: text,
      punctuatedText: text, // Fallback to original
      success: false
    }, { status: 500 });
  }
}

function reconstructText(originalText: string, tokens: any[]): string {
  if (!Array.isArray(tokens) || tokens.length === 0) {
    return originalText;
  }

  let result = '';
  
  for (const token of tokens) {
    // Add the word
    result += token.word;
    
    // Add punctuation if the entity_group is not '0'
    if (token.entity_group !== '0') {
      result += token.entity_group;
    }
    
    // Add space (except for the last token)
    if (token !== tokens[tokens.length - 1]) {
      result += ' ';
    }
  }
  
  // Capitalize first letter
  if (result.length > 0) {
    result = result.charAt(0).toUpperCase() + result.slice(1);
  }
  
  return result;
}