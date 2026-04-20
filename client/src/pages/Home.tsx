import { useState, useEffect } from "react";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/pasua_222967c7.jpeg";
const SMOCHA =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/smochas-3PwDb6V2QuTSqcMpWtYuCk.webp";
const HOTBLAZER =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/smochas-3PwDb6V2QuTSqcMpWtYuCk.webp";
const SULTAN =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/smochas-3PwDb6V2QuTSqcMpWtYuCk.webp";
const MEGASULTAN =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/smochas-3PwDb6V2QuTSqcMpWtYuCk.webp";
const ZIGIZAGA =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/smochas-3PwDb6V2QuTSqcMpWtYuCk.webp";
const MASALACHIPS =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/smochas-3PwDb6V2QuTSqcMpWtYuCk.webp";
const PASUACORN =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/smochas-3PwDb6V2QuTSqcMpWtYuCk.webp";
const BURGER =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/smochas-3PwDb6V2QuTSqcMpWtYuCk.webp";

const MENU = [
  {
    name: "Passua Smocha",
    category: "Smoshas",
    price: 95,
    desc: "Chapati, beef smokie, kachumbari, indomie, avocado, seasoned with sauces",
    img: SMOCHA,
  },
  {
    name: "Zigizaga",
    category: "Smoshas",
    price: 125,
    desc: "Chapati, beef smokie, kachumbari, indomie, avocado, topped with a boiled egg, seasoned with sauces",
    img: ZIGIZAGA,
  },
  {
    name: "Burger",
    category: "Burgers",
    price: 150,
    desc: "Buns, lettuce, sliced kachumbari, sauces, beef pattie",
    img: BURGER,
  },
  {
    name: "Masala Chips",
    category: "Sides",
    price: 150,
    desc: "Crunchy outside, soft inside fries, well marinated — spicy or non-spicy",
    img: MASALACHIPS,
  },
  {
    name: "Hot Blazer",
    category: "Specials",
    price: 190,
    desc: "Two chapatis (wrapped), lettuce, kachumbari, boerewors, indomie, avocado, gravy sauce",
    img: HOTBLAZER,
  },
  {
    name: "Sultan",
    category: "Combos",
    price: 250,
    desc: "Two chapatis (wrapped), lettuce, kachumbari, one beef pattie, masala chips, avocado, sauces — comes with a soda",
    img: SULTAN,
  },
  {
    name: "Pasua Corn",
    category: "Sides",
    price: 280,
    desc: "One beef burger + masala chips (spicy or non-spicy)",
    img: PASUACORN,
  },
  {
    name: "Mega Sultan",
    category: "Combos",
    price: 560,
    desc: "Two chapatis (wrapped), lettuce, kachumbari, two beef patties, cheese, masala chips, avocado, sauces — comes with a soda",
    img: MEGASULTAN,
  },
];

function PBNav() {
  const [menuOpen, setMenuOpen] = useState(false);
  return (
    <nav className="pb-nav">
      <Link href="/" className="pb-nav-logo">
        <div className="pb-nav-ring">
          <img src={LOGO} alt="Passua Bites" />
        </div>
        <span className="pb-nav-brand">Passua Bites</span>
      </Link>
      {/* Hamburger button - visible only on mobile */}
      <button
        className="pb-hamburger"
        style={{ display: "none" }}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
        aria-expanded={menuOpen}
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          {menuOpen ? (
            <>
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </>
          ) : (
            <>
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </>
          )}
        </svg>
      </button>
      <div className={`pb-nav-links${menuOpen ? " open" : ""}`}>
        <Link href="/menu" className="pb-nl" onClick={() => setMenuOpen(false)}>
          Menu
        </Link>
        <Link
          href="/about"
          className="pb-nl"
          onClick={() => setMenuOpen(false)}
        >
          About
        </Link>
        <Link
          href="/contact"
          className="pb-nl"
          onClick={() => setMenuOpen(false)}
        >
          Contact
        </Link>
        <Link
          href="/menu"
          className="pb-btn-primary"
          onClick={() => setMenuOpen(false)}
        >
          Order Now
        </Link>
      </div>
    </nav>
  );
}

