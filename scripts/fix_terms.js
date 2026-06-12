const fs = require('fs');
const filePath = 'src/components/DocumentEditorPage.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Find the Terms & Conditions block and wrap it in a conditional
const termsBlock = content.match(/<div className="space-y-1\.5">\s*<Label[^>]*>Terms[^<]*<\/Label>\s*<Textarea[^/]*\/>\s*<\/div>/s);
if (termsBlock) {
  console.log('Found Terms block:', JSON.stringify(termsBlock[0].substring(0, 100)));
  const wrapped = `{docType !== "purchase_order" && docType !== "bill" && (\n            ${termsBlock[0]}\n          )}`;
  content = content.replace(termsBlock[0], wrapped);
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('SUCCESS: Terms & Conditions section is now conditional for purchase_order and bill');
} else {
  // Try to find it with different approach - look for the Conditions label
  const lines = content.split('\n');
  let foundIdx = -1;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('Conditions')) {
      console.log(`Found at line ${i+1}: ${JSON.stringify(lines[i])}`);
      foundIdx = i;
    }
  }
  console.log('Total lines:', lines.length);
  console.log('No match with regex. Check line content above.');
}
