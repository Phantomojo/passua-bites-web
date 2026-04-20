import { Link } from "wouter";
import { PBNav } from "./Home";

export default function NotFound() {
  return (
    <div style={{ minHeight:"100vh", background:"var(--pb-bg)" }}>
      <PBNav />
      <div style={{ padding:"8rem 2.5rem", textAlign:"center" }}>
        <div style={{ fontFamily:"'DM Mono',monospace", fontSize:"0.62rem", letterSpacing:"0.2em", color:"var(--pb-ember)", textTransform:"uppercase", marginBottom:"1rem" }}>404 — Lost</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(3rem,6vw,6rem)", fontWeight:900, lineHeight:0.9, color:"var(--pb-ivory)", marginBottom:"1.5rem" }}>
          Page not<br /><span style={{ color:"var(--pb-ember)", fontStyle:"italic" }}>found.</span>
        </h1>
        <p style={{ fontSize:"0.9rem", color:"var(--pb-ivory3)", fontWeight:300, marginBottom:"2.5rem" }}>The page you're looking for doesn't exist. Maybe you're hungry?</p>
        <div style={{ display:"flex", gap:"0.75rem", justifyContent:"center" }}>
          <Link href="/" className="pb-btn-primary">Go Home</Link>
          <Link href="/menu" className="pb-btn-ghost">View Menu</Link>
        </div>
      </div>
    </div>
  );
}
