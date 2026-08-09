import sql from 'mssql/msnodesqlv8';

const config = {
  server: 'VERONICA',
  database: 'SMART_DrugStore',
  driver: 'msnodesqlv8',
  options: {
    trustedConnection: true,
    trustServerCertificate: true,
  },
} as sql.config;

let pool: sql.ConnectionPool | null = null;

export async function getSqlServer() {
  if (!pool) {
    pool = await sql.connect(config);
  }
  return pool;
}

export async function closeSqlServer() {
  if (pool) {
    await pool.close();
    pool = null;
  }
}
