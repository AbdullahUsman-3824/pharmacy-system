import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ---- Lookup Data ----

const companies = [
  'GSK',
  'Abbott',
  'Pfizer',
  'Sanofi',
  'Novartis',
  'Getz Pharma',
  'Highnoon Laboratories',
  'Searle',
  'Martin Dow',
  'Hilton Pharma',
  'Sami Pharmaceuticals',
  "Wilson's",
  'ATCO Laboratories',
  'Barrett Hodgson',
  'Bosch Pharmaceuticals',
  'CCL Pharmaceuticals',
  'Ferozsons Laboratories',
  'Global Pharmaceuticals',
  'Herbion',
  'ICI Pakistan',
  'Merck',
  'OBS Pakistan',
  'PharmEvo',
  'Reckitt Benckiser',
  'Schazoo Zaka',
  'Tabros Pharma',
  'Werrick Pharmaceuticals',
  'Zafa Pharmaceuticals',
];

const productTypes = [
  'Tablet',
  'Syrup',
  'Capsule',
  'Injection',
  'Ointment',
  'Cream',
  'Drops',
  'Suspension',
  'Powder',
  'Sachet',
  'Suppository',
  'Inhaler',
  'Lotion',
  'Gel',
  'Spray',
  'Lozenge',
];

const productGroups = [
  'Antibiotic',
  'Painkiller / Analgesic',
  'Antipyretic',
  'Antacid',
  'Antihistamine',
  'Antidiabetic',
  'Antihypertensive',
  'Antidepressant',
  'Antifungal',
  'Antiviral',
  'Anti-inflammatory',
  'Vitamins & Supplements',
  'Cough & Cold',
  'Laxative',
  'Antiemetic',
  'Antispasmodic',
  'Cardiac',
  'Dermatological',
  'Ophthalmic',
  'ENT',
  'Multivitamin',
  'Antiseptic',
  'Muscle Relaxant',
  'Anticonvulsant',
  'Antipsychotic',
];

const generics = [
  'Paracetamol',
  'Amoxicillin',
  'Ibuprofen',
  'Omeprazole',
  'Metformin',
  'Amlodipine',
  'Atorvastatin',
  'Azithromycin',
  'Cetirizine',
  'Ciprofloxacin',
  'Diclofenac',
  'Domperidone',
  'Esomeprazole',
  'Loratadine',
  'Losartan',
  'Metronidazole',
  'Naproxen',
  'Ranitidine',
  'Simvastatin',
  'Tramadol',
  'Aspirin',
  'Cephalexin',
  'Clarithromycin',
  'Dexamethasone',
  'Doxycycline',
  'Erythromycin',
  'Fluconazole',
  'Gabapentin',
  'Hydrochlorothiazide',
  'Insulin',
  'Levofloxacin',
  'Montelukast',
  'Ondansetron',
  'Prednisolone',
  'Salbutamol',
  'Vitamin B Complex',
  'Vitamin C',
  'Vitamin D3',
  'Zinc Sulfate',
];

// ---- Helper: seeds any lookup model with code + name pattern ----

async function seedLookup(
  modelName: 'company' | 'productType' | 'productGroup' | 'generic',
  prefix: string,
  values: string[],
) {
  for (let i = 0; i < values.length; i++) {
    const code = `${prefix}${String(i + 1).padStart(3, '0')}`; // e.g. CMP001
    await (prisma[modelName] as any).upsert({
      where: { code },
      update: {},
      create: { code, name: values[i] },
    });
  }
  console.log(`✅ ${modelName} seeded (${values.length} records)`);
}

async function main() {
  await seedLookup('company', 'CMP', companies);
  await seedLookup('productType', 'TYPE', productTypes);
  await seedLookup('productGroup', 'GRP', productGroups);
  await seedLookup('generic', 'GEN', generics);

  console.log('✅ Seed completed');
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
