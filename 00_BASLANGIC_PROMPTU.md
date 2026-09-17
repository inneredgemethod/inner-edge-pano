# CLAUDE CODE'A YAPIŞTIRILACAK BAŞLANGIÇ PROMPTU
> Bu dosyanın altındaki metni olduğu gibi Claude Code'a yapıştır. Klasördeki diğer dosyalar (CLAUDE.md, 01-05) referans.

---

Merhaba. Bu klasörde "Inner Edge Ekip Panosu" projesini kuracağız. Önce klasördeki tüm dosyaları oku: `CLAUDE.md`, `01_PRD.md`, `02_FAZLAR.md`, `03_ornek_pano.html`, `04_gorevler_seed.json`, `05_veritabani_sema.sql`, `06_SKILLS_VE_PLUGINLER.md`. Ürün mantığı ve akış `03_ornek_pano.html`'de; onu tarayıcıda açıp inceler gibi oku, aynı mantığı koruyacağız ama tasarımı modernleştireceğiz.

Çalışma kuralları:
- Türkçe konuş, kısa yaz, teknik jargonu bana açıklamadan kullanma.
- Her fazın başında ne yapacağını 3-5 madde yaz, onayımı al, sonra yap.
- Bir şey benim tarafımdan yapılması gereken bir adımsa (giriş yapmak, tarayıcıda onay vermek, anahtar yapıştırmak) DUR, bana adım adım söyle, ben "tamam" diyene kadar bekle. Benim yerime giriş yapmaya, şifre girmeye çalışma.
- Tasarım kararlarını (sekme yapısı, renk, mobil düzen) `01_PRD.md` §5'teki "karar bekleyen" maddelere göre önce bana sor.

## ADIM 0 — Araç kurulumu ve girişler (her adımda dur, bana bildir)

1. **GitHub CLI:** `gh` kurulu mu kontrol et; değilse kur. Sonra `gh auth login` çalıştır — tarayıcıda açılacak ekranı bana söyle, ben onaylayınca devam et. Ardından `inner-edge-pano` adında **private** repo oluştur ve klasörü ona bağla.
2. **Vercel CLI:** `vercel` kur, `vercel login` çalıştır — tarayıcı onayını bekle. Sonra projeyi Vercel'e bağla (`vercel link`).
3. **Supabase:** Bana https://supabase.com adresinde yeni proje açmam için adımları yaz (proje adı: `inner-edge-pano`, bölge: Frankfurt `eu-central-1`, DB şifresini not almamı hatırlat). Ben açtıktan sonra senden isteyeceğin şeyler: Proje URL, `anon` public key, `service_role` key. Bunları `.env.local`'e ben yapıştıracağım; sen dosyayı `.gitignore`'a ekle.
4. **MCP'ler (isteğe bağlı, işi hızlandırır):** Supabase MCP'yi (`https://mcp.supabase.com/mcp`) ve Vercel MCP'yi (`https://mcp.vercel.com`) `claude mcp add` ile ekle; güncel kurulum komutunu resmi dokümandan doğrula, tahmin etme. Her biri tarayıcıda OAuth isteyecek — bana söyle, bekle.
5. **Skill'ler (`06_SKILLS_VE_PLUGINLER.md` Katman A):** Sırayla kur: önce `skill-security-auditor`'ı indir; sonra `superpowers` (resmi marketplace), `webapp-testing` (anthropics/skills example-skills), alirezarezvani'den `database-schema-designer` + `env-secrets-manager`, ve `ui-ux-pro-max-skill`. Her üçüncü taraf skill'i kurmadan auditor ile tara, `PASS` değilse kurma ve bana söyle. Kurulum komutlarını resmi README'den doğrula. Katman B ve C'yi ŞİMDİ kurma.
6. Hepsi tamamsa "Adım 0 tamam, Faz 1'e geçiyorum" de ve `02_FAZLAR.md`'deki Faz 1'e başla.

## ADIM 1+ — `02_FAZLAR.md`'yi takip et

Faz 1 biterken lokal önizlemeyi (`npm run dev`) açmamı iste ve bana göster. Faz 3 sonunda canlı Vercel linkini ver; o linki ekibe (Sarah, Yunus) atacağım.

Başla: önce dosyaları oku, sonra Adım 0.1'den ilerle.
