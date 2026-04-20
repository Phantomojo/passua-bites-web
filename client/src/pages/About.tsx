import { Link } from "wouter";
import { PBNav, PBFooter } from "./Home";
import { trpc } from "@/lib/trpc";

const LOGO =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663257647439/2dcKibrZSdH6mbhicYbaoL/pasua_222967c7.jpeg";

export default function About() {
  const { data: displacementMessage } = trpc.location.get.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });
  return (
    <div style={{ minHeight: "100vh", background: "var(--pb-bg)" }}>
      <PBNav />

      {/* Hero */}
      <section
        style={{
          padding: "5rem 2.5rem 4rem",
          borderBottom: "1px solid var(--pb-rule)",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "center",
        }}
      >
        <div>
          <div className="pb-eyebrow">Who we are</div>
          <h1
            style={{
              fontFamily: "'Playfair Display',serif",
              fontSize: "clamp(2.5rem,4vw,4rem)",
              fontWeight: 900,
              lineHeight: 0.95,
              color: "var(--pb-ivory)",
              marginBottom: "1.5rem",
            }}
          >
            Born in Ruiru.
            <br />
            <span style={{ color: "var(--pb-ember)", fontStyle: "italic" }}>
              Built on flavour.
            </span>
          </h1>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--pb-ivory3)",
              lineHeight: 1.8,
              fontWeight: 300,
              marginBottom: "1rem",
            }}
          >
            Passua Bites was born from a passion for quality street food and a
            commitment to serving the Ruiru community with the best smochas,
            smokies, and daily bites. What started as a simple dream has grown
            into a beloved local staple.
          </p>
          <p
            style={{
              fontSize: "0.9rem",
              color: "var(--pb-ivory3)",
              lineHeight: 1.8,
              fontWeight: 300,
              marginBottom: "2rem",
            }}
          >
            Every item on our menu is carefully prepared with fresh, quality
            ingredients. Great food doesn't have to be complicated — it just
            needs to be made with care and passion. We're proud of every plate.
          </p>
          <div style={{ display: "flex", gap: "0.75rem" }}>
            <Link href="/menu" className="pb-btn-primary">
              Try Our Menu
            </Link>
            <a
              href="https://wa.me/254722473873"
              target="_blank"
              rel="noopener noreferrer"
              className="pb-btn-ghost"
            >
              WhatsApp Us
            </a>
          </div>
        </div>
        <div style={{ position: "relative" }}>
          <img
            src={LOGO}
            alt="Passua Bites"
            style={{
              width: "100%",
              aspectRatio: "1",
              objectFit: "cover",
              filter: "sepia(10%) saturate(80%)",
              border: "1px solid var(--pb-rule)",
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: "1.5rem",
              left: "1.5rem",
              background: "rgba(13,9,6,0.9)",
              border: "1px solid rgba(196,92,40,0.4)",
              padding: "0.75rem 1rem",
              backdropFilter: "blur(12px)",
            }}
          >
            <div
              style={{
                fontFamily: "'DM Mono',monospace",
                fontSize: "0.58rem",
                letterSpacing: "0.18em",
                color: "var(--pb-ember)",
                textTransform: "uppercase",
                marginBottom: "0.2rem",
              }}
            >
              Base
            </div>
            <div
              style={{
                fontSize: "0.82rem",
                color: "var(--pb-ivory)",
                fontWeight: 300,
              }}
            >
              Opp Rainbow Resort, Ruiru
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section
        style={{
          padding: "4rem 2.5rem",
          borderBottom: "1px solid var(--pb-rule2)",
        }}
      >
        <div className="pb-eyebrow">What we stand for</div>
        <h2
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "1.9rem",
            fontWeight: 700,
            marginBottom: "2rem",
          }}
        >
          Our Values
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))",
            gap: "1px",
            background: "var(--pb-rule2)",
          }}
        >
          {[
            {
              label: "Quality first",
              body: "We never compromise on ingredients or preparation. Every customer deserves the best.",
            },
            {
              label: "Customer care",
              body: "Your satisfaction is our priority. We listen and continuously improve.",
            },
            {
              label: "Community spirit",
              body: "Proud to be part of the Ruiru community. Committed to local growth.",
            },
            {
              label: "Hustle & heart",
              body: "Built from the ground up. Every day we show up and cook with intent.",
            },
          ].map(v => (
            <div
              key={v.label}
              style={{ background: "var(--pb-bg2)", padding: "2rem 1.5rem" }}
            >
              <div
                style={{
                  fontFamily: "'DM Mono',monospace",
                  fontSize: "0.62rem",
                  letterSpacing: "0.15em",
                  color: "var(--pb-ember)",
                  textTransform: "uppercase",
                  marginBottom: "0.7rem",
                }}
              >
                {v.label}
              </div>
              <p
                style={{
                  fontSize: "0.84rem",
                  color: "var(--pb-ivory3)",
                  lineHeight: 1.7,
                  fontWeight: 300,
                }}
              >
                {v.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Displacement story */}
      <section style={{ padding: "4rem 2.5rem" }}>
        <div className="pb-alert" style={{ margin: 0 }}>
          <div className="pb-alert-icon" />
          <div>
            <div className="pb-alert-label">Still here</div>
            <div className="pb-alert-text" style={{ fontSize: "0.9rem" }}>
              {displacementMessage ||
                "Our original spot was displaced by road expansion — but Passua Bites is not going anywhere. We've moved online so our customers can always find us. This website is proof of that. Order from wherever you are."}
            </div>
          </div>
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
        <h2
          style={{
            fontFamily: "'Playfair Display',serif",
            fontSize: "2rem",
            marginBottom: "1rem",
          }}
        >
          Ready to experience Passua Bites?
        </h2>
        <p
          style={{
            fontSize: "0.9rem",
            color: "var(--pb-ivory3)",
            fontWeight: 300,
            marginBottom: "2rem",
          }}
        >
          Visit us or order online for delivery
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
            Order Now
          </Link>
          <Link href="/contact" className="pb-btn-ghost">
            Find Us
          </Link>
          <a
            href="https://food.bolt.eu/en/320-nairobi/p/170268-passua-bites/"
            target="_blank"
            rel="noopener noreferrer"
            className="pb-btn-ghost"
          >
            Bolt Food
          </a>
        </div>
      </section>

      <PBFooter />
    </div>
  );
}
