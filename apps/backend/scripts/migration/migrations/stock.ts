import sql from 'mssql';
import { StockVoucherType } from '@repo/shared';

import { Prisma } from '../db/postgres';
import { stockMapping } from '../mappings/stock';

import {
  productMap,
  accountMap,
  batchMap,
  purchaseVoucherMap,
  getBatchMapKey,
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

function getHistoryCutoffDate(): Date {
  const date = new Date();
  date.setFullYear(date.getFullYear() - HISTORY_YEARS);
  return date;
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

  const batches = result.recordset;

  console.log(`  Found ${batches.length} batches`);

  let created = 0;
  let updated = 0;
  let skipped = 0;
  let failed = 0;
  let noRateHistoryCount = 0;

  const skipReasons: Record<string, number> = {
    'product not migrated': 0,
  };
  const errors: { batchNumber: string; error: unknown }[] = [];

  for (const [index, oldBatch] of batches.entries()) {
    try {
      const oldProductKey = String(
        oldBatch[stockMapping.batch.oldProductKey],
      ).trim();

      const productId = productMap.get(oldProductKey);

      if (!productId) {
        skipped++;

        skipReasons['product not migrated']++;

        renderProgressBar(index + 1, batches.length, 'batches');

        continue;
      }

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

        looseQuantity: 0,

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
    } catch (err) {
      failed++;

      errors.push({
        batchNumber: String(oldBatch[stockMapping.batch.batchNumber]),
        error: err,
      });
    }

    renderProgressBar(index + 1, batches.length, 'batches');
  }

  process.stdout.write('\n');
  if (errors.length > 0) {
    console.log(`  ✗ ${errors.length} batch(es) failed:`);

    for (const { batchNumber, error } of errors) {
      console.error(`    - ${batchNumber}`, error);
    }
  }

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log(
    `✔ batches: ${created} created, ${updated} updated, ` +
      `${skipped} skipped, ${failed} failed (${seconds}s)`,
  );

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

  const errors: { oldKey: string; error: unknown }[] = [];

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
    } catch (err) {
      failed++;

      errors.push({
        oldKey: String(oldVoucher[stockMapping.purchaseMain.oldKey]),
        error: err,
      });
    }

    renderProgressBar(index + 1, vouchers.length, 'purchase vouchers');
  }

  process.stdout.write('\n');
  if (errors.length > 0) {
    console.log(`  ✗ ${errors.length} voucher(s) failed:`);

    for (const { oldKey, error } of errors) {
      console.error(`    - ${oldKey}`, error);
    }
  }

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
 */

