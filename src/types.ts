// Domain types for the gallery.

export interface Painting {
  /** Stable kebab-case id, also used as image filename stem. */
  id: string;
  title: string;
  year: string;
  medium: string;
  /** Physical dimensions, e.g. "100 × 80 cm". */
  dimensions: string;
  /** Filename in /public/paintings/, or null to use the placeholder. */
  image: string | null;
  /** Background color for placeholder canvas while image is unavailable. */
  placeholderColor: string;
  /** Accent color for placeholder (sun/sky element). */
  placeholderAccent: string;
  /** Story / context shown in the focus view. */
  story: string;
}

export interface SeriesIntro {
  eyebrow: string;
  body: string;
}

export interface Series {
  id: string;
  /** Roman-numeral or arabic room number for display. */
  number: string;
  title: string;
  intro: SeriesIntro;
  paintings: Painting[];
}

/** Position on the timeline of a pinned narrative moment. */
export interface Moment {
  /** 0-1 along the room's scroll timeline. */
  progress: number;
  paintingIndex: number | null;
  eyebrow?: string;
  title?: string;
  body?: string;
}
