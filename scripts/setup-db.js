#!/usr/bin/env node

/**
 * This script updates the Prisma schema based on the environment
 * - Development: Uses SQLite
 * - Production: Uses PostgreSQL
 */

import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const schemaPath = join(__dirname, '..', 'prisma', 'schema.prisma');

// Check both NODE_ENV and command line arguments
const nodeEnv = process.env.NODE_ENV || process.argv[2] || 'development';
const isProduction = nodeEnv === 'production';

console.log(`🔧 Setting up database for ${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'} environment...`);

try {
  let schema = readFileSync(schemaPath, 'utf-8');

  if (isProduction) {
    // Switch to PostgreSQL for production
    schema = schema.replace(
      /provider\s*=\s*"sqlite"/g,
      'provider = "postgresql"'
    );
    console.log('✅ Database provider set to PostgreSQL');
  } else {
    // Switch to SQLite for development
    schema = schema.replace(
      /provider\s*=\s*"postgresql"/g,
      'provider = "sqlite"'
    );
    console.log('✅ Database provider set to SQLite');
  }

  writeFileSync(schemaPath, schema, 'utf-8');
  console.log('✅ Schema updated successfully');
} catch (error) {
  console.error('❌ Error updating schema:', error);
  process.exit(1);
}
