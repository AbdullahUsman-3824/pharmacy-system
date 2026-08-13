import sql from 'mssql';
import { Prisma } from '../db/postgres';
import { distributorMapping } from '../mappings/distributor';
import { distributorMap } from '../utils/id-map';
import { renderProgressBar, emptyToNull } from '../utils/helpers';

export async function migrateDistributors(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log(`\n▶ Clearing existing distributors...`);
  await prisma.distributor.deleteMany({});

  console.log(`▶ Migrating distributors...`);
  const startTime = Date.now();

  const result = await sqlPool.request().query(`
    SELECT
      ${distributorMapping.oldKey},
      ${distributorMapping.name},
      ${distributorMapping.contactPerson},
      ${distributorMapping.phone},
      ${distributorMapping.mobile},
      ${distributorMapping.email},
      ${distributorMapping.address}
    FROM dbo.MedDistributor
  `);

  const distributors = result.recordset;
  console.log(`  Found ${distributors.length} distributors`);

  let created = 0;
  let failed = 0;

  for (const [index, oldDistributor] of distributors.entries()) {
    try {
      const newDistributor = await prisma.distributor.create({
        data: {
          name: oldDistributor[distributorMapping.name],
          contactPerson: emptyToNull(
            oldDistributor[distributorMapping.contactPerson],
          ),
          phone: emptyToNull(oldDistributor[distributorMapping.phone]),
          mobile: emptyToNull(oldDistributor[distributorMapping.mobile]),
          email: emptyToNull(oldDistributor[distributorMapping.email]),
          address: emptyToNull(oldDistributor[distributorMapping.address]),
        },
      });

      created++;
      distributorMap.set(oldDistributor[distributorMapping.oldKey], newDistributor.id);
    } catch (err) {
      failed++;
      console.error(
        `\n  ✗ Failed on ${distributorMapping.oldKey}=${oldDistributor[distributorMapping.oldKey]}:`,
        err,
      );
    }

    renderProgressBar(index + 1, distributors.length, 'distributors');
  }

  process.stdout.write('\n');

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `✔ distributors: ${created} created, ${failed} failed (${seconds}s)`,
  );
}
