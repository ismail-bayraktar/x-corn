import { NextRequest, NextResponse } from 'next/server';
import { toggleAccountEnabled } from '@/lib/bot/accounts';

// PATCH /api/accounts/[id]/toggle - Hesap durumunu değiştir (aktif/pasif)
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const updatedAccount = toggleAccountEnabled(id);

    if (!updatedAccount) {
      return NextResponse.json(
        { error: 'Hesap bulunamadı' },
        { status: 404 }
      );
    }

    return NextResponse.json(updatedAccount);
  } catch (error) {
    console.error('Toggle account error:', error);
    return NextResponse.json(
      { error: 'Hesap durumu değiştirilemedi' },
      { status: 500 }
    );
  }
}
