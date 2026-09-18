/** Testler için oturum açar. Gerçek e-posta göndermez. */
import { readFileSync } from "node:fs";

export function envYukle() {
  for (const line of readFileSync(new URL("../.env.local", import.meta.url), "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  }
}

/** Verilen sayfayı Kürşad olarak giriş yaptırır ve panoya bırakır. */
export async function girisYap(page, base, email = "info@inneredgemethod.io") {
  const SB = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const r = await fetch(`${SB}/auth/v1/admin/generate_link`, {
    method: "POST",
    headers: { apikey: SECRET, Authorization: `Bearer ${SECRET}`, "Content-Type": "application/json" },
    body: JSON.stringify({ type: "magiclink", email }),
  });
  const { hashed_token } = await r.json();
  if (!hashed_token) throw new Error("generate_link hashed_token vermedi");

  await page.goto(`${base}/auth/confirm?token_hash=${hashed_token}&type=magiclink`, {
    waitUntil: "networkidle",
  });
  if (new URL(page.url()).pathname === "/giris") {
    throw new Error("giriş yapılamadı, /giris'e düştü");
  }
}
