import { json } from "@remix-run/node";
import prisma from "../db.server";

/**
 * Debug endpoint to check what sessions exist in database
 * GET /api/debug-session?shop=yourshop.myshopify.com
 */
export async function loader({ request }) {
  try {
    const url = new URL(request.url);
    const shop = url.searchParams.get("shop");

    if (!shop) {
      // List all sessions
      const allSessions = await prisma.session.findMany({
        select: {
          id: true,
          shop: true,
        },
        orderBy: { id: 'desc' }
      });

      return json({
        totalSessions: allSessions.length,
        sessions: allSessions,
        message: "All sessions in database. Add ?shop=yourshop.myshopify.com to check specific shop"
      });
    }

    // Normalize shop
    let normalizedShop = shop;
    if (!shop.includes('.myshopify.com') && !shop.includes('.')) {
      normalizedShop = `${shop}.myshopify.com`;
    }

    // Find sessions for this shop
    const sessions = await prisma.session.findMany({
      where: {
        OR: [
          { shop: normalizedShop },
          { id: { startsWith: normalizedShop } },
          { id: { startsWith: `offline_${normalizedShop}` } }
        ]
      },
      select: {
        id: true,
        shop: true,
      }
    });

    if (sessions.length === 0) {
      return json({
        found: false,
        shop: normalizedShop,
        message: `No sessions found for ${normalizedShop}. App may not be installed.`,
        suggestion: "Install the app on this shop first, then try again."
      });
    }

    // Check if sessions have access tokens
    const sessionDetails = [];
    for (const session of sessions) {
      const fullSession = await prisma.session.findUnique({
        where: { id: session.id }
      });

      try {
        const parsed = JSON.parse(fullSession.content);
        sessionDetails.push({
          id: session.id,
          shop: session.shop,
          hasAccessToken: !!parsed.accessToken,
          scope: parsed.scope || null,
          isOnline: parsed.isOnline || false,
        });
      } catch (e) {
        sessionDetails.push({
          id: session.id,
          shop: session.shop,
          error: "Failed to parse session content"
        });
      }
    }

    return json({
      found: true,
      shop: normalizedShop,
      totalSessions: sessions.length,
      sessions: sessionDetails,
      recommendedSessionId: sessionDetails.find(s => s.hasAccessToken && !s.isOnline)?.id || sessionDetails[0]?.id
    });

  } catch (error) {
    return json({
      error: error.message,
      stack: error.stack
    }, { status: 500 });
  }
}
