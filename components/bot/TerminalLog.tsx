'use client';

import { useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BotLog } from '@/lib/bot/types';
import { Terminal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface TerminalLogProps {
  logs: BotLog[];
  onClearLogs?: () => void;
}

const levelStyles = {
  info: 'text-slate-400',
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
};

export function TerminalLog({ logs, onClearLogs }: TerminalLogProps) {
  const topRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const prevLogCountRef = useRef(0);

  // Auto-scroll to top only when NEW logs arrive (count increases)
  useEffect(() => {
    if (logs.length > prevLogCountRef.current) {
      // Scroll to top when new log arrives
      if (containerRef.current) {
        containerRef.current.scrollTop = 0;
      }
      prevLogCountRef.current = logs.length;
    }
  }, [logs.length]);

  const handleClearLogs = async () => {
    try {
      const response = await fetch('/api/bot/logs', { method: 'DELETE' });
      if (!response.ok) throw new Error('Loglar temizlenemedi');
      toast.success('Loglar temizlendi');
      prevLogCountRef.current = 0; // Reset scroll counter
      if (onClearLogs) onClearLogs();
    } catch (error) {
      toast.error('Log temizleme hatası');
    }
  };

  return (
    <Card className="col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="h-5 w-5" />
            <CardTitle>Gerçek Zamanlı Loglar</CardTitle>
            <span className="text-sm text-slate-500">({logs.length})</span>
          </div>
          {logs.length > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleClearLogs}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Logları Temizle
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div
          ref={containerRef}
          className="bg-slate-950 rounded-lg p-4 h-[400px] overflow-y-auto font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="text-slate-500 italic">
              Log mesajları burada görünecek...
            </div>
          ) : (
            <div className="space-y-1">
              <div ref={topRef} />
              {logs.slice().reverse().map((log) => (
                <div key={log.id} className="flex gap-3">
                  <span className="text-slate-600">[{log.timestamp}]</span>
                  <span className={log.accountColor}>
                    {log.accountName}:
                  </span>
                  <span className={levelStyles[log.level]}>
                    {log.message}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
