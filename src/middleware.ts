import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

export async function middleware(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // `api/` ve `giris` DIŞARIDA:
  //   - /api/giris oturumu KURAN uç. Middleware'e takılsa oturum yok diye
  //     giriş sayfasına yönlendirilir ve giriş hiç yapılamaz.
  //   - /giris oturumsuz açılan sayfa; middleware orada Supabase istemcisi
  //     kurup auth çerezlerini temizliyor, bu da yeni kurulan oturumu bozabiliyor.
  matcher: [
    "/((?!api/|giris|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
