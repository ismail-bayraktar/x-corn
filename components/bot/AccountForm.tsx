'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { TwitterAccount } from '@/lib/bot/types';
import { Info, ChevronDown } from 'lucide-react';

interface AccountFormProps {
  account?: TwitterAccount;
  onSave: (data: AccountFormData) => void;
  onCancel: () => void;
}

export interface AccountFormData {
  name: string;
  authToken: string;
  ct0: string;
  canComment: boolean;
  useAI: boolean;
}

export function AccountForm({ account, onSave, onCancel }: AccountFormProps) {
  const [formData, setFormData] = useState<AccountFormData>({
    name: account?.name || '',
    authToken: account?.cookies.find((c) => c.name === 'auth_token')?.value || '',
    ct0: account?.cookies.find((c) => c.name === 'ct0')?.value || '',
    canComment: account?.canComment ?? true,
    useAI: account?.useAI ?? false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AccountFormData, string>>>({});

  const validate = (): boolean => {
    const newErrors: Partial<Record<keyof AccountFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Hesap adı gerekli';
    }

    if (!formData.authToken.trim()) {
      newErrors.authToken = 'auth_token gerekli';
    }

    if (!formData.ct0.trim()) {
      newErrors.ct0 = 'ct0 gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave(formData);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{account ? 'Hesap Düzenle' : 'Yeni Hesap Ekle'}</CardTitle>
        <CardDescription>
          Twitter hesabı için cookie bilgilerini girin
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Cookie Nasıl Alınır Kılavuzu */}
        <Collapsible className="mb-4">
          <CollapsibleTrigger className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 mb-2">
            <Info className="h-4 w-4" />
            Cookie'leri nasıl alabilirim?
            <ChevronDown className="h-4 w-4" />
          </CollapsibleTrigger>
          <CollapsibleContent className="text-sm text-slate-400 space-y-2 bg-slate-950 p-4 rounded-lg border border-slate-800">
            <p className="font-medium text-slate-300">Chrome DevTools ile Cookie Alma:</p>
            <ol className="list-decimal list-inside space-y-1 ml-2">
              <li>Twitter/X.com'da giriş yapın</li>
              <li>F12 tuşuna basarak DevTools'u açın</li>
              <li>"Application" (veya "Uygulama") sekmesine gidin</li>
              <li>Sol tarafta "Storage" → "Cookies" → "https://x.com" seçin</li>
              <li>"auth_token" ve "ct0" cookie'lerini bulun</li>
              <li>Her birinin "Value" (Değer) sütunundaki değeri kopyalayın</li>
              <li>Aşağıdaki alanlara yapıştırın</li>
            </ol>
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2 mt-2">
              <p className="text-yellow-400 text-xs">
                ⚠️ Cookie'lerinizi kimseyle paylaşmayın! Bunlar hesabınıza tam erişim sağlar.
              </p>
            </div>
          </CollapsibleContent>
        </Collapsible>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Hesap Adı */}
          <div className="space-y-2">
            <Label htmlFor="name">Hesap Adı (username)</Label>
            <Input
              id="name"
              placeholder="mertcanatik34"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className={errors.name ? 'border-red-500' : ''}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* auth_token */}
          <div className="space-y-2">
            <Label htmlFor="authToken">auth_token</Label>
            <Input
              id="authToken"
              placeholder="2fadac6e4128ef..."
              value={formData.authToken}
              onChange={(e) =>
                setFormData({ ...formData, authToken: e.target.value })
              }
              className={errors.authToken ? 'border-red-500' : ''}
            />
            {errors.authToken && (
              <p className="text-sm text-red-500">{errors.authToken}</p>
            )}
          </div>

          {/* ct0 */}
          <div className="space-y-2">
            <Label htmlFor="ct0">ct0</Label>
            <Input
              id="ct0"
              placeholder="32bff3aff6f1323e..."
              value={formData.ct0}
              onChange={(e) =>
                setFormData({ ...formData, ct0: e.target.value })
              }
              className={errors.ct0 ? 'border-red-500' : ''}
            />
            {errors.ct0 && (
              <p className="text-sm text-red-500">{errors.ct0}</p>
            )}
          </div>

          {/* Yorum Yapabilir */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="canComment"
              checked={formData.canComment}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, canComment: !!checked })
              }
            />
            <Label htmlFor="canComment" className="cursor-pointer">
              Yorum yapabilir (sadece beğeni + RT için işaretlemeyin)
            </Label>
          </div>

          {/* AI Kullan */}
          {formData.canComment && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="useAI"
                checked={formData.useAI}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, useAI: !!checked })
                }
              />
              <Label htmlFor="useAI" className="cursor-pointer">
                AI ile yorum üret (GROQ API kullanır)
              </Label>
            </div>
          )}

          {/* Butonlar */}
          <div className="flex gap-2 pt-4">
            <Button type="submit" className="flex-1">
              {account ? 'Güncelle' : 'Kaydet'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              className="flex-1"
            >
              İptal
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
