// Build the list of narrative moments for a series.
// Index 0 is the room intro; subsequent indices map to paintings 0..n-1.

import type { Moment, Series } from '~/types';

export function buildMoments(series: Series): Moment[] {
  const moments: Moment[] = [
    {
      progress: 0,
      paintingIndex: null,
      eyebrow: series.intro.eyebrow,
      title: series.title,
      body: series.intro.body
    }
  ];

  series.paintings.forEach((_, i) => {
    moments.push({
      progress: (i + 1) / (series.paintings.length + 1),
      paintingIndex: i
    });
  });

  return moments;
}
