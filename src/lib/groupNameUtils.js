// Utility for normalizing and mapping group names

/**
 * Normalize a group name from timetable/markdown to canonical DB name.
 * Handles year, abbreviations, and combined groups.
 * Returns an array of canonical group names.
 */
function normalizeGroupName(name) {
  if (!name) return [];
  const n = name.toLowerCase();
  if (n.includes("montazility") || n.includes("montzelity") || n.includes("montezility")) {
    return [
      "CITY LOGISTICS (LP) - 2026",
      "AZELIS SA (LP) - 2026",
      "MONTEAGLE (LP) - 2026",
      "BEYOND INSIGHTS (LP) - 2026"
    ];
  }
  if (n.includes("azelis 25")) return ["AZELIS (LP) - 2025"];
  if (n.includes("monteagle 25")) return ["MONTEAGLE (LP) - 2025"];
  if (n.includes("packaging world 25")) return ["PACKAGING WORLD (LP) - 2025"];
  if (n.includes("flint group 25")) return ["FLINT GROUP (LP) - 2025"];
  if (n.includes("wahl 25")) return ["WAHL CLIPPERS (LP) - 2025"];
  if (n.includes("azelis sa 26")) return ["AZELIS SA (LP) - 2026"];
  if (n.includes("monteagle 26")) return ["MONTEAGLE (LP) - 2026"];
  if (n.includes("packaging world 26")) return ["PACKAGING WORLD (LP) - 2026"];
  if (n.includes("flint group 26")) return ["FLINT GROUP (LP) - 2026"];
  if (n.includes("wahl 26")) return ["WAHL CLIPPERS (LP) - 2026"];
  // Default: return as-is
  return [name];
}

module.exports = { normalizeGroupName };