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
- **Supabase projesi:** adı `todolist` (Frankfurt, `eu-central-1`). İsim kozmetik, bağlantı `SUPABASE_PROJECT_REF` üzerinden kurulur. Kürşad bilerek böyle bıraktı — yeniden adlandırmayı teklif etme.
- **Git kimliği:** bu repoda `git config user.email info@inneredgemethod.io` (global ayara dokunma, `--local` kullan).

## Teknik yığın (kararlaştırıldı)
- **Next.js 15, App Router, TypeScript, Tailwind CSS** — tek repo.
- **Supabase**: Postgres + Auth (tek paylaşılan hesap, bkz. "Giriş modeli") + Realtime.
- **Vercel**: barındırma, `main` dalı = canlı.
- Paket yöneticisi: `npm`. Ekstra UI kütüphanesi eklemeden önce sor (shadcn/ui kabul edilebilir).
- Mobil öncelikli: Sarah ve Yunus çoğunlukla telefondan bakacak.

## Veri modeli
`05_veritabani_sema.sql` esas. Tohum verisi `04_gorevler_seed.json` (37 görev, 5 faz). Görev alanları: başlık, faz, hafta etiketi, sorumlu, hedef tarih, durum (Bekliyor/Yapılıyor/Yapıldı/Yapılamadı), "ne yapılacak / neden önemli / bitti sayılır" açıklamaları, notlar (kim, ne zaman, ne dedi).

## Yetki
- Giriş: tek ekip şifresi (yukarıdaki "Giriş modeli"). Şifreyi bilen girer.
  - Kadro: Kürşad · Sarah · Yunus. `Sibel`, `Emine`, `Ortak` görev **sorumlusu** olabilir ama kadroda değil.
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
- Skill'ler paket halinde değil **tek tek** kurulur (06 kuralı: en fazla 8-10 aktif skill). Kurulu olanlar ve kaynakları: `~/.claude/skills/KAYNAKLAR.md`. Şu an ~1.218 token/oturum.
- Auditor **gürültülü**: 5 skill'in 3'üne yanlış `FAIL`/`WARN` verdi. Çıktısını kurulumu engellemek için değil, bakılacak satırı göstermek için kullan — işaretlenen satırı oku, sonra karar ver.

## Giriş modeli (Faz 4'te değişti — magic link KALDIRILDI)
Pano **tek ekip şifresiyle** giriliyor. Sonra üstteki "Ben:" menüsünden kim olduğun seçiliyor.

