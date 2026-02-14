const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
console.log(`Testing database connection: ${dbPath}`);

try {
    const db = new Database(dbPath);
    console.log('✅ Connected.');

    const row = db.prepare("SELECT count(*) as count FROM DocumentChunk").get();
    console.log(`Current row count: ${row.count}`);

    // Try inserting a dummy row
    const start = Date.now();
    const insert = db.prepare("INSERT INTO DocumentChunk (id, content, filename, filePath, category, tags, chunkIndex) VALUES (?, ?, ?, ?, ?, ?, ?)");
    insert.run('test-id', 'test content', 'test.txt', 'docs/test.txt', 'test', 'tag1', 0);
    console.log('✅ Inserted row.');

    const rowAfter = db.prepare("SELECT count(*) as count FROM DocumentChunk").get();
    console.log(`New row count: ${rowAfter.count}`);

    // Clean up
    db.prepare("DELETE FROM DocumentChunk WHERE id = 'test-id'").run();
    console.log('✅ Deleted row.');

    db.close();
    console.log('✅ Closed.');

} catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Code:', error.code);
}
