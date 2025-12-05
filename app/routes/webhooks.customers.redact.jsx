import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * GDPR Compliance: Customer Redaction Webhook
 *
 * This webhook is triggered when a customer requests deletion of their data.
 * Required for Shopify App Store approval.
 *
 * You must delete or anonymize customer data within 30 days.
 * This implements the "Right to be Forgotten" under GDPR.
 */
export const action = async ({ request }) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for shop: ${shop}`);
  console.log("Customer redaction payload:", payload);

  try {
    // Extract customer information
    const customerId = payload.customer?.id;
    const customerEmail = payload.customer?.email;
    const ordersToRedact = payload.orders_to_redact || [];

    console.log(`Redacting data for customer: ${customerEmail} (ID: ${customerId})`);

    // Find all submissions from this customer
    const submissions = await db.submission.findMany({
      where: {
        submitterEmail: customerEmail,
      },
    });

    console.log(`Found ${submissions.length} submissions to redact for ${customerEmail}`);

    // Strategy 1: Complete deletion (if stories can be removed)
    // Uncomment if you want to completely delete submissions
    /*
    const deleted = await db.submission.deleteMany({
      where: {
        submitterEmail: customerEmail,
      },
    });
    console.log(`Deleted ${deleted.count} submissions for customer ${customerEmail}`);
    */

    // Strategy 2: Anonymization (if published stories should remain)
    // This preserves the story content but removes personal information
    const anonymized = await db.submission.updateMany({
      where: {
        submitterEmail: customerEmail,
      },
      data: {
        submitterName: "Anonymous User",
        submitterEmail: `redacted_${customerId}@gdpr-deleted.local`,
        adminNotes: `[GDPR] Customer data redacted on ${new Date().toISOString()}`,
      },
    });

    console.log(`Anonymized ${anonymized.count} submissions for customer ${customerEmail}`);

    // Log this redaction for compliance tracking
    console.log({
      type: "GDPR_CUSTOMER_REDACTION",
      shop,
      customerId,
      customerEmail,
      redactedAt: new Date().toISOString(),
      submissionsAffected: anonymized.count,
      ordersToRedact: ordersToRedact.length,
    });

  } catch (error) {
    console.error("Error processing customer redaction:", error);
    // Don't throw - webhook should return 200 even if processing fails
    // Log the error for manual follow-up
  }

  return new Response("Customer data redacted successfully", { status: 200 });
};
