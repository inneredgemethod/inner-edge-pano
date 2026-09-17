# Inner Edge Ekip Panosu — Devir Paketi (17 Eylül 2026)

## Klasör
| Dosya | Ne işe yarar |
|---|---|
| `00_BASLANGIC_PROMPTU.md` | Claude Code'a yapıştıracağın ilk mesaj (MCP kurulumu, girişler, sonra kodlama) |
| `CLAUDE.md` | Claude Code'un her oturumda okuduğu proje kuralları |
| `01_PRD.md` | Ne yapıyoruz, ekranlar, **karar bekleyen 6 madde (K1-K6)** |
| `02_FAZLAR.md` | Kodlama fazları (0-4) + sonraki sürümler + işin kendi 5 fazı |
| `03_ornek_pano.html` | Tarayıcıda tek başına açılan örnek arayüz (mantık referansı, kayıt tutmaz) |
| `04_gorevler_seed.json` | 37 görev + 5 faz, veritabanına yüklenecek başlangıç verisi |
| `05_veritabani_sema.sql` | Supabase tablo/yetki taslağı |
| `06_SKILLS_VE_PLUGINLER.md` | Hangi skill/plugin ne zaman kurulur (Katman A şimdi, B v0.2, C v0.3+), senaryolar |

## Senin yapacakların (sırayla)
1. Bu klasörü Antigravity'de aç, Claude Code panelini başlat.
2. `00_BASLANGIC_PROMPTU.md`'nin içindeki metni yapıştır.
3. Claude Code "gh auth login" / "vercel login" / Supabase proje açma dediğinde tarayıcıda onayla, dönüp "tamam" yaz.
4. Supabase'den 3 anahtarı (URL, anon, service_role) `.env.local`'e yapıştır — Claude Code nereye yazacağını gösterir.
5. K1-K6 kararlarını sorduğunda cevapla (öneriler PRD'de).
6. Faz 3 sonunda canlı linki al, WhatsApp grubuna at.

## Hazırlaman gerekenler
- Sarah'nın ve Yunus'un giriş yapacağı e-posta adresleri (magic link buraya gidecek).
- GitHub, Vercel, Supabase hesapları (ücretsiz plan yeter).
