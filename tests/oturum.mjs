/** Testler için oturum açar: ekip şifresi + "Ben kimim" seçimi. */
import { readFileSync } from "node:fs";

export function envYukle() {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

/** Giriş ekranını gerçekten doldurur — akışın kendisini de test etmiş oluyoruz. */
export async function girisYap(page, base, kisi = "Kürşad") {
  await page.goto(`${base}/giris`, { waitUntil: "networkidle" });
  await page.getByLabel("Ekip şifresi").fill(process.env.PANO_SITE_PASSWORD);
  await page.getByLabel("Ben kimim").selectOption(kisi);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL((u) => new URL(u).pathname !== "/giris", { timeout: 20000 });
}

/** service_role ile doğrudan veritabanı erişimi — test temizliği için. */
export function db() {
  const URL_ = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
  return {
    async temizle() {
      // "*TEST*": basta degil, ICINDE gecen de silinsin. Ayristirici testinde
      // bozuk bir isaret basa kayinca baslik "bozuk TEST ..." oluyor ve
      // "TEST*" filtresi onu kaciriyordu — panoda test copu kaliyordu.
      await fetch(`${URL_}/rest/v1/tasks?title=like.*TEST*`, { method: "DELETE", headers: H });
      await fetch(`${URL_}/rest/v1/tasks?status=neq.Bekliyor`, {
        method: "PATCH", headers: H, body: JSON.stringify({ status: "Bekliyor", son_degistiren: null }),
      });
      await fetch(`${URL_}/rest/v1/task_events?id=not.is.null`, { method: "DELETE", headers: H });
      // Yonetim testleri faz/kisi de olusturuyor; onlari da topla.
      await fetch(`${URL_}/rest/v1/phases?id=like.test*`, { method: "DELETE", headers: H });
      await fetch(`${URL_}/rest/v1/kisiler?display_name=like.*TEST*`, { method: "DELETE", headers: H });
      // NOT: arsivli fazlari/kisileri toplu geri ALMIYORUZ. Kursad ileride
      // bilerek bir fazi arsivlerse test onu sessizce geri acardi. Testler
      // kendi arsivledigini kendi geri aliyor.
      const gorev = await (await fetch(`${URL_}/rest/v1/tasks?select=id`, { headers: H })).json();
      const log = await (await fetch(`${URL_}/rest/v1/task_events?select=id`, { headers: H })).json();
      return { gorev: gorev.length, log: log.length };
    },
  };
}
