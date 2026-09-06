import { STATUS_LABEL } from "@/lib/format";

export function StatusChip({ lifecycle, status }: { lifecycle: string; status: string }) {
  if (lifecycle !== "published") {
    return <span className="chip">{lifecycle === "draft" ? "Draft" : "Retired"}</span>;
  }
  return <span className={`chip ${status === "sold" ? "" : "available"}`}>{STATUS_LABEL[status] ?? status}</span>;
}
