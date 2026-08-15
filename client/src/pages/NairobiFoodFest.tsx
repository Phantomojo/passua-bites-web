import { Link } from "wouter";
import { LazyImage } from "../LazyImage";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PBNav, PBFooter } from "./Home";

const EVENT = {
  name: "Nairobi Street Food Festival",
  edition: "11th Edition — Playtime",
  date: "8 August 2026",
  venue: "ASK Arena, Jamhuri Showground",
  hours: "Morning until late",
};

const SOURCES = [
  {
    label: "Event guide",
    href: "https://nairobieventsguide.com/event/nairobi-street-food-festival-playtime-edition/",
  },
  {
    label: "Capital FM recap",
    href: "https://capitalfm.africa/flavor-fashion-and-games-why-the-nairobi-street-food-festival-was-the-ultimate-weekend-hangout/",
  },
  {
    label: "Passua Bites’ festival post",
    href: "https://www.instagram.com/passuabites/reel/Dbqe6TkOfYN/",
  },
];

const eventDetails = [
  { label: "Edition", value: "11th · Playtime" },
  { label: "Date", value: EVENT.date },
  { label: "Venue", value: EVENT.venue },
  { label: "Format", value: "Food · music · games · community" },
];

const recapCards = [
  {
    index: "01",
    title: "The stall came with us",
    text: "Passua Bites took its Ruiru street-food spirit to Nairobi with the team, the counter, and the flavours that make a smocha stop feel like home.",
    accent: "#FF6B1A",
  },
  {
    index: "02",
    title: "Playtime meant movement",
    text: "The festival brought together food vendors, DJs, interactive games, street style, and a crowd ready to move between bites and new experiences.",
    accent: "#FF8C42",
  },
  {
    index: "03",
    title: "A dry-day memory",
    text: "Unlike the previous edition, there was no rain to plan around this time. Open ground, clean movement, and a full day to enjoy the stall made the difference.",
    accent: "#E8C99B",
  },
];

function Arrow() {
  return <span aria-hidden="true" style={{ fontSize: "1.1em" }}>→</span>;
}

