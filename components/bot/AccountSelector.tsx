'use client';

import { useState } from 'react';
import { TwitterAccount } from '@/lib/bot/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Users, CheckCircle, XCircle, Shield, ShieldAlert } from 'lucide-react';

interface AccountSelectorProps {
  accounts: TwitterAccount[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function AccountSelector({ accounts, selectedIds, onSelectionChange }: AccountSelectorProps) {
  const handleToggle = (accountId: string) => {
    if (selectedIds.includes(accountId)) {
      onSelectionChange(selectedIds.filter(id => id !== accountId));
    } else {
      onSelectionChange([...selectedIds, accountId]);
    }
  };

  const handleSelectAll = () => {
    const enabledAccountIds = accounts.filter(acc => acc.enabled).map(acc => acc.id);
    onSelectionChange(enabledAccountIds);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const enabledAccounts = accounts.filter(acc => acc.enabled);
  const allSelected = enabledAccounts.length > 0 && selectedIds.length === enabledAccounts.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            <CardTitle>Hesap Seçimi</CardTitle>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSelectAll}
              className="text-xs text-blue-400 hover:underline"
              disabled={allSelected}
            >
              Tümünü Seç
            </button>
            <span className="text-slate-600">|</span>
            <button
              onClick={handleDeselectAll}
              className="text-xs text-slate-400 hover:underline"
              disabled={selectedIds.length === 0}
            >
              Hiçbiri
            </button>
          </div>
        </div>
        <CardDescription>
          <span suppressHydrationWarning>
            Bot çalıştırmak için hesap seçin ({selectedIds.length}/{enabledAccounts.length} seçili)
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {accounts.length === 0 ? (
          <div className="text-center text-slate-500 py-4">
            Henüz hesap eklenmemiş
          </div>
        ) : (
          <div className="space-y-2">
            {accounts.map((account) => (
              <div
                key={account.id}
                className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                  account.enabled
                    ? 'border-slate-800 bg-slate-950 hover:border-slate-700'
                    : 'border-slate-800/50 bg-slate-950/50 opacity-50 cursor-not-allowed'
                }`}
                suppressHydrationWarning
              >
                <div className="flex items-center gap-3 flex-1" suppressHydrationWarning>
                  <Checkbox
                    id={account.id}
                    checked={selectedIds.includes(account.id)}
                    onCheckedChange={() => handleToggle(account.id)}
                    disabled={!account.enabled}
                    className="data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                  />
                  <label
                    htmlFor={account.id}
                    className="flex items-center gap-2 flex-1 cursor-pointer"
                  >
                    <span className="font-medium">@{account.name}</span>
                    <div className="flex gap-1 flex-wrap">
                      {account.canComment ? (
                        <Badge variant="default" className="text-xs">
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Yorum
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          <XCircle className="mr-1 h-3 w-3" />
                          RT+Beğeni
                        </Badge>
                      )}
                      {account.useAI && (
                        <Badge variant="outline" className="text-xs">
                          🤖 AI
                        </Badge>
                      )}
                      {account.validated === true && (
                        <Badge variant="default" className="text-xs bg-green-600">
                          <Shield className="mr-1 h-3 w-3" />
                          Doğrulandı
                        </Badge>
                      )}
                      {account.validated === false && (
                        <Badge variant="destructive" className="text-xs">
                          <ShieldAlert className="mr-1 h-3 w-3" />
                          Geçersiz
                        </Badge>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
