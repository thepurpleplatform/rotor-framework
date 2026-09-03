#!/usr/bin/env node

/**
 * Transform README.md for source package distribution:
 * - Replace internal docs/ paths with GitHub blob URLs pointing to the specific tag
 * - Ensure all documentation links point to the repository version
 *
 * Usage: node scripts/prepare-source-readme.js <input-readme> <output-readme>
 *        Reads tag from GITHUB_REF env var (e.g., refs/tags/v0.2.5)
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length !== 2) {
  console.error('Usage: node prepare-source-readme.js <input-readme> <output-readme>');
  process.exit(1);
}

const [inputFile, outputFile] = args;

// Extract tag from GITHUB_REF env var
let tag = 'main'; // fallback to main branch
if (process.env.GITHUB_REF) {
  const match = process.env.GITHUB_REF.match(/refs\/tags\/(.+)/);
  if (match) {
    tag = match[1];
  }
}

console.log(`Reading README from: ${inputFile}`);
console.log(`Using tag/ref: ${tag}`);

if (!fs.existsSync(inputFile)) {
  console.error(`Error: Input file not found: ${inputFile}`);
  process.exit(1);
}

let content = fs.readFileSync(inputFile, 'utf8');

// GitHub repository base URL with specific tag
const GITHUB_BASE = `https://github.com/thepurpleplatform/rotor-framework/blob/${tag}`;

// Transform internal docs/ paths to GitHub URLs
// Pattern 1: [text](./docs/...)  ->  [text](https://github.com/.../docs/...)
content = content.replace(
  /\[([^\]]+)\]\(\.\/docs\/([^)]+)\)/g,
  `[$1](${GITHUB_BASE}/docs/$2)`
);

// Pattern 2: [text](docs/...)  ->  [text](https://github.com/.../docs/...)
content = content.replace(
  /\[([^\]]+)\]\(docs\/([^)]+)\)/g,
  `[$1](${GITHUB_BASE}/docs/$2)`
);

// Pattern 3: Plain docs/ references in text (optional, for completeness)
// Only transform if it looks like a path reference
content = content.replace(
  /`docs\/([^`]+)`/g,
  `[\`docs/$1\`](${GITHUB_BASE}/docs/$1)`
);

// Ensure directory exists for output
const outputDir = path.dirname(outputFile);
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, content, 'utf8');

console.log(`✓ Transformed README written to: ${outputFile}`);
console.log(`  - Internal docs/ paths converted to GitHub URLs`);
console.log(`  - Base URL: ${GITHUB_BASE}`);
