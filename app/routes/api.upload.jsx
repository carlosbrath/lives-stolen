import { uploadFilesToShopify } from "../utils/fileUpload.server";
import { rateLimitByIp } from "../utils/rateLimit.server";
import { handleCors, jsonResponse, errorResponse, corsHeaders } from "../utils/api.server";

const MAX_FILES = 10;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function action({ request }) {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED");
  }

  try {
    // Rate limiting: 300 uploads per hour per IP
    const rateLimited = rateLimitByIp(request, {
      maxRequests: 300,
      windowMs: 60 * 60 * 1000,
      message: "Too many upload requests. Please try again later.",
    });

    if (rateLimited) {
      return new Response(rateLimited.body, {
        status: 429,
        headers: { ...corsHeaders, ...Object.fromEntries(rateLimited.headers) },
      });
    }

    const formData = await request.formData();
    const shop = formData.get("shop");
    const files = formData.getAll("files");

    // Validate shop
    if (!shop) {
      return errorResponse("Shop domain is required", 400, "MISSING_SHOP");
    }

    // Validate files
    if (files.length === 0) {
      return errorResponse("No files provided", 400, "NO_FILES");
    }

    if (files.length > MAX_FILES) {
      return errorResponse(`Maximum ${MAX_FILES} files allowed per upload`, 400, "TOO_MANY_FILES");
    }

    // Validate each file
    for (const file of files) {
      if (!file.type?.startsWith("image/")) {
        return errorResponse(`Invalid file type: ${file.type}. Only images allowed.`, 400, "INVALID_FILE_TYPE");
      }

      if (file.size > MAX_FILE_SIZE) {
        return errorResponse(
          `File "${file.name}" exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)`,
          400,
          "FILE_TOO_LARGE"
        );
      }
    }

    const urls = await uploadFilesToShopify(shop, files);

    return jsonResponse({
      success: true,
      urls,
      uploadedCount: urls.length,
    });
  } catch (error) {
    const isShopError = error.message.includes("Shop") || error.message.includes("session");
    return errorResponse(
      error.message || "Upload failed. Please try again.",
      isShopError ? 403 : 500,
      isShopError ? "SHOP_NOT_FOUND" : "UPLOAD_FAILED"
    );
  }
}
