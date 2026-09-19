-- 0011 — Görev ne zaman bitti? ("Geçmiş" görünümü)
--
-- `updated_at` bu iş için yalan söyler: bitmiş bir görevin açıklamasını
-- düzeltince tarih bugüne kayar ve görev Geçmiş'te yanlış güne düşer.
-- Bitiş anı ayrı bir sütunda tutuluyor.

alter table tasks add column if not exists completed_at timestamptz;

comment on column tasks.completed_at is
  'Görevin "Yapıldı"ya geçtiği an. Yapıldı''dan çıkınca null''a döner. '
  'Geçmiş görünümü bu sütuna göre gruplar.';

create or replace function private.tasks_bitis() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.status = 'Yapıldı' and old.status is distinct from 'Yapıldı' then
    new.completed_at := now();
  elsif new.status is distinct from 'Yapıldı' then
    -- Görev yeniden açıldı: eski bitiş anı artık geçerli değil.
    new.completed_at := null;
  end if;
  return new;
end $$;

-- BEFORE UPDATE: yazdığımız değerin satırın kendisine girmesi gerekiyor.
-- Mevcut tasks_log_trg ve tasks_tekrar_trg AFTER UPDATE — çakışma yok.
drop trigger if exists tasks_bitis_trg on tasks;
create trigger tasks_bitis_trg
before update on tasks
for each row execute function private.tasks_bitis();

-- Geriye dönük doldurma. `updated_at` YAKLAŞIK bir değer (yukarıdaki gerekçe
-- tam da bu yüzden) ama alternatifi, panoda bugüne kadar bitmiş her görevin
-- Geçmiş'te hiç görünmemesi olurdu.
update tasks set completed_at = updated_at
where status = 'Yapıldı' and completed_at is null;
