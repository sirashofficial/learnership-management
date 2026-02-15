export const groupColours: Record<string, string> = {
  'city logistics': '#2563eb',
  'azelis sa': '#14b8a6',
  'monteagle': '#f97316',
  'beyond insights': '#8b5cf6',
  'flint group': '#ef4444',
  'packaging world': '#06b6d4',
  'azelis': '#0ea5e9',
  'wahl': '#a855f7',
};

export const defaultGroupColour = '#64748b';

export function getGroupColour(groupName?: string | null): string {
  if (!groupName) return defaultGroupColour;
  const normalized = groupName.toLowerCase();

  const match = Object.keys(groupColours).find((key) =>
    normalized.includes(key)
  );

  return match ? groupColours[match] : defaultGroupColour;
}
