// Bot sistem tipleri

export interface TwitterCookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  httpOnly?: boolean;
  secure?: boolean;
}

export interface TwitterAccount {
  id: string;
  name: string;
  canComment: boolean;
  useAI: boolean;
  enabled: boolean; // Hesap aktif/pasif durumu
  cookies: TwitterCookie[];
  createdAt: string;
  updatedAt: string;
  validated?: boolean; // Cookie doğrulama durumu
  lastValidated?: string; // Son doğrulama zamanı
}

export type AccountStatus = 'idle' | 'running' | 'success' | 'error';

export interface AccountState {
  id: string;
  status: AccountStatus;
  currentAction?: string;
  error?: string;
  completedAt?: string;
}

export type LogLevel = 'info' | 'success' | 'error' | 'warning';

export interface BotLog {
  id: string;
  accountName: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  accountColor: string;
}

export interface BotState {
  isRunning: boolean;
  tweetUrl: string;
  accounts: AccountState[];
  logs: BotLog[];
  startedAt?: string;
  completedAt?: string;
}

export interface BotActionResult {
  success: boolean;
  message: string;
  error?: string;
}
