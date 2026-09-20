import type { MetadataRoute } from "next";

/**
 * Web app manifest.
 *
 * NEDEN VAR: Yunus panoyu telefonda ana ekrana "uygulama" olarak ekleyince
 * HER açılışta şifre soruyordu. Sebep çerez değil (oturum çerezi 400 gün,
 * httpOnly, Max-Age ile yazılıyor) — manifest ve `apple-mobile-web-app-capable`
 * olmayınca iOS bunu gerçek bir uygulama saymıyor, kısayolu her açılışta
 * kalıcı olmayan bir depolama alanıyla başlatıyor ve oturum kayboluyor.
 *
 * `display: "standalone"` + layout'taki `appleWebApp.capable` ikisi birlikte
 * gerekiyor: manifest Android/Chrome tarafını, apple meta etiketi iOS'u ikna
 * ediyor.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Inner Edge Ekip Panosu",
    short_name: "Inner Edge",
    description: "Kürşad, Sarah ve Yunus'un ortak görev panosu.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    lang: "tr",
    dir: "ltr",
    background_color: "#121a24",
    theme_color: "#121a24",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
