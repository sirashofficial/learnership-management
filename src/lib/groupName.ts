export function formatGroupNameDisplay(name: string): string {
  if (!name) return '';
  const trimmed = name.trim();

  const lpMatch = trimmed.match(/\(lp\)\s*-\s*(20\d{2})/i);
  const parenYearMatch = trimmed.match(/\((20\d{2})\)/);
  const yearMatch = trimmed.match(/\b(20\d{2})\b/);
  const apostropheMatch = trimmed.match(/\b(\d{2})'\b/);

  const year =
    lpMatch?.[1] ||
    parenYearMatch?.[1] ||
    yearMatch?.[1] ||
    (apostropheMatch ? `20${apostropheMatch[1]}` : null);

  let base = trimmed
    .replace(/\(lp\)\s*-\s*20\d{2}/i, '')
    .replace(/\((20\d{2})\)/, '')
    .replace(/\b20\d{2}\b/, '')
    .replace(/\b\d{2}'\b/, '')
    .replace(/[\s-]+$/, '')
    .trim();

  const normalizedBase = base.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const baseMap: Record<string, string> = {
    'azelis sa': 'Azelis SA',
    azelis: 'Azelis',
    'city logistics': 'City Logistics',
    'beyond insights': 'Beyond Insights',
    monteagle: 'Monteagle',
    'packaging world': 'Packaging World',
    'flint group': 'Flint Group',
    'wahl clippers': 'Wahl Clippers',
    wahl: 'Wahl Clippers',
    montzelity: 'Montzelity',
  };

  if (baseMap[normalizedBase]) {
    base = baseMap[normalizedBase];
  }

  if (!base) {
    base = trimmed;
  }

  return year ? `${base} (${year})` : base;
}
