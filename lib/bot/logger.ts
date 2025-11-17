// Gerçek zamanlı log yönetimi

import { BotLog, LogLevel } from './types';
import { getAccountColor } from './accounts';

// In-memory log store (API route'dan erişilebilir)
let logs: BotLog[] = [];

// Log ekle
export function addLog(
  accountId: string,
  accountName: string,
  level: LogLevel,
  message: string,
  sessionId: string
): BotLog {
  const log: BotLog = {
    // Unique ID: timestamp + random = her zaman farklı
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sessionId,
    accountName,
    level,
    message,
    timestamp: new Date().toISOString(),
    accountColor: getAccountColor(accountId),
  };

  logs.push(log);

  // Son 200 log'u tut (performans) - session bazlı olduğu için daha fazla
  if (logs.length > 200) {
    logs = logs.slice(-200);
  }

  return log;
}

// Tüm logları getir
export function getLogs(): BotLog[] {
  return [...logs];
}

// Logları temizle
export function clearLogs(): void {
  logs = [];
}

// Son N log'u getir
export function getRecentLogs(count: number = 50): BotLog[] {
  return logs.slice(-count);
}
