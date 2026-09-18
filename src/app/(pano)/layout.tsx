import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { HataBandi } from "@/components/HataBandi";
import { BottomNav, TopBar } from "@/components/Nav";
import { todayInIstanbul } from "@/lib/data";
import { KISI_COOKIE } from "@/lib/kisi";
import { StoreProvider } from "@/lib/store";
import { panoyuOku } from "@/lib/supabase/queries";

/** Bu grup her zaman taze okunur; görev listesi önbelleğe alınmamalı. */
export const dynamic = "force-dynamic";

export default async function PanoLayout({ children }: { children: React.ReactNode }) {
  const { kadro, tasks, phases, oturumVar } = await panoyuOku();

  // Oturum yoksa RLS her şeyi boş döndürür; boş pano göstermek yerine
  // giriş ekranına gönder. (Middleware zaten yakalıyor; bu ikinci kilit.)
  if (!oturumVar) redirect("/giris");

  // Sunucu UTC, tarayıcı UTC+3 — bugünü tek yerden veriyoruz.
  const today = todayInIstanbul();

  const isimler = kadro.map((k) => k.display_name);
  const kayitli = (await cookies()).get(KISI_COOKIE)?.value;
  const me = kayitli && isimler.includes(kayitli) ? kayitli : (isimler[0] ?? "Kürşad");

  return (
    <StoreProvider today={today} kadro={kadro} me={me} tasks={tasks} phases={phases}>
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 py-4">{children}</main>
      <BottomNav />
      <HataBandi />
    </StoreProvider>
  );
}
