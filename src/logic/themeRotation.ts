import { KITCHEN_THEMES, type KitchenTheme, type KookEvent } from '../types';

/**
 * Stelt een thema voor op basis van de historie binnen de groep: het thema
 * dat het minst vaak gebruikt is (bij gelijke stand: het langst geleden
 * gebruikt, "nooit gebruikt" telt als langst geleden). Zo komt elk thema uit
 * de lijst één keer aan bod voordat er iets herhaald wordt.
 */
export function suggestTheme(groupEvents: KookEvent[]): KitchenTheme {
  const usageCount: Record<string, number> = {};
  const lastUsedIndex: Record<string, number> = {};
  KITCHEN_THEMES.forEach((t) => {
    usageCount[t] = 0;
    lastUsedIndex[t] = -1;
  });

  const chronological = [...groupEvents]
    .filter((e) => e.status === 'confirmed' && e.theme)
    .sort((a, b) => (a.confirmedDate ?? '').localeCompare(b.confirmedDate ?? ''));

  chronological.forEach((event, index) => {
    const theme = event.theme as KitchenTheme;
    usageCount[theme] = (usageCount[theme] ?? 0) + 1;
    lastUsedIndex[theme] = index;
  });

  const ranked = [...KITCHEN_THEMES].sort((a, b) => {
    if (usageCount[a] !== usageCount[b]) return usageCount[a] - usageCount[b];
    return lastUsedIndex[a] - lastUsedIndex[b];
  });

  return ranked[0];
}
