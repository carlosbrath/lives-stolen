import prisma from "../app/db.server.js";
import { uploadImagesForPublicSubmission } from "../app/services/shopify.server.js";

/**
 * Migration Script: Base64 to CDN URLs
 *
 * This script migrates existing base64-encoded images in the database
 * to Shopify CDN URLs by uploading them to Shopify Files API.
 *
 * Usage:
 *   node scripts/migrate-base64-to-cdn.js
 *
 * Options:
 *   --dry-run    Show what would be migrated without making changes
 *   --limit=N    Only process first N submissions
 */

const DRY_RUN = process.argv.includes('--dry-run');
const LIMIT_ARG = process.argv.find(arg => arg.startsWith('--limit='));
const LIMIT = LIMIT_ARG ? parseInt(LIMIT_ARG.split('=')[1]) : null;

/**
 * Convert base64 data URL to file object format
 */
function base64ToFileObject(dataUrl, index) {
  try {
    const matches = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      throw new Error('Invalid base64 data URL');
    }

    const mimeType = matches[1];
    const base64Data = matches[2];

    // Determine file extension from mime type
    const ext = mimeType.split('/')[1] || 'jpg';
    const filename = `migrated-image-${index + 1}.${ext}`;

    return {
      filename,
      data: dataUrl, // uploadImagesToShopify handles base64 strings
      mimeType,
      alt: `Story image ${index + 1}`
    };
  } catch (error) {
    console.error('Error converting base64 to file object:', error.message);
    return null;
  }
}

/**
 * Migrate a single submission
 */
async function migrateSubmission(submission) {
  try {
    const photoUrls = JSON.parse(submission.photoUrls || "[]");

    // Check if already migrated (CDN URLs don't start with data:)
    const hasBase64 = photoUrls.some(url => url.startsWith("data:"));

    if (!hasBase64) {
      console.log(`✓ Submission ${submission.id} already migrated (has ${photoUrls.length} CDN URLs)`);
      return { success: true, alreadyMigrated: true, photoCount: photoUrls.length };
    }

    // Extract base64 images
    const base64Images = photoUrls.filter(url => url.startsWith("data:"));
    const cdnImages = photoUrls.filter(url => !url.startsWith("data:"));

    if (base64Images.length === 0) {
      return { success: true, noImages: true };
    }

    console.log(`\n📸 Processing submission ${submission.id}:`);
    console.log(`   Shop: ${submission.shop}`);
    console.log(`   Base64 images: ${base64Images.length}`);
    console.log(`   Already CDN: ${cdnImages.length}`);

    // Determine shop (skip if "public" - can't upload without shop)
    const shop = submission.shop;
    if (shop === "public" || !shop) {
      console.log(`   ⚠️  Cannot migrate - shop is "${shop}" (need valid shop domain)`);
      return { success: false, reason: "invalid_shop" };
    }

    if (DRY_RUN) {
      console.log(`   [DRY RUN] Would upload ${base64Images.length} images to shop: ${shop}`);
      return { success: true, dryRun: true, imageCount: base64Images.length };
    }

    // Convert base64 to file objects
    const files = base64Images
      .map((dataUrl, index) => base64ToFileObject(dataUrl, index))
      .filter(file => file !== null);

    if (files.length === 0) {
      throw new Error("No valid files to upload after conversion");
    }

    console.log(`   ⬆️  Uploading ${files.length} files to Shopify...`);

    // Upload to Shopify
    const newCdnUrls = await uploadImagesForPublicSubmission(shop, files);

    if (newCdnUrls.length === 0) {
      throw new Error("Upload returned no URLs");
    }

    console.log(`   ✅ Uploaded ${newCdnUrls.length} images successfully`);

    // Combine existing CDN URLs with new ones
    const allCdnUrls = [...cdnImages, ...newCdnUrls];

    // Update database with CDN URLs
    await prisma.submission.update({
      where: { id: submission.id },
      data: {
        photoUrls: JSON.stringify(allCdnUrls),
        adminNotes: submission.adminNotes
          ? `${submission.adminNotes}\n[Migrated ${base64Images.length} base64 images to CDN on ${new Date().toISOString()}]`
          : `Migrated ${base64Images.length} base64 images to CDN on ${new Date().toISOString()}`
      }
    });

    console.log(`   💾 Database updated with ${allCdnUrls.length} total CDN URLs`);

    return {
      success: true,
      migratedCount: newCdnUrls.length,
      totalCdnCount: allCdnUrls.length
    };

  } catch (error) {
    console.error(`   ❌ Migration failed: ${error.message}`);
    return { success: false, error: error.message };
  }
}

