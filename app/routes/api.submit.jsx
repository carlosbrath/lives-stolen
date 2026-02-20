import prisma from "../db.server";
import { rateLimitSubmission } from "../utils/rateLimit.server";
import {
  handleCors,
  jsonResponse,
  errorResponse,
  parsePhotoUrls,
  trimOrNull,
} from "../utils/api.server";

const REQUIRED_FIELDS = [
  "submitterName",
  "submitterEmail",
  "incidentDate",
  "state",
  "roadUserType",
  "injuryType",
  "victimStory",
];

export async function action({ request }) {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  if (request.method !== "POST") {
    return errorResponse("Method not allowed", 405, "METHOD_NOT_ALLOWED");
  }

  try {
    const formData = await request.formData();
    const data = Object.fromEntries(formData);

    // Rate limiting
    if (data.submitterEmail) {
      const rateLimited = rateLimitSubmission(request, data.submitterEmail);
      if (rateLimited) {
        return errorResponse("Rate limit exceeded. Please try again later.", 429, "RATE_LIMITED");
      }
    }

    // Validate required fields
    const errors = {};
    REQUIRED_FIELDS.forEach((field) => {
      if (!data[field]?.trim()) {
        errors[field] = `${field} is required`;
      }
    });

    if (Object.keys(errors).length > 0) {
      return jsonResponse({ errors, success: false }, 400);
    }

    // Parse photo URLs - filter valid URLs only
    const photoUrls = parsePhotoUrls(data.photoUrls).filter(
      (url) => typeof url === "string" && (url.startsWith("http") || url.startsWith("data:"))
    );

    const submission = await prisma.submission.create({
      data: {
        shop: data.shop?.trim() || "public",
        submitterName: data.submitterName.trim(),
        submitterEmail: data.submitterEmail.trim(),
        victimName: trimOrNull(data.victimName),
        incidentDate: data.incidentDate.trim(),
        state: data.state.trim(),
        zipCode: trimOrNull(data.zipCode),
        roadUserType: data.roadUserType.trim(),
        injuryType: data.injuryType.trim(),
        age: data.age ? parseInt(data.age, 10) : null,
        gender: trimOrNull(data.gender),
        shortTitle: data.victimName?.trim() || `Story from ${data.state.trim()}`,
        victimStory: data.victimStory.trim(),
        interestedInContact: data.interestedInContact === "yes" || data.interestedInContact === "true",
        photoUrls: JSON.stringify(photoUrls),
        status: "pending",
      },
    });

    return jsonResponse(
      {
        success: true,
        message: "Your submission has been received. Thank you for sharing this story.",
        submissionId: submission.id,
      },
      201
    );
  } catch (error) {
    console.error("Submission error:", error);
    return errorResponse(`Submission error: ${error.message}`, 500, "SUBMISSION_ERROR");
  }
}
