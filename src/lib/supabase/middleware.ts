import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Giriş yapılmadan erişilebilen yollar. `/giris` ve `/auth/*` zaten
 * middleware matcher'ının dışında; bu liste geriye kalanlar için güvenlik ağı.
 */
const ACIK = ["/giris", "/cikis"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value } of cookiesToSet) request.cookies.set(name, value);
          response = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // createServerClient ile getClaims() arasına KOD KOYMA — Supabase'in uyarısı:
  // araya giren kod kullanıcıların rastgele çıkış yapmasına yol açabiliyor.
  const { data } = await supabase.auth.getClaims();

  const yol = request.nextUrl.pathname;
  const acik = ACIK.some((p) => yol.startsWith(p));

  if (!data?.claims && !acik) {
    const url = request.nextUrl.clone();
    url.pathname = "/giris";
    url.searchParams.set("devam", yol);
    return NextResponse.redirect(url);
  }

  return response;
}
