# Testler

Playwright ile, gerçek tarayıcıda, telefon genişliğinde (390px / iPhone 14 Pro).

```bash
npm run test:sunucu                      # temiz build + 3002'de baslatir
export PANO_URL=http://localhost:3002
npm run test:giris && npm run test:etkilesim && npm run test:kalicilik && npm run test:ekran
```

**`test:sunucu` neden var:** `pkill -f "next start"` asıl süreci ÖLDÜRMEZ
(o `next-server` adıyla çalışır). Eski süreç portu tutmaya devam eder, yeni
build sessizce başlamaz ve **testler eski kodu test eder**. Bu tuzağa birkaç
kez düşüldü; script porta göre öldürüp build'i baştan alıyor.

Ayrıca `next dev` ile `next build` aynı `.next` klasörünü paylaşır; biri
çalışırken diğerini koşturursan dev sunucusu 500 vermeye başlar.

## `giris.mjs` neyi doğruluyor
Girişsiz erişimin engellenmesi · yanlış şifrenin reddi · **şifrenin sunucu
HTML'ine sızmaması** (hem ekip şifresi hem paylaşılan Supabase hesabınınki) ·
doğru şifreyle giriş · kişi seçiminin hatırlanması · çıkış.

## `kalicilik.mjs` neyi doğruluyor
Yazmanın kalıcı olması · log'un **seçili kişi** adına yazılması · Realtime'ın
iki ayrı tarayıcı arasında çalışması · K6 silme kuralı.

**Neden dev sunucusunda değil:** `next dev` sayfaya bir geliştirici rozeti
(`<nextjs-portal>`) basıyor, sol alt köşedeki tıklamaları yiyor ve alt sekme
çubuğu test edilemiyor. Production build'de böyle bir şey yok.

## `etkilesim.mjs` neyi doğruluyor
Durum değiştirme · not ekleme (kim/ne zaman ile) · sekme değişince durumun
korunması · kişi/faz/geciken filtreleri · "Ben" menüsünün Benim sekmesini
sürüklemesi · görev ekleme · K6 silme kuralı.

`benSec()` yardımcısı "Ben"i değiştirdikten sonra hem select değerinin hem
çerezin güncellendiğini bekler. Sabit `waitForTimeout` kırılgandı: seçim
state'e yansımadan devam edilince K6 kontrolleri bazen eski kişiyle koşuyordu.

## `ekran.mjs` neyi doğruluyor
4 ekranın + görev detayının ekran görüntüsünü alır ve her birinde **yatay taşma**
ölçer. Mobilde en sık çıkan hata budur; 0px değilse düzeltilmeli.
