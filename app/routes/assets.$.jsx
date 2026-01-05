import { readFile } from "fs/promises";
import { join } from "path";

// CORS headers for cross-origin requests from Shopify storefronts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Content types for different file extensions
const contentTypes = {
  ".css": "text/css",
  ".js": "application/javascript",
  ".ttf": "font/ttf",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

export async function loader({ request, params }) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    // Get the file path from the splat parameter
    const filePath = params["*"];

    if (!filePath) {
      return new Response("Not Found", { status: 404 });
    }

    // Security: Prevent directory traversal
    if (filePath.includes("..")) {
      return new Response("Forbidden", { status: 403 });
    }

    // Construct the full file path in the public directory
    const fullPath = join(process.cwd(), "public", "assets", filePath);

    // Read the file
    const fileContent = await readFile(fullPath);

    // Determine content type based on file extension
    const ext = filePath.substring(filePath.lastIndexOf(".")).toLowerCase();
    const contentType = contentTypes[ext] || "application/octet-stream";

    // Build headers
    const headers = {
      ...corsHeaders,
      "Content-Type": contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
    };

    // Add extra CORS headers for fonts
    if (ext === ".ttf" || ext === ".woff" || ext === ".woff2") {
      headers["Access-Control-Allow-Origin"] = "*";
      headers["Access-Control-Allow-Methods"] = "GET, OPTIONS";
      headers["Access-Control-Allow-Headers"] = "*";
      headers["Cross-Origin-Resource-Policy"] = "cross-origin";
    }

    // Return file with CORS headers
    return new Response(fileContent, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error("Error serving asset:", error);

    if (error.code === "ENOENT") {
      return new Response("Not Found", { status: 404 });
    }

    return new Response("Internal Server Error", {
      status: 500,
      headers: corsHeaders
    });
  }
}
