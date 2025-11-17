'use client';

import { useState } from 'react';
import { BotLog } from '@/lib/bot/types';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Clock, AlertCircle, CheckCircle, Info, AlertTriangle } from 'lucide-react';

interface LogAccordionProps {
  logs: BotLog[];
  activeSessionId?: string;
}

interface LogSession {
  sessionId: string;
  logs: BotLog[];
  startTime: string;
  isActive: boolean;
}

const LOG_ICONS = {
  info: <Info className="w-4 h-4" />,
  success: <CheckCircle className="w-4 h-4" />,
  error: <AlertCircle className="w-4 h-4" />,
  warning: <AlertTriangle className="w-4 h-4" />,
};

const LOG_COLORS = {
  info: 'text-blue-400',
  success: 'text-green-400',
  error: 'text-red-400',
  warning: 'text-yellow-400',
};

export function LogAccordion({ logs, activeSessionId }: LogAccordionProps) {
  // Group logs by sessionId
  const sessions: LogSession[] = Object.values(
    logs.reduce((acc, log) => {
      const sessionId = log.sessionId;
      if (!acc[sessionId]) {
        acc[sessionId] = {
          sessionId,
          logs: [],
          startTime: log.timestamp,
          isActive: sessionId === activeSessionId,
        };
      }
      acc[sessionId].logs.push(log);
      return acc;
    }, {} as Record<string, LogSession>)
  ).sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime());

  const [defaultValue, setDefaultValue] = useState<string[]>(
    activeSessionId ? [activeSessionId] : []
  );

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('tr-TR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('tr-TR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (sessions.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Henüz log kaydı yok</p>
      </div>
    );
  }

  return (
    <Accordion
      type="multiple"
      defaultValue={defaultValue}
      className="space-y-2"
    >
      {sessions.map((session) => (
        <AccordionItem
          key={session.sessionId}
          value={session.sessionId}
          className={`border rounded-lg ${
            session.isActive
              ? 'border-green-800 bg-green-950/20'
              : 'border-slate-800 bg-slate-950'
          }`}
        >
          <AccordionTrigger className="px-4 hover:no-underline">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-slate-400" />
                <span className="font-medium text-slate-200">
                  {formatDate(session.startTime)}
                </span>
                {session.isActive && (
                  <Badge variant="outline" className="bg-green-900/50 text-green-400 border-green-700">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse mr-1.5" />
                    Aktif
                  </Badge>
                )}
              </div>
              <span className="text-xs text-slate-500">
                {session.logs.length} log
              </span>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-4 pb-4">
            <div className="space-y-1.5 max-h-96 overflow-y-auto">
              {session.logs.map((log) => (
                <div
                  key={log.id}
                  className="flex items-start gap-3 p-2 rounded bg-slate-900/50 hover:bg-slate-900 transition-colors"
                >
                  <div className={LOG_COLORS[log.level]}>
                    {LOG_ICONS[log.level]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="inline-block w-2 h-2 rounded-full"
                        style={{ backgroundColor: log.accountColor }}
                      />
                      <span className="text-xs font-medium text-slate-300">
                        {log.accountName}
                      </span>
                      <span className="text-xs text-slate-500">
                        {formatTime(log.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400">{log.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
