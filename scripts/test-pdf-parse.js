// Try different approaches to load pdf-parse
try {
  const pdfParseModule = require('pdf-parse/dist/pdf-parse/cjs/index.cjs');
  console.log('Method 1 - Direct CJS path:');
  console.log('  typeof:', typeof pdfParseModule);
  console.log('  is function:', typeof pdfParseModule === 'function');
} catch (e) {
  console.log('Method 1 failed:', e.message);
}

try {
  const pdfParseModule = require('pdf-parse');
  console.log('\nMethod 2 - Standard require:');
  console.log('  typeof:', typeof pdfParseModule);
  console.log('  is function:', typeof pdfParseModule === 'function');
  if (pdfParseModule.PDFExtract) {
    console.log('  has PDFExtract:', true);
  }
} catch (e) {
  console.log('Method 2 failed:', e.message);
}

