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
- **Adres: https://inneredgepanel.vercel.app** (asıl) · **https://inner-edge-pano.vercel.app** (eski, çalışmaya devam ediyor).
  Proje YENİDEN ADLANDIRILMADI, ikinci alan adı EKLENDİ (`POST /v10/projects/inner-edge-pano/domains`).
  Adlandırma eski `.vercel.app` adresini serbest bırakır ve Kürşad'ın yer imlerini kırardı.
  **Yeni adreste şifre bir kez daha sorulur** — çerez host bazlı, ayrı host = ayrı çerez. Hata değil.
- Vercel projesi `inneredge/inner-edge-pano` · `main` dalı = canlı.
- Deploy: `vercel deploy --prod --yes --token=$INNER_EDGE_VERCEL_TOKEN` (her vercel komutu token'la — `vercel login`'e dokunma).
- **Vercel'de sadece 2 değişken var**: `NEXT_PUBLIC_SUPABASE_URL` ve `NEXT_PUBLIC_SUPABASE_ANON_KEY`. `SUPABASE_SERVICE_ROLE_KEY` **bilerek gönderilmedi** — uygulama onu çalışırken kullanmıyor, yalnızca yerel `scripts/seed.mjs` kullanıyor. RLS'i atlayan anahtar Kürşad'ın makinesinde kalsın.
- `vercel link` de `.env.local`'e dokunuyor (sonuna `VERCEL_OIDC_TOKEN` ekliyor, üzerine yazmıyor) ve `.gitignore`'a `.env*` satırı ekledi.
- `site_url` / `uri_allow_list` artık ÖNEMSİZ: magic link kalktı, yönlendirme yok.
- **Vercel'e `PANO_SITE_PASSWORD`, `PANO_SUPABASE_EMAIL`, `PANO_SUPABASE_PASSWORD` de girilmeli** — yoksa canlıda giriş çalışmaz.

## Test
`npm run test:sunucu` temiz bir production sunucusu başlatır (3002), sonra:
`npm run test:giris` · `npm run test:etkilesim` · `npm run test:kalicilik` · `npm run test:yarin` · `npm run test:ekran`.
Toplam **11 paket, 199 kontrol** + 32 ekran görüntüsü.

**Testler veri sayısına BAĞLI DEĞİL.** Eskiden `"37 görev"` gibi sabitler vardı; toplantıda pano
sıfırlanıp gerçek görevler girilince bütün paket kırmızıya dönecekti — testler en çok lazım olacağı
gün işe yaramazdı. Beklenen sayılar artık `service_role` ile veritabanından okunuyor (`dbSay`).
Yeni test yazarken sabit sayı YAZMA.

**Seçici tuzakları — yaşandı, tekrar düşme:**
- `getByLabel("X")` GEVŞEK eşleşir. Satır eylem düğmelerinin `aria-label`'ı görev
  başlığını içeriyor, yani başlığında "tekrar" geçen bir test görevi
  `getByLabel("Tekrar")`'ı üç elemana birden denk getirir. Dar kapsam + `exact: true` kullan.
- Sarmalayan `<label>` içindeki `<select>`'in erişilebilir adı `<option>` metinlerini de
  yutuyor ("TekrarTekrarsızHer hafta…"). Select'e açık `aria-label` ver.
- Sekme etiketi sayaç taşıyorsa (`Notlarım (3)`) `text-is` kırılır — `aria-label` ile seç.
- PostgREST **sıralamasız** sorgu rastgele sırada döner. `task_events`'te `.at(-1)`
  istiyorsan `order=created_at.asc` YAZ.
Hepsi `PANO_URL` ile çalışır. **Dev sunucusunda koşma** — geliştirici rozeti tıklamaları yiyor.
Testler veritabanına gerçekten yazıyor ve **kendi çöplerini topluyor**; temizlik satırını silme.

## 20 Eylül sürümü — arayüz ve veri kuralları
- **Görev satırı artık `<div>`, `<button>` DEĞİL.** İçinde eylem düğmeleri var; iç içe
  `<button>` geçersiz HTML'dir. Başlık+rozetler içteki butonda — `locator("button", { hasText })`
  seçicileri bu sayede çalışıyor, o yapıyı bozma.
