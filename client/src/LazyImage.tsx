/**
 * LazyImage — drops into any component as a replacement for <img>.
 *
 * Features:
 * - Intersection Observer lazy loading (only loads when near viewport)
 * - Automatic WebP src with JPEG/PNG fallback via <picture>
 * - Placeholder blur while loading
 * - No layout shift (requires width + height or aspect-ratio CSS)
 *
 * Usage:
 *   <LazyImage
 *     src="/media/images/fireworks-rain.jpg"
 *     webpSrc="/media/images/fireworks-rain.webp"  // optional
 *     alt="Fireworks at Passua FoodFest"
 *     width={1920}
 *     height={1080}
 *     className="w-full object-cover"
 *   />
 */

import { useEffect, useRef, useState } from "react";

interface LazyImageProps {
  src: string;                    // JPEG/PNG fallback
  webpSrc?: string;               // WebP version (preferred by browsers that support it)
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
  /** Load immediately without waiting for viewport (use for above-the-fold images) */
  eager?: boolean;
  /** Placeholder color shown while loading */
  placeholderColor?: string;
}

export function LazyImage({
  src,
  webpSrc,
  alt,
  width,
  height,
  className = "",
  style,
  eager = false,
  placeholderColor = "#1a1a1a",
}: LazyImageProps) {
  const ref = useRef<HTMLPictureElement>(null);
  const [isVisible, setIsVisible] = useState(eager);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (eager || !ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      {
        // Start loading 400px before the image enters the viewport
        rootMargin: "400px",
        threshold: 0,
      }
    );

    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [eager]);

  return (
    <picture
      ref={ref}
      style={{
        display: "block",
        backgroundColor: isLoaded ? "transparent" : placeholderColor,
        transition: "background-color 0.3s ease",
        ...style,
      }}
    >
      {/* WebP source — browsers pick this if they support it */}
      {webpSrc && isVisible && (
        <source srcSet={webpSrc} type="image/webp" />
      )}

      {/* Fallback JPEG/PNG */}
      <img
        src={isVisible ? src : undefined}
        alt={alt}
        width={width}
        height={height}
        loading={eager ? "eager" : "lazy"}
        decoding="async"
        className={className}
        onLoad={() => setIsLoaded(true)}
        style={{
          opacity: isLoaded ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />
    </picture>
  );
}

// ─── Lazy Video ───────────────────────────────────────────────────────────────

/**
 * LazyVideo — only loads + plays when scrolled into view.
 * Significantly reduces mobile data usage for below-the-fold videos.
 *
 * Usage:
 *   <LazyVideo
 *     mp4Src="/media/videos/Sultan.mp4"
 *     className="w-full h-full object-cover"
 *   />
 */

interface LazyVideoProps {
  mp4Src: string;
  posterSrc?: string;
  className?: string;
  style?: React.CSSProperties;
  muted?: boolean;
  loop?: boolean;
  playsInline?: boolean;
}

export function LazyVideo({
  mp4Src,
  posterSrc,
  className = "",
  style,
  muted = true,
  loop = true,
  playsInline = true,
}: LazyVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          // Auto-play when visible
          el.play().catch(() => {
            // Autoplay blocked — muted videos should be fine, but catch anyway
          });
        } else {
          // Pause when scrolled out to save CPU/battery
          el.pause();
        }
      },
      { rootMargin: "200px", threshold: 0.1 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <video
      ref={videoRef}
      muted={muted}
      loop={loop}
      playsInline={playsInline}
      poster={posterSrc}
      preload="none"         // ← Key: don't download anything until visible
      className={className}
      style={style}
    >
      {/* Only inject <source> tags once visible, triggering the load */}
      {isVisible && (
        <source src={mp4Src} type="video/mp4" />
      )}
    </video>
  );
}
