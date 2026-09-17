import { formatDue } from "@/lib/data";
import { ownerColor, type Status } from "@/lib/types";

/** Durum rozetinin rengi — 03_ornek_pano.html'deki .s-* sınıflarıyla aynı. */
const STATUS_VAR: Record<Status, string> = {
  "Bekliyor": "var(--c-mute)",
  "Yapılıyor": "var(--c-amber)",
  "Yapıldı": "var(--c-green)",
  "Yapılamadı": "var(--c-red)",
};

export function StatusBadge({ status }: { status: Status }) {
  const color = STATUS_VAR[status];
  return (
    <span
      className="whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs"
      style={{ color, borderColor: status === "Bekliyor" ? "var(--c-line)" : color }}
    >
      {status}
    </span>
  );
}

export function OwnerBadge({ owner }: { owner: string }) {
  return (
    <span
      className="rounded-full px-2 py-0.5 text-[11px] font-semibold"
      style={{ background: ownerColor(owner), color: "#0b1f1c" }}
    >
      {owner}
    </span>
  );
}

export function DueLabel({ due, late }: { due: string; late: boolean }) {
  if (!due) return null;
  return (
    <span className="text-xs" style={{ color: late ? "var(--c-red)" : "var(--c-mute)" }}>
      {late ? "⚠ " : ""}
      {formatDue(due)}
    </span>
  );
}
