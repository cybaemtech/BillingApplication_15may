import { getPool, initializeDb } from "./server/db.js";

async function main() {
  await initializeDb();
  try {
    const pool = await getPool();
    const tables = [
      'delivery_challans',
      'purchase_orders',
      'quotations',
      'recurring_invoices',
      'sales_orders'
    ];
    
    for (const table of tables) {
      console.log(`Adding tenant_id to ${table}...`);
      try {
        await pool.request().batch(`
          IF COL_LENGTH('${table}', 'tenant_id') IS NULL
          BEGIN
            ALTER TABLE ${table} ADD tenant_id UNIQUEIDENTIFIER NULL;
            CREATE INDEX IX_${table}_tenant_id ON ${table}(tenant_id);
          END
        `);
        console.log(`Success: Added tenant_id to ${table}`);
      } catch (err: any) {
        console.error(`Error adding to ${table}:`, err.message);
      }
    }
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
