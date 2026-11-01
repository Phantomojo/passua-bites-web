import { useState, type ReactNode } from "react";
import { BarChart3, ClipboardList, LayoutDashboard, LogOut, Megaphone, MessageSquare, MoreHorizontal, Settings, ShoppingBag, Store, Utensils, type LucideIcon } from "lucide-react";

export type OwnerTab = "overview" | "pos" | "orders" | "menu" | "announcements" | "reviews" | "settings" | "analytics" | "sales";
type NavItem = { id: OwnerTab; label: string; shortLabel?: string; icon: LucideIcon };
const primary: NavItem[] = [
  { id: "overview", label: "Kitchen", icon: LayoutDashboard },
  { id: "orders", label: "Orders", icon: ClipboardList },
  { id: "menu", label: "Menu", icon: Utensils },
  { id: "pos", label: "Point of sale", shortLabel: "POS", icon: ShoppingBag },
  { id: "announcements", label: "Promote", icon: Megaphone },
];
const secondary: NavItem[] = [
  { id: "sales", label: "Sales", icon: BarChart3 },
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];
const allItems = [...primary, ...secondary];
type Props = { activeTab: OwnerTab; onNavigate: (tab: OwnerTab) => void; pendingOrders: number; pendingReviews: number; playSound: boolean; onLogout: () => void; children: ReactNode };

function NavButton({ item, active, count, onClick, compact = false }: { item: NavItem; active: boolean; count?: number; onClick: () => void; compact?: boolean }) {
  const Icon = item.icon;
  return <button type="button" className={`pb-owner-nav-button${active ? " is-active" : ""}${compact ? " is-compact" : ""}`} onClick={onClick} aria-current={active ? "page" : undefined} title={compact ? item.label : undefined}>
    <Icon size={18} strokeWidth={1.8} aria-hidden="true" />
    <span className="pb-owner-nav-label">{compact ? item.shortLabel || item.label : item.label}</span>
    {count !== undefined && count > 0 && <span className="pb-owner-nav-count">{count > 99 ? "99+" : count}</span>}
  </button>;
}

export default function OwnerWorkspaceShell({ activeTab, onNavigate, pendingOrders, pendingReviews, playSound, onLogout, children }: Props) {
  const [moreOpen, setMoreOpen] = useState(false);
  const activeItem = allItems.find(item => item.id === activeTab) || primary[0];
  const moreActive = secondary.some(item => item.id === activeTab) || activeTab === "announcements";
  const countFor = (id: OwnerTab) => id === "orders" ? pendingOrders : id === "reviews" ? pendingReviews : undefined;
  const navigate = (tab: OwnerTab) => { onNavigate(tab); setMoreOpen(false); };
  return <div className="pb-owner-shell">
    <aside className="pb-owner-sidebar" aria-label="Owner navigation">
      <a className="pb-owner-brand" href="/" aria-label="Pasua Bites home">
        <span className="pb-owner-brand-mark" aria-hidden="true"><span /></span>
        <span className="pb-owner-brand-copy"><strong>Pasua Bites</strong><small>OWNER OPERATIONS</small></span>
      </a>
      <div className="pb-owner-nav-group"><div className="pb-owner-nav-heading">Service</div>
        {primary.map(item => <NavButton key={item.id} item={item} active={activeTab === item.id} count={countFor(item.id)} onClick={() => navigate(item.id)} />)}
      </div>
      <div className="pb-owner-nav-group"><div className="pb-owner-nav-heading">Business</div>
        {secondary.map(item => <NavButton key={item.id} item={item} active={activeTab === item.id} count={countFor(item.id)} onClick={() => navigate(item.id)} />)}
      </div>
      <div className="pb-owner-sidebar-footer">
        <a href="/" className="pb-owner-store-link"><Store size={17} /> <span>View storefront</span></a>
        <button type="button" className="pb-owner-signout" onClick={onLogout}><LogOut size={17} /> <span>Sign out</span></button>
        <div className="pb-owner-sidebar-note">Pasua Bites · Business workspace</div>
      </div>
    </aside>
    <div className="pb-owner-main">
      <header className="pb-owner-topbar">
        <div className="pb-owner-topbar-title"><div className="pb-owner-eyebrow">PASUA BITES <span>/</span> OPERATIONS</div><h1>{activeItem.label}</h1></div>
        <div className="pb-owner-topbar-actions">
          {playSound && <span className="pb-owner-new-order" role="status"><span className="pb-owner-live-dot" /> New order received</span>}
          <a href="/" className="pb-owner-topbar-link"><Store size={16} /><span>Storefront</span></a>
          <button type="button" className="pb-owner-topbar-logout" onClick={onLogout}><LogOut size={16} /><span>Sign out</span></button>
        </div>
      </header>
      <main className="pb-owner-content">{children}</main>
    </div>
    <nav className="pb-owner-mobile-nav" aria-label="Primary navigation">
      {primary.slice(0, 4).map(item => <NavButton key={item.id} item={item} compact active={activeTab === item.id} count={countFor(item.id)} onClick={() => navigate(item.id)} />)}
      <button type="button" className={`pb-owner-nav-button is-compact${moreActive ? " is-active" : ""}`} onClick={() => setMoreOpen(open => !open)} aria-expanded={moreOpen} aria-label="More sections"><MoreHorizontal size={19} /><span className="pb-owner-nav-label">More</span></button>
    </nav>
    {moreOpen && <div className="pb-owner-more-panel" role="dialog" aria-label="More owner sections">
      <div className="pb-owner-more-heading">More workspace sections</div>
      {[primary[4], ...secondary].map(item => <NavButton key={item.id} item={item} active={activeTab === item.id} count={countFor(item.id)} onClick={() => navigate(item.id)} />)}
      <button type="button" className="pb-owner-more-close" onClick={() => setMoreOpen(false)}>Close</button>
    </div>}
  </div>;
}
