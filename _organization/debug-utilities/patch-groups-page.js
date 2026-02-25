const fs = require('fs');
const path = require('path');

const filePath = 'c:/Users/LATITUDE 5400/Downloads/Learnership Management/src/app/groups/page.tsx';
let content = fs.readFileSync(filePath, 'utf8');

// Fix 1: Closing Link tag in list view
// We look for the div that was supposed to be a Link and was closed with </div>
content = content.replace(
    /(<Link href=\{`\/groups\/\${group\.id\}`\}[^>]*>[\s\S]*?)(          <\/div>\s+<\/div>)/,
    (match, p1, p2) => {
        return p1 + '          </div>\n        </Link>';
    }
);

// Fix 2: Grid view Link closing and card structure repair
// This is trickier because of the mess at 1809
content = content.replace(
    /<Link href=\{`\/groups\/\${group\.id\}`\} className="p-4 cursor-pointer block">([\s\S]*?)        <\/div>\s+<\/Link>\s+{(?=\s+group\.facilitator)/,
    (match, p1) => {
        return `<Link href={\`/groups/\${group.id}\`} className="p-4 cursor-pointer block">${p1}        </div>\n      </div>\n    </Link>\n\n      {`;
    }
);

fs.writeFileSync(filePath, content);
console.log('Successfully patched GroupsPage.tsx');
