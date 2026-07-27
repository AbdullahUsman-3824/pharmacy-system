import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const suppliers = [
  {
    name: 'Medline Pharma',
    contactPerson: 'Ali Khan',
    phone: '042-1234567',
    mobile: '0300-1234567',
    email: 'sales@medline.com',
    city: 'Lahore',
    address: 'Lahore',
  },
  {
    name: 'City Pharma Distributors',
    contactPerson: 'Usman Tariq',
    phone: '042-2345678',
    mobile: '0301-2345678',
    email: 'info@citypharma.com',
    city: 'Lahore',
    address: 'Ferozepur Road, Lahore',
  },
  {
    name: 'Al-Noor Medical Suppliers',
    contactPerson: 'Bilal Ahmed',
    phone: '021-3456789',
    mobile: '0321-3456789',
    email: 'contact@alnoormed.com',
    city: 'Karachi',
    address: 'Tariq Road, Karachi',
  },
  {
    name: 'Punjab Pharma House',
    contactPerson: 'Hassan Raza',
    phone: '042-4567890',
    mobile: '0333-4567890',
    email: 'sales@punjabpharma.com',
    city: 'Okara',
    address: 'Main Bazaar, Okara',
  },
  {
    name: 'Sahiwal Drug Distributors',
    contactPerson: 'Kamran Iqbal',
    phone: '040-5678901',
    mobile: '0345-5678901',
    email: 'info@sahiwaldrugs.com',
    city: 'Sahiwal',
    address: 'Circular Road, Sahiwal',
  },
  {
    name: 'Ahmed Brothers Pharmaceuticals',
    contactPerson: 'Faisal Mehmood',
    phone: '042-6789012',
    mobile: '0312-6789012',
    email: 'sales@ahmedbros.com',
    city: 'Lahore',
    address: 'Gulberg, Lahore',
  },
];

async function main() {
  for (const supplier of suppliers) {
    const existing = await prisma.supplier.findFirst({
      where: { name: supplier.name },
    });

    if (existing) {
      console.log(`⏭️  Skipped (already exists): ${supplier.name}`);
      continue;
    }

    await prisma.supplier.create({ data: supplier });
    console.log(`✅ Created: ${supplier.name}`);
  }

  console.log(`\n✅ Supplier seeding completed`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
