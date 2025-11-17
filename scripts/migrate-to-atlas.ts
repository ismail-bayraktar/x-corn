// Seed hesaplarını MongoDB Atlas'a migrate et

import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import Account from '../lib/db/models/Account';
import BotSettings from '../lib/db/models/BotSettings';
import { TwitterAccount } from '../lib/bot/types';

// .env.local dosyasını yükle
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;

// Seed hesapları (scripts/seed-accounts.ts'den)
const SEED_ACCOUNTS: TwitterAccount[] = [
  {
    id: '1',
    name: 'mertcanatik34',
    canComment: true,
    canLike: true,
    canRetweet: true,
    useAI: true,
    commentStyle: 'friendly',
    enabled: true,
    cookies: [
      {
        name: 'auth_token',
        value: '2fadac6e4128ef7db29d89433b84536ab895ede3',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      {
        name: 'ct0',
        value: '32bff3aff6f1323e6f64c12b65af527ead0439134f83810e5a1c8fdeaa52f7dc9c6a682bacece0a69314a4c19ea92e434b57e97761ff5cb50ceab67ccdfd3830ba32ea98d830c285c4324e603a30fb77',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'turkiye_senin',
    canComment: true,
    canLike: true,
    canRetweet: true,
    useAI: true,
    commentStyle: 'professional',
    enabled: true,
    cookies: [
      {
        name: 'auth_token',
        value: '514d30ea225d49264964902d706b0124158c3b11',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      {
        name: 'ct0',
        value: 'eca99da78e579ae4017262e76b029a9c2b1a83dcf43b5c885008c35f63037cb34de56c8b2023fca7a9911d13c0976c88960e79300c1aeaa532c213125ab56521af0de8b0930e2b0b1a9216f40f41f8f6',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'myildizlartr',
    canComment: false,
    canLike: true,
    canRetweet: false,
    useAI: false,
    commentStyle: 'informative',
    enabled: true,
    cookies: [
      {
        name: 'auth_token',
        value: '02806bfd92ba53335566897bfcc07dbc48182ba5',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
      {
        name: 'ct0',
        value: 'c477bda4c27eac74f3f2b456a477c102f9a2dd5e0186cee15e3813d13319bb36ee53c7d4a5f1f7b0ab33eaa5052ee50c1a402ba417e71ec9b9a016dca96eaf72f89c111db48130842a12a62af3d028d1',
        domain: '.x.com',
        path: '/',
        httpOnly: true,
        secure: true,
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

async function migrateToAtlas() {
  console.log('🚀 MongoDB Atlas Migration Başlatılıyor...\n');

  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI environment variable bulunamadı!');
    process.exit(1);
  }

  try {
    // Bağlantıyı kur
    console.log('📡 MongoDB Atlas\'a bağlanılıyor...');
    await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    console.log('✅ Bağlantı başarılı!\n');

    // 1. Mevcut hesapları kontrol et
    console.log('🔍 Mevcut hesaplar kontrol ediliyor...');
    const existingAccounts = await Account.find({}).lean();
    console.log(`   Mevcut hesap sayısı: ${existingAccounts.length}\n`);

    // 2. Seed hesaplarını ekle/güncelle
    console.log('📝 Seed hesapları işleniyor...');
    let addedCount = 0;
    let updatedCount = 0;
    let skippedCount = 0;

    for (const seedAccount of SEED_ACCOUNTS) {
      const existing = existingAccounts.find(acc => acc.id === seedAccount.id);

      if (!existing) {
        // Yeni hesap ekle
        await Account.create(seedAccount);
        console.log(`   ✅ Yeni hesap eklendi: ${seedAccount.name}`);
        addedCount++;
      } else {
        // Mevcut hesabı güncelle (sadece yeni alanları ekle)
        const updateData: any = {
          updatedAt: new Date().toISOString(),
        };

        // Yeni alanları kontrol et ve ekle
        if (existing.canLike === undefined) updateData.canLike = seedAccount.canLike;
        if (existing.canRetweet === undefined) updateData.canRetweet = seedAccount.canRetweet;
        if (existing.commentStyle === undefined) updateData.commentStyle = seedAccount.commentStyle;

        // Güncellenecek alan varsa güncelle
        if (Object.keys(updateData).length > 1) {
          await Account.findOneAndUpdate({ id: seedAccount.id }, { $set: updateData });
          console.log(`   🔄 Hesap güncellendi: ${seedAccount.name}`);
          updatedCount++;
        } else {
          console.log(`   ⏭️  Hesap zaten güncel: ${seedAccount.name}`);
          skippedCount++;
        }
      }
    }

    console.log('\n📊 Hesap Migration Özeti:');
    console.log(`   ✅ Yeni eklenen: ${addedCount}`);
    console.log(`   🔄 Güncellenen: ${updatedCount}`);
    console.log(`   ⏭️  Atlanan: ${skippedCount}\n`);

    // 3. BotSettings kontrol et ve oluştur
    console.log('⚙️  Bot ayarları kontrol ediliyor...');
    const settings = await BotSettings.findOne({ id: 'global' });

    if (!settings) {
      const now = new Date().toISOString();
      await BotSettings.create({
        id: 'global',
        autoDistribution: {
          enabled: false,
          likePercentage: 100,
          retweetPercentage: 30,
          commentPercentage: 35,
        },
        createdAt: now,
        updatedAt: now,
      });
      console.log('   ✅ Varsayılan bot ayarları oluşturuldu\n');
    } else {
      console.log('   ⏭️  Bot ayarları zaten mevcut\n');
    }

    // 4. Index'leri oluştur
    console.log('🔧 Database index\'leri oluşturuluyor...');
    await Account.syncIndexes();
    await BotSettings.syncIndexes();
    console.log('   ✅ Index\'ler senkronize edildi\n');

    // 5. Final durum raporu
    console.log('📈 Final Durum:');
    const finalAccountCount = await Account.countDocuments();
    const finalSettingsCount = await BotSettings.countDocuments();
    console.log(`   📁 Accounts: ${finalAccountCount} hesap`);
    console.log(`   ⚙️  BotSettings: ${finalSettingsCount} ayar\n`);

    console.log('🎉 Migration başarıyla tamamlandı!');

  } catch (error) {
    console.error('\n❌ Migration hatası:');
    console.error(`   ${(error as Error).message}`);
    console.error((error as Error).stack);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Bağlantı kapatıldı.');
  }
}

migrateToAtlas();
