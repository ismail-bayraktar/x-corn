# 🚀 Vercel Deployment Guide

Bu rehber, x-corn projesini MongoDB Atlas ile Vercel'e deploy etmek için gereken adımları içerir.

## 📋 Ön Gereksinimler

- [x] MongoDB Atlas hesabı
- [x] Vercel hesabı
- [x] Groq API key
- [x] GitHub repository (kod yüklenmeli)

---

## 1️⃣ MongoDB Atlas Kurulumu

### IP Whitelist Ayarı (ÖNEMLİ!)

1. MongoDB Atlas'a giriş yapın: https://cloud.mongodb.com/
2. Sol menüden **Network Access** seçin
3. **+ ADD IP ADDRESS** butonuna tıklayın
4. **ALLOW ACCESS FROM ANYWHERE** seçin
   - IP Address: `0.0.0.0/0`
   - Comment: `Vercel deployment`
5. **Confirm** butonuna tıklayın

> ⚠️ **Önemli**: Bu adım yapılmadan bağlantı başarısız olur!

### Connection String Kontrolü

`.env.local` dosyanızdaki `MONGODB_URI` şu formatta olmalı:

```
mongodb+srv://<username>:<password>@<cluster>.mongodb.net/?appName=<appName>
```

**Örnek**:
```
mongodb+srv://xcorn:TOPC2AExIPzgX4Tx@cluster0.ymji9vz.mongodb.net/?appName=Cluster0
```

---

## 2️⃣ Veritabanı Migration

IP whitelist ayarını yaptıktan sonra:

### Bağlantıyı Test Et
```bash
npm run db:test
```

Başarılı sonuç:
```
✅ MongoDB Atlas bağlantısı başarılı!
📊 MongoDB Server Bilgileri:
   Versiyon: 8.0.x
   ...
```

### Seed Verilerini Migrate Et
```bash
npm run db:migrate
```

Bu komut:
- 3 adet seed hesabını MongoDB'ye ekler
- BotSettings dökümanını oluşturur
- Index'leri senkronize eder

Başarılı sonuç:
```
🎉 Migration başarıyla tamamlandı!
📈 Final Durum:
   📁 Accounts: 3 hesap
   ⚙️  BotSettings: 1 ayar
```

---

## 3️⃣ Vercel Deployment

### A. Vercel CLI ile Deploy (Önerilen)

1. **Vercel CLI Kurulumu**:
```bash
npm install -g vercel
```

2. **Vercel'e Login**:
```bash
vercel login
```

3. **Environment Variables Ayarla**:
```bash
# MongoDB URI
vercel env add MONGODB_URI
# Değer: .env.local dosyanızdaki MONGODB_URI değerini girin

# Groq API Key
vercel env add GROQ_API_KEY
# Değer: .env.local dosyanızdaki GROQ_API_KEY değerini girin
```

> **Not**: Her environment variable için:
> - Environment: `Production`, `Preview`, `Development` (hepsini seçin)
> - Enter tuşuna basın

4. **Deploy**:
```bash
vercel
```

İlk deploy için soruları yanıtlayın:
- Set up and deploy? → **Y**
- Which scope? → *hesabınızı seçin*
- Link to existing project? → **N**
- What's your project's name? → **x-corn** (veya tercih ettiğiniz isim)
- In which directory is your code located? → **./** (Enter)

5. **Production Deploy**:
```bash
vercel --prod
```

---

### B. Vercel Dashboard ile Deploy (Alternatif)

1. **Vercel Dashboard'a git**: https://vercel.com/dashboard
2. **New Project** → **Import Git Repository**
3. Repository'nizi seçin
4. **Environment Variables** ekleyin:
   - `MONGODB_URI`: `mongodb+srv://xcorn:...`
   - `GROQ_API_KEY`: `gsk_...`
5. **Deploy** butonuna tıklayın

---

## 4️⃣ Deployment Sonrası Kontroller

### Vercel URL'ini Al
```bash
vercel ls
```

Son deployment URL'ini kopyalayın (örn: `x-corn-abc123.vercel.app`)

### Site Kontrolü

1. **Ana Sayfa**: `https://your-app.vercel.app`
2. **Dashboard**: `https://your-app.vercel.app/dashboard`
3. **Hesaplar**: `https://your-app.vercel.app/dashboard/accounts`
4. **Bot Control**: `https://your-app.vercel.app/dashboard/bot-control`

### API Health Check

Tarayıcınızda test edin:
```
https://your-app.vercel.app/api/accounts
```

Başarılı sonuç: 3 hesap listesi göreceksiniz.

---

## 5️⃣ Troubleshooting

### Problem: "MongooseServerSelectionError"

**Çözüm**: MongoDB Atlas IP whitelist ayarını kontrol edin
- Network Access → 0.0.0.0/0 eklenmiş olmalı

### Problem: "MONGODB_URI is not defined"

**Çözüm**: Vercel environment variables'ı kontrol edin
```bash
vercel env ls
```

Eksikse ekleyin:
```bash
vercel env add MONGODB_URI
```

### Problem: Build hatası

**Çözüm**: Local'de build test edin
```bash
npm run build
```

Hataları düzeltip yeniden deploy edin:
```bash
git add .
git commit -m "fix: deployment issues"
git push
vercel --prod
```

---

## 6️⃣ Environment Variables Özeti

Vercel'de ayarlanması gereken değişkenler:

| Variable | Description | Example |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB Atlas connection | `mongodb+srv://...` |
| `GROQ_API_KEY` | Groq AI API key | `gsk_...` |

---

## 7️⃣ Güvenlik Notları

### ✅ Yapılanlar
- MongoDB Atlas kimlik doğrulaması aktif
- Environment variables Vercel secrets olarak saklanıyor
- API routes Next.js ile korunuyor

### ⚠️ Öneriler
- Groq API key'i düzenli olarak rotate edin
- MongoDB user'ının sadece gerekli yetkileri olsun
- Production'da debug mod'u kapatın

---

## 8️⃣ Vercel Konfigürasyonu

`vercel.json` dosyası:
```json
{
  "version": 2,
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "framework": "nextjs",
  "env": {
    "MONGODB_URI": "@mongodb_uri",
    "GROQ_API_KEY": "@groq_api_key"
  }
}
```

---

## 9️⃣ Deployment Checklist

Deployment öncesi kontrol listesi:

- [ ] MongoDB Atlas IP whitelist ayarlandı (0.0.0.0/0)
- [ ] Local'de `npm run db:test` başarılı
- [ ] Local'de `npm run db:migrate` çalıştırıldı
- [ ] Local'de `npm run build` başarılı
- [ ] Vercel environment variables ayarlandı
- [ ] GitHub'a son kod push'landı
- [ ] Vercel deployment tamamlandı
- [ ] Production URL'de site çalışıyor
- [ ] API endpoints test edildi
- [ ] Dashboard sayfaları çalışıyor

---

## 🎉 Tebrikler!

Başarıyla deploy ettiyseniz:
- ✅ MongoDB Atlas'a bağlı
- ✅ Vercel'de çalışıyor
- ✅ Production-ready

**Next Steps**:
- Bot'u test edin
- Hesap ayarlarını yapın
- Tweet URL'leri ile bot'u çalıştırın

---

## 📞 Support

Sorun yaşarsanız:
1. Vercel logs kontrol edin: `vercel logs`
2. MongoDB Atlas logs kontrol edin
3. Local'de debug edin: `npm run dev`

**Deployment URL**: `https://your-app.vercel.app`
