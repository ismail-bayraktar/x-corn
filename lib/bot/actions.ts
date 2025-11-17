// Twitter aksiyonları (like, retweet, comment)

import { Page } from 'puppeteer';
import { clickWithRetry, wait } from './puppeteer';
import { generateAiComment, getRandomComment } from './groq';
import { CommentStyle } from './types';

/**
 * Tweet'i beğen
 */
export async function likeTweet(page: Page): Promise<boolean> {
  const selectors = [
    'button[data-testid="like"]',
    'div[data-testid="like"]',
    '[aria-label*="Beğen"]',
    '[aria-label*="Like"]',
  ];

  const success = await clickWithRetry(page, selectors, 'Beğeni');
  await wait(2000);
  return success;
}

/**
 * Tweet'i retweet yap
 */
export async function retweetTweet(page: Page): Promise<boolean> {
  const retweetSelectors = [
    'button[data-testid="retweet"]',
    'div[data-testid="retweet"]',
    '[aria-label*="Repost"]',
    '[aria-label*="Retweet"]',
  ];

  const retweetClicked = await clickWithRetry(
    page,
    retweetSelectors,
    'Retweet butonu'
  );

  if (!retweetClicked) return false;

  await wait(1500);

  const confirmSelectors = [
    'button[data-testid="retweetConfirm"]',
    'div[data-testid="retweetConfirm"]',
    '[data-testid="retweetConfirm"]',
  ];

  const confirmed = await clickWithRetry(
    page,
    confirmSelectors,
    'Retweet onay'
  );

  await wait(2000);
  return confirmed;
}

/**
 * Tweet'e yorum yap
 */
export async function replyToTweet(
  page: Page,
  tweetText: string,
  useAI: boolean,
  commentStyle: CommentStyle = 'professional'
): Promise<string | null> {
  // Yorum hazırla
  let comment: string | null = null;

  // AI ile yorum üret
  if (useAI && tweetText) {
    console.log('🤖 AI yorum üretiliyor...');
    comment = await generateAiComment(tweetText, commentStyle);
  }

  // AI başarısız olursa havuzdan seç
  if (!comment) {
    comment = getRandomComment();
  }

  console.log('💬 Yorum hazırlanıyor:', comment);

  // Yanıtla butonuna tıkla
  const replySelectors = [
    'button[data-testid="reply"]',
    'div[data-testid="reply"]',
    '[aria-label*="Yanıtla"]',
    '[aria-label*="Reply"]',
  ];

  const replyClicked = await clickWithRetry(
    page,
    replySelectors,
    'Yanıtla butonu'
  );

  if (!replyClicked) return null;

  await wait(2000);

  // Textarea'ya yorum yaz
  const textareaSelectors = [
    'div[data-testid="tweetTextarea_0"]',
    'div[contenteditable="true"][role="textbox"]',
    '.public-DraftEditor-content',
  ];

  let textareaFound = false;

  for (const selector of textareaSelectors) {
    try {
      await page.waitForSelector(selector, { timeout: 3000 });
      await page.click(selector);
      await wait(500);
      await page.keyboard.type(comment, { delay: 100 });
      console.log('✅ Yorum yazıldı');
      textareaFound = true;
      break;
    } catch (e) {
      continue;
    }
  }

  if (!textareaFound) {
    console.log('⚠️ Textarea bulunamadı');
    return null;
  }

  await wait(2000);

  // Gönder butonuna tıkla
  const sendSelectors = [
    'button[data-testid="tweetButton"]',
    'button[data-testid="tweetButtonInline"]',
    'div[data-testid="tweetButton"]',
    '[aria-label*="Yanıtla"][role="button"]',
    '[aria-label*="Reply"][role="button"]',
  ];

  const sent = await clickWithRetry(page, sendSelectors, 'Yorum gönder');

  await wait(3000);

  if (sent) {
    console.log('✅ Yorum gönderildi');
    return comment;
  }

  return null;
}
