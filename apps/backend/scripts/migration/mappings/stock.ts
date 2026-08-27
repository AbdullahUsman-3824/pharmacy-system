/**
 * Old SQL Server → New PostgreSQL
 *
 * Stock / Batch related field mappings.
 *
 * NOTE:
 * - Quantities in ProductBatch/ProductLedgerBatch are maintained
 *   in base units in the old system.
 * - prd_stock is NOT used to set Batch.currentQuantity directly.
 *   It is used only in the unbatched-stock reconciliation step,
 *   to recover stock that exists on the product but has no
 *   corresponding ProductBatch row (see migrateUnbatchedProductStock).
 * - prd_lastpurchaserate is intentionally not mapped because
 *   purchase history is maintained through StockVoucherItem.
 */

export const stockMapping = {
  // ======================================================
  // PRODUCT STOCK
  // ======================================================

  product: {
    oldKey: 'prd_mainkey',
    stock: 'prd_stock',
    lastPurchaseRate: 'prd_lastpurchaserate',
    packingSize: 'prd_size',
  },

  // ======================================================
  // PRODUCT BATCH
  // ======================================================

  batch: {
    companyId: 'bat_compid',
    year: 'bat_year',

    oldProductKey: 'bat_prodmainkey',
    batchNumber: 'bat_batchid',

    expiryDate: 'bat_expirydate',

    quantityIn: 'bat_qtyin',
    quantityOut: 'bat_qtyout',
    quantityBalance: 'bat_qtybal',
  },

  // ======================================================
  // PRODUCT LEDGER
  // ======================================================
  //
  // Historical stock movement at product level.
  //
  // This is NOT directly migrated to a new model.
  // It is useful for understanding / validating the old
  // stock calculations.

  productLedger: {
    id: 'prdl_autoserial',
    companyId: 'prdl_compid',

    type: 'prdl_type',
    number: 'prdl_no',
    year: 'prdl_year',

    oldMainKey: 'prdl_mainkey',
    date: 'prdl_date',

    oldProductKey: 'prdl_prdmainkey',
    description: 'prdl_desc',

    costRate: 'prdl_costrate',
    sellRate: 'prdl_sellrate',

    quantityIn: 'prdl_qtyin',
    quantityOut: 'prdl_qtyout',

    status: 'prdl_status',
  },

  // ======================================================
  // PRODUCT LEDGER BATCH
  // ======================================================
  //
  // Historical stock movement at batch level.
  //
  // Also NOT directly migrated as a separate table.
  // Used for understanding/validating batch quantities.

  productLedgerBatch: {
    id: 'prdlb_autoserial',
    companyId: 'prdlb_compid',
    year: 'prdlb_year',

    oldMainKey: 'prdlb_mainkey',
    oldProductKey: 'prdlb_prdmainkey',

    batchNumber: 'prdlb_batch',

    quantityIn: 'prdlb_qtyin',
    quantityOut: 'prdlb_qtyout',

    freeQuantityIn: 'prdlb_qtyinFree',
    freeQuantityOut: 'prdlb_qtyoutFree',

    type: 'prdlb_type',
  },

  // ======================================================
  // PURCHASE MAIN
  // ======================================================
  //
  // Maps to:
  // Old PurchaseMain → New StockVoucher
  //
  // Purchase return handling will depend on pur_type.

  purchaseMain: {
    oldKey: 'pur_mainkey',
    returnMainKey: 'pur_retmainkey',

    companyId: 'pur_compid',

    type: 'pur_type',
    number: 'pur_no',
    year: 'pur_year',

    date: 'pur_date',
    referenceNumber: 'pur_refno',

    accountKey: 'pur_accmainkey',
    remarks: 'pur_remarks',

    status: 'pur_status',

    extraDiscountPercent: 'pur_extdiscountper',
    extraDiscount: 'pur_extdiscount',

    freight: 'pur_freight',
    payment: 'pur_payment',

    netTotal: 'pur_nettotal',

    extraSalesTaxPercent: 'pur_extsalestaxper',
    extraSalesTax: 'pur_extsalestax',
  },

  // ======================================================
  // PURCHASE DETAIL
  // ======================================================
  //
  // Maps to:
  // Old PurchaseDetail → New StockVoucherItem

  purchaseDetail: {
    purchaseMainKey: 'pur_mainkey',
    serial: 'pur_serial',

    oldProductKey: 'pur_prdmainkey',

    batchNumber: 'pur_batno',
    expiryDate: 'pur_expiry',

    purchaseRate: 'pur_rate',

    packQuantity: 'pur_pack',
    looseQuantity: 'pur_loose',
    freeQuantity: 'pur_free',

    grossAmount: 'pur_gross',

    discountPercent: 'pur_discountper',
    discountAmount: 'pur_discount',

    taxPercent: 'pur_saletaxper',
    taxAmount: 'pur_saletax',

    netAmount: 'pur_amount',

    companyId: 'pur_compid',

    // Pack-level pricing
    packRetailPrice: 'pur_PackRP',
    packDiscount: 'pur_PackDis',
    packTradePrice: 'pur_PackTP',

    // Unit-level pricing
    unitRetailPrice: 'pur_UnitRP',
    unitTradePrice: 'pur_UnitTP',

    counterPrice: 'pur_CounterPrice',
    organizationPrice: 'pur_OrgPrice',
  },
} as const;
