import { useState } from "react";
import { PBNav, PBFooter } from "./Home";
import { Link } from "wouter";

export default function Contact() {
  const [formData, setFormData] = useState({ name:"", email:"", phone:"", message:"" });
  const [sent, setSent] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement|HTMLTextAreaElement>) =>
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
  };

  const infoStyle = { background:"var(--pb-bg2)", border:"1px solid var(--pb-rule)", padding:"1.5rem" };
  const labelStyle = { fontFamily:"'DM Mono',monospace", fontSize:"0.6rem", letterSpacing:"0.18em", color:"var(--pb-ember)", textTransform:"uppercase" as const, marginBottom:"0.5rem", display:"block" };
  const valueStyle = { fontSize:"0.9rem", color:"var(--pb-ivory)", fontWeight:300, lineHeight:1.65 };

  return (
    <div style={{ minHeight:"100vh", background:"var(--pb-bg)" }}>
      <PBNav />

      <section className="pb-section-mobile" style={{ padding:"4rem 2.5rem", borderBottom:"1px solid var(--pb-rule)" }}>
        <div className="pb-eyebrow">Get in touch</div>
        <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(2rem,4vw,3.5rem)", fontWeight:900, marginBottom:"3rem" }}>Contact Us</h1>

        <div className="pb-grid-mobile" style={{ display:"grid", gridTemplateColumns:"1fr 1.2fr", gap:"3rem", alignItems:"flex-start" }}>
          {/* Info column */}
          <div style={{ display:"flex", flexDirection:"column", gap:"1px", background:"var(--pb-rule2)" }}>
            <div style={infoStyle}>
              <div style={labelStyle}>Location</div>
              <div style={valueStyle}>Opp Rainbow Resort, Ruiru</div>
              <div style={{ fontSize:"0.78rem", color:"var(--pb-ivory3)", marginTop:"0.35rem", fontWeight:300 }}>Find us opposite Rainbow Resort in Ruiru. Easy to locate — always ready to serve.</div>
            </div>
            <div style={infoStyle}>
              <div style={labelStyle}>Phone</div>
              <a href="tel:0722473873" style={{ ...valueStyle, color:"var(--pb-ember)", textDecoration:"none" }}>0722 473 873</a>
              <div style={{ fontSize:"0.78rem", color:"var(--pb-ivory3)", marginTop:"0.35rem", fontWeight:300 }}>Call for quick orders or inquiries during business hours.</div>
            </div>
            <div style={{ ...infoStyle, borderLeft:"3px solid var(--pb-ember)" }}>
              <div style={labelStyle}>WhatsApp</div>
              <a href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20I%27d%20like%20to%20place%20an%20order" target="_blank" rel="noopener noreferrer" style={{ ...valueStyle, color:"var(--pb-ember)", textDecoration:"none" }}>Message us on WhatsApp ↗</a>
              <div style={{ fontSize:"0.78rem", color:"var(--pb-ivory3)", marginTop:"0.35rem", fontWeight:300 }}>Fastest way to order. We respond quickly.</div>
            </div>
            <div style={infoStyle}>
              <div style={labelStyle}>Business Hours</div>
              {[["Mon – Fri", "10:00 AM – 10:00 PM"],["Saturday", "10:00 AM – 11:00 PM"],["Sunday", "11:00 AM – 9:00 PM"]].map(([day, hrs]) => (
                <div key={day} style={{ display:"flex", justifyContent:"space-between", fontSize:"0.8rem", color:"var(--pb-ivory3)", padding:"0.3rem 0", borderBottom:"1px solid var(--pb-rule2)", fontWeight:300 }}>
                  <span>{day}</span><span style={{ color:"var(--pb-ivory2)" }}>{hrs}</span>
                </div>
              ))}
            </div>
            <div style={{ ...infoStyle, display:"flex", flexDirection:"column", gap:"0.5rem" }}>
              <div style={labelStyle}>Quick links</div>
              <Link href="/menu" className="pb-btn-ghost" style={{ display:"block", textAlign:"center", fontSize:"0.65rem" }}>View Menu</Link>
              <a href="https://food.bolt.eu/en/320-nairobi/p/170268-passua-bites/" target="_blank" rel="noopener noreferrer" className="pb-btn-ghost" style={{ display:"block", textAlign:"center", fontSize:"0.65rem" }}>Bolt Food</a>
              <Link href="/orders" className="pb-btn-ghost" style={{ display:"block", textAlign:"center", fontSize:"0.65rem" }}>Track Order</Link>
            </div>
          </div>

          {/* Form */}
          <div style={{ background:"var(--pb-bg2)", border:"1px solid var(--pb-rule)", padding:"2rem" }}>
            <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:700, marginBottom:"1.5rem" }}>Send a Message</h2>
            {sent ? (
              <div style={{ textAlign:"center", padding:"3rem 1rem" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", color:"var(--pb-ember)", marginBottom:"0.75rem" }}>Message received.</div>
                <p style={{ fontSize:"0.85rem", color:"var(--pb-ivory3)", fontWeight:300 }}>We'll get back to you soon. For urgent orders, WhatsApp us directly.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display:"flex", flexDirection:"column", gap:"1.2rem" }}>
                {[
                  { name:"name", label:"Your name", type:"text", placeholder:"Enter your name", required:true },
                  { name:"email", label:"Email address", type:"email", placeholder:"your@email.com", required:true },
                  { name:"phone", label:"Phone number", type:"tel", placeholder:"0722 473 873", required:false },
                ].map(f => (
                  <div key={f.name}>
                    <label style={labelStyle}>{f.label}</label>
                    <input type={f.type} name={f.name} value={(formData as any)[f.name]} onChange={handleChange} placeholder={f.placeholder} required={f.required} style={{ width:"100%", padding:"0.65rem 0.8rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.85rem" }} />
                  </div>
                ))}
                <div>
                  <label style={labelStyle}>Message</label>
                  <textarea name="message" value={formData.message} onChange={handleChange} placeholder="Tell us what you'd like to know..." required rows={5} style={{ width:"100%", padding:"0.65rem 0.8rem", fontFamily:"'DM Sans',sans-serif", fontSize:"0.85rem", resize:"vertical" }} />
                </div>
                <button type="submit" className="pb-btn-primary" style={{ width:"100%", padding:"0.85rem", cursor:"pointer" }}>Send Message</button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* Map */}
      <section className="pb-section-mobile" style={{ padding:"3rem 2.5rem" }}>
        <div className="pb-eyebrow">Find us</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:"1.5rem", fontWeight:700, marginBottom:"1.2rem" }}>On the map</h2>
        <div style={{ border:"1px solid var(--pb-rule)", overflow:"hidden", height:380 }}>
          <iframe width="100%" height="100%" style={{ border:0 }} loading="lazy" allowFullScreen
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3988.8175642321436!2d36.9375!3d-1.3521!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x182f1d8e8e8e8e8d%3A0x8e8e8e8e8e8e8e8e!2sRuiru%2C%20Kenya!5e0!3m2!1sen!2s!4v1234567890" />
        </div>
        <p style={{ fontSize:"0.75rem", color:"var(--pb-ivory3)", marginTop:"0.75rem", fontFamily:"'DM Mono',monospace", letterSpacing:"0.05em" }}>Opp Rainbow Resort, Ruiru — call or WhatsApp for precise directions.</p>
      </section>

      {/* Floating WhatsApp Button */}
      <a href="https://wa.me/254722473873?text=Hi%20Passua%20Bites%2C%20I%27d%20like%20to%20place%20an%20order" target="_blank" rel="noopener noreferrer" aria-label="Order on WhatsApp"
        style={{ position:"fixed", bottom:"1.5rem", right:"1.5rem", width:56, height:56, borderRadius:"50%", background:"#25D366", display:"flex", alignItems:"center", justifyContent:"center", boxShadow:"0 4px 12px rgba(37,211,102,0.4)", zIndex:999 }}>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>

      <PBFooter />
    </div>
  );
}
