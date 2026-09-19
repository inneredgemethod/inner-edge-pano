-- 0010 — Kişisel notlar ("Notlarım").
--
-- ⚠ GERÇEK GİZLİLİK YOK, bilerek böyle.
-- Giriş tek paylaşılan Supabase hesabıyla yapılıyor (bkz. 0005). RLS'in
-- ayırt edebileceği tek şey "giriş yapmış mı" — kim olduğu değil. Bu yüzden
-- `kisi` sütunu bir GÜVENLİK SINIRI DEĞİL, bir FİLTRE: arayüz sadece seçili
-- kişinin notlarını gösterir, ama şifreyi bilen herkes hepsini okuyabilir.
-- Kişi bazlı gerçek giriş modeline geçilirse burası da sıkılaştırılmalı.

create table if not exists notlar (
  id         uuid primary key default gen_random_uuid(),
  kisi       text not null,
  icerik     text not null,
  created_at timestamptz not null default now()
);

comment on table notlar is
  'Kişisel not defteri. "kisi" bir filtredir, erişim sınırı DEĞİL — '
  'tek paylaşılan hesap modelinde RLS kişiyi ayırt edemez.';

create index if not exists notlar_kisi_idx on notlar (kisi, created_at desc);

alter table notlar enable row level security;

create policy "ekip notlari okur"     on notlar for select using (private.is_allowed());
create policy "ekip not ekler"        on notlar for insert with check (private.is_allowed());
create policy "ekip notu gunceller"   on notlar for update using (private.is_allowed()) with check (private.is_allowed());
create policy "ekip notu siler"       on notlar for delete using (private.is_allowed());

-- Realtime'a EKLENMİYOR: kişisel not canlı senkron gerektirmiyor, yayına
-- eklemek her not yazımında herkesin panosunu tazeletirdi.
