const fs = require('fs');
const pdf = require('pdf-parse');

const pdfPath = "c:/Users/LATITUDE 5400/Downloads/Learnership Management/docs/Curriculumn and data process/YEHA Training Material/YEHA Training Material/1. Module 3 - Market Requirements (Branded)/1. Learner Guides/LAG Module 3 NVC L2- YEHA.pdf";

async function dumpPdf() {
    const dataBuffer = fs.readFileSync(pdfPath);
    const data = await pdf(dataBuffer);
    fs.writeFileSync('lag_dump.txt', data.text);
    console.log('PDF text dumped to lag_dump.txt');
}

dumpPdf().catch(console.error);
