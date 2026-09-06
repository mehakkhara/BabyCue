// Fifteen original goodnight stories, written for Numae.
//
// The text is ours — no third-party rights, no translation or trademark
// exposure. Each story is three pages, one painting per page, and every one
// ends in sleep.
//
// {name} and friends are substituted at render time by lib/storyText.js.
// Tokens are ONLY ever the baby: animals and objects in these stories use
// fixed "it"/"its" so the replacer never touches them.

export const BANDS = [
  { id: 'A', name: 'Newborn',   min: 0,  max: 8,   age: '0–9 months' },
  { id: 'B', name: 'Looking',   min: 9,  max: 14,  age: '9–15 months' },
  { id: 'C', name: 'Following', min: 15, max: 999, age: '15 months and up' },
]

export const STORIES = [
  // ---------- Band A · 0–9 months · rhythm over plot ----------
  {
    id: 'A1', band: 'A', title: 'Goodnight, Little Star',
    pages: [
      { art: 'rhone', text: [
        'The river is quiet tonight.',
        'The lamps along the water have all turned gold, and each one drops a long gold ribbon down into the dark.',
        'The water rocks them. Slow, and slow, and slow.',
        'Goodnight, gold lights. Goodnight, quiet river.',
      ] },
      { art: 'starry', text: [
        'Up above the sleeping town, the sky is turning.',
        'Round and round go the big blue swirls. Round and round go the little stars, warm and yellow, like small lit windows very far away.',
        'The tall dark tree leans up to watch them.',
        'Goodnight, turning sky. Goodnight, small bright stars.',
      ] },
      { art: 'bedroom', text: [
        'And here, in a small yellow room, there is a bed.',
        'There is a red blanket, and two soft pillows, and a window with the night behind it.',
        'The room is waiting. It has been waiting all day.',
        'Goodnight, little room.',
        'Goodnight, {name}.',
      ] },
    ],
  },
  {
    id: 'A2', band: 'A', title: 'The Blossom Song',
    pages: [
      { art: 'almond', text: [
        'Look up, {name}.',
        'The branches are full of blossom — pink and white and open wide, all across a sky as blue as morning.',
        'The wind comes through and the blossoms move.',
        'They do not fall. They only sway.',
      ] },
      { art: 'branch', text: [
        'Someone brought one small branch inside.',
        'They put it in a glass of water on the table, where it is warm.',
        'Just a few blossoms now. Just enough.',
        'It leans a little — the way you lean when you are getting sleepy.',
      ] },
      { art: 'bedroom', text: [
        'Outside, the tree keeps blossoming in the dark.',
        'Inside, the room is quiet and the blanket is turned down.',
        'The branch on the table is sleeping too.',
        'Goodnight, blossom.',
        'Goodnight, {name}.',
      ] },
    ],
  },
  {
    id: 'A3', band: 'A', title: 'All the Yellow Things',
    pages: [
      { art: 'sunflower', text: [
        'Yellow, yellow, yellow.',
        'Fourteen sunflowers in a fat yellow pot, leaning every which way. Some are wide open. Some have closed up small for the night.',
        'Yellow like butter. Yellow like a bath towel. Yellow like the light in the hall.',
      ] },
      { art: 'harvest', text: [
        'Out in the fields it is yellow too.',
        'Yellow wheat, all the way to the blue hills. A little cart. A little ladder. A little blue wagon standing still.',
        'Everyone has gone home now.',
        'The field is warm, and empty, and gold.',
      ] },
      { art: 'greenwheat', text: [
        'And when the sun goes down, the yellow goes soft.',
        'The green wheat moves like water. The wind walks through it, and lies down.',
        'All the yellow things are closing.',
        'Goodnight, yellow.',
        'Goodnight, {name}.',
      ] },
    ],
  },
  {
    id: 'A4', band: 'A', title: 'The Boats Come In',
    pages: [
      { art: 'boats', text: [
        'The little boats have come back.',
        'Red one, blue one, green one, white — pulled up onto the sand with their sails rolled tight.',
        'They were out all day on the water.',
        'Now they are done.',
      ] },
      { art: 'rhone', text: [
        'The sea goes flat, and dark, and shining.',
        'The lights come on along the shore. One. Then one. Then one.',
        'Everything that was moving is slowing down.',
        'Even the water. Even the wind.',
      ] },
      { art: 'bedroom', text: [
        'Somewhere up the beach there is a small room with a small bed in it.',
        'The shoes are off. The window is open a little.',
        'The boats are sleeping on the sand.',
        'Goodnight, boats.',
        'Goodnight, {name}.',
      ] },
    ],
  },
  {
    id: 'A5', band: 'A', title: 'Soft',
    pages: [
      { art: 'irises', text: [
        'Soft.',
        'A whole crowd of blue irises, standing close together in the dark green.',
        'One white one in the middle, taller than the rest, looking around.',
        'They lean on each other. Nobody minds.',
      ] },
      { art: 'roses', text: [
        'Soft.',
        'White roses in a green glass, opening slowly, the way slow things open.',
        'Some petals have come down onto the table.',
        'Nobody picks them up. They can stay there.',
      ] },
      { art: 'almond', text: [
        'Soft.',
        'Blossoms on the branches, all the way up into the blue.',
        'Everything today was loud, and bright, and new.',
        'Now everything is soft.',
        'Goodnight, {name}.',
      ] },
    ],
  },

  // ---------- Band B · 9–15 months · naming, gentle motion ----------
  {
    id: 'B1', band: 'B', title: 'The Little Yellow Bird Goes Home',
    pages: [
      { art: 'lark', text: [
        'There is a bird in this field.',
        'Can you find it? There — the small one, going up.',
        'All morning the little bird flew over the wheat. Up and down, up and down, singing the whole time.',
        'The wheat went *swish*. The bird went up.',
      ] },
      { art: 'greenwheat', text: [
        'Now it is evening, and the field has gone green and quiet.',
        'The wind lies down flat.',
        'The little bird stops singing and just floats — round, and round, and round — looking for the way home.',
        "Down there. The small dark tree. That's the one.",
      ] },
      { art: 'starry', text: [
        'The bird tucks into the branches.',
        'Above the tree, the whole sky begins to turn: big slow circles of blue, and yellow stars, and one round gold moon like a lamp somebody left on.',
        'The little bird puts its head under its wing.',
        'Goodnight, little bird.',
        'Goodnight, {name}.',
      ] },
    ],
  },
  {
    id: 'B2', band: 'B', title: 'Who Is Still Awake?',
    pages: [
      { art: 'cafe', text: [
        'It is late, {name}, and almost everyone has gone home.',
        'But look — the yellow awning is still lit, and the little round tables are still out, and one or two people are still sitting there, talking quietly.',
        'The waiter in white is carrying something.',
        'The stones of the street have gone blue.',
      ] },
      { art: 'rhone', text: [
        'Down at the river, two people are walking.',
        'Slow steps. No hurry.',
        'The lamps lay long gold ribbons on the water, and the water rocks them back and forth.',
        'Above them the stars are out — big ones, wobbly ones, all of them awake.',
      ] },
      { art: 'bedroom', text: [
        'Who is still awake?',
        'Not the chairs. Not the table. Not the two blue doors.',
        'Not the little towel on its hook. Not the shoes under the bed. Not the pictures on the wall.',
        'Everyone here is asleep, {name}.',
        'The stars will keep watch. You can close your eyes.',
      ] },
    ],
  },
  {
    id: 'B3', band: 'B', title: 'The Day It Snowed', season: 'winter',
    pages: [
      { art: 'snow', text: [
        'Look what happened while we were sleeping.',
        'The whole field went white.',
        'There are little dark lines where the ground pokes through, and a low red roof, and one person walking with a dog, making small holes in the snow with their feet.',
        'It goes very quiet when it snows. Have you noticed that?',
      ] },
      { art: 'mulberry', text: [
        "The big tree on the rocks doesn't mind the cold.",
        'Its leaves have gone bright — orange and gold and yellow — and they shake all together in the wind, like hundreds of small hands waving.',
        'Wave back, {name}.',
        'Now the wind is stopping.',
      ] },
      { art: 'bedroom', text: [
        'Inside, somebody has taken off their coat.',
        'The room is warm. The blanket is red. There is a little frost in the corner of the window.',
        'Out in the field the snow keeps coming down, slow and slow, covering everything up soft.',
        'Goodnight, snow.',
        'Goodnight, {name}.',
      ] },
    ],
  },
  {
    id: 'B4', band: 'B', title: 'Butterflies',
    pages: [
      { art: 'butterfly', text: [
        'Two white butterflies over the grass.',
        "Up, down, sideways, up. They don't fly straight, butterflies. They fly like a leaf falling upward.",
        'Underneath them the red poppies stand very still and let them pass.',
        'Watch. Watch.',
        'There they go.',
      ] },
      { art: 'irisfield', text: [
        'Now the butterflies come to the iris field.',
        'Purple and white and green, all the way to the little town — and the yellow field behind that, and the blue sky behind that.',
        'The butterflies land.',
        'They fold their wings up, like two hands closing.',
      ] },
      { art: 'almond', text: [
        'When it gets dark, a butterfly finds a branch and holds on tight.',
        "Up in the blossom, where it's pink and white and quiet, it stays all night without moving.",
        "That's how butterflies sleep, {name}.",
        'Hold on tight. Stay still.',
        'Here comes the night.',
      ] },
    ],
  },
  {
    id: 'B5', band: 'B', title: 'The Tall Tree and the Tall Sky',
    pages: [
      { art: 'mulberry', text: [
        'This tree is old.',
        "It has stood on these white rocks a long, long time, and every autumn it lights up gold all over, like it's having a party.",
        'The wind pushes it. It leans, and comes back. Leans, and comes back.',
        'Trees are good at that.',
      ] },
      { art: 'cypress', text: [
        'Over the wheat, the clouds are enormous — great white ones, rolling and piling up over the blue hills.',
        'And there, on the right, the dark green tree stands up like a candle flame.',
        'Everything else moves.',
        'That one holds still.',
      ] },
      { art: 'starry', text: [
        'And at night the tall dark tree is still standing, right up in front of all those stars.',
        'The sky rolls past it. The gold moon comes up at the edge.',
        "The tree doesn't need to go anywhere. It's already home.",
        'So are you, {name}.',
        'Goodnight.',
      ] },
    ],
  },

  // ---------- Band C · 15–24 months · a small journey ----------
  {
    id: 'C1', band: 'C', title: 'The Little Bird Who Wanted to See the Sea',
    pages: [
      { art: 'greenwheat', text: [
        'The little yellow bird had lived in the green field its whole life.',
        'It was a good field. The wheat moved like water when the wind came through, and there were seeds, and there was a low stone wall to sit on.',
        'But one morning the bird heard something far away. A sound like wind, only slower.',
        '*Hush… hush… hush…*',
        '“What’s that?” said the little bird.',
        '“That’s the sea,” said the wheat.',
        'So the little bird went to see it.',
      ] },
      { art: 'boats', text: [
        'It flew a long way.',
        'Over the hills, over a road, over a town with a bell — and then the ground turned into sand, and the sand turned into water, and the water went all the way out to the end of the sky.',
        'Four little boats were pulled up on the beach. Red, and blue, and green, with their sails rolled and their masts crossed like fingers.',
        '*Hush,* said the sea. *Hush. Hush.*',
        'The little bird sat on the red boat and watched the water come in and go out, come in and go out, all afternoon — until its eyes went heavy.',
      ] },
      { art: 'rhone', text: [
        'When the little bird woke up, the sky had gone dark blue and the lamps had come on along the shore.',
        'Each lamp put a long gold ribbon down into the water, and the water rocked them, slow and slow.',
        'The little bird thought about the green field, far away, with the low stone wall.',
        'It could go home tomorrow.',
        'Tonight it would stay right here, on the warm red boat, under all those stars.',
        '*Hush,* said the sea. *Hush. Hush.*',
        'Goodnight, little bird.',
        'Goodnight, {name}.',
      ] },
    ],
  },
  {
    id: 'C2', band: 'C', title: 'The Last Sunflower',
    pages: [
      { art: 'sunflower', text: [
        'There were fourteen sunflowers in the yellow pot on the table.',
        'By evening, thirteen of them had begun to close. They folded their petals in, one by one — the way you fold a blanket — and let their heads go heavy.',
        'But the one at the top stayed wide open.',
        '“Aren’t you tired?” asked the others.',
        '“Not yet,” said the last sunflower. “I want to see what happens.”',
      ] },
      { art: 'harvest', text: [
        'Out the window, the last sunflower watched the whole day finish.',
        'It watched the wheat go gold. It watched the little blue cart stand still, and the ladder lean against the haystack with nobody on it. It watched a man walk home along the edge of the field with his hands in his pockets. It watched the blue hills go soft at the edges.',
        'It watched all the way until there was nothing left to watch.',
        '“Oh,” said the last sunflower. “*That’s* what happens.”',
      ] },
      { art: 'bedroom', text: [
        'In the little yellow room, the day was finished too.',
        'The chairs had stopped. The shoes were under the bed. The window was open a crack, and the night came in cool and quiet and sat down on the red blanket.',
        'The last sunflower folded its petals in.',
        'It had seen the whole day, right to the end.',
        'Now it could sleep.',
        'Goodnight, sunflowers.',
        'Goodnight, {name}.',
      ] },
    ],
  },
  {
    id: 'C3', band: 'C', title: 'The Long Way Home',
    pages: [
      { art: 'harvest', text: [
        'It had been a very big day.',
        'All morning the carts had gone back and forth across the gold field, and the ladders had gone up and down, and everybody had worked in the sun until their hats went crooked.',
        'Now it was finished. The wheat was stacked. The blue wagon stood still with nobody in it.',
        'And it was time to go home — but home was all the way across the field, past the hills.',
        '“That’s very far,” said {name}.',
        '“It is,” said the field. “Take the long way. The long way is nicer.”',
      ] },
      { art: 'cypress', text: [
        'So they took the long way.',
        'Past the wheat, which had gone the color of honey. Past the olive trees, which shook a bit. Past the tall dark cypress, standing up like a candle.',
        'And overhead — oh, the clouds. Enormous white ones, rolling and piling and turning over each other, all the way across the blue.',
        '“Where are the clouds going?” said {name}.',
        '“The same place you are,” said the field. “Home. Everything goes home at the end.”',
      ] },
      { art: 'bedroom', text: [
        'And there it was.',
        'A small yellow room, with a bed and a red blanket, and two pillows shaped like two small hills. A jug and a bowl on the table. A towel on a hook. Two blue doors, both closed.',
        'Shoes off. Window open a crack.',
        'Outside, the wheat kept standing in the dark, and the clouds kept rolling, and the tall dark tree stayed exactly where it was.',
        'You took the long way, {name}.',
        'And you got here.',
        'Goodnight.',
      ] },
    ],
  },
  {
    id: 'C4', band: 'C', title: 'Somebody Planted This',
    pages: [
      { art: 'sower', text: [
        'Very early, when the sky was still orange, a man walked across an empty field.',
        'He had a bag over his shoulder, and as he walked he swung his arm out — *shhk* — and the seeds went flying into the dirt.',
        'There was nothing to see. Just brown ground, and a big yellow sun coming up behind him, and one dark tree leaning sideways.',
        '“Where did they go?” said {name}.',
        '“Under,” said the man. “Now we wait.”',
      ] },
      { art: 'greenwheat', text: [
        'Waiting takes a long time. Longer than a nap. Longer than a whole day.',
        'But if you wait long enough —',
        'The whole field came up green.',
        'Green wheat everywhere, moving like water, all the way to the little houses at the edge. The wind walked through it and pushed it flat, and it stood back up. Down, and up. Down, and up.',
        '“It was under there the whole time?” said {name}.',
        '“The whole time,” said the wheat.',
      ] },
      { art: 'bedroom', text: [
        'That night the little yellow room was very quiet.',
        'The blanket was turned down. The window was open a crack.',
        'Outside, the green field went on doing its slow work in the dark — the way it does every single night, without anybody watching.',
        "Things grow while you're sleeping, {name}.",
        "That's how it works.",
        'Goodnight.',
      ] },
    ],
  },
  {
    id: 'C5', band: 'C', title: 'The Night the Sky Went Round',
    pages: [
      { art: 'almond', text: [
        'Some nights the sky is just the sky.',
        'But some nights — if you are lucky, and still awake — the sky does something else.',
        'It started with the almond tree. All day it had held its blossoms up, pink and white against the blue, perfectly still, the way trees do.',
        'Then the wind came, and every blossom moved at once.',
        '“Something’s happening,” said {name}.',
      ] },
      { art: 'irises', text: [
        'Down in the garden, the irises had noticed too.',
        'A whole crowd of them, blue and leaning, packed in close with their green leaves crossing over each other — and right in the middle, the one white iris, standing taller, looking up.',
        '“What is it?” said the irises.',
        '“Wait,” said the white one. “Watch the sky.”',
      ] },
      { art: 'starry', text: [
        'And then the sky went round.',
        'Great slow blue curls of it, turning and turning over the sleeping town. Yellow stars, each one with a soft ring of light around it, like a candle seen through a window. A gold moon coming up at the edge.',
        'And the tall dark tree standing in front of it all, leaning up, watching the whole thing happen.',
        'Nobody in the town saw it. They were all asleep.',
        'But you saw it, {name}.',
        'Now close your eyes.',
        'The sky will keep turning while you sleep.',
        'Goodnight.',
      ] },
    ],
  },
]

export function bandForAge(ageInMonths) {
  const m = Number.isFinite(ageInMonths) ? ageInMonths : 0
  return BANDS.find(b => m >= b.min && m <= b.max) || BANDS[BANDS.length - 1]
}

export function storiesForAge(ageInMonths) {
  const band = bandForAge(ageInMonths)
  return STORIES.filter(s => s.band === band.id)
}

export function getStory(id) {
  return STORIES.find(s => s.id === id) || null
}

// Small stable hash so "tonight's story" is the same all evening but moves on
// tomorrow, and two babies of the same age don't get the same one.
function hash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0
  return h
}

// Picks tonight's story for this baby. Prefers one they haven't heard yet;
// once the whole band has been read, it cycles rather than repeating the most
// recent — a toddler asking for the same story is served by the shelf, not by
// this.
export function pickTonight(ageInMonths, { seed = '', readIds = [] } = {}) {
  const pool = storiesForAge(ageInMonths)
  if (!pool.length) return null

  const unread = pool.filter(s => !readIds.includes(s.id))
  const candidates = unread.length ? unread : pool
  return candidates[hash(seed) % candidates.length]
}
