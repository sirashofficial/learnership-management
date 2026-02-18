const fs = require('fs');
const path = require('path');

// Find all API route files
function findApiRoutes(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      files.push(...findApiRoutes(fullPath));
    } else if (item === 'route.ts') {
      files.push(fullPath);
    }
  }
  
  return files;
}

// Remove authentication checks from a file
function removeAuthFromFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;
  
  // Pattern 1: const { error, user } = requireAuth(request); if (error) return error;
  const pattern1 = /\s*const \{ error,? user \} = requireAuth\(request\);\s*if \(error\) return error;\s*/g;
  if (pattern1.test(content)) {
    content = content.replace(pattern1, '\n');
    modified = true;
  }
  
  // Pattern 2: const { error } = requireAuth(request); if (error) return error;
  const pattern2 = /\s*const \{ error \} = requireAuth\(request\);\s*if \(error\) return error;\s*/g;
  if (pattern2.test(content)) {
    content = content.replace(pattern2, '\n');
    modified = true;
  }
  
  // Pattern 3: const authResult = requireAuth(request); if (authResult.error) return authResult.error;
  const pattern3 = /\s*const authResult = requireAuth\(request\);\s*if \(authResult\.error\) return authResult\.error;\s*/g;
  if (pattern3.test(content)) {
    content = content.replace(pattern3, '\n');
    modified = true;
  }
  
  // Pattern 4: const { error, user } = requireAdmin(request); if (error) return error;
  const pattern4 = /\s*const \{ error,? user \} = requireAdmin\(request\);\s*if \(error\) return error;\s*/g;
  if (pattern4.test(content)) {
    content = content.replace(pattern4, '\n');
    modified = true;
  }
  
  // Pattern 5: Remove import statements for requireAuth
  const pattern5 = /import.*requireAuth.*from.*;\s*/g;
  if (pattern5.test(content)) {
    content = content.replace(pattern5, '');
    modified = true;
  }
  
  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Removed auth from: ${filePath}`);
    return true;
  }
  
  return false;
}

// Main execution
const apiDir = path.join(__dirname, 'src', 'app', 'api');
const routes = findApiRoutes(apiDir);

console.log(`Found ${routes.length} API routes\n`);

let modifiedCount = 0;
for (const route of routes) {
  if (removeAuthFromFile(route)) {
    modifiedCount++;
  }
}

console.log(`\n✅ Modified ${modifiedCount} files`);
console.log(`✅ All authentication checks removed!`);
