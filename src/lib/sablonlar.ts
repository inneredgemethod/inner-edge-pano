/**
 * Görev şablonları (2.3).
 *
 * Kodda sabit — karar verilmişti. Yeni şablon gerekince buraya eklenir; ayrı
 * bir tablo ve CRUD ekranı kurmak bu ölçekte fazla mühendislik olurdu.
 *
 * `gunOfseti` başlangıç tarihine eklenir: 0 = başlangıç günü, 7 = bir hafta
 * sonra. Sorumlu ve faz yazılmazsa uygulama sırasında seçilen varsayılanlar
 * kullanılır.
 */
export type SablonGorevi = {
  gunOfseti: number;
  title: string;
  owner?: string;
  what?: string;
  why?: string;
  done?: string;
};

export type Sablon = {
  id: string;
  ad: string;
  aciklama: string;
  gorevler: SablonGorevi[];
};

export const SABLONLAR: Sablon[] = [
  {
    id: "bootcamp",
    ad: "Bootcamp kohortu başlat",
    aciklama:
      "6 haftalık kohortun iskeleti. Başlangıç tarihi = 1. haftanın ilk dersi.",
    gorevler: [
      {
        gunOfseti: -7,
        title: "Kohort WhatsApp grubunu kur, Zoom linklerini sabitle",
        owner: "Yunus",
        what: "Kayıt olan herkesi gruba al, 6 haftanın Zoom linklerini grup açıklamasına sabitle.",
        why: "1. gün karmaşa çıkmasın; herkes nereye gireceğini bilsin.",
        done: "Grup açık, linkler sabitlenmiş, kayıtlı herkes içeride.",
      },
      {
        gunOfseti: -3,
        title: "Hoş geldin mesajı ve 1. hafta hazırlığını gönder",
        owner: "Sarah",
        what: "Ne getirecekler, ne okuyacaklar, ilk ders neyi kapsıyor — kısa ve net.",
        why: "Hazırlıksız gelen katılımcı ilk dersten verim alamıyor.",
        done: "Mesaj grupta, sorular cevaplandı.",
      },
      { gunOfseti: 0, title: "1. hafta dersi", owner: "Sarah" },
      { gunOfseti: 7, title: "2. hafta dersi", owner: "Sarah" },
      { gunOfseti: 14, title: "3. hafta dersi", owner: "Sarah" },
      {
        gunOfseti: 17,
        title: "Yarı yol kontrolü: kim geride kaldı?",
        owner: "Kürşad",
        what: "Katılım ve ödev tablosuna bak; iki hafta üst üste gelmeyenlere tek tek yaz.",
        why: "Sessizce düşen katılımcı geri gelmiyor; erken müdahale işe yarıyor.",
        done: "Geride kalan herkesle konuşuldu, durumları grupta özetlendi.",
      },
      { gunOfseti: 21, title: "4. hafta dersi", owner: "Sarah" },
      { gunOfseti: 28, title: "5. hafta dersi", owner: "Sarah" },
      { gunOfseti: 35, title: "6. hafta dersi + kapanış", owner: "Sarah" },
      {
        gunOfseti: 38,
        title: "Video yorum topla (3-5 kişi)",
        owner: "Kürşad",
        what: "Bitirenlerden kısa video yorum iste. Soru ver: neyle geldin, ne değişti.",
        why: "Bir sonraki kohortun duyurusu bunlarla yapılacak.",
        done: "En az 3 video elde, kullanım izni alındı.",
      },
    ],
  },
  {
    id: "kurumsal",
    ad: "Kurumsal görüşme",
    aciklama: "Bir şirketle ilk temastan teklife kadar 4 adım.",
    gorevler: [
      {
        gunOfseti: 0,
        title: "İlk görüşmeyi ayarla ve teşhis sorularını hazırla",
        owner: "Kürşad",
        what: "30 dakikalık görüşme ayarla. Sorular: ekipte ne aksıyor, ne zaman fark ettiler, daha önce ne denediler.",
        why: "Paketi anlatmadan önce sorunu duymak lazım; sunum yapan değil dinleyen kazanıyor.",
        done: "Görüşme yapıldı, notlar panoya not olarak eklendi.",
      },
      {
        gunOfseti: 3,
        title: "Teşhis anketini gönder",
        owner: "Sarah",
        what: "Ekibe kısa anket: karar anında ne hissediyorlar, nerede donuyorlar.",
        why: "Teklif, onların kendi cümleleriyle yazılınca kabul oranı artıyor.",
        done: "Anket gönderildi, en az yarısı doldurdu.",
      },
      {
        gunOfseti: 10,
        title: "Anket sonuçlarını 1 sayfaya indir",
        owner: "Sarah",
        what: "Üç bulgu, her biri için bir öneri. Jargon yok.",
        why: "Uzun rapor okunmuyor; tek sayfa toplantıda masaya konuyor.",
        done: "1 sayfa hazır, Kürşad'a gitti.",
      },
      {
        gunOfseti: 14,
        title: "Teklifi sun ve fiyat ver",
        owner: "Kürşad",
        what: "Bulguları göster, kaç seans ve ne kadar olduğunu net söyle. Pazarlık payını önceden belirle.",
        why: "Teşhisten sonra gecikmek ilgiyi soğutuyor.",
        done: "Teklif gönderildi, cevap tarihi belli.",
      },
    ],
  },
];
