import sql from 'mssql';

import { Prisma } from '../db/postgres';
import { productMapping } from '../mappings/product';
import {
  companyMap,
  typeMap,
  groupMap,
  genericMap,
  supplierMap,
  productMap,
} from '../utils/id-map';
import { emptyToNull, renderProgressBar } from '../utils/helpers';

export async function migrateProducts(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log(`\n▶ Migrating products from dbo.MedProduct...`);
  const startTime = Date.now();

  const result = await sqlPool.request().query(`
    SELECT
      ${productMapping.oldKey},
      ${productMapping.code},
      ${productMapping.barcode},
      ${productMapping.name},
      ${productMapping.companyOldKey},
      ${productMapping.typeOldKey},
      ${productMapping.groupOldKey},
      ${productMapping.genericOldKey},
      ${productMapping.supplierOldKey},
      ${productMapping.registrationNo},
      ${productMapping.originalReference},
      ${productMapping.shelfNo},
      ${productMapping.minimumStock},
      ${productMapping.maximumStock},
      ${productMapping.nivFormulary},
      ${productMapping.packingSize},
      ${productMapping.retailPrice},
      ${productMapping.retailDiscount},
      ${productMapping.tradePrice},
      ${productMapping.retailRate},
      ${productMapping.tradeRate},
      ${productMapping.counterRatePercent},
      ${productMapping.orgRatePercent},
      ${productMapping.isActive}
    FROM dbo.Products
  `);

  const products = result.recordset;
  console.log(`  Found ${products.length} products`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const [index, oldProduct] of products.entries()) {
    try {
      const companyOldKey = oldProduct[productMapping.companyOldKey];
      const typeOldKey = oldProduct[productMapping.typeOldKey];

      const companyId = companyMap.get(companyOldKey);
      const typeId = typeMap.get(typeOldKey);

      // company & type are required — skip product if we can't resolve them
      if (!companyId || !typeId) {
        skipped++;
        console.error(
          `\n  ⚠ Skipped ${oldProduct[productMapping.code]}: missing company(${companyOldKey}) or type(${typeOldKey})`,
        );
        renderProgressBar(index + 1, products.length, 'products');
        continue;
      }

      // group, generic, supplier are optional — resolve only if old key present
      const groupOldKey = oldProduct[productMapping.groupOldKey];
      const genericOldKey = oldProduct[productMapping.genericOldKey];
      const supplierOldKey = oldProduct[productMapping.supplierOldKey];

      const groupId = groupOldKey ? groupMap.get(groupOldKey) : undefined;
      const genericId = genericOldKey
        ? genericMap.get(genericOldKey)
        : undefined;
      const defaultSupplierId = supplierOldKey
        ? supplierMap.get(supplierOldKey)
        : undefined;

      const newProduct = await prisma.product.create({
        data: {
          code: oldProduct[productMapping.code],
          barcode: emptyToNull(oldProduct[productMapping.barcode]),
          name: oldProduct[productMapping.name],

          companyId,
          typeId,
          groupId: groupId ?? null,
          genericId: genericId ?? null,
          defaultSupplierId: defaultSupplierId ?? null,

          registrationNo: emptyToNull(
            oldProduct[productMapping.registrationNo],
          ),
          originalReference: emptyToNull(
            oldProduct[productMapping.originalReference],
          ),
          shelfNo: emptyToNull(oldProduct[productMapping.shelfNo])
            ? Number(oldProduct[productMapping.shelfNo])
            : null,

          minimumStock: oldProduct[productMapping.minimumStock] ?? 0,
          maximumStock: oldProduct[productMapping.maximumStock] ?? null,

          packingSize: oldProduct[productMapping.packingSize],
          retailPrice: oldProduct[productMapping.retailPrice],
          retailDiscount: oldProduct[productMapping.retailDiscount],
          tradePrice: oldProduct[productMapping.tradePrice],
          retailRate: oldProduct[productMapping.retailRate],
          tradeRate: oldProduct[productMapping.tradeRate],
          counterRatePercent: oldProduct[productMapping.counterRatePercent],
          orgRatePercent: oldProduct[productMapping.orgRatePercent],

          nivFormulary: Boolean(oldProduct[productMapping.nivFormulary]),
          isActive: Boolean(oldProduct[productMapping.isActive]),
        },
      });

      created++;
      productMap.set(oldProduct[productMapping.oldKey], newProduct.id);
    } catch (err) {
      failed++;
      console.error(
        `\n  ✗ Failed on ${productMapping.code}=${oldProduct[productMapping.code]}:`,
        err,
      );
    }

    renderProgressBar(index + 1, products.length, 'products');
  }

  process.stdout.write('\n');

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `✔ products: ${created} created, ${skipped} skipped (missing FK), ${failed} failed (${seconds}s)`,
  );
}
