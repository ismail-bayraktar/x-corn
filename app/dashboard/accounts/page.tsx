'use client';

import { useState, useEffect } from 'react';
import { AccountForm, AccountFormData } from '@/components/bot/AccountForm';
import { AccountList } from '@/components/bot/AccountList';
import { TwitterAccount } from '@/lib/bot/types';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<TwitterAccount[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingAccount, setEditingAccount] = useState<TwitterAccount | null>(
    null
  );

  // Hesapları yükle
  const loadAccountsData = async () => {
    try {
      const response = await fetch('/api/accounts');
      const data = await response.json();
      setAccounts(data);
    } catch (error) {
      toast.error('Hesaplar yüklenemedi');
    }
  };

  useEffect(() => {
    loadAccountsData();
  }, []);

  // Yeni hesap ekle
  const handleSave = async (formData: AccountFormData) => {
    try {
      if (editingAccount) {
        // Güncelleme
        const response = await fetch(`/api/accounts/${editingAccount.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Hesap güncellenemedi');

        toast.success('Hesap güncellendi');
      } else {
        // Yeni ekleme
        const response = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error('Hesap eklenemedi');

        toast.success('Hesap eklendi');
      }

      setShowForm(false);
      setEditingAccount(null);
      loadAccountsData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // Hesap düzenle
  const handleEdit = (account: TwitterAccount) => {
    setEditingAccount(account);
    setShowForm(true);
  };

  // Hesap sil
  const handleDelete = async (id: string) => {
    if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;

    try {
      const response = await fetch(`/api/accounts/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Hesap silinemedi');

      toast.success('Hesap silindi');
      loadAccountsData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // Form iptali
  const handleCancel = () => {
    setShowForm(false);
    setEditingAccount(null);
  };

  // Hesap durumunu değiştir (aktif/pasif)
  const handleToggle = async (id: string) => {
    try {
      const response = await fetch(`/api/accounts/${id}/toggle`, {
        method: 'PATCH',
      });

      if (!response.ok) throw new Error('Hesap durumu değiştirilemedi');

      const updatedAccount = await response.json();
      toast.success(
        updatedAccount.enabled
          ? 'Hesap aktif edildi'
          : 'Hesap pasif edildi'
      );
      loadAccountsData();
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  // Hesap cookie'lerini doğrula
  const handleValidate = async (id: string) => {
    const loadingToast = toast.loading('Cookie\'ler doğrulanıyor...');

    try {
      const response = await fetch(`/api/accounts/${id}/validate`, {
        method: 'POST',
      });

      const data = await response.json();

      if (data.valid) {
        toast.success('Cookie\'ler geçerli! Hesap kullanıma hazır.', {
          id: loadingToast,
        });
      } else {
        toast.error(
          data.message || 'Cookie\'ler geçersiz. Lütfen güncelleyin.',
          { id: loadingToast }
        );
      }

      loadAccountsData();
    } catch (error) {
      toast.error('Doğrulama sırasında hata oluştu', {
        id: loadingToast,
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Hesap Yönetimi</h1>
          <p className="text-slate-400 mt-1">
            Twitter hesaplarınızı ekleyin, düzenleyin veya kaldırın
          </p>
        </div>
        {!showForm && (
          <Button onClick={() => setShowForm(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Yeni Hesap Ekle
          </Button>
        )}
      </div>

      {showForm && (
        <AccountForm
          account={editingAccount || undefined}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      )}

      <AccountList
        accounts={accounts}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onToggle={handleToggle}
        onValidate={handleValidate}
      />
    </div>
  );
}
