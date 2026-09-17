# 06 — SKILL & PLUGIN ANALİZİ · Inner Edge Panosu
**Tarih:** 17 Eylül 2026 · **Kaynaklar:** anthropics/skills, ComposioHQ/awesome-claude-skills, quemsah/awesome-claude-plugins (Top 100, 08.08.2026, 32.251 repo taranmış), alirezarezvani/claude-skills (364 skill), jeremylongshore/tons-of-skills (2.900 skill), obra/superpowers.

## 0. Üç kural (kurulmadan önce)
1. **Az kur.** Her skill oturum başında ~100 token yer; 300 skill kurmak Claude Code'u yavaşlatır ve dikkatini dağıtır. Bu projede en fazla **8-10** skill aktif olur.
2. **Kurmadan tara.** Üçüncü taraf skill'ler kod çalıştırabilir. `skill-security-auditor` (alirezarezvani) ile `PASS` almayanı kurma.
3. **Resmi marketplace önce.** `claude-plugins-official` (Anthropic yönetimli) → sonra doğrulanmış büyük repolar → en son bireysel skill'ler.

## 1. KATMAN A — Şimdi kur (panoyu kodlarken)
| # | Skill / Plugin | Kaynak | Neden bize lazım | Güven |
|---|---|---|---|---|
| A1 | **superpowers** | obra — resmi marketplace `/plugin install superpowers@claude-plugins-official`; Antigravity: `agy plugin install https://github.com/obra/superpowers` | Tam bizim istediğimiz akış: önce soru sorar → tasarımı parça parça onaylatır → küçük görevlere böler → alt-ajanlarla yapar → her adımı test eder. "Plan → onay → yap" kuralımızı otomatik uygular. #1 benimsenen plugin (268K). | %90 |
| A2 | **webapp-testing** | anthropics/skills `example-skills` | Playwright ile panoyu telefon genişliğinde açar, ekran görüntüsü alır, tıklamaları test eder. "Mobilde karman çorman" şikâyeti bir daha olmasın diye. | %85 |
| A3 | **andrej-karpathy-skills** (tek CLAUDE.md) | multica-ai — #4 (200K) | LLM kodlama hatalarını azaltan kısa kurallar (varsayım yapma, gereksiz soyutlama kurma, test etmeden "bitti" deme). CLAUDE.md'mize birleştirildi. | %80 |
| A4 | **database-schema-designer** + **env-secrets-manager** | alirezarezvani `engineering-advanced-skills` | Supabase migration + RLS politikalarını gereksinimden üretir; `.env` sızıntısını commit öncesi yakalar. Anahtar sızması projeyi öldürür. | %75 |
| A5 | **ui-ux-pro-max-skill** *veya* **impeccable** | nextlevelbuilder (#9, 114K) / pbakaus (#27) | "Modern rötuş, iç içe durmasın" isteği için tasarım zekâsı. İkisinden biri yeter; ilkini öneriyorum. | %70 |
| A6 | **skill-security-auditor** | alirezarezvani | Yukarıdakileri ve ileride ekleyeceklerini kurmadan tarar. Araç, ürün değil. | %85 |

**Kurulum sırası:** A6 → A1 → A2 → A3 (dosya birleştirme) → A4 → A5. Toplam ~15 dk.

## 2. KATMAN B — v0.2 ile (ekip operasyonu)
| Skill | Kaynak | Senaryo |
|---|---|---|
| **capture** (brain-dump → aksiyon) | alirezarezvani `productivity` | Kürşad toplantıdan sonra 10 satır karışık not yazar → skill görevlere böler, sorumlu/tarih önerir → panoya JSON olarak eklenir. Bugün elle yaptığımız işin otomasyonu. |
| **meeting-insights-analyzer** | ComposioHQ | Zoom toplantı transkripti → kararlar ve görevler. Sarah-Kürşad-Yunus toplantısı bitince "kim ne dedi, kim ne üstlendi" panoya düşer. |
| **weekly-review** + **meetings** | alirezarezvani `productivity` | Pazartesi 5 dk: geciken/bloke özeti + haftalık gündem otomatik. |
| **changelog-generator** | ComposioHQ | Panoda bu hafta ne değişti → WhatsApp'a insan diliyle 5 satır. |
| **internal-comms** | ComposioHQ | Sarah'ya/Yunus'a durum raporu yazımı; kurumsal müşteriye proje güncellemesi (Kurumsal hat için). |
| **n8n-skills** | haunchen | Zaten n8n kullanıyorsun: Pazar özeti → WhatsApp/Telegram otomatik. |
| **claude-mem** veya **planning-with-files** | thedotmack (#13) / OthmanAdi (#63) | Claude Code oturumlar arası hafıza. Sen kısa oturumlarla çalışıyorsun; "nerede kalmıştık" sorununu çözer. Birini seç, ikisi birden değil. |

## 3. KATMAN C — v0.3+ (ürün özelliği olarak)
| Fikir | Nereden esinlendik | Panoda karşılığı |
|---|---|---|
| Sosyal medya rakamlarını otomatik çekme | Composio `instagram-automation`, `youtube-automation` | Yunus'un Pazar özeti elle değil, API'den. v0.4 "rakam girişi" ekranı buna hazır tasarlanır (tablo: platform, tarih, takipçi, erişim, en iyi 3 içerik). |
| Zoom kayıtları → ders notu → öğrenci paneli | Composio `zoom-automation` + `youtube-transcript` | v0.5 bootcamp öğrenci alanı: canlı ders biter, transkript özeti otomatik düşer. |
| Kurumsal teşhis anketi → rapor | alirezarezvani `market-research` / `product-research` (anket tasarımı) | Kurumsal hatta "önce teşhis" anketinin yapısı bu skill'lerin şablonlarından türetilebilir. |
| SaaS metrik takibi | alirezarezvani `finance/saas-metrics-coach` (MRR, churn hesaplayıcı, stdlib Python) | Bootcamp gelirleri girildikçe MRR/churn panoda. Yatırımcı görüşmesinde hazır rakam. |
| Roast / GO-RESHAPE-KILL | alirezarezvani `productivity/roast` | Yeni özellik veya kampanya fikri gelince 5 açıdan çürütme. Kill-switch mantığımızın araçlaşmış hali. |
| Marketplace/plugin mimarisi | tonsofskills, wshobson/agents | Uzak vade: Inner Edge'in kendi "trader skill paketi" (journal analizi, risk hesaplayıcı) — ürün fikri, şimdi değil. |

## 4. Somut senaryolar
**S1 — Pazartesi sabahı.** Kürşad panoyu açar, `weekly-review` geciken 3 işi listeler, `capture` toplantı notlarından 4 yeni görev üretir, hepsi tek onayla panoya girer. Süre: 5 dk.

**S2 — Sarah video çekti.** Yunus rakamı girmez; Composio Instagram skill'i Pazar gecesi çeker, `changelog-generator` "bu hafta 3 video, erişim +%18, en iyi: X" diye gruba yazar.

**S3 — Toplantı bitti.** Zoom transkripti `meeting-insights-analyzer`'a gider; "Sarah kurumsal paket taslağını Perşembe'ye kadar okuyacak" cümlesi görev olarak Sarah'nın listesine düşer, kaynak: toplantı kaydı.

**S4 — Yeni ekran isteği.** "Öğrenci paneli ekleyelim" dendiğinde `superpowers` brainstorming açar, 6 soru sorar, tasarımı onaylatır, planı 2-5 dakikalık görevlere böler; `webapp-testing` her görev sonrası mobil ekran görüntüsü alır.

**S5 — Kill-switch kararı.** 22 Kasım: kayıt sayısı panoda; `roast` "başla / ertele" kararını 5 açıdan çürütür; karar ve gerekçe panoya not olarak düşer.

## 5. Kurmayacaklarımız (ve neden)
- **Composio connect-apps** (1000+ uygulama tek anahtarla): güçlü ama üçüncü taraf ağ geçidi; ekip verisi Composio'dan geçer. Şimdilik doğrudan MCP (Supabase, Vercel, Gmail) yeter. Yeniden değerlendirme: v0.3.
- **ECC, ruflo, BMAD**: çok-ajanlı ağır çerçeveler; 3 kişilik pano için fazla.
- **caveman** (token kısma): Türkçe iletişimi bozar.
- **c-level-advisor 68 skill**: senin zaten `inner-edge-ceo` ve `kursad-digital-ceo` skill'lerin var; çakışır.

## 6. Kanıt / belirsizlik
- Yıldız sayıları ve sıralama: quemsah Top 100 (08.08.2026). Yıldız = benimsenme, kalite garantisi değil.
- Issue/discussion içerikleri okunamadı (GitHub otomatik erişimi engelliyor); "yorum analizi" bu yüzden benimsenme metriğine dayanıyor. Güven: %70.
- Kurulum komutları README'lerden; Claude Code sürümüne göre değişebilir — Claude Code kurarken resmi dokümanı teyit eder.
