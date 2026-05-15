import fs from 'fs';
const path = 'd:/billing_app_6-3/server/routes.ts';
let content = fs.readFileSync(path, 'utf8');

// Replace `, [tenantId]` with `, { tenant_id: tenantId }`
const newContent = content.replace(/,\s*\[tenantId\]/g, ', { tenant_id: tenantId }');

fs.writeFileSync(path, newContent, 'utf8');
console.log('Replaced all occurrences in routes.ts');
