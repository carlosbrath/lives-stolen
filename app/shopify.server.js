import "@shopify/shopify-app-remix/adapters/node";
import {
  ApiVersion,
  AppDistribution,
  shopifyApp,
} from "@shopify/shopify-app-remix/server";
import { PrismaSessionStorage } from "@shopify/shopify-app-session-storage-prisma";
import prisma from "./db.server";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

// Read package.json for version info
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "..", "package.json"), "utf-8")
);

const shopify = shopifyApp({
  apiKey: process.env.SHOPIFY_API_KEY,
  apiSecretKey: process.env.SHOPIFY_API_SECRET || "",
  apiVersion: ApiVersion.January25,
  scopes: process.env.SCOPES?.split(","),
  appUrl: process.env.SHOPIFY_APP_URL || "",
  authPathPrefix: "/auth",
  sessionStorage: new PrismaSessionStorage(prisma),
  distribution: AppDistribution.AppStore,
  future: {
    unstable_newEmbeddedAuthStrategy: true,
    removeRest: true,
  },
  ...(process.env.SHOP_CUSTOM_DOMAIN
    ? { customShopDomains: [process.env.SHOP_CUSTOM_DOMAIN] }
    : {}),
});

// Log app info in development mode
if (process.env.NODE_ENV !== "production") {
  console.log("\n" + "=".repeat(60));
  console.log("📱 SHOPIFY APP INFORMATION");
  console.log("=".repeat(60));
  console.log(`App Name:          ${packageJson.name}`);
  console.log(`App Version:       ${packageJson.version}`);
  console.log(`API Version:       ${ApiVersion.January25}`);
  console.log(`App URL:           ${process.env.SHOPIFY_APP_URL || "Not set"}`);
  console.log(`API Key:           ${process.env.SHOPIFY_API_KEY ? process.env.SHOPIFY_API_KEY.substring(0, 8) + "..." : "Not set"}`);
  console.log(`Distribution:      ${AppDistribution.AppStore}`);
  console.log(`Environment:       ${process.env.NODE_ENV || "development"}`);
  console.log(`Scopes:            ${process.env.SCOPES || "Not set"}`);
  if (process.env.SHOP_CUSTOM_DOMAIN) {
    console.log(`Custom Domain:     ${process.env.SHOP_CUSTOM_DOMAIN}`);
  }
  console.log("=".repeat(60) + "\n");
}

export default shopify;
export const apiVersion = ApiVersion.January25;
export const addDocumentResponseHeaders = shopify.addDocumentResponseHeaders;
export const authenticate = shopify.authenticate;
export const unauthenticated = shopify.unauthenticated;
export const login = shopify.login;
export const registerWebhooks = shopify.registerWebhooks;
export const sessionStorage = shopify.sessionStorage;