export async function migratePurchaseItems(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log(`\n▶ Migrating purchase items from dbo.PurchaseDetail...`);

  const startTime = Date.now();

  const cutoffDate = getHistoryCutoffDate();

  const products = await prisma.product.findMany({
    select: {
      id: true,
      packingSize: true,
    },
  });

  const packingSizeByProductId = new Map(
    products.map((product) => [product.id, Number(product.packingSize)]),
  );

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

  const errors: { index: number; error: unknown }[] = [];

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

      const packingSize = packingSizeByProductId.get(productId) ?? 1;

      const quantity = pack * packingSize + loose;

      const allFit =
        fitsInt(quantity) &&
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

          quantity: Math.round(quantity),

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
    } catch (err) {
      failed++;

      errors.push({ index, error: err });
    }

    renderProgressBar(index + 1, items.length, 'purchase items');
  }

  process.stdout.write('\n');
  if (errors.length > 0) {
    console.log(`  ✗ ${errors.length} purchase item(s) failed:`);

    for (const { index, error } of errors) {
      console.error(`    - index ${index}`, error);
    }
  }

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

  // ==================================================
  // 1. BATCH STOCK VALIDATION
  // ==================================================
  //
  // Authoritative comparison:
  //
  // Old:
  //   ProductBatch.bat_qtybal
  //
  // New:
  //   Batch.currentQuantity
  //
  // We do NOT compare Products.prd_stock.
  // ==================================================

  const oldBatchResult = await sqlPool.request().query(`
    SELECT
      ${stockMapping.batch.oldProductKey},
      ${stockMapping.batch.batchNumber},
      ${stockMapping.batch.expiryDate},
      ${stockMapping.batch.quantityBalance}
    FROM dbo.ProductBatch
  `);

  const oldBatches = oldBatchResult.recordset;

  console.log(`  Found ${oldBatches.length} old batches`);

  // --------------------------------------------------
  // Build new-product lookup
  // --------------------------------------------------
  //
  // productMap should already contain:
  //
  // old prd_mainkey -> new Product.id
  //
  // because products were migrated before batches.
  // --------------------------------------------------

  let matched = 0;
  let mismatched = 0;
  let missingProduct = 0;
  let missingBatch = 0;

  const mismatchExamples: Array<{
    productKey: string;
    batchNumber: string;
    expiryDate: Date | null;
    oldQuantity: number;
    newQuantity: number | null;
    difference: number;
  }> = [];

  // --------------------------------------------------
  // Load all PostgreSQL batches once
  // --------------------------------------------------

  const newBatches = await prisma.batch.findMany({
    select: {
      id: true,
      productId: true,
      batchNumber: true,
      expiryDate: true,
      currentQuantity: true,
    },
  });

  // --------------------------------------------------
  // Create lookup:
  //
  // productId + batchNumber + expiryDate
  // --------------------------------------------------

  const newBatchMap = new Map<
    string,
    {
      id: string;
      currentQuantity: number;
    }
  >();

  for (const batch of newBatches) {
    const key = getBatchMapKey(
      batch.productId,
      normalizeBatchNumber(batch.batchNumber),
      batch.expiryDate,
    );

    newBatchMap.set(key, {
      id: batch.id,
      currentQuantity: Number(batch.currentQuantity),
    });
  }

  // --------------------------------------------------
  // Compare every old batch
  // --------------------------------------------------

  for (const oldBatch of oldBatches) {
    const oldProductKey = String(
      oldBatch[stockMapping.batch.oldProductKey],
    ).trim();

    const productId = productMap.get(oldProductKey);

    if (!productId) {
      missingProduct++;
      continue;
    }

    const batchNumber = normalizeBatchNumber(
      oldBatch[stockMapping.batch.batchNumber],
    );

    const expiryDate = normalizeExpiryDate(
      oldBatch[stockMapping.batch.expiryDate],
    );

    const key = getBatchMapKey(productId, batchNumber, expiryDate);

    const newBatch = newBatchMap.get(key);

    const oldQuantity = Number(
      oldBatch[stockMapping.batch.quantityBalance] ?? 0,
    );

    // ------------------------------------------------
    // Batch doesn't exist in PostgreSQL
    // ------------------------------------------------

    if (!newBatch) {
      missingBatch++;

      if (mismatchExamples.length < 20) {
        mismatchExamples.push({
          productKey: oldProductKey,
          batchNumber,
          expiryDate,
          oldQuantity,
          newQuantity: null,
          difference: -oldQuantity,
        });
      }

      continue;
    }

    // ------------------------------------------------
    // Compare quantity
    // ------------------------------------------------

    const newQuantity = newBatch.currentQuantity;

    if (oldQuantity === newQuantity) {
      matched++;
    } else {
      mismatched++;

      if (mismatchExamples.length < 20) {
        mismatchExamples.push({
          productKey: oldProductKey,
          batchNumber,
          expiryDate,
          oldQuantity,
          newQuantity,
          difference: newQuantity - oldQuantity,
        });
      }
    }
  }

  // ==================================================
  // RESULT
  // ==================================================

  console.log(`\n  Batch stock validation:`);
  console.log(`    Old batches:       ${oldBatches.length}`);
  console.log(`    Matched:            ${matched}`);
  console.log(`    Mismatched:         ${mismatched}`);
  console.log(`    Missing product:    ${missingProduct}`);
  console.log(`    Missing batch:      ${missingBatch}`);

  // --------------------------------------------------
  // Show examples
  // --------------------------------------------------

  if (mismatchExamples.length > 0) {
    console.log(`\n  ⚠ First ${mismatchExamples.length} problems:`);

    for (const item of mismatchExamples) {
      console.log(
        `    Product=${item.productKey} ` +
          `Batch="${item.batchNumber}" ` +
          `Expiry=${
            item.expiryDate
              ? item.expiryDate.toISOString().slice(0, 10)
              : 'NULL'
          } ` +
          `old=${item.oldQuantity} ` +
          `new=${item.newQuantity ?? 'MISSING'} ` +
          `diff=${item.difference}`,
      );
    }
  }

  // ==================================================
  // FINAL STATUS
  // ==================================================

  if (mismatched === 0 && missingProduct === 0 && missingBatch === 0) {
    console.log(`\n✔ Batch stock validation passed.`);
  } else {
    console.log(`\n✗ Batch stock validation failed.`);
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

  await migratePurchaseVouchers(sqlPool, prisma);

  await migratePurchaseItems(sqlPool, prisma);

  await validateStockMigration(sqlPool, prisma);

  console.log(`\n✔ Stock migration completed`);
}
