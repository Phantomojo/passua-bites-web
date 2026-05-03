import { useState } from "react";
import { Link } from "wouter";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/pasua_222967c7.jpeg";

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
      <button
        className="pb-hamburger"
        style={{ display: "none" }}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          {menuOpen ? (
            <path d="M18 6L6 18M6 6l12 12" />
          ) : (
            <path d="M3 6h18M3 12h18M3 18h18" />
          )}
        </svg>
      </button>
      <div className={`pb-nav-links${menuOpen ? " open" : ""}`}>
        <Link href="/menu" className="pb-nl">
          Menu
        </Link>
        <Link href="/about" className="pb-nl">
          About
        </Link>
        <Link
          href="/nairobi-food-fest"
          className="pb-nl"
          style={{ color: "#FF8C00", fontWeight: "bold" }}
        >
          Nairobi Fest
        </Link>
        <Link href="/contact" className="pb-nl">
          Contact
        </Link>
        <Link href="/menu" className="pb-btn-primary">
          Order Now
        </Link>
      </div>
    </nav>
  );
}

function PBFooter() {
  return (
    <footer
      className="pb-footer"
      style={{ borderTop: "1px solid rgba(255, 140, 0, 0.2)" }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "2rem",
          padding: "2.5rem",
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
          <p
            style={{
              fontSize: "0.78rem",
              color: "var(--pb-ivory3)",
              lineHeight: 1.65,
            }}
          >
            Celebrating the flavors of Nairobi, one bite at a time. Thank you
            for making the Nairobi Street Food Festival 2025 unforgettable!
          </p>
        </div>
        <div>
          <div className="pb-footer-col-title" style={{ color: "#FF8C00" }}>
            Follow the Vibe
          </div>
          <a
            href="https://www.instagram.com/passuabites/"
            className="pb-footer-link"
          >
            Instagram
          </a>
          <a
            href="https://www.tiktok.com/@passuabites001"
            className="pb-footer-link"
          >
            TikTok
          </a>
        </div>
        <div>
          <div className="pb-footer-col-title" style={{ color: "#32CD32" }}>
            Contact
          </div>
          <span className="pb-footer-link">Opp Rainbow Resort, Ruiru</span>
          <a href="tel:0722473873" className="pb-footer-link">
            0722 473 873
          </a>
        </div>
      </div>
      <div
        style={{
          padding: "1rem 2.5rem",
          borderTop: "1px solid rgba(255, 140, 0, 0.1)",
          textAlign: "center",
        }}
      >
        <span
          style={{
            fontFamily: "'DM Mono',monospace",
            fontSize: "0.58rem",
            color: "var(--pb-ivory3)",
            opacity: 0.5,
          }}
        >
          © 2026 Passua Bites x Nairobi Food Fest
        </span>
      </div>
    </footer>
  );
}

export default function NairobiFoodFest() {
  return (
    <div
      style={{
        background: "var(--pb-bg)",
        minHeight: "100vh",
        color: "var(--pb-ivory)",
      }}
    >
      <PBNav />

      {/* Hero Section - Rainy Vibes & Fireworks */}
      <section
        style={{
          padding: "8rem 2.5rem 6rem",
          textAlign: "center",
          background:
            "linear-gradient(rgba(13, 9, 6, 0.7), rgba(13, 9, 6, 0.9)), url('/media/images/fireworks-rain.jpg') center/cover",
          borderBottom: "4px solid #FF8C00",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Rainy Overlay Effect */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            background:
              "url('https://www.transparenttextures.com/patterns/stardust.png')",
            opacity: 0.2,
          }}
        ></div>

        <div
          className="pb-eyebrow"
          style={{ color: "#FF8C00", justifyContent: "center" }}
        >
          10th Edition Recap
        </div>
        <h1
          style={{
            fontSize: "clamp(2.5rem, 8vw, 4.5rem)",
            marginBottom: "1.5rem",
            textShadow: "0 4px 12px rgba(0,0,0,0.5)",
          }}
        >
          Rain, Mud & <span style={{ color: "#FF8C00" }}>Pure Magic</span>
        </h1>
        <p
          style={{
            maxWidth: "750px",
            margin: "0 auto 2.5rem",
            fontSize: "1.2rem",
            color: "#f2e8d8",
            lineHeight: "1.6",
            textShadow: "0 2px 4px rgba(0,0,0,0.3)",
          }}
        >
          The rain came down, the mud got deep, and the cold was real—but
          Nairobi, you didn't miss a beat! We danced, we vibed, and we ate the
          best street food in the city under the fireworks.
        </p>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/menu"
            className="pb-btn-primary"
            style={{ background: "#FF8C00" }}
          >
            Craving a Smocha? Order Now
          </Link>
          <a
            href="#artists"
            className="pb-btn-ghost"
            style={{ borderColor: "#32CD32", color: "#32CD32" }}
          >
            The Artist Lineup
          </a>
        </div>
      </section>

      {/* Street Style Illustrations Section */}
      <section
        style={{
          padding: "4rem 2.5rem",
          background: "rgba(255, 140, 0, 0.03)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "4rem",
            flexWrap: "wrap",
            maxWidth: "1000px",
            margin: "0 auto",
          }}
        >
          <div style={{ textAlign: "center", maxWidth: "300px" }}>
            <img
              src="/media/images/festival-doodle-1.png"
              alt="Smocha Doodle"
              style={{
                width: "180px",
                marginBottom: "1.5rem",
                filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.3))",
              }}
            />
            <h3 style={{ color: "#FF8C00" }}>Hot Food, Cold Rain</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--pb-ivory2)" }}>
              Nothing beats a steaming Hot Blazer when the rain is pouring and
              the vibes are high.
            </p>
          </div>
          <div style={{ textAlign: "center", maxWidth: "300px" }}>
            <img
              src="/media/images/festival-doodle-2.png"
              alt="Dancing Doodle"
              style={{
                width: "180px",
                marginBottom: "1.5rem",
                filter: "drop-shadow(0 10px 15px rgba(0,0,0,0.3))",
              }}
            />
            <h3 style={{ color: "#32CD32" }}>Dancing in the Mud</h3>
            <p style={{ fontSize: "0.9rem", color: "var(--pb-ivory2)" }}>
              Shoutout to everyone who kept the energy up and the dance floor
              moving through the storm!
            </p>
          </div>
        </div>
      </section>

      {/* Artist Shoutout Section */}
      <section
        id="artists"
        style={{ padding: "6rem 2.5rem", maxWidth: "1100px", margin: "0 auto" }}
      >
        <div className="pb-eyebrow" style={{ color: "#32CD32" }}>
          The Sound of the Fest
        </div>
        <h2 style={{ marginBottom: "3rem" }}>
          Who Kept Us <span style={{ color: "#32CD32" }}>Vibing</span>
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "2rem",
          }}
        >
          <div
            style={{
              padding: "2.5rem",
              background: "var(--pb-bg2)",
              border: "1px solid rgba(50, 205, 50, 0.2)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-10px",
                right: "-10px",
                fontSize: "4rem",
                opacity: 0.1,
                color: "#32CD32",
              }}
            >
              ♫
            </div>
            <h3 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
              Watendawili
            </h3>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.75rem",
                color: "#32CD32",
                textTransform: "uppercase",
                marginBottom: "1.5rem",
              }}
            >
              Live Performance
            </p>
            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--pb-ivory2)",
                lineHeight: "1.6",
              }}
            >
              The cinematic experience we were promised! Their performance
              through the rain was legendary.
            </p>
          </div>
          <div
            style={{
              padding: "2.5rem",
              background: "var(--pb-bg2)",
              border: "1px solid rgba(255, 140, 0, 0.2)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-10px",
                right: "-10px",
                fontSize: "4rem",
                opacity: 0.1,
                color: "#FF8C00",
              }}
            >
              🎧
            </div>
            <h3 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
              DJ Joe Mfalme
            </h3>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.75rem",
                color: "#FF8C00",
                textTransform: "uppercase",
                marginBottom: "1.5rem",
              }}
            >
              The Deck Master
            </p>
            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--pb-ivory2)",
                lineHeight: "1.6",
              }}
            >
              Keeping the LOUD and nonstop energy alive all night long. The
              dance floor had no breaks!
            </p>
          </div>
          <div
            style={{
              padding: "2.5rem",
              background: "var(--pb-bg2)",
              border: "1px solid rgba(204, 0, 0, 0.2)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-10px",
                right: "-10px",
                fontSize: "4rem",
                opacity: 0.1,
                color: "#CC0000",
              }}
            >
              ✨
            </div>
            <h3 style={{ fontSize: "1.8rem", marginBottom: "0.5rem" }}>
              And Many More...
            </h3>
            <p
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.75rem",
                color: "#CC0000",
                textTransform: "uppercase",
                marginBottom: "1.5rem",
              }}
            >
              Nairobi's Finest
            </p>
            <p
              style={{
                fontSize: "0.95rem",
                color: "var(--pb-ivory2)",
                lineHeight: "1.6",
              }}
            >
              To every artist, DJ, and performer who shared their talent—thank
              you for making the 10th edition special.
            </p>
          </div>
        </div>
      </section>

      {/* Fireworks & Vibes Ticker */}
      <div className="pb-ticker" style={{ background: "#FF8C00" }}>
        <div className="pb-ticker-inner">
          {[1, 2, 3, 4, 5].map(i => (
            <span key={i} className="pb-ticker-item" style={{ color: "white" }}>
              FIREWORKS OVER JAMHURI <span className="pb-ticker-sep">★</span>{" "}
              DANCING IN THE RAIN <span className="pb-ticker-sep">★</span>{" "}
              SMOCHAS & VIBES <span className="pb-ticker-sep">★</span>
            </span>
          ))}
        </div>
      </div>

      {/* Team Thank You Message - Main Section */}
      <section
        style={{
          padding: "8rem 2.5rem",
          background:
            "linear-gradient(135deg, rgba(255, 140, 0, 0.15), rgba(50, 205, 50, 0.15))",
        }}
      >
        <div style={{ maxWidth: "950px", margin: "0 auto" }}>
          <div
            className="pb-eyebrow"
            style={{ color: "#FF8C00", justifyContent: "center" }}
          >
            From Our Hearts
          </div>
          <h2
            style={{
              fontSize: "2.5rem",
              marginBottom: "3rem",
              textAlign: "center",
            }}
          >
            A Message from{" "}
            <span style={{ color: "#32CD32" }}>Passua Bites</span>
          </h2>

          <div
            style={{
              padding: "3.5rem",
              background: "var(--pb-bg2)",
              border: "2px solid #FF8C00",
              position: "relative",
              marginBottom: "3rem",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "-15px",
                left: "30px",
                fontSize: "3rem",
                color: "#FF8C00",
                opacity: 0.3,
              }}
            >
              "
            </div>

            <p
              style={{
                fontSize: "1.25rem",
                lineHeight: "2",
                color: "var(--pb-ivory)",
                marginBottom: "2rem",
                fontStyle: "italic",
              }}
            >
              To everyone who came through for us at the Nairobi Street Food
              Festival—rain, mud, cold, and all—<strong>thank you</strong>. You
              showed up. You danced. You ate our smochas. You made it real.
            </p>

            <p
              style={{
                fontSize: "1.1rem",
                lineHeight: "1.9",
                color: "var(--pb-ivory2)",
                marginBottom: "2.5rem",
              }}
            >
              To the families who brought their kids despite the weather. To the
              couples who didn't let the rain stop their date night. To the solo
              vibers who came to celebrate life and good food. To everyone who
              stood in the mud with us—this one's for you.
            </p>

            <p
              style={{
                fontSize: "1.1rem",
                lineHeight: "1.9",
                color: "var(--pb-ivory2)",
                marginBottom: "2.5rem",
              }}
            >
              Shoutout to <strong>Watendawili</strong> and{" "}
              <strong>DJ Joe Mfalme</strong> for keeping the energy LOUD and
              nonstop. Your performances turned that rainy night into something
              magical. And to the{" "}
              <strong>Nairobi Street Food Festival organizers</strong>—thank you
              for creating a space where street vendors like us can shine and
              connect with our community. The 10th edition will forever be in
              our hearts.
            </p>

            <p
              style={{
                fontSize: "1.1rem",
                lineHeight: "1.9",
                color: "var(--pb-ivory2)",
                marginBottom: "1rem",
              }}
            >
              We're already counting down to the 11th edition. See you there!
              Until then, come find us in Ruiru—we'll keep the smochas hot and
              the vibes even hotter.
            </p>

            <div
              style={{
                position: "absolute",
                bottom: "-15px",
                right: "30px",
                fontSize: "3rem",
                color: "#FF8C00",
                opacity: 0.3,
              }}
            >
              "
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            <div
              style={{
                fontSize: "1.2rem",
                fontWeight: "bold",
                color: "#FF8C00",
                marginBottom: "0.5rem",
              }}
            >
              The Passua Bites Crew
            </div>
            <div
              style={{
                fontFamily: "'DM Mono', monospace",
                fontSize: "0.8rem",
                color: "var(--pb-ivory3)",
                letterSpacing: "0.1em",
              }}
            >
              Opp Rainbow Resort, Ruiru
            </div>
          </div>
        </div>
      </section>

      {/* Special Message Section */}
      <section
        style={{
          padding: "6rem 2.5rem",
          textAlign: "center",
          background: "var(--pb-bg3)",
        }}
      >
        <div style={{ maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ marginBottom: "2rem" }}>To the Organizers</h2>
          <p
            style={{
              fontSize: "1.1rem",
              lineHeight: "1.8",
              color: "var(--pb-ivory2)",
              marginBottom: "3rem",
            }}
          >
            Putting on the <strong>Nairobi Street Food Festival</strong> is no
            small feat, especially with the weather throwing a curveball! Huge
            respect to the team for keeping the show running and for giving us a
            platform to serve the people of Nairobi. We're already counting down
            to the next one!
          </p>
          <div
            style={{
              display: "inline-block",
              padding: "1.5rem 3rem",
              border: "1px solid #FF8C00",
              color: "#FF8C00",
              fontFamily: "'DM Mono', monospace",
              fontSize: "0.8rem",
              textTransform: "uppercase",
              letterSpacing: "0.2em",
            }}
          >
            See you at the 11th Edition!
          </div>
        </div>
      </section>

      <PBFooter />
    </div>
  );
}
