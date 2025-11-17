'use client';

import { TwitterAccount, CommentStyle } from '@/lib/bot/types';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Heart, Repeat2, MessageCircle } from 'lucide-react';

interface AccountActionSelectorProps {
  account: TwitterAccount;
  onActionChange: (accountId: string, action: 'like' | 'retweet' | 'comment', value: boolean) => void;
  onStyleChange: (accountId: string, style: CommentStyle) => void;
}

const STYLE_LABELS: Record<CommentStyle, string> = {
  professional: 'Profesyonel',
  friendly: 'Arkadaş Canlısı',
  humorous: 'Esprili',
  informative: 'Bilgilendirici',
  supportive: 'Destekleyici',
};

export function AccountActionSelector({
  account,
  onActionChange,
  onStyleChange,
}: AccountActionSelectorProps) {
  return (
    <div className="space-y-3 p-4 border border-slate-800 rounded-lg bg-slate-950">
      {/* Account Name */}
      <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
        <div
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: `hsl(${account.id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 360}, 70%, 60%)` }}
        />
        <span className="font-medium text-slate-200">{account.name}</span>
        {!account.enabled && (
          <span className="text-xs text-slate-500">(Pasif)</span>
        )}
      </div>

      {/* Action Toggles */}
      <div className="grid grid-cols-3 gap-3">
        {/* Like */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${account.id}-like`}
            checked={account.canLike}
            onCheckedChange={(checked) => onActionChange(account.id, 'like', checked === true)}
            disabled={!account.enabled}
            className="data-[state=checked]:bg-pink-600 data-[state=checked]:border-pink-600"
          />
          <Label
            htmlFor={`${account.id}-like`}
            className="text-sm font-normal cursor-pointer flex items-center gap-1.5"
          >
            <Heart className="w-4 h-4 text-pink-500" />
            <span>Beğeni</span>
          </Label>
        </div>

        {/* Retweet */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${account.id}-retweet`}
            checked={account.canRetweet}
            onCheckedChange={(checked) => onActionChange(account.id, 'retweet', checked === true)}
            disabled={!account.enabled}
            className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
          />
          <Label
            htmlFor={`${account.id}-retweet`}
            className="text-sm font-normal cursor-pointer flex items-center gap-1.5"
          >
            <Repeat2 className="w-4 h-4 text-green-500" />
            <span>Retweet</span>
          </Label>
        </div>

        {/* Comment */}
        <div className="flex items-center space-x-2">
          <Checkbox
            id={`${account.id}-comment`}
            checked={account.canComment}
            onCheckedChange={(checked) => onActionChange(account.id, 'comment', checked === true)}
            disabled={!account.enabled}
            className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
          />
          <Label
            htmlFor={`${account.id}-comment`}
            className="text-sm font-normal cursor-pointer flex items-center gap-1.5"
          >
            <MessageCircle className="w-4 h-4 text-blue-500" />
            <span>Yorum</span>
          </Label>
        </div>
      </div>

      {/* Comment Style Selector - Only show if canComment is enabled */}
      {account.canComment && account.useAI && (
        <div className="pt-2 border-t border-slate-800">
          <Label className="text-xs text-slate-400 mb-2 block">Yorum Stili</Label>
          <Select
            value={account.commentStyle}
            onValueChange={(value) => onStyleChange(account.id, value as CommentStyle)}
            disabled={!account.enabled}
          >
            <SelectTrigger className="w-full bg-slate-900 border-slate-800">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(STYLE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}
    </div>
  );
}
