/**
 * FoodFest Section — Passua Bites
 *
 * Fully optimized version with:
 * - WebP images with JPEG fallback
 * - Lazy loading via IntersectionObserver
 * - Reduced motion support
 * - Ember/abyss palette from the Passua brand
 */

import { LazyImage } from "./LazyImage";

const FOODFEST_DATE = "June 21, 2025";
const FOODFEST_VENUE = "Ruiru Town Square";

export function FoodFestSection() {
  return (
    <section
      id="foodfest"
      className="relative overflow-hidden bg-[#0a0a0a] py-20 px-4"
      style={{ "--ember": "#FF6B1A", "--abyss": "#0a0a0a" } as React.CSSProperties}
    >
      {/* ── Background: fireworks hero image ───────────────────── */}
      <div className="absolute inset-0 z-0">
        <LazyImage
          src="/media/images/fireworks-rain.jpg"
          webpSrc="/media/images/fireworks-rain.webp"
          alt=""
          aria-hidden="true"
          eager                          // Above the fold → load immediately
          className="w-full h-full object-cover"
          style={{ opacity: 0.35 }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to bottom, rgba(10,10,10,0.6) 0%, rgba(10,10,10,0.3) 50%, rgba(10,10,10,0.85) 100%)",
          }}
        />
      </div>

      {/* ── Doodle decorations ─────────────────────────────────── */}
      <div className="absolute top-8 left-4 z-0 pointer-events-none opacity-60">
        <LazyImage
          src="/media/images/festival-doodle-1.png"
          webpSrc="/media/images/festival-doodle-1.webp"
          alt=""
          aria-hidden="true"
          width={200}
          height={200}
          className="w-[140px] md:w-[200px] select-none"
        />
      </div>
      <div className="absolute bottom-8 right-4 z-0 pointer-events-none opacity-60">
        <LazyImage
          src="/media/images/festival-doodle-2.png"
          webpSrc="/media/images/festival-doodle-2.webp"
          alt=""
          aria-hidden="true"
          width={200}
          height={200}
          className="w-[140px] md:w-[200px] select-none"
        />
      </div>

      {/* ── Content ────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-3xl mx-auto text-center">
        {/* Badge */}
        <span
          className="inline-block mb-4 px-4 py-1.5 rounded-full text-xs font-semibold tracking-widest uppercase"
          style={{
            background: "rgba(255,107,26,0.15)",
            border: "1px solid rgba(255,107,26,0.4)",
            color: "#FF6B1A",
          }}
        >
          🔥 Coming Soon
        </span>

        {/* Headline */}
        <h2
          className="text-4xl md:text-6xl font-black text-white mb-4 leading-tight"
          style={{ letterSpacing: "-0.02em" }}
        >
          Passua&nbsp;
          <span style={{ color: "#FF6B1A" }}>FoodFest</span>
          &nbsp;2025
        </h2>

        {/* Tagline */}
        <p className="text-lg md:text-xl text-white/70 mb-8 leading-relaxed">
          Ruiru's biggest street food celebration. One night, one spot, all the
          smochas, burgers &amp; combos you can handle.
        </p>

        {/* Date / Venue pills */}
        <div className="flex flex-wrap gap-3 justify-center mb-10">
          <div
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white"
            style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
          >
            <span>📅</span>
            <span>{FOODFEST_DATE}</span>
          </div>
          <div
            className="flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium text-white"
            style={{ background: "rgba(255,255,255,0.08)", backdropFilter: "blur(8px)" }}
          >
            <span>📍</span>
            <span>{FOODFEST_VENUE}</span>
          </div>
        </div>

        {/* CTA */}
        <a
          href="https://wa.me/254XXXXXXXXX?text=I%20want%20to%20know%20more%20about%20Passua%20FoodFest%202025"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white text-base transition-all hover:scale-105 active:scale-95"
          style={{
            background: "linear-gradient(135deg, #FF6B1A, #FF8C42)",
            boxShadow: "0 0 32px rgba(255,107,26,0.4)",
          }}
        >
          Get Notified on WhatsApp
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
        </a>
      </div>
    </section>
  );
}

/*
 * NOTE: Replace the WhatsApp number (254XXXXXXXXX) with the real one.
 *
 * WebP files to add to /client/public/media/images/:
 *   fireworks-rain.webp    ← from optimized/images/ in the zip
 *   festival-doodle-1.webp ← from optimized/images/ in the zip
 *   festival-doodle-2.webp ← from optimized/images/ in the zip
 *
 * These are the exact files in the optimized/ folder — just copy them to
 * client/public/media/images/ alongside the originals. Browsers that
 * support WebP (every modern browser) will pick the .webp automatically;
 * older ones fall back to the JPEG/PNG.
 */
