import { PBNav, PBFooter } from "./Home";
import { Link } from "wouter";

export default function TermsOfService() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--pb-bg)" }}>
      <PBNav />
      <div className="pb-section-mobile" style={{ padding: "3rem 2.5rem", maxWidth: 800, margin: "0 auto" }}>
        <div className="pb-eyebrow">Legal</div>
        <h1 style={{ fontFamily: "'Playfair Display',serif", fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, marginBottom: "2rem" }}>
          Terms of Service
        </h1>
        <div style={{ fontSize: "0.78rem", color: "var(--pb-ivory3)", marginBottom: "2rem" }}>
          Last updated: April 10, 2026
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "2rem", fontSize: "0.88rem", color: "var(--pb-ivory2)", lineHeight: 1.7 }}>
          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using the Passua Bites website (passua-bites-web.vercel.app), you agree to be bound by these Terms of Service.
              If you do not agree, please do not use our website.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              2. Our Service
            </h2>
            <p>
              Passua Bites is a food business located at Opp Rainbow Resort, Ruiru, Kenya.
              Our website allows you to:
            </p>
            <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>Browse our menu and view prices</li>
              <li>Place food orders for delivery or pickup</li>
              <li>Submit reviews and ratings</li>
              <li>Contact us via phone or WhatsApp</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              3. Placing Orders
            </h2>
            <ul style={{ marginLeft: "1.5rem" }}>
              <li>Orders placed through our website are <strong>requests</strong>, not confirmed purchases</li>
              <li>We reserve the right to accept or decline any order</li>
              <li>Order confirmation is sent via WhatsApp or phone call</li>
              <li>Prices are in Kenyan Shillings (KES) and include all applicable taxes</li>
              <li>We reserve the right to change prices at any time</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              4. Payment
            </h2>
            <ul style={{ marginLeft: "1.5rem" }}>
              <li><strong>M-Pesa Paybill:</strong> Business No. 400200, Account No. 1053125</li>
              <li><strong>Cash on Delivery:</strong> Pay when your order is delivered</li>
              <li>Orders are prepared after payment is confirmed</li>
              <li>We are not responsible for incorrect M-Pesa payments</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              5. Delivery
            </h2>
            <ul style={{ marginLeft: "1.5rem" }}>
              <li>Delivery is available within the Ruiru area and surrounding neighborhoods</li>
              <li>Estimated delivery times are approximate and not guaranteed</li>
              <li>Delivery fees may apply and will be communicated before order confirmation</li>
              <li>You must be available at the delivery address to receive your order</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              6. Cancellations & Refunds
            </h2>
            <ul style={{ marginLeft: "1.5rem" }}>
              <li>Orders can be cancelled before preparation begins</li>
              <li>Refunds for paid orders will be processed via M-Pesa reversal</li>
              <li>If we cannot fulfill your order, we will notify you and issue a full refund</li>
              <li>Contact us at 0722 473 873 for cancellations</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              7. Reviews & Ratings
            </h2>
            <ul style={{ marginLeft: "1.5rem" }}>
              <li>Reviews are subject to moderation before appearing publicly</li>
              <li>We reserve the right to remove reviews that are offensive, false, or inappropriate</li>
              <li>By submitting a review, you grant us permission to display it on our website</li>
              <li>Reviews cannot be used to defame or harass our business or staff</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              8. Food Safety & Allergens
            </h2>
            <ul style={{ marginLeft: "1.5rem" }}>
              <li>We prepare food in a clean environment following standard food safety practices</li>
              <li>If you have food allergies or dietary restrictions, please inform us when ordering</li>
              <li>We are not liable for allergic reactions if allergen information was not provided</li>
              <li>Food is prepared fresh and should be consumed promptly</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              9. Limitation of Liability
            </h2>
            <p>
              To the maximum extent permitted by Kenyan law, Passua Bites shall not be liable for:
            </p>
            <ul style={{ marginLeft: "1.5rem", marginTop: "0.5rem" }}>
              <li>Delivery delays caused by circumstances beyond our control (weather, traffic, etc.)</li>
              <li>Minor variations in food appearance or taste</li>
              <li>Website downtime or technical issues</li>
              <li>Indirect or consequential damages</li>
            </ul>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              10. Intellectual Property
            </h2>
            <p>
              All content on this website, including our logo, menu descriptions, and images, is the property of Passua Bites.
              You may not copy, reproduce, or use our content for commercial purposes without our written permission.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              11. Governing Law
            </h2>
            <p>
              These Terms are governed by the laws of Kenya. Any disputes shall be resolved in the courts of Kenya.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              12. Changes to Terms
            </h2>
            <p>
              We may update these Terms at any time. Continued use of our website after changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 style={{ fontFamily: "'Playfair Display',serif", fontSize: "1.3rem", fontWeight: 700, color: "var(--pb-ivory)", marginBottom: "0.75rem" }}>
              13. Contact
            </h2>
            <p>
              <strong>Passua Bites</strong><br />
              Opp Rainbow Resort, Ruiru, Kenya<br />
              Phone: 0722 473 873<br />
              WhatsApp: <a href="https://wa.me/254722473873" style={{ color: "var(--pb-ember)" }}>wa.me/254722473873</a>
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
