import { authenticate } from "../shopify.server";
import db from "../db.server";

/**
 * GDPR Compliance: Customer Data Request Webhook
 *
 * This webhook is triggered when a customer requests their data.
 * Required for Shopify App Store approval.
 *
 * You must provide the customer's data within 30 days.
 * Implement your own data export logic based on your storage.
 */
export const action = async ({ request }) => {
  const { topic, shop, session, payload } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for shop: ${shop}`);
  console.log("Customer data request payload:", payload);

  try {
    // Extract customer information
    const customerId = payload.customer?.id;
    const customerEmail = payload.customer?.email;
    const ordersRequested = payload.orders_requested || [];

    console.log(`Data request for customer: ${customerEmail} (ID: ${customerId})`);

    // Find all submissions from this customer
    const submissions = await db.submission.findMany({
      where: {
        submitterEmail: customerEmail,
      },
      select: {
        id: true,
        submitterName: true,
        submitterEmail: true,
        victimName: true,
        relation: true,
        age: true,
        gender: true,
        incidentDate: true,
        state: true,
        roadUserType: true,
        injuryType: true,
        shortTitle: true,
        victimStory: true,
        photoUrls: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        publishedAt: true,
      },
    });

    // TODO: Send this data to the customer or store admin
    // Options:
    // 1. Email the data to the customer
    // 2. Store it for admin to download in dashboard
    // 3. Upload to a secure file storage and send link

    console.log(`Found ${submissions.length} submissions for customer ${customerEmail}`);
    console.log("Customer data:", JSON.stringify(submissions, null, 2));

    // Log this request for compliance tracking
    console.log({
      type: "GDPR_DATA_REQUEST",
      shop,
      customerId,
      customerEmail,
      requestedAt: new Date().toISOString(),
      dataFound: submissions.length > 0,
      submissionsCount: submissions.length,
    });

    // TODO: Implement your data export mechanism
    // Example: Send email with data, or store in a secure location
    // await sendDataExportEmail(customerEmail, submissions);

  } catch (error) {
    console.error("Error processing customer data request:", error);
    // Don't throw - webhook should return 200 even if processing fails
    // Log the error for manual follow-up
  }

  return new Response("Customer data request processed", { status: 200 });
};
