import { NextRequest, NextResponse } from 'next/server';

const GROQ_API_URL = 'https://api.groq.com/openai/v1/chat/completions';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, options = {} } = body;

    const apiKey = process.env.NEXT_PUBLIC_GROQ_API_KEY;
    
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(GROQ_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: options.model || 'llama-3.3-70b-versatile',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.max_tokens || 1024,
        stream: false,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.error?.message || 'Groq API request failed' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';
    
    return NextResponse.json({ content });
  } catch (error: any) {
    console.error('Groq API error:', error);
    return NextResponse.json(
      { error: `AI chat failed: ${error.message}` },
      { status: 500 }
    );
  }
}
