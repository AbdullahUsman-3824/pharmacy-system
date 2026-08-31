import sql from 'mssql';
import { Prisma } from '../db/postgres';
import { userMapping } from '../mappings/user';
import { userMap } from '../utils/id-map';
import { renderProgressBar } from '../utils/helpers';
import { UserType } from '@repo/shared';

export async function migrateUsers(
  sqlPool: sql.ConnectionPool,
  prisma: Prisma,
) {
  console.log(`\n▶ Clearing existing users...`);
  await prisma.user.deleteMany({});

  console.log(`▶ Migrating users...`);
  const startTime = Date.now();

  const result = await sqlPool.request().query(`
    SELECT
      ${userMapping.oldKey},
      ${userMapping.name},
      ${userMapping.pin},
      ${userMapping.status},
      ${userMapping.designation}
    FROM dbo.Sec_Users
  `);

  const users = result.recordset;
  console.log(`  Found ${users.length} users`);

  let created = 0;
  let failed = 0;

  for (const [index, oldUser] of users.entries()) {
    try {
      const newUser = await prisma.user.create({
        data: {
          name: oldUser[userMapping.name],
          pin: oldUser[userMapping.pin],
          type:
            oldUser[userMapping.designation] === 1
              ? UserType.STAFF
              : UserType.OWNER,
          isActive: oldUser[userMapping.status] === 1,
        },
      });

      created++;
      userMap.set(oldUser[userMapping.oldKey], newUser.id);
    } catch (err) {
      failed++;
      console.error(
        `\n  ✗ Failed on ${userMapping.oldKey}=${oldUser[userMapping.oldKey]}:`,
        err,
      );
    }

    renderProgressBar(index + 1, users.length, 'users');
  }

  process.stdout.write('\n');

  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✔ users: ${created} created, ${failed} failed (${seconds}s)`);
}

export async function migrateAdmin(prisma: Prisma) {
  console.log(`\n▶ Clearing existing users...`);
  await prisma.user.deleteMany({});

  console.log(`▶ Migrating users...`);
  const startTime = Date.now();

  try {
    await prisma.user.create({
      data: {
        name: process.env.ADMIN_NAME || 'Admin',
        pin: process.env.ADMIN_PIN || '1234',
        type: UserType.OWNER,
        isActive: true,
      },
    });
  } catch (err) {
    console.error(`\n  ✗ Failed to create admin user:`, err);
  }
  const seconds = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`✔ Admin user created (${seconds}s)`);
}
