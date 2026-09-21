#!/usr/bin/env node
/**
 * Fail CI if focused Jest tests (*.only) are committed.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const ROOTS = ['src', 'tests'];
const PATTERN = /\b(describe|it|test)\.only\s*\(/;

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'coverage') continue;
      walk(full, acc);
    } else if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(entry.name)) {
      acc.push(full);
    }
  }
  return acc;
}

const offenders = [];
for (const root of ROOTS) {
  for (const file of walk(path.join(ROOT, root))) {
    const text = fs.readFileSync(file, 'utf8');
    if (PATTERN.test(text)) {
      offenders.push(path.relative(ROOT, file));
    }
  }
}

if (offenders.length > 0) {
  console.error('Focused tests (.only) are not allowed:\n' + offenders.map((f) => ` - ${f}`).join('\n'));
  process.exit(1);
}

console.log('No focused Jest tests found.');
