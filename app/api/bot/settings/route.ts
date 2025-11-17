import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import BotSettings from '@/lib/db/models/BotSettings';

const SETTINGS_ID = 'global';

// GET: Bot ayarlarını getir
export async function GET() {
  try {
    await connectDB();

    let settings = await BotSettings.findOne({ id: SETTINGS_ID }).lean();

    // Eğer ayarlar yoksa varsayılan ayarları oluştur
    if (!settings) {
      const now = new Date().toISOString();
      settings = await BotSettings.create({
        id: SETTINGS_ID,
        autoDistribution: {
          enabled: false,
          likePercentage: 100,
          retweetPercentage: 30,
          commentPercentage: 35,
        },
        createdAt: now,
        updatedAt: now,
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Settings GET error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT: Bot ayarlarını güncelle
export async function PUT(request: NextRequest) {
  try {
    await connectDB();
    const body = await request.json();

    const { autoDistribution } = body;

    // Validasyon
    if (autoDistribution) {
      const { likePercentage, retweetPercentage, commentPercentage } = autoDistribution;

      if (
        likePercentage < 0 || likePercentage > 100 ||
        retweetPercentage < 0 || retweetPercentage > 100 ||
        commentPercentage < 0 || commentPercentage > 100
      ) {
        return NextResponse.json(
          { error: 'Yüzde değerleri 0-100 arasında olmalıdır' },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();

    const updatedSettings = await BotSettings.findOneAndUpdate(
      { id: SETTINGS_ID },
      {
        $set: {
          ...body,
          updatedAt: now,
        }
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    return NextResponse.json(updatedSettings);
  } catch (error) {
    console.error('Settings PUT error:', error);
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
