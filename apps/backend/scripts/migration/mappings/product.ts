export const productMapping = {
  oldKey: 'prd_mainkey',
  code: 'prd_code',
  barcode: 'prd_barcode',
  name: 'prd_name',

  companyOldKey: 'prd_commainkey',
  typeOldKey: 'prd_typmainkey',
  groupOldKey: 'prd_grpmainkey',
  genericOldKey: 'prd_genmainkey',
  supplierOldKey: 'prd_dismainkey',

  registrationNo: 'prd_regno',
  originalReference: 'prd_orgref',
  shelfNo: 'prd_shelfno',
  minimumStock: 'prd_minlvl',
  maximumStock: 'prd_maxlvl',
  nivFormulary: 'prd_niv',

  packingSize: 'prd_size',
  retailPrice: 'prd_packretailprice',
  retailDiscount: 'prd_discountper',
  tradePrice: 'prd_packtradeprice',
  retailRate: 'prd_unitretailprice',
  tradeRate: 'prd_unittradeprice',
  counterRatePercent: 'prd_counterper',
  orgRatePercent: 'prd_orgdiscountper',

  isActive: 'prd_status',
} as const;
