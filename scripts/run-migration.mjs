import prisma from '../lib/prisma.ts';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runMigration() {
  // Get migration path from command line argument
  const migrationArg = process.argv[2];
  if (!migrationArg) {
    console.error('Usage: node scripts/run-migration.mjs <migration-path>');
    console.error('Example: node scripts/run-migration.mjs prisma/migrations/20260219235000_create_system_table/migration.sql');
    process.exit(1);
  }

  const migrationPath = path.isAbsolute(migrationArg) 
    ? migrationArg 
    : path.join(__dirname, '..', migrationArg);
    
  if (!fs.existsSync(migrationPath)) {
    console.error(`Migration file not found: ${migrationPath}`);
    process.exit(1);
  }

  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8');

  console.log(`Applying migration: ${path.basename(path.dirname(migrationPath))}...`);
  
  // Split by semicolons and execute each statement
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  try {
    for (const statement of statements) {
      console.log(`Executing: ${statement.substring(0, 50)}...`);
      await prisma.$executeRawUnsafe(statement);
    }
    console.log('✅ Migration applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
