

export const accountsMapping = {
  // ======================================================
  // ACCOUNTS
  // ======================================================
  //
  // Maps old Accounts → New BusinessContact / PaymentAccount
  // depending on acc_cat.
  //
  // acc_cat:
  //   1 = Banks
  //   2 = Customer
  //   3 = Supplier
  //
  // Other account categories are intentionally not mapped.

  accounts: {
    id: "acc_id",
    mainKey: "acc_mainkey",

    name: "acc_name",
    nameUrdu: "acc_nameurdu",

    type: "acc_type",
    typeName: "acc_typename",

    category: "acc_cat",
    categoryName: "acc_catname",

    group: "acc_group",
    groupName: "acc_groupname",

    companyId: "acc_compid",

    upperAccountKey: "acc_upr",

    info: "acc_info",

    organization: "acc_org",

    status: "acc_status",
    level: "acc_lvl",
  },

  // ======================================================
  // ACCOUNT LEDGER
  // ======================================================
  //
  // Historical accounting ledger.
  //
  // NOT migrated to the new Payment model.
  //
  // Payment in the new system only records which
  // PaymentAccount was used for a Sale/Purchase.
  //
  // Kept here for migration analysis / validation.

  accountLedger: {
    id: "accl_autoserial",
    accountMainKey: "accl_accmainkey",

    companyId: "accl_compid",

    mainKey: "accl_mainkey",

    number: "accl_no",
    serial: "accl_serial",
    slipNumber: "accl_slipno",

    type: "accl_type",

    date: "accl_date",
    year: "accl_year",

    debit: "accl_debit",
    credit: "accl_credit",

    description: "accl_desc",

    status: "accl_status",
  },

  // ======================================================
  // PURCHASE / SALE ACCOUNT REFERENCES
  // ======================================================
  //
  // These fields point to Accounts.acc_mainkey in the
  // old system.
  //
  // They are useful for resolving old suppliers/customers
  // during transaction migration.
  //
  // They do NOT directly become Payment.paymentAccountId.

  purchaseMain: {
    accountMainKey: "pur_accmainkey",
  },

  saleMain: {
    accountMainKey: "sal_accmainkey",
  },

  // ======================================================
  // ACCOUNT SETUP
  // ======================================================
  //
  // Old system's configured accounting accounts.
  //
  // Used only for understanding / resolving system accounts.
  // Not directly mapped to the new PaymentAccount model.

  accountSetup: {
    cashAccount: "cashAcc",
    bankAccount: "banksAcc",

    employeeAccount: "employeeAcc",

    purchaseAccount: "purchaseAcc",
    saleAccount: "saleAcc",

    payableAccount: "payable",

    extraDiscountPurchaseAccount: "extraDiscOnPurAcc",
    extraDiscountSaleAccount: "extraDiscOnSalAcc",

    salesTaxPurchaseAccount: "salestaxOnPurAcc",
    extraSalesTaxSaleAccount: "extraDiscOnSalAcc",
  },
} as const;