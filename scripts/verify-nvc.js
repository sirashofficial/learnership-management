#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

// Hardcoded paths that are known to exist
const baseDir = 'c:\\Users\\LATITUDE 5400\\Downloads\\Learnership Management';
const nvcPath = 'c:\\Users\\LATITUDE 5400\\Downloads\\NVC_Implementation_Plan.md';
const flintContentStart = nvcPath;

console.log('Checking paths...');
console.log('NVC file exists:', fs.existsSync(nvcPath));

if (fs.existsSync(nvcPath)) {
  const content = fs.readFileSync(nvcPath, 'utf-8');
  console.log('File size:', content.length, 'bytes');
  
  // Check for sections
  console.log('Has FLINT GROUP section:', content.includes('# FLINT GROUP'));
  console.log('Has WAHL GROUP section:', content.includes('# WAHL GROUP'));
  
  // Count tables
  const tableCount = (content.match(/\|/g) || []).length / 80; // Rough estimate
  console.log('Approximate table rows:', Math.round(tableCount));
}
