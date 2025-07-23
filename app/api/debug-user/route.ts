import { NextResponse } from 'next/server';
import DatabaseService from '@/services/DatabaseService';

export async function POST(req: Request) {
  const { userId } = await req.json();

  console.log('🐛 DEBUG USER API: Received userId:', userId);
  
  try {
    // Test the same call that DiaryPage would make
    const entries = await DatabaseService.loadDiaryEntries(userId);
    console.log('🐛 DEBUG USER API: DatabaseService returned:', {
      count: entries.length,
      entries: entries.slice(0, 3).map(e => ({
        id: e.id,
        date: e.date.toISOString().split('T')[0],
        hasContent: !!e.diaryEntry?.trim()
      }))
    });

    return NextResponse.json({
      success: true,
      userId: userId,
      entriesFound: entries.length,
      sampleEntries: entries.slice(0, 3).map(e => ({
        id: e.id,
        date: e.date.toISOString().split('T')[0],
        hasContent: !!e.diaryEntry?.trim(),
        contentPreview: e.diaryEntry?.substring(0, 100)
      }))
    });

  } catch (error) {
    console.error('🐛 DEBUG USER API: Error:', error);
    return NextResponse.json({
      success: false,
      error: (error as Error).message,
      userId: userId
    });
  }
}
