import { TwitterAccount } from './types';
import { BotActivity } from '@/lib/db/models/Activity';
import connectDB from '@/lib/db/mongodb';
import Activity from '@/lib/db/models/Activity';

interface ActionDistribution {
  like: boolean;
  retweet: boolean;
  comment: boolean;
}

interface AccountUsageStats {
  accountName: string;
  likeCount: number;
  retweetCount: number;
  commentCount: number;
  totalActions: number;
}

/**
 * Hesapların kullanım istatistiklerini hesapla
 */
async function getAccountUsageStats(accountNames: string[]): Promise<Map<string, AccountUsageStats>> {
  await connectDB();

  const activities = await Activity.find({
    accountName: { $in: accountNames }
  }).lean();

  const statsMap = new Map<string, AccountUsageStats>();

  // Tüm hesaplar için başlangıç değerleri
  accountNames.forEach(name => {
    statsMap.set(name, {
      accountName: name,
      likeCount: 0,
      retweetCount: 0,
      commentCount: 0,
      totalActions: 0,
    });
  });

  // Aktiviteleri say
  activities.forEach((activity: BotActivity) => {
    const stats = statsMap.get(activity.accountName);
    if (stats) {
      if (activity.actions.liked) stats.likeCount++;
      if (activity.actions.retweeted) stats.retweetCount++;
      if (activity.actions.commented) stats.commentCount++;
      stats.totalActions++;
    }
  });

  return statsMap;
}

/**
 * Manual mode: Hesabın kendi ayarlarına göre aksiyonları belirle
 */
export function getManualDistribution(account: TwitterAccount): ActionDistribution {
  return {
    like: account.canLike,
    retweet: account.canRetweet,
    comment: account.canComment,
  };
}

/**
 * Auto mode: Yüzdelere ve kullanım istatistiklerine göre aksiyon dağıtımı yap
 */
export async function getAutoDistribution(
  accounts: TwitterAccount[],
  likePercentage: number,
  retweetPercentage: number,
  commentPercentage: number
): Promise<Map<string, ActionDistribution>> {
  const distributions = new Map<string, ActionDistribution>();

  // Kullanım istatistiklerini al
  const accountNames = accounts.map(acc => acc.name);
  const statsMap = await getAccountUsageStats(accountNames);

  // Her aksiyon tipi için hesap sayısını hesapla
  const totalAccounts = accounts.length;
  const likeCount = Math.ceil((likePercentage / 100) * totalAccounts);
  const retweetCount = Math.ceil((retweetPercentage / 100) * totalAccounts);
  const commentCount = Math.ceil((commentPercentage / 100) * totalAccounts);

  // Like için en az kullanılmış hesapları seç
  const sortedByLikes = [...accounts].sort((a, b) => {
    const statsA = statsMap.get(a.name)!;
    const statsB = statsMap.get(b.name)!;
    return statsA.likeCount - statsB.likeCount;
  });

  // Retweet için en az kullanılmış hesapları seç
  const sortedByRetweets = [...accounts].sort((a, b) => {
    const statsA = statsMap.get(a.name)!;
    const statsB = statsMap.get(b.name)!;
    return statsA.retweetCount - statsB.retweetCount;
  });

  // Comment için en az kullanılmış hesapları seç
  const sortedByComments = [...accounts].sort((a, b) => {
    const statsA = statsMap.get(a.name)!;
    const statsB = statsMap.get(b.name)!;
    return statsA.commentCount - statsB.commentCount;
  });

  // Her hesap için varsayılan false değerleri
  accounts.forEach(account => {
    distributions.set(account.id, {
      like: false,
      retweet: false,
      comment: false,
    });
  });

  // Like aksiyonlarını dağıt
  for (let i = 0; i < likeCount && i < sortedByLikes.length; i++) {
    const account = sortedByLikes[i];
    if (account.canLike) {
      const dist = distributions.get(account.id)!;
      dist.like = true;
    }
  }

  // Retweet aksiyonlarını dağıt
  for (let i = 0; i < retweetCount && i < sortedByRetweets.length; i++) {
    const account = sortedByRetweets[i];
    if (account.canRetweet) {
      const dist = distributions.get(account.id)!;
      dist.retweet = true;
    }
  }

  // Comment aksiyonlarını dağıt
  for (let i = 0; i < commentCount && i < sortedByComments.length; i++) {
    const account = sortedByComments[i];
    if (account.canComment) {
      const dist = distributions.get(account.id)!;
      dist.comment = true;
    }
  }

  return distributions;
}

/**
 * Hesap için hangi aksiyonların yapılacağını belirle
 * @param account - Twitter hesabı
 * @param autoMode - Auto distribution mode aktif mi?
 * @param autoDistributions - Auto mode için hesaplanmış dağıtımlar
 * @returns ActionDistribution
 */
export function getActionDistributionForAccount(
  account: TwitterAccount,
  autoMode: boolean,
  autoDistributions?: Map<string, ActionDistribution>
): ActionDistribution {
  if (autoMode && autoDistributions) {
    return autoDistributions.get(account.id) || { like: false, retweet: false, comment: false };
  }

  return getManualDistribution(account);
}
