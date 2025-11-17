'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Save, Info } from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface BotSettings {
  id: string;
  autoDistribution: {
    enabled: boolean;
    likePercentage: number;
    retweetPercentage: number;
    commentPercentage: number;
  };
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<BotSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load settings from API
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await fetch('/api/bot/settings');
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      toast.error('Ayarlar yüklenemedi');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!settings) return;

    setSaving(true);
    try {
      const response = await fetch('/api/bot/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (!response.ok) throw new Error('Kaydetme başarısız');

      const updated = await response.json();
      setSettings(updated);
      toast.success('Ayarlar kaydedildi');
    } catch (error) {
      toast.error('Ayarlar kaydedilemedi');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-400">Ayarlar yüklenemedi</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/bot-control">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Bot Ayarları</h1>
          <p className="text-slate-400 mt-1">
            Otomatik aksiyon dağıtımı ve diğer ayarları yapılandırın
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-2" />
          {saving ? 'Kaydediliyor...' : 'Kaydet'}
        </Button>
      </div>

      {/* Auto Distribution Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Otomatik Aksiyon Dağıtımı</CardTitle>
          <CardDescription>
            Bot çalıştırıldığında hesaplara otomatik olarak aksiyonları dağıt
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Enable Auto Distribution */}
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label className="text-base">Otomatik Dağıtımı Etkinleştir</Label>
              <p className="text-sm text-slate-400">
                Manuel ayarlar yerine otomatik yüzde tabanlı dağıtım kullan
              </p>
            </div>
            <Switch
              checked={settings.autoDistribution.enabled}
              onCheckedChange={(checked) =>
                setSettings({
                  ...settings,
                  autoDistribution: {
                    ...settings.autoDistribution,
                    enabled: checked,
                  },
                })
              }
            />
          </div>

          {/* Distribution Percentages */}
          {settings.autoDistribution.enabled && (
            <div className="space-y-6 p-4 border border-slate-800 rounded-lg bg-slate-950">
              <div className="flex items-start gap-3 p-3 bg-blue-950/20 border border-blue-900/30 rounded">
                <Info className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-1 text-sm">
                  <p className="text-blue-300 font-medium">Nasıl Çalışır?</p>
                  <p className="text-slate-300">
                    Belirlenen yüzdelere göre, en az kullanılmış hesaplar otomatik olarak seçilir.
                    Örneğin %100 beğeni ile tüm hesaplar beğenir, %30 retweet ile hesapların ~30%'u retweet yapar.
                  </p>
                </div>
              </div>

              {/* Like Percentage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Beğeni Oranı</Label>
                  <span className="text-sm font-medium text-slate-300">
                    {settings.autoDistribution.likePercentage}%
                  </span>
                </div>
                <Slider
                  value={[settings.autoDistribution.likePercentage]}
                  onValueChange={([value]) =>
                    setSettings({
                      ...settings,
                      autoDistribution: {
                        ...settings.autoDistribution,
                        likePercentage: value,
                      },
                    })
                  }
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Hesapların {settings.autoDistribution.likePercentage}%'i beğeni yapacak
                </p>
              </div>

              {/* Retweet Percentage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Retweet Oranı</Label>
                  <span className="text-sm font-medium text-slate-300">
                    {settings.autoDistribution.retweetPercentage}%
                  </span>
                </div>
                <Slider
                  value={[settings.autoDistribution.retweetPercentage]}
                  onValueChange={([value]) =>
                    setSettings({
                      ...settings,
                      autoDistribution: {
                        ...settings.autoDistribution,
                        retweetPercentage: value,
                      },
                    })
                  }
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Hesapların {settings.autoDistribution.retweetPercentage}%'i retweet yapacak
                </p>
              </div>

              {/* Comment Percentage */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Yorum Oranı</Label>
                  <span className="text-sm font-medium text-slate-300">
                    {settings.autoDistribution.commentPercentage}%
                  </span>
                </div>
                <Slider
                  value={[settings.autoDistribution.commentPercentage]}
                  onValueChange={([value]) =>
                    setSettings({
                      ...settings,
                      autoDistribution: {
                        ...settings.autoDistribution,
                        commentPercentage: value,
                      },
                    })
                  }
                  max={100}
                  step={5}
                  className="w-full"
                />
                <p className="text-xs text-slate-500">
                  Hesapların {settings.autoDistribution.commentPercentage}%'i yorum yapacak
                </p>
              </div>

              {/* Preview */}
              <div className="p-3 bg-slate-900/50 rounded border border-slate-800">
                <p className="text-xs text-slate-400 mb-2">Örnek Dağıtım (3 Hesap):</p>
                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-pink-500"></div>
                    <span className="text-slate-300">
                      {Math.ceil((settings.autoDistribution.likePercentage / 100) * 3)} hesap beğeni yapacak
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-slate-300">
                      {Math.ceil((settings.autoDistribution.retweetPercentage / 100) * 3)} hesap retweet yapacak
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-slate-300">
                      {Math.ceil((settings.autoDistribution.commentPercentage / 100) * 3)} hesap yorum yapacak
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {!settings.autoDistribution.enabled && (
            <div className="p-4 bg-slate-900/50 rounded border border-slate-800">
              <p className="text-sm text-slate-400">
                Otomatik dağıtım kapalı. Hesapların manuel ayarları kullanılacak.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving} size="lg">
          <Save className="w-5 h-5 mr-2" />
          {saving ? 'Kaydediliyor...' : 'Ayarları Kaydet'}
        </Button>
      </div>
    </div>
  );
}
