import { useState, useEffect } from "react";
import { PBNav, PBFooter } from "./Home";
import { toast } from "sonner";

export default function Reviews() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [avgRating, setAvgRating] = useState({ average: 0, count: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({ customerName: "", rating: 5, reviewText: "" });
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchReviews();
  }, []);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const [reviewsRes, ratingRes] = await Promise.all([
        fetch("/api/trpc/reviews.list"),
        fetch("/api/trpc/reviews.getAverageRating"),
      ]);
      const reviewsData = await reviewsRes.json();
      const ratingData = await ratingRes.json();
      setReviews(reviewsData.result?.data?.json || []);
      setAvgRating(ratingData.result?.data?.json || { average: 0, count: 0 });
    } catch {
      toast.error("Failed to load reviews");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName || formData.rating < 1) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/trpc/reviews.create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          json: {
            customerName: formData.customerName,
            rating: formData.rating,
            reviewText: formData.reviewText || undefined,
          },
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error.message);
      setSubmitted(true);
      toast.success("Review submitted! It will appear after moderation.");
      setFormData({ customerName: "", rating: 5, reviewText: "" });
    } catch (err: any) {
      toast.error(err.message || "Failed to submit review");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--pb-bg)" }}>
      <PBNav />

      <div className="pb-section-mobile" style={{ padding: "3rem 2.5rem" }}>
        <div className="pb-eyebrow">What people say</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, marginBottom: "1rem" }}>
          Reviews
        </h1>

        {/* Average rating */}
        {avgRating.count > 0 && (
          <div style={{ background: "var(--pb-bg2)", border: "1px solid var(--pb-rule)", padding: "1.5rem", marginBottom: "2.5rem", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "3rem", fontWeight: 900, color: "var(--pb-ember)" }}>
                {avgRating.average}
              </div>
              <div style={{ color: "var(--pb-ember)", fontSize: "1.1rem" }}>
                {"★".repeat(Math.round(avgRating.average))}{"☆".repeat(5 - Math.round(avgRating.average))}
              </div>
            </div>
            <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.65rem", color: "var(--pb-ivory3)", letterSpacing: "0.05em" }}>
              Based on {avgRating.count} review{avgRating.count !== 1 ? "s" : ""}
            </div>
          </div>
        )}

        {/* Review form */}
        <div style={{ background: "var(--pb-bg2)", border: "1px solid var(--pb-rule)", padding: "2rem", marginBottom: "2.5rem" }}>
          <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, marginBottom: "1.5rem" }}>
            Leave a Review
          </h2>
          {submitted ? (
            <div style={{ textAlign: "center", padding: "2rem" }}>
              <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", color: "var(--pb-ember)", marginBottom: "0.75rem" }}>
                Thank you!
              </div>
              <p style={{ fontSize: "0.85rem", color: "var(--pb-ivory3)", fontWeight: 300 }}>
                Your review will appear here after moderation.
              </p>
              <button onClick={() => setSubmitted(false)} className="pb-btn-ghost" style={{ marginTop: "1rem", padding: "0.5rem 1.5rem", cursor: "pointer" }}>
                Write Another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
              <div>
                <label style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--pb-ember)", textTransform: "uppercase", marginBottom: "0.4rem", display: "block" }}>
                  Your name *
                </label>
                <input
                  type="text"
                  value={formData.customerName}
                  onChange={(e) => setFormData((p) => ({ ...p, customerName: e.target.value }))}
                  placeholder="e.g. John K."
                  required
                  style={{ width: "100%", padding: "0.65rem 0.8rem", fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem" }}
                />
              </div>
              <div>
                <label style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--pb-ember)", textTransform: "uppercase", marginBottom: "0.4rem", display: "block" }}>
                  Rating *
                </label>
                <div style={{ display: "flex", gap: "0.3rem" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData((p) => ({ ...p, rating: star }))}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        fontSize: "1.8rem",
                        color: star <= formData.rating ? "var(--pb-ember)" : "var(--pb-ivory3)",
                        padding: "0.2rem",
                        transition: "color 0.15s",
                        minHeight: 44,
                        minWidth: 44,
                      }}
                    >
                      {star <= formData.rating ? "★" : "☆"}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.15em", color: "var(--pb-ember)", textTransform: "uppercase", marginBottom: "0.4rem", display: "block" }}>
                  Your review
                </label>
                <textarea
                  value={formData.reviewText}
                  onChange={(e) => setFormData((p) => ({ ...p, reviewText: e.target.value }))}
                  placeholder="Tell us about your experience..."
                  rows={4}
                  style={{ width: "100%", padding: "0.65rem 0.8rem", fontFamily: "'DM Sans',sans-serif", fontSize: "0.85rem", resize: "vertical" }}
                />
              </div>
              <button type="submit" className="pb-btn-primary" style={{ padding: "0.75rem", cursor: isSubmitting ? "not-allowed" : "pointer", width: "100%", opacity: isSubmitting ? 0.6 : 1 }}>
                {isSubmitting ? "Submitting..." : "Submit Review"}
              </button>
            </form>
          )}
        </div>

        {/* Reviews list */}
        <div>
          <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.62rem", letterSpacing: "0.15em", color: "var(--pb-ember)", textTransform: "uppercase", marginBottom: "1.2rem" }}>
            Customer Reviews
          </div>
          {isLoading && (
            <div style={{ textAlign: "center", padding: "2rem", color: "var(--pb-ivory3)" }}>Loading reviews...</div>
          )}
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", background: "var(--pb-rule2)" }}>
            {reviews.map((r: any) => (
              <div key={r.id} style={{ background: "var(--pb-bg2)", padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                  <div>
                    <div style={{ fontSize: "0.88rem", color: "var(--pb-ivory)", fontWeight: 500 }}>{r.customerName}</div>
                    <div style={{ color: "var(--pb-ember)", fontSize: "0.9rem", marginTop: "0.2rem" }}>
                      {"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontSize: "0.6rem", color: "var(--pb-ivory3)" }}>
                    {new Date(r.createdAt).toLocaleDateString()}
                  </div>
                </div>
                {r.reviewText && (
                  <div style={{ fontSize: "0.82rem", color: "var(--pb-ivory2)", lineHeight: 1.6, fontStyle: "italic" }}>
                    "{r.reviewText}"
                  </div>
                )}
              </div>
            ))}
            {!isLoading && reviews.length === 0 && (
              <div style={{ background: "var(--pb-bg2)", padding: "2rem", textAlign: "center", color: "var(--pb-ivory3)" }}>
                <div style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.2rem", color: "var(--pb-ivory3)", marginBottom: "0.5rem" }}>
                  No reviews yet
                </div>
                <p style={{ fontSize: "0.82rem" }}>Be the first to share your experience!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating WhatsApp Button */}
      <a
        href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20I%27d%20like%20to%20share%20my%20experience"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contact on WhatsApp"
        style={{ position: "fixed", bottom: "1.5rem", right: "1.5rem", width: 56, height: 56, borderRadius: "50%", background: "#25D366", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(37,211,102,0.4)", zIndex: 999 }}
      >
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
        </svg>
      </a>

      <PBFooter />
    </div>
  );
}