- **Satırdaki onay penceresi yalnızca açıkken basılır.** Sürekli basılsaydı her satır başlığı
  DOM'da iki kez geçerdi (biri onay metninde) ve `getByText(başlık)` iki eleman bulurdu. **Yaşandı.**
- **Yıkıcı düğme renk kuralı:** tetikleyici = kırmızı ÇERÇEVE, onaydaki son düğme = DOLU kırmızı.
  Hepsini doldurmak "geri dönüşü yok" sinyalini siler. `src/components/OnayDialog.tsx` ortak bileşen.
- **Toplantı notunda varsayılan sorumlu artık seçiliyor** (başlangıç: `me`). Eski sabit
  varsayılan `"Ortak"`tu ve Ortak arşivlendiği için görevler arşivli kişiye gidiyordu.
- **Ekledikten sonra `/gorevler`'e yönlendirilmiyor** — toplantıda sırayla kişi girebilmek için
  sayfada kalınıyor. Testler bu yüzden "N görev eklendi" satırını bekler, URL değişimini değil.
- **`completed_at` (0011) ayrı bir `before update` trigger'la yazılıyor.** `updated_at`
  kullanılamaz: bitmiş görevin açıklaması düzeltilince tarih bugüne kayar ve Geçmiş yalan söyler.
- **Notlar gerçekten gizli DEĞİL** (0010). `kisi` sütunu filtredir, sınır değil — tek paylaşılan
  hesap modelinde RLS kişiyi ayırt edemez. Arayüz bunu kullanıcıya yazıyor; o cümleyi silme.
- **`notlar` Realtime'a eklenmedi** — her not yazımında herkesin panosu tazelenirdi.
- **Görevler sayfasında filtre URL'den İKİ YÖNLÜ okunuyor.** Sadece `useState` başlangıç
  değeri olarak okunsaydı, `/gorevler?faz=B` ekranındayken alt menüden "Görevler"e dokunmak
  aynı route olduğu için bileşeni yeniden kurmaz, filtre eski kalır ve yazma effect'i adresi
  geri `?faz=B` yapardı — sekme hiçbir şey yapmamış gibi görünürdü. İki effect'in birbirini
  tetiklememesi `yazdigimiz` ref'ine dayanıyor; onu kaldırma. **Yaşandı.**
- **Üst çubuk `flex-wrap`, ama `?`/`⚙` düğmelerine `min-w` VERİLMEZ.** Genişlik eklemek
  telefonda çubuğu ikinci satıra düşürüyor ve her ekranda dikey yer yiyor. Yükseklik
  (`min-h-[2.5rem]`) yeterli.
- **`disabled:opacity` tek değerde: 50.** Dört farklı değer vardı.

## Telefonda "uygulama" olarak kullanmak (PWA)
Yunus panoyu Android'de ana ekrana ekleyince **her açılışta şifre soruyordu**. Sebep çerez
DEĞİLDİ (oturum çerezi httpOnly ve Max-Age 400 gün). Site "yüklenebilir uygulama" sayılmadığı
için kısayol ayrı bir depolama kutusunda açılıyor ve oturum kayboluyordu. Gereken üç parça:
- **`src/app/manifest.ts`** — `display: "standalone"`, 192/512 ikon, maskable dahil.
- **`public/sw.js`** — Android/Chrome WebAPK için manifest TEK BAŞINA yetmiyor, bir service
  worker + fetch dinleyicisi de arıyor. **Bilerek önbellek YOK:** görev panosunda bayat veri,
  çalışmayan panodan kötüdür.
- **`apple-mobile-web-app-capable` meta etiketi ELLE** (`layout.tsx`). Next 15 `appleWebApp.capable`
  için modern `mobile-web-app-capable`i basıyor, iOS Safari hâlâ yalnızca apple- öneklisini tanıyor.

⚠ **`manifest.webmanifest` ve `sw.js` middleware matcher'ının DIŞINDA olmalı.** İkisi de oturumdan
önce isteniyor; matcher'a girerlerse 307 ile `/giris`'e dönüyorlar, tarayıcı JSON/JS yerine HTML
alıyor ve kurulum sessizce başarısız oluyor. `tests/giris.mjs` bunu bekçiliyor.

