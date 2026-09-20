import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inner Edge · Ekip Panosu",
  description: "Kürşad, Sarah ve Yunus'un ortak görev panosu.",
  // iOS'u ikna eden kısım. Bu olmadan ana ekrana eklenen kısayol gerçek bir
  // uygulama sayılmıyor ve her açılışta oturum kayboluyor (şifre tekrar
  // soruluyor). Manifest tek başına Android için yeterli, iOS için değil.
  appleWebApp: {
    capable: true,
    title: "Inner Edge",
    // "black-translucent" içeriği durum çubuğunun ALTINA alır ve sticky
    // başlığımızın üstünü keserdi; varsayılanda kalıyoruz.
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
};

export const viewport: Viewport = {
  themeColor: "#121a24",
  width: "device-width",
  initialScale: 1,
};

/**
 * Service worker kaydı — Android'de "ana ekrana ekle"nin gerçek bir uygulama
 * (WebAPK) üretmesi için gerekiyor. Yüklemeden sonra çalışıyor ki ilk boyamayı
 * geciktirmesin; hata yutuluyor çünkü kayıt başarısız olursa pano yine çalışır.
 */
const SW_BOOT = `
if ("serviceWorker" in navigator) {
  addEventListener("load", function () {
    navigator.serviceWorker.register("/sw.js").catch(function () {});
  });
}
`;

/** Tema tercihini ilk boyamadan önce uygula, yoksa bir kare beyaz parlama oluyor. */
const THEME_BOOT = `
try {
  var t = localStorage.getItem("inner-edge:theme");
  document.documentElement.setAttribute("data-theme", t === "light" || t === "system" ? t : "dark");
} catch (e) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" data-theme="dark" suppressHydrationWarning>
      <head>
        {/*
          ELLE yazılıyor: Next 15 `appleWebApp.capable` için modern
          `mobile-web-app-capable` etiketini basıyor, ama iOS Safari hâlâ
          yalnızca `apple-mobile-web-app-capable`i tanıyor. Bu etiket olmadan
          ana ekrana eklenen kısayol gerçek uygulama sayılmıyor ve her
          açılışta oturum kaybolup şifre soruluyor.
        */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
        <script dangerouslySetInnerHTML={{ __html: SW_BOOT }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
