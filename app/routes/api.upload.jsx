import { json } from "@remix-run/node";
import { uploadFilesToShopify } from "../utils/fileUpload.server";
import { rateLimitByIp } from "../utils/rateLimit.server";

// CORS headers for cross-origin requests from Shopify storefronts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

/**
 * Upload files to Shopify Files API
 * This endpoint is public (no auth required) but rate-limited
 *
 * Request format:
 * - Content-Type: multipart/form-data
 * - shop: string (required) - Shop domain
 * - files: File[] (required, max 10) - Image files to upload
 *
 * Response format:
 * - success: boolean
 * - urls: string[] - Array of CDN URLs
 * - uploadedCount: number - Number of files uploaded
 *
 * Error codes:
 * - MISSING_SHOP: Shop domain not provided
 * - SHOP_NOT_FOUND: Shop doesn't have app installed or session invalid
 * - NO_FILES: No files in request
 * - TOO_MANY_FILES: More than 10 files
 * - INVALID_FILE_TYPE: Non-image file type
 * - FILE_TOO_LARGE: File exceeds 10MB limit
 * - UPLOAD_FAILED: Shopify upload failed
 */
export async function action({ request }) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json(
      { success: false, error: "Method not allowed", code: "METHOD_NOT_ALLOWED" },
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    // Rate limiting: 30 uploads per hour per IP
    const rateLimitResponse = rateLimitByIp(request, {
      maxRequests: 30,
      windowMs: 60 * 60 * 1000, // 1 hour
      message: "Too many upload requests. Please try again later.",
    });

    if (rateLimitResponse) {
      return new Response(rateLimitResponse.body, {
        status: 429,
        headers: { ...corsHeaders, ...Object.fromEntries(rateLimitResponse.headers) },
      });
    }

    // Parse multipart form data
    const formData = await request.formData();

    // Extract shop domain
    const shop = formData.get("shop");
    if (!shop) {
      return json(
        {
          success: false,
          error: "Shop domain is required",
          code: "MISSING_SHOP",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Extract files
    const files = formData.getAll("files");
    if (files.length === 0) {
      return json(
        {
          success: false,
          error: "No files provided",
          code: "NO_FILES",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file count (max 10)
    if (files.length > 10) {
      return json(
        {
          success: false,
          error: "Maximum 10 files allowed per upload",
          code: "TOO_MANY_FILES",
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file types and sizes (basic check before detailed validation)
    for (const file of files) {
      if (!file.type || !file.type.startsWith("image/")) {
        return json(
          {
            success: false,
            error: `Invalid file type: ${file.type}. Only image files are allowed.`,
            code: "INVALID_FILE_TYPE",
          },
          { status: 400, headers: corsHeaders }
        );
      }

      // 10MB limit per file
      if (file.size > 10 * 1024 * 1024) {
        return json(
          {
            success: false,
            error: `File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum size is 10MB.`,
            code: "FILE_TOO_LARGE",
          },
          { status: 400, headers: corsHeaders }
        );
      }
    }

    // Upload to Shopify Files API
    console.log(`📤 Uploading ${files.length} files to Shopify for shop: ${shop}`);
    const urls = await uploadFilesToShopify(shop, files);

    console.log(`✅ Successfully uploaded ${urls.length} files to Shopify`);

    return json(
      {
        success: true,
        urls,
        uploadedCount: urls.length,
      },
      { status: 200, headers: corsHeaders }
    );

  } catch (error) {
    console.error("❌ Upload error:", error);
    console.error("Error stack:", error.stack);

    // Determine error code based on error message
    let errorCode = "UPLOAD_FAILED";
    let statusCode = 500;

    if (error.message.includes("Shop") && error.message.includes("not found")) {
      errorCode = "SHOP_NOT_FOUND";
      statusCode = 403;
    } else if (error.message.includes("session")) {
      errorCode = "SESSION_EXPIRED";
      statusCode = 403;
    } else if (error.message.includes("validation")) {
      errorCode = "VALIDATION_ERROR";
      statusCode = 400;
    }

    return json(
      {
        success: false,
        error: error.message || "Upload failed. Please try again.",
        code: errorCode,
      },
      { status: statusCode, headers: corsHeaders }
    );
  }
}
