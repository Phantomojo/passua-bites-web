import { useState, useEffect } from "react";
import { Link } from "wouter";
import { PBNav, PBFooter } from "./Home";
import { trpc } from "@/lib/trpc";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/pasua_222967c7.jpeg";

interface CartItem {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  quantity: number;
}

export default function Menu() {
  const { data: menuItems = [], isLoading } = trpc.menu.list.useQuery();
  const [cart, setCart] = useState<CartItem[]>(() => {
    const stored = localStorage.getItem("passua_cart");
    return stored ? JSON.parse(stored) : [];
  });
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [showCart, setShowCart] = useState(false);

  const categories = [
    "All",
    ...Array.from(
      new Set(menuItems.map((i: any) => i.category).filter(Boolean))
    ),
  ];
  const filtered =
    selectedCategory === "All"
      ? menuItems
      : menuItems.filter((i: any) => i.category === selectedCategory);

  const addToCart = (item: any) => {
    const cartItem = {
      id: item.id,
      name: item.name,
      description: item.description || "",
      price: Number(item.price),
      image: item.imageUrl || "",
      category: item.category || "",
      quantity: 1,
    };
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing)
        return prev.map(c =>
          c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c
        );
      return [...prev, cartItem];
    });
  };

  const updateQty = (id: number, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(c => c.id !== id));
    else
      setCart(prev =>
        prev.map(c => (c.id === id ? { ...c, quantity: qty } : c))
      );
  };

  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem("passua_cart", JSON.stringify(newCart));
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const totalItems = cart.reduce((s, i) => s + i.quantity, 0);

  const handleCheckout = () => {
    window.location.href = "/checkout";
  };

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem("passua_cart", JSON.stringify(cart));
  }, [cart]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--pb-bg)" }}>
      <PBNav />

      <div className="pb-section-mobile" style={{ padding: "3rem 2.5rem" }}>
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--pb-rule)",
            paddingBottom: "1.2rem",
            marginBottom: "2.5rem",
            flexWrap: "wrap",
            gap: "1rem",
          }}
        >
          <div>
            <div className="pb-eyebrow">Everything we serve</div>
            <h1
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "2.5rem",
                fontWeight: 900,
                color: "var(--pb-ivory)",
                margin: 0,
              }}
            >
              The Menu
            </h1>
          </div>
          <button
            onClick={() => setShowCart(!showCart)}
            style={{
              position: "relative",
              background: "none",
              border: "1px solid var(--pb-rule)",
              padding: "0.75rem 1rem",
              color: "var(--pb-ivory2)",
              fontFamily: "'DM Mono',monospace",
              fontSize: "0.65rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              minHeight: 44,
            }}
          >
            Cart
            {totalItems > 0 && (
              <span
                style={{
                  background: "var(--pb-ember)",
                  color: "var(--pb-bg)",
                  borderRadius: "50%",
                  width: 22,
                  height: 22,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                }}
              >
                {totalItems}
              </span>
            )}
          </button>
        </div>

        <div
          className="pb-grid-mobile"
          style={{
            display: "grid",
            gridTemplateColumns:
              showCart && cart.length > 0 ? "1fr 320px" : "1fr",
            gap: "2rem",
          }}
        >
          <div>
            {/* Category filter */}
            <div
              style={{
                display: "flex",
                gap: "0.5rem",
                marginBottom: "2rem",
                flexWrap: "wrap" as const,
              }}
            >
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "0.65rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    padding: "0.6rem 1rem",
                    cursor: "pointer",
                    border: "1px solid",
                    transition: "all 0.2s",
                    background:
                      selectedCategory === cat
                        ? "var(--pb-ember)"
                        : "transparent",
                    color:
                      selectedCategory === cat
                        ? "var(--pb-bg)"
                        : "var(--pb-ivory3)",
                    borderColor:
                      selectedCategory === cat
                        ? "var(--pb-ember)"
                        : "var(--pb-rule)",
                    minHeight: 44,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Loading state */}
            {isLoading && (
              <div
                style={{
                  textAlign: "center",
                  padding: "3rem",
                  color: "var(--pb-ivory3)",
                }}
              >
                Loading menu...
              </div>
            )}

            {/* Empty state */}
            {!isLoading && filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "3rem" }}>
                <div
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "1.5rem",
                    color: "var(--pb-ivory3)",
                    marginBottom: "0.5rem",
                  }}
                >
                  No items available
                </div>
                <p style={{ fontSize: "0.85rem", color: "var(--pb-ivory3)" }}>
                  Check back later or order via WhatsApp.
                </p>
              </div>
            )}

            {/* Grid */}
            <div
              className="pb-menu-grid-mobile"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill,minmax(240px,1fr))",
                gap: "1px",
                background: "var(--pb-rule2)",
              }}
            >
              {filtered.map((item: any) => {
                const inCart = cart.find(c => c.id === item.id);
                return (
                  <div
                    key={item.id}
                    style={{
                      background: "var(--pb-bg)",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.background = "var(--pb-bg3)")
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.background = "var(--pb-bg)")
                    }
                  >
                    <div
                      style={{
                        height: 180,
                        overflow: "hidden",
                        background: "var(--pb-bg3)",
                      }}
                    >
                      {item.videoUrl ? (
                        <video
                          src={item.videoUrl}
                          poster={item.imageUrl || undefined}
                          autoPlay
                          loop
                          muted
                          playsInline
                          preload="metadata"
                          className="pb-food-img"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      ) : (
                        <img
                          src={item.imageUrl || ""}
                          alt={item.name}
                          loading="lazy"
                          decoding="async"
                          className="pb-food-img"
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            display: "block",
                          }}
                        />
                      )}
                    </div>
                    <div style={{ padding: "1.2rem" }}>
                      <div
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "0.58rem",
                          letterSpacing: "0.18em",
                          color: "var(--pb-ember)",
                          textTransform: "uppercase",
                          marginBottom: "0.35rem",
                        }}
                      >
                        {item.category}
                      </div>
                      <div
                        style={{
                          fontFamily: "'Playfair Display',serif",
                          fontSize: "1.2rem",
                          fontWeight: 700,
                          color: "var(--pb-ivory)",
                          marginBottom: "0.3rem",
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "var(--pb-ivory3)",
                          lineHeight: 1.6,
                          fontWeight: 300,
                          marginBottom: "1rem",
                        }}
                      >
                        {item.description}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                        }}
                      >
                        <div>
                          <span
                            style={{
                              fontFamily: "'Playfair Display',serif",
                              fontSize: "1.4rem",
                              fontWeight: 700,
                              color: "var(--pb-ember)",
                            }}
                          >
                            {Number(item.price)}
                          </span>
                          <span
                            style={{
                              fontFamily: "'DM Mono',monospace",
                              fontSize: "0.6rem",
                              color: "var(--pb-ivory3)",
                              marginLeft: "0.3rem",
                            }}
                          >
                            KSH
                          </span>
                        </div>
                        {inCart ? (
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.5rem",
                            }}
                          >
                            <button
                              onClick={() => {
                                const newCart = cart
                                  .map(c =>
                                    c.id === item.id
                                      ? { ...c, quantity: c.quantity - 1 }
                                      : c
                                  )
                                  .filter(c => c.quantity > 0);
                                setCart(newCart);
                              }}
                              style={{
                                width: 36,
                                height: 36,
                                background: "rgba(196,92,40,0.15)",
                                border: "1px solid rgba(196,92,40,0.3)",
                                color: "var(--pb-ember)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.2rem",
                              }}
                            >
                              −
                            </button>
                            <span
                              style={{
                                fontFamily: "'DM Mono',monospace",
                                fontSize: "0.72rem",
                                color: "var(--pb-ivory)",
                                minWidth: 20,
                                textAlign: "center",
                              }}
                            >
                              {inCart.quantity}
                            </span>
                            <button
                              onClick={() => {
                                const newCart = cart.map(c =>
                                  c.id === item.id
                                    ? { ...c, quantity: c.quantity + 1 }
                                    : c
                                );
                                setCart(newCart);
                              }}
                              style={{
                                width: 36,
                                height: 36,
                                background: "rgba(196,92,40,0.15)",
                                border: "1px solid rgba(196,92,40,0.3)",
                                color: "var(--pb-ember)",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "1.2rem",
                              }}
                            >
                              +
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              addToCart(item);
                            }}
                            style={{
                              width: 44,
                              height: 44,
                              background: "rgba(196,92,40,0.1)",
                              border: "1px solid rgba(196,92,40,0.3)",
                              color: "var(--pb-ember)",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              fontSize: "1.4rem",
                              clipPath:
                                "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
                              transition: "background 0.2s",
                            }}
                            onMouseEnter={e =>
                              ((
                                e.currentTarget as HTMLElement
                              ).style.background = "rgba(196,92,40,0.22)")
                            }
                            onMouseLeave={e =>
                              ((
                                e.currentTarget as HTMLElement
                              ).style.background = "rgba(196,92,40,0.1)")
                            }
                          >
                            +
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Cart sidebar */}
          {showCart && cart.length > 0 && (
            <div
              style={{
                background: "var(--pb-bg2)",
                border: "1px solid var(--pb-rule)",
                padding: "1.5rem",
                alignSelf: "flex-start",
                position: "sticky",
                top: "5rem",
              }}
            >
              <div
                style={{
                  fontFamily: "'Playfair Display',serif",
                  fontSize: "1.2rem",
                  fontWeight: 700,
                  color: "var(--pb-ivory)",
                  marginBottom: "1.2rem",
                }}
              >
                Your Order
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.75rem",
                  marginBottom: "1.2rem",
                  maxHeight: "50vh",
                  overflowY: "auto",
                }}
              >
                {cart.map(item => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      paddingBottom: "0.75rem",
                      borderBottom: "1px solid var(--pb-rule2)",
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: "0.85rem",
                          color: "var(--pb-ivory)",
                          fontWeight: 400,
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: "0.62rem",
                          color: "var(--pb-ivory3)",
                          marginTop: "0.15rem",
                        }}
                      >
                        x{item.quantity}
                      </div>
                    </div>
                    <div
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: "1rem",
                        fontWeight: 700,
                        color: "var(--pb-ember)",
                      }}
                    >
                      Ksh {item.price * item.quantity}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  borderTop: "1px solid var(--pb-rule)",
                  paddingTop: "1rem",
                  marginBottom: "1.2rem",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
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
                      fontSize: "1.5rem",
                      fontWeight: 700,
                      color: "var(--pb-ember)",
                    }}
                  >
                    Ksh {total}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCheckout}
                className="pb-btn-primary"
                style={{
                  width: "100%",
                  display: "block",
                  textAlign: "center",
                  padding: "0.75rem",
                }}
              >
                Checkout
              </button>
              <div
                style={{
                  marginTop: "0.75rem",
                  padding: "0.75rem",
                  background: "rgba(196,92,40,0.05)",
                  border: "1px solid var(--pb-rule2)",
                }}
              >
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "0.58rem",
                    letterSpacing: "0.1em",
                    textTransform: "uppercase",
                    color: "var(--pb-ivory3)",
                    marginBottom: "0.4rem",
                  }}
                >
                  Also order via
                </div>
                <a
                  href="https://food.bolt.eu/en/320-nairobi/p/170268-passua-bites/"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "var(--pb-ember)",
                    marginBottom: "0.2rem",
                    textDecoration: "none",
                  }}
                >
                  Bolt Food ↗
                </a>
                <a
                  href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20I%27d%20like%20to%20place%20an%20order"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "block",
                    fontSize: "0.75rem",
                    color: "var(--pb-ember)",
                    textDecoration: "none",
                  }}
                >
                  WhatsApp ↗
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20I%27d%20like%20to%20place%20an%20order"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Order on WhatsApp"
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
