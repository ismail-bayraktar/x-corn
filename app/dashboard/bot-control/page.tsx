'use client';

import { useEffect, useState } from 'react';
import { TweetInput } from '@/components/bot/TweetInput';
import { AccountStatusCard } from '@/components/bot/AccountStatusCard';
import { AccountActionSelector } from '@/components/bot/AccountActionSelector';
import { TweetPreview } from '@/components/bot/TweetPreview';
import { LogAccordion } from '@/components/bot/LogAccordion';
import { getAccountColor } from '@/lib/bot/accounts';
import { useBotStore } from '@/lib/bot/store';
import { TwitterAccount, CommentStyle, BotLog } from '@/lib/bot/types';
import { BotStats } from '@/lib/bot/stats';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Play, Settings } from 'lucide-react';
import Link from 'next/link';

export default function BotControlPage() {
  const {
    isRunning,
    accounts: accountStates,
    logs,
    setRunning,
    setTweetUrl,
    initAccounts,
    updateAccountStatus,
    setLogs,
  } = useBotStore();

  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [stats, setStats] = useState<BotStats | null>(null);
  const [tweetUrl, setTweetUrlInput] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | undefined>();

  // Hesapları API'den yükle
  const loadAccountsData = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      console.error('Hesaplar yüklenemedi:', error);
    }
  };

  // İstatistikleri API'den yükle
  const loadStatsData = async () => {
    try {
      const response = await fetch('/api/bot/stats');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      console.error('İstatistikler yüklenemedi:', error);
    }
  };

  // Hesap aksiyonunu güncelle
  const handleActionChange = async (
    accountId: string,
    action: 'like' | 'retweet' | 'comment',
    value: boolean
  ) => {
    const account = accounts.find((acc) => acc.id === accountId);
    if (!account) return;

    const updateData: any = {};
    if (action === 'like') updateData.canLike = value;
    if (action === 'retweet') updateData.canRetweet = value;
    if (action === 'comment') updateData.canComment = value;

    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) throw new Error('Güncelleme başarısız');

      // Local state'i güncelle
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, ...updateData } : acc
        )
      );
    } catch (error) {
      toast.error('Aksiyon güncellenemedi');
    }
  };

  // Yorum stilini güncelle
  const handleStyleChange = async (accountId: string, style: CommentStyle) => {
    try {
      const response = await fetch(`/api/accounts/${accountId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentStyle: style }),
      });

      if (!response.ok) throw new Error('Güncelleme başarısız');

      // Local state'i güncelle
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, commentStyle: style } : acc
        )
      );
      toast.success('Yorum stili güncellendi');
    } catch (error) {
      toast.error('Stil güncellenemedi');
    }
  };

  // Logları SSE ile dinle
  useEffect(() => {
    const eventSource = new EventSource('/api/bot/logs');

    eventSource.onmessage = (event) => {
      const newLogs: BotLog[] = JSON.parse(event.data);
      setLogs(newLogs);
    };

    eventSource.onerror = () => {
      if (eventSource.readyState === EventSource.CLOSED) {
        setTimeout(() => {
          eventSource.close();
        }, 1000);
      }
    };

    return () => {
      eventSource.close();
    };
  }, [setLogs]);

  // İlk yüklemede hesapları ve stats'ı fetch et
  useEffect(() => {
    loadAccountsData();
    loadStatsData();

    // Stats'ı periyodik olarak güncelle
    const interval = setInterval(() => {
      loadStatsData();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  // Hesapları initialize et ve varsayılan olarak aktif olanları seç
  useEffect(() => {
    const accountIds = accounts.map((acc) => acc.id);
    initAccounts(accountIds);

    // İlk yüklemede tüm aktif hesapları seç
    const enabledIds = accounts.filter((acc) => acc.enabled).map((acc) => acc.id);
    setSelectedAccountIds(enabledIds);
  }, [accounts, initAccounts]);

  const handleStart = async () => {
    if (!tweetUrl.trim()) {
      toast.error('Lütfen bir tweet URL\'si girin');
      return;
    }

    if (selectedAccountIds.length === 0) {
      toast.error('Lütfen en az bir hesap seçin');
      return;
    }

    try {
      setTweetUrl(tweetUrl);
      setRunning(true);

      // Yeni sessionId oluştur
      const sessionId = `session-${Date.now()}`;
      setCurrentSessionId(sessionId);

      // API'yi çağır
      const response = await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweetUrl,
          selectedAccountIds,
          sessionId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Bot başlatılamadı');
      }

      toast.success(`Bot başlatıldı! (${selectedAccountIds.length} hesap)`);

      // Sadece seçili hesapların durumunu running yap
      selectedAccountIds.forEach((id) => {
        updateAccountStatus(id, { status: 'running' });
      });
    } catch (error) {
      setRunning(false);
      setCurrentSessionId(undefined);
      toast.error((error as Error).message);
    }
  };

  const selectedAccounts = accounts.filter((acc) =>
    selectedAccountIds.includes(acc.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bot Kontrol Paneli</h1>
          <p className="text-slate-400 mt-1">
            Tweet URL'si girin, hesapları yapılandırın ve botu başlatın
          </p>
        </div>
        <Link href="/dashboard/settings">
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4 mr-2" />
            Ayarlar
          </Button>
        </Link>
      </div>

      {/* Tweet URL Input - En Üstte */}
      <div className="space-y-4 p-6 border border-slate-800 rounded-lg bg-slate-950">
        <TweetInput
          onStart={handleStart}
          isRunning={isRunning}
          value={tweetUrl}
          onChange={setTweetUrlInput}
        />

        {tweetUrl && (
          <TweetPreview tweetUrl={tweetUrl} />
        )}
      </div>

      {/* Account Action Selectors */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Hesap Seçimi ve Aksiyon Ayarları</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {accounts.map((account) => (
            <div key={account.id} className="relative">
              <input
                type="checkbox"
                id={`select-${account.id}`}
                checked={selectedAccountIds.includes(account.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedAccountIds([...selectedAccountIds, account.id]);
                  } else {
                    setSelectedAccountIds(
                      selectedAccountIds.filter((id) => id !== account.id)
                    );
                  }
                }}
                className="absolute top-3 right-3 w-5 h-5 rounded border-slate-700 bg-slate-900 text-green-600 focus:ring-green-500 focus:ring-offset-slate-950"
              />
              <AccountActionSelector
                account={account}
                onActionChange={handleActionChange}
                onStyleChange={handleStyleChange}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Start Button */}
      {selectedAccountIds.length > 0 && (
        <div className="flex justify-center">
          <Button
            onClick={handleStart}
            disabled={isRunning || !tweetUrl.trim()}
            size="lg"
            className="min-w-64"
          >
            <Play className="w-5 h-5 mr-2" />
            {isRunning ? 'Bot Çalışıyor...' : `Botu Başlat (${selectedAccountIds.length} hesap)`}
          </Button>
        </div>
      )}

      {/* Account Status Cards */}
      {selectedAccounts.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-4">Hesap Durumları</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {selectedAccounts.map((account) => {
              const accountState = accountStates.find((a) => a.id === account.id);
              const lastActivity = stats?.recentActivities.find(
                (activity) => activity.accountName === account.name
              );

              return (
                <AccountStatusCard
                  key={account.id}
                  name={account.name}
                  status={accountState?.status || 'idle'}
                  currentAction={accountState?.currentAction}
                  error={accountState?.error}
                  color={getAccountColor(account.id)}
                  enabled={account.enabled}
                  lastActivity={lastActivity}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Logs - Accordion Format */}
      <div>
        <h2 className="text-lg font-semibold mb-4">İşlem Geçmişi</h2>
        <LogAccordion logs={logs} activeSessionId={currentSessionId} />
      </div>
    </div>
  );
}
