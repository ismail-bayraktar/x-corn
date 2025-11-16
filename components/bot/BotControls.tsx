'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Square, Loader } from 'lucide-react';
import { useBotStore } from '@/lib/bot/store';
import { toast } from 'sonner';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export function BotControls() {
  const { isRunning, setRunning } = useBotStore();
  const [tweetUrl, setTweetUrl] = useState('');

  const handleStart = async () => {
    if (!tweetUrl || !tweetUrl.includes('x.com')) {
      toast.error('Geçerli bir tweet URL\'si girin');
      return;
    }

    try {
      setRunning(true);
      const response = await fetch('/api/bot/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tweetUrl }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Bot başlatılamadı');
      }

      toast.success('Bot başlatıldı!');
    } catch (error) {
      setRunning(false);
      toast.error((error as Error).message);
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch('/api/bot/start', {
        method: 'DELETE',
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Bot durdurulamadı');
      }

      setRunning(false);
      toast.success('Bot durduruldu!');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  return (
    <Card className="border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">Hızlı Kontrol</CardTitle>
          {isRunning ? (
            <Badge variant="default" className="bg-green-600">
              <Loader className="mr-1 h-3 w-3 animate-spin" />
              Çalışıyor
            </Badge>
          ) : (
            <Badge variant="secondary">
              <Square className="mr-1 h-3 w-3" />
              Durdu
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        <input
          type="text"
          placeholder="Tweet URL"
          value={tweetUrl}
          onChange={(e) => setTweetUrl(e.target.value)}
          disabled={isRunning}
          className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        />
        {isRunning ? (
          <Button
            size="sm"
            variant="destructive"
            onClick={handleStop}
            className="w-full"
          >
            <Square className="mr-2 h-4 w-4" />
            Durdur
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleStart}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            <Play className="mr-2 h-4 w-4" />
            Başlat
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
