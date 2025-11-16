# X-Corn - Twitter Bot Yönetim Paneli

Twitter hesaplarınız için otomasyon yönetim paneli. Birden fazla hesap ile otomatik beğeni, retweet ve AI destekli yorum yapabilme.

## Özellikler

- 🤖 **Çoklu Hesap Yönetimi** - Sınırsız Twitter hesabı ekleyin ve yönetin
- 🔄 **Otomatik İşlemler** - Beğeni, retweet, AI destekli yorum
- 📊 **Dashboard & Analytics** - Detaylı istatistikler ve aktivite geçmişi
- 🎨 **Modern UI** - shadcn/ui ile karanlık tema
- 🔒 **Güvenli** - Cookie bazlı authentication, doğrulama sistemi
- 💾 **Kalıcı Veri** - MongoDB ile tüm veriler kalıcı

## Teknolojiler

- **Framework**: Next.js 16 (App Router)
- **UI**: shadcn/ui, Tailwind CSS
- **Database**: MongoDB + Mongoose
- **Automation**: Puppeteer
- **AI**: Groq API
- **State**: Zustand
- **Deployment**: Vercel

## Kurulum

### Gereksinimler

- Node.js 20+
- MongoDB (Docker veya MongoDB Atlas)
- Groq API Key

### Yerel Geliştirme

1. **Depoyu klonlayın**
```bash
git clone https://github.com/ismail-bayraktar/x-corn.git
cd x-corn
```

2. **Bağımlılıkları yükleyin**
```bash
npm install
```

3. **Environment variables**
`.env.local` dosyası oluşturun:
```env
MONGODB_URI=mongodb://admin:admin123@localhost:27017/xcorn?authSource=admin
GROQ_API_KEY=your_groq_api_key_here
```

4. **MongoDB'yi başlatın** (Docker)
```bash
docker-compose up -d
```

5. **Geliştirme sunucusunu başlatın**
```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` adresini açın.

## Vercel Deploy

1. **MongoDB Atlas** hesabı oluşturun ve connection string alın

2. **Vercel'e deploy edin**
```bash
vercel
```

3. **Environment Variables** ekleyin (Vercel Dashboard):
   - `MONGODB_URI`: MongoDB Atlas connection string
   - `GROQ_API_KEY`: Groq API key

## Kullanım

### Hesap Ekleme

1. **Ayarlar** sayfasına gidin
2. **Yeni Hesap Ekle** butonuna tıklayın
3. Twitter hesap bilgilerini girin:
   - Username
   - `auth_token` cookie
   - `ct0` cookie
4. **Kaydet** ve **Doğrula**

### Cookie Alma

1. Twitter'a giriş yapın
2. DevTools → Application → Cookies → `https://x.com`
3. `auth_token` ve `ct0` değerlerini kopyalayın

### Bot Çalıştırma

1. **Bot Kontrol** sayfasına gidin
2. Kullanmak istediğiniz hesapları seçin
3. Tweet URL'sini girin
4. **Başlat** butonuna tıklayın

## Katkıda Bulunma

Pull request'ler kabul edilir. Büyük değişiklikler için önce bir issue açın.

## Lisans

MIT
