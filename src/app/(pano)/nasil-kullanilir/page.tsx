import Link from "next/link";

export const metadata = { title: "Nasıl kullanılır — Inner Edge Ekip Panosu" };

/**
 * Ekip için kullanım kılavuzu. Sunucu bileşeni: hiç JavaScript gerektirmiyor,
 * toplantıda projeksiyonda açılıp okunacak.
 */

const BOLUMLER = [
  {
    id: "giris",
    baslik: "1 · Panoya girmek",
    maddeler: [
      "Adres: **inneredgepanel.vercel.app** (eski adres **inner-edge-pano.vercel.app** de çalışıyor).",
      "Tek bir **ekip şifresi** var; Kürşad size verir. Tarayıcı şifreyi hatırlar, her seferinde sormaz.",
      'Şifreden sonra **"Ben kimim"** menüsünden kendinizi seçin. Yaptığınız her değişiklik bu isimle kaydedilir.',
      'Üstteki **"Ben:"** menüsünden kişiyi sonradan da değiştirebilirsiniz.',
    ],
  },
  {
    id: "gorev-ekleme",
    baslik: "2 · Görev eklemenin üç yolu",
    maddeler: [
      '**Tek görev** — alttaki **＋ Ekle** sekmesi. Başlık, sorumlu, faz, tarih. En basit yol.',
      '**Toplantı notu** — asıl hızlı yol. Üstten **varsayılan sorumlu** seçin, sonra her satıra bir görev yazın/yapıştırın. Hepsi o kişiye gider. Sonra bir sonraki kişiyi seçip devam edin.',
      'Satırda işaret kullanabilirsiniz: **@Sarah** sorumlu · **#2** faz · **!25.09** tarih. İşaret varsa varsayılanı ezer.',
      '**Şablon** — hazır görev setleri (Bootcamp kohortu, Kurumsal görüşme). Başlangıç tarihi seçersiniz, tarihler ona göre kayar.',
    ],
  },
  {
    id: "gorev-isleme",
    baslik: "3 · Bir görevi işlemek",
    maddeler: [
      'Soldaki **yuvarlak onay** düğmesi — tek dokunuşla "Yapıldı". Tekrar dokununca geri alınır.',
      "**Satırın ortasına dokunun** — detay penceresi açılır: durum, sorumlu, tarih, açıklamalar, notlar.",
      "Sağdaki **çöp kutusu** simgesi — görevi siler. Önce onay sorar; silinen geri gelmez.",
      'Detaydaki dört durum: **Bekliyor · Yapılıyor · Yapıldı · Yapılamadı**. "Yapılamadı" utanılacak bir şey değil — takıldığınız yeri görünür kılar.',
      "**Not ekleyin.** Görev detayındaki not kutusu, o işin hikâyesini tutar: kim, ne zaman, ne dedi.",
    ],
  },
  {
    id: "gorunumler",
    baslik: "4 · Görünümler ve arama",
    maddeler: [
      "**Liste** — tarihe göre gruplu: Gecikmiş, Bu hafta, Gelecek hafta, Sonrası.",
      "**Hafta** — tek haftanın gün gün dökümü.",
      "**Takvim** — aylık takvim; bitmiş görevler onay işareti ve üstü çizili görünür.",
      "**Geçmiş** — tamamlanan işler, bitirildikleri güne göre. **Neyi ne zaman yaptık** sorusunun cevabı burada.",
      "Üstteki arama kutusu başlık, açıklama ve notların içinde arar. Kişi ve faz filtreleri de var; filtrelediğiniz ekranın adresini kopyalayıp birine gönderebilirsiniz.",
      '**Seç** düğmesi toplu işlem açar: birden çok görevin sorumlusunu/tarihini bir kerede değiştirin veya hepsini silin.',
    ],
  },
  {
    id: "benim",
    baslik: "5 · Benim — görevlerim ve notlarım",
    maddeler: [
      '**Görevlerim** — yalnızca size atanmış işler; kaç tanesi açık, kaçı gecikmiş.',
      '**Notlarım** — kendi planlarınız, hatırlatmalarınız. Göreve bağlı değil.',
      '⚠ Notlar **gizli değildir**: panoya tek ekip şifresiyle giriliyor, yani şifreyi bilen herkes görebilir. Kişiye özel/hassas bir şey yazmayın.',
    ],
  },
  {
    id: "ayarlar",
    baslik: "6 · Ayarlar (⚙)",
    maddeler: [
      "**Fazlar** — ekleyin, adlandırın, sıralayın, arşivleyin. Silme yok; arşivlenen faz menülerden düşer ama görevleri bozulmaz.",
      '**Kişiler** — ekip üyesi ekleyin, arşivleyin. "Panoya girebilir" işareti, kişinin "Ben" menüsünde çıkıp çıkmayacağını belirler.',
      "**Yedek indir / JSON aktarım** — panonun tamamını dosyaya alır. İçe aktarma yalnızca **ekler**, mevcut görevlere dokunmaz.",
      '**Panoyu sıfırla** — bütün görevleri siler (fazlar ve kişiler kalır). Silmeden önce yedeği otomatik indirir ve onay için **SİL** yazmanızı ister. Toplantıdan sonra gerçek görevlere geçerken kullanılacak düğme budur.',
    ],
  },
  {
    id: "bilinmesi-gereken",
    baslik: "7 · Bilinmesi gerekenler",
    maddeler: [
      "Herkes her görevi görür ve değiştirebilir. Kilit yok — küçük bir ekipte güven, izinden daha iyi çalışır.",
      '**"Kim yaptı" bilgisi beyandır**, doğrulanmış kimlik değil: "Ben" menüsünden kimi seçerseniz kayıt o isimle düşer.',
      "Biri bir şeyi değiştirdiğinde diğerlerinin ekranı **kendiliğinden** güncellenir; yenilemenize gerek yok.",
      "Telefonda da masaüstünde de aynı pano. Alt sekmeler telefon için, üstteki menü masaüstü için.",
    ],
  },
];

