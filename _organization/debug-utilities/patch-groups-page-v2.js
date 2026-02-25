const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/LATITUDE 5400/Downloads/Learnership Management/src/app/groups/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 2: Grid view Link closing and card structure repair (Corrected)
// We need to add the missing </div> before </Link> at 1808 (in current view)
content = content.replace(
    /(\n\s+<\/div>\s+)(<\/Link>)/,
    (match, p1, p2) => {
        // This regex is a bit risky if it matches elsewhere, 
        // but given the recent changes it should be close to the only one with this pattern in the card
        return p1 + '      </div>\n    ' + p2;
    }
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched GroupsPage.tsx again');
