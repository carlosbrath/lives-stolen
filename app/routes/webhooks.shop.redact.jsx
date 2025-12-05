import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * GDPR Compliance: Shop Redaction Webhook
 *
 * This webhook is triggered 48 hours after a shop uninstalls your app.
 * Required for Shopify App Store approval.
 *
 * You must delete or anonymize all shop data.
 * This is your last chance to clean up shop-specific information.
 */
export const action = async ({ request }) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for shop: ${shop}`);
  console.log("Shop redaction payload:", payload);

  try {
    const shopId = payload.shop_id;
    const shopDomain = payload.shop_domain;

    console.log(`Redacting all data for shop: ${shopDomain} (ID: ${shopId})`);

    // 1. Delete all sessions for this shop
    const deletedSessions = await db.session.deleteMany({
      where: {
        shop: shopDomain,
      },
    });

    console.log(`Deleted ${deletedSessions.count} sessions for shop ${shopDomain}`);

    // 2. Handle submissions for this shop
    const submissions = await db.submission.findMany({
      where: {
        shop: shopDomain,
      },
    });

    console.log(`Found ${submissions.length} submissions for shop ${shopDomain}`);

    // Strategy A: Complete deletion if submissions are shop-specific
    const deletedSubmissions = await db.submission.deleteMany({
      where: {
        shop: shopDomain,
      },
    });

    console.log(`Deleted ${deletedSubmissions.count} submissions for shop ${shopDomain}`);

    // Strategy B: Anonymization if submissions should be preserved
    // Uncomment and use instead of deletion if you want to keep stories
    /*
    const anonymizedSubmissions = await db.submission.updateMany({
      where: {
        shop: shopDomain,
      },
      data: {
        shop: `redacted_${shopId}`,
        metaobjectId: null,
        adminNotes: `[GDPR] Shop data redacted on ${new Date().toISOString()}`,
      },
    });

    console.log(`Anonymized ${anonymizedSubmissions.count} submissions for shop ${shopDomain}`);
    */

    // Log this redaction for compliance tracking
    console.log({
      type: "GDPR_SHOP_REDACTION",
      shop: shopDomain,
      shopId,
      redactedAt: new Date().toISOString(),
      sessionsDeleted: deletedSessions.count,
      submissionsDeleted: deletedSubmissions.count,
    });

    // TODO: If you store any other shop-specific data, delete it here
    // Examples:
    // - App settings/preferences
    // - Analytics data
    // - Cached data
    // - Files uploaded by the shop

  } catch (error) {
    console.error("Error processing shop redaction:", error);
    // Don't throw - webhook should return 200 even if processing fails
    // Log the error for manual follow-up
  }

  return new Response("Shop data redacted successfully", { status: 200 });
};