export default function NairobiFoodFest() {
  usePageMeta({
    title: "Nairobi Street Food Festival — Passua Bites",
    description:
      "Passua Bites at the Nairobi Street Food Festival Playtime Edition on 8 August 2026 at ASK Arena, Jamhuri Showground.",
  });

  return (
    <div style={{ minHeight: "100vh", background: "var(--pb-bg)", color: "var(--pb-ivory)" }}>
      <PBNav />

      <main>
        <section
          style={{
            position: "relative",
            overflow: "hidden",
            padding: "clamp(5rem, 12vw, 9rem) 2.5rem clamp(4rem, 9vw, 7rem)",
            background:
              "radial-gradient(circle at 78% 22%, rgba(255,107,26,0.24), transparent 27%), linear-gradient(135deg, #160d08 0%, var(--pb-bg) 52%, #21150f 100%)",
            borderBottom: "1px solid rgba(255,107,26,0.35)",
          }}
        >
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              opacity: 0.25,
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage: "linear-gradient(to bottom, black, transparent)",
            }}
          />
          <div
            aria-hidden="true"
            style={{
              position: "absolute",
              right: "-7rem",
              top: "-7rem",
              width: "24rem",
              height: "24rem",
              border: "1px solid rgba(255,140,66,0.35)",
              borderRadius: "50%",
              animation: "spin-slow 24s linear infinite",
            }}
          />

          <div
            className="pb-grid-mobile"
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "1.08fr 0.92fr",
              gap: "4rem",
              alignItems: "center",
              maxWidth: 1180,
              margin: "0 auto",
            }}
          >
            <div>
              <div className="pb-eyebrow animate-fade-in" style={{ color: "#FF8C42" }}>
                {EVENT.name} · {EVENT.edition}
              </div>
              <h1
                className="animate-letter-drop"
                style={{
                  margin: "1rem 0 1.5rem",
                  fontSize: "clamp(2.8rem, 7vw, 6.4rem)",
                  lineHeight: 0.98,
                  letterSpacing: "-0.045em",
                  maxWidth: 760,
                }}
              >
                A dry day. A full stall. <span style={{ color: "#FF6B1A" }}>Pure Nairobi energy.</span>
              </h1>
              <p
                className="animate-fade-in"
                style={{
                  animationDelay: "180ms",
                  maxWidth: 690,
                  color: "var(--pb-ivory2)",
                  fontSize: "clamp(1rem, 2vw, 1.25rem)",
                  lineHeight: 1.75,
                  fontWeight: 300,
                }}
              >
                On 8 August 2026, Passua Bites brought the stall to the Nairobi Street Food Festival’s Playtime Edition at ASK Arena, Jamhuri Showground. This time, there was no rain to negotiate—just open ground, good food, music, games, and people ready for a proper festival day.
              </p>
              <div className="animate-fade-in" style={{ animationDelay: "320ms", display: "flex", flexWrap: "wrap", gap: "0.85rem", marginTop: "2rem" }}>
                <Link href="/menu" className="pb-btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
                  Order the festival favourites <Arrow />
                </Link>
                <a href="#recap" className="pb-btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: "0.6rem", textDecoration: "none" }}>
                  Read the recap <Arrow />
                </a>
              </div>
            </div>

            <div className="animate-fade-in" style={{ animationDelay: "220ms", position: "relative", minHeight: 390 }}>
              <div
                style={{
                  position: "absolute",
                  inset: "1rem 0 0 1rem",
                  border: "1px solid rgba(255,107,26,0.45)",
                  transform: "rotate(3deg)",
                }}
              />
              <div
                style={{
                  position: "relative",
                  minHeight: 360,
                  padding: "2rem",
                  background: "linear-gradient(160deg, rgba(255,107,26,0.18), rgba(20,14,10,0.95) 64%)",
                  border: "1px solid rgba(255,255,255,0.16)",
                  boxShadow: "0 26px 80px rgba(0,0,0,0.32)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
                  <div className="pb-eyebrow" style={{ color: "#E8C99B" }}>Field note / 02</div>
                  <div style={{ color: "#FF6B1A", fontFamily: "'DM Mono',monospace", fontSize: "0.72rem", letterSpacing: "0.12em" }}>PB × NSF</div>
                </div>
                <div style={{ position: "relative", minHeight: 210, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <LazyImage
                    src="/media/images/festival-doodle-1.png"
                    webpSrc="/media/images/festival-doodle-1.webp"
                    alt="Passua Bites illustrated festival serving"
                    width={280}
                    height={280}
                    eager
                    className="animate-float"
                    style={{ width: "min(75%, 280px)", filter: "drop-shadow(0 20px 24px rgba(0,0,0,0.4))" }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      right: "2%",
                      bottom: "5%",
                      padding: "0.7rem 0.85rem",
                      background: "var(--pb-ivory)",
                      color: "var(--pb-bg)",
                      fontFamily: "'DM Mono',monospace",
                      fontSize: "0.58rem",
                      letterSpacing: "0.1em",
                      textTransform: "uppercase",
                      transform: "rotate(-5deg)",
                    }}
                  >
                    No rain. All flavour.
                  </div>
                </div>
                <div style={{ borderTop: "1px solid rgba(255,255,255,0.16)", paddingTop: "1rem" }}>
                  <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.65rem", fontWeight: 700 }}>Ruiru to Nairobi</div>
                  <div style={{ color: "var(--pb-ivory3)", fontSize: "0.78rem", marginTop: "0.35rem" }}>The same street-food soul, a new crowd to feed.</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "1rem 2.5rem", background: "#FF6B1A", color: "#160d08" }} aria-label="Festival details">
          <div style={{ maxWidth: 1180, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1px", background: "rgba(22,13,8,0.22)" }}>
            {eventDetails.map(detail => (
              <div key={detail.label} style={{ padding: "1rem 1.1rem", background: "#FF6B1A" }}>
                <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", textTransform: "uppercase", letterSpacing: "0.12em", opacity: 0.68, marginBottom: "0.35rem" }}>{detail.label}</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 700 }}>{detail.value}</div>
              </div>
            ))}
          </div>
        </section>

        <section id="recap" style={{ padding: "clamp(4rem, 9vw, 7rem) 2.5rem", maxWidth: 1180, margin: "0 auto" }}>
          <div style={{ maxWidth: 720, marginBottom: "3rem" }}>
            <div className="pb-eyebrow" style={{ color: "#FF8C42" }}>The second FoodFest of 2026</div>
            <h2 style={{ margin: "0.75rem 0 1.1rem", fontSize: "clamp(2.1rem, 5vw, 4rem)", lineHeight: 1.03 }}>
              The stall was part of the <span style={{ color: "#FF6B1A" }}>story.</span>
            </h2>
            <p style={{ color: "var(--pb-ivory3)", lineHeight: 1.8, fontWeight: 300, fontSize: "1rem" }}>
              The Playtime Edition was built around Nairobi’s food, culture, and social energy. For Passua Bites, it was another chance to take the Ruiru kitchen out into the city and meet people one order, one conversation, and one bite at a time.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1px", background: "var(--pb-rule2)" }}>
            {recapCards.map(card => (
              <article key={card.index} className="animate-fade-in" style={{ animationDelay: `${Number(card.index) * 100}ms`, minHeight: 285, padding: "2rem", background: "var(--pb-bg2)", borderTop: `3px solid ${card.accent}`, position: "relative", overflow: "hidden" }}>
                <div style={{ fontFamily: "'DM Mono',monospace", color: card.accent, fontSize: "0.65rem", letterSpacing: "0.16em" }}>{card.index}</div>
                <h3 style={{ margin: "2.6rem 0 0.85rem", fontSize: "1.45rem" }}>{card.title}</h3>
                <p style={{ color: "var(--pb-ivory3)", lineHeight: 1.75, fontSize: "0.9rem", fontWeight: 300 }}>{card.text}</p>
                <div aria-hidden="true" style={{ position: "absolute", right: "-1.5rem", bottom: "-2.5rem", width: 110, height: 110, border: `1px solid ${card.accent}`, borderRadius: "50%", opacity: 0.18 }} />
              </article>
            ))}
          </div>
        </section>

        <section style={{ padding: "clamp(4rem, 9vw, 7rem) 2.5rem", background: "var(--pb-bg3)", borderTop: "1px solid var(--pb-rule2)", borderBottom: "1px solid var(--pb-rule2)" }}>
          <div className="pb-grid-mobile" style={{ display: "grid", gridTemplateColumns: "0.85fr 1.15fr", gap: "4rem", maxWidth: 1180, margin: "0 auto", alignItems: "center" }}>
            <div style={{ position: "relative", minHeight: 350 }}>
              <LazyImage
                src="/media/images/festival-doodle-2.png"
                webpSrc="/media/images/festival-doodle-2.webp"
                alt="Illustrated Passua Bites festival crowd moment"
                width={300}
                height={300}
                className="animate-float"
                style={{ width: "min(100%, 300px)", display: "block", margin: "0 auto", filter: "drop-shadow(0 20px 30px rgba(0,0,0,0.35))" }}
              />
              <div style={{ position: "absolute", right: "4%", bottom: "8%", padding: "0.7rem 0.9rem", background: "#E8C99B", color: "var(--pb-bg)", fontFamily: "'DM Mono',monospace", fontSize: "0.58rem", letterSpacing: "0.1em", textTransform: "uppercase", transform: "rotate(4deg)" }}>
                Playtime edition
              </div>
            </div>
            <div>
              <div className="pb-eyebrow" style={{ color: "#FF8C42" }}>What the day felt like</div>
              <h2 style={{ margin: "0.8rem 0 1.25rem", fontSize: "clamp(2rem, 5vw, 3.8rem)", lineHeight: 1.05 }}>
                Food first. <span style={{ color: "#FF6B1A" }}>Community always.</span>
              </h2>
              <p style={{ color: "var(--pb-ivory2)", lineHeight: 1.85, fontWeight: 300, fontSize: "1rem" }}>
                Public coverage of the event described a lively marketplace of street-food vendors, chefs, music, interactive games, and Nairobi street style. The dry weather made this edition feel open and easy: people could move, explore, eat, and stay in the moment.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.7rem", marginTop: "2rem" }}>
                {["Street food", "Live sound", "Open ground"].map((label, index) => (
                  <div key={label} style={{ padding: "0.9rem 0.7rem", borderLeft: `2px solid ${index === 1 ? "#E8C99B" : "#FF6B1A"}`, background: "rgba(255,255,255,0.03)" }}>
                    <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.57rem", color: "var(--pb-ivory3)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ padding: "clamp(4rem, 9vw, 7rem) 2.5rem", maxWidth: 980, margin: "0 auto" }}>
          <div style={{ padding: "clamp(2rem, 6vw, 4rem)", border: "1px solid rgba(255,107,26,0.42)", background: "linear-gradient(145deg, rgba(255,107,26,0.08), rgba(255,255,255,0.02))", position: "relative" }}>
            <div aria-hidden="true" style={{ position: "absolute", left: "1.4rem", top: "-1.4rem", fontFamily: "Georgia,serif", fontSize: "5rem", lineHeight: 1, color: "#FF6B1A", opacity: 0.35 }}>“</div>
            <div className="pb-eyebrow" style={{ color: "#FF8C42" }}>A note from the crew</div>
            <blockquote style={{ margin: "1.2rem 0 2rem", fontFamily: "'Playfair Display',serif", fontSize: "clamp(1.45rem, 3vw, 2.15rem)", lineHeight: 1.45, color: "var(--pb-ivory)" }}>
              We came with the stall and left with another reminder that good food travels. This time there was no rain—just a clear day, open space, and the kind of energy that makes you want to do the next one even bigger.
            </blockquote>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.65rem", letterSpacing: "0.14em", textTransform: "uppercase", color: "var(--pb-ivory3)" }}>Passua Bites · Ruiru to Nairobi</div>
          </div>
        </section>

        <section style={{ padding: "clamp(4rem, 8vw, 6rem) 2.5rem", textAlign: "center", background: "#FF6B1A", color: "#160d08" }}>
          <div style={{ maxWidth: 780, margin: "0 auto" }}>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.63rem", letterSpacing: "0.16em", textTransform: "uppercase", opacity: 0.72, marginBottom: "1rem" }}>Back to the kitchen</div>
            <h2 style={{ marginBottom: "1rem", fontSize: "clamp(2.1rem, 5vw, 4rem)", color: "#160d08" }}>Still craving the stall?</h2>
            <p style={{ maxWidth: 600, margin: "0 auto 2rem", lineHeight: 1.7, color: "rgba(22,13,8,0.78)" }}>
              The festival ended, but the Ruiru kitchen is still serving the same street-food soul. Browse the menu or reach out for the next event update.
            </p>
            <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap", gap: "0.8rem" }}>
              <Link href="/menu" className="pb-btn-primary" style={{ background: "#160d08", color: "#E8C99B", borderColor: "#160d08" }}>Browse the menu <Arrow /></Link>
              <a href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20tell%20me%20about%20the%20next%20FoodFest" target="_blank" rel="noopener noreferrer" className="pb-btn-ghost" style={{ borderColor: "#160d08", color: "#160d08" }}>Ask about the next FoodFest <Arrow /></a>
            </div>
          </div>
        </section>

        <section style={{ padding: "2.5rem", background: "var(--pb-bg2)", borderTop: "1px solid var(--pb-rule2)" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <div className="pb-eyebrow" style={{ color: "#FF8C42", marginBottom: "0.8rem" }}>Event details checked against public sources</div>
            <p style={{ maxWidth: 720, color: "var(--pb-ivory3)", fontSize: "0.78rem", lineHeight: 1.7, marginBottom: "1rem" }}>
              Dates, venue, edition, and public event framing were cross-checked against the links below. The dry-weather note and Passua Bites’ stall experience are part of the team’s own recap.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem" }}>
              {SOURCES.map(source => (
                <a key={source.href} href={source.href} target="_blank" rel="noopener noreferrer" style={{ color: "#FF8C42", fontFamily: "'DM Mono',monospace", fontSize: "0.62rem", letterSpacing: "0.05em", textDecoration: "none" }}>
                  {source.label} ↗
                </a>
              ))}
            </div>
          </div>
        </section>
      </main>
      <PBFooter />
    </div>
  );
}
