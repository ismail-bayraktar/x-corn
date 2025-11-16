// Bot stats API

import { NextResponse } from 'next/server';
import { loadStatsFromDB } from '@/lib/bot/stats';

// GET: İstatistikleri getir
export async function GET() {
  try {
    const stats = await loadStatsFromDB();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
