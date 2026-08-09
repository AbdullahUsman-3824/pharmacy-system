import 'dotenv/config';

import { getSqlServer, closeSqlServer } from './db/sqlserver';
import { prisma, connectPostgres, closePostgres } from './db/postgres';
import { migrateLookupTables } from './migrations/lookups';
import { migrateSuppliers } from './migrations/supplier';
import { migrateProducts } from './migrations/product';

async function main() {
  console.log('Starting database migration...\n');

  try {
    const sqlPool = await getSqlServer();
    await connectPostgres();

    console.log('Connected to SQL Server.');
    console.log('Connected to PostgreSQL.\n');

    await migrateLookupTables(sqlPool, prisma);
    await migrateSuppliers(sqlPool, prisma);
    await migrateProducts(sqlPool, prisma);

    console.log('\nMigration completed successfully.');
  } catch (error: any) {
    console.error('\nMigration failed:');
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
