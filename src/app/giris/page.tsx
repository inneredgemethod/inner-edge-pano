"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { browserClient } from "@/lib/supabase/client";

type Durum =
  | { tip: "bos" }
  | { tip: "linkgecersiz" }
  | { tip: "gonderiliyor" }
  | { tip: "gonderildi"; email: string }
  | { tip: "izinsiz" }
  | { tip: "hata"; mesaj: string };

function Giris() {
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [durum, setDurum] = useState<Durum>(
    params.get("durum") === "izinsiz"
      ? { tip: "izinsiz" }
      : params.get("durum") === "linkgecersiz"
        ? { tip: "linkgecersiz" }
        : { tip: "bos" },
  );

  async function gonder(e: React.FormEvent) {
    e.preventDefault();
    const adres = email.trim().toLowerCase();
    if (!adres) return;
    setDurum({ tip: "gonderiliyor" });

    const supabase = browserClient();

    // Önce izin listesine bak. Bu olmadan izinsiz adrese de e-posta gidiyor ve
    // kişi ancak linke tıkladıktan sonra duvara çarpıyor.
    const { data: izinli, error: rpcHata } = await supabase.rpc("is_email_allowed", {
      check_email: adres,
    });

    if (rpcHata) {
      setDurum({ tip: "hata", mesaj: "Sunucuya ulaşılamadı. İnternetini kontrol edip tekrar dene." });
      return;
    }
    if (!izinli) {
      setDurum({ tip: "izinsiz" });
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: adres,
      options: {
        emailRedirectTo: `${location.origin}/auth/confirm`,
        // Kayıt Supabase tarafında da kapalı; bu ikinci bir kilit.
        shouldCreateUser: false,
      },
    });

    if (error) {
      setDurum({ tip: "hata", mesaj: error.message });
      return;
    }
    setDurum({ tip: "gonderildi", email: adres });
  }

  const kutu = {
    background: "var(--c-bg2)",
    borderColor: "var(--c-line)",
    color: "var(--c-ink)",
  };

  return (
    <div className="mx-auto max-w-sm py-10">
      <h1 className="text-xl font-semibold">
        Inner Edge <span style={{ color: "var(--c-teal)" }}>Ekip Panosu</span>
      </h1>
      <p className="mt-1 mb-6 text-sm" style={{ color: "var(--c-mute)" }}>
        Şifre yok. E-postanı yaz, sana tek kullanımlık bir giriş linki gönderelim.
      </p>

      {durum.tip === "gonderildi" ? (
        <div
          className="rounded-lg border p-4 text-sm"
          style={{ ...kutu, borderColor: "var(--c-teal)" }}
        >
          <strong style={{ color: "var(--c-teal)" }}>Link gönderildi.</strong>
          <p className="mt-1.5">
            <b>{durum.email}</b> adresine baktığında bir e-posta göreceksin. İçindeki linke
            tıkla, panoya gireceksin. Link 1 saat geçerli.
          </p>
          <p className="mt-2" style={{ color: "var(--c-mute)" }}>
            Gelmediyse spam klasörüne bak.
          </p>
          <button
            type="button"
            onClick={() => setDurum({ tip: "bos" })}
            className="mt-3 rounded-lg border px-3 py-1.5"
            style={{ borderColor: "var(--c-line)" }}
          >
            Başka adres dene
          </button>
        </div>
      ) : (
        <form onSubmit={gonder} className="grid gap-3">
          <label className="grid gap-1 text-xs" style={{ color: "var(--c-mute)" }}>
            E-posta
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (durum.tip === "izinsiz" || durum.tip === "hata") setDurum({ tip: "bos" });
              }}
              placeholder="senin@adresin.com"
              className="rounded-lg border px-3 py-2 text-base"
              style={kutu}
            />
          </label>

          <button
            type="submit"
            disabled={durum.tip === "gonderiliyor"}
            className="rounded-lg px-4 py-2.5 text-sm font-semibold disabled:opacity-60"
            style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
          >
            {durum.tip === "gonderiliyor" ? "Gönderiliyor…" : "Giriş linki gönder"}
          </button>

          {durum.tip === "izinsiz" && (
            <p
              className="rounded-lg border p-3 text-sm"
              style={{ borderColor: "var(--c-amber)", color: "var(--c-gate-ink)" }}
            >
              Bu pano ekibe özel. Bu adres izin listesinde değil. Ekipte olman gerekiyorsa
              Kürşad&apos;a söyle, seni eklesin.
            </p>
          )}

          {durum.tip === "linkgecersiz" && (
            <p
              className="rounded-lg border p-3 text-sm"
              style={{ borderColor: "var(--c-amber)", color: "var(--c-gate-ink)" }}
            >
              Link çalışmadı. Süresi dolmuş, daha önce kullanılmış ya da linki istediğin
              tarayıcıdan farklı bir yerde açmış olabilirsin. Aşağıdan yenisini iste.
            </p>
          )}

          {durum.tip === "hata" && (
            <p
              className="rounded-lg border p-3 text-sm"
              style={{ borderColor: "var(--c-red)", color: "var(--c-red)" }}
            >
              {durum.mesaj}
            </p>
          )}
        </form>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Giris />
    </Suspense>
  );
}
