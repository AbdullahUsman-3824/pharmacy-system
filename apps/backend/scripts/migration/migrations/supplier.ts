import sql from 'mssql';
import { Prisma } from '../db/postgres';
import { supplierMapping } from '../mappings/supplier';
import { supplierMap } from '../utils/id-map';
import { renderProgressBar, emptyToNull } from '../utils/helpers';

export async function migrateSuppliers(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log(`\n▶ Clearing existing suppliers...`);
  await prisma.supplier.deleteMany({});

  console.log(`▶ Migrating suppliers...`);
  const startTime = Date.now();

  const result = await sqlPool.request().query(`
    SELECT
      ${supplierMapping.oldKey},
      ${supplierMapping.name},
      ${supplierMapping.contactPerson},
      ${supplierMapping.phone},
      ${supplierMapping.mobile},
      ${supplierMapping.email},
      ${supplierMapping.address}
    FROM dbo.MedDistributor
  `);

  const suppliers = result.recordset;
  console.log(`  Found ${suppliers.length} suppliers`);

  let created = 0;
  let failed = 0;

  for (const [index, oldSupplier] of suppliers.entries()) {
    try {
      const newSupplier = await prisma.supplier.create({
        data: {
          name: oldSupplier[supplierMapping.name],
          contactPerson: emptyToNull(
            oldSupplier[supplierMapping.contactPerson],
          ),
          phone: emptyToNull(oldSupplier[supplierMapping.phone]),
          mobile: emptyToNull(oldSupplier[supplierMapping.mobile]),
          email: emptyToNull(oldSupplier[supplierMapping.email]),
          address: emptyToNull(oldSupplier[supplierMapping.address]),
        },
      });

      created++;
      supplierMap.set(oldSupplier[supplierMapping.oldKey], newSupplier.id);
    } catch (err) {
      failed++;
      console.error(
        `\n  ✗ Failed on ${supplierMapping.oldKey}=${oldSupplier[supplierMapping.oldKey]}:`,
        err,
      );
    }

    renderProgressBar(index + 1, suppliers.length, 'suppliers');
  }

  process.stdout.write('\n');

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `✔ suppliers: ${created} created, ${failed} failed (${seconds}s)`,
  );
}
