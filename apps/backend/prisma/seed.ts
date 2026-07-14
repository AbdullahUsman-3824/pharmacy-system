// import 'dotenv/config';
// import { Pool } from 'pg';
// import { PrismaPg } from '@prisma/adapter-pg';
// import { PrismaClient } from '../src/generated/prisma/client';

// const pool = new Pool({ connectionString: process.env.DATABASE_URL });
// const adapter = new PrismaPg(pool);
// const prisma = new PrismaClient({ adapter });

// async function main() {
//   await prisma.company.upsert({
//     where: { code: 'CMP001' },
//     update: {},
//     create: {
//       code: 'CMP001',
//       name: 'GSK',
//     },
//   });

//   await prisma.company.upsert({
//     where: { code: 'CMP002' },
//     update: {},
//     create: {
//       code: 'CMP002',
//       name: 'Abbott',
//     },
//   });

//   await prisma.productType.upsert({
//     where: { code: 'TYPE001' },
//     update: {},
//     create: {
//       code: 'TYPE001',
//       name: 'Tablet',
//     },
//   });

//   await prisma.productType.upsert({
//     where: { code: 'TYPE002' },
//     update: {},
//     create: {
//       code: 'TYPE002',
//       name: 'Syrup',
//     },
//   });

//   await prisma.productGroup.upsert({
//     where: { code: 'GRP001' },
//     update: {},
//     create: {
//       code: 'GRP001',
//       name: 'Antibiotic',
//     },
//   });

//   await prisma.productGroup.upsert({
//     where: { code: 'GRP002' },
//     update: {},
//     create: {
//       code: 'GRP002',
//       name: 'Painkiller',
//     },
//   });

//   await prisma.generic.upsert({
//     where: { code: 'GEN001' },
//     update: {},
//     create: {
//       code: 'GEN001',
//       name: 'Paracetamol',
//     },
//   });

//   await prisma.generic.upsert({
//     where: { code: 'GEN002' },
//     update: {},
//     create: {
//       code: 'GEN002',
//       name: 'Amoxicillin',
//     },
//   });

//   await prisma.supplier.upsert({
//     where: { code: 'SUP001' },
//     update: {},
//     create: {
//       code: 'SUP001',
//       name: 'Medline Pharma',
//       contactPerson: 'Ali Khan',
//       phone: '042-1234567',
//       mobile: '0300-1234567',
//       email: 'sales@medline.com',
//       city: 'Lahore',
//       address: 'Lahore',
//     },
//   });

//   console.log('✅ Seed completed');
// }

// main()
//   .catch(console.error)
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
