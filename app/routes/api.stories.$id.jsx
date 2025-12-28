import { json } from "@remix-run/node";
import prisma from "../db.server";

// CORS headers for cross-origin requests from Shopify storefronts
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export async function loader({ params, request }) {
  // Handle CORS preflight
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }

  try {
    const submission = await prisma.submission.findUnique({
      where: { id: params.id },
    });

    if (!submission) {
      return json(
        { error: "Story not found" },
        { status: 404, headers: corsHeaders }
      );
    }

    const story = {
      id: submission.id,
      title: submission.shortTitle,
      victimName: submission.victimName,
      category: submission.roadUserType,
      state: submission.state,
      date: submission.incidentDate,
      status: submission.status,
      age: submission.age,
      gender: submission.gender,
      injuryType: submission.injuryType,
      year: new Date(submission.incidentDate).getFullYear().toString(),
      images: submission.photoUrls ? JSON.parse(submission.photoUrls) : [],
      description: submission.victimStory,
      relation: submission.relation,
      submitterName: submission.submitterName,
    };

    return json({ story }, { headers: corsHeaders });
  } catch (error) {
    console.error("Error fetching story:", error);
    return json(
      { error: "Failed to fetch story" },
      { status: 500, headers: corsHeaders }
    );
  }
}
