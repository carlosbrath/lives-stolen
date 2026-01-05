import { json } from "@remix-run/node";
import prisma from "../db.server";
import { rateLimitSubmission } from "../utils/rateLimit.server";

// CORS headers for cross-origin requests from Shopify storefronts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function action({ request }) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  if (request.method !== "POST") {
    return json(
      { error: "Method not allowed" },
      { status: 405, headers: corsHeaders }
    );
  }

  try {
    const formData = await request.formData();

    // Extract form data
    const submitterName = formData.get("submitterName");
    const submitterEmail = formData.get("submitterEmail");
    const shop = formData.get("shop") || "public"; // Shop domain for file uploads

    // Rate limiting: Check both IP and email
    if (submitterEmail) {
      const rateLimitResponse = rateLimitSubmission(request, submitterEmail);
      if (rateLimitResponse) {
        return json(
          { error: "Rate limit exceeded. Please try again later." },
          { status: 429, headers: corsHeaders }
        );
      }
    }

    const victimName = formData.get("victimName");
    const relation = formData.get("relation");
    const incidentDate = formData.get("incidentDate");
    const state = formData.get("state");
    const roadUserType = formData.get("roadUserType");
    const injuryType = formData.get("injuryType");
    const ageRange = formData.get("ageRange");
    const gender = formData.get("gender");
    const victimStory = formData.get("victimStory");
    const zipCode = formData.get("zipCode");
    const interestedInContact = formData.get("interestedInContact");

    // Validate required fields
    const errors = {};
    if (!submitterName) errors.submitterName = "Submitter name is required";
    if (!submitterEmail) errors.submitterEmail = "Submitter email is required";
    if (!incidentDate) errors.incidentDate = "Incident date is required";
    if (!state) errors.state = "State is required";
    if (!roadUserType) errors.roadUserType = "Road user type is required";
    if (!injuryType) errors.injuryType = "Injury type is required";
    if (!victimStory) errors.victimStory = "Victim's story is required";

    if (Object.keys(errors).length > 0) {
      return json({ errors }, { status: 400, headers: corsHeaders });
    }

    // Convert age range to numeric value for database storage
    // Store the midpoint of the range for filtering purposes
    let parsedAge = null;
    if (ageRange && ageRange.trim() !== "") {
      const range = ageRange.trim();
      if (range === "0-17") {
        parsedAge = 8; // Midpoint
      } else if (range === "18-30") {
        parsedAge = 24; // Midpoint
      } else if (range === "31-45") {
        parsedAge = 38; // Midpoint
      } else if (range === "46-60") {
        parsedAge = 53; // Midpoint
      } else if (range === "60+") {
        parsedAge = 65; // Representative value for 60+
      }
    }

    // Parse interestedInContact as boolean
    const parsedInterested = interestedInContact
      ? interestedInContact === "yes" || interestedInContact === "true"
      : null;

    // Parse photo URLs from form data
    const photoUrlsRaw = formData.get("photoUrls");
    let photoUrlsArray = [];
    try {
      if (photoUrlsRaw) {
        const parsed = JSON.parse(photoUrlsRaw);
        // Validate URLs are CDN URLs (not base64)
        // Accept both Shopify CDN URLs and HTTP(S) URLs for backward compatibility
        photoUrlsArray = parsed.filter(url =>
          typeof url === "string" &&
          (url.startsWith("https://cdn.shopify.com") ||
           url.startsWith("http://") ||
           url.startsWith("https://") ||
           url.startsWith("data:")) // Temporary backward compatibility with base64
        );

        // Log warning if base64 detected (should be migrated)
        const hasBase64 = parsed.some(url => url.startsWith("data:"));
        if (hasBase64) {
          console.warn("⚠️ Base64 images detected in submission - should use CDN URLs");
        }
      }
    } catch (error) {
      console.error("Error parsing photo URLs:", error);
      photoUrlsArray = [];
    }

    // Save to database (public submissions don't require authentication)
    try {
      const submission = await prisma.submission.create({
        data: {
          shop: shop.trim(), // Store actual shop domain or "public" for legacy submissions
          submitterName: submitterName.trim(),
          submitterEmail: submitterEmail.trim(),
          victimName: victimName && victimName.trim() !== "" ? victimName.trim() : null,
          relation: relation && relation.trim() !== "" ? relation.trim() : null,
          incidentDate: incidentDate.trim(),
          state: state.trim(),
          zipCode: zipCode && zipCode.trim() !== "" ? zipCode.trim() : null,
          roadUserType: roadUserType.trim(),
          injuryType: injuryType.trim(),
          age: parsedAge && !isNaN(parsedAge) ? parsedAge : null,
          gender: gender && gender.trim() !== "" ? gender.trim() : null,
          shortTitle: victimName && victimName.trim() !== "" ? victimName.trim() : `Story from ${state}`,
          victimStory: victimStory.trim(),
          interestedInContact: parsedInterested,
          photoUrls: JSON.stringify(photoUrlsArray),
          status: "pending", // Pending admin review
        },
      });

      console.log("✅ Story saved to database:", submission.id);

      return json(
        {
          success: true,
          message: "Your submission has been received. Thank you for sharing this story.",
          submissionId: submission.id,
        },
        { status: 201, headers: corsHeaders }
      );
    } catch (error) {
      console.error("❌ Database error:", error);
      console.error("Error details:", {
        message: error.message,
        code: error.code,
        meta: error.meta,
      });

      return json(
        {
          error: `Submission error: ${error.message}. Please try again or contact support.`,
        },
        { status: 500, headers: corsHeaders }
      );
    }
  } catch (error) {
    console.error("Form submission error:", error);
    console.error("Error stack:", error.stack);

    return json(
      {
        error: `Submission error: ${error.message}`,
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
