// Hesap CRUD API

import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Account from '@/lib/db/models/Account';
import { TwitterCookie } from '@/lib/bot/types';

// GET: Tüm hesapları getir
export async function GET() {
  try {
    await connectDB();
    const accounts = await Account.find({}).lean();
    return NextResponse.json(accounts);
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// POST: Yeni hesap ekle
export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { name, canComment, useAI, authToken, ct0 } = body;

    // Validasyon
    if (!name || !authToken || !ct0) {
      return NextResponse.json(
        { error: 'name, authToken ve ct0 alanları gerekli' },
        { status: 400 }
      );
    }

    // Cookie oluştur
    const cookies: TwitterCookie[] = [
      {
        name: 'auth_token',
        value: authToken,
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      {
        name: 'ct0',
        value: ct0,
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
    ];

    const now = new Date().toISOString();
    const newAccount = await Account.create({
      id: `account-${Date.now()}`,
      name,
      canComment: canComment ?? true,
      useAI: useAI ?? false,
      enabled: true,
      cookies,
      createdAt: now,
      updatedAt: now,
    });

    return NextResponse.json(newAccount, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
