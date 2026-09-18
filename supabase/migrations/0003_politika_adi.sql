-- 0003 — Yanıltıcı politika adını düzeltir.
--
-- "kendini görür" adı, kullanıcının yalnızca kendi satırını göreceğini ima
-- ediyordu. Gerçekte private.is_allowed() izinli herkese true döndürdüğü için
-- politika ekibin ÜÇ satırını da gösteriyor. Davranış istediğimiz gibi
-- (sorumlu adları ve renkleri için roster lazım); yanlış olan isimdi.
alter policy "kendini görür" on allowed_users rename to "ekip listesini görür";
