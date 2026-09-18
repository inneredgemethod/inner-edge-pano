-- 0002 — Supabase güvenlik/performans denetçisinin iki bulgusunu kapatır.

-- ---------------------------------------------------------------------------
-- BULGU 1: is_allowed() /rest/v1/rpc/is_allowed olarak dışarıya açıktı.
-- Sadece RLS politikalarının içinde kullanılıyor; HTTP uç noktası olmasına
-- gerek yok. PostgREST yalnızca public + graphql_public şemalarını yayınladığı
-- için fonksiyonu private şemasına taşımak uç noktayı tamamen kaldırır.
--
-- is_email_allowed() bilerek public'te kalıyor: giriş sayfası magic link
-- göndermeden önce onu çağırmak zorunda.
-- ---------------------------------------------------------------------------

create schema if not exists private;
grant usage on schema private to authenticated, anon;

create or replace function private.is_allowed() returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from allowed_users where email = (select auth.jwt()) ->> 'email')
$$;

-- Politikalar fonksiyona bağlı olduğu için önce onları taşıyoruz.
drop policy "ekip okur"                on tasks;
drop policy "ekip yazar"               on tasks;
drop policy "ekip günceller"           on tasks;
drop policy "ekleyen veya admin siler" on tasks;
drop policy "ekip okur"                on task_events;
drop policy "ekip yazar"               on task_events;
drop policy "ekip okur"                on phases;
drop policy "kendini görür"            on allowed_users;

create policy "ekip okur"      on tasks for select using (private.is_allowed());
create policy "ekip yazar"     on tasks for insert with check (private.is_allowed());
create policy "ekip günceller" on tasks for update using (private.is_allowed()) with check (private.is_allowed());

-- BULGU 2: auth.jwt() her satır için yeniden değerlendiriliyordu.
-- (select auth.jwt()) sarmalayınca Postgres bunu bir kez hesaplayıp
-- InitPlan olarak saklıyor.
create policy "ekleyen veya admin siler" on tasks for delete using (
  private.is_allowed() and (
    created_by = (select auth.jwt()) ->> 'email'
    or exists (
      select 1 from allowed_users
      where email = (select auth.jwt()) ->> 'email' and is_admin
    )
  )
);

create policy "ekip okur"     on task_events for select using (private.is_allowed());
create policy "ekip yazar"    on task_events for insert with check (private.is_allowed());
create policy "ekip okur"     on phases      for select using (private.is_allowed());
create policy "kendini görür" on allowed_users for select using (private.is_allowed());

drop function public.is_allowed();

-- is_email_allowed içindeki auth çağrısı yok ama tutarlılık için aynı sarmalama
-- gerekmiyor; sadece grant'ı netleştiriyoruz.
revoke execute on function private.is_allowed() from public;
grant execute on function private.is_allowed() to authenticated, anon;
