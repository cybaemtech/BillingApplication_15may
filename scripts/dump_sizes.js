const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(function(file) {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) { 
      results = results.concat(walk(file));
    } else { 
      results.push({ file, size: stat.size });
    }
  });
  return results;
}

const files = walk('server');
fs.writeFileSync('server_files.json', JSON.stringify(files, null, 2));
