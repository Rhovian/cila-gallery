// Build the list of narrative moments for a series.
// Index 0 is the room intro; subsequent indices map to works 0..n-1.

import type { Moment, Series } from '~/types';

export function buildMoments(series: Series): Moment[] {
  const moments: Moment[] = [
    {
      progress: 0,
      workIndex: null,
      eyebrow: series.intro.eyebrow,
      title: series.title,
      body: series.intro.body
    }
  ];

  series.works.forEach((_, i) => {
    moments.push({
      progress: (i + 1) / (series.works.length + 1),
      workIndex: i
    });
  });

  return moments;
}
