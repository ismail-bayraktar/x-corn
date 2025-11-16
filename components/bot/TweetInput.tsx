'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Loader } from 'lucide-react';

interface TweetInputProps {
  onStart: (url: string) => void;
  isRunning: boolean;
}

export function TweetInput({ onStart, isRunning }: TweetInputProps) {
  const [url, setUrl] = useState('');
  const [error, setError] = useState('');

  const validateUrl = (input: string): boolean => {
    if (!input) {
      setError('Tweet URL\'si gerekli');
      return false;
    }

    if (!input.includes('x.com') && !input.includes('twitter.com')) {
      setError('Geçerli bir X.com (Twitter) URL\'si girin');
      return false;
    }

    if (!input.includes('/status/')) {
      setError('Tweet URL\'si /status/ içermeli');
      return false;
    }

    setError('');
    return true;
  };

  const handleStart = () => {
    if (validateUrl(url)) {
      onStart(url);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRunning) {
      handleStart();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tweet URL</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              type="url"
              placeholder="https://x.com/username/status/1234567890"
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError('');
              }}
              onKeyPress={handleKeyPress}
              disabled={isRunning}
              className={error ? 'border-red-500' : ''}
            />
            {error && (
              <p className="text-sm text-red-500 mt-1">{error}</p>
            )}
          </div>
          <Button
            onClick={handleStart}
            disabled={isRunning || !url}
            className="min-w-[120px]"
          >
            {isRunning ? (
              <>
                <Loader className="mr-2 h-4 w-4 animate-spin" />
                Çalışıyor
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Çalıştır
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
