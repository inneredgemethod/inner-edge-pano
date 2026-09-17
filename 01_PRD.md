# 01 — ÜRÜN TANIMI (PRD) · Inner Edge Ekip Panosu v0.1
**Tarih:** 17 Eylül 2026 · **Sahip:** Kürşad · **Kullanıcılar:** Kürşad, Sarah, Yunus

## 1. Sorun
Ekip WhatsApp'ta konuşuyor; kim ne yapacak, ne zaman, bitti mi — hiçbir yerde durmuyor. "Şöyle mi demiştik?" tartışması 3 ayda bir tekrarlıyor. Toplantı kararları kayboluyor.

## 2. Çözüm (v0.1)
Telefondan açılan, giriş yapılan, üç kişinin ortak gördüğü görev panosu. Görevler proje fazlarına ve kişilere göre ayrılır. Her göreve tıklayınca detay + durum + not.

## 3. Kullanıcı hikâyeleri (öncelik sırasıyla)
1. Kürşad olarak, bu hafta kimin ne yapması gerektiğini tek ekranda görmek istiyorum.
2. Sarah olarak, sadece kendi görevlerimi görüp "yapıldı/yapılıyor/yapılamadı" işaretlemek istiyorum, 10 saniyede.
3. Yunus olarak, bir görevin altına "şunu bekliyorum, şu takıldı" notu düşmek istiyorum; Kürşad bildirimsiz de olsa açınca görsün.
4. Herkes olarak, yeni görev eklemek istiyorum (başlık, kim, hangi faz, ne zaman).
5. Kürşad olarak, toplantıdan sonra 5-10 görevi hızlıca girmek istiyorum.
6. Herkes olarak, geciken ve takılan işleri bir bakışta görmek istiyorum.

## 4. Ekranlar
| Ekran | İçerik |
|---|---|
| Giriş | E-posta yaz → magic link → içeri. İzin listesi dışı e-posta: "Bu pano ekibe özel" mesajı |
| Genel bakış | Üstte 4 sayı (yapılan/toplam, benim açık görevim, geciken, takılan) + hangi fazdayız + faz geçiş şartı |
| Görevler | Filtreler: faz sekmeleri, kişi, "yapılanları gizle", "sadece takılan/geciken". Liste: başlık, sorumlu rozeti, tarih, durum rozeti, son not özeti |
| Görev detayı | Başlık, faz/hafta, "ne yapılacak / neden önemli / bitti sayılır", 4 durum düğmesi, sorumlu+tarih değiştirme, not akışı (kim/ne zaman), not ekleme, sil |
| Görev ekle | Başlık, sorumlu, faz, tarih. Açıklamalar sonradan detaydan doldurulabilir |

Referans: `03_ornek_pano.html` (mantık doğru, görünüm modernleşecek).

## 5. KARAR BEKLEYEN MADDELER — kodlamadan önce Kürşad'a sor
| # | Konu | Seçenekler | Öneri |
|---|---|---|---|
| K1 | Ana gezinme | (a) Alt sekme çubuğu: Genel · Görevler · Benim · Ekle (b) Üst navbar'da kişi isimleri: Herkes · Kürşad · Sarah · Yunus (c) İkisi birden | **(c)**: mobilde alt sekme, Görevler sekmesinde kişi filtresi üstte |
| K2 | Faz gösterimi | (a) Yatay kaydırılan faz kartları (b) Açılır menü (c) Ayrı "Fazlar" sayfası | **(a)** ama tek satır, kaydırmalı |
| K3 | Tema | Koyu (marka: lacivert #121a24 + teal #3ee0cc) / Açık / Sistem | **Koyu varsayılan + sistem seçeneği** |
| K4 | Giriş yöntemi | Magic link (şifresiz) / Google ile giriş / Basit PIN | **Magic link** — 3 kişi, şifre yok, ekstra kurulum yok |
| K5 | Not ekleyince bildirim | Yok / E-posta / WhatsApp (ileride) | v0.1: **yok**; v0.2: günlük özet e-postası |
| K6 | Kim silebilir | Herkes / Sadece ekleyen + Kürşad | **Ekleyen + Kürşad** |

## 6. Kapsam dışı (v0.1'de YAPILMAYACAK)
Dashboard/grafik, öğrenci paneli, dosya yükleme, yorum yanıtlama, takvim entegrasyonu, WhatsApp botu, çoklu proje ayrımı. Bunlar `02_FAZLAR.md` §Sonraki sürümler'de.

## 7. Başarı ölçütü
2 hafta içinde 3 kişi de en az 1 kez giriş yapıp durum değiştirmiş; Pazartesi toplantısı panodan yürüyor.
