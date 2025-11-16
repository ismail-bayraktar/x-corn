import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db/mongodb';
import Account from '@/lib/db/models/Account';
import { launchBrowser, createAuthenticatedPage } from '@/lib/bot/puppeteer';

// POST /api/accounts/[id]/validate - Cookie'lerin geçerliliğini kontrol et
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  let browser;

  try {
    await connectDB();
    const { id } = await params;
    const account = await Account.findOne({ id }).lean();

    if (!account) {
      return NextResponse.json(
        { error: 'Hesap bulunamadı', valid: false },
        { status: 404 }
      );
    }

    // Browser'ı başlat
    browser = await launchBrowser();

    // Cookie'lerle authenticated page oluştur
    const page = await createAuthenticatedPage(browser, account);

    // Twitter ana sayfasına git (timeout artırıldı)
    await page.goto('https://x.com/home', {
      waitUntil: 'domcontentloaded', // networkidle2 yerine daha hızlı
      timeout: 30000, // 15s → 30s
    });

    // Sayfa yüklendikten sonra login durumunu kontrol et
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Eğer login sayfasına yönlendirildiyse, cookie'ler geçersiz
    const currentUrl = page.url();
    const isValid = !currentUrl.includes('/login') && !currentUrl.includes('/i/flow/login');

    console.log(`[Validation] Account: ${account.name}, URL: ${currentUrl}, Valid: ${isValid}`);

    await page.close();

    // Doğrulama sonucunu hesaba kaydet
    await Account.findOneAndUpdate(
      { id },
      {
        $set: {
          validated: isValid,
          lastValidated: new Date().toISOString(),
        }
      }
    );

    if (isValid) {
      return NextResponse.json({
        valid: true,
        message: 'Hesap cookie\'leri geçerli',
        accountName: account.name,
      });
    } else {
      return NextResponse.json({
        valid: false,
        message: 'Cookie\'ler geçersiz veya süresi dolmuş',
        accountName: account.name,
      });
    }
  } catch (error) {
    console.error('Validation error:', error);
    return NextResponse.json(
      {
        valid: false,
        error: 'Doğrulama sırasında hata oluştu',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
