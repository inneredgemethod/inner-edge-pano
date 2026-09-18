"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore, type Theme } from "@/lib/store";

const TABS = [
  { href: "/", label: "Genel", icon: "◎" },
  { href: "/gorevler", label: "Görevler", icon: "☰" },
  { href: "/benim", label: "Benim", icon: "★" },
  { href: "/ekle", label: "Ekle", icon: "＋" },
] as const;

function useActive() {
  const path = usePathname();
  return (href: string) => (href === "/" ? path === "/" : path.startsWith(href));
}

/** Masaüstü: üstte tek satır navbar. Mobilde gizli. */
export function TopBar() {
  const { kimlik, theme, setTheme } = useStore();
  const isActive = useActive();

  return (
    <header
      className="sticky top-0 z-20 border-b"
      style={{ borderColor: "var(--c-line)", background: "var(--c-bg)" }}
    >
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
        <Link href="/" className="text-lg font-semibold">
          Inner Edge <span style={{ color: "var(--c-teal)" }}>Ekip Panosu</span>
        </Link>

        <nav className="ml-2 hidden gap-1 md:flex" aria-label="Ana gezinme">
          {TABS.map((t) => (
            <Link
              key={t.href}
              href={t.href}
              aria-current={isActive(t.href) ? "page" : undefined}
              className="rounded-lg px-3 py-1.5 text-sm"
              style={{
                background: isActive(t.href) ? "var(--c-bg2)" : "transparent",
                color: isActive(t.href) ? "var(--c-teal)" : "var(--c-mute)",
              }}
            >
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <span
            className="rounded-full px-2.5 py-1 text-[11px] font-semibold"
            style={{ background: kimlik.color, color: "#0b1f1c" }}
            title={kimlik.email}
          >
            {kimlik.display_name}
          </span>

          <form action="/cikis" method="post">
            <button
              type="submit"
              className="rounded-lg border px-2.5 py-1 text-xs"
              style={{ borderColor: "var(--c-line)", color: "var(--c-mute)" }}
            >
              Çıkış
            </button>
          </form>

          <select
            value={theme}
            onChange={(e) => setTheme(e.target.value as Theme)}
            aria-label="Tema"
            className="rounded-lg border px-2 py-1 text-sm"
            style={{
              background: "var(--c-bg2)",
              borderColor: "var(--c-line)",
              color: "var(--c-ink)",
            }}
          >
            <option value="dark">Koyu</option>
            <option value="light">Açık</option>
            <option value="system">Sistem</option>
          </select>
        </div>
      </div>
    </header>
  );
}

/** Mobil: altta sabit sekme çubuğu. Masaüstünde gizli. */
export function BottomNav() {
  const isActive = useActive();

  return (
    <nav
      aria-label="Alt sekme çubuğu"
      className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t md:hidden"
      style={{
        borderColor: "var(--c-line)",
        background: "var(--c-bg2)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {TABS.map((t) => {
        const on = isActive(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className="flex min-h-[3.25rem] flex-col items-center justify-center gap-0.5 text-[11px]"
            style={{ color: on ? "var(--c-teal)" : "var(--c-mute)" }}
          >
            <span aria-hidden className="text-base leading-none">
              {t.icon}
            </span>
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
