-- 0005 — Magic link'ten tek şifreli girişe geçiş.
--
-- MODEL DEĞİŞİKLİĞİ: Artık kişi başına Supabase hesabı yok. Ekip tek bir
-- şifreyle giriyor; Next.js sunucusu şifreyi doğrulayıp tek paylaşılan
-- Supabase hesabıyla oturum açıyor. Tarayıcı geçerli bir JWT alıyor —
-- RLS ve Realtime bu sayede olduğu gibi çalışmaya devam ediyor.
--
-- BUNUN KAÇINILMAZ SONUCU: veritabanı artık "kim" olduğunu bilmiyor.
-- "Kürşad", "Sarah", "Yunus" istemcinin beyanı; doğrulanmış kimlik değil.
-- Kürşad bunu bilerek kabul etti (3 kurucu ortak, iç araç).

-- ---------------------------------------------------------------------------
-- 1) Erişim kapısı: "izin listesindeki e-posta" -> "geçerli oturum"
-- ---------------------------------------------------------------------------
-- Oturumu yalnızca sunucumuz açabiliyor (paylaşılan hesabın şifresi env'de,
-- tarayıcıya hiç gitmiyor) ve Supabase'de kayıt kapalı. Yani `authenticated`
-- olmak, "şifreyi bilen sunucudan geçti" demek.
--
-- DİKKAT: bunu `anon`'a açmak panoyu herkese açar — anon anahtarı zaten
-- tarayıcıda, yani herkeste.
create or replace function private.is_allowed() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select (select auth.role()) = 'authenticated'
$$;

-- ---------------------------------------------------------------------------
-- 2) "Kim yaptı" bilgisi artık istekle geliyor
-- ---------------------------------------------------------------------------
alter table tasks add column if not exists son_degistiren text;

comment on column tasks.son_degistiren is
  'Değişikliği yapan kişinin BEYAN ETTİĞİ adı (Kürşad/Sarah/Yunus). '
  'Doğrulanmış kimlik değil — tek şifreli giriş modelinin sonucu. '
  'Log trigger''ı aktör alanını buradan okuyor.';

comment on column tasks.created_by is
  'Görevi ekleyenin beyan ettiği adı. Tohum görevlerde NULL: onları kimse '
  'eklemedi, devir paketinden geldiler — K6 gereği yalnızca Kürşad silebilir.';

-- created_by artık JWT'den değil, istemciden geliyor: eski trigger gereksiz.
drop trigger if exists tasks_created_by_trg on tasks;
drop function if exists private.tasks_created_by();

-- Aktör kaynağı değişti.
create or replace function private.tasks_log() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  kisi text := coalesce(new.son_degistiren, new.created_by, 'Sistem');
begin
  if TG_OP = 'INSERT' then
    insert into task_events (task_id, kind, body, actor)
    values (new.id, 'created', new.title, kisi);

  elsif TG_OP = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into task_events (task_id, kind, body, actor)
      values (new.id, 'status', old.status::text || ' → ' || new.status::text, kisi);
    end if;

    if new.owner is distinct from old.owner then
      insert into task_events (task_id, kind, body, actor)
      values (new.id, 'edit', 'Sorumlu: ' || old.owner || ' → ' || new.owner, kisi);
    end if;

    if new.due_date is distinct from old.due_date then
      insert into task_events (task_id, kind, body, actor)
      values (new.id, 'edit',
              'Hedef tarih: ' || coalesce(old.due_date::text, 'yok')
                              || ' → ' || coalesce(new.due_date::text, 'yok'),
              kisi);
    end if;
  end if;

  return null;
end $$;

-- JWT e-postasına dayanıyordu, karşılığı kalmadı.
drop function if exists private.aktif_kisi();

-- ---------------------------------------------------------------------------
-- 3) K6 silme kuralı
-- ---------------------------------------------------------------------------
-- Eski politika created_by'ı JWT e-postasıyla karşılaştırıyordu. Artık
-- veritabanının karşılaştıracağı doğrulanmış bir kimlik YOK: silme isteğinde
-- "ben kimim" diye bir alan bile gelmiyor (DELETE'te `new` satırı olmaz).
--
-- Uygulanamayan bir politikayı uygulanıyormuş gibi bırakmak, korunduğunu
-- sanmaktan daha kötü. K6 arayüzde yaşıyor (Sil düğmesi gizleniyor); burada
-- dürüstçe "geçerli oturum silebilir" yazıyoruz.
drop policy "ekleyen veya admin siler" on tasks;
create policy "oturum acmis olan siler" on tasks for delete using (private.is_allowed());

-- ---------------------------------------------------------------------------
-- 4) Magic link kalıntıları
-- ---------------------------------------------------------------------------
drop function if exists public.is_email_allowed(text);

-- allowed_users artık giriş kapısı değil, KADRO listesi: "Ben" menüsündeki
-- isimler ve sorumlu rozetlerinin renkleri buradan geliyor.
comment on table allowed_users is
  'Ekip kadrosu: "Ben" menüsündeki isimler ve rozet renkleri. '
  'Faz 4''ten beri giriş yetkisiyle ilgisi YOK — giriş tek şifreyle yapılıyor.';

-- Kürşad''ın iki satırı vardı (iki e-posta); menüde iki kez görünmesin.
delete from allowed_users where email = 'kursadozcoban@gmail.com';
