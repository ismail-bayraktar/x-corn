// Bot başlatma API route

import { NextRequest, NextResponse } from 'next/server';
import { Browser } from 'puppeteer';
import connectDB from '@/lib/db/mongodb';
import Account from '@/lib/db/models/Account';
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
    const { tweetUrl, selectedAccountIds } = body;

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

    // Çalışmaya başla (async)
    isRunning = true;
    shouldStop = false;
    runBot(tweetUrl, selectedAccountIds).finally(() => {
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
async function runBot(tweetUrl: string, selectedAccountIds: string[]): Promise<void> {
  clearLogs(); // Önceki logları temizle

  await connectDB();
  const allAccounts = await Account.find({}).lean();
  // Sadece seçili VE aktif hesapları al
  const accounts = allAccounts.filter(acc =>
    selectedAccountIds.includes(acc.id) && acc.enabled
  );

  if (accounts.length === 0) {
    addLog('system', 'System', 'error', '❌ Seçili ve aktif hesap bulunamadı');
    return;
  }

  const totalSelected = selectedAccountIds.length;
  const skipped = totalSelected - accounts.length;
  addLog('system', 'System', 'info', `🚀 Bot başlatılıyor... (${accounts.length} hesap${skipped > 0 ? `, ${skipped} pasif/geçersiz atlandı` : ''})`);
  addLog('system', 'System', 'info', `🔗 Hedef tweet: ${tweetUrl}`);

  let browser;

  try {
    browser = await launchBrowser();
    currentBrowser = browser; // Browser'ı global değişkene ata
    addLog('system', 'System', 'success', '✅ Browser başlatıldı');

    // Hesapları sırayla işle (sadece aktif olanlar)
    for (const account of accounts) {
      // Stop kontrolü
      if (shouldStop) {
        addLog('system', 'System', 'warning', '⏹️ Bot durduruldu!');
        break;
      }

      addLog(account.id, account.name, 'info', '🔄 İşlem başlıyor...');

      try {
        const page = await createAuthenticatedPage(browser, account);
        addLog(account.id, account.name, 'info', '🍪 Cookie\'ler yüklendi');

        // Tweet sayfasını aç
        const loaded = await loadTweetPage(page, tweetUrl);
        if (!loaded) {
          addLog(account.id, account.name, 'error', '❌ Tweet yüklenemedi');
          await page.close();
          continue;
        }

        addLog(account.id, account.name, 'success', '✅ Tweet yüklendi');
        await wait(1000);

        // Tweet metnini çıkar (AI yorum için)
        const tweetText = await extractTweetText(page);
        if (tweetText) {
          addLog(account.id, account.name, 'info', `📝 Tweet metni alındı`);
        }

        await wait(2000);

        // Stop kontrolü
        if (shouldStop) {
          await page.close();
          break;
        }

        // Beğen
        const liked = await likeTweet(page);
        if (liked) {
          addLog(account.id, account.name, 'success', '👍 Beğeni yapıldı');
        } else {
          addLog(account.id, account.name, 'warning', '⚠️ Beğeni yapılamadı');
        }

        // Retweet
        const retweeted = await retweetTweet(page);
        if (retweeted) {
          addLog(account.id, account.name, 'success', '🔁 Retweet yapıldı');
        } else {
          addLog(account.id, account.name, 'warning', '⚠️ Retweet yapılamadı');
        }

        // Yorum (sadece canComment = true ise)
        let commented = false;
        if (account.canComment) {
          const replied = await replyToTweet(page, tweetText, account.useAI);
          commented = replied;
          if (replied) {
            addLog(account.id, account.name, 'success', '💬 Yorum gönderildi');
          } else {
            addLog(account.id, account.name, 'warning', '⚠️ Yorum gönderilemedi');
          }
        } else {
          addLog(account.id, account.name, 'info', '💬 Yorum modu kapalı (sadece beğeni + RT)');
        }

        // İstatistiklere kaydet
        addActivity({
          id: `${account.id}-${Date.now()}`,
          tweetUrl,
          accountName: account.name,
          actions: {
            liked,
            retweeted,
            commented,
          },
          timestamp: new Date().toISOString(),
        });

        await page.close();
        addLog(account.id, account.name, 'success', `✅ ${account.name} için işlemler tamamlandı`);

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
          `❌ Hata: ${(error as Error).message}`
        );
      }
    }

    if (!shouldStop) {
      addLog('system', 'System', 'success', '🎉 Tüm hesaplar için işlemler tamamlandı!');
    }
  } catch (error) {
    addLog('system', 'System', 'error', `💥 Kritik hata: ${(error as Error).message}`);
  } finally {
    if (browser) {
      await browser.close();
      currentBrowser = null;
      addLog('system', 'System', 'info', '🔒 Browser kapatıldı');
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
  addLog('system', 'System', 'warning', '⏹️ Bot durdurma komutu alındı...');

  // Browser'ı force close et
  if (currentBrowser) {
    try {
      await currentBrowser.close();
      currentBrowser = null;
      addLog('system', 'System', 'info', '🔒 Browser zorla kapatıldı');
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
