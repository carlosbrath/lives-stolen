import prisma from "../db.server";
import {
  handleCors,
  jsonResponse,
  errorResponse,
  toStoryFormat,
  ageInRange,
} from "../utils/api.server";

export async function loader({ request }) {
  const corsResponse = handleCors(request);
  if (corsResponse) return corsResponse;

  try {
    const url = new URL(request.url);
    const params = {
      roadUserType: url.searchParams.getAll("roadUserType"),
      ageRange: url.searchParams.getAll("ageRange"),
      gender: url.searchParams.getAll("gender"),
      injuryType: url.searchParams.get("injuryType"),
      state: url.searchParams.getAll("state"),
      year: url.searchParams.getAll("year"),
      limit: parseInt(url.searchParams.get("limit") || "100"),
      offset: parseInt(url.searchParams.get("offset") || "0"),
    };

    // Build Prisma where clause with available filters
    const where = { status: "published" };
    if (params.roadUserType.length) where.roadUserType = { in: params.roadUserType };
    if (params.gender.length) where.gender = { in: params.gender };
    if (params.injuryType) where.injuryType = params.injuryType;
    if (params.state.length) where.state = { in: params.state };

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: params.limit,
      skip: params.offset,
    });

    let stories = submissions.map(toStoryFormat);

    // Client-side filters for complex conditions
    if (params.ageRange.length) {
      stories = stories.filter(
        (s) => s.age && params.ageRange.some((range) => ageInRange(s.age, range))
      );
    }

    if (params.year.length) {
      stories = stories.filter((s) => params.year.includes(s.year));
    }

    const stats = {
      total: stories.length,
      livesStolen: stories.filter((s) => s.injuryType === "Fatal").length,
      livesShattered: stories.filter((s) => s.injuryType === "Non-fatal").length,
    };

    return jsonResponse({ stories, stats });
  } catch (error) {
    console.error("Error fetching stories:", error);
    return errorResponse(
      "Failed to fetch stories",
      500,
      "FETCH_ERROR"
    );
  }
}
