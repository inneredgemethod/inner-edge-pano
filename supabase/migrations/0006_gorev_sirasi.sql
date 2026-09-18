-- 0006 — Görev sırasını sabitler.
--
-- SORUN: 37 tohum görev tek INSERT ile eklendiği için hepsinin created_at
-- değeri BİREBİR AYNI. `order by created_at` hiçbir şey sıralamıyordu;
-- Postgres satırları istediği sırada döndürüyor ve bir satır güncellenince
-- sıra değişiyordu. Panodaki görevler kendiliğinden yer değiştiriyordu.
--
-- Tohum dosyasındaki sıra anlamlı (hafta hafta, iş mantığına göre dizilmiş),
-- o yüzden alfabetik veya rastgele sıraya düşmesini istemiyoruz.

alter table tasks add column if not exists sirano int;

comment on column tasks.sirano is
  'Listeleme sırası. Tohum görevlerde 04_gorevler_seed.json''daki sıra; '
  'yeni görevler sona eklenir. created_at güvenilmez: tohum kayıtlarının '
  'hepsi aynı ana yazıldı.';

-- Yeni görevler sona eklensin.
create or replace function private.tasks_sirano() returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.sirano is null then
    select coalesce(max(sirano), 0) + 1 into new.sirano from tasks;
  end if;
  return new;
end $$;

drop trigger if exists tasks_sirano_trg on tasks;
create trigger tasks_sirano_trg
before insert on tasks
for each row execute function private.tasks_sirano();

create index if not exists tasks_sirano_idx on tasks(sirano);
