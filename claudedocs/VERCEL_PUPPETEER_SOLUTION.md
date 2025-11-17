# Vercel Serverless + Puppeteer/Playwright Çözüm Stratejisi

**Tarih**: 17 Kasım 2025
**Durum**: ⚠️ Kritik - Bot Çalışmıyor
**Sorun**: Puppeteer/Playwright Vercel serverless ortamında çalışamıyor

---

## 📋 Sorun Analizi

### Temel Problem
Vercel serverless Lambda environment'ında **Chrome/Chromium binary bulunmuyor**. Bot automation için browser gerekiyor ancak Vercel bu desteği sunmuyor.

### Teknik Kısıtlamalar

| Kısıt | Değer | Sorun |
|-------|-------|-------|
| Function Size Limit | 50 MB | Chromium ~200 MB |
| Execution Timeout | 10s (Hobby) / 60s (Pro) | 3 hesap işlemi ~45-60s |
| No Chrome Binary | ❌ | Puppeteer çalışamaz |
| No Custom Binaries | ❌ | Chrome yüklenemez |

### Denenen Çözümler ve Sonuçları

#### ✅ Deneme 1: Playwright + @sparticuz/chromium
```bash
npm install playwright-core @sparticuz/chromium
```
**Sonuç**: ❌ **BAŞARISIZ**
```
Error: The input directory "/var/task/node_modules/@sparticuz/chromium/bin"
does not exist. Please provide the location of the brotli files.
```
**Neden**: @sparticuz/chromium paketi Vercel'de düzgün deploy olmuyor.

---

#### ✅ Deneme 2: Puppeteer + chrome-aws-lambda
```bash
npm install puppeteer-core@10.1.0 chrome-aws-lambda@10.1.0
```
**Sonuç**: ❌ **BAŞARISIZ**
```
Module not found: Can't resolve './ROOT/node_modules/chrome-aws-lambda/build/puppeteer/lib/Browser'
```
**Neden**: chrome-aws-lambda Next.js 16 Turbopack ile uyumsuz.

---

#### ✅ Deneme 3: Standard Puppeteer
```bash
npm install puppeteer@24.30.0
```
**Sonuç**: ⚠️ **Local Build Başarılı, Vercel'de Çalışmayacak**
```
Error: Could not find Chrome/Chromium executable
```
**Neden**: Vercel Lambda'da Chrome binary yok.

---

## 🚀 Çözüm Önerileri

### Öneri 1: External Bot Worker (⭐ ÖNERİLEN)

**Mimari**: Monorepo split - Vercel (Frontend/API) + Railway/Render (Bot Worker)

```
┌─────────────────┐         ┌──────────────────┐
│  Vercel         │         │  Railway/Render  │
│  (Frontend)     │◄───────►│  (Bot Worker)    │
├─────────────────┤  API    ├──────────────────┤
│ • Dashboard UI  │         │ • Puppeteer      │
│ • MongoDB API   │         │ • Chromium       │
│ • Settings      │         │ • Queue Worker   │
└─────────────────┘         └──────────────────┘
```

#### Implementation Adımları

**1. Bot Worker Projesi Oluştur**
```bash
mkdir x-bot-worker
cd x-bot-worker
npm init -y
npm install express puppeteer mongodb bullmq ioredis
```

**2. Worker Dockerfile**
```dockerfile
FROM node:20-slim

# Chromium dependencies
RUN apt-get update && apt-get install -y \
    chromium \
    chromium-driver \
    fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst fonts-freefont-ttf \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .

EXPOSE 3001
CMD ["node", "worker.js"]
```

**3. Worker API (worker.js)**
```javascript
const express = require('express');
const puppeteer = require('puppeteer');
const { MongoClient } = require('mongodb');

const app = express();
app.use(express.json());

// MongoDB connection
const mongoClient = new MongoClient(process.env.MONGODB_URI);

// Bot execution endpoint
app.post('/bot/execute', async (req, res) => {
  const { tweetUrl, accountIds, sessionId } = req.body;

  // Queue job or execute directly
  res.json({ status: 'processing', sessionId });

  // Execute bot in background
  executeBotJob(tweetUrl, accountIds, sessionId);
});

async function executeBotJob(tweetUrl, accountIds, sessionId) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  // Bot logic here (copy from app/api/bot/start/route.ts)

  await browser.close();
}

app.listen(3001, () => {
  console.log('Bot worker running on port 3001');
});
```

**4. Vercel API Değişikliği**
```typescript
// app/api/bot/start/route.ts
export async function POST(request: NextRequest) {
  const body = await request.json();

  // Forward to bot worker instead of running locally
  const workerResponse = await fetch(process.env.BOT_WORKER_URL + '/bot/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  return NextResponse.json(await workerResponse.json());
}
```

**5. Railway Deployment**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login and deploy
railway login
railway init
railway up

