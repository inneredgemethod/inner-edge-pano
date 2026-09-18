import { Suspense } from "react";
import { GirisFormu } from "./GirisFormu";
import { UrlMesaji } from "./UrlMesaji";

/**
 * Sayfanın kendisi sunucuda render olur. Sadece URL parametresini okuyan
 * küçük parça Suspense içinde: onu da sarmalasaydık `useSearchParams` bütün
 * sayfayı istemciye erteler ve telefonda bir an bomboş ekran görünürdü.
 */
export default function Page() {
  return (
    <div className="mx-auto max-w-sm px-4 py-10">
      <h1 className="text-xl font-semibold">
        Inner Edge <span style={{ color: "var(--c-teal)" }}>Ekip Panosu</span>
      </h1>
      <p className="mt-1 mb-6 text-sm" style={{ color: "var(--c-mute)" }}>
        Şifre yok. E-postanı yaz, sana tek kullanımlık bir giriş linki gönderelim.
      </p>

      <Suspense fallback={null}>
        <UrlMesaji />
      </Suspense>

      <GirisFormu />
    </div>
  );
}
