# CLAUDE.md — Inner Edge Ekip Panosu

## Proje nedir
Inner Edge (trading psikolojisi bootcamp'i ve topluluğu) ekibinin ortak görev panosu. 3 kişi kullanır: **Kürşad** (satış/operasyon, sahip), **Sarah** (CEO, eğitmen, Atina'da), **Yunus** (teknik, öğrenci). İleride bootcamp öğrencileri ve kurumsal projeler için genişleyecek; şimdilik **tek öncelik: görev listesi**.

## Kullanıcı (Kürşad) ile konuşma tarzı
- Türkçe. Kısa. Teknik terim gerekiyorsa tek cümleyle açıkla.
- Her fazda önce plan (3-5 madde) → onay → uygulama.
- Kullanıcının yapması gereken şeyde (giriş, onay, anahtar) DUR ve bekle. Asla onun yerine giriş yapma.
- Tasarım kararlarını önce sor (`01_PRD.md` §5).
- Bilmediğin bir kurulum komutunu tahmin etme; resmi dokümana bak veya kullanıcıya sor.

## Hesaplar — her oturumda geçerli, bir daha sorma
Bu proje **`info@inneredgemethod.io`** hesabına aittir. Kürşad'ın kişisel hesapları (GitHub `ORDO618`, Vercel `kursadozcoban-3265`, kişisel Supabase org'u) **bozulmaz, çıkış yapılmaz, silinmez**. Ayrım şöyle korunur:

- **GitHub:** iki hesap `gh` içinde yan yana durur. Bu klasörde çalışmaya başlamadan önce `gh auth status` ile aktif hesabın `inneredgemethod` olduğunu doğrula; değilse `gh auth switch --user <hesap>`. `gh auth logout` çalıştırma.
- **Vercel:** `vercel login` / `vercel logout` **çalıştırma** — CLI oturumu Kürşad'ın kişisel hesabında kalacak. Bu projedeki her vercel komutu `--token=$INNER_EDGE_VERCEL_TOKEN` ile çalışır (`link`, `env`, `deploy`, `whoami` dahil). Token `.env.local` içinde.
- **`vercel env pull` YASAK** (çıplak hali): varsayılan olarak `.env.local`'i üzerine yazar ve token'ları siler. Her zaman ayrı dosyaya çek: `vercel env pull .env.vercel --token=$INNER_EDGE_VERCEL_TOKEN`.
- **Supabase:** mevcut `claude.ai Supabase` OAuth bağlantısı (kişisel org) **elleçlenmez**. Bu proje için `inner-edge-supabase` adlı ayrı, `--project-ref` ile scope'lu MCP bağlantısı ve `SUPABASE_ACCESS_TOKEN` env değişkeni kullanılır.
- **Git kimliği:** bu repoda `git config user.email info@inneredgemethod.io` (global ayara dokunma, `--local` kullan).

## Teknik yığın (kararlaştırıldı)
- **Next.js 15, App Router, TypeScript, Tailwind CSS** — tek repo.
- **Supabase**: Postgres + Auth (magic link, e-posta ile) + Realtime.
- **Vercel**: barındırma, `main` dalı = canlı.
- Paket yöneticisi: `npm`. Ekstra UI kütüphanesi eklemeden önce sor (shadcn/ui kabul edilebilir).
- Mobil öncelikli: Sarah ve Yunus çoğunlukla telefondan bakacak.

## Veri modeli
`05_veritabani_sema.sql` esas. Tohum verisi `04_gorevler_seed.json` (37 görev, 5 faz). Görev alanları: başlık, faz, hafta etiketi, sorumlu, hedef tarih, durum (Bekliyor/Yapılıyor/Yapıldı/Yapılamadı), "ne yapılacak / neden önemli / bitti sayılır" açıklamaları, notlar (kim, ne zaman, ne dedi).

## Yetki
- Giriş: yalnızca izin listesindeki 3 e-posta (`allowed_users` tablosu). Başkası giriş yapamaz.
  - Kürşad `info@inneredgemethod.io` (admin) · Sarah `sazyke@gmail.com` · Yunus `yunuskekec48@gmail.com`
  - `Sibel`, `Emine`, `Ortak` görev **sorumlusu** olabilir ama giriş yapamaz — `tasks.owner` serbest metin, `allowed_users` sadece 3 kişi.
- Herkes her görevi görür ve değiştirebilir; her değişiklik kim tarafından yapıldığı ile loglanır.
- Silme: sadece görevi ekleyen veya Kürşad.

## Kodlama disiplini (Karpathy notlarından uyarlandı)
- Varsayım yapma; belirsizse sor. Bir dosyayı değiştirmeden önce oku.
- İstenmeyen soyutlama, gereksiz bağımlılık, "ileride lazım olur" kodu yok (YAGNI).
- Değişikliği en dar kapsamda yap; ilgisiz dosyalara dokunma.
- "Bitti" demeden önce çalıştır ve göster: test, ekran görüntüsü veya komut çıktısı. Kanıt yoksa bitmemiştir.
- Bir hata çıkınca yamalama; kök nedeni bul, sonra düzelt.

## Skill kullanımı
- `superpowers` akışı zorunlu: brainstorming → plan → küçük görevler → test → review.
- Her UI değişikliğinden sonra `webapp-testing` ile 390px genişlikte ekran görüntüsü al ve Kürşad'a göster.
- Yeni skill/plugin eklemeden önce `skill-security-auditor` ile tara ve Kürşad'a sor. Katman B/C skill'leri (`06_SKILLS_VE_PLUGINLER.md`) v0.1'de kurulmaz.

## Yapma
- `.env.local`'i commit'leme. `service_role` anahtarını tarayıcıya gönderme.
- Kullanıcıya sormadan veritabanını sıfırlama veya tohum veriyi yeniden yükleme.
- v0.1 kapsamı dışına çıkma (dashboard, öğrenci paneli, dosya yükleme → sonraki sürümler).

## Tamamlandı tanımı (v0.1)
Canlı Vercel linki var, 3 kişi magic link ile giriyor, görevler faz/kişi bazlı görülüyor, detay penceresinde durum ve not değişiyor, değişiklik diğer kişide yenilemeden görünüyor, telefonda rahat kullanılıyor.
