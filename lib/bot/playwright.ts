// Playwright browser kontrolü (Vercel serverless uyumlu)

import { chromium, Browser, Page, BrowserContext } from 'playwright-core';
import chromiumPkg from '@sparticuz/chromium';
import { TwitterAccount } from './types';

/**
 * Playwright browser başlat (Vercel serverless compatible)
 */
export async function launchBrowser(): Promise<Browser> {
  // Vercel production için chromium executable path
  const isProduction = process.env.VERCEL === '1' || process.env.NODE_ENV === 'production';

  const browser = await chromium.launch({
    args: isProduction
      ? chromiumPkg.args
      : [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled',
        ],
    executablePath: isProduction
      ? await chromiumPkg.executablePath()
      : undefined,
    headless: true,
  });

  return browser;
}

/**
 * Browser context oluştur ve hesap cookie'lerini yükle
 */
export async function createAuthenticatedContext(
  browser: Browser,
  account: TwitterAccount
): Promise<{ context: BrowserContext; page: Page }> {
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });

  // Cookie'leri context'e ekle
  await context.addCookies(account.cookies.map(cookie => ({
    name: cookie.name,
    value: cookie.value,
    domain: '.x.com',
    path: '/',
  })));

  const page = await context.newPage();

  return { context, page };
}

/**
 * Tweet sayfasını yükle
 */
export async function loadTweetPage(
  page: Page,
  tweetUrl: string
): Promise<boolean> {
  try {
    await page.goto(tweetUrl, {
      waitUntil: 'domcontentloaded',
      timeout: 10000,
    });

    // Tweet elementini bekle
    await page.waitForSelector('article[data-testid="tweet"]', {
      timeout: 10000,
    });

    return true;
  } catch (error) {
    console.error('Tweet yüklenemedi:', (error as Error).message);
    return false;
  }
}

/**
 * Tweet metnini çıkar
 */
export async function extractTweetText(page: Page): Promise<string> {
  try {
    const locator = page.locator('article[data-testid="tweet"] div[data-testid="tweetText"]');
    const text = await locator.textContent();
    return (text || '').trim();
  } catch (error) {
    console.error('Tweet metni okunamadı:', (error as Error).message);
    return '';
  }
}

/**
 * Retry mekanizması ile tıklama
 */
export async function clickWithRetry(
  page: Page,
  selectors: string[],
  actionName: string,
  maxRetries: number = 3
): Promise<boolean> {
  for (let i = 0; i < maxRetries; i++) {
    for (const selector of selectors) {
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        await page.click(selector);
        console.log(`✅ ${actionName} yapıldı (selector: ${selector})`);
        return true;
      } catch (e) {
        // Devam et, bir sonraki selector'ı dene
      }
    }

    if (i < maxRetries - 1) {
      console.log(
        `⏳ ${actionName} için tekrar deneniyor... (${i + 1}/${maxRetries})`
      );
      await wait(2000);
    }
  }

  console.log(`⚠️ ${actionName} yapılamadı - tüm selector'lar denendi`);
  return false;
}

/**
 * Bekleme utility
 */
export function wait(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Debug screenshot al (optional)
 */
export async function takeDebugScreenshot(
  page: Page,
  accountName: string
): Promise<void> {
  try {
    const path = `./debug-${accountName}-${Date.now()}.png`;
    await page.screenshot({ path, fullPage: true });
    console.log(`📸 Debug screenshot: ${path}`);
  } catch (error) {
    console.error('Screenshot hatası:', (error as Error).message);
  }
}
