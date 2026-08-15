import { Link } from "wouter";
import { LazyImage } from "./LazyImage";

const FOODFEST_DATE = "8 August 2026";
const FOODFEST_VENUE = "ASK Arena · Jamhuri Showground";

export function FoodFestSection() {
  return (
    <section
      id="foodfest"
      className="relative overflow-hidden bg-[#0a0a0a] px-4 py-20"
      aria-labelledby="foodfest-heading"
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 20%, rgba(255,107,26,0.18), transparent 34%), radial-gradient(circle at 85% 80%, rgba(196,92,40,0.16), transparent 30%)",
      }}
    >
      <div className="pointer-events-none absolute inset-0 opacity-25" aria-hidden="true">
        <div
          style={{
            position: "absolute",
            inset: "12% 8%",
            border: "1px solid rgba(255,107,26,0.28)",
            transform: "rotate(-2deg)",
          }}
        />
        <div
          style={{
            position: "absolute",
            right: "8%",
            top: "14%",
            width: 160,
            height: 160,
            border: "1px solid rgba(242,232,216,0.2)",
            borderRadius: "50%",
            animation: "spin-slow 22s linear infinite",
          }}
        />
      </div>

      <div className="relative z-10 mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="relative min-h-[300px]">
          <LazyImage
            src="/media/images/festival-doodle-1.png"
            webpSrc="/media/images/festival-doodle-1.webp"
            alt="Illustrated Passua Bites street-food serving"
            width={260}
            height={260}
            eager
            className="animate-float absolute left-4 top-3 w-[190px] select-none md:w-[250px]"
            style={{ filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.45))" }}
          />
          <LazyImage
            src="/media/images/festival-doodle-2.png"
            webpSrc="/media/images/festival-doodle-2.webp"
            alt="Illustrated festival crowd and music moment"
            width={230}
            height={230}
            className="animate-fade-in absolute bottom-0 right-2 w-[160px] select-none md:w-[220px]"
            style={{ animationDelay: "180ms", filter: "drop-shadow(0 18px 28px rgba(0,0,0,0.45))" }}
          />
          <div
            className="absolute bottom-4 left-4 rounded-full border px-4 py-2 font-mono text-[0.62rem] uppercase tracking-[0.16em]"
            style={{ borderColor: "rgba(255,107,26,0.5)", color: "#FF8C42", background: "rgba(10,10,10,0.72)" }}
          >
            Dry ground · full energy
          </div>
        </div>

        <div className="text-left">
          <div className="pb-eyebrow" style={{ color: "#FF6B1A" }}>
            Past event · 11th Edition · Playtime
          </div>
          <h2 id="foodfest-heading" className="mb-5 text-4xl font-black leading-tight text-white md:text-6xl">
            Passua Bites at the Nairobi Street Food Festival
          </h2>
          <p className="mb-7 max-w-2xl text-lg leading-relaxed text-white/70 md:text-xl">
            On 8 August, the Passua Bites team took the stall to ASK Arena at Jamhuri Showground. This time the ground stayed dry, the counter stayed busy, and the day brought exactly what a food festival should: street flavour, music, games, and community.
          </p>

          <div className="mb-8 flex flex-wrap gap-3">
            <div className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm text-white/85 backdrop-blur-md">
              {FOODFEST_DATE}
            </div>
            <div className="rounded-full border border-white/15 bg-white/[0.06] px-5 py-3 text-sm text-white/85 backdrop-blur-md">
              {FOODFEST_VENUE}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/nairobi-food-fest"
              className="inline-flex items-center gap-2 rounded-full px-7 py-3.5 font-bold text-white transition-transform hover:scale-[1.03] active:scale-[0.98]"
              style={{ background: "linear-gradient(135deg, #FF6B1A, #FF8C42)", boxShadow: "0 0 32px rgba(255,107,26,0.28)" }}
            >
              Read the recap
              <span aria-hidden="true">→</span>
            </Link>
            <a
              href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20when%20is%20the%20next%20FoodFest%3F"
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-[0.68rem] uppercase tracking-[0.14em] text-[#FF8C42] transition-colors hover:text-white"
            >
              Ask about the next one ↗
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
