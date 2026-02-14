const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath);

console.log(`🔧 Connecting to database at: ${dbPath}`);

try {
    // Check if table exists
    const row = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='DocumentChunk'").get();

    if (row) {
        console.log('✅ Table "DocumentChunk" already exists.');
    } else {
        console.log('✨ Creating table "DocumentChunk"...');

        // Create table matching the schema we wanted
        // id, content, filename, filePath, category, tags, chunkIndex, createdAt
        db.exec(`
            CREATE TABLE DocumentChunk (
                id TEXT PRIMARY KEY,
                content TEXT NOT NULL,
                filename TEXT NOT NULL,
                filePath TEXT NOT NULL,
                category TEXT NOT NULL,
                tags TEXT NOT NULL,
                chunkIndex INTEGER NOT NULL,
                createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Create indexes
        db.exec("CREATE INDEX idx_DocumentChunk_category ON DocumentChunk(category)");
        db.exec("CREATE INDEX idx_DocumentChunk_filename ON DocumentChunk(filename)");

        console.log('✅ Table created successfully.');
    }

} catch (error) {
    console.error('❌ Error setting up database:', error.message);
} finally {
    db.close();
}
