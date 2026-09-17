# 02 — KODLAMA FAZLARI (Claude Code bunları sırayla yürütür)
Her faz: plan → Kürşad onayı → yap → Kürşad'a göster → commit. Bir faz bitmeden sonrakine geçme.

## Faz 0 — Kurulum ve girişler (Kürşad ile birlikte, ~30 dk)
- gh / vercel / supabase girişleri (`00_BASLANGIC_PROMPTU.md` Adım 0)
- Private repo `inner-edge-pano`, ilk commit (bu dosyalar)
- Supabase projesi Frankfurt, `.env.local` dolduruldu, `.gitignore`'da
**Bitti:** `git log` ilk commit'i gösteriyor, `.env.local` var ve gizli.

## Faz 1 — İskelet ve tasarım (yerel, ~2 saat)
- Next.js 15 + TypeScript + Tailwind kurulumu
- K1-K3 kararlarına göre düzen: alt sekme (mobil), üst navbar (masaüstü)
- Sayfalar: Genel bakış, Görevler, Görev detayı (modal/alt-sayfa), Görev ekle
- Veri: şimdilik `04_gorevler_seed.json`'dan okunur (DB yok)
- Marka: koyu zemin, teal vurgu, kişi renkleri (Kürşad teal, Sarah mor, Yunus mavi)
**Bitti:** `npm run dev`'de telefon genişliğinde 3 ekran çalışıyor, Kürşad görüp onayladı.

## Faz 2 — Veritabanı ve giriş (~2 saat)
- `05_veritabani_sema.sql` Supabase'e uygulanır (migration olarak repo'da tutulur)
- `allowed_users`'a 3 e-posta girilir (Kürşad e-postaları verir)
- Magic link giriş, izin listesi kontrolü, çıkış
- Tohum veri `04_gorevler_seed.json`'dan DB'ye tek seferlik yüklenir
- Row Level Security: sadece giriş yapmış ve izinli kullanıcı okur/yazar
**Bitti:** Kürşad kendi e-postasıyla giriyor, 37 görevi DB'den görüyor; izinsiz e-posta reddediliyor.

## Faz 3 — Canlı etkileşim ve yayın (~2 saat)
- Durum değiştirme, not ekleme, sorumlu/tarih düzenleme, görev ekleme/silme → DB
- Her değişiklik `task_events`'e kim/ne zaman/ne olarak yazılır
- Supabase Realtime: biri değiştirince diğerinin ekranı yenilemeden güncellenir
- Vercel'e deploy, `main` dalı = canlı, env değişkenleri Vercel'e girilir
**Bitti:** Canlı link var; Kürşad telefondan, Yunus başka cihazdan aynı anda değişiklik görüyor. Link ekibe gider.

## Faz 4 — Cilalama (ekipten 1 hafta geri bildirim sonra)
- Geciken görev vurgusu, "bu hafta" görünümü, arama
- Faz geçiş şartı kutusu, faz doluluk çubuğu
- Yedek: JSON dışa aktarma düğmesi
- Küçük hatalar

---

## Sonraki sürümler (şimdi YAPILMAYACAK, sadece yön)
| Sürüm | İçerik |
|---|---|
| v0.2 | Günlük özet e-postası; Pazartesi toplantı görünümü; toplantı kararlarını görevlere dönüştürme |
| v0.3 | Çoklu proje: Bootcamp / Kurumsal / Sosyal medya ayrı panolar, ortak kişi listesi |
| v0.4 | Sosyal medya rakamları girişi (Yunus'un Pazar özeti buradan) + basit grafik |
| v0.5 | Bootcamp öğrenci alanı: ödev, katılım, kaynaklar (Yunus'un kohort takibi) |
| v1.0 | Kurumsal müşteri portalı, teşhis anketi sonuçları, raporlama |

## Proje fazları (işin kendisi — panodaki görevlerin çatısı)
Uygulamanın içindeki 5 faz `04_gorevler_seed.json`'da tanımlı: 1·Toparlanma (14-27 Eyl) → 2·Sosyal medya ivmesi (28 Eyl-25 Eki) → 3·Bootcamp duyuru & kayıt (26 Eki-22 Kas) → 4·Bootcamp (Ara-Oca) → Kurumsal hat (paralel). Her fazın "geçiş şartı" alanı var; uygulama bunu Genel bakış'ta gösterir.
