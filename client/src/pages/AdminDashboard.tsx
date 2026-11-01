import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import AnalyticsTab from "@/components/AnalyticsTab";
import OwnerInstallGuide from "@/components/OwnerInstallGuide";
import OwnerWorkspaceShell, { type OwnerTab } from "@/components/OwnerWorkspaceShell";
import OwnerKitchenBoard from "@/components/OwnerKitchenBoard";
import { usePageMeta } from "@/hooks/usePageMeta";

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--pb-ivory3)",
  confirmed: "#60a5fa",
  preparing: "var(--pb-ember2)",
  ready: "#4ade80",
  delivered: "#a78bfa",
  cancelled: "#f87171",
};

type Tab = OwnerTab;

export default function AdminDashboard() {
  usePageMeta({ title: "Admin Dashboard — Passua Bites", description: "Passua Bites admin dashboard — manage orders, menu, reviews, and analytics." });
  const [token, setToken] = useState<string | null>(() =>
    typeof window !== "undefined" ? localStorage.getItem("pb_admin_token") : null
  );
  const [password, setPassword] = useState("");
  const [installGuideComplete, setInstallGuideComplete] = useState(() => {
    try { return localStorage.getItem("pb_owner_install_guide_v1") === "1"; } catch { return false; }
  });

  useEffect(() => {
    const manifest = document.createElement("link");
    manifest.rel = "manifest";
    manifest.href = "/manifest.json";
    document.head.appendChild(manifest);
    const robots = document.createElement("meta");
    robots.name = "robots";
    robots.content = "noindex, nofollow, noarchive";
    document.head.appendChild(robots);
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js", { scope: "/admin" }).catch(() => {});
    }
    return () => { manifest.remove(); robots.remove(); };
  }, []);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [prevOrderCount, setPrevOrderCount] = useState(0);
  const [playSound, setPlaySound] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);
const [orderStatusFilter, setOrderStatusFilter] = useState<string>("");

  // POS state
  const [posCart, setPosCart] = useState<Record<number, number>>({});
  const [posCustomerName, setPosCustomerName] = useState("");
  const [posCustomerPhone, setPosCustomerPhone] = useState("");
  const [posPaymentMethod, setPosPaymentMethod] = useState<"cash" | "mpesa">("cash");
  const [posNotes, setPosNotes] = useState("");
  const [posProcessing, setPosProcessing] = useState(false);
  const [posReceipt, setPosReceipt] = useState<number | null>(null);

  // Announcement form
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: "",
    body: "",
    type: "info" as "info" | "offer" | "alert",
  });

  const login = trpc.admin.login.useMutation();
  const stats = trpc.orders.getStats.useQuery(undefined, {
    enabled: !!token,
    refetchInterval: 60000,
  });
  const orders = trpc.orders.listAll.useQuery(
    orderStatusFilter ? { status: orderStatusFilter as any, limit: 100 } : { limit: 100 },
    { enabled: !!token, refetchInterval: 30000 }
  );
  const menuItems = trpc.menu.list.useQuery(undefined, { enabled: !!token });
  const updateOrderStatus = trpc.orders.updateStatus.useMutation();
  const createMenuItem = trpc.menu.create.useMutation();
  const updateMenuItem = trpc.menu.update.useMutation();
  const deleteMenuItem = trpc.menu.delete.useMutation();
  const toggleAvailability = trpc.menu.toggleAvailability.useMutation();
  const toggleFeatured = trpc.menu.toggleFeatured.useMutation();
  const uploadImage = trpc.upload.image.useMutation();
