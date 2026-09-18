-- 0004 — Her değişikliği task_events'e VERİTABANI yazar.
--
-- Neden uygulamada değil: "önce görevi güncelle, sonra log at" iki ayrı istek
-- demek. İkincisi düşerse log sessizce kaybolur ve kimin ne yaptığı bilinmez.
-- Trigger aynı işlemin içinde çalışır: görev değiştiyse log da vardır.

-- Giriş yapan kişinin görünen adı.
create or replace function private.aktif_kisi() returns text
language sql
stable
security definer
set search_path = public
as $$
  select display_name from allowed_users
  where email = (select auth.jwt()) ->> 'email'
  limit 1
$$;

revoke execute on function private.aktif_kisi() from public;
grant execute on function private.aktif_kisi() to authenticated;

-- created_by'ı elle göndermeye gerek kalmasın; K6 silme kuralı buna dayanıyor.
create or replace function private.tasks_created_by() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is null then
    new.created_by := (select auth.jwt()) ->> 'email';
  end if;
  return new;
end $$;

create trigger tasks_created_by_trg
before insert on tasks
for each row execute function private.tasks_created_by();

create or replace function private.tasks_log() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Tohum yükleme service_role ile yapılır, JWT yoktur: 'Sistem' yazılır.
  kisi   text := coalesce(private.aktif_kisi(), 'Sistem');
  eposta text := (select auth.jwt()) ->> 'email';
begin
  if TG_OP = 'INSERT' then
    insert into task_events (task_id, kind, body, actor, actor_email)
    values (new.id, 'created', new.title, kisi, eposta);

  elsif TG_OP = 'UPDATE' then
    if new.status is distinct from old.status then
      insert into task_events (task_id, kind, body, actor, actor_email)
      values (new.id, 'status', old.status::text || ' → ' || new.status::text, kisi, eposta);
    end if;

    if new.owner is distinct from old.owner then
      insert into task_events (task_id, kind, body, actor, actor_email)
      values (new.id, 'edit', 'Sorumlu: ' || old.owner || ' → ' || new.owner, kisi, eposta);
    end if;

    if new.due_date is distinct from old.due_date then
      insert into task_events (task_id, kind, body, actor, actor_email)
      values (new.id, 'edit',
              'Hedef tarih: ' || coalesce(old.due_date::text, 'yok')
                              || ' → ' || coalesce(new.due_date::text, 'yok'),
              kisi, eposta);
    end if;
  end if;

  return null;
end $$;

create trigger tasks_log_trg
after insert or update on tasks
for each row execute function private.tasks_log();

-- Not: SİLME loglanmıyor. task_events görev silinince cascade ile birlikte
-- gidiyor, yani kaydın tutulacağı bir yer kalmıyor. v0.1 için kabul; ileride
-- gerekirse ayrı bir arşiv tablosu açılır.
