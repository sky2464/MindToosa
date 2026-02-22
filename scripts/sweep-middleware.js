#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const ROOT = process.cwd();
const IGNORES = [
  'node_modules',
  '.git',
  '.next',
  'dist',
  'build',
  'out',
  'playwright-report',
];

const textExtensions = new Set([
  '.md', '.mdx', '.ts', '.tsx', '.js', '.jsx', '.json', '.yml', '.yaml', '.txt', '.html'
]);

function isBinary(filePath) {
  // naive: check extension
  return !textExtensions.has(path.extname(filePath).toLowerCase());
}

function walk(dir, cb) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(ROOT, full);
    if (IGNORES.some(i => rel === i || rel.startsWith(i + path.sep))) continue;
    if (e.isDirectory()) walk(full, cb);
    else cb(full);
  }
}

const fileChanges = [];

walk(ROOT, (filePath) => {
  if (filePath === __filename) return;
  const rel = path.relative(ROOT, filePath);
  if (rel.startsWith('.github')) return; // skip GH workflow files
  if (isBinary(filePath)) return;
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let original = content;

    // Replace literal filenames
    content = content.replace(/middleware\.(ts|js|tsx|jsx)/g, 'proxy.$1');

    // Replace function export names: export function middleware -> proxy
    content = content.replace(/export\s+(async\s+)?function\s+middleware\b/g, (m) => m.replace('middleware', 'proxy'));
    content = content.replace(/export\s+const\s+middleware\b/g, (m) => m.replace('middleware', 'proxy'));
    content = content.replace(/export\s+default\s+function\s+middleware\b/g, (m) => m.replace('middleware', 'proxy'));
    content = content.replace(/function\s+middleware\s*\(/g, 'function proxy(');

    // For markdown and skill files, add a historical note if we introduced proxy but no note present
    const isMarkdown = /\.mdx?$/.test(filePath) || /SKILL\.md$/.test(filePath) || /\.yaml$/.test(filePath) || /\.yml$/.test(filePath);
    if (isMarkdown && content !== original) {
      if (!/historically\s+`middleware\.ts`/i.test(content) && /\bproxy\b/i.test(content)) {
        // insert historical note after first occurrence of "proxy" heading or inline mention
        content = content.replace(/(proxy\b)/i, "$1 (historically `middleware.ts`)");
      }
    }

    if (content !== original) {
      fs.writeFileSync(filePath, content, 'utf8');
      fileChanges.push(rel);
      console.log('Patched:', rel);
    }
  } catch (err) {
    // skip binary or unreadable
  }
});

console.log('\nSweep complete. Files changed:', fileChanges.length);
if (fileChanges.length) console.log(fileChanges.join('\n'));
else console.log('No files required changes.');
