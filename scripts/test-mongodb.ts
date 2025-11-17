// MongoDB Atlas bağlantı testi

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .env.local dosyasını yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
  console.log('🔄 MongoDB Atlas bağlantısı test ediliyor...\n');

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable bulunamadı!');
    console.log('💡 .env.local dosyasını kontrol edin.\n');
    process.exit(1);
  }

  try {
    // Bağlantıyı kur
    console.log('📡 Bağlantı kuruluyor...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000, // 10 saniye timeout
    });

    console.log('✅ MongoDB Atlas bağlantısı başarılı!\n');

    // Database bilgilerini göster
    const db = mongoose.connection.db;
    const admin = db.admin();

    // Server status
    const serverStatus = await admin.serverStatus();
    console.log('📊 MongoDB Server Bilgileri:');
    console.log(`   Versiyon: ${serverStatus.version}`);
    console.log(`   Uptime: ${Math.floor(serverStatus.uptime / 3600)} saat`);
    console.log(`   Host: ${serverStatus.host}\n`);

    // Mevcut koleksiyonları listele
    const collections = await db.listCollections().toArray();
    console.log('📁 Mevcut Koleksiyonlar:');
    if (collections.length === 0) {
      console.log('   (Henüz koleksiyon yok - ilk veri eklendiğinde oluşacak)\n');
    } else {
      for (const collection of collections) {
        const count = await db.collection(collection.name).countDocuments();
        console.log(`   - ${collection.name}: ${count} döküman`);
      }
      console.log('');
    }

    // Database stats
    const stats = await db.stats();
    console.log('💾 Database İstatistikleri:');
    console.log(`   Database: ${stats.db}`);
    console.log(`   Koleksiyonlar: ${stats.collections}`);
    console.log(`   Dökümanlar: ${stats.objects}`);
    console.log(`   Boyut: ${(stats.dataSize / 1024).toFixed(2)} KB\n`);

    console.log('✅ Bağlantı testi başarıyla tamamlandı!');

  } catch (error) {
    console.error('❌ MongoDB bağlantı hatası:');
    console.error(`   ${(error as Error).message}\n`);

    if ((error as any).code === 'ENOTFOUND') {
      console.log('💡 DNS hatası - İnternet bağlantınızı kontrol edin');
    } else if ((error as any).name === 'MongoServerError') {
      console.log('💡 Kimlik doğrulama hatası - MongoDB Atlas kullanıcı adı/şifresini kontrol edin');
    } else if ((error as any).name === 'MongooseServerSelectionError') {
      console.log('💡 Server seçim hatası - MongoDB Atlas IP whitelist ayarlarını kontrol edin');
      console.log('   Tüm IP\'lere izin vermek için: 0.0.0.0/0');
    }

    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Bağlantı kapatıldı.');
  }
}

testConnection();
