// Art for the goodnight stories: original illustrations for the discovery
// shelf, and the six Van Gogh paintings the museum shelf is built around.
//
// All public domain — Vincent van Gogh died in 1890, so the works are free of
// copyright worldwide. We still credit each one on the page, museum-label
// style, which means `collection` is user-visible: verify it against the file
// you actually ship. Several of these exist in more than one version (The
// Bedroom has three, in Amsterdam, Chicago and Paris).
//
// `palette` and `motif` drive the placeholder art in lib/paintingCanvas.js.
// When the real image files land in public/art/, add a `file` field here and
// PaintingCanvas will render the image instead — nothing else has to change.

// Story art lives in public/story-art/. The prefix follows Vite's `base`, so
// the paths keep working when the site moves from /BabyCue/ to its own domain.
const ART_BASE = `${import.meta.env.BASE_URL}story-art/`

export const PAINTINGS = {
  // Original app illustrations. These remain separate from the public-domain
  // museum works below so their provenance stays clear in the reader.
  robinMeadow: {
    title: 'Robin in the Meadow', year: 2026,
    collection: 'BabyCue original illustration', motif: 'animal',
    file: `${ART_BASE}robin-in-the-meadow.jpg`,
    palette: ['#f6c457', '#9cc7ea', '#7e9c50', '#df7c34', '#fff9e8'],
  },
  otterStream: {
    title: 'Otter and the Pebble', year: 2026,
    collection: 'BabyCue original illustration', motif: 'animal',
    file: `${ART_BASE}otter-and-the-pebble.jpg`,
    palette: ['#9ed6d4', '#708b4b', '#8a603e', '#f5eac9', '#d4b15b'],
  },
  rabbitBurrow: {
    title: 'Rabbit by the Burrow', year: 2026,
    collection: 'BabyCue original illustration', motif: 'animal',
    file: `${ART_BASE}rabbit-by-the-burrow.jpg`,
    palette: ['#dfb45e', '#8fa367', '#9b673e', '#fff0c7', '#e9b7a6'],
  },
  // Discovery shelf illustrations. Each `file` is the name the image should
  // be saved under in public/story-art/. Until the file exists, the reader
  // falls back to the soft placeholder drawn from `palette`.
  // Brief: a farmyard at sunrise, one brown-and-white cow standing in green grass, a small yellow duck waddling past. Soft, warm, simple shapes.
  farmMorning: {
    title: 'Morning on the Farm', year: 2026,
    collection: 'BabyCue original illustration', motif: 'animal',
    file: `${ART_BASE}morning-on-the-farm.jpg`,
    palette: ['#f3d27a', '#8fb36a', '#a7714a', '#fff6dc', '#7fb7e6'],
  },
  // Brief: a warm bath with white bubbles and one yellow rubber duck floating, seen from the side. A soft towel folded nearby. Pastel bathroom tones.
  bathDuck: {
    title: 'Bath Time Duck', year: 2026,
    collection: 'BabyCue original illustration', motif: 'animal',
    file: `${ART_BASE}bath-time-duck.jpg`,
    palette: ['#bfe3f2', '#ffffff', '#f6cf4d', '#f3e2cf', '#8fc6e8'],
  },
  // Brief: a dark-blue night sky over a small cottage with one lit window, a round white moon half-hidden behind a soft grey cloud. Calm and quiet.
  moonCloud: {
    title: 'The Moon and the Cloud', year: 2026,
    collection: 'BabyCue original illustration', motif: 'swirl',
    file: `${ART_BASE}the-moon-and-the-cloud.jpg`,
    palette: ['#1d2a5a', '#f4f0dc', '#8f97b3', '#f6d36b', '#31407a'],
  },
  // Brief: a still blue pond with a mama duck and exactly three yellow ducklings in a line behind her, a green frog on a lily pad watching. Reeds at the edge.
  pondDucks: {
    title: 'Three Little Ducks', year: 2026,
    collection: 'BabyCue original illustration', motif: 'animal',
    file: `${ART_BASE}three-little-ducks.jpg`,
    palette: ['#7fb9d8', '#f6d24d', '#8aa85a', '#e8d9a6', '#5a8f4e'],
  },
  // Brief: a big brown bear and a tiny grey mouse sitting side by side under a tall tree at dusk, sharing one patchwork blanket. Gentle, friendly faces.
  bearMouse: {
    title: 'Big Bear, Little Mouse', year: 2026,
    collection: 'BabyCue original illustration', motif: 'animal',
    file: `${ART_BASE}big-bear-little-mouse.jpg`,
    palette: ['#8b5e3c', '#b8b3c4', '#6a8f5a', '#e9c29b', '#3b4a6b'],
  },
  // Brief: one apple tree with clearly red apples on a green hill, a big round yellow sun, and a plain blue sky. Four bold colours, nothing else.
  appleTree: {
    title: 'The Apple Tree', year: 2026,
    collection: 'BabyCue original illustration', motif: 'tree',
    file: `${ART_BASE}the-apple-tree.jpg`,
    palette: ['#d9412f', '#f7d23e', '#79b356', '#7cc3ec', '#8a5a33'],
  },
  // Brief: a clay pot on a sunny windowsill with a tiny green sprout just up, a small watering can beside it, morning light through the window.
  windowsillSprout: {
    title: 'The Little Seed', year: 2026,
    collection: 'BabyCue original illustration', motif: 'flowers',
    file: `${ART_BASE}the-little-seed.jpg`,
    palette: ['#f6e6b8', '#7fb06a', '#c47a4a', '#a9d8ef', '#5a3d2b'],
  },
  // Brief: a cosy child's bedroom at night: a small bed with a quilt, a glowing lamp, a teddy bear, pyjamas folded on a chair, a toothbrush in a cup. Warm lamplight.
  cosyBedroom: {
    title: 'Night-Night Room', year: 2026,
    collection: 'BabyCue original illustration', motif: 'interior',
    file: `${ART_BASE}night-night-room.jpg`,
    palette: ['#f2c98a', '#6b5a8e', '#e07a5f', '#f7efe1', '#3d3560'],
  },
  // Brief: a green frog on the first of five lily pads in a row across a pond, a dragonfly overhead, a soft green bank on the far side. Moonlit.
  frogLilypads: {
    title: 'Freddie Frog Counts to Five', year: 2026,
    collection: 'BabyCue original illustration', motif: 'animal',
    file: `${ART_BASE}freddie-frog-counts-to-five.jpg`,
    palette: ['#69b04a', '#3e7fb0', '#c9e39a', '#f4e7a8', '#2f5f8a'],
  },

  // ---------- Museum shelf (public domain) ----------
  bedroom: {
    title: 'The Bedroom', year: 1888,
    collection: 'Van Gogh Museum, Amsterdam',
    motif: 'interior',
    // Source: Wikimedia Commons, "Vincent van Gogh - De slaapkamer - Google Art Project.jpg" (public domain), resized to 1400 px.
    file: `${ART_BASE}the-bedroom.jpg`,
    credit: 'Public domain · Wikimedia Commons',
    palette: ['#9db7a8', '#cba94a', '#8c3b2e', '#3f5f7a', '#dccf96'],
  },
  starry: {
    title: 'The Starry Night', year: 1889,
    collection: 'Museum of Modern Art, New York',
    motif: 'swirl',
    // Source: Wikimedia Commons, "Van Gogh - Starry Night - Google Art Project.jpg" (public domain), resized to 1400 px.
    file: `${ART_BASE}the-starry-night.jpg`,
    credit: 'Public domain · Wikimedia Commons',
    palette: ['#16244f', '#2f4a9c', '#e8c34a', '#0c1229', '#6f86c9'],
  },
  rhone: {
    title: 'Starry Night Over the Rhône', year: 1888,
    collection: "Musée d'Orsay, Paris",
    motif: 'swirl',
    // Source: Wikimedia Commons, "Starry Night Over the Rhone.jpg" (public domain), resized to 1400 px.
    file: `${ART_BASE}starry-night-over-the-rhone.jpg`,
    credit: 'Public domain · Wikimedia Commons',
    palette: ['#0f1a38', '#1e3468', '#e9b83c', '#294677', '#c9a63a'],
  },
  harvest: {
    title: 'The Harvest', year: 1888,
    collection: 'Van Gogh Museum, Amsterdam',
    motif: 'field',
    // Source: Wikimedia Commons, "Vincent van Gogh - De oogst - Google Art Project.jpg" (public domain), resized to 1400 px.
    file: `${ART_BASE}the-harvest.jpg`,
    credit: 'Public domain · Wikimedia Commons',
    palette: ['#d9b23c', '#e6cf72', '#5f7fa8', '#a07d3a', '#2f4f6f'],
  },
  cypress: {
    title: 'Wheat Field with Cypresses', year: 1889,
    collection: 'The Metropolitan Museum of Art, New York',
    motif: 'field',
    // Source: Wikimedia Commons, "Wheat-Field-with-Cypresses-(1889)-Vincent-van-Gogh-Met.jpg" (public domain), resized to 1400 px.
    file: `${ART_BASE}wheat-field-with-cypresses.jpg`,
    credit: 'Public domain · Wikimedia Commons',
    palette: ['#2b4a2f', '#d9b84a', '#e6e0cc', '#6f8fb0', '#8fae6a'],
  },
  cafe: {
    title: 'Café Terrace at Night', year: 1888,
    collection: 'Kröller-Müller Museum, Otterlo',
    motif: 'nightstreet',
    // Source: Wikimedia Commons, "Vincent Willem van Gogh - Cafe Terrace at Night (Yorck).jpg" (public domain), resized to 1400 px.
    file: `${ART_BASE}cafe-terrace-at-night.jpg`,
    credit: 'Public domain · Wikimedia Commons',
    palette: ['#e8c04a', '#1a3260', '#2f5a8a', '#f0d98a', '#3f3226'],
  },
}

export function getPainting(id) {
  return PAINTINGS[id] || null
}

// "Almond Blossom, 1890 · Van Gogh Museum, Amsterdam"
export function paintingCredit(id) {
  const p = PAINTINGS[id]
  if (!p) return ''
  return `${p.title}, ${p.year} · ${p.collection}`
}
