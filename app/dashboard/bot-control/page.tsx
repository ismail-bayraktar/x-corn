'use client';

import { useEffect, useState } from 'react';
import { TweetInput } from '@/components/bot/TweetInput';
import { AccountStatusCard } from '@/components/bot/AccountStatusCard';
import { AccountSelector } from '@/components/bot/AccountSelector';
import { TerminalLog } from '@/components/bot/TerminalLog';
import { getAccountColor } from '@/lib/bot/accounts';
import { useBotStore } from '@/lib/bot/store';
import { BotLog, BotActivity, BotStats } from '@/lib/bot/types';
import { toast } from 'sonner';

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

  const [accounts, setAccounts] = useState<any[]>([]);
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);
  const [stats, setStats] = useState<BotStats | null>(null);

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

  // Logları SSE ile dinle (her zaman açık)
  useEffect(() => {
    const eventSource = new EventSource('/api/bot/logs');

    eventSource.onmessage = (event) => {
      const newLogs: BotLog[] = JSON.parse(event.data);
      // Logları tamamen değiştir (duplicate önlemek için)
      setLogs(newLogs);
    };

    eventSource.onerror = (error) => {
      // SSE bağlantısı kapandığında otomatik yeniden bağlanma
      // Bu normal bir durumdur, error loglamaya gerek yok
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
    const enabledIds = accounts.filter(acc => acc.enabled).map(acc => acc.id);
    setSelectedAccountIds(enabledIds);
  }, [accounts, initAccounts]);

  const handleStart = async (url: string) => {
    if (selectedAccountIds.length === 0) {
      toast.error('Lütfen en az bir hesap seçin');
      return;
    }

    try {
      setTweetUrl(url);
      setRunning(true);

      // API'yi çağır (seçili hesapları gönder)
      const response = await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tweetUrl: url,
          selectedAccountIds
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
      toast.error((error as Error).message);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Twitter Bot Kontrol Paneli</h1>
        <p className="text-slate-400 mt-1">
          Hesap seçin ve tweet URL'si girerek botu başlatın
        </p>
      </div>

      <AccountSelector
        accounts={accounts}
        selectedIds={selectedAccountIds}
        onSelectionChange={setSelectedAccountIds}
      />

      <TweetInput onStart={handleStart} isRunning={isRunning} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {accounts
          .filter(acc => selectedAccountIds.includes(acc.id))
          .map((account) => {
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

      <TerminalLog logs={logs} />
    </div>
  );
}
