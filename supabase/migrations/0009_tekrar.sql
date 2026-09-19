-- 0009 — Tekrarlayan görevler.
--
-- "Yapıldı" işaretlenince bir sonraki kopya üretilir. Orijinal görev "Yapıldı"
-- olarak KALIR (geçmiş kaydı), yenisi ayrı bir satır olur.
--
-- Neden trigger: mevcut log trigger'ıyla aynı gerekçe. Uygulamaya bırakılsa
-- "önce durumu yaz, sonra kopyayı oluştur" iki ayrı istek olurdu; ikincisi
-- düşerse tekrar sessizce kaybolur.

alter table tasks add column if not exists tekrar text
  check (tekrar in ('haftalik', 'iki_haftada', 'aylik'));

comment on column tasks.tekrar is
  'Doluysa görev "Yapıldı" işaretlenince bir sonraki kopya üretilir. '
  'Hedef tarihi olmayan görev tekrarlamaz — kaydırılacak tarih yok.';

create or replace function private.tasks_tekrar() returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  yeni_tarih date;
begin
  -- Yalnızca "başka bir durumdan Yapıldı'ya" geçişte. Bu kontrol olmadan
  -- zaten Yapıldı olan bir görevin herhangi bir alanını düzenlemek her
  -- seferinde yeni kopya üretirdi.
  if not (old.status is distinct from 'Yapıldı' and new.status = 'Yapıldı') then
    return null;
  end if;

  if new.tekrar is null or new.due_date is null then
    return null;
  end if;

  yeni_tarih := case new.tekrar
    when 'haftalik'    then new.due_date + interval '7 days'
    when 'iki_haftada' then new.due_date + interval '14 days'
    when 'aylik'       then new.due_date + interval '1 month'
  end;

  -- İkinci koruma: "Yapıldı -> Bekliyor -> Yapıldı" yapılırsa yukarıdaki
  -- geçiş kontrolü tekrar sağlanır ve ikinci bir kopya üretilirdi.
  if exists (
    select 1 from tasks
    where title = new.title and due_date = yeni_tarih and id <> new.id
  ) then
    return null;
  end if;

  insert into tasks (phase_id, title, owner, due_date, what, why, done_when,
                     tekrar, created_by, son_degistiren)
  values (new.phase_id, new.title, new.owner, yeni_tarih, new.what, new.why,
          new.done_when, new.tekrar,
          coalesce(new.son_degistiren, new.created_by),
          new.son_degistiren);
  -- Notlar bilerek kopyalanmıyor: yeni döngünün kendi notları olur.

  return null;
end $$;

drop trigger if exists tasks_tekrar_trg on tasks;
create trigger tasks_tekrar_trg
after update on tasks
for each row execute function private.tasks_tekrar();
