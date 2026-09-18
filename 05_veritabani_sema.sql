-- ============================================================================
-- DİKKAT — BU DOSYA ARTIK GEÇERLİ ŞEMA DEĞİL, İLK TASLAKTIR.
--
-- Çalışan şemanın kaynağı: supabase/migrations/ (sırayla uygulanır).
-- Bu dosya tarihsel kayıt olarak duruyor; buradan kopyalayıp uygulama.
--
-- 18 Eylül 2026 itibarıyla uygulanmış migration'lar:
--
--   0001_init                 Tablolar, RLS, fazlar + kadro tohumu.
--                             is_allowed() SECURITY DEFINER yapıldı — aşağıdaki
--                             taslak hali "infinite recursion in policy" veriyor
--                             ve HİÇ KİMSE hiçbir şey göremiyordu.
--   0002_yetki_sikilastirma   is_allowed() private şemasına taşındı (REST ucu
--                             kalktı); silme politikasındaki auth.jwt()
--                             (select ...) ile sarmalandı (satır başına yeniden
--                             değerlendiriliyordu).
--   0003_politika_adi         "kendini görür" -> "ekip listesini görür".
--                             Politika aslında ekibin tamamını döndürüyordu;
--                             eski ad yanıltıcıydı.
--   0004_degisiklik_logu      task_events'i TRIGGER yazıyor. Uygulamaya
--                             bırakılsa "önce güncelle sonra log at" iki ayrı
--                             istek olurdu; ikincisi düşerse kayıt kaybolur.
--   0005_tek_sifreli_giris    Magic link kalktı. is_allowed() artık
--                             auth.role()='authenticated'. Log aktörü JWT
--                             yerine yeni `son_degistiren` sütunundan geliyor.
--                             K6 silme politikası "oturum açmış olan siler"e
--                             çevrildi: DELETE'te karşılaştırılacak doğrulanmış
--                             kimlik yok, uygulanamayan politikayı uygulanıyor
--                             gibi bırakmak korunduğunu sanmaktan kötü.
--   0006_gorev_sirasi         `sirano` sütunu. 37 tohum görev tek INSERT ile
--                             eklendiği için created_at'leri BİREBİR AYNI;
--                             order by created_at hiçbir şey sıralamıyordu ve
--                             görevler kendiliğinden yer değiştiriyordu.
--
-- `tasks` tablosunun güncel ek sütunları: son_degistiren, sirano.
-- Faz 5'te K6 arayüzden de kaldırıldı: herkes her görevi düzenler/siler.
-- ============================================================================

-- 05 — Supabase şema taslağı · Inner Edge Ekip Panosu v0.1
-- Claude Code: bunu migration olarak uygula (supabase/migrations/0001_init.sql). Gerekirse düzelt, ama tabloları ve alan anlamlarını koru.

create extension if not exists "pgcrypto";

-- Kimler girebilir (magic link sonrası e-posta buradaysa içeri alınır)
create table allowed_users (
  email        text primary key,
  display_name text not null,           -- Kürşad / Sarah / Yunus
  color        text not null default '#3ee0cc',
  is_admin     boolean not null default false
);

-- Proje fazları (uygulama içi iş fazları, kodlama fazları değil)
create table phases (
  id        text primary key,           -- A, B, C, D, K
  name      text not null,
  period    text,                       -- "14 – 27 Eylül"
  date_from date,
  date_to   date,
  gate      text,                       -- sonraki faza geçiş şartı
  sort      int not null
);

create type task_status as enum ('Bekliyor','Yapılıyor','Yapıldı','Yapılamadı');

create table tasks (
  id          uuid primary key default gen_random_uuid(),
  phase_id    text not null references phases(id),
  week_label  text,                     -- "Bu hafta (14-20 Eyl)"
  title       text not null,
  owner       text not null,            -- display_name; ileride user id olabilir
  due_date    date,
  status      task_status not null default 'Bekliyor',
  what        text,                     -- ne yapılacak
  why         text,                     -- neden önemli
  done_when   text,                     -- bitti sayılır
  created_by  text,                     -- e-posta
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

-- Not akışı + durum değişiklik logu (tek tabloda; kind ile ayrılır)
create table task_events (
  id         uuid primary key default gen_random_uuid(),
  task_id    uuid not null references tasks(id) on delete cascade,
  kind       text not null check (kind in ('note','status','edit','created')),
  body       text,                      -- not metni veya "Yapılıyor → Yapıldı"
  actor      text not null,             -- display_name
  actor_email text,
  created_at timestamptz not null default now()
);

create index on tasks(phase_id);
create index on tasks(owner);
create index on task_events(task_id, created_at);

-- updated_at otomatik
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger tasks_touch before update on tasks for each row execute function touch_updated_at();

-- RLS: sadece giriş yapmış ve izin listesindeki kullanıcı
alter table tasks enable row level security;
alter table task_events enable row level security;
alter table phases enable row level security;
alter table allowed_users enable row level security;

create or replace function is_allowed() returns boolean language sql stable as $$
  select exists (select 1 from allowed_users where email = auth.jwt() ->> 'email')
$$;

create policy "ekip okur"   on tasks       for select using (is_allowed());
create policy "ekip yazar"  on tasks       for insert with check (is_allowed());
create policy "ekip günceller" on tasks    for update using (is_allowed());
create policy "ekleyen veya admin siler" on tasks for delete using (
  is_allowed() and (
    created_by = auth.jwt() ->> 'email'
    or exists (select 1 from allowed_users where email = auth.jwt() ->> 'email' and is_admin)
  )
);
create policy "ekip okur"  on task_events for select using (is_allowed());
create policy "ekip yazar" on task_events for insert with check (is_allowed());
create policy "ekip okur"  on phases for select using (is_allowed());
create policy "kendini görür" on allowed_users for select using (is_allowed());

-- Realtime
alter publication supabase_realtime add table tasks, task_events;

-- Tohum: fazlar (görevler 04_gorevler_seed.json'dan script ile yüklenecek)
insert into phases (id,name,period,date_from,date_to,gate,sort) values
 ('A','1 · Toparlanma','14 – 27 Eylül','2026-09-14','2026-09-27','Üçlü toplantı yapıldı, içerik envanteri çıktı, herkesin haftalık zamanı belli.',1),
 ('B','2 · Sosyal medya ivmesi','28 Eyl – 25 Ekim','2026-09-28','2026-10-25','4 hafta üst üste haftada 3 içerik çıktı, etkileşim yükseldi, sıcak listede en az 20 ilgili kişi var.',2),
 ('C','3 · Bootcamp duyuru & kayıt','26 Eki – 22 Kasım','2026-10-26','2026-11-22','Ödemesini yapmış en az 7 kişi. 7 yoksa tarih ertelenir, kimse zorlamaz.',3),
 ('D','4 · Bootcamp (6 hafta)','Aralık – Ocak (taslak)','2026-11-30','2027-01-15','Öğrencilerin %80''i bitirdi, 3-5 video yorum alındı.',4),
 ('K','Kurumsal hat','Paralel','2026-09-14','2027-01-31','Bootcamp referansıyla ilk şirket görüşmesi.',5);

-- Tohum: kullanıcılar (E-POSTALARI KÜRŞAD VERECEK — placeholder'ları değiştir)
insert into allowed_users (email,display_name,color,is_admin) values
 ('KURSAD_EPOSTA','Kürşad','#3ee0cc',true),
 ('SARAH_EPOSTA','Sarah','#c9a6ff',false),
 ('YUNUS_EPOSTA','Yunus','#7cc4ff',false);
