'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Clock, AlertCircle, Loader, Heart, Repeat, MessageCircle } from 'lucide-react';
import { AccountStatus } from '@/lib/bot/types';
import { BotActivity } from '@/lib/bot/stats';

interface AccountStatusCardProps {
  name: string;
  status: AccountStatus;
  currentAction?: string;
  error?: string;
  color: string;
  enabled?: boolean;
  lastActivity?: BotActivity;
}

const statusConfig = {
  idle: {
    icon: Clock,
    label: 'Bekliyor',
    className: 'text-slate-400',
    badgeVariant: 'secondary' as const,
  },
  running: {
    icon: Loader,
    label: 'Çalışıyor',
    className: 'text-yellow-400 animate-pulse',
    badgeVariant: 'default' as const,
  },
  success: {
    icon: CheckCircle,
    label: 'Başarılı',
    className: 'text-green-400',
    badgeVariant: 'default' as const,
  },
  error: {
    icon: AlertCircle,
    label: 'Hata',
    className: 'text-red-400',
    badgeVariant: 'destructive' as const,
  },
};

export function AccountStatusCard({
  name,
  status,
  currentAction,
  error,
  color,
  enabled = true,
  lastActivity,
}: AccountStatusCardProps) {
  const config = statusConfig[status];
  const Icon = config.icon;

  return (
    <Card className={!enabled ? 'opacity-60 border-slate-800/50' : ''}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className={`text-base font-medium ${color}`}>
            @{name}
          </CardTitle>
          <div className="flex gap-2">
            {!enabled && (
              <Badge variant="secondary" className="text-xs">
                Pasif
              </Badge>
            )}
            <Badge variant={config.badgeVariant}>
              <Icon className="mr-1 h-3 w-3" />
              {config.label}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {!enabled && (
            <p className="text-sm text-slate-400">
              Bu hesap pasif durumda. Bot çalıştırıldığında atlanacak.
            </p>
          )}
          {enabled && currentAction && (
            <p className="text-sm text-slate-400">
              {currentAction}
            </p>
          )}
          {enabled && error && (
            <p className="text-sm text-red-400">
              {error}
            </p>
          )}
          {enabled && status === 'idle' && !currentAction && !lastActivity && (
            <p className="text-sm text-slate-500">
              Başlatmayı bekliyor...
            </p>
          )}

          {/* Son Aktivite */}
          {lastActivity && (
            <div className="pt-2 border-t border-slate-800">
              <p className="text-xs text-slate-500 mb-2">Son Aktivite:</p>
              <div className="space-y-2">
                <a
                  href={lastActivity.tweetUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-400 hover:underline block truncate"
                >
                  {lastActivity.tweetUrl}
                </a>
                <div className="flex gap-2 text-xs flex-wrap">
                  {lastActivity.actions.liked && (
                    <Badge variant="outline" className="text-xs gap-1 bg-pink-950/30 border-pink-800">
                      <Heart className="h-3 w-3 text-pink-400" />
                      Beğendi
                    </Badge>
                  )}
                  {lastActivity.actions.retweeted && (
                    <Badge variant="outline" className="text-xs gap-1 bg-green-950/30 border-green-800">
                      <Repeat className="h-3 w-3 text-green-400" />
                      RT
                    </Badge>
                  )}
                  {lastActivity.actions.commented && (
                    <Badge variant="outline" className="text-xs gap-1 bg-blue-950/30 border-blue-800">
                      <MessageCircle className="h-3 w-3 text-blue-400" />
                      Yorum
                    </Badge>
                  )}
                </div>

                {/* Yorum Metni */}
                {lastActivity.commentText && (
                  <div className="p-2 bg-slate-900/50 rounded border border-slate-800">
                    <p className="text-xs text-slate-400 mb-1">Yorum:</p>
                    <p className="text-xs text-slate-300 italic">"{lastActivity.commentText}"</p>
                  </div>
                )}

                <div className="flex items-center justify-between text-xs text-slate-600">
                  <span>{new Date(lastActivity.timestamp).toLocaleString('tr-TR')}</span>
                  {lastActivity.duration > 0 && (
                    <span className="text-slate-500">
                      {(lastActivity.duration / 1000).toFixed(1)}s
                    </span>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
