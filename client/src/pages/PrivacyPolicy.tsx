import { PBNav, PBFooter } from "./Home";
import { Link } from "wouter";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function PrivacyPolicy() {
  usePageMeta({ title: "Privacy Policy — Passua Bites", description: "Privacy policy for Passua Bites. Learn how we handle your data." });
  return (
    <div style={{ minHeight: "100vh", background: "var(--pb-bg)" }}>
      <PBNav />
      <div className="pb-section-mobile" style={{ padding: "3rem 2.5rem", maxWidth: 800, margin: "0 auto" }}>
        <div className="pb-eyebrow">Legal</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, marginBottom: "2rem" }}>
          Privacy Policy
        </h1>
        <div style={{ fontSize: "0.78rem", color: "var(--pb-ivory3)", marginBottom: "2rem" }}>
          Last updated: August 15, 2026
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", fontSize: "0.88rem", color: "var(--pb-ivory2)", lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              1. Who We Are
            </h2>
            <p>
              Passua Bites ("we", "our", "us") is a food business based in Ruiru, Kenya. Our current pickup and delivery point may change during relocation and road works, so please contact us for the latest directions.
              We operate a website at passua-bites-web.vercel.app where customers can browse our menu, place orders, track orders with a private token, and submit reviews.
              Our contact number is 0722 473 873.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              2. What Information We Collect
            </h2>
            <p>We collect the following personal information when you use our website:</p>
            <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li><strong>Order information:</strong> Your name, phone number, email address (optional), and delivery address</li>
              <li><strong>Order details:</strong> Items ordered, quantities, prices, and order status</li>
              <li><strong>Payment information:</strong> M-Pesa confirmation codes (if provided). We do NOT store M-Pesa PINs or account details</li>
              <li><strong>Reviews:</strong> Your name, rating, and review text when you submit a review</li>
              <li><strong>Technical data:</strong> Browser type, device type, and approximate location (via IP address)</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              3. Why We Collect Your Information
            </h2>
            <p>We use your personal information to:</p>
            <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>Process and fulfill your food orders</li>
              <li>Communicate with you about your order (via WhatsApp or phone)</li>
              <li>Display and moderate customer reviews</li>
              <li>Improve our menu and service</li>
              <li>Comply with legal obligations under Kenyan law</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              4. Legal Basis (Kenya Data Protection Act, 2019)
            </h2>
            <p>
              We process your personal data under the following legal bases as required by the Kenya Data Protection Act, 2019:
            </p>
            <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li><strong>Consent:</strong> When you voluntarily submit your information to place an order or leave a review</li>
              <li><strong>Contract performance:</strong> Processing your order and delivering your food</li>
              <li><strong>Legitimate interests:</strong> Improving our service and preventing fraud</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              5. How We Store Your Data
            </h2>
            <p>
              Order, review, and operational data is stored in a Neon PostgreSQL database hosted on AWS. The frontend is deployed on Vercel and the API is deployed on Render. We use HTTPS for data in transit and restrict database and administrative access to authorized personnel and service accounts.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              6. Who We Share Your Data With
            </h2>
            <p>We do NOT sell or share your personal data with third parties for marketing purposes.</p>
            <p style={{ marginTop: "0.5rem" }}>
              Your data may be shared only with service providers and people required to operate the business:
            </p>
            <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li><strong>Our staff:</strong> To prepare, deliver, and support your order</li>
              <li><strong>Hosting providers:</strong> Neon, Render, and Vercel process data as needed to host the database, API, and website</li>
              <li><strong>M-Pesa / Safaricom:</strong> For payment processing (we do not control their privacy practices)</li>
              <li><strong>Legal authorities:</strong> If required by Kenyan law</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              7. How Long We Keep Your Data
            </h2>
            <p>
              We retain order and payment records only for as long as they are needed to fulfill orders, resolve disputes, support accounting, prevent fraud, and meet legal obligations. Reviews remain stored while they are useful for moderation and service feedback. Server-side analytics records are used for security and service improvement and are reviewed for removal as part of operational maintenance. The current deletion process is manual rather than an automatic self-service control.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              8. Your Rights
            </h2>
            <p>Under the Kenya Data Protection Act, 2019, you have the right to:</p>
            <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
              <li><strong>Correction:</strong> Request correction of inaccurate data</li>
              <li><strong>Deletion:</strong> Request deletion of your personal data</li>
              <li><strong>Objection:</strong> Object to how we process your data</li>
              <li><strong>Withdraw consent:</strong> Withdraw consent at any time (this does not affect past processing)</li>
            </ul>
            <p style={{ marginTop: "0.5rem" }}>
              To exercise these rights, contact us at <strong>0722 473 873</strong> or via WhatsApp. We will verify the request, locate records using the contact details you provide, remove or anonymize data that we are not required to retain, and explain any records that must remain for legal, payment, security, or dispute-resolution reasons.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              9. Cookies
            </h2>
            <p>
              Our website uses essential browser storage for cart contents and an HTTP-only session cookie for administrative login. We do not use advertising cookies. We do collect limited server-side analytics such as request IP address, browser or user-agent details, device information, page views, referrer data, and approximate city/country derived from IP addresses for security, reliability, and service improvement. This server-side analytics is not sold for advertising.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              10. Children's Privacy
            </h2>
            <p>
              Our website is not directed to children under 13. We do not knowingly collect personal information from children.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              11. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              12. Contact Us
            </h2>
            <p>
              If you have questions about this Privacy Policy or your personal data, contact us at:
            </p>
            <p style={{ marginTop: "0.5rem" }}>
              <strong>Passua Bites</strong><br />
              Ruiru, Kenya — contact us for the current pickup point<br />
              Phone: 0722 473 873<br />
              WhatsApp: <a href="https://wa.me/254722473873" style={{ color: "var(--pb-ember)" }}>wa.me/254722473873</a>
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              13. Complaints
            </h2>
            <p>
              If you believe your data protection rights have been violated, you can lodge a complaint with the
              <strong> Office of the Data Protection Commissioner (ODPC)</strong> at <a href="https://www.odpc.go.ke" style={{ color: "var(--pb-ember)" }}>odpc.go.ke</a>.
            </p>
          </section>
        </div>

        <div style={{ marginTop: "3rem", paddingTop: "1.5rem", borderTop: "1px solid var(--pb-rule)", textAlign: "center" }}>
          <Link href="/" style={{ color: "var(--pb-ember)", textDecoration: "none", fontSize: "0.85rem" }}>← Back to Home</Link>
        </div>
      </div>
      <PBFooter />
    </div>
  );
}
