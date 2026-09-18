import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // `auth/` ve `giris` DIŞARIDA. Middleware oturum tazelemek için bir Supabase
  // istemcisi kurup getClaims() çağırıyor; henüz oturum yokken bu, auth
  // çerezlerini temizliyor — PKCE'nin code-verifier çerezi dahil.
  //   - /auth/confirm: doğrulayıcı silinince exchangeCodeForSession takas
  //     yapamıyor, magic link "geçersiz" görünüyordu. (Yaşanan hata buydu.)
  //   - /giris: linki istedikten sonra sayfa yenilenirse doğrulayıcı yine
  //     silinirdi. Giriş sayfasının zaten tazelenecek oturumu yok.
  matcher: [
    "/((?!auth/|giris|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
