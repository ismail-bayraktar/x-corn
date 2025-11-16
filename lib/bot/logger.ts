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
  message: string
): BotLog {
  const log: BotLog = {
    // Unique ID: timestamp + random = her zaman farklı
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    accountName,
    level,
    message,
    timestamp: new Date().toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    }),
    accountColor: getAccountColor(accountId),
  };

  logs.push(log);

  // Son 100 log'u tut (performans)
  if (logs.length > 100) {
    logs = logs.slice(-100);
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
