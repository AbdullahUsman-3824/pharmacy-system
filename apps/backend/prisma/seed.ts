import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import {
  PaymentAccountType,
  PrismaClient,
} from '../src/generated/prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.paymentAccount.create({
    data: {
      name: 'Cash in Hand',
      type: PaymentAccountType.CASH,
      isActive: true,
    },
  });
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
