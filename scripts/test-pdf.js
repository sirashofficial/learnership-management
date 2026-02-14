const fs = require('fs');
const pdfParse = require('pdf-parse');

async function test() {
    console.log('Type of pdfParse:', typeof pdfParse);
    console.log('Is pdfParse a function?', typeof pdfParse === 'function');
    console.log('pdfParse keys:', Object.keys(pdfParse));

    if (typeof pdfParse !== 'function') {
        console.log('Default export:', pdfParse.default);
    }

    try {
        // Create a dummy PDF buffer (not a real PDF, but enough to see if function is called)
        // Actually, pdf-parse might throw if buffer is invalid, but we want to see if we can CALL it.
        const buffer = Buffer.from('test');

        let parseFunc = pdfParse;
        if (typeof parseFunc !== 'function' && pdfParse.default) {
            parseFunc = pdfParse.default;
        }

        console.log('Calling parse function...');
        await parseFunc(buffer);
    } catch (e) {
        console.log('Error during parse execution (expected if buffer is invalid PDF):');
        console.log(e.message);
    }
}

test();
