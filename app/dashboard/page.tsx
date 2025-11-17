'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BotStats } from '@/lib/bot/stats';
import { BarChart3, Heart, Repeat, MessageCircle, Activity, ExternalLink } from 'lucide-react';

export default function DashboardPage() {
  const [stats, setStats] = useState<BotStats | null>(null);

  const loadStatsFromAPI = async () => {
    try {
      const response = await fetch('/api/bot/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('Stats yüklenemedi:', error);
    }
  };

  useEffect(() => {
    // İlk yükleme
    loadStatsFromAPI();

    // Her 5 saniyede bir güncelle (real-time için)
    const interval = setInterval(() => {
      loadStatsFromAPI();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  if (!stats) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-slate-400 mt-1">
          Twitter bot istatistikleriniz ve aktivite geçmişi
        </p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">
                Toplam Çalıştırma
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-slate-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalRuns}</div>
            <p className="text-xs text-slate-500 mt-1">
              Bot çalıştırma sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">
                Toplam Beğeni
              </CardTitle>
              <Heart className="h-4 w-4 text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">
              {stats.totalLikes}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Beğenilen tweet sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">
                Toplam Retweet
              </CardTitle>
              <Repeat className="h-4 w-4 text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">
              {stats.totalRetweets}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Retweet yapılan tweet sayısı
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-slate-400">
                Toplam Yorum
              </CardTitle>
              <MessageCircle className="h-4 w-4 text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {stats.totalComments}
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Gönderilen yorum sayısı
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Son Aktivite */}
      {stats.lastActivity && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <CardTitle>Son İşlem</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline">@{stats.lastActivity.accountName}</Badge>
                    <span className="text-xs text-slate-500">
                      {new Date(stats.lastActivity.timestamp).toLocaleString('tr-TR')}
                    </span>
                  </div>
                  <a
                    href={stats.lastActivity.tweetUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-400 hover:underline flex items-center gap-1 truncate"
                  >
                    {stats.lastActivity.tweetUrl}
                    <ExternalLink className="h-3 w-3 flex-shrink-0" />
                  </a>
                </div>
              </div>
              <div className="flex gap-2">
                {stats.lastActivity.actions.liked && (
                  <Badge variant="outline" className="gap-1">
                    <Heart className="h-3 w-3 text-red-400" />
                    Beğendi
                  </Badge>
                )}
                {stats.lastActivity.actions.retweeted && (
                  <Badge variant="outline" className="gap-1">
                    <Repeat className="h-3 w-3 text-green-400" />
                    Retweet
                  </Badge>
                )}
                {stats.lastActivity.actions.commented && (
                  <Badge variant="outline" className="gap-1">
                    <MessageCircle className="h-3 w-3 text-blue-400" />
                    Yorum
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Son Aktiviteler */}
      <Card>
        <CardHeader>
          <CardTitle>Son Aktiviteler ({stats.recentActivities.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.recentActivities.length === 0 ? (
            <div className="text-center text-slate-500 py-8">
              Henüz aktivite kaydı yok. Bot'u çalıştırarak aktivite oluşturun.
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentActivities.slice(0, 10).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start justify-between gap-4 p-3 border border-slate-800 rounded-lg hover:bg-slate-950/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="text-xs">
                        @{activity.accountName}
                      </Badge>
                      <span className="text-xs text-slate-600">
                        {new Date(activity.timestamp).toLocaleString('tr-TR')}
                      </span>
                    </div>
                    <a
                      href={activity.tweetUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-400 hover:underline flex items-center gap-1 truncate"
                    >
                      {activity.tweetUrl}
                      <ExternalLink className="h-3 w-3 flex-shrink-0" />
                    </a>
                    <div className="flex gap-1 mt-2">
                      {activity.actions.liked && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Heart className="h-3 w-3" />
                        </Badge>
                      )}
                      {activity.actions.retweeted && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <Repeat className="h-3 w-3" />
                        </Badge>
                      )}
                      {activity.actions.commented && (
                        <Badge variant="secondary" className="text-xs gap-1">
                          <MessageCircle className="h-3 w-3" />
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