- `PANO_SITE_PASSWORD` ekip şifresi, `.env.local`'de. **`NEXT_PUBLIC_` öneki YOK** — tarayıcıya gitmez, `/api/giris` sunucuda doğrular.
- Şifre doğruysa sunucu **tek paylaşılan Supabase hesabıyla** (`pano@inneredgemethod.io`) oturum açar. Tarayıcıya yalnızca Supabase'in httpOnly oturum çerezi iner.
- **Neden hâlâ Supabase oturumu var:** RLS ve Realtime tarayıcıda geçerli bir JWT istiyor. `anon` anahtarı zaten herkese açık (bundle'da); RLS'i anon'a açmak panoyu adresini bilen herkese açardı.
- "Ben" seçimi `pano-kisi` çerezinde (httpOnly değil, sunucu da okuyabilsin diye — localStorage'dayken girişten sonra isim göz kırpıyordu).

### ⚠️ Bilinçli kabul edilen takas
**"Kim yaptı" artık doğrulanmış kimlik değil, kullanıcının BEYANI.** Yunus "Kürşad" seçip onun görevini silebilir; log "Kürşad" yazar. K6 kuralı bu yüzden bir **güvenlik sınırı değil, kolaylık kuralı** — veritabanı seviyesinde zorlanamıyor (`0005_tek_sifreli_giris.sql` bunu açıkça yazıyor). Şifre sızarsa panonun tamamı sızar; tek çare şifreyi değiştirmek. Kürşad bunları bilerek kabul etti.

## Supabase — işletme notları
- **Migration'lar** `supabase/migrations/` altında, Management API ile uygulanıyor. Şemayı panelden elle değiştirme; yeni migration dosyası yaz. Uygulanmış migration'ları **düzenleme** — üstüne yenisini yaz.
- **`auth.users`'ta tek hesap var**: `pano@inneredgemethod.io`. Kişisel hesaplar Faz 4'te silindi.
- **`allowed_users` artık giriş kapısı DEĞİL**, sadece kadro listesi: "Ben" menüsündeki isimler ve rozet renkleri. Dördüncü kişi eklemek = bu tabloya bir satır.
- **`Sibel`, `Emine`, `Ortak`** kadroda yok; yalnızca görev sorumlusu olabiliyorlar.
- **Görev sırası `sirano` sütunundan** gelir, `created_at`'ten DEĞİL: 37 tohum görev tek seferde eklendi, hepsinin zamanı aynı ve sıra her sorguda değişiyordu.
- **Middleware `api/` ve `giris` yollarına DOKUNMAMALI** (`src/middleware.ts` matcher'ı). Middleware oturum tazelemek için Supabase istemcisi kurup `getClaims()` çağırıyor; oturum yokken auth çerezlerini temizliyor. `/api/giris` oturumu KURAN uç — matcher'a girerse giriş hiç çalışmaz. **Yaşandı, teşhisi zor.**
- **Realtime'da oturumu BEKLE**: kanal, `getSession()` tamamlanmadan abone olursa `anon` bağlanıyor, RLS bütün olayları eliyor ve **hiçbir hata görünmeden** Realtime sessizce çalışmıyor. `src/lib/store.tsx` bunu yapıyor, bozma.
- **Denetçi**: `advisors/security` tek bir uyarı verir — `auth_leaked_password_protection`. Açılamıyor (ücretli plan, HTTP 402) ve bizim modelde **anlamsız**: Supabase şifresini kullanıcı belirlemiyor (sunucu rastgele üretti), ekip şifresi de Supabase'de tutulmuyor. Bu uyarıyı kovalamaya gerek yok.

## Canlı (Faz 3'te yayınlandı)
- **Adres: https://inner-edge-pano.vercel.app** · Vercel projesi `inneredge/inner-edge-pano` · `main` dalı = canlı.
- Deploy: `vercel deploy --prod --yes --token=$INNER_EDGE_VERCEL_TOKEN` (her vercel komutu token'la — `vercel login`'e dokunma).
- **Vercel'de sadece 2 değişken var**: `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `SUPABASE_SERVICE_ROLE_KEY` **bilerek gönderilmedi** — uygulama onu çalışırken kullanmıyor, yalnızca yerel `scripts/seed.mjs` kullanıyor. RLS'i atlayan anahtar Kürşad'ın makinesinde kalsın.
- `vercel link` de `.env.local`'e dokunuyor (sonuna `VERCEL_OIDC_TOKEN` ekliyor, üzerine yazmıyor) ve `.gitignore`'a `.env*` satırı ekledi.
- `site_url` / `uri_allow_list` artık ÖNEMSİZ: magic link kalktı, yönlendirme yok.
- **Vercel'e `PANO_SITE_PASSWORD`, `PANO_SUPABASE_EMAIL`, `PANO_SUPABASE_PASSWORD` de girilmeli** — yoksa canlıda giriş çalışmaz.

## Test
`npm run test:sunucu` temiz bir production sunucusu başlatır (3002), sonra:
`npm run test:giris` · `npm run test:etkilesim` · `npm run test:kalicilik` · `npm run test:ekran`.
Hepsi `PANO_URL` ile çalışır. **Dev sunucusunda koşma** — geliştirici rozeti tıklamaları yiyor.
Testler veritabanına gerçekten yazıyor ve **kendi çöplerini topluyor**; temizlik satırını silme.

## Toplu işlemler ve sıfırlama (Faz 5)
- **Toplu güncelleme her satır için ayrı log üretir.** 10 görevin sorumlusunu değiştirmek 10 `task_events` satırı demek — bilerek böyle, "kim neyi değiştirdi" tek tek kalsın.
- **Açıklama alanları (`what`/`why`/`done_when`) LOGLANMAZ.** Metin düzeltmesi her seferinde "X bir şey değiştirdi" satırı üretirse not akışı okunmaz olur.
- **"Panoyu Sıfırla" silmeden ÖNCE yedeği tarayıcıya indirir.** Yedek başarısız olursa sıfırlama iptal edilir. `service_role` tarayıcıya verilmediği için yedek normal oturumla okunuyor; yerelden almak için `npm run yedek`.
- **Sıfırlama fazları ve kadroyu SİLMEZ**, sadece görevleri (loglar cascade ile gider).
- **Testler `TEST` içeren görevleri temizler** (`tests/oturum.mjs` › `temizle`). Filtre `*TEST*` — başta değil, içinde geçen de silinsin: ayrıştırıcı testinde bozuk bir işaret başa kayınca başlık `bozuk TEST ...` oluyor ve `TEST*` filtresi onu kaçırıyordu.

## Yapma
- **Teşhis/deneme amacıyla gerçek görev verisini DEĞİŞTİRME.** Bir Realtime teşhis scripti bir görevin `week_label` alanını test değeriyle ezmiş ve geri almamıştı; görev panoda yanlış hafta grubuna düşmüştü. Denemen gerekiyorsa kendi eklediğin `TEST...` başlıklı bir görev üzerinde yap.
- **Ekibe bir şey göstermeden önce `npm run dogrula`** — panonun SAĞLIK kontrolü: yetim log kaydı, boş zorunlu alan, geçersiz faz, `sirano` çakışması, kadro dışı log aktörü, kalmış `TEST` görevi, Supabase denetçisi. **Artık tohum dosyasıyla karşılaştırmıyor** — Faz 5'te "Panoyu Sıfırla" geldi, toplantıdan sonra gerçek görevler girilecek ve tohum karşılaştırması anlamsız kalacak.
- `.env.local`'i commit'leme. `service_role` anahtarını tarayıcıya gönderme.
- Kullanıcıya sormadan veritabanını sıfırlama veya tohum veriyi yeniden yükleme.
- v0.1 kapsamı dışına çıkma (dashboard, öğrenci paneli, dosya yükleme → sonraki sürümler).

## Tamamlandı tanımı (v0.1)
Canlı Vercel linki var, 3 kişi magic link ile giriyor, görevler faz/kişi bazlı görülüyor, detay penceresinde durum ve not değişiyor, değişiklik diğer kişide yenilemeden görünüyor, telefonda rahat kullanılıyor.
