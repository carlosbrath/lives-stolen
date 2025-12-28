import { json } from "@remix-run/node";
import prisma from "../db.server";

// CORS headers for cross-origin requests from Shopify storefronts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ request }) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const url = new URL(request.url);

    // Get filter parameters from query string
    const roadUserType = url.searchParams.getAll("roadUserType");
    const ageRange = url.searchParams.getAll("ageRange");
    const gender = url.searchParams.getAll("gender");
    const injuryType = url.searchParams.get("injuryType");
    const state = url.searchParams.getAll("state");
    const year = url.searchParams.getAll("year");
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const offset = parseInt(url.searchParams.get("offset") || "0");

    // Build where clause
    const where = {
      status: "published",
    };

    // Fetch published stories from database
    const submissions = await prisma.submission.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      take: limit,
      skip: offset,
    });

    // Transform database submissions to match the expected story format
    let stories = submissions.map((sub) => ({
      id: sub.id,
      title: sub.shortTitle,
      victimName: sub.victimName,
      category: sub.roadUserType,
      state: sub.state,
      date: sub.incidentDate,
      status: sub.status,
      age: sub.age,
      gender: sub.gender,
      injuryType: sub.injuryType,
      year: new Date(sub.incidentDate).getFullYear().toString(),
      images: sub.photoUrls ? sub.photoUrls : [],
      description: sub.victimStory,
      relation: sub.relation,
      submitterName: sub.submitterName,
    }));

    // Apply client-side filters (since we're doing filtering in JS on frontend too)
    if (roadUserType.length > 0) {
      stories = stories.filter((story) => roadUserType.includes(story.category));
    }

    if (ageRange.length > 0) {
      stories = stories.filter((story) => {
        return ageRange.some((range) => {
          const [min, max] = range.includes("+")
            ? [parseInt(range), Infinity]
            : range.split("-").map(Number);
          return story.age >= min && story.age <= max;
        });
      });
    }

    if (gender.length > 0) {
      stories = stories.filter((story) => gender.includes(story.gender));
    }

    if (injuryType) {
      stories = stories.filter((story) => story.injuryType === injuryType);
    }

    if (state.length > 0) {
      stories = stories.filter((story) => state.includes(story.state));
    }

    if (year.length > 0) {
      stories = stories.filter((story) => year.includes(story.year));
    }

    // Calculate stats
    const stats = {
      total: stories.length,
      livesStolen: stories.filter((s) => s.injuryType === "Fatal").length,
      livesShattered: stories.filter((s) => s.injuryType === "Non-fatal").length,
    };

    return json(
      { stories, stats },
      {
        headers: corsHeaders,
      }
    );
  } catch (error) {
    console.error("Error fetching stories:", error);
    return json(
      { error: "Failed to fetch stories", stories: [], stats: { total: 0, livesStolen: 0, livesShattered: 0 } },
      { status: 500, headers: corsHeaders }
    );
  }
}
