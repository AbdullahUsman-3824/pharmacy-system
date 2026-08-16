import sql from 'mssql';
import { BusinessContactType, PaymentAccountType } from '@repo/shared';

import { Prisma } from '../db/postgres';

import { accountsMapping } from '../mappings/accounts';
import { accountMap, accountTypeMap } from '../utils/id-map';
import {
  renderProgressBar,
  normalizeAccountName,
  isCashAccount,
  isBankAccount,
} from '../utils/helpers';

// ======================================================
// CONSTANTS
// ======================================================

const ACCOUNT_CATEGORY = {
  BANK: 1,
  CUSTOMER: 2,
  SUPPLIER: 3,
} as const;

// ======================================================
// BUSINESS CONTACTS
// ======================================================
//
// Old Accounts:
//   acc_cat = 2 → Customer
//   acc_cat = 3 → Supplier
//
// New:
//   BusinessContact
//
// No phone/address mapping because we have not established
// reliable old columns for those values.
// ======================================================

async function migrateBusinessContacts(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log('\n▶ Migrating business contacts...');

  const result = await sqlPool.request().query(`
    SELECT
      ${accountsMapping.accounts.mainKey},
      ${accountsMapping.accounts.name},
      ${accountsMapping.accounts.category},
      ${accountsMapping.accounts.status}
    FROM Accounts
    WHERE ${accountsMapping.accounts.category} IN (
      ${ACCOUNT_CATEGORY.CUSTOMER},
      ${ACCOUNT_CATEGORY.SUPPLIER}
    )
    ORDER BY ${accountsMapping.accounts.mainKey}
  `);

  const rows = result.recordset;

  console.log(`  Found ${rows.length} customer/supplier accounts`);

  let created = 0;
  let existing = 0;
  let skipped = 0;
  let failed = 0;

  const errors: { oldKey: string; name: string; error: unknown }[] = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    renderProgressBar(i + 1, rows.length, 'business contacts');

    const oldKey = String(row[accountsMapping.accounts.mainKey] ?? '').trim();

    const name = normalizeAccountName(row[accountsMapping.accounts.name]);

    const category = Number(row[accountsMapping.accounts.category]);

    if (!oldKey || !name) {
      skipped++;
      continue;
    }

    const type =
      category === ACCOUNT_CATEGORY.CUSTOMER
        ? BusinessContactType.CUSTOMER
        : BusinessContactType.SUPPLIER;

    const isActive = Number(row[accountsMapping.accounts.status] ?? 0) === 1;

    try {
      /*
       * BusinessContact currently has no legacy-key field,
       * so we identify an existing record by name + type.
       *
       * accountMap still uses the OLD acc_mainkey as the key.
       */
      const existingContact = await prisma.businessContact.findFirst({
        where: {
          name,
          type,
        },
        select: {
          id: true,
        },
      });

      let contactId: string;

      if (existingContact) {
        contactId = existingContact.id;
        existing++;
      } else {
        const contact = await prisma.businessContact.create({
          data: {
            name,
            type,
            isActive,
          },
          select: {
            id: true,
          },
        });

        contactId = contact.id;
        created++;
      }

      accountMap.set(oldKey, contactId);
      accountTypeMap.set(oldKey, 'BUSINESS_CONTACT');
    } catch (error) {
      failed++;

      errors.push({ oldKey, name, error });
    }
  }

  process.stdout.write('\n');

  if (errors.length > 0) {
    console.log(`  ✗ ${errors.length} business contact(s) failed:`);

    for (const { oldKey, name, error } of errors) {
      console.error(`    - ${oldKey} - ${name}`, error);
    }
  }

  console.log(
    `✔ Business contacts: ${created} created, ` +
      `${existing} existing, ${skipped} skipped, ` +
      `${failed} failed`,
  );
}

// ======================================================
// PAYMENT ACCOUNTS
// ======================================================
//
// Old Accounts:
//   acc_cat = 1
//
// Only actual cash/bank accounts are migrated.
//
// Cash:
//   Any legacy account whose name contains "cash"
//   maps to ONE system Cash in Hand account.
//
// Bank:
//   Accounts whose name contains "bank" become BANK
//   payment accounts.
//
// Other legacy accounts such as:
//   Counter Sale
//   Petty Cash
//   SHOP FUND
//
// are intentionally ignored.
// ======================================================

