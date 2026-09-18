import { cookies } from "next/headers";
import { GirisFormu } from "./GirisFormu";
import { KISI_COOKIE } from "@/lib/kisi";
import { serverClient } from "@/lib/supabase/server";

/** Kadro: "Ben kimim" menüsündeki isimler. Giriş yetkisiyle ilgisi yok. */
async function kadro(): Promise<string[]> {
  const supabase = await serverClient();
  const { data } = await supabase
    .from("kisiler")
    .select("display_name")
    .eq("sadece_sorumlu", false)
    .eq("arsiv", false)
    .order("sort");
  const isimler = (data ?? []).map((r) => r.display_name as string);
  // Oturum yokken RLS boş döndürür; giriş ekranında liste yine de görünmeli.
  return isimler.length ? isimler : ["Kürşad", "Sarah", "Yunus"];
}

export default async function Page() {
  const isimler = await kadro();
  const kayitli = (await cookies()).get(KISI_COOKIE)?.value;
  const secili = kayitli && isimler.includes(kayitli) ? kayitli : isimler[0];

  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-xl font-semibold">
        Inner Edge <span style={{ color: "var(--c-teal)" }}>Ekip Panosu</span>
      </h1>
      <p className="mt-1 mb-6 text-sm" style={{ color: "var(--c-mute)" }}>
        Ekip şifresini gir ve kim olduğunu seç. Bu bilgisayarda bir daha sorulmayacak.
      </p>
      <GirisFormu kadro={isimler} seciliKisi={secili} />
    </div>
  );
}
