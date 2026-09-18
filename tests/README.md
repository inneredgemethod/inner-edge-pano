# Testler

Playwright ile, gerçek tarayıcıda, telefon genişliğinde (390px / iPhone 14 Pro).

```bash
npm run build
lsof -ti tcp:3002 | xargs -r kill -9     # eski süreç kalmışsa
PORT=3002 npm start &
export PANO_URL=http://localhost:3002
npm run test:giris && npm run test:etkilesim && npm run test:ekran
```

**Dikkat:** `next dev` ve `next build` aynı `.next` klasörünü paylaşır; biri
çalışırken diğerini koşturursan dev sunucusu 500 vermeye başlar. Ayrıca
`pkill -f "next start"` süreci öldürmez (asıl süreç `next-server`); porta
göre öldür.

## `giris.mjs` neyi doğruluyor
Girişsiz erişimin engellenmesi · izin listesi dışı e-postaya **link
gönderilmemesi** · bozuk linkte anlaşılır mesaj · gerçek jetonla giriş ·
verinin veritabanından gelmesi · çıkış. Gerçek e-posta göndermez: Supabase
admin API'sinden `generate_link` ile jeton üretir (`tests/oturum.mjs`).

**Neden dev sunucusunda değil:** `next dev` sayfaya bir geliştirici rozeti
(`<nextjs-portal>`) basıyor, sol alt köşedeki tıklamaları yiyor ve alt sekme
çubuğu test edilemiyor. Production build'de böyle bir şey yok.

## `etkilesim.mjs` neyi doğruluyor
Durum değiştirme · not ekleme (kim/ne zaman ile) · sekme değişince durumun
korunması · kişi/faz/geciken filtreleri · "Ben" menüsünün Benim sekmesini
sürüklemesi · görev ekleme · K6 silme kuralı (ekleyen + Kürşad).

## `ekran.mjs` neyi doğruluyor
4 ekranın + görev detayının ekran görüntüsünü alır ve her birinde **yatay taşma**
ölçer. Mobilde en sık çıkan hata budur; 0px değilse düzeltilmeli.
