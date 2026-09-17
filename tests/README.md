# Testler

Playwright ile, gerçek tarayıcıda, telefon genişliğinde (390px / iPhone 14 Pro).

```bash
npm run build && PORT=3002 npm start      # ayrı bir terminalde
PANO_URL=http://localhost:3002 npm run test:etkilesim
PANO_URL=http://localhost:3002 npm run test:ekran
```

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
