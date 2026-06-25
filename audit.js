const fs = require('fs');
const path = require('path');

const targetDirs = [
  path.join(__dirname, 'frontend/src'),
  path.join(__dirname, 'backend/src')
];

const patterns = [
  /Math\.random/i,
  /8999/,
  /7999/,
  /9999/,
  /\$/g,
  /USD/i,
  /imageUrl/i,
  /placeholder/i,
  /dummy/i,
  /mock/i,
  /sample/i,
  /demo/i,
  /fallbackProduct/i,
  /defaultProduct/i,
  /defaultImage/i,
  /hardcoded/i,
  /slice\(/i,
  /salePrice/i,
  /discountPrice/i,
  /oldPrice/i,
  /displayPrice/i,
  /mockPrice/i
];

const results = {};

function scanDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      scanDir(fullPath);
    } else if (entry.isFile() && (fullPath.endsWith('.js') || fullPath.endsWith('.jsx'))) {
      const content = fs.readFileSync(fullPath, 'utf8');
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        for (const pattern of patterns) {
          if (pattern.test(line)) {
            if (!results[fullPath]) results[fullPath] = [];
            results[fullPath].push({ line: i + 1, match: pattern.source, text: line.trim() });
            break; // Store the first match per line to avoid duplication
          }
        }
      }
    }
  }
}

targetDirs.forEach(dir => {
  if (fs.existsSync(dir)) scanDir(dir);
});

fs.writeFileSync('audit_results.json', JSON.stringify(results, null, 2));
console.log('Audit complete, found ' + Object.keys(results).length + ' files with issues.');
