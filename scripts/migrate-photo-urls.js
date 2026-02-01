#!/usr/bin/env node

/**
 * Migration script to convert photoUrls from simple array format to enhanced object format
 *
 * Old format: '["url1", "url2"]'
 * New format: '[{"originalUrl": "url1", "currentUrl": null, "order": 0}, ...]'
 *
 * Run with: npm run migrate:photos
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function isAlreadyMigrated(photoUrls) {
  if (!photoUrls) return true;

  try {
    const parsed = JSON.parse(photoUrls);
    if (!Array.isArray(parsed) || parsed.length === 0) return true;

    // Check if first item is an object with originalUrl (new format)
    if (typeof parsed[0] === 'object' && parsed[0] !== null && 'originalUrl' in parsed[0]) {
      return true;
    }

    // Check if it's a simple string array (old format)
    if (typeof parsed[0] === 'string') {
      return false;
    }

    return true;
  } catch {
    return true;
  }
}

function migratePhotoUrls(photoUrls) {
  const parsed = JSON.parse(photoUrls);

  // Convert simple string array to object array
  const migrated = parsed.map((url, index) => ({
    originalUrl: url,
    currentUrl: null,
    order: index
  }));

  return JSON.stringify(migrated);
}

async function main() {
  console.log('🔄 Starting photoUrls migration...\n');

  // Fetch all submissions with photoUrls
  const submissions = await prisma.submission.findMany({
    where: {
      photoUrls: {
        not: null
      }
    },
    select: {
      id: true,
      shortTitle: true,
      photoUrls: true
    }
  });

  console.log(`📋 Found ${submissions.length} submissions with photos\n`);

  let migrated = 0;
  let skipped = 0;
  let errors = 0;

  for (const submission of submissions) {
    try {
      // Check if already migrated
      if (await isAlreadyMigrated(submission.photoUrls)) {
        console.log(`⏭️  Skipping "${submission.shortTitle}" (ID: ${submission.id}) - already migrated or empty`);
        skipped++;
        continue;
      }

      // Migrate the photoUrls
      const newPhotoUrls = migratePhotoUrls(submission.photoUrls);

      await prisma.submission.update({
        where: { id: submission.id },
        data: { photoUrls: newPhotoUrls }
      });

      console.log(`✅ Migrated "${submission.shortTitle}" (ID: ${submission.id})`);
      migrated++;

    } catch (error) {
      console.error(`❌ Error migrating submission ${submission.id}:`, error.message);
      errors++;
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📊 Migration Summary:');
  console.log(`   ✅ Migrated: ${migrated}`);
  console.log(`   ⏭️  Skipped:  ${skipped}`);
  console.log(`   ❌ Errors:   ${errors}`);
  console.log('='.repeat(50));
}

main()
  .catch((error) => {
    console.error('Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
