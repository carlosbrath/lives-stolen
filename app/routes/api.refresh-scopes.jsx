import { json, redirect } from "@remix-run/node";
import prisma from "../db.server";

/**
 * Force refresh app scopes and create new session
 * Use this when you've updated scopes in shopify.app.toml
 *
 * Access: /api/refresh-scopes
 * This will:
 * 1. Delete old session
 * 2. Force OAuth flow with new scopes
 * 3. Create new session with updated access token
 */
export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      return json({
        error: "Shop parameter required. Use: /api/refresh-scopes?shop=yourshop.myshopify.com"
      }, { status: 400 });
    }

    // Normalize shop domain
    let normalizedShop = shop;
    if (!shop.includes('.myshopify.com')) {
      normalizedShop = `${shop}.myshopify.com`;
    }

    // Delete ALL sessions for this shop to force re-auth
    const deleted = await prisma.session.deleteMany({
      where: {
        OR: [
          { shop: normalizedShop },
          { id: { contains: normalizedShop } }
        ]
      }
    });

    console.log(`✅ Deleted ${deleted.count} session(s) for ${normalizedShop}`);

    // Redirect to OAuth flow - this will create new session with updated scopes
    return redirect(`/api/auth?shop=${normalizedShop}`);

  } catch (error) {
    return json({
      error: error.message,
      message: "Failed to refresh scopes. Try manually reinstalling the app."
    }, { status: 500 });
  }
}
