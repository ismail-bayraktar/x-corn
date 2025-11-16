// Groq AI yorum üretimi

const COMMENT_POOL = [
  // Pozitif yorumlar
  "Harika bir paylaşım! 👏",
  "Bu gerçekten ilham verici 🙌",
  "Güzel düşünceler, teşekkürler! 🙏",
  "Tam da bugün buna ihtiyacım vardı ❤️",
  "Süpersin, devam et lütfen! 💪",
  "Gerçekten çok değerli bir tespit 👍",
  "Bunu kaydediyorum 🔖",
  "Düşündürücü bir paylaşım olmuş 🤔",
  "Ne kadar doğru söylüyorsun 👏",
  "Kısa ama çok anlamlı! ✨",
  // Emoji yorumlar
  "🔥🔥🔥",
  "💯",
  "👏👏👏",
  "❤️",
  "🙌",
  "💪💪",
  "✨✨✨",
  "🎯",
  "👍👍",
  "🔥",
  // Daha fazla metin yorumlar
  "Eline sağlık, çok güzel anlatmışsın 🙏",
  "Tam olarak böyle düşünüyordum! 💯",
  "Bunu herkesin görmesi lazım 📢",
  "Çok doğru bir tespit yapmışsın 🎯",
  "Bu konu hakkında en iyi yorum 👏",
  "Kesinlikle katılıyorum 💪",
  "Aynen öyle, mükemmel bir özet ✨",
  "Bunu paylaşmalıyım 🔄",
  "Çok mantıklı bir bakış açısı 🤔",
  "Başka türlü düşünmek zor 👍",
  "Bu bakış açısını sevdim ❤️",
  "Net bir şekilde ifade etmişsin 🔥",
  "Tam vaktinde bir hatırlatma 🙌",
  "İşte aradığım yorum buydu 🎯",
  "Gerçekten anlamlı bir paylaşım 💯",
];

const usedComments = new Set<string>();

/**
 * Groq AI ile yorum üret
 */
export async function generateAiComment(
  tweetText: string
): Promise<string | null> {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    console.log('⚠️ GROQ_API_KEY tanımlı değil, AI yorum atlanıyor.');
    return null;
  }

  try {
    const response = await fetch(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          messages: [
            {
              role: 'system',
              content:
                'Sen Türkçe konuşan, kısa ve samimi sosyal medya yorumları yazan bir asistansın. ' +
                'Yorumların 5-20 kelime arası, pozitif ve doğal olsun. ' +
                'Tweet Ekrem İmamoğlu destekçisi bir fan hesabından geliyor olabilir; ' +
                'bu tonda, destekleyici ve nezaketli yaz. ' +
                'Eğer tweetin içeriğiyle mantıklı bir bağ kuramıyorsan, sadece 1-3 adet emoji ile cevap ver (👏❤️🔥🙌 gibi). ' +
                'Asla saldırgan, hakaret içeren veya siyasi düşmanlaştırıcı bir dil kullanma.',
            },
            {
              role: 'user',
              content: `Aşağıdaki X (Twitter) paylaşımına uygun, tek satırlık bir yorum yaz:\n\n"${tweetText}"`,
            },
          ],
          temperature: 0.9,
          max_tokens: 80,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.log('⚠️ Groq API hata:', response.status, errorText);
      return null;
    }

    const data = await response.json();
    let content = data?.choices?.[0]?.message?.content?.trim();

    if (!content) {
      console.log('⚠️ Groq API valid içerik döndürmedi:', JSON.stringify(data));
      return null;
    }

    // Tırnak işaretlerini temizle
    content = content
      .replace(/^[""]|[""]$/g, '') // Başta ve sonda tırnak varsa kaldır
      .replace(/^['']|['']$/g, '') // Tek tırnak variantları
      .replace(/^"|"$/g, '') // Normal çift tırnak
      .replace(/^'|'$/g, '') // Normal tek tırnak
      .trim();

    return content;
  } catch (err) {
    console.log('⚠️ Groq API isteği sırasında hata:', (err as Error).message);
    return null;
  }
}

/**
 * Rastgele havuzdan yorum seç (kullanılmamış öncelikli)
 */
export function getRandomComment(): string {
  const availableComments = COMMENT_POOL.filter((c) => !usedComments.has(c));

  if (availableComments.length === 0) {
    usedComments.clear(); // Tüm yorumlar kullanıldı, resetle
  }

  const pool = availableComments.length > 0 ? availableComments : COMMENT_POOL;
  const comment = pool[Math.floor(Math.random() * pool.length)];
  usedComments.add(comment);

  return comment;
}

/**
 * Kullanılan yorumları sıfırla
 */
export function resetUsedComments(): void {
  usedComments.clear();
}
