// Physical layout of a Series within the room.
//
// Computes where each Work hangs, how its panels are sized and spaced along the
// wall, and how long the room must be to hold everything. Both the scene
// (geometry) and the choreography (camera path) read from this, so the camera
// always comes to rest exactly where the art is — there is no separate "magic
// number" list of painting positions that could drift out of sync.

import type { ArtworkImage, Series, Work } from '~/types';

const PANEL_HEIGHT = 1.5;        // default vertical size of one panel (m)
const PANEL_GAP = 0.18;          // gap between panels within a multi-panel work (m)
const MAX_CLUSTER_WIDTH = 4.6;   // a cluster wider than this is scaled down to fit frame (m)
const WORK_GAP = 4.6;            // clear wall distance between adjacent works (m)
const LEAD_IN = 6;               // empty hall before the first work (m)
const LEAD_OUT = 3;              // hall behind the last work, to the far wall (m) — the tour ends on the work, not here

/** Vertical centre of every painting (m). Roughly gallery hanging height. */
export const ART_CENTER_Y = 1.92;

export interface PanelLayout {
  image: ArtworkImage;
  /** Centre offset of this panel from its work's centre, along the wall (z axis). */
  offsetZ: number;
  width: number;   // along the wall (z)
  height: number;  // vertical (y)
}

export interface WorkLayout {
  work: Work;
  index: number;
  onLeft: boolean;
  /** x coordinate of the wall this work hangs on. */
  wallX: number;
  /** z coordinate of the work's centre. */
  centerZ: number;
  /** Total extent of the cluster along the wall (z). */
  spanZ: number;
  panels: PanelLayout[];
}

export interface SeriesLayout {
  works: WorkLayout[];
  /** Room length along z. The room runs from z = 0 (entrance) to z = -roomLength. */
  roomLength: number;
}

function aspectOf(img: ArtworkImage): number {
  return img.aspect && img.aspect > 0 ? img.aspect : 1; // fall back to square
}

/** Size and position the panels of one work, scaling the cluster down if too wide. */
function layoutPanels(work: Work): { panels: PanelLayout[]; spanZ: number } {
  const naturalWidths = work.images.map((img) => PANEL_HEIGHT * aspectOf(img));
  const naturalSpan =
    naturalWidths.reduce((a, b) => a + b, 0) + PANEL_GAP * (work.images.length - 1);
  const scale = naturalSpan > MAX_CLUSTER_WIDTH ? MAX_CLUSTER_WIDTH / naturalSpan : 1;

  const gap = PANEL_GAP * scale;
  const widths = naturalWidths.map((w) => w * scale);
  const height = PANEL_HEIGHT * scale;
  const spanZ = widths.reduce((a, b) => a + b, 0) + gap * (work.images.length - 1);

  // Lay panels along z, panel 0 at the +z (entrance-facing) end of the cluster.
  const panels: PanelLayout[] = [];
  let edge = spanZ / 2;
  work.images.forEach((image, i) => {
    const w = widths[i] ?? 0;
    panels.push({ image, offsetZ: edge - w / 2, width: w, height });
    edge -= w + gap;
  });

  return { panels, spanZ };
}

export function layoutSeries(series: Series, roomWidth: number): SeriesLayout {
  const halfWidth = roomWidth / 2;
  const works: WorkLayout[] = [];

  // frontierZ = the most-negative wall z consumed so far (starts at the entrance).
  let frontierZ = 0;

  series.works.forEach((work, index) => {
    const { panels, spanZ } = layoutPanels(work);
    const onLeft = index % 2 === 0;
    const gapBefore = index === 0 ? LEAD_IN : WORK_GAP;
    const leadingEdgeZ = frontierZ - gapBefore;     // +z edge of this cluster
    const centerZ = leadingEdgeZ - spanZ / 2;

    works.push({
      work,
      index,
      onLeft,
      wallX: onLeft ? -halfWidth : halfWidth,
      centerZ,
      spanZ,
      panels
    });

    frontierZ = leadingEdgeZ - spanZ;               // -z edge of this cluster
  });

  return { works, roomLength: -frontierZ + LEAD_OUT };
}
