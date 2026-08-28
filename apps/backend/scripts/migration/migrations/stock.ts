import sql from 'mssql';
import { StockVoucherType } from '@repo/shared';

import { Prisma } from '../db/postgres';
import { stockMapping } from '../mappings/stock';

import {
  productMap,
  accountMap,
  batchMap,
  productExpiryBatchMap,
  purchaseVoucherMap,
  getBatchMapKey,
  getProductExpiryKey,
  accountTypeMap,
} from '../utils/id-map';

import {
  emptyToNull,
  renderProgressBar,
  normalizeBatchNumber,
  normalizeExpiryDate,
  fitsDecimal,
  fitsInt,
} from '../utils/helpers';

const HISTORY_YEARS = 1;
const UNBATCHED_PREFIX = 'UNBATCHED-';

function getHistoryCutoffDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - HISTORY_YEARS);
  return date;
}

function isBatchNumberMissing(batchNumber: string): boolean {
  return !batchNumber || batchNumber.trim() === '';
}

/**
 * Formats a date as YYYYMMDD for embedding in generated batch numbers.
 * Returns 'NOEXP' when there is no expiry date to embed.
 */
function formatDateForAutoBatch(date: Date | null): string {
  if (!date) {
    return 'NOEXP';
  }

  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');

  return `${year}${month}${day}`;
}

function generateAutoBatchNumber(
  productKey: string,
  expiryDate: Date | null,
): string {
  return `AUTO-${productKey}-${formatDateForAutoBatch(expiryDate)}`;
}

/**
 * ------------------------------------------------------------
 * STEP 1: Load PurchaseDetail, grouped by batch identity
 * ------------------------------------------------------------
 */

type Row = Record<string, unknown>;

export async function loadPurchaseDetails(
  sqlPool: sql.ConnectionPool,
): Promise<Map<string, Row[]>> {
  const result = await sqlPool.request().query(`
    SELECT
      pd.${stockMapping.purchaseDetail.purchaseMainKey},
      pd.${stockMapping.purchaseDetail.serial},
      pd.${stockMapping.purchaseDetail.oldProductKey},
      pd.${stockMapping.purchaseDetail.batchNumber},
      pd.${stockMapping.purchaseDetail.expiryDate},
      pd.${stockMapping.purchaseDetail.purchaseRate},
      pd.${stockMapping.purchaseDetail.packQuantity},
      pd.${stockMapping.purchaseDetail.looseQuantity},
      pd.${stockMapping.purchaseDetail.freeQuantity},
      pd.${stockMapping.purchaseDetail.grossAmount},
      pd.${stockMapping.purchaseDetail.discountPercent},
      pd.${stockMapping.purchaseDetail.discountAmount},
      pd.${stockMapping.purchaseDetail.taxPercent},
      pd.${stockMapping.purchaseDetail.taxAmount},
      pd.${stockMapping.purchaseDetail.netAmount},
      pd.${stockMapping.purchaseDetail.unitRetailPrice},
      pd.${stockMapping.purchaseDetail.unitTradePrice},
      pm.${stockMapping.purchaseMain.date} AS pur_date_joined
    FROM dbo.PurchaseDetail pd
    LEFT JOIN dbo.PurchaseMain pm
      ON pd.${stockMapping.purchaseDetail.purchaseMainKey}
       = pm.${stockMapping.purchaseMain.oldKey}
  `);

  const grouped = new Map<string, Row[]>();

  for (const row of result.recordset) {
    const productKey = String(
      row[stockMapping.purchaseDetail.oldProductKey],
    ).trim();

    const batchNumber = normalizeBatchNumber(
      row[stockMapping.purchaseDetail.batchNumber],
    );

    const expiryDate = normalizeExpiryDate(
      row[stockMapping.purchaseDetail.expiryDate],
    );

    const key = getBatchMapKey(productKey, batchNumber, expiryDate);

    const rows = grouped.get(key) ?? [];

    rows.push(row);

    grouped.set(key, rows);
  }

  for (const rows of grouped.values()) {
    rows.sort((a, b) => {
      const dateA = new Date(a.pur_date_joined as string).getTime();

      const dateB = new Date(b.pur_date_joined as string).getTime();

      return dateA - dateB;
    });
  }

  return grouped;
}

