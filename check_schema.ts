import { db, initializeDb } from "./server/db.js";

async function main() {
  await initializeDb();
  try {
    const columns = await db.query`
      SELECT TABLE_NAME, COLUMN_NAME 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME IN ('delivery_challans', 'sales_orders', 'recurring_invoices', 'quotations', 'purchase_orders', 'bills', 'payments_received', 'expenses');
    `;
    
    const tablesWithTenantId = new Set(
      columns.recordset
        .filter(c => c.COLUMN_NAME === 'tenant_id')
        .map(c => c.TABLE_NAME)
    );
    
    console.log("Tables WITH tenant_id:", Array.from(tablesWithTenantId));
    
    // List all tables we checked
    const allTables = new Set(columns.recordset.map(c => c.TABLE_NAME));
    const missing = Array.from(allTables).filter(t => !tablesWithTenantId.has(t));
    
    console.log("Tables MISSING tenant_id:", missing);
    
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}
main();
