import prisma from "../db.server";
import {
  handleCors,
  jsonResponse,
  errorResponse,
  toStoryFormat,
} from "../utils/api.server";

export async function loader({ params, request }) {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
    });

    if (!submission) {
      return errorResponse("Story not found", 404, "NOT_FOUND");
    }

    return jsonResponse({ story: toStoryFormat(submission) });
  } catch (error) {
    console.error("Error fetching story:", error);
    return errorResponse("Failed to fetch story", 500, "FETCH_ERROR");
  }
}
