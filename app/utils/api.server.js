import { json } from "@remix-run/node";

// CORS headers for Shopify storefront requests
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

// Handle CORS preflight
export function handleCors(request) {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  return null;
}

// JSON response with CORS headers
export function jsonResponse(data, status = 200) {
  return json(data, { status, headers: corsHeaders });
}

// Error response with CORS headers
export function errorResponse(message, status = 500, code = "ERROR") {
  return json(
    { error: message, code, success: false },
    { status, headers: corsHeaders }
  );
}

// Transform database submission to API story format
export function toStoryFormat(sub) {
  const photoUrls = parsePhotoUrls(sub.photoUrls);

  return {
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
    year: sub.incidentDate ? new Date(sub.incidentDate).getFullYear().toString() : null,
    images: photoUrls,
    description: sub.victimStory,
    relation: sub.relation,
    submitterName: sub.submitterName,
  };
}

// Parse photo URLs (handles both JSON string and array, extracts URL from object format)
export function parsePhotoUrls(photoUrls) {
  if (!photoUrls) return [];

  let parsed;
  if (Array.isArray(photoUrls)) {
    parsed = photoUrls;
  } else {
    try {
      parsed = JSON.parse(photoUrls);
    } catch {
      return [];
    }
  }

  if (!Array.isArray(parsed)) return [];

  // Handle both object format {originalUrl, currentUrl} and plain string URL format
  return parsed.map((item) => {
    if (typeof item === "string") {
      return item;
    }
    // Return currentUrl if it exists (edited/cropped image), otherwise originalUrl
    return item.currentUrl || item.originalUrl || "";
  }).filter(Boolean);
}

// Age range to numeric value mapping
const AGE_RANGE_MAP = {
  "0-17": 8,
  "18-30": 24,
  "31-45": 38,
  "46-60": 53,
  "60+": 65,
};

export function parseAgeRange(ageRange) {
  if (!ageRange?.trim()) return null;
  return AGE_RANGE_MAP[ageRange.trim()] || null;
}

// Check if age falls within a range string (e.g., "18-30" or "60+")
export function ageInRange(age, rangeStr) {
  if (rangeStr.includes("+")) {
    return age >= parseInt(rangeStr);
  }
  const [min, max] = rangeStr.split("-").map(Number);
  return age >= min && age <= max;
}

// Trim string or return null
export function trimOrNull(value) {
  const trimmed = value?.trim();
  return trimmed || null;
}
