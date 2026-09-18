import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inner Edge · Ekip Panosu",
  description: "Kürşad, Sarah ve Yunus'un ortak görev panosu.",
};

export const viewport: Viewport = {
  themeColor: "#121a24",
  width: "device-width",
  initialScale: 1,
};

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
        <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
      </head>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
