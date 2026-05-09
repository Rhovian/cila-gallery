import type { Series } from '~/types';
import { venezuelaImpressions } from './series/venezuela-impressions';

export const allSeries: Series[] = [
  venezuelaImpressions
  // Add additional series here as they're authored.
];

export function getSeries(id: string): Series | undefined {
  return allSeries.find((s) => s.id === id);
}
