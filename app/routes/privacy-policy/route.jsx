export default function PrivacyPolicy() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Privacy Policy</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
      </p>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>1. Introduction</h2>
        <p style={{ lineHeight: "1.6" }}>
          This Privacy Policy describes how Story App ("we", "our", or "us") collects, uses, and shares
          information when you use our Shopify application. We are committed to protecting your privacy
          and ensuring transparency in our data practices.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>2. Information We Collect</h2>

        <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>2.1 Information You Provide</h3>
        <p style={{ lineHeight: "1.6", marginBottom: "1rem" }}>
          When you submit a story through our app, we collect:
        </p>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li>Submitter name and email address</li>
          <li>Victim name (optional)</li>
          <li>Relationship to victim (optional)</li>
          <li>Incident details (date, location, type)</li>
          <li>Story content and description</li>
          <li>Photos uploaded with the story</li>
          <li>Demographic information (age, gender - optional)</li>
        </ul>

        <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", marginTop: "1rem" }}>2.2 Shopify Store Information</h3>
        <p style={{ lineHeight: "1.6" }}>
          When you install our app on your Shopify store, we collect:
        </p>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li>Store domain and shop information</li>
          <li>OAuth access tokens (encrypted and stored securely)</li>
          <li>Store owner email</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>3. How We Use Your Information</h2>
        <p style={{ lineHeight: "1.6", marginBottom: "0.5rem" }}>We use the collected information to:</p>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li>Display submitted stories on your memorial wall</li>
          <li>Allow store administrators to review and manage submissions</li>
          <li>Sync approved stories with your Shopify store</li>
          <li>Provide customer support</li>
          <li>Improve our app functionality</li>
          <li>Ensure compliance with Shopify's terms of service</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>4. Data Storage and Security</h2>
        <p style={{ lineHeight: "1.6" }}>
          We store your data securely using industry-standard encryption and security practices:
        </p>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li>All data is stored in encrypted databases</li>
          <li>Access tokens are encrypted at rest</li>
          <li>Data is transmitted over HTTPS</li>
          <li>We perform regular security audits</li>
          <li>Access to data is restricted to authorized personnel only</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>5. Data Sharing and Disclosure</h2>
        <p style={{ lineHeight: "1.6", marginBottom: "0.5rem" }}>
          We do not sell, trade, or rent your personal information to third parties.
          We may share information only in the following circumstances:
        </p>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li><strong>With Shopify:</strong> As required for app functionality</li>
          <li><strong>Legal Requirements:</strong> When required by law or legal process</li>
          <li><strong>Business Transfers:</strong> In connection with a merger, acquisition, or sale of assets</li>
          <li><strong>With Your Consent:</strong> When you explicitly authorize us to share information</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>6. Your Rights (GDPR Compliance)</h2>
        <p style={{ lineHeight: "1.6", marginBottom: "0.5rem" }}>
          Under the General Data Protection Regulation (GDPR) and other privacy laws, you have the right to:
        </p>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li><strong>Access:</strong> Request a copy of your personal data</li>
          <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
          <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
          <li><strong>Data Portability:</strong> Request your data in a machine-readable format</li>
          <li><strong>Object:</strong> Object to processing of your data</li>
          <li><strong>Withdraw Consent:</strong> Withdraw consent at any time</li>
        </ul>
        <p style={{ lineHeight: "1.6", marginTop: "1rem" }}>
          To exercise these rights, please contact us at the email address below.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>7. Data Retention</h2>
        <p style={{ lineHeight: "1.6" }}>
          We retain your data for as long as your Shopify store uses our app, or as needed to provide
          our services. After app uninstallation, we retain data for 30 days before permanent deletion,
          unless legal requirements mandate longer retention.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>8. Cookies and Tracking</h2>
        <p style={{ lineHeight: "1.6" }}>
          Our app uses session cookies necessary for authentication and app functionality.
          We do not use tracking cookies or third-party analytics services that collect personal information.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>9. Children's Privacy</h2>
        <p style={{ lineHeight: "1.6" }}>
          Our app is not intended for children under 13 years of age. We do not knowingly collect
          personal information from children. If you believe we have collected information from a
          child, please contact us immediately.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>10. Changes to This Policy</h2>
        <p style={{ lineHeight: "1.6" }}>
          We may update this Privacy Policy from time to time. We will notify you of any changes by
          posting the new policy on this page and updating the "Last Updated" date. Continued use
          of the app after changes constitutes acceptance of the updated policy.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>11. Contact Us</h2>
        <p style={{ lineHeight: "1.6" }}>
          If you have questions about this Privacy Policy or wish to exercise your rights, please contact us:
        </p>
        <div style={{ background: "#f9fafb", padding: "1rem", borderRadius: "8px", marginTop: "1rem" }}>
          <p style={{ margin: "0.5rem 0" }}><strong>Email:</strong> privacy@yourdomain.com</p>
          <p style={{ margin: "0.5rem 0" }}><strong>Website:</strong> https://yourdomain.com</p>
          <p style={{ margin: "0.5rem 0" }}><strong>Response Time:</strong> We will respond within 30 days</p>
        </div>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>12. Shopify-Specific Information</h2>
        <p style={{ lineHeight: "1.6" }}>
          This app complies with Shopify's privacy requirements. For information about how Shopify
          handles your data, please review{" "}
          <a href="https://www.shopify.com/legal/privacy" style={{ color: "#3b82f6" }}>
            Shopify's Privacy Policy
          </a>.
        </p>
      </section>

      <div style={{ marginTop: "3rem", padding: "1.5rem", background: "#eff6ff", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#1e40af" }}>
          <strong>Note:</strong> This privacy policy is compliant with GDPR, CCPA, and Shopify's requirements.
          We recommend having this reviewed by legal counsel before publishing.
        </p>
      </div>
    </div>
  );
}
