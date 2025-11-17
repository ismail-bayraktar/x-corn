// Hesap yönetimi - localStorage tabanlı CRUD

import { TwitterAccount, TwitterCookie } from './types';

const STORAGE_KEY = 'twitter_bot_accounts';

// Varsayılan hesaplar (ilk yükleme için)
const DEFAULT_ACCOUNTS: TwitterAccount[] = [
  {
    id: '1',
    name: 'mertcanatik34',
    canComment: true,
    canLike: true,
    canRetweet: true,
    useAI: true,
    commentStyle: 'friendly',
    enabled: true,
    cookies: [
      {
        name: 'auth_token',
        value: '2fadac6e4128ef7db29d89433b84536ab895ede3',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      {
        name: 'ct0',
        value: '32bff3aff6f1323e6f64c12b65af527ead0439134f83810e5a1c8fdeaa52f7dc9c6a682bacece0a69314a4c19ea92e434b57e97761ff5cb50ceab67ccdfd3830ba32ea98d830c285c4324e603a30fb77',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'turkiye_senin',
    canComment: true,
    canLike: true,
    canRetweet: true,
    useAI: true,
    commentStyle: 'professional',
    enabled: true,
    cookies: [
      {
        name: 'auth_token',
        value: '514d30ea225d49264964902d706b0124158c3b11',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      {
        name: 'ct0',
        value: 'eca99da78e579ae4017262e76b029a9c2b1a83dcf43b5c885008c35f63037cb34de56c8b2023fca7a9911d13c0976c88960e79300c1aeaa532c213125ab56521af0de8b0930e2b0b1a9216f40f41f8f6',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'myildizlartr',
    canComment: false,
    canLike: true,
    canRetweet: false,
    useAI: false,
    commentStyle: 'informative',
    enabled: true,
    cookies: [
      {
        name: 'auth_token',
        value: '02806bfd92ba53335566897bfcc07dbc48182ba5',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      {
        name: 'ct0',
        value: 'c477bda4c27eac74f3f2b456a477c102f9a2dd5e0186cee15e3813d13319bb36ee53c7d4a5f1f7b0ab33eaa5052ee50c1a402ba417e71ec9b9a016dca96eaf72f89c111db48130842a12a62af3d028d1',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Hesap renklerini ID'ye göre döndür
export function getAccountColor(accountId: string): string {
  const colors: Record<string, string> = {
    '1': 'text-blue-400',
    '2': 'text-green-400',
    '3': 'text-orange-400',
  };
  return colors[accountId] || 'text-slate-400';
}

// LocalStorage'dan hesapları oku
export function loadAccounts(): TwitterAccount[] {
  if (typeof window === 'undefined') return DEFAULT_ACCOUNTS;

  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    // İlk yükleme - varsayılanları kaydet
    saveAccounts(DEFAULT_ACCOUNTS);
    return DEFAULT_ACCOUNTS;
  }

  try {
    return JSON.parse(stored);
  } catch (error) {
    console.error('Hesaplar yüklenirken hata:', error);
    return DEFAULT_ACCOUNTS;
  }
}

// Hesapları localStorage'a kaydet
export function saveAccounts(accounts: TwitterAccount[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(accounts));
}

// Yeni hesap ekle
export function createAccount(
  name: string,
  canComment: boolean,
  useAI: boolean,
  cookies: TwitterCookie[]
): TwitterAccount {
  const accounts = loadAccounts();

  const newAccount: TwitterAccount = {
    id: Date.now().toString(),
    name,
    canComment,
    canLike: true, // Varsayılan aktif
    canRetweet: true, // Varsayılan aktif
    useAI,
    commentStyle: 'professional', // Varsayılan stil
    enabled: true, // Yeni hesaplar varsayılan olarak aktif
    cookies,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  accounts.push(newAccount);
  saveAccounts(accounts);

  return newAccount;
}

// Hesap durumunu değiştir (aktif/pasif)
export function toggleAccountEnabled(id: string): TwitterAccount | null {
  const accounts = loadAccounts();
  const account = accounts.find((acc) => acc.id === id);

  if (!account) return null;

  return updateAccount(id, { enabled: !account.enabled });
}

// Hesap güncelle
export function updateAccount(
  id: string,
  updates: Partial<Omit<TwitterAccount, 'id' | 'createdAt'>>
): TwitterAccount | null {
  const accounts = loadAccounts();
  const index = accounts.findIndex((acc) => acc.id === id);

  if (index === -1) return null;

  accounts[index] = {
    ...accounts[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  saveAccounts(accounts);
  return accounts[index];
}

// Hesap sil
export function deleteAccount(id: string): boolean {
  const accounts = loadAccounts();
  const filtered = accounts.filter((acc) => acc.id !== id);

  if (filtered.length === accounts.length) return false; // Hesap bulunamadı

  saveAccounts(filtered);
  return true;
}

// Tekil hesap getir
export function getAccount(id: string): TwitterAccount | null {
  const accounts = loadAccounts();
  return accounts.find((acc) => acc.id === id) || null;
}
