/*
 * En küçük service worker.
 *
 * NEDEN VAR: Android/Chrome, "ana ekrana ekle"de gerçek bir uygulama (WebAPK)
 * üretmek için manifest'in YANINDA bir service worker ve fetch dinleyicisi
 * arıyor. Olmadığında yalnızca bir kısayol oluşuyor; o kısayol ayrı bir
 * depolama kutusunda açılıyor ve oturum çerezi her açılışta kayboluyor —
 * Yunus'un "her girişimde şifre soruyor" dediği durum bu.
 *
 * NEDEN ÖNBELLEK YOK: bir şeyi önbelleğe almak, ekibe panonun eski hâlini
 * göstermek demek. Görev panosunda bayat veri, çalışmayan panodan kötüdür.
 * Bu yüzden burada hiçbir yanıt saklanmıyor; dosyanın tek işi Chrome'a
 * "bu bir uygulamadır" demek.
 */

self.addEventListener("install", () => self.skipWaiting());

self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("fetch", () => {
  // Bilerek boş: respondWith çağrılmadığı için tarayıcı isteği normal şekilde
  // ağdan alıyor. Araya girmek, hiçbir fayda sağlamadan yeni bir hata yüzeyi
  // açardı.
});
