const Database = require('better-sqlite3');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
const db = new Database(dbPath, { readonly: true }); // Read-only for search

function searchLocal(queryText) {
    try {
        const query = queryText || process.argv[2];

        if (!query) {
            console.log('❌ Please provide a search query.');
            console.log('Usage: node scripts/search-local.js "your search terms"');
            process.exit(1);
        }

        console.log(`🔍 Searching for: "${query}"\n`);

        const terms = query.split(/\s+/).filter(t => t.length > 2);

        if (terms.length === 0) {
            console.log('⚠️  Query terms too short. Please use longer words.');
            process.exit(0);
        }

        console.log(`Keywords: ${terms.join(', ')}`);

        // Build WHERE clause dynamically
        // content LIKE '%term1%' OR content LIKE '%term2%' ...
        const conditions = terms.map((_, i) => `content LIKE ?`).join(' OR ');
        const params = terms.map(term => `%${term}%`);

        const stmt = db.prepare(`
            SELECT * FROM DocumentChunk 
            WHERE ${conditions}
            LIMIT 100
        `);

        const results = stmt.all(...params);

        // Client-side Ranking
        const rankedResults = results.map(chunk => {
            const contentLower = chunk.content.toLowerCase();
            let score = 0;
            let matchedTerms = [];

            terms.forEach(term => {
                const termLower = term.toLowerCase();
                if (contentLower.includes(termLower)) {
                    score += 1; // Basic match
                    // Bonus for multiple occurrences
                    const regex = new RegExp(termLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
                    const count = (contentLower.match(regex) || []).length;
                    score += count * 0.2;
                    matchedTerms.push(term);
                }
            });

            return { ...chunk, score, matchedTerms };
        })
            .filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 5); // Top 5

        // Display results
        console.log('='.repeat(80));
        console.log(`📊 TOP ${rankedResults.length} RESULTS`);
        console.log('='.repeat(80));

        if (rankedResults.length === 0) {
            console.log('No matches found.');
        }

        rankedResults.forEach((match, idx) => {
            console.log(`\n${idx + 1}. Score: ${match.score.toFixed(2)} (Matches: ${match.matchedTerms.join(', ')})`);
            console.log(`   File: ${match.filename}`);
            console.log(`   Category: ${match.category}`);
            if (match.tags) {
                console.log(`   Tags: ${match.tags}`);
            }
            console.log(`\n   Preview:`);
            // Find a snippet
            const firstTerm = match.matchedTerms[0];
            const content = match.content;
            const index = content.toLowerCase().indexOf(firstTerm.toLowerCase());
            const start = Math.max(0, index - 50);
            const end = Math.min(content.length, index + 150);
            const snippet = content.substring(start, end).replace(/\n/g, ' ');

            console.log(`   ...${snippet}...`);
            console.log('-'.repeat(80));
        });

    } catch (error) {
        console.error('❌ Error searching:', error.message);
    } finally {
        db.close();
    }
}

// Run if called directly
if (require.main === module) {
    searchLocal();
}

module.exports = searchLocal;
