import { useMemo, useState } from "react";
import { ArrowRight, Clock3, PackageCheck, RefreshCw, ShoppingBag, Timer } from "lucide-react";
import type { OwnerTab } from "@/components/OwnerWorkspaceShell";

type OrderRecord = { id: number; customerName?: string | null; customerPhone?: string | null; deliveryAddress?: string | null; totalPrice?: string | number | null; status: string; paymentStatus?: string | null; channel?: string | null; notes?: string | null; createdAt?: string | Date | null };
type Props = { orders: OrderRecord[]; isLoading: boolean; pendingReviews: number; onStatusChange: (orderId: number, status: string) => Promise<void>; onNavigate: (tab: OwnerTab) => void; onRefresh: () => void };
const lanes = [
  { status: "pending", label: "Needs attention", helper: "New orders to review" },
  { status: "confirmed", label: "Accepted", helper: "Ready for the kitchen" },
  { status: "preparing", label: "Preparing", helper: "Currently being made" },
  { status: "ready", label: "Ready", helper: "Waiting for collection or dispatch" },
] as const;
function ageLabel(value?: string | Date | null) {
  if (!value) return "Time unavailable";
  const timestamp = value instanceof Date ? value.getTime() : new Date(String(value)).getTime();
  if (!Number.isFinite(timestamp)) return "Time unavailable";
  const minutes = Math.max(0, Math.floor((Date.now() - timestamp) / 60000));
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
function nextAction(status: string) {
  switch (status) {
    case "pending": return { label: "Accept order", next: "confirmed" };
    case "confirmed": return { label: "Start preparing", next: "preparing" };
    case "preparing": return { label: "Mark ready", next: "ready" };
    case "ready": return { label: "Complete order", next: "delivered" };
    default: return null;
  }
}
function formatMoney(value?: string | number | null) {
  const amount = Number(value ?? 0);
  return Number.isFinite(amount) ? `KSh ${amount.toLocaleString("en-KE", { maximumFractionDigits: 0 })}` : "Amount unavailable";
}
function OrderCard({ order, onStatusChange }: { order: OrderRecord; onStatusChange: Props["onStatusChange"] }) {
  const [busy, setBusy] = useState(false);
  const action = nextAction(order.status);
  const paid = order.paymentStatus === "completed";
  const address = order.deliveryAddress && order.deliveryAddress !== "Walk-in / POS" ? order.deliveryAddress : null;
  const advance = async () => {
    if (!action || busy) return;
    setBusy(true);
    try { await onStatusChange(order.id, action.next); } finally { setBusy(false); }
  };
  return <article className={`pb-kitchen-order-card is-${order.status}`}>
    <div className="pb-kitchen-order-topline"><span className="pb-kitchen-order-id">PB-{order.id}</span><span className="pb-kitchen-order-age"><Clock3 size={13} /> {ageLabel(order.createdAt)}</span></div>
    <div className="pb-kitchen-customer"><strong>{order.customerName || "Customer"}</strong>{order.channel === "pos" && <span className="pb-kitchen-channel">WALK-IN / POS</span>}</div>
    {order.customerPhone && <div className="pb-kitchen-order-detail">{order.customerPhone}</div>}
    {address && <div className="pb-kitchen-order-detail">{address}</div>}
    {order.notes && <div className="pb-kitchen-order-note">{order.notes}</div>}
    <div className="pb-kitchen-order-bottom">
      <div><div className="pb-kitchen-order-total">{formatMoney(order.totalPrice)}</div><span className={`pb-kitchen-payment${paid ? " is-paid" : " is-pending"}`}>{paid ? "PAID" : (order.paymentStatus || "Payment unknown").replace(/_/g, " ").toUpperCase()}</span></div>
      {action ? <button type="button" className="pb-kitchen-action" onClick={advance} disabled={busy}>{busy ? "Updating…" : action.label}{!busy && <ArrowRight size={15} />}</button> : <span className="pb-kitchen-complete-label">{order.status === "delivered" ? "Completed" : order.status}</span>}
    </div>
  </article>;
}
export default function OwnerKitchenBoard({ orders, isLoading, pendingReviews, onStatusChange, onNavigate, onRefresh }: Props) {
  const sorted = useMemo(() => [...orders].sort((a, b) => {
    const aTime = a.createdAt ? (a.createdAt instanceof Date ? a.createdAt.getTime() : new Date(String(a.createdAt)).getTime()) : 0;
    const bTime = b.createdAt ? (b.createdAt instanceof Date ? b.createdAt.getTime() : new Date(String(b.createdAt)).getTime()) : 0;
    return aTime - bTime;
  }), [orders]);
  const active = sorted.filter(o => ["pending", "confirmed", "preparing", "ready"].includes(o.status));
  const pending = sorted.filter(o => o.status === "pending").length;
  const preparing = sorted.filter(o => o.status === "preparing").length;
  const ready = sorted.filter(o => o.status === "ready").length;
  return <div className="pb-kitchen">
    <section className="pb-kitchen-intro">
      <div><div className="pb-owner-eyebrow">SERVICE FLOOR <span>/</span> ORDER QUEUE</div><h2>Keep the kitchen moving.</h2><p>New and active orders, arranged by the next action they need.</p></div>
      <div className="pb-kitchen-intro-actions"><span className="pb-kitchen-refresh-note"><RefreshCw size={13} /> Auto-refreshes every 30 seconds</span><button type="button" className="pb-kitchen-refresh" onClick={onRefresh}><RefreshCw size={15} /> Refresh</button></div>
    </section>
    <section className="pb-kitchen-metrics" aria-label="Order queue summary">
      <div className="pb-kitchen-metric"><span className="pb-kitchen-metric-icon"><ShoppingBag size={17} /></span><div><strong>{active.length}</strong><span>Active orders</span></div></div>
      <div className="pb-kitchen-metric"><span className="pb-kitchen-metric-icon"><Clock3 size={17} /></span><div><strong>{pending}</strong><span>Need attention</span></div></div>
      <div className="pb-kitchen-metric"><span className="pb-kitchen-metric-icon"><Timer size={17} /></span><div><strong>{preparing}</strong><span>Being prepared</span></div></div>
      <div className="pb-kitchen-metric"><span className="pb-kitchen-metric-icon"><PackageCheck size={17} /></span><div><strong>{ready}</strong><span>Ready to go</span></div></div>
    </section>
    {pendingReviews > 0 && <button type="button" className="pb-kitchen-review-notice" onClick={() => onNavigate("reviews")}><span>{pendingReviews} review{pendingReviews === 1 ? "" : "s"} awaiting moderation</span><span>Review now <ArrowRight size={14} /></span></button>}
    <section className="pb-kitchen-board" aria-label="Orders by status">
      {lanes.map(lane => {
        const laneOrders = sorted.filter(order => order.status === lane.status);
        return <div className="pb-kitchen-lane" key={lane.status}>
          <div className="pb-kitchen-lane-heading"><div><h3>{lane.label}</h3><p>{lane.helper}</p></div><span className="pb-kitchen-lane-count">{laneOrders.length}</span></div>
          <div className="pb-kitchen-lane-list">{isLoading ? <div className="pb-kitchen-empty">Loading orders…</div> : laneOrders.length ? laneOrders.map(order => <OrderCard key={order.id} order={order} onStatusChange={onStatusChange} />) : <div className="pb-kitchen-empty">Nothing in this lane.</div>}</div>
        </div>;
      })}
    </section>
    <footer className="pb-kitchen-footer">
      <div><strong>{sorted.filter(o => o.status === "delivered").length}</strong><span>Completed orders in current list</span></div>
      <div><strong>{sorted.filter(o => o.status === "cancelled").length}</strong><span>Cancelled orders in current list</span></div>
      <button type="button" onClick={() => onNavigate("orders")}>Open full order history <ArrowRight size={15} /></button>
    </footer>
  </div>;
}