function PBFooter() {
  return (
    <footer className="pb-footer pb-footer-mobile">
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1fr 1fr",
          gap: "2rem",
          padding: "2.5rem 2.5rem 1.5rem",
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--pb-ivory)",
              marginBottom: "0.5rem",
            }}
          >
            Passua Bites
          </div>
          <div
            style={{
              fontSize: "0.78rem",
              color: "var(--pb-ivory3)",
              fontWeight: 300,
              lineHeight: 1.65,
            }}
          >
            Best smochas in Ruiru. Street food built on flavour and hustle — now
            online.
          </div>
          <div
            style={{
              marginTop: "1rem",
              display: "flex",
              gap: "0.5rem",
              flexWrap: "wrap" as const,
            }}
          >
            <a
              href="https://www.instagram.com/passuabites/"
              target="_blank"
              rel="noopener noreferrer"
              className="pb-footer-link"
              style={{ display: "inline" }}
            >
              Instagram
            </a>
            <span style={{ color: "var(--pb-ivory3)" }}>·</span>
            <a
              href="https://www.tiktok.com/@passuabites001"
              target="_blank"
              rel="noopener noreferrer"
              className="pb-footer-link"
              style={{ display: "inline" }}
            >
              TikTok
            </a>
            <span style={{ color: "var(--pb-ivory3)" }}>·</span>
            <a
              href="https://www.facebook.com/PassuaBites/"
              target="_blank"
              rel="noopener noreferrer"
              className="pb-footer-link"
              style={{ display: "inline" }}
            >
              Facebook
            </a>
          </div>
        </div>
        <div>
          <div className="pb-footer-col-title">Navigate</div>
          <Link href="/menu" className="pb-footer-link">
            Menu
          </Link>
          <Link href="/orders" className="pb-footer-link">
            Track Order
          </Link>
          <Link href="/reviews" className="pb-footer-link">
            Reviews
          </Link>
          <Link href="/about" className="pb-footer-link">
            About Us
          </Link>
        </div>
        <div>
          <div className="pb-footer-col-title">Contact</div>
          <a href="tel:0722473873" className="pb-footer-link">
            0722 473 873
          </a>
          <span className="pb-footer-link">Opp Rainbow Resort, Ruiru</span>
          <a
            href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20I%27d%20like%20to%20place%20an%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="pb-footer-link"
          >
            WhatsApp Order
          </a>
          <a
            href="https://food.bolt.eu/en/320-nairobi/p/170268-passua-bites/"
            target="_blank"
            rel="noopener noreferrer"
            className="pb-footer-link"
          >
            Bolt Food
          </a>
        </div>
      </div>
      <div
        style={{
          padding: "1rem 2.5rem",
          borderTop: "1px solid var(--pb-rule2)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: "0.58rem",
            color: "var(--pb-ivory3)",
            opacity: 0.5,
            letterSpacing: "0.06em",
          }}
        >
          © 2026 Passua Bites — All rights reserved
        </span>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link
            href="/privacy"
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: "0.55rem",
              color: "var(--pb-ivory3)",
              opacity: 0.5,
              letterSpacing: "0.06em",
              textDecoration: "none",
            }}
          >
            Privacy
          </Link>
          <Link
            href="/terms"
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: "0.55rem",
              color: "var(--pb-ivory3)",
              opacity: 0.5,
              letterSpacing: "0.06em",
              textDecoration: "none",
            }}
          >
            Terms
          </Link>
        </div>
      </div>
    </footer>
  );
}

export { PBNav, PBFooter };

