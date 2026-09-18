-- 0001_init — Inner Edge Ekip Panosu v0.1
-- Kaynak: 05_veritabani_sema.sql. Tablolar ve alan anlamları korundu.
-- Değişiklikler dosya sonundaki "DÜZELTMELER" bölümünde tek tek açıklandı.

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
  owner       text not null,            -- display_name; Sibel/Emine/Ortak da olabilir
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
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  kind        text not null check (kind in ('note','status','edit','created')),
  body        text,                     -- not metni veya "Yapılıyor → Yapıldı"
  actor       text not null,            -- display_name
  actor_email text,
  created_at  timestamptz not null default now()
);

create index on tasks(phase_id);
create index on tasks(owner);
create index on task_events(task_id, created_at);

-- updated_at otomatik
create or replace function touch_updated_at() returns trigger
language plpgsql
set search_path = ''
as $$
begin new.updated_at = now(); return new; end $$;

create trigger tasks_touch before update on tasks
for each row execute function touch_updated_at();

-- ---------------------------------------------------------------------------
-- Yetki
-- ---------------------------------------------------------------------------

alter table tasks         enable row level security;
alter table task_events   enable row level security;
alter table phases        enable row level security;
alter table allowed_users enable row level security;

-- DÜZELTME 1 — security definer (aşağıda açıklandı)
create or replace function is_allowed() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from allowed_users where email = auth.jwt() ->> 'email')
$$;

create policy "ekip okur"      on tasks for select using (is_allowed());
create policy "ekip yazar"     on tasks for insert with check (is_allowed());
-- DÜZELTME 2 — with check eklendi
create policy "ekip günceller" on tasks for update using (is_allowed()) with check (is_allowed());
create policy "ekleyen veya admin siler" on tasks for delete using (
  is_allowed() and (
    created_by = auth.jwt() ->> 'email'
    or exists (select 1 from allowed_users where email = auth.jwt() ->> 'email' and is_admin)
  )
);

create policy "ekip okur"  on task_events for select using (is_allowed());
create policy "ekip yazar" on task_events for insert with check (is_allowed());
create policy "ekip okur"  on phases      for select using (is_allowed());
create policy "kendini görür" on allowed_users for select using (is_allowed());

-- DÜZELTME 6 — giriş sayfası magic link göndermeden önce bunu sorar.
-- security definer: anon rolü allowed_users'ı okuyamaz, sadece evet/hayır alır.
-- Not: bu, "şu e-posta ekipte mi" sorusunu dışarıya açar. 3 kişilik bir ekipte
-- kabul edilebilir bir takas; PRD "izin listesi dışı e-postaya net mesaj" istiyor.
create or replace function is_email_allowed(check_email text) returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from allowed_users where email = lower(trim(check_email)))
$$;

revoke execute on function is_email_allowed(text) from public;
grant execute on function is_email_allowed(text) to anon, authenticated;

-- Realtime: biri değiştirince diğerinin ekranı yenilemeden güncellensin
alter publication supabase_realtime add table tasks, task_events;

-- ---------------------------------------------------------------------------
-- Tohum: fazlar (görevler 04_gorevler_seed.json'dan scripts/seed.mjs ile yüklenir)
-- ---------------------------------------------------------------------------
insert into phases (id,name,period,date_from,date_to,gate,sort) values
 ('A','1 · Toparlanma','14 – 27 Eylül','2026-09-14','2026-09-27','Üçlü toplantı yapıldı, içerik envanteri çıktı, herkesin haftalık zamanı belli.',1),
 ('B','2 · Sosyal medya ivmesi','28 Eyl – 25 Ekim','2026-09-28','2026-10-25','4 hafta üst üste haftada 3 içerik çıktı, etkileşim yükseldi, sıcak listede en az 20 ilgili kişi var.',2),
 ('C','3 · Bootcamp duyuru & kayıt','26 Eki – 22 Kasım','2026-10-26','2026-11-22','Ödemesini yapmış en az 7 kişi. 7 yoksa tarih ertelenir, kimse zorlamaz.',3),
 ('D','4 · Bootcamp (6 hafta)','Aralık – Ocak (taslak)','2026-11-30','2027-01-15','Öğrencilerin %80''i bitirdi, 3-5 video yorum alındı.',4),
 ('K','Kurumsal hat','Paralel','2026-09-14','2027-01-31','Bootcamp referansıyla ilk şirket görüşmesi.',5);

-- DÜZELTME 3 — gerçek e-postalar
insert into allowed_users (email,display_name,color,is_admin) values
 ('info@inneredgemethod.io','Kürşad','#3ee0cc',true),
 ('sazyke@gmail.com',       'Sarah', '#c9a6ff',false),
 ('yunuskekec48@gmail.com', 'Yunus', '#7cc4ff',false);

-- ===========================================================================
-- DÜZELTMELER — 05_veritabani_sema.sql'e göre nelerin neden değiştiği
--
-- 1) is_allowed() artık SECURITY DEFINER.  ** KRİTİK **
--    Fonksiyon allowed_users'tan okuyor, ama o tablonun RLS politikası da
--    is_allowed()'ı çağırıyordu. Postgres bunu "infinite recursion detected
--    in policy for relation allowed_users" hatasıyla reddeder ve HİÇ KİMSE
--    hiçbir şey göremez. security definer, fonksiyonun sahibi yetkisiyle
--    çalışıp RLS'i atlamasını sağlar; döngü kırılır.
--
-- 2) tasks UPDATE politikasına with check eklendi.
--    using = hangi satır güncellenebilir; with check = güncelleme SONRASI satır
--    hâlâ politikaya uyuyor mu. İkincisi yoktu.
--
-- 3) Placeholder e-postalar gerçek adreslerle değiştirildi.
--
-- 4) Tohum görev id'leri ("6si48z3" gibi) uuid değil; atıldı, gen_random_uuid()
--    üretiyor. Hiçbir yerden referans verilmiyordu (notes dizileri boştu).
--
-- 5) tasks.owner serbest metin kaldı: Sibel / Emine / Ortak görev sorumlusu
--    olabiliyor ama allowed_users'ta değiller, giriş yapamıyorlar.
--
-- 6) is_email_allowed(text) eklendi — magic link gönderilmeden önce kontrol.
--    Yoksa izinsiz adrese de e-posta gidiyor, kullanıcı linke tıklıyor ve
--    ancak içeride "yetkin yok" duvarına çarpıyordu.
--
-- Ayrıca touch_updated_at()'e set search_path = '' eklendi (Supabase linter'ının
-- "function_search_path_mutable" uyarısı).
-- ===========================================================================
