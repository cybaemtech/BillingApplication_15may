import * as fs from 'fs';

const content = fs.readFileSync('server/routes.ts', 'utf-8');
const lines = content.split('\n');

const searchTerms = [
  '/customers',
  '/items',
  '/vendors',
  '/quotations',
  '/sales-orders',
  '/delivery-challans',
  '/purchase-orders',
  '/purchase-invoices',
  '/purchase-returns',
  '/credit-notes',
  '/sales-returns',
  '/payments',
  '/expenses',
  '/bank-accounts',
  '/recurring-invoices',
  '/tasks'
];

const results: any = {};

searchTerms.forEach(term => {
  results[term] = [];
  lines.forEach((line, index) => {
    if (line.includes(`router.get("${term}"`) || 
        line.includes(`router.post("${term}"`) || 
        line.includes(`router.put("${term}/:id"`) || 
        line.includes(`router.patch("${term}/:id"`) || 
        line.includes(`router.delete("${term}/:id"`)) {
      results[term].push({ line: index + 1, content: line.trim() });
    }
  });
});

fs.writeFileSync('routes_scan.json', JSON.stringify(results, null, 2));
console.log("Scan complete. Results written to routes_scan.json");