⚠ **Düzeltme eski kısayollara ULAŞMAZ.** Ana ekrandaki eski simge eski kimliğini koruyor;
silinip yeniden eklenmesi gerekiyor.

## Yönetim kuralları (Faz 5 · Kontrol Noktası 2)
- **Faz ve kişi SİLİNMEZ, arşivlenir.** `tasks.phase_id` fazlara foreign key ile bağlı; `tasks.owner`, `tasks.created_by`, `task_events.actor` kişi adını düz metin tutuyor. Silme, görevleri kırar ya da sahipsiz bırakır.
- **Kişi adı değiştirilemez** — aynı sebep. Gerekirse arşivle + yeni kişi ekle.
- **Yeni kişi varsayılanı `sadece_sorumlu = true`** (panoya giremez). Yanlışlıkla erişim vermek, yanlışlıkla vermemekten pahalı.
- **Arşivli sorumlu, görevin kendi menüsünde kalır** (`sorumluSecenekleri`). Yoksa `<select>` karşılığı olmayan bir değere bakar, tarayıcı ilk seçeneği gösterir ve kullanıcı başka bir alanı düzenlerken sorumluyu sessizce değiştirir. **Yaşandı.**
- **Tekrarlayan görev trigger'ında iki kat koruma var** (`0009`): yalnızca "başka durumdan Yapıldı'ya" geçişte, ve aynı başlık+tarihte görev yoksa. Biri kaldırılırsa "Yapıldı → Bekliyor → Yapıldı" çift kopya üretir.
- **İçe aktarma yalnızca EKLER.** "Panoyu sıfırla" zaten var; ikinci bir yıkıcı yol koyma.
- **Testler kendi ürettiklerini siler, başkasını değil.** `tests/yonetim.mjs` başlangıçtaki görev kimliklerini not edip yalnızca yenileri temizliyor. "created_by = X olanı sil" gibi geniş filtreler Kürşad'ın gerçek görevlerini silerdi.

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

---

## DEVAM PROMPTU — 19 Eylül 2026 (bir sonraki oturum buradan başlasın)

