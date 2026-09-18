import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // `auth/` DIŞARIDA: middleware oturum tazelemek için bir Supabase istemcisi
  // kurup getClaims() çağırıyor. Henüz oturum yokken bu, auth çerezlerini
  // temizliyor — PKCE'nin code-verifier çerezi dahil. Sonuç: route'a sıra
  // geldiğinde exchangeCodeForSession takas edecek doğrulayıcıyı bulamıyor
  // ve magic link "geçersiz" görünüyor.
  matcher: [
    "/((?!auth/|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