const createWalkIn = trpc.orders.createWalkIn.useMutation();
const salesSummary = trpc.orders.getSalesSummary.useQuery(undefined, {
  enabled: !!token,
});
const announcementsList = trpc.announcements.listAll.useQuery(undefined, {
  enabled: !!token,
});
const createAnnouncement = trpc.announcements.create.useMutation();
const toggleAnnouncement = trpc.announcements.toggle.useMutation();
const deleteAnnouncement = trpc.announcements.delete.useMutation();
  const updateLocation = trpc.location.update.useMutation();

  const { data: currentLocation, refetch: refetchLocation } =
    trpc.location.get.useQuery(undefined, { enabled: !!token });
  const { data: allSettings } = trpc.location.getAll.useQuery(undefined, {
    enabled: !!token,
  });

  // Fetch pending reviews (same-origin)
  useEffect(() => {
    if (!token) return;
    fetch(`/api/trpc/reviews.listPending`)
      .then(r => r.json())
      .then(d => setPendingReviews(d.result?.data?.json || []))
      .catch(() => {});
  }, [token, activeTab]);

  const handleReviewAction = async (id: number, approved: boolean) => {
    try {
      await fetch(`/api/trpc/reviews.moderate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { id, approved } }),
      });
      toast.success(approved ? "Review approved" : "Review rejected");
      setPendingReviews(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to moderate");
    }
  };

  const handleDeleteReview = async (id: number) => {
    if (!confirm("Delete this review?")) return;
    try {
      await fetch(`/api/trpc/reviews.delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ json: { id } }),
      });
      toast.success("Review deleted");
      setPendingReviews(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  // Sound notification for new orders
  useEffect(() => {
    if (!orders.data || prevOrderCount === 0) {
      if (orders.data) setPrevOrderCount(orders.data.length);
      return;
    }
    if (orders.data.length > prevOrderCount) {
      // Play notification sound
      const audio = new Audio(
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkpGKgHRpaGx2g42UlI2BesJYZ3J9iZGTjoh+dG5uc3qEi5OTjIF1amhsdoGMlJOMgHRnaW14g46Vk4x/c2dmbnqFj5aUjYF0ZmdueIOOlZSMfnNmZm56hY+WlI2BdGZnbniDjpWUjH5zZmZueoWPlpSNgXRmZ254g46VlIx+c2dmbnqFj5aUjYF0ZmdueIOOlZSMfnNmZm56hY+WlI2BdA=="
      );
      audio.volume = 0.5;
      audio.play().catch(() => {});
      setPlaySound(true);
      setTimeout(() => setPlaySound(false), 3000);
    }
    setPrevOrderCount(orders.data.length);
  }, [orders.data?.length]);

  // New menu item form
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: "",
    price: "",
    category: "Main",
    description: "",
    imageUrl: "",
    videoUrl: "",
  });

  // Edit menu item form
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editItem, setEditItem] = useState({
    name: "",
    price: "",
    category: "",
    description: "",
    imageUrl: "",
    videoUrl: "",
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoggingIn(true);
    try {
      const result = await login.mutateAsync({ password });
      setToken(result.token);
      localStorage.setItem("pb_admin_token", result.token);
      toast.success("Logged in successfully");
    } catch (err: any) {
      toast.error(err.message || "Invalid password");
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem("pb_admin_token");
    toast.info("Logged out");
  };

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await updateOrderStatus.mutateAsync({
        id: orderId,
        status: status as any,
      });
      toast.success(`Order #${orderId} updated to ${status}`);
      orders.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update order");
    }
  };

  const handleAddMenuItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItem.name || !newItem.price) return;
    try {
      await createMenuItem.mutateAsync({
        name: newItem.name,
        price: parseFloat(newItem.price),
        category: newItem.category,
        description: newItem.description || undefined,
        imageUrl: newItem.imageUrl || undefined,
        videoUrl: newItem.videoUrl || undefined,
        available: true,
      });
      toast.success("Menu item added");
      setNewItem({
        name: "",
        price: "",
        category: "Main",
        description: "",
        imageUrl: "",
        videoUrl: "",
      });
      setShowAddItem(false);
      menuItems.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to add item");
    }
  };

  const handleToggleAvailability = async (id: number, available: boolean) => {
    try {
      await toggleAvailability.mutateAsync({ id, available });
      toast.success(available ? "Item now available" : "Item hidden");
      menuItems.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleToggleFeatured = async (id: number, featured: boolean) => {
    try {
      await toggleFeatured.mutateAsync({ id, featured });
      toast.success(featured ? "Marked as today's special" : "Removed from specials");
      menuItems.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to update");
    }
  };

  const handleDeleteMenuItem = async (id: number) => {
    if (!confirm("Delete this menu item?")) return;
    try {
      await deleteMenuItem.mutateAsync({ id });
      toast.success("Menu item deleted");
      menuItems.refetch();
    } catch (err: any) {
      toast.error(err.message || "Failed to delete");
    }
  };

  // Login screen
  if (!token) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "var(--pb-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            maxWidth: 400,
            width: "100%",
            padding: "2.5rem",
            background: "var(--pb-bg2)",
            border: "1px solid var(--pb-rule)",
            borderLeft: "3px solid var(--pb-ember)",
          }}
        >
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: "0.62rem",
              letterSpacing: "0.18em",
              color: "var(--pb-ember)",
              textTransform: "uppercase",
              marginBottom: "0.75rem",
            }}
          >
            Admin Access
          </div>
          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.8rem",
              fontWeight: 900,
              marginBottom: "1.5rem",
            }}
          >
            Passua Bites
          </h1>
          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
          >
            <div>
              <label
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.15em",
                  color: "var(--pb-ember)",
                  textTransform: "uppercase",
                  marginBottom: "0.4rem",
                  display: "block",
                }}
              >
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter admin password"
                required
                style={{
                  width: "100%",
                  padding: "0.65rem 0.8rem",
                  fontFamily: "'DM Sans',sans-serif",
                  fontSize: "0.85rem",
                }}
              />
            </div>
            <button
              type="submit"
              disabled={isLoggingIn}
              className="pb-btn-primary"
              style={{
                width: "100%",
                padding: "0.75rem",
                cursor: isLoggingIn ? "not-allowed" : "pointer",
                opacity: isLoggingIn ? 0.6 : 1,
              }}
            >
              {isLoggingIn ? "Logging in..." : "Login"}
            </button>
          </form>
          <div style={{ marginTop: "1.5rem", textAlign: "center" }}>
            <Link
              href="/"
              style={{
                fontSize: "0.78rem",
                color: "var(--pb-ivory3)",
                textDecoration: "none",
              }}
            >
              ← Back to site
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!installGuideComplete) {
    return <OwnerInstallGuide onContinue={() => {
      try { localStorage.setItem("pb_owner_install_guide_v1", "1"); } catch {}
      setInstallGuideComplete(true);
    }} />;
  }

  // Dashboard
  const orderList = orders.data || [];
  const menuList = menuItems.data || [];
  const statsData = stats.data || {
    totalOrders: 0,
    pendingOrders: 0,
    todayRevenue: 0,
    totalRevenue: 0,
  };

  return (
    <OwnerWorkspaceShell
      activeTab={activeTab}
      onNavigate={setActiveTab}
      pendingOrders={orderList.filter((order: any) => order.status === "pending").length}
      pendingReviews={pendingReviews.length}
      playSound={playSound}
      onLogout={handleLogout}
    >
      <div className="pb-owner-content-inner">
        {/* ===== KITCHEN / OVERVIEW ===== */}
        {activeTab === "overview" && (
          <OwnerKitchenBoard
            orders={orderList}
            isLoading={orders.isLoading}
            pendingReviews={pendingReviews.length}
            onStatusChange={handleStatusChange}
            onNavigate={setActiveTab}
            onRefresh={() => {
              orders.refetch();
              stats.refetch();
            }}
          />
        )}

        {/* ===== ORDERS ===== */}
        {activeTab === "orders" && (
          <div>
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.62rem",
                letterSpacing: "0.15em",
                color: "var(--pb-ember)",
                textTransform: "uppercase",
                marginBottom: "1.2rem",
              }}
            >
              All orders ({orderList.length})
                        </div>
                        <select
                          value={orderStatusFilter}
                          onChange={e => setOrderStatusFilter(e.target.value)}
                          style={{ padding: "0.4rem 0.6rem", marginBottom: "1rem", marginLeft: "1rem" }}
                        >
                          <option value="">All statuses</option>
                          {["pending","confirmed","preparing","ready","delivered","cancelled"].map(s => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
            <div
              style={{
                background: "var(--pb-bg2)",
                border: "1px solid var(--pb-rule)",
                overflowX: "auto",
              }}
            >
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  minWidth: 700,
                }}
              >
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--pb-rule)" }}>
                    {[
                      "Order",
                      "Customer",
                      "Phone",
                      "Amount",
                      "M-Pesa",
                      "Payment",
                      "Action",
                      "Date",
                      "",
                    ].map(h => (
                      <th
                        key={h}
                        style={{
                          padding: "0.85rem 1rem",
                          textAlign: "left",
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "0.58rem",
                          letterSpacing: "0.12em",
                          textTransform: "uppercase",
                          color: "var(--pb-ember)",
                          fontWeight: 500,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {orderList.map((o: any) => (
                    <tr
                      key={o.id}
                      style={{ borderBottom: "1px solid var(--pb-rule2)" }}
                    >
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "0.72rem",
                          color: "var(--pb-ivory)",
                        }}
                      >
#{o.id}
                        {o.channel === "pos" && (
                          <span style={{ marginLeft: "0.4rem", fontFamily: "'DM Mono',monospace", fontSize: "0.55rem", color: "var(--pb-ember)" }}>POS</span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontSize: "0.85rem",
                          color: "var(--pb-ivory2)",
                        }}
                      >
                        {o.customerName}
                      </td>
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "0.72rem",
                          color: "var(--pb-ivory3)",
                        }}
                      >
                        {o.customerPhone}
                      </td>
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontFamily: "'Playfair Display',serif",
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "var(--pb-ember)",
                        }}
                      >
                        Ksh {Number(o.totalPrice)}
                      </td>
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "0.65rem",
                          color: o.notes
                            ? "var(--pb-ember)"
                            : "var(--pb-ivory3)",
                        }}
                      >
                        {o.notes ? o.notes.replace("M-Pesa Code: ", "") : "—"}
                      </td>
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontSize: "0.72rem",
                          color:
                            o.paymentStatus === "completed"
                              ? "#4ade80"
                              : "var(--pb-ivory3)",
                        }}
                      >
                        {o.paymentStatus}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        {o.status === "pending" && (
                          <button
                            onClick={() =>
                              handleStatusChange(o.id, "confirmed")
                            }
                            className="pb-btn-primary"
                            style={{
                              fontSize: "0.58rem",
                              padding: "0.3rem 0.75rem",
                              minHeight: 32,
                            }}
                          >
                            ✓ Confirm Payment
                          </button>
                        )}
                        {o.status === "confirmed" && (
                          <button
                            onClick={() =>
                              handleStatusChange(o.id, "preparing")
                            }
                            className="pb-btn-primary"
                            style={{
                              fontSize: "0.58rem",
                              padding: "0.3rem 0.75rem",
                              minHeight: 32,
                            }}
                          >
                            🔥 Start Cooking
                          </button>
                        )}
                        {o.status === "preparing" && (
                          <button
                            onClick={() => handleStatusChange(o.id, "ready")}
                            className="pb-btn-primary"
                            style={{
                              fontSize: "0.58rem",
                              padding: "0.3rem 0.75rem",
                              minHeight: 32,
                            }}
                          >
                            ✓ Mark Ready
                          </button>
                        )}
                        {o.status === "ready" && (
                          <button
                            onClick={() =>
                              handleStatusChange(o.id, "delivered")
                            }
                            className="pb-btn-primary"
                            style={{
                              fontSize: "0.58rem",
                              padding: "0.3rem 0.75rem",
                              minHeight: 32,
                            }}
                          >
                            🚚 Mark Delivered
                          </button>
                        )}
                        {["delivered", "cancelled"].includes(o.status) && (
                          <span
                            style={{
                              fontFamily: "'DM Mono',monospace",
                              fontSize: "0.58rem",
                              color: "var(--pb-ivory3)",
                            }}
                          >
                            {o.status === "delivered"
                              ? "✓ Completed"
                              : "✗ Cancelled"}
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          padding: "0.85rem 1rem",
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "0.65rem",
                          color: "var(--pb-ivory3)",
                        }}
                      >
                        {new Date(o.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "0.85rem 1rem" }}>
                        <a
                          href={`https://wa.me/254${o.customerPhone?.startsWith("0") ? o.customerPhone.slice(1) : (o.customerPhone ?? "")}?text=${encodeURIComponent(`Hi ${o.customerName}! Your Passua Bites order #${o.id} is ${o.status}.`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{
                            fontSize: "0.7rem",
                            color: "#25D366",
                            textDecoration: "none",
                          }}
                        >
                          💬
                        </a>
                      </td>
                    </tr>
                  ))}
                  {orderList.length === 0 && (
                    <tr>
                      <td
                        colSpan={9}
                        style={{
                          padding: "2rem",
                          textAlign: "center",
                          color: "var(--pb-ivory3)",
                        }}
                      >
                        No orders yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===== MENU ===== */}
        {activeTab === "menu" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.5rem",
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  color: "var(--pb-ember)",
                  textTransform: "uppercase",
                }}
              >
                Menu items ({menuList.length})
              </div>
              <button
                onClick={() => setShowAddItem(!showAddItem)}
                className="pb-btn-primary"
                style={{
                  fontSize: "0.65rem",
                  padding: "0.5rem 1.2rem",
                  cursor: "pointer",
                  minHeight: 44,
                }}
              >
                + Add item
              </button>
            </div>

            {showAddItem && (
              <div
                style={{
                  background: "var(--pb-bg2)",
                  border: "1px solid var(--pb-rule)",
                  borderLeft: "3px solid var(--pb-ember)",
                  padding: "1.5rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "0.6rem",
                    letterSpacing: "0.15em",
                    color: "var(--pb-ember)",
                    textTransform: "uppercase",
                    marginBottom: "1rem",
                  }}
                >
                  New menu item
                </div>
                <form
                  onSubmit={handleAddMenuItem}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))",
                    gap: "1rem",
                  }}
                >
                  <div>
                    <label
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.6rem",
                        letterSpacing: "0.15em",
                        color: "var(--pb-ember)",
                        textTransform: "uppercase",
                        marginBottom: "0.4rem",
                        display: "block",
                      }}
                    >
                      Name *
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={e =>
                        setNewItem(p => ({ ...p, name: e.target.value }))
                      }
                      placeholder="e.g. Smokies"
                      required
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: "0.82rem",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.6rem",
                        letterSpacing: "0.15em",
                        color: "var(--pb-ember)",
                        textTransform: "uppercase",
                        marginBottom: "0.4rem",
                        display: "block",
                      }}
                    >
                      Price (KSH) *
                    </label>
                    <input
                      type="number"
                      value={newItem.price}
                      onChange={e =>
                        setNewItem(p => ({ ...p, price: e.target.value }))
                      }
                      placeholder="70"
                      required
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: "0.82rem",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.6rem",
                        letterSpacing: "0.15em",
                        color: "var(--pb-ember)",
                        textTransform: "uppercase",
                        marginBottom: "0.4rem",
                        display: "block",
                      }}
                    >
                      Category
                    </label>
                    <select
                      value={newItem.category}
                      onChange={e =>
                        setNewItem(p => ({ ...p, category: e.target.value }))
                      }
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: "0.82rem",
                      }}
                    >
                      {["Signature", "Main", "Sides", "Drinks"].map(c => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.6rem",
                        letterSpacing: "0.15em",
                        color: "var(--pb-ember)",
                        textTransform: "uppercase",
                        marginBottom: "0.4rem",
                        display: "block",
                      }}
                    >
                      Image URL
                    </label>
                    <input
                      type="text"
                      value={newItem.imageUrl}
                      onChange={e =>
                        setNewItem(p => ({ ...p, imageUrl: e.target.value }))
                      }
                      placeholder="/media/images/burger.jpg or https://..."
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: "0.82rem",
                      }}
                    />
                    <div style={{ marginTop: "0.4rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
                      <label
                        className="pb-btn-ghost"
                        style={{
                          fontSize: "0.6rem",
                          padding: "0.35rem 0.75rem",
                          cursor: "pointer",
                          minHeight: 32,
                          display: "inline-block",
                        }}
                      >
                        {uploadImage.isPending ? "Uploading..." : "📤 Upload image"}
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const reader = new FileReader();
                            reader.onload = async () => {
                              const base64 = (reader.result as string).split(",")[1];
                              try {
                                const res = await uploadImage.mutateAsync({
                                  filename: file.name,
                                  data: base64,
                                  contentType: file.type,
                                });
                                setNewItem(p => ({ ...p, imageUrl: res.url }));
                                toast.success("Image uploaded");
                              } catch (err: any) {
                                toast.error(err.message || "Upload failed");
                              }
                            };
                            reader.readAsDataURL(file);
                            e.target.value = "";
                          }}
                        />
                      </label>
                      {newItem.imageUrl && (
                        <img
                          src={newItem.imageUrl}
                          alt="preview"
                          style={{ width: 40, height: 40, objectFit: "cover", border: "1px solid var(--pb-rule)" }}
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.6rem",
                        letterSpacing: "0.15em",
                        color: "var(--pb-ember)",
                        textTransform: "uppercase",
                        marginBottom: "0.4rem",
                        display: "block",
                      }}
                    >
                      Video URL
                    </label>
                    <input
                      type="text"
                      value={newItem.videoUrl}
                      onChange={e =>
                        setNewItem(p => ({ ...p, videoUrl: e.target.value }))
                      }
                      placeholder="/media/videos/Sultan.mp4 or https://..."
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: "0.82rem",
                      }}
                    />
                  </div>
                  <div style={{ gridColumn: "1/-1" }}>
                    <label
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.6rem",
                        letterSpacing: "0.15em",
                        color: "var(--pb-ember)",
                        textTransform: "uppercase",
                        marginBottom: "0.4rem",
                        display: "block",
                      }}
                    >
                      Description
                    </label>
                    <input
                      type="text"
                      value={newItem.description}
                      onChange={e =>
                        setNewItem(p => ({ ...p, description: e.target.value }))
                      }
                      placeholder="Brief description"
                      style={{
                        width: "100%",
                        padding: "0.6rem 0.75rem",
                        fontFamily: "'DM Sans',sans-serif",
                        fontSize: "0.82rem",
                      }}
                    />
                  </div>
                  <div
                    style={{
                      gridColumn: "1/-1",
                      display: "flex",
                      gap: "0.75rem",
                    }}
                  >
                    <button
                      type="submit"
                      className="pb-btn-primary"
                      style={{
                        padding: "0.6rem 1.5rem",
                        cursor: "pointer",
                        minHeight: 44,
                      }}
                    >
                      Add Item
                    </button>
                    <button
                      type="button"
                      className="pb-btn-ghost"
                      onClick={() => setShowAddItem(false)}
                      style={{
                        padding: "0.6rem 1.5rem",
                        cursor: "pointer",
                        minHeight: 44,
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div
              className="pb-menu-grid-mobile"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                gap: "1px",
                background: "var(--pb-rule2)",
              }}
            >
              {menuList.map((item: any) => (
                <div
                  key={item.id}
                  style={{
                    background: "var(--pb-bg2)",
                    padding: "1.25rem",
                    opacity: item.available ? 1 : 0.5,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.75rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontFamily: "'Playfair Display',serif",
                          fontSize: "1.1rem",
                          fontWeight: 700,
                          color: "var(--pb-ivory)",
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "0.58rem",
                          color: "var(--pb-ember)",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          marginTop: "0.2rem",
                        }}
                      >
                        {item.category}
                      </div>
                      {item.description && (
                        <div
                          style={{
                            fontSize: "0.72rem",
                            color: "var(--pb-ivory3)",
                            marginTop: "0.3rem",
                            lineHeight: 1.4,
                          }}
                        >
                          {item.description}
                        </div>
                      )}
                    </div>
                    <span
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: "1.2rem",
                        fontWeight: 700,
                        color: "var(--pb-ember)",
                      }}
                    >
                      Ksh {Number(item.price)}
                    </span>
                  </div>
                  <div
                    style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}
                  >
                    <button
                      onClick={() =>
                        handleToggleAvailability(item.id, !item.available)
                      }
                      style={{
                        flex: 1,
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.58rem",
                        letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        padding: "0.4rem",
                        cursor: "pointer",
                        border: "1px solid",
                        background: "transparent",
                        color: item.available ? "#4ade80" : "var(--pb-ivory3)",
                        borderColor: item.available
                          ? "rgba(74,222,128,0.4)"
                          : "var(--pb-rule)",
                        minHeight: 36,
                      }}
                    >
                      {item.available ? "✓ Available" : "✗ Hidden"}
                    </button>
                    <button
                      onClick={() =>
                        handleToggleFeatured(item.id, !(item.featured === 1 || item.featured === true))
                      }
                      style={{
                        padding: "0.4rem 0.6rem",
                        border: "1px solid",
                        background: "transparent",
                        color: item.featured ? "var(--pb-ember)" : "var(--pb-ivory3)",
                        borderColor: item.featured
                          ? "var(--pb-ember)"
                          : "var(--pb-rule)",
                        cursor: "pointer",
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.62rem",
                        minHeight: 36,
                      }}
                    >
                      {item.featured ? "★ Special" : "☆ Special"}
                    </button>
                    <button
                      onClick={() => handleDeleteMenuItem(item.id)}
                      style={{
                        padding: "0.4rem 0.6rem",
                        border: "1px solid rgba(248,113,113,0.3)",
                        background: "transparent",
                        color: "#f87171",
                        cursor: "pointer",
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.62rem",
                        minHeight: 36,
                      }}
                    >
                      Del
                    </button>
                  </div>
                </div>
              ))}
              {menuList.length === 0 && (
                <div
                  style={{
                    background: "var(--pb-bg2)",
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--pb-ivory3)",
                    gridColumn: "1/-1",
                  }}
                >
                  No menu items yet. Click "+ Add item" to get started.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== REVIEWS ===== */}
        {activeTab === "reviews" && (
          <div>
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.62rem",
                letterSpacing: "0.15em",
                color: "var(--pb-ember)",
                textTransform: "uppercase",
                marginBottom: "1.2rem",
              }}
            >
              Pending reviews ({pendingReviews.length})
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1px",
                background: "var(--pb-rule2)",
              }}
            >
              {pendingReviews.map((r: any) => (
                <div
                  key={r.id}
                  style={{ background: "var(--pb-bg2)", padding: "1.25rem" }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.75rem",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.88rem",
                          color: "var(--pb-ivory)",
                          fontWeight: 500,
                        }}
                      >
                        {r.customerName}
                      </div>
                      <div
                        style={{
                          color: "var(--pb-ember)",
                          fontSize: "0.85rem",
                        }}
                      >
                        {"★".repeat(r.rating ?? 0)}
                        {"☆".repeat(5 - r.rating)}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.6rem",
                        color: "var(--pb-ivory3)",
                      }}
                    >
                      {new Date(r.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  {r.reviewText && (
                    <div
                      style={{
                        fontSize: "0.82rem",
                        color: "var(--pb-ivory2)",
                        lineHeight: 1.6,
                        marginBottom: "0.75rem",
                        fontStyle: "italic",
                      }}
                    >
                      "{r.reviewText}"
                    </div>
                  )}
                  <div style={{ display: "flex", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleReviewAction(r.id, true)}
                      className="pb-btn-primary"
                      style={{
                        fontSize: "0.6rem",
                        padding: "0.4rem 1rem",
                        cursor: "pointer",
                        minHeight: 36,
                      }}
                    >
                      ✓ Approve
                    </button>
                    <button
                      onClick={() => handleReviewAction(r.id, false)}
                      className="pb-btn-ghost"
                      style={{
                        fontSize: "0.6rem",
                        padding: "0.4rem 1rem",
                        cursor: "pointer",
                        minHeight: 36,
                      }}
                    >
                      ✗ Reject
                    </button>
                    <button
                      onClick={() => handleDeleteReview(r.id)}
                      style={{
                        fontSize: "0.6rem",
                        padding: "0.4rem 1rem",
                        cursor: "pointer",
                        border: "1px solid rgba(248,113,113,0.3)",
                        background: "transparent",
                        color: "#f87171",
                        fontFamily: "'DM Mono',monospace",
                        textTransform: "uppercase",
                        letterSpacing: "0.08em",
                        minHeight: 36,
                      }}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
              {pendingReviews.length === 0 && (
                <div
                  style={{
                    background: "var(--pb-bg2)",
                    padding: "2rem",
                    textAlign: "center",
                    color: "var(--pb-ivory3)",
                  }}
                >
                  No pending reviews
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ===== SETTINGS ===== */}
      {activeTab === "settings" && (
        <div>
          <div
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: "0.62rem",
              letterSpacing: "0.15em",
              color: "var(--pb-ember)",
              textTransform: "uppercase",
              marginBottom: "1.5rem",
            }}
          >
            Site Settings
          </div>

          {/* Displacement Message */}
          <div
            style={{
              background: "var(--pb-bg2)",
              padding: "1.5rem",
              marginBottom: "1rem",
            }}
          >
            <div
              style={{
                fontSize: "0.85rem",
                color: "var(--pb-ivory)",
                marginBottom: "0.75rem",
                fontWeight: 500,
              }}
            >
              Displacement Alert Message
            </div>
            <textarea
              key={currentLocation || "empty"}
              defaultValue={currentLocation || ""}
              id="displacementMessage"
              style={{
                width: "100%",
                minHeight: "100px",
                background: "var(--pb-bg)",
                border: "1px solid var(--pb-rule)",
                color: "var(--pb-ivory)",
                padding: "0.75rem",
                fontFamily: "'DM Sans',sans-serif",
                fontSize: "0.85rem",
                resize: "vertical",
              }}
            />
            <button
              onClick={async () => {
                const msg = (
                  document.getElementById(
                    "displacementMessage"
                  ) as HTMLTextAreaElement
                )?.value;
                if (!msg) return;
                try {
                  await updateLocation.mutateAsync({ message: msg });
                  toast.success("Message updated");
                  refetchLocation();
                } catch (err: any) {
                  toast.error(err.message || "Failed to update");
                }
              }}
              disabled={updateLocation.isPending}
              style={{
                marginTop: "0.75rem",
                padding: "0.6rem 1.2rem",
                background: "var(--pb-ember)",
                color: "var(--pb-bg)",
                border: "none",
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.65rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              {updateLocation.isPending ? "Saving..." : "Save Message"}
            </button>
          </div>

          {/* Other settings from allSettings */}
          {allSettings && allSettings.length > 0 && (
            <div style={{ background: "var(--pb-bg2)", padding: "1.5rem" }}>
              <div
                style={{
                  fontSize: "0.85rem",
                  color: "var(--pb-ivory)",
                  marginBottom: "1rem",
                  fontWeight: 500,
                }}
              >
                All Settings
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                }}
              >
                {allSettings.map((s: any) => (
                  <div
                    key={s.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "0.5rem",
                      background: "var(--pb-bg)",
                      border: "1px solid var(--pb-rule2)",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.62rem",
                        color: "var(--pb-ember)",
                        textTransform: "uppercase",
                      }}
                    >
                      {s.key}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--pb-ivory3)",
                        maxWidth: "60%",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {s.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== ANALYTICS ===== */}
      {activeTab === "analytics" && (
        <div style={{ paddingTop: "1rem" }}>
          <AnalyticsTab />
        </div>
      )}

      {/* ===== POS ===== */}
      {activeTab === "pos" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.62rem", letterSpacing: "0.15em", color: "var(--pb-ember)", textTransform: "uppercase" }}>
            Point of Sale — Walk-in order
          </div>
          {posReceipt && (
            <div style={{ background: "rgba(74,222,128,0.08)", border: "1px solid rgba(74,222,128,0.3)", padding: "1rem" }}>
              Order PB-{posReceipt} created.{" "}
              <button onClick={() => setPosReceipt(null)} style={{ color: "var(--pb-ember)", background: "none", border: "none", cursor: "pointer" }}>New order</button>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "1.5rem" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: "0.5rem" }}>
              {menuList.filter((m: any) => m.available).map((item: any) => (
                <div key={item.id} style={{ background: "var(--pb-bg2)", border: "1px solid var(--pb-rule)", padding: "0.75rem" }}>
                  <div style={{ fontSize: "0.85rem", color: "var(--pb-ivory)", marginBottom: "0.25rem" }}>{item.name}</div>
                  <div style={{ fontFamily: "Playfair Display,serif", color: "var(--pb-ember)", marginBottom: "0.5rem" }}>Ksh {Number(item.price)}</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button onClick={() => setPosCart(p => ({ ...p, [item.id]: Math.max(0, (p[item.id] || 0) - 1) }))} style={{ width: 28, height: 28, cursor: "pointer" }}>-</button>
                    <span style={{ minWidth: 24, textAlign: "center" }}>{posCart[item.id] || 0}</span>
                    <button onClick={() => setPosCart(p => ({ ...p, [item.id]: (p[item.id] || 0) + 1 }))} style={{ width: 28, height: 28, cursor: "pointer" }}>+</button>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ background: "var(--pb-bg2)", border: "1px solid var(--pb-rule)", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <div style={{ fontWeight: 600, color: "var(--pb-ivory)" }}>Cart</div>
              {Object.entries(posCart).filter(([, q]) => (q as number) > 0).length === 0 && (
                <div style={{ color: "var(--pb-ivory3)", fontSize: "0.8rem" }}>No items selected</div>
              )}
              {Object.entries(posCart).filter(([, q]) => (q as number) > 0).map(([id, q]) => {
                const item = menuList.find((m: any) => m.id === Number(id));
                return (
                  <div key={id} style={{ display: "flex", justifyContent: "space-between", fontSize: "0.82rem" }}>
                    <span>{item?.name} x{q}</span>
                    <span>Ksh {Number(item?.price || 0) * (q as number)}</span>
                  </div>
                );
              })}
              <input placeholder="Customer name" value={posCustomerName} onChange={e => setPosCustomerName(e.target.value)} style={{ padding: "0.5rem" }} />
              <input placeholder="Phone (07...)" value={posCustomerPhone} onChange={e => setPosCustomerPhone(e.target.value)} style={{ padding: "0.5rem" }} />
              <select value={posPaymentMethod} onChange={e => setPosPaymentMethod(e.target.value as any)} style={{ padding: "0.5rem" }}>
                <option value="cash">Cash</option>
                <option value="mpesa">M-Pesa</option>
              </select>
              <textarea placeholder="Notes (optional)" value={posNotes} onChange={e => setPosNotes(e.target.value)} style={{ padding: "0.5rem", minHeight: 60 }} />
              <button
                disabled={posProcessing || Object.values(posCart).every(v => v === 0) || !posCustomerName || !posCustomerPhone}
                onClick={async () => {
                  setPosProcessing(true);
                  try {
                    const items = Object.entries(posCart)
                      .filter(([, q]) => (q as number) > 0)
                      .map(([id, q]) => ({ menuItemId: Number(id), quantity: q as number }));
                    const res = await createWalkIn.mutateAsync({
                      customerName: posCustomerName,
                      customerPhone: posCustomerPhone,
                      items,
                      paymentMethod: posPaymentMethod,
                      notes: posNotes || undefined,
                    });
                    setPosReceipt(res.orderId);
                    setPosCart({});
                    setPosCustomerName("");
                    setPosCustomerPhone("");
                    setPosNotes("");
                    toast.success("Walk-in order created");
                    orders.refetch();
                    salesSummary.refetch();
                  } catch (err: any) {
                    toast.error(err.message || "Failed to create order");
                  } finally {
                    setPosProcessing(false);
                  }
                }}
                className="pb-btn-primary"
                style={{ padding: "0.75rem", cursor: "pointer" }}
              >
                {posProcessing ? "Creating..." : "Place Order"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ANNOUNCEMENTS ===== */}
      {activeTab === "announcements" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.62rem", letterSpacing: "0.15em", color: "var(--pb-ember)", textTransform: "uppercase" }}>
            Announcements & Offers
          </div>
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!newAnnouncement.title) return;
              try {
                await createAnnouncement.mutateAsync(newAnnouncement);
                toast.success("Announcement created");
                setNewAnnouncement({ title: "", body: "", type: "info" });
                announcementsList.refetch();
              } catch (err: any) {
                toast.error(err.message || "Failed");
              }
            }}
            style={{ background: "var(--pb-bg2)", border: "1px solid var(--pb-rule)", padding: "1rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}
          >
            <input placeholder="Title" value={newAnnouncement.title} onChange={e => setNewAnnouncement(p => ({ ...p, title: e.target.value }))} style={{ padding: "0.5rem" }} required />
            <textarea placeholder="Body (optional)" value={newAnnouncement.body} onChange={e => setNewAnnouncement(p => ({ ...p, body: e.target.value }))} style={{ padding: "0.5rem", minHeight: 60 }} />
            <select value={newAnnouncement.type} onChange={e => setNewAnnouncement(p => ({ ...p, type: e.target.value as any }))} style={{ padding: "0.5rem" }}>
              <option value="info">Info</option>
              <option value="offer">Offer</option>
              <option value="alert">Alert</option>
            </select>
            <button type="submit" className="pb-btn-primary" style={{ padding: "0.6rem", cursor: "pointer" }}>Add Announcement</button>
          </form>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            {(announcementsList.data || []).map((a: any) => (
              <div key={a.id} style={{ background: "var(--pb-bg2)", border: "1px solid var(--pb-rule)", padding: "1rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div>
                  <div style={{ color: "var(--pb-ivory)", fontWeight: 600 }}>{a.title}</div>
                  {a.body && <div style={{ color: "var(--pb-ivory3)", fontSize: "0.82rem", marginTop: "0.25rem" }}>{a.body}</div>}
                  <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.6rem", color: "var(--pb-ember)", marginTop: "0.25rem" }}>{a.type} · {a.active ? "active" : "inactive"}</div>
                </div>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button onClick={async () => { await toggleAnnouncement.mutateAsync({ id: a.id, active: !a.active }); announcementsList.refetch(); }} style={{ cursor: "pointer", padding: "0.3rem 0.6rem" }}>
                    {a.active ? "Disable" : "Enable"}
                  </button>
                  <button onClick={async () => { if (!confirm("Delete?")) return; await deleteAnnouncement.mutateAsync({ id: a.id }); announcementsList.refetch(); }} style={{ cursor: "pointer", padding: "0.3rem 0.6rem", color: "#f87171" }}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
            {(announcementsList.data || []).length === 0 && (
              <div style={{ color: "var(--pb-ivory3)", padding: "1rem" }}>No announcements yet.</div>
            )}
          </div>
        </div>
      )}

      {/* ===== SALES ===== */}
      {activeTab === "sales" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.62rem", letterSpacing: "0.15em", color: "var(--pb-ember)", textTransform: "uppercase" }}>
            Sales Summary (completed payments)
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: "1rem" }}>
            {[
              { label: "Today", value: salesSummary.data?.today ?? 0 },
              { label: "Last 7 days", value: salesSummary.data?.week ?? 0 },
              { label: "This month", value: salesSummary.data?.month ?? 0 },
            ].map(s => (
              <div key={s.label} style={{ background: "var(--pb-bg2)", border: "1px solid var(--pb-rule)", padding: "1.25rem" }}>
                <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.6rem", color: "var(--pb-ivory3)", textTransform: "uppercase", marginBottom: "0.5rem" }}>{s.label}</div>
                <div style={{ fontFamily: "Playfair Display,serif", fontSize: "1.8rem", color: "var(--pb-ember)" }}>Ksh {Number(s.value).toLocaleString()}</div>
              </div>
            ))}
          </div>
          <div>
            <div style={{ fontFamily: "DM Mono,monospace", fontSize: "0.62rem", color: "var(--pb-ember)", textTransform: "uppercase", marginBottom: "0.75rem" }}>Top items</div>
            {(salesSummary.data?.topItems || []).map((t: any) => (
              <div key={t.id} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid var(--pb-rule2)" }}>
                <span style={{ color: "var(--pb-ivory)" }}>{t.name}</span>
                <span style={{ fontFamily: "DM Mono,monospace", color: "var(--pb-ivory3)" }}>{t.quantity} sold</span>
              </div>
            ))}
            {(salesSummary.data?.topItems || []).length === 0 && (
              <div style={{ color: "var(--pb-ivory3)" }}>No sales yet.</div>
            )}
          </div>
        </div>
      )}
    </OwnerWorkspaceShell>
  );
}
