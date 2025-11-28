import { sessionStorage } from "../shopify.server";
import prisma from "../db.server";

/**
 * Creates a blog post in Shopify using the Admin API
 * This function requires write_blogs scope
 */
export async function createBlogPostInShopify(
  shop,
  accessToken,
  { title, body, excerpt, tags, featured_image }
) {
  const query = `
    mutation CreateBlogArticle($input: BlogArticleInput!) {
      blogArticleCreate(input: $input) {
        article {
          id
          title
          handle
          status
          publishedAt
          onlineStoreUrl
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      blogHandle: "community-stories", // Default blog handle
      title,
      bodyHtml: body,
      excerpt,
      tags,
      image: featured_image ? { src: featured_image } : null,
    },
  };

  try {
    const response = await fetch(`https://${shop}/admin/api/2025-01/graphql.json`, {
      method: "POST",
      headers: {
        "X-Shopify-Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, variables }),
    });

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL Error: ${JSON.stringify(result.errors)}`);
    }

    if (result.data?.blogArticleCreate?.userErrors?.length > 0) {
      throw new Error(
        `Shopify Error: ${JSON.stringify(result.data.blogArticleCreate.userErrors)}`
      );
    }

    return result.data.blogArticleCreate.article;
  } catch (error) {
    console.error("Error creating blog post:", error);
    throw error;
  }
}

/**
 * Get the session for a specific store
 */
export async function getStoreSession(shop) {
  const session = await sessionStorage.loadSession(shop);
  return session;
}

/**
 * Get access token for a store
 */
export async function getAccessTokenForStore(shop) {
  try {
    const session = await getStoreSession(shop);
    return session?.accessToken;
  } catch (error) {
    console.error("Error getting access token:", error);
    return null;
  }
}

/**
 * Upload images to Shopify using Files API
 * Returns URLs that can be used in blog posts
 */
export async function uploadImagesToShopify(shop, accessToken, files) {
  // For now, we'll return placeholder URLs since file upload is complex
  // In production, you would use Shopify's File Upload API or host images externally
  // and return the hosted URLs

  // Example: using external image hosting (Cloudinary, S3, etc)
  const imageUrls = [];

  for (const file of files) {
    try {
      // This is a placeholder - in production, upload to your image service
      // For now, we'll use data URLs or external CDN
      if (file.data) {
        // If you have base64 data, convert to external URL
        // This is simplified - you'd typically upload to Cloudinary or similar
        imageUrls.push(`https://via.placeholder.com/800x600?text=Image`);
      }
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  }

  return imageUrls;
}

/**
 * Format submission data as HTML for blog post
 */
export function formatSubmissionAsHTML({
  category,
  date,
  location,
  details,
  driverAccountable,
  firstName,
  lastName,
  imageUrls = [],
}) {
  let html = `
    <p><strong>Category:</strong> ${category}</p>
    <p><strong>Date:</strong> ${date}</p>
    <p><strong>Location:</strong> ${location}</p>
    <p><strong>Submitted by:</strong> ${firstName} ${lastName}</p>

    <h2>Story</h2>
    <p>${details.split("\n").map((p) => `<p>${p}</p>`).join("")}</p>
  `;

  if (driverAccountable) {
    html += `
      <h2>Driver Accountability</h2>
      <p>${driverAccountable}</p>
    `;
  }

  if (imageUrls && imageUrls.length > 0) {
    html += "<h2>Images</h2>";
    imageUrls.forEach((url) => {
      html += `<img src="${url}" alt="Story image" style="max-width: 100%; height: auto; margin: 10px 0;" />`;
    });
  }

  return html;
}

/**
 * Save submission to database
 */
export async function saveSubmissionToDatabase(shop, submissionData, blogPostData) {
  try {
    const submission = await prisma.submission.create({
      data: {
        shop,
        firstName: submissionData.firstName,
        lastName: submissionData.lastName,
        email: submissionData.email,
        category: submissionData.category,
        date: submissionData.date,
        location: submissionData.location,
        details: submissionData.details,
        driverAccountable: submissionData.driverAccountable,
        imageUrls: submissionData.imageUrls
          ? JSON.stringify(submissionData.imageUrls)
          : null,
        podcastContact: submissionData.podcast || false,
        permission: submissionData.permission || false,
        blogPostId: blogPostData.id,
        blogPostUrl: blogPostData.onlineStoreUrl,
        status: "pending", // Draft status in Shopify
      },
    });

    return submission;
  } catch (error) {
    console.error("Error saving submission to database:", error);
    throw error;
  }
}

/**
 * Get all submissions for a store
 */
export async function getSubmissionsForStore(shop, status = null) {
  try {
    const where = { shop };
    if (status) {
      where.status = status;
    }

    const submissions = await prisma.submission.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
    });

    return submissions.map((sub) => ({
      ...sub,
      imageUrls: sub.imageUrls ? JSON.parse(sub.imageUrls) : [],
    }));
  } catch (error) {
    console.error("Error fetching submissions:", error);
    return [];
  }
}

/**
 * Get a single submission
 */
export async function getSubmission(id) {
  try {
    const submission = await prisma.submission.findUnique({
      where: { id },
    });

    if (submission) {
      return {
        ...submission,
        imageUrls: submission.imageUrls ? JSON.parse(submission.imageUrls) : [],
      };
    }

    return null;
  } catch (error) {
    console.error("Error fetching submission:", error);
    return null;
  }
}

/**
 * Update submission status
 */
export async function updateSubmissionStatus(id, status, adminNotes = null) {
  try {
    const submission = await prisma.submission.update({
      where: { id },
      data: {
        status,
        adminNotes,
        publishedAt: status === "published" ? new Date() : null,
      },
    });

    return submission;
  } catch (error) {
    console.error("Error updating submission:", error);
    throw error;
  }
}
