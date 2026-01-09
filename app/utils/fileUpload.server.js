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
 * Load session for a shop - tries multiple methods
 * @param {string} shop - Shop domain
 * @returns {Promise<Session|null>} Session object or null
 */
export async function loadShopSession(shop) {
  try {
    const normalizedShop = normalizeShopDomain(shop);
    console.log(`[DEBUG] Loading session for: ${shop} -> normalized: ${normalizedShop}`);

    // Strategy 1: Try offline session with format: offline_shop.myshopify.com
    const offlineSessionId = `offline_${normalizedShop}`;
    console.log(`[DEBUG] Trying offline session ID: ${offlineSessionId}`);
    let session = await sessionStorage.loadSession(offlineSessionId);

    if (session?.accessToken) {
      console.log(`[DEBUG] ✅ Found offline session with access token`);
      console.log(`[DEBUG] Access token: ${session.accessToken.substring(0, 15)}...`);
      console.log(`[DEBUG] Scopes: ${session.scope || 'NOT SET'}`);
      console.log(`[DEBUG] Shop: ${session.shop}`);
      console.log(`[DEBUG] Is online: ${session.isOnline}`);
      return session;
    }

    console.log(`[DEBUG] ❌ Offline session not found, trying database...`);

    // Strategy 2: Search database directly for ANY session matching this shop
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

    console.log(`[DEBUG] Found ${sessionRecords.length} session records in database`);
    sessionRecords.forEach(r => console.log(`  - ID: ${r.id}, Shop: ${r.shop}`));

    // Try each session record until we find one with valid access token
    for (const record of sessionRecords) {
      try {
        const parsedSession = JSON.parse(record.content);
        if (parsedSession?.accessToken) {
          console.log(`[DEBUG] ✅ Found valid session in database: ${record.id}`);
          return parsedSession;
        }
      } catch (e) {
        console.log(`[DEBUG] ⚠️ Failed to parse session: ${record.id}`);
        continue;
      }
    }

    // Last resort: Get ALL sessions and see what we have
    console.log(`[DEBUG] No matching sessions found. Checking ALL sessions...`);
    const allSessions = await prisma.session.findMany({
      select: { id: true, shop: true },
      take: 10
    });
    console.log(`[DEBUG] Total sessions in DB: ${allSessions.length}`);
    allSessions.forEach(s => console.log(`  - ID: ${s.id}, Shop: ${s.shop}`));

    return null;
  } catch (error) {
    console.error(`[DEBUG] ❌ Session loading error:`, error);
    throw new Error(`Session loading failed: ${error.message}`);
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

  try {
    const session = await loadShopSession(normalizedShop);

    if (!session) {
      // Check if shop exists in database at all
      const shopExists = await prisma.session.findFirst({
        where: {
          OR: [
            { shop: normalizedShop },
            { id: { contains: normalizedShop } }
          ]
        }
      });

      if (!shopExists) {
        return {
          valid: false,
          error: `App not installed on ${normalizedShop}. Please install the app first.`
        };
      }

      return {
        valid: false,
        error: `No active session found for ${normalizedShop}. Please reinstall the app.`
      };
    }

    if (!session.accessToken) {
      return {
        valid: false,
        error: 'Session expired. Please reinstall the app.'
      };
    }

    return { valid: true, session };
  } catch (error) {
    return {
      valid: false,
      error: `Session validation failed: ${error.message}`
    };
  }
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

  return cdnUrls;
}
