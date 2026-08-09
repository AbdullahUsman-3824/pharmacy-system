import sql from 'mssql';
import { Prisma } from '../db/postgres';
import {
  companyMapping,
  typeMapping,
  groupMapping,
  genericMapping,
} from '../mappings/lookups';
import { companyMap, typeMap, groupMap, genericMap } from '../utils/id-map';
import { renderProgressBar } from '../utils/helpers';

type LookupMapping = {
  oldKey: string;
  code: string;
  name: string;
};

type LookupConfig = {
  label: string;
  table: string;
  mapping: LookupMapping;
  idMap: Map<string | number, string>;
  upsert: (data: {
    code: string;
    name: string;
  }) => Promise<{ id: string; createdAt: Date; updatedAt: Date }>;
};

export async function migrateLookupTables(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  const configs: LookupConfig[] = [
    {
      label: 'companies',
      table: 'dbo.MedCompany',
      mapping: companyMapping,
      idMap: companyMap,
      upsert: (data) =>
        prisma.company.upsert({
          where: { code: data.code },
          create: data,
          update: { name: data.name },
        }),
    },
    {
      label: 'types',
      table: 'dbo.MedType',
      mapping: typeMapping,
      idMap: typeMap,
      upsert: (data) =>
        prisma.productType.upsert({
          where: { code: data.code },
          create: data,
          update: { name: data.name },
        }),
    },
    {
      label: 'groups',
      table: 'dbo.MedGroup',
      mapping: groupMapping,
      idMap: groupMap,
      upsert: (data) =>
        prisma.productGroup.upsert({
          where: { code: data.code },
          create: data,
          update: { name: data.name },
        }),
    },
    {
      label: 'generics',
      table: 'dbo.MedGeneric',
      mapping: genericMapping,
      idMap: genericMap,
      upsert: (data) =>
        prisma.generic.upsert({
          where: { code: data.code },
          create: data,
          update: { name: data.name },
        }),
    },
  ];

  for (const config of configs) {
    await migrateOne(sqlPool, config);
  }
}

async function migrateOne(sqlPool: sql.ConnectionPool, config: LookupConfig) {
  const { label, table, mapping, idMap, upsert } = config;

  console.log(`\n▶ Migrating ${label} from ${table}...`);
  const startTime = Date.now();

  const result = await sqlPool.request().query(`
    SELECT
      ${mapping.oldKey},
      ${mapping.code},
      ${mapping.name}
    FROM ${table}
  `);

  const rows = result.recordset;
  console.log(`  Found ${rows.length} rows`);

  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const [index, oldRow] of rows.entries()) {
    try {
      const newRow = await upsert({
        code: oldRow[mapping.code],
        name: oldRow[mapping.name],
      });

      if (newRow.createdAt.getTime() === newRow.updatedAt.getTime()) {
        created++;
      } else {
        updated++;
      }

      idMap.set(oldRow[mapping.oldKey], newRow.id);
    } catch (err) {
      failed++;
      console.error(
        `\n  ✗ Failed on ${mapping.code}=${oldRow[mapping.code]}:`,
        err,
      );
    }

    renderProgressBar(index + 1, rows.length, label);
  }

  process.stdout.write('\n'); // move to next line after bar finishes

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(
    `✔ ${label}: ${created} created, ${updated} updated, ${failed} failed (${seconds}s)`,
  );
}
