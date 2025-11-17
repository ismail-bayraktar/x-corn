'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface TweetInputProps {
  onStart: () => void;
  isRunning: boolean;
  value: string;
  onChange: (value: string) => void;
}

export function TweetInput({ onStart, isRunning, value, onChange }: TweetInputProps) {
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

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRunning && validateUrl(value)) {
      onStart();
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="tweet-url" className="text-base font-medium">
        Tweet URL
      </Label>
      <Input
        id="tweet-url"
        type="url"
        placeholder="https://x.com/username/status/1234567890"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setError('');
        }}
        onKeyPress={handleKeyPress}
        onBlur={() => value && validateUrl(value)}
        disabled={isRunning}
        className={error ? 'border-red-500' : ''}
      />
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
