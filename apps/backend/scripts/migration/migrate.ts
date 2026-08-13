import 'dotenv/config';

import { getSqlServer, closeSqlServer } from './db/sqlserver';
import { prisma, connectPostgres, closePostgres } from './db/postgres';
import { migrateLookupTables } from './migrations/lookups';
import { migrateDistributors } from './migrations/distributor';
import { migrateProducts } from './migrations/product';
import {
  migratePurchaseItems,
  migratePurchaseVouchers,
  validateStockMigration,
  migrateBatches,
  loadPurchaseDetails,
} from './migrations/stock';

/**
 * Full-refresh reset — clears previously migrated data before a
 * fresh run, in FK-safe order (children before parents). Needed
 * because this migration is re-run from scratch each time, not
 * incrementally upserted for every table.
 */
async function resetForMigration() {
  console.log('Clearing PostgreSQL database...');

  await prisma.$executeRawUnsafe(`
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN (
        SELECT tablename
        FROM pg_tables
        WHERE schemaname = 'public'
          AND tablename <> '_prisma_migrations'
      )
      LOOP
        EXECUTE 'TRUNCATE TABLE "public"."' || r.tablename || '" RESTART IDENTITY CASCADE';
      END LOOP;
    END $$;
  `);

  console.log('Database cleared.\n');
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes === 0) return `${seconds}s`;
  return `${minutes}m ${seconds}s`;
}

async function main() {
  const migrationStart = Date.now();
  console.log('Starting database migration...\n');

  try {
    const sqlPool = await getSqlServer();
    await connectPostgres();

    console.log('Connected to SQL Server.');
    console.log('Connected to PostgreSQL.\n');

    await resetForMigration();

    await migrateLookupTables(sqlPool, prisma);
    await migrateDistributors(sqlPool, prisma);
    await migrateProducts(sqlPool, prisma);

    const purchaseDetailsByBatch = await loadPurchaseDetails(sqlPool);
    await migrateBatches(sqlPool, prisma, purchaseDetailsByBatch);
    await migratePurchaseVouchers(sqlPool, prisma);
    await migratePurchaseItems(sqlPool, prisma);
    await validateStockMigration(sqlPool, prisma);

    const totalElapsed = formatDuration(Date.now() - migrationStart);
    console.log(`\nMigration completed successfully in ${totalElapsed}.`);
  } catch (error: any) {
    const totalElapsed = formatDuration(Date.now() - migrationStart);
    console.error(`\nMigration failed after ${totalElapsed}:`);
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    await closeSqlServer();
    await closePostgres();
  }
}

main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exitCode = 1;
});
