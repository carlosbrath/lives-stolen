import { sessionStorage } from "../shopify.server";
import { uploadImagesToShopify } from "../services/shopify.server";
import prisma from "../db.server";

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml'
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const MAX_FILES = 10;

/**
 * Normalize shop domain to standard format
 * @param {string} shop - Shop domain in various formats
 * @returns {string} Normalized shop domain
 */
export function normalizeShopDomain(shop) {
  if (!shop) return null;

  // Remove protocol if present
  let normalized = shop.replace(/^https?:\/\//, '');

  // Remove trailing slash
  normalized = normalized.replace(/\/$/, '');

  // If it doesn't include .myshopify.com, add it
  if (!normalized.includes('.myshopify.com') && !normalized.includes('.')) {
    normalized = `${normalized}.myshopify.com`;
  }

  return normalized;
}

/**
 * Load session for a shop
 * @param {string} shop - Shop domain
 * @returns {Promise<Session|null>} Session object or null
 */
export async function loadShopSession(shop) {
  try {
    const normalizedShop = normalizeShopDomain(shop);

    // Try loading offline session first (more stable for public operations)
    const offlineSessionId = `offline_${normalizedShop}`;
    let session = await sessionStorage.loadSession(offlineSessionId);

    if (session && session.accessToken) {
      console.log(`✓ Loaded offline session for ${normalizedShop}`);
      return session;
    }

    // Fallback: try finding any session for this shop in database
    const sessionRecord = await prisma.session.findFirst({
      where: { shop: normalizedShop },
      orderBy: { id: 'desc' }
    });

    if (sessionRecord) {
      console.log(`✓ Loaded session from database for ${normalizedShop}`);
      // Parse the session JSON
      const parsedSession = JSON.parse(sessionRecord.content);
      return parsedSession;
    }

    console.warn(`⚠ No session found for ${normalizedShop}`);
    return null;
  } catch (error) {
    console.error(`Error loading session for ${shop}:`, error);
    return null;
  }
}

/**
 * Validate that shop has app installed and has valid session
 * @param {string} shop - Shop domain
 * @returns {Promise<{valid: boolean, error?: string, session?: Session}>}
 */
export async function validateShopAccess(shop) {
  if (!shop) {
    return { valid: false, error: 'Shop domain is required' };
  }

  const normalizedShop = normalizeShopDomain(shop);
  const session = await loadShopSession(normalizedShop);

  if (!session) {
    return {
      valid: false,
      error: `Shop ${normalizedShop} not found or app not installed`
    };
  }

  if (!session.accessToken) {
    return {
      valid: false,
      error: 'Shop session has expired. Please reinstall the app.'
    };
  }

  return { valid: true, session };
}

/**
 * Validate a single file
 * @param {File} file - File object to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateFile(file) {
  const errors = [];

  // Check file type
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    errors.push(`Invalid file type: ${file.type}. Allowed: JPEG, PNG, GIF, WebP, SVG`);
  }

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum: 10MB`);
  }

  // Check filename
  if (!file.name || file.name.length > 255) {
    errors.push('Invalid filename (must be 1-255 characters)');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validate array of files
 * @param {File[]} files - Array of files to validate
 * @returns {{valid: boolean, errors: string[]}}
 */
export function validateFiles(files) {
  if (!Array.isArray(files)) {
    return { valid: false, errors: ['Files must be an array'] };
  }

  if (files.length === 0) {
    return { valid: false, errors: ['No files provided'] };
  }

  if (files.length > MAX_FILES) {
    return { valid: false, errors: [`Too many files. Maximum: ${MAX_FILES}`] };
  }

  const allErrors = [];
  files.forEach((file, index) => {
    const { valid, errors } = validateFile(file);
    if (!valid) {
      allErrors.push(`File ${index + 1} (${file.name}): ${errors.join(', ')}`);
    }
  });

  return {
    valid: allErrors.length === 0,
    errors: allErrors
  };
}

/**
 * Convert web File/Blob to format expected by uploadImagesToShopify
 * @param {File|Blob} file - File or Blob object
 * @param {number} index - File index for naming
 * @returns {Promise<{filename: string, data: Blob, mimeType: string, alt: string}>}
 */
export async function prepareFileForUpload(file, index) {
  const filename = file.name || `image-${index + 1}.jpg`;
  const mimeType = file.type || 'image/jpeg';

  return {
    filename,
    data: file, // File/Blob can be passed directly
    mimeType,
    alt: `Story image ${index + 1}`
  };
}

/**
 * Main upload coordinator - uploads files to Shopify Files API
 * @param {string} shop - Shop domain
 * @param {File[]|Blob[]} files - Array of File or Blob objects
 * @returns {Promise<string[]>} Array of CDN URLs
 * @throws {Error} If shop validation fails or upload fails
 */
export async function uploadFilesToShopify(shop, files) {
  // Validate shop access
  const { valid, error, session } = await validateShopAccess(shop);
  if (!valid) {
    throw new Error(error);
  }

  // Validate files
  const filesArray = Array.isArray(files) ? files : [files];
  const { valid: filesValid, errors } = validateFiles(filesArray);
  if (!filesValid) {
    throw new Error(`File validation failed: ${errors.join('; ')}`);
  }

  // Prepare files for upload
  const preparedFiles = await Promise.all(
    filesArray.map((file, index) => prepareFileForUpload(file, index))
  );

  // Upload to Shopify using existing function
  const normalizedShop = normalizeShopDomain(shop);
  const cdnUrls = await uploadImagesToShopify(
    normalizedShop,
    session.accessToken,
    preparedFiles
  );

  if (cdnUrls.length === 0) {
    throw new Error('Upload failed: No URLs returned from Shopify');
  }

  console.log(`✓ Uploaded ${cdnUrls.length} files to Shopify for ${normalizedShop}`);
  return cdnUrls;
}
