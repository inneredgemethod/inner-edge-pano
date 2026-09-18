-- 0008 — 0007'de bırakılan geçici uyumluluk katmanını kaldırır.
--
-- SIRA ÖNEMLİ: bu migration, yeni sürüm CANLIYA ÇIKTIKTAN SONRA uygulanır.
-- Önce uygulansaydı, eski sürümü çalıştıran canlı site `allowed_users`'ı
-- bulamayıp kadroyu boş görecek ve herkesi giriş ekranına atacaktı.

drop view if exists allowed_users;

-- Zaman grupları (Gecikmiş / Bu hafta / Gelecek hafta / Sonrası / Tarihsiz)
-- artık hedef tarihten türetiliyor. Elle yazılan bu etiket yeni görevlerde boş
-- kalıyor ve görevin tarihi değişince güncellenmiyordu — iki ayrı gerçek
-- kaynağı vardı, biri yalan söylüyordu.
alter table tasks drop column if exists week_label;
