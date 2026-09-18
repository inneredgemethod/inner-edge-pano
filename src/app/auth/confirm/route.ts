import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { serverClient } from "@/lib/supabase/server";

/**
 * Magic link'i oturuma çevirir. İki akışı da karşılar:
 *
 *  - `code`       PKCE. Ücretsiz planda e-posta şablonu değiştirilemediği için
 *                 şu an kullandığımız akış bu. Linkin, istendiği tarayıcıda
 *                 açılması gerekir (code verifier orada duruyor).
 *  - `token_hash` Cihazdan bağımsız çalışır. Özel SMTP kurulup şablon
 *                 değiştirilebildiği gün otomatik olarak bu devreye girer.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  // Supabase link tükenmiş/kullanılmışsa doğrudan hata parametreleriyle döner.
  const supabaseHata = searchParams.get("error_code") ?? searchParams.get("error");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const devam = searchParams.get("devam") ?? "/";

  const hedef = request.nextUrl.clone();
  hedef.search = "";

  if (supabaseHata) {
    hedef.pathname = "/giris";
    hedef.searchParams.set("durum", supabaseHata.includes("expired") ? "linksuresi" : "linkgecersiz");
    return NextResponse.redirect(hedef);
  }

  const supabase = await serverClient();

  let hata: { message: string } | null = null;
  if (token_hash && type) {
    hata = (await supabase.auth.verifyOtp({ type, token_hash })).error;
  } else if (code) {
    hata = (await supabase.auth.exchangeCodeForSession(code)).error;
  } else {
    hata = { message: "Adreste ne code ne token_hash var" };
  }

  if (hata) {
    // Sunucu loguna yaz: "link çalışmadı" mesajı kullanıcıya yeterli ama
    // hata ayıklarken gerçek sebebi görmek şart.
    console.error("[auth/confirm] giriş başarısız:", hata.message);
    hedef.pathname = "/giris";
    hedef.searchParams.set("durum", "linkgecersiz");
    return NextResponse.redirect(hedef);
  }

  // Oturum açıldı. Kişi izin listesinde mi? RLS zaten korur ama kullanıcıya
  // boş ekran yerine net bir mesaj göstermek istiyoruz.
  // Politika ekibin tamamını döndürdüğü için kendi satırımızı süzüyoruz;
  // süzmeden maybeSingle() "birden fazla satır" diye hata veriyor.
  const { data: claims } = await supabase.auth.getClaims();
  const email = (claims?.claims?.email as string | undefined) ?? "";
  const { data: satir } = await supabase
    .from("allowed_users")
    .select("email")
    .eq("email", email)
    .maybeSingle();

  if (!satir) {
    await supabase.auth.signOut();
    hedef.pathname = "/giris";
    hedef.searchParams.set("durum", "izinsiz");
    return NextResponse.redirect(hedef);
  }

  hedef.pathname = devam.startsWith("/") ? devam : "/";
  return NextResponse.redirect(hedef);
}
