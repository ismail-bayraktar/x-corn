// Tekil hesap API (güncelleme ve silme)

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Account from '@/lib/db/models/Account';
import { TwitterCookie } from '@/lib/bot/types';

// GET: Tekil hesap getir
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const account = await Account.findOne({ id: params.id }).lean();

    if (!account) {
      return NextResponse.json({ error: 'Hesap bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(account);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT: Hesap güncelle
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, canComment, useAI, authToken, ct0 } = body;

    // Mevcut hesabı al
    const existingAccount = await Account.findOne({ id: params.id });
    if (!existingAccount) {
      return NextResponse.json(
        { error: 'Hesap bulunamadı' },
        { status: 404 }
      );
    }

    // Cookie güncelleme varsa yeniden oluştur
    let cookies: TwitterCookie[] | undefined;

    if (authToken || ct0) {
      // Yeni cookie değerleri
      const newAuthToken = authToken || existingAccount.cookies.find((c: TwitterCookie) => c.name === 'auth_token')?.value || '';
      const newCt0 = ct0 || existingAccount.cookies.find((c: TwitterCookie) => c.name === 'ct0')?.value || '';

      cookies = [
        {
          name: 'auth_token',
          value: newAuthToken,
          domain: '.x.com',
          path: '/',
          httpOnly: true,
          secure: true,
        },
        {
          name: 'ct0',
          value: newCt0,
          domain: '.x.com',
          path: '/',
          httpOnly: true,
          secure: true,
        },
      ];
    }

    // Güncelleme objesi
    const updateData: Record<string, unknown> = {
      updatedAt: new Date().toISOString(),
    };

    if (name) updateData.name = name;
    if (typeof canComment === 'boolean') updateData.canComment = canComment;
    if (typeof useAI === 'boolean') updateData.useAI = useAI;
    if (cookies) updateData.cookies = cookies;

    const updatedAccount = await Account.findOneAndUpdate(
      { id: params.id },
      { $set: updateData },
      { new: true }
    ).lean();

    if (!updatedAccount) {
      return NextResponse.json({ error: 'Hesap bulunamadı' }, { status: 404 });
    }

    return NextResponse.json(updatedAccount);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// DELETE: Hesap sil
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();

    const deleted = await Account.findOneAndDelete({ id: params.id });

    if (!deleted) {
      return NextResponse.json({ error: 'Hesap bulunamadı' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