function Satir({ metin }: { metin: string }) {
  // **kalın** işaretlerini ayıklar — tam bir markdown'a gerek yok.
  const parcalar = metin.split(/\*\*(.+?)\*\*/g);
  return (
    <li className="mb-2 text-sm leading-relaxed">
      {parcalar.map((p, i) =>
        i % 2 === 1 ? (
          <b key={i} style={{ color: "var(--c-ink)" }}>
            {p}
          </b>
        ) : (
          <span key={i}>{p}</span>
        ),
      )}
    </li>
  );
}

export default function NasilKullanilir() {
  return (
    <article className="mx-auto max-w-2xl">
      <h1 className="mb-1 text-lg font-semibold">Nasıl kullanılır</h1>
      <p className="mb-4 text-[13px]" style={{ color: "var(--c-mute)" }}>
        Inner Edge Ekip Panosu — Kürşad, Sarah ve Yunus&apos;un ortak görev listesi.
        Beş dakikada okunur.
      </p>

      <nav
        className="mb-5 rounded-lg border p-3"
        style={{ background: "var(--c-bg2)", borderColor: "var(--c-line)" }}
      >
        <ol className="grid gap-1 text-[13px]">
          {BOLUMLER.map((b) => (
            <li key={b.id}>
              <a href={`#${b.id}`} style={{ color: "var(--c-teal)" }}>
                {b.baslik}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {BOLUMLER.map((b) => (
        <section key={b.id} id={b.id} className="mb-5 scroll-mt-4">
          <h2 className="mb-2 text-base font-semibold" style={{ color: "var(--c-teal)" }}>
            {b.baslik}
          </h2>
          <ul style={{ color: "var(--c-mute)" }}>
            {b.maddeler.map((m, i) => (
              <Satir key={i} metin={m} />
            ))}
          </ul>
        </section>
      ))}

      <section
        className="rounded-lg border p-4"
        style={{ background: "var(--c-bg2)", borderColor: "var(--c-teal)" }}
      >
        <h2 className="mb-1 text-sm font-semibold">Takıldığınızda</h2>
        <p className="text-sm" style={{ color: "var(--c-mute)" }}>
          Kürşad&apos;a yazın. Bir şeyi yanlışlıkla sildiyseniz de söyleyin — Ayarlar&apos;dan
          düzenli yedek alınıyor, geri getirilebilir.
        </p>
        <Link
          href="/gorevler"
          className="mt-3 inline-block rounded-lg px-4 py-2 text-sm font-semibold"
          style={{ background: "var(--c-teal)", color: "var(--c-teal-ink)" }}
        >
          Panoya dön
        </Link>
      </section>
    </article>
  );
}
