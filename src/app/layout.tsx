import type { Metadata, Viewport } from "next";
import "./globals.css";
import { BottomNav, TopBar } from "@/components/Nav";
import { todayInIstanbul } from "@/lib/data";
import { StoreProvider } from "@/lib/store";

export const metadata: Metadata = {
  title: "Inner Edge · Ekip Panosu",
  description: "Kürşad, Sarah ve Yunus'un ortak görev panosu.",
};

export const viewport: Viewport = {
  themeColor: "#121a24",
  width: "device-width",
  initialScale: 1,
};

/**
 * Tema tercihini ilk boyamadan önce uygula, yoksa koyu→açık geçişinde
 * bir kare beyaz parlama oluyor.
 */
const THEME_BOOT = `
try {
  var t = localStorage.getItem("inner-edge:theme");
  document.documentElement.setAttribute("data-theme", t === "light" || t === "system" ? t : "dark");
} catch (e) {}
`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  // Bugünü sunucuda hesaplayıp aşağı veriyoruz — sunucu UTC, tarayıcı UTC+3.
  const today = todayInIstanbul();

  return (
    <html lang="tr" data-theme="dark" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="font-sans antialiased">
        <StoreProvider today={today}>
          <TopBar />
          <main className="mx-auto max-w-5xl px-4 py-4">{children}</main>
          <BottomNav />
        </StoreProvider>
      </body>
    </html>
  );
}
