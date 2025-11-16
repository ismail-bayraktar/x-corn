'use client';

import { useState } from 'react';
import { TwitterAccount } from '@/lib/bot/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Edit, Trash2, CheckCircle, XCircle, Play, Pause, Shield, ShieldAlert, Loader } from 'lucide-react';
import { toast } from 'sonner';

interface AccountListProps {
  accounts: TwitterAccount[];
  onEdit: (account: TwitterAccount) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
  onValidate: (id: string) => Promise<void>;
}

export function AccountList({ accounts, onEdit, onDelete, onToggle, onValidate }: AccountListProps) {
  const [validatingId, setValidatingId] = useState<string | null>(null);

  const handleValidate = async (id: string) => {
    setValidatingId(id);
    try {
      await onValidate(id);
    } finally {
      setValidatingId(null);
    }
  };
  if (accounts.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-500">
            Henüz hesap eklenmemiş. Yukarıdaki formu kullanarak hesap ekleyin.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Kayıtlı Hesaplar ({accounts.length})</CardTitle>
        <CardDescription>
          Twitter hesaplarınızı buradan yönetin
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {accounts.map((account) => (
            <div key={account.id}>
              {/* Mobile Card Layout (< 768px) */}
              <Card
                className={`md:hidden transition-colors ${
                  account.enabled
                    ? 'border-slate-800 bg-slate-950'
                    : 'border-slate-800/50 bg-slate-950/50 opacity-60'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">@{account.name}</CardTitle>
                    {account.enabled ? (
                      <Badge variant="default" className="bg-green-600">
                        <Play className="mr-1 h-3 w-3" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <Pause className="mr-1 h-3 w-3" />
                        Pasif
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Badges */}
                  <div className="flex flex-wrap gap-2">
                    {account.canComment ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Yorum Yapabilir
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="mr-1 h-3 w-3" />
                        Sadece RT + Beğeni
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

                  {/* Info */}
                  <div className="text-sm text-slate-500 space-y-1">
                    <div className="truncate">
                      <span className="font-medium">auth_token:</span> {account.cookies[0]?.value.slice(0, 20)}...
                    </div>
                    {account.lastValidated && (
                      <div className="text-xs">
                        <span className="font-medium">Son doğrulama:</span> {new Date(account.lastValidated).toLocaleString('tr-TR')}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleValidate(account.id)}
                      disabled={validatingId === account.id}
                      className="w-full"
                    >
                      {validatingId === account.id ? (
                        <Loader className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Shield className="mr-2 h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant={account.enabled ? "default" : "outline"}
                      onClick={() => onToggle(account.id)}
                      className={`w-full ${account.enabled ? "bg-green-600 hover:bg-green-700" : ""}`}
                    >
                      {account.enabled ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onEdit(account)}
                      className="w-full"
                    >
                      <Edit className="mr-2 h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onDelete(account.id)}
                      className="w-full"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Desktop Horizontal Layout (≥ 768px) */}
              <div
                className={`hidden md:flex items-center justify-between p-4 border rounded-lg transition-colors ${
                  account.enabled
                    ? 'border-slate-800 bg-slate-950'
                    : 'border-slate-800/50 bg-slate-950/50 opacity-60'
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-medium">@{account.name}</span>
                    {account.enabled ? (
                      <Badge variant="default" className="text-xs bg-green-600">
                        <Play className="mr-1 h-3 w-3" />
                        Aktif
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <Pause className="mr-1 h-3 w-3" />
                        Pasif
                      </Badge>
                    )}
                    {account.canComment ? (
                      <Badge variant="default" className="text-xs">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Yorum Yapabilir
                      </Badge>
                    ) : (
                      <Badge variant="secondary" className="text-xs">
                        <XCircle className="mr-1 h-3 w-3" />
                        Sadece RT + Beğeni
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
                  <div className="text-sm text-slate-500 space-y-1">
                    <div>
                      <span>auth_token: {account.cookies[0]?.value.slice(0, 20)}...</span>
                    </div>
                    {account.lastValidated && (
                      <div className="text-xs">
                        Son doğrulama: {new Date(account.lastValidated).toLocaleString('tr-TR')}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleValidate(account.id)}
                    disabled={validatingId === account.id}
                    title="Cookie'leri doğrula"
                  >
                    {validatingId === account.id ? (
                      <Loader className="h-4 w-4 animate-spin" />
                    ) : (
                      <Shield className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant={account.enabled ? "default" : "outline"}
                    onClick={() => onToggle(account.id)}
                    className={account.enabled ? "bg-green-600 hover:bg-green-700" : ""}
                    title={account.enabled ? "Pasif yap" : "Aktif yap"}
                  >
                    {account.enabled ? (
                      <Pause className="h-4 w-4" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(account)}
                    title="Düzenle"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(account.id)}
                    title="Sil"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
