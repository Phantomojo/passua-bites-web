import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

const STATUS_COLORS: Record<string, string> = {
  pending: "var(--pb-ivory3)",
  confirmed: "#60a5fa",
  preparing: "var(--pb-ember2)",
  ready: "#4ade80",
  delivered: "#a78bfa",
  cancelled: "#f87171",
};

type Tab = "overview" | "orders" | "menu" | "reviews" | "settings";

export default function AdminDashboard() {
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem("pb_admin_token");
    if (!stored) return null;
    // Check expiry
    const parts = stored.split("_");
    if (parts.length >= 2) {
      const expiresAt = parseInt(parts[1]);
      if (Date.now() > expiresAt) {
        localStorage.removeItem("pb_admin_token");
        return null;
      }
    }
    return stored;
  });
  const [password, setPassword] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [prevOrderCount, setPrevOrderCount] = useState(0);
  const [playSound, setPlaySound] = useState(false);
  const [pendingReviews, setPendingReviews] = useState<any[]>([]);

  const login = trpc.admin.login.useMutation();
  const stats = trpc.orders.getStats.useQuery(undefined, {
    enabled: !!token,
    refetchInterval: 30000,
  });
  const orders = trpc.orders.listAll.useQuery(undefined, {
    enabled: !!token,
    refetchInterval: 15000,
  });
  const menuItems = trpc.menu.list.useQuery(undefined, { enabled: !!token });
  const allMenuItems = trpc.menu.list.useQuery(undefined, { enabled: !!token });
  const updateOrderStatus = trpc.orders.updateStatus.useMutation();
  const createMenuItem = trpc.menu.create.useMutation();
  const updateMenuItem = trpc.menu.update.useMutation();
  const deleteMenuItem = trpc.menu.delete.useMutation();
  const toggleAvailability = trpc.menu.toggleAvailability.useMutation();
  const updateLocation = trpc.location.update.useMutation();

  const { data: currentLocation, refetch: refetchLocation } =
    trpc.location.get.useQuery(undefined, { enabled: !!token });
  const { data: allSettings } = trpc.location.getAll.useQuery(undefined, {
    enabled: !!token,
  });

  // Fetch pending reviews
  useEffect(() => {
    if (!token) return;
    fetch("/api/trpc/reviews.listPending")
      .then(r => r.json())
      .then(d => setPendingReviews(d.result?.data?.json || []))
      .catch(() => {});
  }, [token, activeTab]);

  const handleReviewAction = async (id: number, approved: boolean) => {
    try {
      await fetch("/api/trpc/reviews.moderate", {
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
      await fetch("/api/trpc/reviews.delete", {
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
      const res = await fetch(
        `/api/login?password=${encodeURIComponent(password)}`
      );
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setToken(data.token);
      localStorage.setItem("pb_admin_token", data.token);
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
    <div
      style={{
        minHeight: "100vh",
        background: "var(--pb-bg)",
        fontFamily: "'DM Sans',sans-serif",
      }}
    >
      {/* Admin Nav */}
      <nav
        style={{
          background: "var(--pb-bg2)",
          borderBottom: "1px solid var(--pb-rule)",
          padding: "1rem 2rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "sticky",
          top: 0,
          zIndex: 100,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div
            style={{
              width: 32,
              height: 32,
              background: "var(--pb-ember)",
              clipPath: "polygon(50% 0%,100% 50%,50% 100%,0% 50%)",
              flexShrink: 0,
            }}
          />
          <span
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--pb-ivory)",
            }}
          >
            Admin Dashboard
          </span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {playSound && (
            <span
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.6rem",
                color: "#4ade80",
                animation: "pulse 1s infinite",
              }}
            >
              🔔 New order!
            </span>
          )}
          <Link
            href="/"
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "var(--pb-ivory3)",
              textDecoration: "none",
              padding: "0.4rem 0.75rem",
              border: "1px solid var(--pb-rule)",
            }}
          >
            View Site
          </Link>
          <button
            onClick={handleLogout}
            className="pb-btn-ghost"
            style={{ fontSize: "0.65rem", padding: "0.4rem 0.75rem" }}
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="pb-section-mobile" style={{ padding: "2rem 2.5rem" }}>
        {/* Tabs */}
        <div
          style={{
            display: "flex",
            gap: "0.4rem",
            marginBottom: "2.5rem",
            borderBottom: "1px solid var(--pb-rule)",
            paddingBottom: "1.2rem",
            flexWrap: "wrap",
          }}
        >
          {(["overview", "orders", "menu", "reviews", "settings"] as const).map(
            t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.65rem",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  padding: "0.5rem 1rem",
                  cursor: "pointer",
                  border: "1px solid",
                  background:
                    activeTab === t ? "var(--pb-ember)" : "transparent",
                  color: activeTab === t ? "var(--pb-bg)" : "var(--pb-ivory3)",
                  borderColor:
                    activeTab === t ? "var(--pb-ember)" : "var(--pb-rule)",
                  transition: "all 0.2s",
                  minHeight: 44,
                }}
              >
                {t}
                {t === "orders" &&
                  orderList.filter((o: any) => o.status === "pending").length >
                    0 && (
                    <span
                      style={{
                        marginLeft: "0.4rem",
                        background: "var(--pb-bg)",
                        color: "var(--pb-ember)",
                        borderRadius: "50%",
                        width: 18,
                        height: 18,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "0.6rem",
                        fontWeight: 700,
                      }}
                    >
                      {
                        orderList.filter((o: any) => o.status === "pending")
                          .length
                      }
                    </span>
                  )}
                {t === "reviews" && pendingReviews.length > 0 && (
                  <span
                    style={{
                      marginLeft: "0.4rem",
                      background: "var(--pb-bg)",
                      color: "var(--pb-ember)",
                      borderRadius: "50%",
                      width: 18,
                      height: 18,
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                    }}
                  >
                    {pendingReviews.length}
                  </span>
                )}
              </button>
            )
          )}
        </div>

        {/* ===== OVERVIEW ===== */}
        {activeTab === "overview" && (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "2rem" }}
          >
            {/* Stats */}
            <div
              className="pb-grid-mobile"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4,1fr)",
                gap: "1px",
                background: "var(--pb-rule2)",
              }}
            >
              {[
                { label: "Total orders", value: statsData.totalOrders },
                { label: "Pending", value: statsData.pendingOrders },
                {
                  label: "Today revenue",
                  value: `Ksh ${statsData.todayRevenue.toLocaleString()}`,
                },
                {
                  label: "Total revenue",
                  value: `Ksh ${statsData.totalRevenue.toLocaleString()}`,
                },
              ].map(s => (
                <div
                  key={s.label}
                  style={{ background: "var(--pb-bg2)", padding: "1.5rem" }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: "0.6rem",
                      letterSpacing: "0.15em",
                      color: "var(--pb-ivory3)",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontFamily: "'Playfair Display',serif",
                      fontSize: "2rem",
                      fontWeight: 700,
                      color: "var(--pb-ember)",
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            <div>
              <div
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  color: "var(--pb-ember)",
                  textTransform: "uppercase",
                  marginBottom: "1rem",
                }}
              >
                Recent orders
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1px",
                  background: "var(--pb-rule2)",
                }}
              >
                {orderList.slice(0, 5).map((o: any) => (
                  <div
                    key={o.id}
                    style={{
                      background: "var(--pb-bg2)",
                      padding: "1rem 1.25rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: "0.5rem",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.88rem",
                          color: "var(--pb-ivory)",
                        }}
                      >
                        {o.customerName}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "0.6rem",
                          color: "var(--pb-ivory3)",
                          marginTop: "0.15rem",
                        }}
                      >
                        #{o.id} · {o.customerPhone}
                        {o.notes && (
                          <span style={{ color: "var(--pb-ember)" }}>
                            {" "}
                            · {o.notes.replace("M-Pesa Code: ", "")}
                          </span>
                        )}
                      </div>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.75rem",
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'Playfair Display',serif",
                          fontSize: "1rem",
                          fontWeight: 700,
                          color: "var(--pb-ember)",
                        }}
                      >
                        Ksh {Number(o.totalPrice)}
                      </span>
                      {o.status === "pending" && (
                        <button
                          onClick={() => handleStatusChange(o.id, "confirmed")}
                          className="pb-btn-primary"
                          style={{
                            fontSize: "0.58rem",
                            padding: "0.3rem 0.75rem",
                            minHeight: 32,
                          }}
                        >
                          ✓ Confirm
                        </button>
                      )}
                      <span
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "0.58rem",
                          letterSpacing: "0.1em",
                          textTransform: "uppercase",
                          padding: "0.2rem 0.6rem",
                          border: "1px solid",
                          color: STATUS_COLORS[o.status],
                          borderColor: STATUS_COLORS[o.status] + "66",
                        }}
                      >
                        {o.status}
                      </span>
                    </div>
                  </div>
                ))}
                {orderList.length === 0 && (
                  <div
                    style={{
                      background: "var(--pb-bg2)",
                      padding: "2rem",
                      textAlign: "center",
                      color: "var(--pb-ivory3)",
                    }}
                  >
                    No orders yet
                  </div>
                )}
              </div>
            </div>
          </div>
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
                          href={`https://wa.me/254${o.customerPhone.startsWith("0") ? o.customerPhone.slice(1) : o.customerPhone}?text=${encodeURIComponent(`Hi ${o.customerName}! Your Passua Bites order #${o.id} is ${o.status}.`)}`}
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
                        {"★".repeat(r.rating)}
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
    </div>
  );
}