# Set environment variables
railway variables set MONGODB_URI="mongodb+srv://..."
railway variables set GROQ_API_KEY="gsk_..."
```

**6. Vercel Environment Variable**
```bash
vercel env add BOT_WORKER_URL production
# Value: https://x-bot-worker.up.railway.app
```

#### Avantajlar
- ✅ Chromium tam çalışır (Docker ile)
- ✅ Timeout limiti yok
- ✅ Vercel frontend hızlı kalır
- ✅ Ölçeklenebilir (Redis Queue eklenebilir)
- ✅ Maliyet: Railway $5/month (500 saat)

#### Dezavantajlar
- ⚠️ İki ayrı deployment
- ⚠️ API gecikme (+50-100ms)

---

### Öneri 2: Browserless.io Managed Service

**Mimari**: Vercel + Uzak Chrome Browser Service

```
┌─────────────────┐         ┌──────────────────┐
│  Vercel         │ WSS     │  Browserless.io  │
│  (Full Stack)   │◄───────►│  (Chrome Cloud)  │
├─────────────────┤         ├──────────────────┤
│ • Dashboard     │         │ • Chrome Binary  │
│ • Puppeteer API │         │ • Managed        │
│ • MongoDB       │         │ • Auto-scale     │
└─────────────────┘         └──────────────────┘
```

#### Implementation

**1. Browserless.io Hesap**
- Sign up: https://browserless.io
- Get WebSocket URL: `wss://chrome.browserless.io?token=YOUR_TOKEN`

**2. Puppeteer Değişikliği**
```typescript
// lib/bot/puppeteer.ts
export async function launchBrowser(): Promise<Browser> {
  const browserWSEndpoint = process.env.BROWSERLESS_WS_ENDPOINT;

  const browser = await puppeteer.connect({
    browserWSEndpoint,
  });

  return browser;
}
```

**3. Environment Variable**
```bash
vercel env add BROWSERLESS_WS_ENDPOINT production
# Value: wss://chrome.browserless.io?token=abc123...
```

#### Avantajlar
- ✅ En az kod değişikliği
- ✅ Tek deployment (Vercel)
- ✅ Profesyonel managed service
- ✅ Auto-scaling ve monitoring

#### Dezavantajlar
- ❌ Maliyet: $49-99/month
- ❌ Vendor lock-in
- ❌ Network latency

---

### Öneri 3: Railway/Render Full Stack Migration

**Mimari**: Tüm projeyi Vercel'den taşı

```
┌────────────────────────────┐
│  Railway/Render            │
│  (Full Stack + Bot)        │
├────────────────────────────┤
│ • Next.js Frontend         │
│ • API Routes               │
│ • MongoDB Connection       │
│ • Puppeteer + Chromium     │
└────────────────────────────┘
```

#### Implementation

**1. Railway Dockerfile**
```dockerfile
FROM node:20

# Chromium
RUN apt-get update && apt-get install -y chromium

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

**2. Railway Deploy**
```bash
railway login
railway init
railway up
```

#### Avantajlar
- ✅ Tek platform, basit deployment
- ✅ Chromium tam çalışır
- ✅ Timeout yok
- ✅ Maliyet: $5/month

#### Dezavantajlar
- ❌ Vercel kadar hızlı değil
- ❌ CDN/Edge yok
- ❌ Cold start olabilir

---

## 💰 Maliyet Karşılaştırması

| Çözüm | Aylık Maliyet | Setup Süresi | Karmaşıklık |
|-------|--------------|--------------|-------------|
| **Öneri 1**: Railway Worker | $5 (Railway) + $0 (Vercel Hobby) | 2 saat | Orta |
| **Öneri 2**: Browserless | $49-99 | 30 dakika | Düşük |
| **Öneri 3**: Railway Full | $5 | 1 saat | Düşük |

---

## 🎯 Önerilen Çözüm: Railway Bot Worker (Öneri 1)

### Neden Bu Çözüm?
1. **Maliyet Etkin**: $5/month
2. **Ölçeklenebilir**: Redis Queue eklenebilir
3. **Vercel Avantajları**: Frontend hızlı kalır
4. **Production-Ready**: Docker ile stabil

### Hızlı Başlangıç

**1. Worker Kodu Hazırla** (30 dakika)
```bash
mkdir ../x-bot-worker
cd ../x-bot-worker
# worker.js ve Dockerfile oluştur (yukarıdaki kodlar)
```

**2. Railway Deploy** (10 dakika)
```bash
railway login
railway init
railway up
railway domain  # Get public URL
```

**3. Vercel Güncelle** (20 dakika)
```typescript
// app/api/bot/start/route.ts güncellemesi
// MongoDB ve log streaming yerel kalır
// Sadece browser işlemlerini worker'a gönder
```

**Toplam Süre**: ~1 saat

---

## 📞 Sonraki Adımlar

### Kısa Vadeli (Bugün)
1. ✅ Sorun analizi tamamlandı
2. ⏳ Kullanıcı çözüm seçsin
3. ⏳ Seçilen çözüm implement et

### Orta Vadeli (Bu Hafta)
1. Queue sistemi ekle (BullMQ + Redis)
2. Worker monitoring (health checks)
3. Error handling iyileştir

### Uzun Vadeli (Gelecek)
1. Multi-worker scaling
2. Rate limiting
3. Analytics dashboard

---

## 🔗 Kaynaklar

- [Railway Docs](https://docs.railway.app/)
- [Puppeteer Docker](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#running-puppeteer-in-docker)
- [Browserless.io](https://www.browserless.io/)
- [Vercel Limitations](https://vercel.com/docs/limits/overview)

---

**Oluşturulma Tarihi**: 2025-11-17
**Oluşturan**: Claude Code
**Versiyon**: 1.0
