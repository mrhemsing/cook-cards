import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    message: 'API is working',
    hasOpenAIKey: !!process.env.OPENAI_API_KEY,
    openAIKeyLength: process.env.OPENAI_API_KEY
      ? process.env.OPENAI_API_KEY.length
      : 0,
    timestamp: new Date().toISOString()
  });
}
