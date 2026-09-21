/**
 * Tek çizgi kalınlığında ikon seti.
 *
 * NEDEN EMOJİ DEĞİL: ekip karışık cihaz kullanıyor (Kürşad iPhone, Sarah ve
 * Yunus Android). Aynı emoji her platformda başka çiziliyor — kimi renkli,
 * kimi farklı boyutta, yanındaki metinle hizasız. Bu ikonlarda renk
 * `currentColor`'dan geliyor, boyut yazı tipiyle hizalanıyor, üç cihazda da
 * aynı görünüyor.
 *
 * Hepsi `aria-hidden`: ikon tek başına hiçbir yerde anlam taşımıyor, yanında
 * ya metin var ya da düğmede `aria-label`.
 */
type IkonProps = { boyut?: number; className?: string };

function Govde({ boyut = 16, className, children }: IkonProps & { children: React.ReactNode }) {
  return (
    <svg
      aria-hidden
      focusable="false"
      width={boyut}
      height={boyut}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={{ flexShrink: 0 }}
    >
      {children}
    </svg>
  );
}

export function IkonCop(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m2 0v12a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1V7" />
    </Govde>
  );
}

export function IkonOnay(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M5 13l4 4L19 7" />
    </Govde>
  );
}

export function IkonKisi(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Govde>
  );
}

export function IkonTakvim(p: IkonProps) {
  return (
    <Govde {...p}>
      <rect x="4" y="6" width="16" height="14" rx="2" />
      <path d="M4 10h16M8 3v4M16 3v4" />
    </Govde>
  );
}

export function IkonKlasor(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M4 7a1 1 0 0 1 1-1h4l2 2h8a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    </Govde>
  );
}

export function IkonNot(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M20 14a2 2 0 0 1-2 2H8l-4 4V5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2z" />
    </Govde>
  );
}

export function IkonUyari(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M10.3 4.3 2.6 18a2 2 0 0 0 1.7 3h15.4a2 2 0 0 0 1.7-3L13.7 4.3a2 2 0 0 0-3.4 0z" />
      <path d="M12 9v4M12 17h.01" />
    </Govde>
  );
}

export function IkonSoru(p: IkonProps) {
  return (
    <Govde {...p}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-.9.8-.9 1.4v.4M12 17h.01" />
    </Govde>
  );
}

export function IkonAyar(p: IkonProps) {
  return (
    <Govde {...p}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3H9a1.6 1.6 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8V9a1.6 1.6 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1z" />
    </Govde>
  );
}

export function IkonYukari(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M12 19V5M6 11l6-6 6 6" />
    </Govde>
  );
}

export function IkonAsagi(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M12 5v14M6 13l6 6 6-6" />
    </Govde>
  );
}

export function IkonKalem(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M4 20h4L19 9a2.1 2.1 0 0 0-3-3L5 17v3z" />
    </Govde>
  );
}

export function IkonArsiv(p: IkonProps) {
  return (
    <Govde {...p}>
      <rect x="3" y="4" width="18" height="4" rx="1" />
      <path d="M5 8v11a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V8M10 12h4" />
    </Govde>
  );
}

export function IkonSagOk(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M9 6l6 6-6 6" />
    </Govde>
  );
}

export function IkonTekrar(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M17 2l4 4-4 4" />
      <path d="M3 11v-1a4 4 0 0 1 4-4h14M7 22l-4-4 4-4" />
      <path d="M21 13v1a4 4 0 0 1-4 4H3" />
    </Govde>
  );
}

export function IkonGenel(p: IkonProps) {
  return (
    <Govde {...p}>
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3.2" />
    </Govde>
  );
}

export function IkonListe(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M4 7h16M4 12h16M4 17h16" />
    </Govde>
  );
}

export function IkonYildiz(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="m12 4 2.5 5.2 5.5.8-4 3.9.9 5.6-4.9-2.7-4.9 2.7.9-5.6-4-3.9 5.5-.8z" />
    </Govde>
  );
}

export function IkonArti(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M12 5v14M5 12h14" />
    </Govde>
  );
}

export function IkonCikis(p: IkonProps) {
  return (
    <Govde {...p}>
      <path d="M15 17l5-5-5-5M20 12H9M11 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5" />
    </Govde>
  );
}
