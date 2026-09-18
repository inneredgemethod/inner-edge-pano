import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { kisiCerezi } from "@/lib/kisi";
import { serverClient } from "@/lib/supabase/server";

/** Uzunluk sızdırmadan sabit zamanlı karşılaştırma. */
function esitMi(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) {
    // Yine de bir karşılaştırma yap ki süre farkı uzunluğu ele vermesin.
    timingSafeEqual(ab, ab);
    return false;
  }
  return timingSafeEqual(ab, bb);
}

/**
 * Ekip şifresini doğrular ve paylaşılan Supabase hesabıyla oturum açar.
 *
 * Şifre sunucuda kalır — istemciye ne şifre ne de Supabase hesabının
 * bilgileri gider. Tarayıcıya yalnızca Supabase'in httpOnly oturum çerezi
 * iner; RLS ve Realtime o oturuma dayanıyor.
 */
export async function POST(request: NextRequest) {
  const beklenen = process.env.PANO_SITE_PASSWORD;
  const hesap = process.env.PANO_SUPABASE_EMAIL;
  const hesapSifre = process.env.PANO_SUPABASE_PASSWORD;

  if (!beklenen || !hesap || !hesapSifre) {
    console.error("[api/giris] PANO_* ortam değişkenleri eksik");
    return NextResponse.json({ ok: false, mesaj: "Sunucu yapılandırması eksik." }, { status: 500 });
  }

  let sifre = "";
  let kisi = "";
  try {
    const govde = (await request.json()) as { sifre?: unknown; kisi?: unknown };
    sifre = String(govde.sifre ?? "");
    kisi = String(govde.kisi ?? "");
  } catch {
    return NextResponse.json({ ok: false, mesaj: "Geçersiz istek." }, { status: 400 });
  }

  if (!esitMi(sifre, beklenen)) {
    // Kaba kuvvet denemesini yavaşlat. 3 kişilik bir iç araç için yeterli;
    // ayrı bir hız sınırlama altyapısı kurmak fazla mühendislik olur.
    await new Promise((r) => setTimeout(r, 1000));
    return NextResponse.json({ ok: false, mesaj: "Şifre yanlış." }, { status: 401 });
  }

  const supabase = await serverClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: hesap,
    password: hesapSifre,
  });

  if (error) {
    console.error("[api/giris] paylaşılan hesap oturumu açılamadı:", error.message);
    return NextResponse.json({ ok: false, mesaj: "Panoya bağlanılamadı." }, { status: 500 });
  }

  const cevap = NextResponse.json({ ok: true });
  // Seçilen kişiyi çereze yaz: sunucu ilk render'da doğru ismi göstersin.
  if (kisi) cevap.headers.append("set-cookie", kisiCerezi(kisi));
  return cevap;
}