/**
 * ------------------------------------------------------------
 * STEP 2: Migrate Batches
 * ------------------------------------------------------------
 *
 * Old ProductBatch rows with a missing bat_batchid are NOT
 * dropped. Once every "real" (non-empty batch number) batch
 * has been migrated:
 *
 *   - if EXACTLY ONE real batch exists for the same
 *     product + expiry, the missing-batch quantity is merged
 *     into it
 *   - if there is NO real batch, OR there are multiple real
 *     batch numbers for the same product + expiry (ambiguous —
 *     we cannot safely pick one), a synthetic batch is
 *     generated instead: AUTO-{productKey}-{expiry|NOEXP}
 *
 * This keeps the merge deterministic and avoids silently
 * picking an arbitrary "first" real batch when the source data
 * doesn't give us a safe target.
 *
 * NOTE: Batch.currentQuantity / openingQuantity are unit-based
 * in the new schema, and bat_qtyin / bat_qtybal are already
 * unit-based in the old system, so no pack/loose conversion is
 * needed here. Batch has no looseQuantity column at all.
 */

export async function migrateBatches(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
  purchaseDetailsByBatch: Map<string, Row[]>,
) {
  console.log(`\n▶ Migrating batches from dbo.ProductBatch...`);

  const startTime = Date.now();

  const result = await sqlPool.request().query(`
    SELECT
      ${stockMapping.batch.oldProductKey},
      ${stockMapping.batch.batchNumber},
      ${stockMapping.batch.expiryDate},
      ${stockMapping.batch.quantityIn},
      ${stockMapping.batch.quantityOut},
      ${stockMapping.batch.quantityBalance}
    FROM dbo.ProductBatch
  `);

  const allBatches = result.recordset;

  console.log(`  Found ${allBatches.length} batches`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let noRateHistoryCount = 0;

  let mergedIntoReal = 0;
  let generatedAuto = 0;
  let missingFailed = 0;

  const skipReasons: Record<string, number> = {
    'product not migrated': 0,
  };

  // --------------------------------------------------
  // Classify rows: real (has batch number) vs missing.
  // Rows whose product never migrated are skipped here
  // for both passes.
  // --------------------------------------------------

  const realRows: Row[] = [];
  const missingGroups = new Map<string, Row[]>();

  for (const oldBatch of allBatches) {
    const oldProductKey = String(
      oldBatch[stockMapping.batch.oldProductKey],
    ).trim();

    if (!productMap.get(oldProductKey)) {
      skipped++;
      skipReasons['product not migrated']++;
      continue;
    }

    const batchNumber = normalizeBatchNumber(
      oldBatch[stockMapping.batch.batchNumber],
    );

    if (isBatchNumberMissing(batchNumber)) {
      const expiryDate = normalizeExpiryDate(
        oldBatch[stockMapping.batch.expiryDate],
      );

      const key = getProductExpiryKey(oldProductKey, expiryDate);

      const rows = missingGroups.get(key) ?? [];

      rows.push(oldBatch);

      missingGroups.set(key, rows);
    } else {
      realRows.push(oldBatch);
    }
  }

  // --------------------------------------------------
  // PASS 1: migrate real (identified) batches first, so
  // missing-batch rows have something to (maybe) merge
  // into. Track how many real batch numbers exist per
  // product+expiry — more than one makes that group
  // ambiguous and ineligible for merging.
  // --------------------------------------------------

  const realBatchCountByKey = new Map<string, number>();

  for (const [index, oldBatch] of realRows.entries()) {
    try {
      const oldProductKey = String(
        oldBatch[stockMapping.batch.oldProductKey],
      ).trim();

      const productId = productMap.get(oldProductKey)!;

      const batchNumber = normalizeBatchNumber(
        oldBatch[stockMapping.batch.batchNumber],
      );

      const expiryDate = normalizeExpiryDate(
        oldBatch[stockMapping.batch.expiryDate],
      );

      const oldBatchKey = getBatchMapKey(
        oldProductKey,
        batchNumber,
        expiryDate,
      );

      // Used ONLY for determining current/latest batch rates.
      const purchaseRows = purchaseDetailsByBatch.get(oldBatchKey) ?? [];

      let purchaseRate = 0;
      let saleRate = 0;

      if (purchaseRows.length > 0) {
        const latest = purchaseRows[purchaseRows.length - 1];

        purchaseRate = Number(
          latest[stockMapping.purchaseDetail.purchaseRate] ?? 0,
        );

        saleRate = Number(
          latest[stockMapping.purchaseDetail.unitRetailPrice] ?? 0,
        );
      } else {
        noRateHistoryCount++;
      }

      // ProductBatch is authoritative for stock quantities.
      const openingQuantity = Number(
        oldBatch[stockMapping.batch.quantityIn] ?? 0,
      );

      const currentQuantity = Number(
        oldBatch[stockMapping.batch.quantityBalance] ?? 0,
      );

      const batchData = {
        productId,

        batchNumber,
        expiryDate,

        purchaseRate,
        saleRate,

        openingQuantity,
        currentQuantity,

        manufacturingDate: null,

        isActive: true,
      };

      // Explicit lookup because expiryDate can be NULL.
      const existing = await prisma.batch.findFirst({
        where: {
          productId,
          batchNumber,
          expiryDate,
        },

        select: {
          id: true,
        },
      });

      let newBatch;

      if (existing) {
        newBatch = await prisma.batch.update({
          where: {
            id: existing.id,
          },

          data: batchData,
        });

        updated++;
      } else {
        newBatch = await prisma.batch.create({
          data: batchData,
        });

        created++;
      }

      batchMap.set(oldBatchKey, newBatch.id);

      const productExpiryKey = getProductExpiryKey(oldProductKey, expiryDate);

      const count = (realBatchCountByKey.get(productExpiryKey) ?? 0) + 1;

      realBatchCountByKey.set(productExpiryKey, count);

      if (count === 1) {
        productExpiryBatchMap.set(productExpiryKey, newBatch.id);
      } else {
        // Ambiguous: a second real batch number showed up for
        // this product+expiry. Remove it as a merge target —
        // missing-batch stock for this key will be
        // auto-generated instead of guessing which one it
        // belongs to.
        productExpiryBatchMap.delete(productExpiryKey);
      }
    } catch {
      failed++;
    }

    renderProgressBar(index + 1, realRows.length, 'batches (real)');
  }

  process.stdout.write('\n');

  const ambiguousKeyCount = [...realBatchCountByKey.values()].filter(
    (count) => count > 1,
  ).length;

  // --------------------------------------------------
  // PASS 2: missing-batch groups — merge into a real
  // batch for the same product + expiry ONLY if exactly
  // one exists, otherwise generate a synthetic batch so
  // the stock isn't lost.
  // --------------------------------------------------

  const missingGroupEntries = [...missingGroups.entries()];

  for (const [
    index,
    [productExpiryKey, rows],
  ] of missingGroupEntries.entries()) {
    try {
      const firstRow = rows[0];

      const oldProductKey = String(
        firstRow[stockMapping.batch.oldProductKey],
      ).trim();

      const productId = productMap.get(oldProductKey)!;

      const expiryDate = normalizeExpiryDate(
        firstRow[stockMapping.batch.expiryDate],
      );

      const openingQuantitySum = rows.reduce(
        (sum, row) => sum + Number(row[stockMapping.batch.quantityIn] ?? 0),
        0,
      );

      const currentQuantitySum = rows.reduce(
        (sum, row) =>
          sum + Number(row[stockMapping.batch.quantityBalance] ?? 0),
        0,
      );

      // All rows in this group share the same empty-batch-number
      // key, since normalizeBatchNumber collapses missing values
      // the same way for every row.
      const oldBatchKey = getBatchMapKey(oldProductKey, '', expiryDate);

      // Only a key with EXACTLY ONE real batch remains in
      // productExpiryBatchMap (ambiguous ones were deleted in
      // Pass 1).
      const existingRealBatchId = productExpiryBatchMap.get(productExpiryKey);

      if (existingRealBatchId) {
        // Merge into the single unambiguous real batch.
        await prisma.batch.update({
          where: {
            id: existingRealBatchId,
          },

          data: {
            openingQuantity: {
              increment: openingQuantitySum,
            },
            currentQuantity: {
              increment: currentQuantitySum,
            },
          },
        });

        batchMap.set(oldBatchKey, existingRealBatchId);

        mergedIntoReal++;
      } else {
        // No real batch, or an ambiguous group — generate one.
        const syntheticBatchNumber = generateAutoBatchNumber(
          oldProductKey,
          expiryDate,
        );

        const purchaseRows = purchaseDetailsByBatch.get(oldBatchKey) ?? [];

        let purchaseRate = 0;
        let saleRate = 0;

        if (purchaseRows.length > 0) {
          const latest = purchaseRows[purchaseRows.length - 1];

          purchaseRate = Number(
            latest[stockMapping.purchaseDetail.purchaseRate] ?? 0,
          );

          saleRate = Number(
            latest[stockMapping.purchaseDetail.unitRetailPrice] ?? 0,
          );
        } else {
          noRateHistoryCount++;
        }

        const batchData = {
          productId,

          batchNumber: syntheticBatchNumber,
          expiryDate,

          purchaseRate,
          saleRate,

          openingQuantity: openingQuantitySum,
          currentQuantity: currentQuantitySum,

          manufacturingDate: null,

          isActive: true,
        };

        const existing = await prisma.batch.findFirst({
          where: {
            productId,
            batchNumber: syntheticBatchNumber,
            expiryDate,
          },

          select: {
            id: true,
          },
        });

        let newBatch;

        if (existing) {
          newBatch = await prisma.batch.update({
            where: {
              id: existing.id,
            },

            data: batchData,
          });

          updated++;
        } else {
          newBatch = await prisma.batch.create({
            data: batchData,
          });

          created++;
        }

        batchMap.set(oldBatchKey, newBatch.id);

        generatedAuto++;
      }
    } catch {
      missingFailed++;
    }

    renderProgressBar(
      index + 1,
      missingGroupEntries.length,
      'batches (missing)',
    );
  }

  process.stdout.write('\n');

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(
    `✔ batches: ${created} created, ${updated} updated, ` +
      `${skipped} skipped, ${failed + missingFailed} failed (${seconds}s)`,
  );

  console.log(
    `  ⚠ missing batch numbers: ${mergedIntoReal} merged into a single ` +
      `unambiguous real batch, ${generatedAuto} auto-generated`,
  );

  if (ambiguousKeyCount > 0) {
    console.log(
      `  ⚠ ${ambiguousKeyCount} product+expiry group(s) had more than one ` +
        `real batch number — any missing-batch stock for these was ` +
        `auto-generated instead of merged.`,
    );
  }

  if (skipped > 0) {
    console.log(`  ⚠ Skip reasons for batches:`);

    for (const [reason, count] of Object.entries(skipReasons)) {
      if (count > 0) {
        console.log(`    • ${count} → ${reason}`);
      }
    }
  }

  if (noRateHistoryCount > 0) {
    console.log(
      `  ⚠ ${noRateHistoryCount} batches had no purchase history (rate=0)`,
    );
  }
}

/**
 * ------------------------------------------------------------
 * STEP 2b: Migrate leftover product-level stock
 * ------------------------------------------------------------
 *
 * Some products carry stock on Products.prd_stock that isn't
 * backed by any ProductBatch row at all (e.g. ALZILO, ANNUVA).
 * Run this AFTER migrateBatches() so every real + merged +
 * auto-generated batch already exists.
 *
 *   leftover = prd_stock - sum(Batch.currentQuantity)
 *
 *   leftover > 0  → create/update an UNBATCHED-{key} batch
 *   leftover == 0 → nothing to do
 *   leftover < 0  → prd_stock is LOWER than what we already
 *                    migrated from ProductBatch. We do NOT
 *                    silently ignore this — it's reported as a
 *                    mismatch for review. Nothing is deleted or
 *                    reduced; batch data from ProductBatch stays
 *                    authoritative.
 */

export async function migrateUnbatchedProductStock(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log(`\n▶ Reconciling unbatched product-level stock...`);

  const startTime = Date.now();

  const result = await sqlPool.request().query(`
    SELECT
      ${stockMapping.product.oldKey},
      ${stockMapping.product.stock}
    FROM dbo.Products
  `);

  const oldProducts = result.recordset;

  console.log(`  Found ${oldProducts.length} products`);

  const batchTotals = await prisma.batch.groupBy({
    by: ['productId'],
    _sum: {
      currentQuantity: true,
    },
  });

  const totalByProductId = new Map(
    batchTotals.map((row) => [
      row.productId,
      Number(row._sum.currentQuantity ?? 0),
    ]),
  );

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let noLeftover = 0;
  let negativeMismatch = 0;

  const skipReasons: Record<string, number> = {
    'product not migrated': 0,
  };

  for (const [index, oldProduct] of oldProducts.entries()) {
    try {
      const oldProductKey = String(
        oldProduct[stockMapping.product.oldKey],
      ).trim();

      const productId = productMap.get(oldProductKey);

      if (!productId) {
        skipped++;
        skipReasons['product not migrated']++;

        renderProgressBar(index + 1, oldProducts.length, 'unbatched stock');

        continue;
      }

      const prdStock = Number(oldProduct[stockMapping.product.stock] ?? 0);

      const alreadyBatched = totalByProductId.get(productId) ?? 0;

      const leftover = prdStock - alreadyBatched;

      if (leftover === 0) {
        noLeftover++;

        renderProgressBar(index + 1, oldProducts.length, 'unbatched stock');

        continue;
      }

      if (leftover < 0) {
        // prd_stock is lower than what ProductBatch already
        // accounts for. Don't touch migrated batch data — just
        // count it so it can be reviewed against the source.
        negativeMismatch++;

        renderProgressBar(index + 1, oldProducts.length, 'unbatched stock');

        continue;
      }

      // leftover > 0: create/update the unbatched-stock batch.

      const syntheticBatchNumber = `${UNBATCHED_PREFIX}${oldProductKey}`;

      const batchData = {
        productId,

        batchNumber: syntheticBatchNumber,
        expiryDate: null,

        purchaseRate: 0,
        saleRate: 0,

        openingQuantity: leftover,
        currentQuantity: leftover,

        manufacturingDate: null,

        isActive: true,
      };

      const existing = await prisma.batch.findFirst({
        where: {
          productId,
          batchNumber: syntheticBatchNumber,
          expiryDate: null,
        },

        select: {
          id: true,
        },
      });

      if (existing) {
        await prisma.batch.update({
          where: {
            id: existing.id,
          },

          data: batchData,
        });

        updated++;
      } else {
        await prisma.batch.create({
          data: batchData,
        });

        created++;
      }
    } catch {
      failed++;
    }

    renderProgressBar(index + 1, oldProducts.length, 'unbatched stock');
  }

  process.stdout.write('\n');

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(
    `✔ unbatched stock: ${created} created, ${updated} updated, ` +
      `${noLeftover} had no leftover, ${skipped} skipped, ` +
      `${failed} failed (${seconds}s)`,
  );

  if (negativeMismatch > 0) {
    console.log(
      `  ✗ ${negativeMismatch} product(s) have prd_stock LOWER than their ` +
        `migrated ProductBatch total — NOT auto-corrected, review these.`,
    );
  }
}

/**
 * ------------------------------------------------------------
 * STEP 3: Migrate PurchaseMain → StockVoucher
 * ------------------------------------------------------------
 */

export async function migratePurchaseVouchers(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log(`\n▶ Migrating purchase vouchers from dbo.PurchaseMain...`);

  const startTime = Date.now();

  const cutoffDate = getHistoryCutoffDate();

  const result = await sqlPool.request().input('cutoffDate', cutoffDate).query(`
      SELECT
        ${stockMapping.purchaseMain.oldKey},
        ${stockMapping.purchaseMain.returnMainKey},
        ${stockMapping.purchaseMain.number},
        ${stockMapping.purchaseMain.year},
        ${stockMapping.purchaseMain.date},
        ${stockMapping.purchaseMain.remarks},
        ${stockMapping.purchaseMain.accountKey},
        ${stockMapping.purchaseMain.netTotal},
        ${stockMapping.purchaseMain.extraDiscount},
        ${stockMapping.purchaseMain.extraSalesTax}
      FROM dbo.PurchaseMain
      WHERE ${stockMapping.purchaseMain.date} >= @cutoffDate
    `);

  const vouchers = result.recordset;

  console.log(
    `  Found ${vouchers.length} purchase vouchers ` +
      `(last ${HISTORY_YEARS} year)`,
  );

  let created = 0;
  let updated = 0;
  let paymentsCreated = 0;
  let paymentsUpdated = 0;
  let failed = 0;

  for (const [index, oldVoucher] of vouchers.entries()) {
    try {
      const oldKey = String(
        oldVoucher[stockMapping.purchaseMain.oldKey],
      ).trim();

      const voucherNumber = `PUR-${oldKey}`;

      // --------------------------------------------------
      // TYPE
      // --------------------------------------------------

      const isReturn = Boolean(
        oldVoucher[stockMapping.purchaseMain.returnMainKey],
      );

      const type: StockVoucherType = isReturn
        ? StockVoucherType.PURCHASE_RETURN
        : StockVoucherType.PURCHASE;

      // --------------------------------------------------
      // ACCOUNT
      // --------------------------------------------------

      const oldAccountKey = String(
        oldVoucher[stockMapping.purchaseMain.accountKey] ?? '',
      ).trim();

      const mappedAccountId = oldAccountKey
        ? (accountMap.get(oldAccountKey) ?? null)
        : null;

      const mappedAccountType = oldAccountKey
        ? accountTypeMap.get(oldAccountKey)
        : undefined;

      let supplierId: string | null = null;
      let paymentAccountId: string | null = null;

      if (mappedAccountId && mappedAccountType === 'BUSINESS_CONTACT') {
        supplierId = mappedAccountId;
      }

      if (mappedAccountId && mappedAccountType === 'PAYMENT_ACCOUNT') {
        paymentAccountId = mappedAccountId;
      }

      // --------------------------------------------------
      // AMOUNTS
      // --------------------------------------------------

      const netAmount = Number(
        oldVoucher[stockMapping.purchaseMain.netTotal] ?? 0,
      );

      const discountAmount = Number(
        oldVoucher[stockMapping.purchaseMain.extraDiscount] ?? 0,
      );

      const taxAmount = Number(
        oldVoucher[stockMapping.purchaseMain.extraSalesTax] ?? 0,
      );

      // --------------------------------------------------
      // VOUCHER
      // --------------------------------------------------

      const voucherData = {
        type,

        date: oldVoucher[stockMapping.purchaseMain.date] ?? new Date(),

        supplierId,

        remarks: emptyToNull(oldVoucher[stockMapping.purchaseMain.remarks]),

        netAmount,
        discountAmount,
        taxAmount,
      };

      const existing = await prisma.stockVoucher.findUnique({
        where: {
          voucherNumber,
        },

        select: {
          id: true,
        },
      });

      const newVoucher = await prisma.stockVoucher.upsert({
        where: {
          voucherNumber,
        },

        create: {
          voucherNumber,
          ...voucherData,

          // Will be calculated from migrated items.
          grossAmount: 0,
        },

        update: {
          ...voucherData,

          // Don't overwrite grossAmount here.
          grossAmount: undefined,
        },
      });

      if (existing) {
        updated++;
      } else {
        created++;
      }

      // --------------------------------------------------
      // PAYMENT
      // --------------------------------------------------
      //
      // Old pur_payment is ignored because it is always
      // zero in the legacy data.
      //
      // For purchases whose pur_accmainkey points to a
      // PaymentAccount, pur_nettotal represents the amount
      // paid through that account.
      //
      // Example:
      //
      //   pur_accmainkey = Cash in hand
      //   pur_nettotal   = 15,799.86
      //
      // becomes:
      //
      //   Payment
      //     amount = 15,799.86
      //     paymentAccountId = Cash in Hand
      //     stockVoucherId = newVoucher.id
      //
      // --------------------------------------------------

      if (paymentAccountId && netAmount > 0) {
        const existingPayment = await prisma.payment.findFirst({
          where: {
            stockVoucherId: newVoucher.id,
          },

          select: {
            id: true,
          },
        });

        if (existingPayment) {
          await prisma.payment.update({
            where: {
              id: existingPayment.id,
            },

            data: {
              amount: netAmount,
              paymentAccountId,
            },
          });

          paymentsUpdated++;
        } else {
          await prisma.payment.create({
            data: {
              amount: netAmount,
              paymentAccountId,
              stockVoucherId: newVoucher.id,
              type: 'PURCHASE',
            },
          });

          paymentsCreated++;
        }
      }

      // --------------------------------------------------
      // MAP OLD PURCHASE KEY → NEW STOCK VOUCHER ID
      // --------------------------------------------------

      purchaseVoucherMap.set(oldKey, newVoucher.id);
    } catch {
      failed++;
    }

    renderProgressBar(index + 1, vouchers.length, 'purchase vouchers');
  }

  process.stdout.write('\n');

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(
    `✔ purchase vouchers: ${created} created, ` +
      `${updated} updated, ` +
      `${paymentsCreated} payments created, ` +
      `${paymentsUpdated} payments updated, ` +
      `${failed} failed (${seconds}s)`,
  );
}

/**
 * ------------------------------------------------------------
 * STEP 4: Migrate PurchaseDetail → StockVoucherItem, routing
 * ------------------------------------------------------------
 *
 * pur_pack / pur_loose map directly to the new
 * StockVoucherItem.packQuantity / looseQuantity columns — the
 * schema is hybrid now (pack + loose kept separate), so no
 * packingSize conversion into a combined unit quantity is
 * needed here anymore.
 */

export async function migratePurchaseItems(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log(`\n▶ Migrating purchase items from dbo.PurchaseDetail...`);

  const startTime = Date.now();

  const cutoffDate = getHistoryCutoffDate();

  const result = await sqlPool.request().input('cutoffDate', cutoffDate).query(`
      SELECT
        pd.${stockMapping.purchaseDetail.purchaseMainKey},
        pd.${stockMapping.purchaseDetail.serial},
        pd.${stockMapping.purchaseDetail.oldProductKey},
        pd.${stockMapping.purchaseDetail.batchNumber},
        pd.${stockMapping.purchaseDetail.expiryDate},
        pd.${stockMapping.purchaseDetail.purchaseRate},
        pd.${stockMapping.purchaseDetail.unitRetailPrice},
        pd.${stockMapping.purchaseDetail.packQuantity},
        pd.${stockMapping.purchaseDetail.looseQuantity},
        pd.${stockMapping.purchaseDetail.freeQuantity},
        pd.${stockMapping.purchaseDetail.grossAmount},
        pd.${stockMapping.purchaseDetail.discountPercent},
        pd.${stockMapping.purchaseDetail.discountAmount},
        pd.${stockMapping.purchaseDetail.taxPercent},
        pd.${stockMapping.purchaseDetail.taxAmount},
        pd.${stockMapping.purchaseDetail.netAmount},
        pm.${stockMapping.purchaseMain.date} AS pur_date_joined
      FROM dbo.PurchaseDetail pd
      INNER JOIN dbo.PurchaseMain pm
        ON pd.${stockMapping.purchaseDetail.purchaseMainKey}
         = pm.${stockMapping.purchaseMain.oldKey}
      WHERE pm.${stockMapping.purchaseMain.date} >= @cutoffDate
    `);

  const items = result.recordset;

  console.log(
    `  Found ${items.length} purchase items ` + `(last ${HISTORY_YEARS} year)`,
  );

  let operational = 0;
  let skipped = 0;
  let failed = 0;

  const skipReasons: Record<string, number> = {
    'missing voucher': 0,
    'missing product': 0,
    'missing batch': 0,
    'numeric overflow': 0,
  };

  const grossByVoucherId = new Map<string, number>();

  for (const [index, oldItem] of items.entries()) {
    try {
      const voucherOldKey = String(
        oldItem[stockMapping.purchaseDetail.purchaseMainKey],
      ).trim();

      const voucherId = purchaseVoucherMap.get(voucherOldKey);

      if (!voucherId) {
        skipped++;
        skipReasons['missing voucher']++;

        renderProgressBar(index + 1, items.length, 'purchase items');

        continue;
      }

      const productOldKey = String(
        oldItem[stockMapping.purchaseDetail.oldProductKey],
      ).trim();

      const productId = productMap.get(productOldKey);

      if (!productId) {
        skipped++;
        skipReasons['missing product']++;

        renderProgressBar(index + 1, items.length, 'purchase items');

        continue;
      }

      const batchNumber = normalizeBatchNumber(
        oldItem[stockMapping.purchaseDetail.batchNumber],
      );

      const expiryDate = normalizeExpiryDate(
        oldItem[stockMapping.purchaseDetail.expiryDate],
      );

      const oldBatchKey = getBatchMapKey(
        productOldKey,
        batchNumber,
        expiryDate,
      );

      const batchId = batchMap.get(oldBatchKey);

      if (!batchId) {
        skipped++;
        skipReasons['missing batch']++;

        renderProgressBar(index + 1, items.length, 'purchase items');

        continue;
      }

      const pack = Number(
        oldItem[stockMapping.purchaseDetail.packQuantity] ?? 0,
      );

      const loose = Number(
        oldItem[stockMapping.purchaseDetail.looseQuantity] ?? 0,
      );

      const free = Number(
        oldItem[stockMapping.purchaseDetail.freeQuantity] ?? 0,
      );

      const purchaseRate = Number(
        oldItem[stockMapping.purchaseDetail.purchaseRate] ?? 0,
      );

      const saleRate = Number(
        oldItem[stockMapping.purchaseDetail.unitRetailPrice] ?? 0,
      );

      const grossAmount = Number(
        oldItem[stockMapping.purchaseDetail.grossAmount] ?? 0,
      );

      const discountPercent =
        oldItem[stockMapping.purchaseDetail.discountPercent] ?? null;

      const discountAmount = Number(
        oldItem[stockMapping.purchaseDetail.discountAmount] ?? 0,
      );

      const taxPercent =
        oldItem[stockMapping.purchaseDetail.taxPercent] ?? null;

      const taxAmount = Number(
        oldItem[stockMapping.purchaseDetail.taxAmount] ?? 0,
      );

      const netAmount = Number(
        oldItem[stockMapping.purchaseDetail.netAmount] ?? 0,
      );

      const allFit =
        fitsInt(pack) &&
        fitsInt(loose) &&
        fitsInt(free) &&
        fitsDecimal(purchaseRate, 10, 2) &&
        fitsDecimal(saleRate, 10, 2) &&
        fitsDecimal(grossAmount, 12, 2) &&
        fitsDecimal(discountPercent, 5, 2) &&
        fitsDecimal(discountAmount, 12, 2) &&
        fitsDecimal(taxPercent, 5, 2) &&
        fitsDecimal(taxAmount, 12, 2) &&
        fitsDecimal(netAmount, 12, 2);

      if (!allFit) {
        skipped++;
        skipReasons['numeric overflow']++;

        renderProgressBar(index + 1, items.length, 'purchase items');

        continue;
      }

      await prisma.stockVoucherItem.create({
        data: {
          voucherId,
          productId,
          batchId,

          packQuantity: Math.round(pack),
          looseQuantity: Math.round(loose),

          freeQuantity: Math.round(free),

          purchaseRate,
          saleRate,

          grossAmount,

          discountPercent,
          discountAmount,

          taxPercent,
          taxAmount,

          netAmount,
        },
      });

      operational++;

      grossByVoucherId.set(
        voucherId,
        (grossByVoucherId.get(voucherId) ?? 0) + grossAmount,
      );
    } catch {
      failed++;
    }

    renderProgressBar(index + 1, items.length, 'purchase items');
  }

  process.stdout.write('\n');

  console.log(
    `  Backfilling StockVoucher.grossAmount for ` +
      `${grossByVoucherId.size} vouchers...`,
  );

  for (const [voucherId, grossAmount] of grossByVoucherId.entries()) {
    await prisma.stockVoucher.update({
      where: {
        id: voucherId,
      },

      data: {
        grossAmount,
      },
    });
  }

  const totalProcessed = operational + skipped + failed;

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(`✔ purchase items:`);

  console.log(`  found:      ${items.length}`);

  console.log(`  migrated:   ${operational}`);

  console.log(`  skipped:    ${skipped}`);

  console.log(`  failed:     ${failed}`);

  console.log(`  accounted:  ${totalProcessed} (${seconds}s)`);

  console.log(`  Skip reasons:`);

  for (const [reason, count] of Object.entries(skipReasons)) {
    console.log(`    • ${reason}: ${count}`);
  }

  if (totalProcessed !== items.length) {
    console.log(
      `  ✗ MISMATCH: processed ${totalProcessed} ` +
        `but found ${items.length}`,
    );
  }
}

/**
 * ------------------------------------------------------------
 * STEP 5: Validation
 * ------------------------------------------------------------
 */

export async function validateStockMigration(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log(`\n▶ Validating stock migration...`);

  const oldTotalsResult = await sqlPool.request().query(`
    SELECT
      ${stockMapping.batch.oldProductKey} AS oldProductKey,
      SUM(${stockMapping.batch.quantityBalance}) AS totalQty
    FROM dbo.ProductBatch
    GROUP BY ${stockMapping.batch.oldProductKey}
  `);

  const oldTotals = oldTotalsResult.recordset;

  console.log(`  Found ${oldTotals.length} products with old batch stock`);

  const newTotals = await prisma.batch.groupBy({
    by: ['productId'],
    where: {
      NOT: {
        batchNumber: {
          startsWith: UNBATCHED_PREFIX,
        },
      },
    },
    _sum: {
      currentQuantity: true,
    },
  });

  const newTotalByProductId = new Map(
    newTotals.map((row) => [
      row.productId,
      Number(row._sum.currentQuantity ?? 0),
    ]),
  );

  let matched = 0;
  let mismatched = 0;
  let missingProduct = 0;

  for (const row of oldTotals) {
    const oldProductKey = String(row.oldProductKey).trim();

    const productId = productMap.get(oldProductKey);

    if (!productId) {
      missingProduct++;
      continue;
    }

    const oldTotal = Number(row.totalQty ?? 0);
    const newTotal = newTotalByProductId.get(productId) ?? 0;

    if (oldTotal === newTotal) {
      matched++;
    } else {
      mismatched++;
    }
  }

  console.log(`\n  ProductBatch → Batch stock validation (primary):`);
  console.log(`    Old products:       ${oldTotals.length}`);
  console.log(`    Matched:            ${matched}`);
  console.log(`    Mismatched:         ${mismatched}`);
  console.log(`    Missing product:    ${missingProduct}`);

  if (mismatched === 0 && missingProduct === 0) {
    console.log(`\n✔ ProductBatch → Batch stock validation passed.`);
  } else {
    console.log(`\n✗ ProductBatch → Batch stock validation failed.`);
  }

  console.log(`\n✔ Stock validation completed.`);
}

export async function migrateStock(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log(`\n==============================================`);
  console.log(`        STOCK MIGRATION`);
  console.log(`==============================================`);

  const purchaseDetailsByBatch = await loadPurchaseDetails(sqlPool);

  await migrateBatches(sqlPool, prisma, purchaseDetailsByBatch);

  await migrateUnbatchedProductStock(sqlPool, prisma);

  await migratePurchaseVouchers(sqlPool, prisma);

  await migratePurchaseItems(sqlPool, prisma);

  await validateStockMigration(sqlPool, prisma);

  console.log(`\n✔ Stock migration completed`);
}
