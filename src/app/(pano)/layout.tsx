import { redirect } from "next/navigation";
import { HataBandi } from "@/components/HataBandi";
import { BottomNav, TopBar } from "@/components/Nav";
import { todayInIstanbul } from "@/lib/data";
import { StoreProvider } from "@/lib/store";
import { panoyuOku } from "@/lib/supabase/queries";

/** Bu grup her zaman taze okunur; görev listesi önbelleğe alınmamalı. */
export const dynamic = "force-dynamic";

export default async function PanoLayout({ children }: { children: React.ReactNode }) {
  const { kimlik, tasks, phases } = await panoyuOku();

  // Oturum var ama izin listesinde değil: RLS zaten her şeyi boş döndürür,
  // kullanıcıyı boş ekranda bırakmak yerine net mesaja gönderiyoruz.
  if (!kimlik) redirect("/giris?durum=izinsiz");

  // Sunucu UTC, tarayıcı UTC+3 — bugünü tek yerden veriyoruz.
  const today = todayInIstanbul();

  return (
    <StoreProvider today={today} kimlik={kimlik} tasks={tasks} phases={phases}>
      <TopBar />
      <main className="mx-auto max-w-5xl px-4 py-4">{children}</main>
      <BottomNav />
      <HataBandi />
    </StoreProvider>
  );
}
