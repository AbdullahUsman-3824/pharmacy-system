import { PrismaClient } from '../../../src/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

export const prisma = new PrismaClient({
  adapter,
});

export type Prisma = typeof prisma;

export async function connectPostgres() {
  await prisma.$connect();
}

export async function closePostgres() {
  await prisma.$disconnect();
}
