import { sessionStorage } from "../shopify.server";
import { uploadImagesToShopify } from "../services/shopify.server";
import prisma from "../db.server";

const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

// Normalize shop domain to standard format
export function normalizeShopDomain(shop) {
  if (!shop) return null;

  let normalized = shop.replace(/^https?:\/\//, "").replace(/\/$/, "");

  if (!normalized.includes(".myshopify.com") && !normalized.includes(".")) {
    normalized = `${normalized}.myshopify.com`;
  }

  return normalized;
}

// Load session for a shop
async function loadShopSession(shop) {
  const normalizedShop = normalizeShopDomain(shop);
  const offlineSessionId = `offline_${normalizedShop}`;

  // Try offline session first
  const session = await sessionStorage.loadSession(offlineSessionId);
  if (session?.accessToken) return session;

  // Fallback: search database for matching sessions
  const sessionRecords = await prisma.session.findMany({
    where: {
      OR: [
        { shop: normalizedShop },
        { id: { startsWith: normalizedShop } },
        { id: { startsWith: `offline_${normalizedShop}` } },
      ],
    },
    orderBy: { id: "desc" },
  });

  for (const record of sessionRecords) {
    try {
      const parsed = JSON.parse(record.content);
      if (parsed?.accessToken) return parsed;
    } catch {
      continue;
    }
  }

  return null;
}

// Validate shop has app installed with valid session
async function validateShopAccess(shop) {
  if (!shop) {
    return { valid: false, error: "Shop domain is required" };
  }

  const normalizedShop = normalizeShopDomain(shop);
  const session = await loadShopSession(normalizedShop);

  if (!session) {
    const exists = await prisma.session.findFirst({
      where: {
        OR: [{ shop: normalizedShop }, { id: { contains: normalizedShop } }],
      },
    });

    return {
      valid: false,
      error: exists
        ? `No active session for ${normalizedShop}. Please reinstall the app.`
        : `App not installed on ${normalizedShop}. Please install the app first.`,
    };
  }

  if (!session.accessToken) {
    return { valid: false, error: "Session expired. Please reinstall the app." };
  }

  return { valid: true, session };
}

// Validate a single file
export function validateFile(file) {
  const errors = [];

  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type}. Allowed: JPEG, PNG, GIF, WebP, SVG`);
  }

  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 10MB`);
  }

  if (!file.name || file.name.length > 255) {
    errors.push("Invalid filename (must be 1-255 characters)");
  }

  return { valid: errors.length === 0, errors };
}

// Validate array of files
export function validateFiles(files) {
  if (!Array.isArray(files) || files.length === 0) {
    return { valid: false, errors: ["No files provided"] };
  }

  if (files.length > MAX_FILES) {
    return { valid: false, errors: [`Too many files. Maximum: ${MAX_FILES}`] };
  }

  const allErrors = [];
  files.forEach((file, i) => {
    const { valid, errors } = validateFile(file);
    if (!valid) {
      allErrors.push(`File ${i + 1} (${file.name}): ${errors.join(", ")}`);
    }
  });

  return { valid: allErrors.length === 0, errors: allErrors };
}

// Prepare file for Shopify upload
function prepareFileForUpload(file, index) {
  return {
    filename: file.name || `image-${index + 1}.jpg`,
    data: file,
    mimeType: file.type || "image/jpeg",
    alt: `Story image ${index + 1}`,
  };
}

// Main upload function
export async function uploadFilesToShopify(shop, files) {
  const { valid, error, session } = await validateShopAccess(shop);
  if (!valid) throw new Error(error);

  const filesArray = Array.isArray(files) ? files : [files];
  const { valid: filesValid, errors } = validateFiles(filesArray);
  if (!filesValid) throw new Error(`File validation failed: ${errors.join("; ")}`);

  const preparedFiles = filesArray.map((file, i) => prepareFileForUpload(file, i));
  const normalizedShop = normalizeShopDomain(shop);

  const cdnUrls = await uploadImagesToShopify(normalizedShop, session.accessToken, preparedFiles);

  if (cdnUrls.length === 0) {
    throw new Error("Upload failed: No URLs returned from Shopify");
  }

  return cdnUrls;
}
