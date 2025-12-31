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
    const response = await fetch(`https://${shop}/admin/api/2025-10/graphql.json`, {
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
 * Tries multiple strategies to find a valid session
 */
export async function getStoreSession(shop) {
  try {
    // Normalize shop domain
    let normalizedShop = shop;
    if (!shop.includes('.myshopify.com') && !shop.includes('.')) {
      normalizedShop = `${shop}.myshopify.com`;
    }

    // Strategy 1: Try loading offline session (most stable for background operations)
    const offlineSessionId = `offline_${normalizedShop}`;
    let session = await sessionStorage.loadSession(offlineSessionId);

    if (session?.accessToken) {
      return session;
    }

    // Strategy 2: Search database for ANY session matching this shop
    const sessionRecords = await prisma.session.findMany({
      where: {
        OR: [
          { shop: normalizedShop },
          { id: { startsWith: normalizedShop } },
          { id: { startsWith: `offline_${normalizedShop}` } }
        ]
      },
      orderBy: { id: 'desc' }
    });

    // Try each session until we find one with valid access token
    for (const record of sessionRecords) {
      try {
        if (record.content) {
          const parsedSession = JSON.parse(record.content);
          if (parsedSession?.accessToken) {
            return parsedSession;
          }
        }
      } catch (e) {
        continue;
      }
    }

    return null;
  } catch (error) {
    throw new Error(`Session loading failed: ${error.message}`);
  }
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
 * Poll for file URL after creation (for files that need processing)
 * @param {string} shop - Shop domain
 * @param {string} accessToken - Access token
 * @param {string} fileId - File GID
 * @returns {Promise<string|null>} File URL or null
 */
async function pollForFileUrl(shop, accessToken, fileId, maxAttempts = 10) {
  const query = `
    query getFile($id: ID!) {
      node(id: $id) {
        ... on MediaImage {
          id
          image {
            url
            originalSrc
          }
        }
      }
    }
  `;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const response = await fetch(
        `https://${shop}/admin/api/2025-10/graphql.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query,
            variables: { id: fileId },
          }),
        }
      );

      const result = await response.json();

      if (result.data?.node?.image?.url) {
        return result.data.node.image.url;
      }

      // Wait before next attempt (exponential backoff)
      const waitTime = Math.min(1000 * Math.pow(1.5, attempt - 1), 5000);
      await new Promise(resolve => setTimeout(resolve, waitTime));

    } catch (error) {
      // Continue to next attempt
    }
  }

  return null;
}

/**
 * Upload images to Shopify using Files API
 * Returns URLs that can be used in blog posts and metaobjects
 *
 * @param {string} shop - Shop domain
 * @param {string} accessToken - Shopify access token
 * @param {Array} files - Array of file objects with {filename, data, mimeType}
 * @returns {Promise<Array>} Array of uploaded file URLs
 */
export async function uploadImagesToShopify(shop, accessToken, files) {
  if (!files || files.length === 0) {
    return [];
  }

  const uploadedUrls = [];
  const errors = [];

  for (const file of files) {
    try {
      // Step 1: Generate staged upload URL
      const stagedUploadQuery = `
        mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
          stagedUploadsCreate(input: $input) {
            stagedTargets {
              url
              resourceUrl
              parameters {
                name
                value
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const stagedUploadVariables = {
        input: [
          {
            filename: file.filename || "image.jpg",
            mimeType: file.mimeType || "image/jpeg",
            resource: "FILE",
            httpMethod: "POST",
          },
        ],
      };

      console.log(`[DEBUG SHOPIFY] Making request to: https://${shop}/admin/api/2025-10/graphql.json`);
      console.log(`[DEBUG SHOPIFY] Access token: ${accessToken ? accessToken.substring(0, 15) + '...' : 'MISSING'}`);

      const stagedResponse = await fetch(
        `https://${shop}/admin/api/2025-10/graphql.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: stagedUploadQuery,
            variables: stagedUploadVariables,
          }),
        }
      );

      console.log(`[DEBUG SHOPIFY] Response status: ${stagedResponse.status}`);
      const stagedResult = await stagedResponse.json();
      console.log(`[DEBUG SHOPIFY] Response:`, JSON.stringify(stagedResult, null, 2));

      if (stagedResult.errors) {
        const errorMsg = `Shopify API error: ${stagedResult.errors[0]?.message || 'Invalid API key or access token'}`;
        errors.push(errorMsg);
        continue;
      }

      if (stagedResult.data?.stagedUploadsCreate?.userErrors?.length > 0) {
        const errorMsg = `Upload error: ${stagedResult.data.stagedUploadsCreate.userErrors[0]?.message}`;
        errors.push(errorMsg);
        continue;
      }

      const stagedTarget = stagedResult.data.stagedUploadsCreate.stagedTargets[0];

      // Step 2: Upload file to staged URL
      const formData = new FormData();

      // Add parameters from Shopify
      stagedTarget.parameters.forEach((param) => {
        formData.append(param.name, param.value);
      });

      // Add the actual file data
      if (file.data instanceof Blob || file.data instanceof File) {
        formData.append("file", file.data, file.filename);
      } else if (Buffer.isBuffer(file.data)) {
        const blob = new Blob([file.data], { type: file.mimeType });
        formData.append("file", blob, file.filename);
      } else if (typeof file.data === "string" && file.data.startsWith("data:")) {
        const base64Data = file.data.split(",")[1];
        const buffer = Buffer.from(base64Data, "base64");
        const blob = new Blob([buffer], { type: file.mimeType });
        formData.append("file", blob, file.filename);
      } else {
        errors.push("Unsupported file data format");
        continue;
      }

      const uploadResponse = await fetch(stagedTarget.url, {
        method: "POST",
        body: formData,
      });

      if (!uploadResponse.ok) {
        const errorMsg = `File upload failed with status ${uploadResponse.status}`;
        errors.push(errorMsg);
        continue;
      }

      // Step 3: Create file record in Shopify
      const fileCreateQuery = `
        mutation fileCreate($files: [FileCreateInput!]!) {
          fileCreate(files: $files) {
            files {
              __typename
              ... on GenericFile {
                id
                url
                alt
              }
              ... on MediaImage {
                id
                alt
                image {
                  url
                  altText
                  originalSrc
                }
              }
            }
            userErrors {
              field
              message
            }
          }
        }
      `;

      const fileCreateVariables = {
        files: [
          {
            alt: file.alt || file.filename || "Story image",
            contentType: "IMAGE",
            originalSource: stagedTarget.resourceUrl,
          },
        ],
      };

      const fileCreateResponse = await fetch(
        `https://${shop}/admin/api/2025-10/graphql.json`,
        {
          method: "POST",
          headers: {
            "X-Shopify-Access-Token": accessToken,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            query: fileCreateQuery,
            variables: fileCreateVariables,
          }),
        }
      );

      const fileCreateResult = await fileCreateResponse.json();

      if (fileCreateResult.errors) {
        const errorMsg = `File create error: ${fileCreateResult.errors[0]?.message || 'Unknown error'}`;
        errors.push(errorMsg);
        continue;
      }

      if (fileCreateResult.data?.fileCreate?.userErrors?.length > 0) {
        const errorMsg = `File create error: ${fileCreateResult.data.fileCreate.userErrors[0]?.message}`;
        errors.push(errorMsg);
        continue;
      }

      const createdFile = fileCreateResult.data.fileCreate.files[0];

      // Extract URL based on file type
      let fileUrl = null;

      if (createdFile.url) {
        // GenericFile type has direct url property
        fileUrl = createdFile.url;
      } else if (createdFile.image?.url) {
        // MediaImage type has nested image.url property
        fileUrl = createdFile.image.url;
      } else if (createdFile.__typename === 'MediaImage' && createdFile.id) {
        // MediaImage created but URL not ready yet - poll for it
        fileUrl = await pollForFileUrl(shop, accessToken, createdFile.id);
      }

      if (fileUrl) {
        uploadedUrls.push(fileUrl);
      } else {
        const errorMsg = `File uploaded but URL not available`;
        errors.push(errorMsg);
      }
    } catch (error) {
      const errorMsg = `Error uploading ${file.filename}: ${error.message}`;
      errors.push(errorMsg);
    }
  }

  // If all uploads failed, throw an error with details
  if (uploadedUrls.length === 0 && errors.length > 0) {
    throw new Error(`All image uploads failed. Errors: ${errors.join('; ')}`);
  }

  return uploadedUrls;
}

/**
 * Upload images for public submissions (requires shop domain)
 * Loads session from shop domain instead of using authenticated session
 * @param {string} shop - Shop domain
 * @param {Array} files - Array of file objects
 * @returns {Promise<Array>} Array of CDN URLs
 */
export async function uploadImagesForPublicSubmission(shop, files) {
  if (!files || files.length === 0) {
    return [];
  }

  try {
    const session = await getStoreSession(shop);

    if (!session || !session.accessToken) {
      throw new Error(`No active session found for shop: ${shop}. App may not be installed.`);
    }

    let normalizedShop = shop;
    if (!shop.includes('.myshopify.com') && !shop.includes('.')) {
      normalizedShop = `${shop}.myshopify.com`;
    }

    return await uploadImagesToShopify(normalizedShop, session.accessToken, files);

  } catch (error) {
    throw new Error(`Failed to upload images: ${error.message}`);
  }
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
