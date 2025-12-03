export default function TermsOfService() {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px", fontFamily: "system-ui, sans-serif" }}>
      <h1 style={{ fontSize: "2rem", marginBottom: "1rem" }}>Terms of Service</h1>
      <p style={{ color: "#666", marginBottom: "2rem" }}>
        <strong>Last Updated:</strong> {new Date().toLocaleDateString()}
      </p>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>1. Agreement to Terms</h2>
        <p style={{ lineHeight: "1.6" }}>
          By installing and using Story App ("the App"), you agree to be bound by these Terms of Service.
          If you do not agree to these terms, please do not install or use the App.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>2. Description of Service</h2>
        <p style={{ lineHeight: "1.6" }}>
          Story App is a Shopify application that enables merchants to:
        </p>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li>Collect and display memorial stories from users</li>
          <li>Manage story submissions through an admin dashboard</li>
          <li>Publish approved stories on a public memorial wall</li>
          <li>Sync stories with Shopify store data</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>3. Eligibility</h2>
        <p style={{ lineHeight: "1.6" }}>
          You must:
        </p>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li>Be at least 18 years old</li>
          <li>Have a valid Shopify store</li>
          <li>Have the authority to bind your business to these terms</li>
          <li>Comply with all applicable laws and regulations</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>4. Your Responsibilities</h2>

        <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>4.1 Content Moderation</h3>
        <p style={{ lineHeight: "1.6", marginBottom: "1rem" }}>
          As a merchant using this app, you are responsible for:
        </p>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li>Reviewing all submitted stories before publication</li>
          <li>Ensuring published content complies with applicable laws</li>
          <li>Removing inappropriate, offensive, or illegal content</li>
          <li>Respecting the privacy of story submitters</li>
          <li>Handling user data in compliance with privacy laws</li>
        </ul>

        <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem", marginTop: "1rem" }}>4.2 Prohibited Uses</h3>
        <p style={{ lineHeight: "1.6", marginBottom: "0.5rem" }}>You may not use the App to:</p>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li>Violate any laws or regulations</li>
          <li>Infringe on intellectual property rights</li>
          <li>Harass, abuse, or harm others</li>
          <li>Distribute malware or harmful code</li>
          <li>Attempt to gain unauthorized access to our systems</li>
          <li>Use the App for any illegal or unauthorized purpose</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>5. Intellectual Property</h2>
        <p style={{ lineHeight: "1.6", marginBottom: "1rem" }}>
          The App and its original content, features, and functionality are owned by us and are
          protected by international copyright, trademark, and other intellectual property laws.
        </p>
        <p style={{ lineHeight: "1.6" }}>
          <strong>Content Ownership:</strong> You retain all rights to the stories and content
          submitted through the App. By using the App, you grant us a limited license to store,
          display, and process this content solely for the purpose of providing the service.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>6. Fees and Payment</h2>
        <p style={{ lineHeight: "1.6" }}>
          [UPDATE THIS SECTION based on your pricing model]
        </p>
        <ul style={{ lineHeight: "1.8", marginLeft: "20px" }}>
          <li>Current pricing is available on the Shopify App Store listing</li>
          <li>Fees are billed through your Shopify account</li>
          <li>All fees are non-refundable unless required by law</li>
          <li>We may change fees with 30 days notice</li>
        </ul>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>7. Data and Privacy</h2>
        <p style={{ lineHeight: "1.6" }}>
          Your use of the App is also governed by our{" "}
          <a href="/privacy-policy" style={{ color: "#3b82f6" }}>Privacy Policy</a>.
          We collect and process data as described in that policy.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>8. Disclaimers and Limitations of Liability</h2>

        <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>8.1 No Warranties</h3>
        <p style={{ lineHeight: "1.6", marginBottom: "1rem" }}>
          THE APP IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. WE DISCLAIM ALL WARRANTIES,
          EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR
          PURPOSE, AND NON-INFRINGEMENT.
        </p>

        <h3 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>8.2 Limitation of Liability</h3>
        <p style={{ lineHeight: "1.6" }}>
          TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT,
          INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR
          REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>9. Termination</h2>
        <p style={{ lineHeight: "1.6", marginBottom: "1rem" }}>
          We may terminate or suspend your access to the App immediately, without prior notice,
          for any reason, including breach of these Terms.
        </p>
        <p style={{ lineHeight: "1.6" }}>
          You may terminate your use of the App at any time by uninstalling it from your Shopify store.
          Upon termination, your data will be retained for 30 days before permanent deletion.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>10. Changes to Terms</h2>
        <p style={{ lineHeight: "1.6" }}>
          We reserve the right to modify these Terms at any time. We will notify you of any changes
          by posting the new Terms on this page and updating the "Last Updated" date. Continued use
          of the App after changes constitutes acceptance of the updated Terms.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>11. Governing Law</h2>
        <p style={{ lineHeight: "1.6" }}>
          These Terms shall be governed by and construed in accordance with the laws of [YOUR JURISDICTION],
          without regard to its conflict of law provisions.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>12. Dispute Resolution</h2>
        <p style={{ lineHeight: "1.6" }}>
          Any disputes arising from these Terms will be resolved through binding arbitration in
          accordance with the rules of [ARBITRATION ORGANIZATION], except where prohibited by law.
        </p>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>13. Contact Information</h2>
        <p style={{ lineHeight: "1.6" }}>
          For questions about these Terms of Service, please contact us:
        </p>
        <div style={{ background: "#f9fafb", padding: "1rem", borderRadius: "8px", marginTop: "1rem" }}>
          <p style={{ margin: "0.5rem 0" }}><strong>Email:</strong> support@yourdomain.com</p>
          <p style={{ margin: "0.5rem 0" }}><strong>Website:</strong> https://yourdomain.com</p>
        </div>
      </section>

      <section style={{ marginBottom: "2rem" }}>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>14. Shopify Terms</h2>
        <p style={{ lineHeight: "1.6" }}>
          Your use of Shopify and this App is also subject to{" "}
          <a href="https://www.shopify.com/legal/terms" style={{ color: "#3b82f6" }}>
            Shopify's Terms of Service
          </a>.
        </p>
      </section>

      <div style={{ marginTop: "3rem", padding: "1.5rem", background: "#fef3c7", borderRadius: "8px" }}>
        <p style={{ margin: 0, fontSize: "0.9rem", color: "#92400e" }}>
          <strong>Important:</strong> This is a template. Please have these terms reviewed by legal
          counsel before publishing. Update all bracketed sections with your specific information.
        </p>
      </div>
    </div>
  );
}
