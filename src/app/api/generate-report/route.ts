import { NextResponse } from 'next/server';
import { generateReport } from '@/ai/flows/chatbot-generate-report';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { conversationHistory, analysisContext } = body ?? {};

    if (typeof conversationHistory !== 'string' || typeof analysisContext !== 'string') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const result = await generateReport({ conversationHistory, analysisContext });
    return NextResponse.json(result);
  } catch (err) {
    console.error('generate-report error:', err);
    return NextResponse.json({ error: 'Failed to generate report' }, { status: 500 });
  }
}