/**
 * Main migration function
 */
async function main() {
  console.log("╔════════════════════════════════════════════════════════════════╗");
  console.log("║         Base64 to CDN Migration Script                        ║");
  console.log("╚════════════════════════════════════════════════════════════════╝\n");

  if (DRY_RUN) {
    console.log("🔍 DRY RUN MODE - No changes will be made\n");
  }

  if (LIMIT) {
    console.log(`📊 Limiting to first ${LIMIT} submissions\n`);
  }

  try {
    // Get all submissions with photoUrls
    console.log("🔎 Finding submissions with photos...\n");

    const submissions = await prisma.submission.findMany({
      where: {
        photoUrls: { not: null },
        AND: [
          { photoUrls: { not: "[]" } },
          { photoUrls: { not: "" } }
        ]
      },
      orderBy: { createdAt: "desc" },
      ...(LIMIT ? { take: LIMIT } : {})
    });

    console.log(`📦 Found ${submissions.length} submissions with photos\n`);
    console.log("─".repeat(70));

    const results = {
      total: submissions.length,
      migrated: 0,
      alreadyMigrated: 0,
      failed: 0,
      invalidShop: 0,
      dryRun: 0,
      totalImagesUploaded: 0
    };

    for (let i = 0; i < submissions.length; i++) {
      const submission = submissions[i];
      console.log(`\n[${i + 1}/${submissions.length}]`);

      const result = await migrateSubmission(submission);

      if (result.dryRun) {
        results.dryRun++;
      } else if (result.alreadyMigrated) {
        results.alreadyMigrated++;
      } else if (result.success && result.migratedCount) {
        results.migrated++;
        results.totalImagesUploaded += result.migratedCount;
      } else if (result.reason === "invalid_shop") {
        results.invalidShop++;
      } else if (!result.success) {
        results.failed++;
      }

      // Rate limiting: wait 500ms between uploads to avoid overwhelming Shopify API
      if (!result.alreadyMigrated && !result.dryRun && i < submissions.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log("\n" + "─".repeat(70));
    console.log("\n╔════════════════════════════════════════════════════════════════╗");
    console.log("║                    Migration Summary                           ║");
    console.log("╚════════════════════════════════════════════════════════════════╝\n");
    console.log(`  Total submissions processed:    ${results.total}`);

    if (DRY_RUN) {
      console.log(`  🔍 Would migrate:                ${results.dryRun}`);
    } else {
      console.log(`  ✅ Successfully migrated:        ${results.migrated}`);
      console.log(`  📸 Total images uploaded:        ${results.totalImagesUploaded}`);
    }

    console.log(`  ✓  Already migrated:             ${results.alreadyMigrated}`);
    console.log(`  ⚠️  Invalid shop (skipped):      ${results.invalidShop}`);
    console.log(`  ❌ Failed:                       ${results.failed}`);

    console.log("\n" + "═".repeat(70) + "\n");

    if (DRY_RUN) {
      console.log("💡 Run without --dry-run to perform actual migration\n");
    } else if (results.migrated > 0) {
      console.log("🎉 Migration completed successfully!\n");
    } else if (results.alreadyMigrated === results.total) {
      console.log("ℹ️  All submissions already migrated - nothing to do\n");
    }

    // Show recommendations
    if (results.invalidShop > 0) {
      console.log("⚠️  Recommendations:");
      console.log("   - Update submissions with shop='public' to have a valid shop domain");
      console.log("   - Run this script again after updating shop domains\n");
    }

  } catch (error) {
    console.error("\n❌ Fatal error during migration:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
main()
  .catch((error) => {
    console.error("Unhandled error:", error);
    process.exit(1);
  });