### Canlı durum
- **https://inneredgepanel.vercel.app** · eski adres **https://inner-edge-pano.vercel.app** de çalışıyor
- Ekip şifresi: `innerteam2026` · giriş sonrası üstteki "Ben:" menüsünden kişi seçiliyor
- **199 test geçiyor** (11 paket) · 32 ekran görüntüsü, yatay taşma 0, konsol temiz
- Pano sağlıklı: 37 demo görev, 5 faz, 6 kişi (3'ü arşivde), 0 kişisel not

### Bu oturumda bitenler (hepsi canlıda)
1. **Yeni alan adı** eklendi, eski korundu.
2. **Görev satırında eylem düğmeleri**: sol ✓ (tek dokunuşla bitir/geri al), sağ 🗑 (onaylı silme),
   gövdeye dokunma = detay. TaskDetail'in onaysız silmesi iki adımlıya çevrildi.
3. **Toplantı notunda varsayılan sorumlu + varsayılan tarih**; ekledikten sonra sayfada kalınıyor;
   önizlemede kişi dağılımı (`Kürşad 5 · Sarah 5 · Yunus 5`).
4. **Notlarım** — `/benim` altında ikinci sekme, `notlar` tablosu (migration 0010).
5. **Geçmiş görünümü** — 4. görünüm modu, `completed_at` (migration 0011); takvimde bitmiş
   görevler ✓ ve üstü çizili.
6. **`/nasil-kullanilir`** — ekip için kullanım kılavuzu; üstte "?" ve ana sayfada kart.

### 19 Eylül · son tur (A + B)
- **Genel Bakış kişiselleştirildi:** stats altında `{me}, açık görevlerin` — geciken önce,
  sonra en yakın tarihli, en fazla 5 satır, `Tümünü gör → /gorevler?kisi={me}`.
  Satırlar mevcut `TaskRow`; "Benim" sayfası değişmedi.
- **Demo öncesi tarama:** `TekGorev` arşivli faza sessizce yazıyordu (düzeltildi) · Geçmiş
  filtre boş dönünce "hiç tamamlanmadı" diyordu (düzeltildi) · `HataBandi` uzun hata
  metninde sayfayı yatay kaydırıyordu · `TopluCubuk` çentikli telefonda alt menüye
  biniyordu · üst çubuk uzun isimde taşıyordu · beş ekranda eksik boş-durum mesajı ·
  dokunma hedefleri 40px'e çıkarıldı · `disabled:opacity` tek değerde birleşti.

### 20 Eylül · telefonda uygulama + test dayanıklılığı
- **PWA eklendi** (manifest + service worker + apple meta + ikonlar). Yunus'un "her açılışta
  şifre soruyor" sorunu buydu. Ekip eski kısayolu silip yeniden eklemeli.
- **Testlerdeki sabit görev sayıları kaldırıldı.** 36 → 39 görevle doğrulandı: eskiden 5 kontrol
  kırılırdı, artık geçiyor.
- **Ekip panoyu test etti:** bir görev eklendi, iki tohum görevi silindi. Geri yüklenmedi —
  bilerek silinmiş veriyi geri getirmek kullanıcının kararını ezmek olur, zaten toplantıda
  pano sıfırlanacak.

### Yarım kalan / bilinen durum
- ~~"Panoyu Sıfırla" test edilmedi~~ → **19 Eylül'de canlıda GERÇEKTEN çalıştırıldı ve doğrulandı:**
  37 → 0, silmeden önce yedek indi, yanlış onay kelimesiyle düğme kapalı kalıyor. Ardından
  `scripts/yedek-2026-09-19T112744.json`'dan geri yüklendi (37 görev, `sirano` korunarak).
  Geri yükleme log trigger'ını tetikliyor; 37 "created" kaydı temizlendi.
- **Geçmiş sekmesi şu an boş**: testler bütün görev durumlarını "Bekliyor"a çekiyor. İlk görev
  bitirildiğinde dolar — tanıtımda canlı göstermek için iyi bir an.
- Demo verisi (37 görev) bilerek duruyor. Toplantıda Ayarlar → Panoyu Sıfırla ile temizlenecek.

### Sonraki oturumda bakılacak (bilerek ertelendi)
Demo arifesinde dokunulmadı, hiçbiri günlük kullanımı engellemiyor:
- `store.tsx` › `iyimser`: iki hızlı iyimser yazmadan biri başarısız olursa diğerinin
  değişikliği de geri alınıyor.
- `store.tsx`: her yazma kendi Realtime olayını tetikleyip `router.refresh()` ile iyimser
  state'i eziyor — çok hızlı tıklamada kutucuk geri sekebilir.
- `TaskDetail`: açıklama taslağı yalnızca `taskId` değişince sıfırlanıyor; düzenleme
  sırasında gelen Realtime değişikliği "Kaydet"te eziliyor.
- `FazYonetimi`: faz sırası iki ayrı `await` ile takas ediliyor, ikincisi düşerse sıra belirsiz.
- Buton dolgu çeşitliliği (`px-2.5`/`px-3`/`px-4`) bilerek bırakıldı.

### Açık konu — Kürşad istedi
**Kişi bazlı gerçek giriş modeli.** Bugünkü tek paylaşılan şifre yüzünden (a) "kim yaptı" bilgisi
beyandır, (b) Notlarım gerçekten gizli değil. Kürşad "evet, ileride konuşalım" dedi. Magic link'e
dönmeden, daha hafif bir model (kişi başı şifre + httpOnly çerez, ya da Supabase'de üç ayrı hesap)
tasarlanmalı. **Bu ayrı bir planlama konusu, tek başına bir kontrol noktası.**

### Sonraki oturumun ilk okuyacağı 3 dosya
1. `CLAUDE.md` (bu dosya) — özellikle "20 Eylül sürümü" ve "Test" bölümleri
2. `src/lib/store.tsx` — bütün veri akışı ve Realtime buradan geçiyor
3. `supabase/migrations/` — 0010 ve 0011 en yeni şema

### Toplantı metni yapıştırıldığında izlenecek yol
1. Ayarlar → **Panoyu Sıfırla** (yedeği otomatik iner, onay için `SİL` yazılır)
2. Ekle → **Toplantı notu** → varsayılan sorumlu = Yunus → satırları yapıştır → ekle
3. Varsayılan sorumluyu Sarah yap → ekle → Kürşad yap → ekle
4. `npm run dogrula` ile kontrol
