const fs = require('fs');
const path = require('path');
const mammoth = require('mammoth');

const DOCS_FOLDER = path.join(process.cwd(), 'docs', 'Curriculumn and data process', 'new groups 2026 - roll out plans', 'new groups 2026 - roll out plans');
const testFile = path.join(DOCS_FOLDER, 'Azelis Group 26_.docx');

async function testExtraction() {
  try {
    const buffer = fs.readFileSync(testFile);
    console.log('File size:', buffer.length, 'bytes');
    
    const result = await mammoth.extractRawText({ buffer });
    console.log('\n📄 Extracted text length:', result.value.length);
    console.log('\n📄 First 2000 characters:');
    console.log(result.value.substring(0, 2000));
    
    console.log('\n\n📄 Looking for "Unit Standard" pattern...');
    const unitPattern = /Unit\s+Standard\s+(\d+):([^\n]*)/gi;
    let match;
    let count = 0;
    while ((match = unitPattern.exec(result.value)) !== null && count < 5) {
      console.log(`  Found: Unit Standard ${match[1]}: ${match[2]}`);
      count++;
    }
    console.log(`  Total units found: ${count}`);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

testExtraction();
