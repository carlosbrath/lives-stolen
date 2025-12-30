/**
 * Development logging utilities for Shopify app
 * Only logs in development/non-production environments
 */

/**
 * Log store and session information
 * @param {Object} session - Shopify session object
 * @param {string} context - Context where this is being called from
 */
export function logStoreInfo(session, context = "Session") {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.log("\n" + "-".repeat(60));
  console.log(`🏪 STORE INFORMATION (${context})`);
  console.log("-".repeat(60));

  if (session) {
    console.log(`Shop:              ${session.shop || "N/A"}`);
    console.log(`Session ID:        ${session.id || "N/A"}`);
    console.log(`Access Token:      ${session.accessToken ? "***" + session.accessToken.substring(session.accessToken.length - 4) : "N/A"}`);
    console.log(`Is Online:         ${session.isOnline ? "Yes" : "No"}`);
    console.log(`Scope:             ${session.scope || "N/A"}`);

    if (session.onlineAccessInfo) {
      console.log(`User ID:           ${session.onlineAccessInfo.associated_user?.id || "N/A"}`);
      console.log(`User Email:        ${session.onlineAccessInfo.associated_user?.email || "N/A"}`);
      console.log(`User Name:         ${session.onlineAccessInfo.associated_user?.first_name || ""} ${session.onlineAccessInfo.associated_user?.last_name || ""}`);
    }

    if (session.expires) {
      console.log(`Expires:           ${new Date(session.expires).toLocaleString()}`);
    }
  } else {
    console.log("No session available");
  }

  console.log("-".repeat(60) + "\n");
}

/**
 * Log admin GraphQL query information
 * @param {string} query - GraphQL query string
 * @param {Object} variables - Query variables
 * @param {string} shop - Shop domain
 */
export function logGraphQLQuery(query, variables, shop) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.log("\n" + "-".repeat(60));
  console.log("📊 GRAPHQL QUERY");
  console.log("-".repeat(60));
  console.log(`Shop:              ${shop || "N/A"}`);
  console.log(`Query:             ${query.substring(0, 100)}...`);
  if (variables && Object.keys(variables).length > 0) {
    console.log(`Variables:         ${JSON.stringify(variables, null, 2)}`);
  }
  console.log("-".repeat(60) + "\n");
}

/**
 * Log webhook information
 * @param {string} topic - Webhook topic
 * @param {string} shop - Shop domain
 * @param {Object} payload - Webhook payload (will be truncated)
 */
export function logWebhook(topic, shop, payload) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.log("\n" + "-".repeat(60));
  console.log("🔔 WEBHOOK RECEIVED");
  console.log("-".repeat(60));
  console.log(`Topic:             ${topic}`);
  console.log(`Shop:              ${shop}`);
  console.log(`Payload Preview:   ${JSON.stringify(payload, null, 2).substring(0, 200)}...`);
  console.log("-".repeat(60) + "\n");
}

/**
 * Log app bridge action
 * @param {string} action - Action name
 * @param {Object} data - Action data
 */
export function logAppAction(action, data) {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  console.log("\n" + "-".repeat(60));
  console.log(`⚡ APP ACTION: ${action}`);
  console.log("-".repeat(60));
  if (data && Object.keys(data).length > 0) {
    console.log(JSON.stringify(data, null, 2));
  }
  console.log("-".repeat(60) + "\n");
}