async function migratePaymentAccounts(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log('\n▶ Migrating payment accounts...');

  const result = await sqlPool.request().query(`
    SELECT
      ${accountsMapping.accounts.mainKey},
      ${accountsMapping.accounts.name},
      ${accountsMapping.accounts.category},
      ${accountsMapping.accounts.status}
    FROM Accounts
    WHERE ${accountsMapping.accounts.category} = ${ACCOUNT_CATEGORY.BANK}
    ORDER BY ${accountsMapping.accounts.mainKey}
  `);

  const rows = result.recordset;

  console.log(`  Found ${rows.length} legacy bank-category accounts`);

  let banksCreated = 0;
  let banksExisting = 0;
  let cashMapped = 0;
  let ignored = 0;
  let failed = 0;

  const errors: { oldKey: string; name: string; error: unknown }[] = [];

  // --------------------------------------------------
  // SYSTEM CASH ACCOUNT
  // --------------------------------------------------

  let cashAccount = await prisma.paymentAccount.findFirst({
    where: {
      type: PaymentAccountType.CASH,
    },
    select: {
      id: true,
    },
  });

  let createdCashAccount = false;

  if (!cashAccount) {
    cashAccount = await prisma.paymentAccount.create({
      data: {
        name: 'Cash in Hand',
        type: PaymentAccountType.CASH,
        isActive: true,
      },
      select: {
        id: true,
      },
    });

    createdCashAccount = true;
  }

  // --------------------------------------------------
  // MIGRATE LEGACY ACCOUNTS
  // --------------------------------------------------

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    renderProgressBar(i + 1, rows.length, 'payment accounts');

    const oldKey = String(row[accountsMapping.accounts.mainKey] ?? '').trim();

    const name = normalizeAccountName(row[accountsMapping.accounts.name]);

    const isActive = Number(row[accountsMapping.accounts.status] ?? 0) === 1;

    if (!oldKey || !name) {
      ignored++;
      continue;
    }

    try {
      // ----------------------------------------------
      // CASH
      // ----------------------------------------------

      if (isCashAccount(name)) {
        accountMap.set(oldKey, cashAccount.id);
        cashMapped++;

        continue;
      }

      // ----------------------------------------------
      // BANK
      // ----------------------------------------------

      if (!isBankAccount(name)) {
        /*
         * Examples:
         *   Counter Sale
         *   Petty Cash
         *   SHOP FUND
         *
         * These belong to the old accounting model and
         * are not PaymentAccounts in the new system.
         */
        ignored++;
        continue;
      }

      const existing = await prisma.paymentAccount.findFirst({
        where: {
          name,
          type: PaymentAccountType.BANK,
        },
        select: {
          id: true,
        },
      });

      let paymentAccountId: string;

      if (existing) {
        paymentAccountId = existing.id;
        banksExisting++;
      } else {
        const paymentAccount = await prisma.paymentAccount.create({
          data: {
            name,
            type: PaymentAccountType.BANK,
            isActive,
          },
          select: {
            id: true,
          },
        });

        paymentAccountId = paymentAccount.id;
        banksCreated++;
      }

      accountMap.set(oldKey, paymentAccountId);
      accountTypeMap.set(oldKey, 'PAYMENT_ACCOUNT');
    } catch (error) {
      failed++;

      errors.push({ oldKey, name, error });
    }
  }

  process.stdout.write('\n');

  if (createdCashAccount) {
    console.log('  ✓ Created system Cash in Hand account');
  }

  if (errors.length > 0) {
    console.log(`  ✗ ${errors.length} payment account(s) failed:`);

    for (const { oldKey, name, error } of errors) {
      console.error(`    - ${oldKey} - ${name}`, error);
    }
  }

  console.log(
    `✔ Payment accounts: ${banksCreated} banks created, ` +
      `${banksExisting} banks existing, ` +
      `${cashMapped} cash mappings, ` +
      `${ignored} ignored, ` +
      `${failed} failed`,
  );
}

// ======================================================
// VALIDATION
// ======================================================

async function validateAccounts(prisma: Prisma) {
  console.log('\n▶ Validating account migration...');

  const customers = await prisma.businessContact.count({
    where: {
      type: BusinessContactType.CUSTOMER,
    },
  });

  const suppliers = await prisma.businessContact.count({
    where: {
      type: BusinessContactType.SUPPLIER,
    },
  });

  const banks = await prisma.paymentAccount.count({
    where: {
      type: PaymentAccountType.BANK,
    },
  });

  const cash = await prisma.paymentAccount.count({
    where: {
      type: PaymentAccountType.CASH,
    },
  });

  console.log(`  Customers: ${customers}`);
  console.log(`  Suppliers: ${suppliers}`);
  console.log(`  Banks:     ${banks}`);
  console.log(`  Cash:      ${cash}`);

  if (cash !== 1) {
    throw new Error(`Expected exactly 1 CASH payment account, found ${cash}`);
  }

  console.log('✔ Account validation passed');
}

// ======================================================
// MAIN
// ======================================================

export async function migrateAccounts(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log('\n==============================================');
  console.log('        ACCOUNTS MIGRATION');
  console.log('==============================================');

  await migrateBusinessContacts(sqlPool, prisma);

  await migratePaymentAccounts(sqlPool, prisma);

  await validateAccounts(prisma);

  console.log('\n✔ Accounts migration completed');
}
