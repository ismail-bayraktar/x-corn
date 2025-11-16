// Bot istatistik yönetimi (MongoDB ile)

import connectDB from '@/lib/db/mongodb';
import Activity from '@/lib/db/models/Activity';

export interface BotActivity {
  id: string;
  tweetUrl: string;
  accountName: string;
  actions: {
    liked: boolean;
    retweeted: boolean;
    commented: boolean;
  };
  timestamp: string;
}

export interface BotStats {
  totalRuns: number;
  totalLikes: number;
  totalRetweets: number;
  totalComments: number;
  lastActivity?: BotActivity;
  recentActivities: BotActivity[];
}

const MAX_ACTIVITIES = 50;

function getDefaultStats(): BotStats {
  return {
    totalRuns: 0,
    totalLikes: 0,
    totalRetweets: 0,
    totalComments: 0,
    recentActivities: [],
  };
}

// İstatistikleri yükle (client-side için localStorage fallback)
export function loadStats(): BotStats {
  if (typeof window === 'undefined') {
    return getDefaultStats();
  }

  // Client-side'da localStorage'dan oku (geçici fallback)
  const stored = localStorage.getItem('twitter_bot_stats');
  if (!stored) {
    return getDefaultStats();
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Stats load error:', error);
    return getDefaultStats();
  }
}

// İstatistikleri MongoDB'den yükle (server-side)
export async function loadStatsFromDB(): Promise<BotStats> {
  try {
    await connectDB();

    // Tüm aktiviteleri al
    const activities = await Activity.find({})
      .sort({ timestamp: -1 })
      .limit(MAX_ACTIVITIES)
      .lean();

    // İstatistikleri hesapla
    const totalRuns = activities.length;
    const totalLikes = activities.filter((a: BotActivity) => a.actions.liked).length;
    const totalRetweets = activities.filter((a: BotActivity) => a.actions.retweeted).length;
    const totalComments = activities.filter((a: BotActivity) => a.actions.commented).length;

    return {
      totalRuns,
      totalLikes,
      totalRetweets,
      totalComments,
      lastActivity: activities[0] as BotActivity | undefined,
      recentActivities: activities as BotActivity[],
    };
  } catch (error) {
    console.error('Stats yüklenemedi:', error);
    return getDefaultStats();
  }
}

// Aktivite ekle (MongoDB'ye kaydet)
export async function addActivity(activity: BotActivity): Promise<void> {
  try {
    await connectDB();

    // Yeni aktiviteyi kaydet
    await Activity.create(activity);

    // Eski aktiviteleri temizle (MAX_ACTIVITIES'den fazlaysa)
    const count = await Activity.countDocuments();
    if (count > MAX_ACTIVITIES) {
      const oldestActivities = await Activity.find({})
        .sort({ timestamp: 1 })
        .limit(count - MAX_ACTIVITIES);

      const idsToDelete = oldestActivities.map((a: { id: string }) => a.id);
      await Activity.deleteMany({ id: { $in: idsToDelete } });
    }
  } catch (error) {
    console.error('Aktivite kaydedilemedi:', error);
  }
}

// İstatistikleri sıfırla
export async function resetStats(): Promise<void> {
  try {
    await connectDB();
    await Activity.deleteMany({});
  } catch (error) {
    console.error('Stats sıfırlanamadı:', error);
  }
}
