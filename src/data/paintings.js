// The 19 Van Gogh paintings the goodnight stories are built around.
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

export const PAINTINGS = {
  bedroom: {
    title: 'The Bedroom', year: 1888,
    collection: 'Van Gogh Museum, Amsterdam',
    motif: 'interior',
    palette: ['#9db7a8', '#cba94a', '#8c3b2e', '#3f5f7a', '#dccf96'],
  },
  starry: {
    title: 'The Starry Night', year: 1889,
    collection: 'Museum of Modern Art, New York',
    motif: 'swirl',
    palette: ['#16244f', '#2f4a9c', '#e8c34a', '#0c1229', '#6f86c9'],
  },
  rhone: {
    title: 'Starry Night Over the Rhône', year: 1888,
    collection: "Musée d'Orsay, Paris",
    motif: 'swirl',
    palette: ['#0f1a38', '#1e3468', '#e9b83c', '#294677', '#c9a63a'],
  },
  almond: {
    title: 'Almond Blossom', year: 1890,
    collection: 'Van Gogh Museum, Amsterdam',
    motif: 'blossom',
    palette: ['#5fb2b8', '#7fd0d2', '#f2e8e6', '#d9a7b0', '#3e6f74'],
  },
  greenwheat: {
    title: 'Green Wheat Fields, Auvers', year: 1890,
    collection: 'National Gallery of Art, Washington',
    motif: 'field',
    palette: ['#7fa64a', '#a9c463', '#5f7f39', '#cfd98a', '#7d92b8'],
  },
  harvest: {
    title: 'The Harvest', year: 1888,
    collection: 'Van Gogh Museum, Amsterdam',
    motif: 'field',
    palette: ['#d9b23c', '#e6cf72', '#5f7fa8', '#a07d3a', '#2f4f6f'],
  },
  sunflower: {
    title: 'Sunflowers', year: 1888,
    collection: 'National Gallery, London',
    motif: 'flowers',
    palette: ['#e5b129', '#f0d06a', '#c98b1e', '#8a6a2a', '#e8dcae'],
  },
  irises: {
    title: 'Irises', year: 1889,
    collection: 'J. Paul Getty Museum, Los Angeles',
    motif: 'flowers',
    palette: ['#2f3f7a', '#4a5aa0', '#3f6b3a', '#7f9c4a', '#e8e4d6'],
  },
  boats: {
    title: 'Fishing Boats on the Beach at Saintes-Maries', year: 1888,
    collection: 'Van Gogh Museum, Amsterdam',
    motif: 'sea',
    palette: ['#4a86a8', '#e0d3ae', '#b03a2e', '#2f6f4f', '#dcc98a'],
  },
  mulberry: {
    title: 'The Mulberry Tree', year: 1889,
    collection: 'Norton Simon Museum, Pasadena',
    motif: 'tree',
    palette: ['#e0a02a', '#f0c65a', '#8a6a3a', '#b8bfae', '#6f7f5a'],
  },
  cypress: {
    title: 'Wheat Field with Cypresses', year: 1889,
    collection: 'The Metropolitan Museum of Art, New York',
    motif: 'field',
    palette: ['#2b4a2f', '#d9b84a', '#e6e0cc', '#6f8fb0', '#8fae6a'],
  },
  branch: {
    title: 'Blossoming Almond Branch in a Glass', year: 1888,
    collection: 'Van Gogh Museum, Amsterdam',
    motif: 'blossom',
    palette: ['#d9c9a8', '#f0e6d2', '#c9a0a8', '#7f9c8a', '#5f6f5a'],
  },
  roses: {
    title: 'Roses', year: 1890,
    collection: 'National Gallery of Art, Washington',
    motif: 'flowers',
    palette: ['#e8e4d2', '#f2efe2', '#7f9c6a', '#c9c4a8', '#5f6f4a'],
  },
  lark: {
    title: 'Wheatfield with a Lark', year: 1887,
    collection: 'Van Gogh Museum, Amsterdam',
    motif: 'field',
    palette: ['#d9c04a', '#e6d97a', '#8fa8c4', '#a88f3a', '#cfd9a0'],
  },
  cafe: {
    title: 'Café Terrace at Night', year: 1888,
    collection: 'Kröller-Müller Museum, Otterlo',
    motif: 'nightstreet',
    palette: ['#e8c04a', '#1a3260', '#2f5a8a', '#f0d98a', '#3f3226'],
  },
  snow: {
    title: 'Landscape with Snow', year: 1888,
    collection: 'Guggenheim Museum, New York',
    motif: 'snow',
    palette: ['#e6e6dc', '#c4c4b8', '#8a5a4a', '#7f8f9c', '#5f6f5a'],
  },
  butterfly: {
    title: 'Butterflies and Poppies', year: 1890,
    collection: 'Van Gogh Museum, Amsterdam',
    motif: 'flowers',
    palette: ['#8fa86a', '#c4d1a0', '#b03a3a', '#e8e4d2', '#6f8f5a'],
  },
  irisfield: {
    title: 'Field with Irises near Arles', year: 1888,
    collection: 'Van Gogh Museum, Amsterdam',
    motif: 'field',
    palette: ['#6a5a9c', '#8f7fb8', '#7fa04a', '#d9c04a', '#8fa8c4'],
  },
  sower: {
    title: 'The Sower', year: 1888,
    collection: 'Kröller-Müller Museum, Otterlo',
    motif: 'field',
    palette: ['#e8a02a', '#f0c45a', '#4a3a5a', '#8a6a4a', '#332c3f'],
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
