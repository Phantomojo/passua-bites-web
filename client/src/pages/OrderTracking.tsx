import { useState } from "react";
import { PBNav, PBFooter } from "./Home";
import { trpc } from "@/lib/trpc";

const STATUS_STEPS = [
  {
    key: "pending",
    label: "Order placed",
    msg: "Your order is being processed.",
  },
  {
    key: "confirmed",
    label: "Confirmed",
    msg: "Your order has been confirmed.",
  },
  {
    key: "preparing",
    label: "Preparing",
    msg: "We're cooking your food right now...",
  },
  { key: "ready", label: "Ready for pickup", msg: "Your order is ready!" },
  { key: "delivered", label: "Delivered", msg: "Enjoy your meal!" },
];

export default function OrderTracking() {
  const [searchId, setSearchId] = useState("");
  const [searchPhone, setSearchPhone] = useState("");
  const [searchBy, setSearchBy] = useState<"id" | "phone">("phone");
  const [attempted, setAttempted] = useState(false);

  const getOrderById = trpc.orders.getById.useQuery(
    { id: parseInt(searchId.replace(/\D/g, "")) || 0 },
    { enabled: false, retry: false }
  );

  const getOrdersByPhone = trpc.orders.listByPhone.useQuery(
    { phone: searchPhone },
    { enabled: false, retry: false }
  );

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setAttempted(true);

    if (searchBy === "phone" && searchPhone) {
      await getOrdersByPhone.refetch();
    } else if (searchBy === "id" && searchId) {
      const numericId = parseInt(searchId.replace(/\D/g, ""));
      if (numericId) {
        await getOrderById.refetch();
      }
    }
  };

  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // Get the order data based on search method
  let orders: any[] = [];

  if (searchBy === "id" && getOrderById.data) {
    orders = [getOrderById.data];
  } else if (searchBy === "phone" && getOrdersByPhone.data) {
    orders = getOrdersByPhone.data; // All orders
  }

  const order = selectedOrderId
    ? orders.find(o => o.id === selectedOrderId)
    : orders[0] || null;

  const orderItems = (order as any)?.items || [];

  const statusIdx = order
    ? STATUS_STEPS.findIndex(s => s.key === order.status)
    : -1;

  return (
    <div style={{ minHeight: "100vh", background: "var(--pb-bg)" }}>
      <PBNav />

      <div className="pb-section-mobile" style={{ padding: "3rem 2.5rem" }}>
        <div className="pb-eyebrow">Where's your order?</div>
        <h1
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "2.2rem",
            fontWeight: 900,
            marginBottom: "2rem",
          }}
        >
          Track Order
        </h1>

        {/* Search method toggle */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.5rem" }}>
          <button
            onClick={() => {
              setSearchBy("phone");
              setAttempted(false);
            }}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: `1px solid ${searchBy === "phone" ? "var(--pb-ember)" : "var(--pb-rule)"}`,
              background:
                searchBy === "phone" ? "rgba(196,92,40,0.1)" : "transparent",
              color:
                searchBy === "phone" ? "var(--pb-ember)" : "var(--pb-ivory3)",
              fontFamily: "'DM Mono',monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            By Phone
          </button>
          <button
            onClick={() => {
              setSearchBy("id");
              setAttempted(false);
            }}
            style={{
              flex: 1,
              padding: "0.75rem",
              border: `1px solid ${searchBy === "id" ? "var(--pb-ember)" : "var(--pb-rule)"}`,
              background:
                searchBy === "id" ? "rgba(196,92,40,0.1)" : "transparent",
              color: searchBy === "id" ? "var(--pb-ember)" : "var(--pb-ivory3)",
              fontFamily: "'DM Mono',monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              minHeight: 44,
            }}
          >
            By Order ID
          </button>
        </div>

        {/* Search form */}
        <form
          onSubmit={handleSearch}
          style={{
            display: "flex",
            gap: "0.75rem",
            marginBottom: "2.5rem",
            maxWidth: 600,
            flexWrap: "wrap",
          }}
        >
          {searchBy === "phone" ? (
            <input
              type="tel"
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value)}
              placeholder="Your phone number (e.g. 0712345678)"
              style={{
                flex: 1,
                padding: "0.75rem 0.9rem",
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.78rem",
                letterSpacing: "0.04em",
                minHeight: 44,
              }}
            />
          ) : (
            <input
              type="text"
              value={searchId}
              onChange={e => setSearchId(e.target.value)}
              placeholder="Order ID (e.g. 1, 2, 3)"
              style={{
                flex: 1,
                padding: "0.75rem 0.9rem",
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.78rem",
                letterSpacing: "0.04em",
                minHeight: 44,
              }}
            />
          )}
          <button
            type="submit"
            className="pb-btn-primary"
            style={{
              padding: "0.75rem 1.5rem",
              cursor: "pointer",
              whiteSpace: "nowrap" as const,
              minHeight: 44,
            }}
          >
            Search
          </button>
        </form>

        {order ? (
          <div
            className="pb-grid-mobile"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "1px",
              background: "var(--pb-rule2)",
            }}
          >
            {/* Status timeline */}
            <div style={{ background: "var(--pb-bg2)", padding: "2rem" }}>
              <div
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.18em",
                  color: "var(--pb-ember)",
                  textTransform: "uppercase",
                  marginBottom: "1.2rem",
                }}
              >
                Order status
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
                {STATUS_STEPS.map((step, i) => {
                  const done = i <= statusIdx;
                  const current = i === statusIdx;
                  return (
                    <div
                      key={step.key}
                      style={{
                        display: "flex",
                        gap: "1rem",
                        alignItems: "flex-start",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          paddingTop: 4,
                        }}
                      >
                        <div
                          style={{
                            width: 24,
                            height: 24,
                            border: `1px solid ${done ? "var(--pb-ember)" : "var(--pb-rule)"}`,
                            background: done
                              ? "var(--pb-ember)"
                              : "transparent",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flex: "none",
                          }}
                        >
                          {done && (
                            <svg
                              width={12}
                              height={12}
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="var(--pb-bg)"
                              strokeWidth={2.5}
                            >
                              <polyline points="20,6 9,17 4,12" />
                            </svg>
                          )}
                        </div>
                        {i < STATUS_STEPS.length - 1 && (
                          <div
                            style={{
                              width: 1,
                              height: 32,
                              background:
                                i < statusIdx
                                  ? "var(--pb-ember)"
                                  : "var(--pb-rule2)",
                              marginTop: 2,
                            }}
                          />
                        )}
                      </div>
                      <div
                        style={{
                          paddingBottom:
                            i < STATUS_STEPS.length - 1 ? "1.5rem" : 0,
                        }}
                      >
                        <div
                          style={{
                            fontSize: "0.88rem",
                            color: done
                              ? "var(--pb-ivory)"
                              : "var(--pb-ivory3)",
                            fontWeight: current ? 500 : 300,
                          }}
                        >
                          {step.label}
                        </div>
                        {current && (
                          <div
                            style={{
                              fontFamily: "'DM Mono',monospace",
                              fontSize: "0.6rem",
                              color: "var(--pb-ember)",
                              marginTop: "0.2rem",
                            }}
                          >
                            {step.msg}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order details */}
            <div
              style={{
                background: "var(--pb-bg2)",
                padding: "2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
              }}
            >
              <div
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.6rem",
                  letterSpacing: "0.18em",
                  color: "var(--pb-ember)",
                  textTransform: "uppercase",
                  marginBottom: "0.5rem",
                }}
              >
                Order details
              </div>
              {[
                ["Order ID", `PB-${order.id}`],
                ["Customer", order.customerName],
                ["Phone", order.customerPhone],
                ["Time", new Date(order.createdAt).toLocaleString()],
              ].map(([k, v]) => (
                <div
                  key={k}
                  style={{
                    paddingBottom: "0.75rem",
                    borderBottom: "1px solid var(--pb-rule2)",
                  }}
                >
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: "0.58rem",
                      color: "var(--pb-ivory3)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "0.2rem",
                    }}
                  >
                    {k}
                  </div>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--pb-ivory)",
                      fontWeight: 300,
                    }}
                  >
                    {v}
                  </div>
                </div>
              ))}

              {orderItems.length > 0 && (
                <div>
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontSize: "0.58rem",
                      color: "var(--pb-ivory3)",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                      marginBottom: "0.5rem",
                    }}
                  >
                    Items
                  </div>
                  {orderItems.map((item: any, i: number) => (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "0.82rem",
                        padding: "0.35rem 0",
                        borderBottom: "1px solid var(--pb-rule2)",
                      }}
                    >
                      <span
                        style={{ color: "var(--pb-ivory)", fontWeight: 300 }}
                      >
                        {item.name} × {item.quantity}
                      </span>
                      <span
                        style={{
                          color: "var(--pb-ember)",
                          fontFamily: "'Playfair Display',serif",
                        }}
                      >
                        Ksh {Number(item.priceAtTime) * item.quantity}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: "0.75rem",
                }}
              >
                <span
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--pb-ivory3)",
                  }}
                >
                  Total
                </span>
                <span
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "1.4rem",
                    fontWeight: 700,
                    color: "var(--pb-ember)",
                  }}
                >
                  Ksh {Number(order.totalPrice)}
                </span>
              </div>

              <div
                style={{
                  background: "rgba(196,92,40,0.05)",
                  border: "1px solid var(--pb-rule2)",
                  padding: "0.85rem",
                  marginTop: "0.5rem",
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "0.58rem",
                    color: "var(--pb-ember)",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    marginBottom: "0.4rem",
                  }}
                >
                  Need help?
                </div>
                <a
                  href="tel:0722473873"
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--pb-ivory2)",
                    display: "block",
                    fontWeight: 300,
                    textDecoration: "none",
                  }}
                >
                  Call: 0722 473 873
                </a>
                <a
                  href={`https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20I%27d%20like%20to%20check%20on%20my%20order%20PB-${order.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontSize: "0.8rem",
                    color: "var(--pb-ember)",
                    display: "block",
                    fontWeight: 300,
                    textDecoration: "none",
                    marginTop: "0.2rem",
                  }}
                >
                  WhatsApp us ↗
                </a>
              </div>
            </div>
          </div>
        ) : attempted ? (
          <div
            style={{
              background: "var(--pb-bg2)",
              border: "1px solid var(--pb-rule)",
              borderLeft: "3px solid var(--pb-sienna)",
              padding: "2rem",
            }}
          >
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                color: "var(--pb-sienna)",
                textTransform: "uppercase",
                marginBottom: "0.5rem",
              }}
            >
              Not found
            </div>
            <p
              style={{
                fontSize: "0.9rem",
                color: "var(--pb-ivory3)",
                fontWeight: 300,
              }}
            >
              No order found. Check your details and try again.
            </p>
          </div>
        ) : (
          <div
            style={{
              background: "var(--pb-bg2)",
              border: "1px solid var(--pb-rule2)",
              padding: "3rem",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.62rem",
                color: "var(--pb-ivory3)",
                letterSpacing: "0.1em",
              }}
            >
              Enter your phone number or Order ID above to track your order
              status in real time.
            </div>
          </div>
        )}
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20I%27d%20like%20to%20track%20my%20order"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact on WhatsApp"
        style={{
          position: "fixed",
          bottom: "1.5rem",
          right: "1.5rem",
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: "#25D366",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 12px rgba(37,211,102,0.4)",
          zIndex: 999,
        }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <PBFooter />
    </div>
  );
}
