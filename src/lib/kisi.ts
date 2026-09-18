/**
 * "Ben kimim" seçimi bir ÇEREZDE tutulur.
 *
 * Neden localStorage değil: sunucu localStorage'ı okuyamaz, o yüzden ilk
 * render yanlış isimle gelip mount'tan sonra düzeliyordu — girişten sonra
 * göz kırpması gibi görünüyor. Çerezi sunucu da okuyabildiği için ilk HTML
 * doğru isimle çıkıyor.
 *
 * httpOnly DEĞİL: üstteki menüden değiştirildiğinde tarayıcının da yazması
 * gerekiyor. Gizli bir bilgi değil zaten — ve zaten doğrulanmış bir kimlik
 * de değil, kullanıcının beyanı.
 */
export const KISI_COOKIE = "pano-kisi";
const BIR_YIL = 60 * 60 * 24 * 365;

export function kisiCerezi(ad: string): string {
  return `${KISI_COOKIE}=${encodeURIComponent(ad)}; Path=/; Max-Age=${BIR_YIL}; SameSite=Lax`;
}

export function kisiYaz(ad: string): void {
  try {
    document.cookie = kisiCerezi(ad);
  } catch {
    // Çerezler kapalıysa seçim sadece bu sekmede geçerli olur.
  }
}
