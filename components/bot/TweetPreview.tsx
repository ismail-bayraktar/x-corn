'use client';

import { ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TweetPreviewProps {
  tweetUrl: string;
}

export function TweetPreview({ tweetUrl }: TweetPreviewProps) {
  // Extract tweet ID from URL
  const getTweetId = (url: string): string | null => {
    try {
      const match = url.match(/status\/(\d+)/);
      return match ? match[1] : null;
    } catch {
      return null;
    }
  };

  const tweetId = getTweetId(tweetUrl);

  return (
    <Card className="bg-slate-950 border-slate-800">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span>Hedef Tweet</span>
          <a
            href={tweetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:text-blue-400 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <span className="font-mono bg-slate-900 px-2 py-1 rounded">
              {tweetId || 'Geçersiz URL'}
            </span>
          </div>

          {tweetId && (
            <div className="mt-3 p-3 bg-slate-900 rounded border border-slate-800">
              <p className="text-xs text-slate-400 mb-2">Tweet Önizleme</p>
              <div className="bg-slate-950 rounded p-2">
                <p className="text-sm text-slate-300">
                  Tweet içeriği yüklenecek...
                </p>
              </div>
            </div>
          )}

          <div className="flex items-center gap-2 pt-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-400">
              Bot bu tweet üzerinde işlem yapacak
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
