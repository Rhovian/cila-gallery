import type { Series } from '~/types';

// Room I — Venezuela Impressions.
//
// Image files live in /public/paintings/venezuela-impressions/. The `file` field
// is the bare filename; the scene resolves it to `/paintings/<series.id>/<file>`.
// `aspect` is width/height of the actual file (so planes can be sized before the
// texture loads). Multi-image works are hung adjacently as one cluster and the
// camera rests on them once.
//
// TODO(CILA): year / medium / dimensions / story are placeholders or omitted where
// not yet supplied. Confirm and fill. Work order below is provisional — reorder to
// the intended walk-through sequence (ideally roughly chronological).

export const venezuelaImpressions: Series = {
  id: 'venezuela-impressions',
  number: 'I',
  title: 'Venezuela Impressions',
  intro: {
    eyebrow: 'ROOM I',
    body: 'Paintings drawn from memory, news, and longing. The city of Caracas as it was, as it is, as it cannot be again.'
  },
  // Artist statement, as supplied by CILA (whitespace tidied, dashes normalised;
  // otherwise verbatim). Note: she refers to the body of work as "Colorless
  // Liberation" — reconcile with the room title "Venezuela Impressions".
  // TODO(CILA): a few small copy points flagged separately if you want to polish.
  statement: `For many years, the humanitarian crisis in Venezuela has affected me and motivated the creation of a series addressing this tragedy, despite the difficulty of representing such painful subject matter. Over an extended period, countless innocent people have been subjected to severe mistreatment through policies and actions mandated by the illegitimate government. Those who opposed to the regime — including students, political rivals, and journalists — have been imprisoned without justification, often under inhumane conditions.

My heart has always remained with the people of Venezuela who continue to suffer. For this reason, I began working on a series titled "Colorless Liberation". While the sociopolitical subject matter of this body of works carries dark and oppressive weight, I introduced a symbol deeply significant to Venezuela: the vibrant parrot known as the Guacamaya. This symbol represents the belief that, even in midst of darkness, glimmers of hope and resilience can still emerge for many Venezuelans.`,
  works: [
    {
      id: 'flying-over-the-helicoide',
      title: 'Flying over the Helicoide',
      // TODO(CILA): year / medium / dimensions
      story:
        'The Helicoide stands as both monument and wound — a brutalist spiral begun as a shopping mall, now a notorious prison. From above, the birds still circle.',
      images: [
        { file: 'flying-over-the-helicoide.webp', panelLabel: 'No. 1', aspect: 1.294 },
        { file: 'flying-over-the-helicoide-2.webp', panelLabel: 'No. 2', aspect: 1.309 }
      ]
    },
    {
      id: 'flying-over-the-jails',
      title: 'Flying over the Jails',
      // TODO(CILA): year / medium / dimensions / story
      images: [{ file: 'flying-over-the-jails.webp', aspect: 1.374 }]
    },
    {
      id: 'spirit-of-liberty',
      title: 'Spirit of Liberty',
      // TODO(CILA): confirm title (file is "spirit-of-liberity"); year / medium / dimensions
      story:
        'The macaw, our national bird, in flight against a sky that is also a sea.',
      images: [{ file: 'spirit-of-liberity.webp', aspect: 0.562 }]
    },
    {
      id: 'happy-birds-sad-city',
      title: 'Happy Birds, Sad City',
      // TODO(CILA): year / medium / dimensions
      story:
        'The birds carry on as they always have. The city below has changed.',
      images: [
        { file: 'happy-birds-sad-city.webp', panelLabel: 'No. 1', aspect: 1.202 },
        { file: 'happy-birds-sad-city-2.webp', panelLabel: 'No. 2', aspect: 1.213 },
        { file: 'happy-birds-sad-city-3.webp', panelLabel: 'No. 3', aspect: 1.105 },
        { file: 'happy-birds-sad-city-ghost.webp', panelLabel: 'Ghost', aspect: 1.170 }
      ]
    },
    {
      id: 'sad-birds-sad-city',
      title: 'Sad Birds, Sad City',
      // TODO(CILA): year / medium / dimensions / story
      images: [{ file: 'sad-birds-sad-city.webp', aspect: 1.164 }]
    },
    {
      id: 'the-guacamaya-thinker',
      title: 'The Guacamaya Thinker',
      // TODO(CILA): year / medium / dimensions / story
      images: [
        { file: 'the-guacamaya-thinker.webp', panelLabel: 'No. 1', aspect: 0.683 },
        { file: 'the-guacamaya-thinker-2.webp', panelLabel: 'No. 2', aspect: 0.534 }
      ]
    },
    {
      id: 'lines-of-hope',
      title: 'Lines of Hope',
      // TODO(CILA): year / medium / dimensions
      story:
        'Sometimes a line is a bird, sometimes a horizon, sometimes a hand reaching.',
      images: [{ file: 'lines-of-hope.webp', aspect: 1.154 }]
    },
    {
      id: 'contemplating',
      title: 'Contemplating',
      // TODO(CILA): year / medium / dimensions / story
      images: [{ file: 'contemplating.webp', aspect: 0.491 }]
    },
    {
      id: 'waiting',
      title: 'Waiting',
      // TODO(CILA): year / medium / dimensions / story
      images: [{ file: 'waiting.webp', aspect: 0.494 }]
    },
    {
      id: 'freedom-night',
      title: 'Freedom Night',
      // TODO(CILA): year / medium / dimensions / story
      images: [{ file: 'freedom-night.webp', aspect: 1.004 }]
    },
    {
      id: 'freedom-question',
      title: 'Freedom?',
      // TODO(CILA): year / medium / dimensions
      story: 'A question, not a statement. The cage is open. The bird does not yet know.',
      images: [
        { file: 'freedom-question.webp', panelLabel: 'No. 1', aspect: 0.748 },
        { file: 'freedom-question-2.webp', panelLabel: 'No. 2', aspect: 0.734 }
      ]
    }
  ]
};
