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
  //   - manifest.webmanifest oturumdan ÖNCE okunuyor. Middleware'e takılınca
  //     307 ile /giris'e dönüyordu; tarayıcı manifest yerine HTML alıp onu
  //     yok sayıyor ve site "yüklenebilir uygulama" sayılmıyordu. iOS'ta
  //     sonucu: ana ekrana eklenen kısayol her açılışta şifre soruyor.
  //   - sw.js de oturumdan once isteniyor; /giris'e donerse service worker
  //     kaydi HTML alip basarisiz oluyor ve Android WebAPK uretmiyor.
  matcher: [
    "/((?!api/|giris|manifest.webmanifest|sw.js|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
