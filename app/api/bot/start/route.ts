// Bot başlatma API route

import { NextRequest, NextResponse } from 'next/server';
import { Browser } from 'puppeteer';
import connectDB from '@/lib/db/mongodb';
import Account from '@/lib/db/models/Account';
import BotSettings from '@/lib/db/models/BotSettings';
import { addLog, clearLogs } from '@/lib/bot/logger';
import { addActivity } from '@/lib/bot/stats';
import {
  launchBrowser,
  createAuthenticatedPage,
  loadTweetPage,
  extractTweetText,
  wait,
} from '@/lib/bot/puppeteer';
import { likeTweet, retweetTweet, replyToTweet } from '@/lib/bot/actions';
import {
  getAutoDistribution,
  getActionDistributionForAccount,
} from '@/lib/bot/distribution';
import { TwitterAccount } from '@/lib/bot/types';

// Bot çalışma durumu (in-memory)
let isRunning = false;
let currentBrowser: Browser | null = null;
let shouldStop = false;

export async function POST(request: NextRequest) {
  // Eğer bot zaten çalışıyorsa, reddet
  if (isRunning) {
    return NextResponse.json(
      { error: 'Bot zaten çalışıyor' },
      { status: 409 }
    );
  }

  try {
    const body = await request.json();
    const { tweetUrl, selectedAccountIds, sessionId } = body;

    if (!tweetUrl || !tweetUrl.includes('x.com')) {
      return NextResponse.json(
        { error: 'Geçerli bir tweet URL\'si gerekli' },
        { status: 400 }
      );
    }

    if (!selectedAccountIds || selectedAccountIds.length === 0) {
      return NextResponse.json(
        { error: 'En az bir hesap seçmelisiniz' },
        { status: 400 }
      );
    }

    if (!sessionId) {
      return NextResponse.json(
        { error: 'SessionId gerekli' },
        { status: 400 }
      );
    }

    // Çalışmaya başla (async)
    isRunning = true;
    shouldStop = false;
    runBot(tweetUrl, selectedAccountIds, sessionId).finally(() => {
      isRunning = false;
      currentBrowser = null;
    });

    return NextResponse.json({
      success: true,
      message: 'Bot başlatıldı',
    });
  } catch (error) {
    isRunning = false;
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

/**
 * Bot ana çalışma fonksiyonu (async)
 */
async function runBot(
  tweetUrl: string,
  selectedAccountIds: string[],
  sessionId: string
): Promise<void> {
  clearLogs(); // Önceki logları temizle

  await connectDB();

  // Hesapları yükle
  const allAccounts = await Account.find({}).lean();
  const accounts = allAccounts.filter((acc: TwitterAccount) =>
    selectedAccountIds.includes(acc.id) && acc.enabled
  );

  if (accounts.length === 0) {
    addLog('system', 'System', 'error', '❌ Seçili ve aktif hesap bulunamadı', sessionId);
    return;
  }

  // Bot settings'i yükle
  const settings = await BotSettings.findOne({ id: 'global' }).lean();
  const autoMode = settings?.autoDistribution?.enabled || false;

  const totalSelected = selectedAccountIds.length;
  const skipped = totalSelected - accounts.length;

  addLog('system', 'System', 'info', `🚀 Bot başlatılıyor... (${accounts.length} hesap${skipped > 0 ? `, ${skipped} pasif/geçersiz atlandı` : ''})`, sessionId);
  addLog('system', 'System', 'info', `🔗 Hedef tweet: ${tweetUrl}`, sessionId);
  addLog('system', 'System', 'info', `🎯 Mod: ${autoMode ? 'Otomatik Dağıtım' : 'Manuel Ayarlar'}`, sessionId);

  // Auto distribution hesapla (eğer aktifse)
  let autoDistributions;
  if (autoMode && settings) {
    const { likePercentage, retweetPercentage, commentPercentage } = settings.autoDistribution;
    autoDistributions = await getAutoDistribution(
      accounts as TwitterAccount[],
      likePercentage,
      retweetPercentage,
      commentPercentage
    );
    addLog('system', 'System', 'info', `📊 Dağıtım: ${likePercentage}% beğeni, ${retweetPercentage}% RT, ${commentPercentage}% yorum`, sessionId);
  }

  let browser;

  try {
    browser = await launchBrowser();
    currentBrowser = browser;
    addLog('system', 'System', 'success', '✅ Browser başlatıldı', sessionId);

    // Hesapları sırayla işle
    for (const account of accounts as TwitterAccount[]) {
      // Stop kontrolü
      if (shouldStop) {
        addLog('system', 'System', 'warning', '⏹️ Bot durduruldu!', sessionId);
        break;
      }

      const startTime = Date.now();
      addLog(account.id, account.name, 'info', '🔄 İşlem başlıyor...', sessionId);

      try {
        const page = await createAuthenticatedPage(browser, account);
        addLog(account.id, account.name, 'info', '🍪 Cookie\'ler yüklendi', sessionId);

        // Tweet sayfasını aç
        const loaded = await loadTweetPage(page, tweetUrl);
        if (!loaded) {
          addLog(account.id, account.name, 'error', '❌ Tweet yüklenemedi', sessionId);
          await page.close();
          continue;
        }

        addLog(account.id, account.name, 'success', '✅ Tweet yüklendi', sessionId);
        await wait(1000);

        // Tweet metnini çıkar (AI yorum için)
        const tweetText = await extractTweetText(page);
        if (tweetText) {
          addLog(account.id, account.name, 'info', `📝 Tweet metni alındı`, sessionId);
        }

        await wait(2000);

        // Stop kontrolü
        if (shouldStop) {
          await page.close();
          break;
        }

        // Action distribution'ı al (auto veya manual)
        const distribution = getActionDistributionForAccount(
          account,
          autoMode,
          autoDistributions
        );

        // İşlem planını logla
        const actions: string[] = [];
        if (distribution.like) actions.push('👍 Beğeni');
        if (distribution.retweet) actions.push('🔁 RT');
        if (distribution.comment) actions.push('💬 Yorum');

        if (actions.length > 0) {
          addLog(account.id, account.name, 'info', `📋 Planlanan: ${actions.join(', ')}`, sessionId);
        } else {
          addLog(account.id, account.name, 'warning', '⚠️ Hiçbir aksiyon planlanmadı', sessionId);
        }

        // Beğen (eğer distribution izin veriyorsa)
        let liked = false;
        if (distribution.like) {
          liked = await likeTweet(page);
          if (liked) {
            addLog(account.id, account.name, 'success', '👍 Beğeni yapıldı', sessionId);
          } else {
            addLog(account.id, account.name, 'warning', '⚠️ Beğeni yapılamadı', sessionId);
          }
        }

        // Retweet (eğer distribution izin veriyorsa)
        let retweeted = false;
        if (distribution.retweet) {
          retweeted = await retweetTweet(page);
          if (retweeted) {
            addLog(account.id, account.name, 'success', '🔁 Retweet yapıldı', sessionId);
          } else {
            addLog(account.id, account.name, 'warning', '⚠️ Retweet yapılamadı', sessionId);
          }
        }

        // Yorum (eğer distribution izin veriyorsa)
        let commented = false;
        let commentText: string | undefined;
        if (distribution.comment && account.canComment) {
          const result = await replyToTweet(page, tweetText, account.useAI, account.commentStyle);
          if (result) {
            commented = true;
            commentText = result;
            addLog(account.id, account.name, 'success', `💬 Yorum gönderildi: "${result}"`, sessionId);
          } else {
            addLog(account.id, account.name, 'warning', '⚠️ Yorum gönderilemedi', sessionId);
          }
        }

        // Duration hesapla
        const duration = Date.now() - startTime;

        // İstatistiklere kaydet
        await addActivity({
          id: `${account.id}-${Date.now()}`,
          tweetUrl,
          accountName: account.name,
          actions: {
            liked,
            retweeted,
            commented,
          },
          commentText,
          duration,
          timestamp: new Date().toISOString(),
        });

        await page.close();
        addLog(
          account.id,
          account.name,
          'success',
          `✅ İşlemler tamamlandı (${(duration / 1000).toFixed(1)}s)`,
          sessionId
        );

        // Stop kontrolü
        if (shouldStop) {
          break;
        }

        // Hesaplar arası bekleme
        await wait(5000);
      } catch (error) {
        addLog(
          account.id,
          account.name,
          'error',
          `❌ Hata: ${(error as Error).message}`,
          sessionId
        );
      }
    }

    if (!shouldStop) {
      addLog('system', 'System', 'success', '🎉 Tüm hesaplar için işlemler tamamlandı!', sessionId);
    }
  } catch (error) {
    addLog('system', 'System', 'error', `💥 Kritik hata: ${(error as Error).message}`, sessionId);
  } finally {
    if (browser) {
      await browser.close();
      currentBrowser = null;
      addLog('system', 'System', 'info', '🔒 Browser kapatıldı', sessionId);
    }
  }
}

// GET - Bot durumunu kontrol et
export async function GET() {
  return NextResponse.json({
    isRunning,
  });
}

// DELETE - Bot'u durdur
export async function DELETE() {
  if (!isRunning) {
    return NextResponse.json(
      { error: 'Bot zaten durmuş' },
      { status: 400 }
    );
  }

  shouldStop = true;
  addLog('system', 'System', 'warning', '⏹️ Bot durdurma komutu alındı...', '');

  // Browser'ı force close et
  if (currentBrowser) {
    try {
      await currentBrowser.close();
      currentBrowser = null;
      addLog('system', 'System', 'info', '🔒 Browser zorla kapatıldı', '');
    } catch (error) {
      console.error('Browser close error:', error);
    }
  }

  isRunning = false;

  return NextResponse.json({
    success: true,
    message: 'Bot durduruldu',
  });
}
