#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const baseDir = process.cwd();
const rolloutDir = path.join(baseDir, 'public', 'rollout-plans');
const nvcPath = path.join(baseDir, '..', '..', 'NVC_Implementation_Plan.md');

console.log('Base dir:', baseDir);
console.log('NVC path:', nvcPath);
console.log('NVC exists:', fs.existsSync(nvcPath));
console.log('Rollout dir exists:', fs.existsSync(rolloutDir));

if (fs.existsSync(rolloutDir)) {
  const files = fs.readdirSync(rolloutDir);
  console.log('Files in rollout dir:', files);
}
