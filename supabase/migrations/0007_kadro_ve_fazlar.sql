-- 0007 — Kadro veritabanına taşınıyor, fazlar yönetilebilir hale geliyor.
--
-- NEDEN: sorumlu listeleri (`OWNERS`) dört ayrı dosyada sabit kodluydu.
-- Bunun görünmeyen bir sonucu vardı: toplantı notu ayrıştırıcısı kadroyu
-- veritabanından okuduğu ve tabloda yalnızca giriş yapan 3 kişi bulunduğu için
-- "@Sibel" yazıldığında kimseyle eşleşmiyordu — sessizce sorumlusuz görev.

-- ---------------------------------------------------------------------------
-- 1) allowed_users -> kisiler
-- ---------------------------------------------------------------------------
-- Ad Faz 4'ten beri yanıltıcı: giriş tek şifreyle yapılıyor, bu tablonun
-- erişimle hiçbir ilgisi kalmadı. Yaptığı tek iş kadroyu tutmak.
alter table allowed_users rename to kisiler;

-- Birincil anahtar display_name olur: uygulama Faz 4'ten beri zaten isimle
-- çalışıyor (tasks.owner, tasks.created_by, task_events.actor hep isim).
-- E-postanın karşılığı kalmadı — tek paylaşılan hesap var ve Sibel gibi
-- panoya hiç girmeyecek kişilerin e-postası yok.
alter table kisiler drop constraint allowed_users_pkey;
alter table kisiler drop column email;
-- is_admin K6 ile birlikte işlevsiz kaldı (bkz. 0005); canlı kodda okuyan yok.
alter table kisiler drop column is_admin;
alter table kisiler add primary key (display_name);

alter table kisiler add column sadece_sorumlu boolean not null default false;
alter table kisiler add column sort           int     not null default 0;
alter table kisiler add column arsiv          boolean not null default false;

comment on table kisiler is
  'Ekip kadrosu. Giriş yetkisiyle ilgisi YOK (giriş tek şifreyle). '
  'Sorumlu menüleri, "Ben" seçicisi ve toplantı notu ayrıştırıcısı buradan beslenir.';
comment on column kisiler.sadece_sorumlu is
  'true ise kişi göreve sorumlu atanabilir ama "Ben" menüsünde çıkmaz — '
  'panoya girmiyor demektir (Sibel, Emine, Ortak).';
comment on column kisiler.arsiv is
  'Ekipten ayrılanlar. Menülerde görünmez; eski görevlerdeki adı bozulmaz.';

update kisiler set sort = case display_name
  when 'Kürşad' then 1 when 'Sarah' then 2 when 'Yunus' then 3 else 9 end;

-- Görev sorumlusu olabilen ama panoya girmeyen isimler. Renkler
-- src/lib/types.ts'teki OWNER_COLOR sabitinden taşındı; o sabit kaldırılıyor.
insert into kisiler (display_name, color, sadece_sorumlu, sort) values
  ('Sibel', '#ffb37c', true, 4),
  ('Emine', '#f7e18b', true, 5),
  ('Ortak', '#d9dee5', true, 6)
on conflict (display_name) do nothing;

-- ---------------------------------------------------------------------------
-- 2) Fazlar arşivlenebilir
-- ---------------------------------------------------------------------------
alter table phases add column arsiv boolean not null default false;
comment on column phases.arsiv is
  'Arşivlenen faz filtrelerde ve menülerde görünmez; mevcut görevleri bozulmaz.';

-- ---------------------------------------------------------------------------
-- 3) Yazma politikaları
-- ---------------------------------------------------------------------------
-- Iki tabloda da yalnızca SELECT politikası vardı; yönetim ekranları RLS'e
-- takılırdı.
create policy "ekip kisi ekler"     on kisiler for insert with check (private.is_allowed());
create policy "ekip kisi günceller" on kisiler for update using (private.is_allowed()) with check (private.is_allowed());
create policy "ekip kisi siler"     on kisiler for delete using (private.is_allowed());

create policy "ekip faz ekler"      on phases for insert with check (private.is_allowed());
create policy "ekip faz günceller"  on phases for update using (private.is_allowed()) with check (private.is_allowed());
create policy "ekip faz siler"      on phases for delete using (private.is_allowed());

-- ---------------------------------------------------------------------------
-- 4) Geçici uyumluluk görünümü
-- ---------------------------------------------------------------------------
-- CANLI SITE SU AN ESKI KODU CALISTIRIYOR ve `allowed_users`'tan okuyor.
-- Tabloyu yeniden adlandırdığımız an kadro boş dönerdi, herkes giriş ekranına
-- düşerdi. Bu görünüm, yeni sürüm yayına çıkana kadar canlıyı ayakta tutar;
-- 0008 ile kaldırılacak.
--
-- security_invoker: görünüm, sorgulayan kullanıcının yetkisiyle çalışsın.
-- Varsayılan davranış sahibin yetkisidir ve RLS'i ATLAR.
create view allowed_users with (security_invoker = true) as
  select display_name, color from kisiler where not arsiv and not sadece_sorumlu;

comment on view allowed_users is
  'GECICI uyumluluk görünümü — 0008 ile silinecek. Yeni kod kisiler tablosunu kullanır.';
