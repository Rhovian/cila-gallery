// Domain types for the gallery.

/**
 * One image belonging to a Work.
 * A single painting has exactly one; a diptych / triptych / polyptych has several,
 * hung adjacently on the wall as a cluster.
 */
export interface ArtworkImage {
  /**
   * Filename only. The full URL is resolved as `/paintings/<series.id>/<file>`.
   * e.g. "happy-birds-sad-city-2.webp"
   */
  file: string;
  /** Short label distinguishing this panel within the work, e.g. "No. 2", "Ghost". Optional. */
  panelLabel?: string;
  /**
   * Intrinsic aspect ratio (width / height) of the image file.
   * Baked in so the scene can size the plane before the texture finishes loading;
   * if omitted, the scene reads it from the loaded texture.
   */
  aspect?: number;
}

/**
 * A single work on the wall — one painting, or a multi-panel piece hung as one cluster.
 * The camera comes to rest once per Work, facing the wall it hangs on, and the
 * wall label (year / medium / dimensions / story) reads from here.
 */
export interface Work {
  /** Stable kebab-case id. Unique within the series. */
  id: string;
  title: string;
  /** Year or year range, e.g. "2019" or "2018–2020". Not always known. */
  year?: string;
  /** Medium, e.g. "Oil on canvas". Not always known. */
  medium?: string;
  /** Physical dimensions, e.g. "100 × 80 cm". Not always known. */
  dimensions?: string;
  /** Wall-label / context text, shown when the camera rests in front of the work. */
  story?: string;
  /** One or more images. Length > 1 ⇒ multi-panel, hung adjacently as a cluster. */
  images: ArtworkImage[];
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
  /** Full artist statement for the series — longer-form than `intro.body`. */
  statement?: string;
  works: Work[];
}

/** Position on the timeline of a pinned narrative moment. */
export interface Moment {
  /** 0–1 along the room's scroll timeline. */
  progress: number;
  /** Index into `Series.works`, or null for the room intro. */
  workIndex: number | null;
  eyebrow?: string;
  title?: string;
  body?: string;
}