export default function Home() {
  const { data: displacementMessage } = trpc.location.get.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });
  const { data: menuItems = [] } = trpc.menu.list.useQuery();

  const tickerItems =
    (menuItems?.length ?? 0) > 0
      ? menuItems.map((m: any) => `${m.name} — KSH ${m.price}`)
      : [
          "Passua Smocha — KSH 95",
          "Zigizaga — KSH 125",
          "Burger — KSH 150",
          "Masala Chips — KSH 150",
          "Hot Blazer — KSH 190",
          "Sultan — KSH 250",
          "Pasua Corn — KSH 280",
          "Mega Sultan — KSH 560",
        ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--pb-bg)" }}>
      <PBNav />

      {/* Hero */}
      <section
        className="pb-hero-mobile"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          minHeight: "86vh",
          borderBottom: "1px solid var(--pb-rule)",
        }}
      >
        <div
          style={{
            padding: "4.5rem 3rem 4rem 2.5rem",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            borderRight: "1px solid var(--pb-rule2)",
          }}
        >
          <div className="pb-eyebrow">Ruiru's Finest Street Bites</div>
          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "clamp(3rem,4.5vw,5rem)",
              fontWeight: 900,
              lineHeight: 0.92,
              color: "var(--pb-ivory)",
              marginBottom: "0.4rem",
            }}
          >
            Smochas
            <br />
            <span style={{ color: "var(--pb-ember)", fontStyle: "italic" }}>
              worth
            </span>
            <br />
            finding.
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--pb-ivory3)",
              lineHeight: 1.75,
              fontWeight: 300,
              maxWidth: 340,
              margin: "1.6rem 0 2.2rem",
            }}
          >
            Street food with soul — smoked, wrapped, served fresh. Born in
            Ruiru. Now online, always around.
          </p>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.6rem",
              marginBottom: "2.2rem",
            }}
          >
            {[
              "Opp Rainbow Resort, Ruiru",
              "0722 473 873",
              "Also on Bolt Food",
            ].map(txt => (
              <div
                key={txt}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.7rem",
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.68rem",
                  color: "var(--pb-ivory3)",
                  letterSpacing: "0.05em",
                }}
              >
                <span className="pb-diamond" />
                {txt}
              </div>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              gap: "0.75rem",
              flexWrap: "wrap" as const,
            }}
          >
            <Link href="/menu" className="pb-btn-primary">
              View Menu
            </Link>
            <a
              href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20I%27d%20like%20to%20place%20an%20order"
              target="_blank"
              rel="noopener noreferrer"
              className="pb-btn-ghost"
            >
              Order on WhatsApp
            </a>
          </div>
        </div>
        <div
          style={{
            position: "relative",
            overflow: "hidden",
            background: "var(--pb-bg2)",
          }}
        >
          <img
            src={SMOCHA}
            alt="Smocha"
            className="pb-food-img"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              display: "block",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(135deg,rgba(13,9,6,0.55) 0%,transparent 55%)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "2rem",
              right: "1.8rem",
              background: "rgba(13,9,6,0.9)",
              border: "1px solid rgba(196,92,40,0.4)",
              padding: "1rem 1.2rem",
              backdropFilter: "blur(16px)",
            }}
          >
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.2em",
                color: "var(--pb-ember)",
                textTransform: "uppercase",
                marginBottom: "0.35rem",
              }}
            >
              Signature dish
            </div>
            <div
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "2rem",
                fontWeight: 900,
                color: "var(--pb-ivory)",
                lineHeight: 1,
              }}
            >
              100{" "}
              <span
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.72rem",
                  color: "var(--pb-ivory3)",
                }}
              >
                KSH
              </span>
            </div>
            <div
              style={{
                fontSize: "0.72rem",
                color: "var(--pb-ivory3)",
                marginTop: "0.3rem",
                fontWeight: 300,
              }}
            >
              Smochas — smoked + chapati
            </div>
          </div>
        </div>
      </section>

      {/* Ticker */}
      <div className="pb-ticker">
        <div className="pb-ticker-inner">
          {[...tickerItems, ...tickerItems].map((t, i) => (
            <span key={i}>
              <span className="pb-ticker-item">{t}</span>
              <span className="pb-ticker-sep">◆</span>
            </span>
          ))}
        </div>
      </div>

      {/* Location alert */}
      {displacementMessage && (
        <div className="pb-alert">
          <div className="pb-alert-icon" />
          <div>
            <div className="pb-alert-label">Location Update</div>
            <div className="pb-alert-text">{displacementMessage}</div>
          </div>
        </div>
      )}

      {/* Menu preview */}
      <section
        className="pb-section-mobile"
        style={{ padding: "3rem 2.5rem 4rem" }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            borderBottom: "1px solid var(--pb-rule)",
            paddingBottom: "1.2rem",
            marginBottom: "2.2rem",
          }}
        >
          <div>
            <div className="pb-eyebrow">What we make</div>
            <h2
              style={{
                fontFamily: "'Playfair Display',serif",
                fontSize: "1.9rem",
                fontWeight: 700,
                color: "var(--pb-ivory)",
                margin: 0,
              }}
            >
              The Menu
            </h2>
          </div>
          <Link
            href="/menu"
            style={{
              fontFamily: "'DM Mono',monospace",
              fontSize: "0.65rem",
              color: "var(--pb-ivory3)",
              letterSpacing: "0.1em",
            }}
          >
            04 items →
          </Link>
        </div>

        <div
          className="pb-menu-grid-mobile"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))",
            gap: "1px",
            background: "var(--pb-rule2)",
          }}
        >
          {(menuItems?.length > 0 ? menuItems : MENU).map((item: any) => (
            <div
              key={item.name}
              style={{
                background: "var(--pb-bg)",
                cursor: "pointer",
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
                  height: 170,
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
              <div style={{ padding: "1.1rem" }}>
                <div
                  style={{
                    fontFamily: "'DM Mono',monospace",
                    fontSize: "0.58rem",
                    letterSpacing: "0.18em",
                    color: "var(--pb-ember)",
                    textTransform: "uppercase",
                    marginBottom: "0.4rem",
                  }}
                >
                  {item.category}
                </div>
                <div
                  style={{
                    fontFamily: "'Playfair Display',serif",
                    fontSize: "1.15rem",
                    fontWeight: 700,
                    color: "var(--pb-ivory)",
                    marginBottom: "0.35rem",
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
                    marginBottom: "0.9rem",
                  }}
                >
                  {item.desc || item.description}
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontFamily: "'Playfair Display',serif",
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        color: "var(--pb-ember)",
                      }}
                    >
                      KSH {item.price}
                    </div>
                    <div
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: "0.58rem",
                        color: "var(--pb-ivory3)",
                        marginTop: "0.1rem",
                      }}
                    >
                      KSH / piece
                    </div>
                  </div>
                  <Link
                    href="/menu"
                    style={{
                      width: 30,
                      height: 30,
                      background: "rgba(196,92,40,0.1)",
                      border: "1px solid rgba(196,92,40,0.3)",
                      color: "var(--pb-ember)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "1.1rem",
                      clipPath:
                        "polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",
                      textDecoration: "none",
                      transition: "background 0.2s",
                    }}
                    onMouseEnter={e =>
                      (e.currentTarget.style.background =
                        "rgba(196,92,40,0.22)")
                    }
                    onMouseLeave={e =>
                      (e.currentTarget.style.background = "rgba(196,92,40,0.1)")
                    }
                  >
                    +
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "2rem" }}>
          <Link href="/menu" className="pb-btn-primary">
            View Full Menu
          </Link>
        </div>
      </section>

      {/* Why choose us */}
      <section
        className="pb-section-mobile"
        style={{
          padding: "3rem 2.5rem",
          borderTop: "1px solid var(--pb-rule2)",
        }}
      >
        <div className="pb-eyebrow">Why us</div>
        <h2
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "1.9rem",
            fontWeight: 700,
            marginBottom: "2rem",
          }}
        >
          Quality you can taste
        </h2>
        <div
          className="pb-grid-mobile"
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: "1px",
            background: "var(--pb-rule2)",
          }}
        >
          {[
            {
              label: "Fresh daily",
              body: "Made fresh every day with quality ingredients — no shortcuts.",
            },
            {
              label: "Quick service",
              body: "Fast preparation without compromising what matters.",
            },
            {
              label: "Affordable",
              body: "Great taste that doesn't break the bank. Street food priced right.",
            },
            {
              label: "Community",
              body: "Trusted by hundreds of Ruiru locals since day one.",
            },
          ].map(f => (
            <div
              key={f.label}
              style={{ background: "var(--pb-bg2)", padding: "1.8rem 1.5rem" }}
            >
              <div
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  color: "var(--pb-ember)",
                  textTransform: "uppercase",
                  marginBottom: "0.6rem",
                }}
              >
                {f.label}
              </div>
              <div
                style={{
                  fontSize: "0.84rem",
                  color: "var(--pb-ivory3)",
                  fontWeight: 300,
                  lineHeight: 1.65,
                }}
              >
                {f.body}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Customer Reviews */}
      <section
        className="pb-section-mobile"
        style={{
          padding: "3rem 2.5rem",
          borderTop: "1px solid var(--pb-rule2)",
        }}
      >
        <div className="pb-eyebrow">What customers say</div>
        <h2
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "1.9rem",
            fontWeight: 700,
            marginBottom: "1.5rem",
          }}
        >
          Reviews
        </h2>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "1rem",
            marginBottom: "1.5rem",
            flexWrap: "wrap",
          }}
        >
          <span
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "2.5rem",
              fontWeight: 900,
              color: "var(--pb-ember)",
            }}
          >
            4.8
          </span>
          <div>
            <div style={{ color: "var(--pb-ember)", fontSize: "1.2rem" }}>
              ★★★★★
            </div>
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.6rem",
                color: "var(--pb-ivory3)",
                letterSpacing: "0.05em",
              }}
            >
              Based on customer reviews
            </div>
          </div>
          <Link
            href="/reviews"
            className="pb-btn-ghost"
            style={{
              marginLeft: "auto",
              fontSize: "0.6rem",
              padding: "0.5rem 1rem",
            }}
          >
            Write a Review →
          </Link>
        </div>
      </section>

      {/* CTA */}
      <section
        style={{
          background: "var(--pb-bg3)",
          borderTop: "1px solid var(--pb-rule)",
          borderBottom: "1px solid var(--pb-rule)",
          padding: "4rem 2.5rem",
          textAlign: "center",
        }}
      >
        <div className="pb-eyebrow" style={{ justifyContent: "center" }}>
          Order now
        </div>
        <h2
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "clamp(1.8rem,3vw,2.8rem)",
            marginBottom: "1rem",
          }}
        >
          Ready to eat?
        </h2>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--pb-ivory3)",
            fontWeight: 300,
            marginBottom: "2rem",
          }}
        >
          Order from our site, WhatsApp us directly, or find us on Bolt Food.
        </p>
        <div
          style={{
            display: "flex",
            gap: "0.75rem",
            justifyContent: "center",
            flexWrap: "wrap" as const,
          }}
        >
          <Link href="/menu" className="pb-btn-primary">
            Order on Website
          </Link>
          <a
            href="https://food.bolt.eu/en/320-nairobi/p/170268-passua-bites/"
            target="_blank"
            rel="noopener noreferrer"
            className="pb-btn-ghost"
          >
            Order on Bolt Food
          </a>
          <a
            href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20I%27d%20like%20to%20place%20an%20order"
            target="_blank"
            rel="noopener noreferrer"
            className="pb-btn-ghost"
          >
            WhatsApp
          </a>
        </div>
      </section>

      {/* Social row */}
      <div
        className="pb-social-mobile"
        style={{
          padding: "1.8rem 2.5rem",
          borderBottom: "1px solid var(--pb-rule2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap" as const,
          gap: "1rem",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: "0.6rem",
            letterSpacing: "0.2em",
            color: "var(--pb-ivory3)",
            textTransform: "uppercase",
          }}
        >
          Find us online
        </span>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {[
            {
              label: "Instagram",
              href: "https://www.instagram.com/passuabites/",
            },
            { label: "TikTok", href: "https://www.tiktok.com/@passuabites001" },
            {
              label: "Facebook",
              href: "https://www.facebook.com/PassuaBites/",
            },
            {
              label: "Bolt Food",
              href: "https://food.bolt.eu/en/320-nairobi/p/170268-passua-bites/",
            },
          ].map(s => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.62rem",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "var(--pb-ivory3)",
                background: "none",
                border: "1px solid var(--pb-rule)",
                padding: "0.42rem 0.85rem",
                textDecoration: "none",
                transition: "color 0.2s,border-color 0.2s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--pb-ember)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "rgba(196,92,40,0.35)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color =
                  "var(--pb-ivory3)";
                (e.currentTarget as HTMLElement).style.borderColor =
                  "var(--pb-rule)";
              }}
            >
              {s.label}
            </a>
          ))}
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
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1.1)";
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 6px 16px rgba(37,211,102,0.5)";
        }}
        onMouseLeave={e => {
          (e.currentTarget as HTMLElement).style.transform = "scale(1)";
          (e.currentTarget as HTMLElement).style.boxShadow =
            "0 4px 12px rgba(37,211,102,0.4)";
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
