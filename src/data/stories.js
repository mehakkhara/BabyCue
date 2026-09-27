// Goodnight stories, written for the app.
//
// Two shelves:
//   discovery — original illustrated stories in the robin/otter/rabbit style.
//               Simple words, one thing to learn, a "try this" prompt.
//   museum    — a few stories built around real Van Gogh paintings, one per
//               age band. They only make sense once the painting files are in
//               public/story-art/ (see data/paintings.js).
//
// Every story is three pages and ends in sleep. Tokens ({name}, {parent},
// {bed}, pronouns) are substituted at render time by lib/storyText.js and
// ONLY ever refer to the baby or the parent; animals use fixed "it"/"its".

export const BANDS = [
  { id: 'A', name: 'Newborn',   min: 0,  max: 8,   age: '0–9 months' },
  { id: 'B', name: 'Looking',   min: 9,  max: 14,  age: '9–15 months' },
  { id: 'C', name: 'Following', min: 15, max: 999, age: '15 months and up' },
]

export const STORIES = [
  // ---------- Animal discovery (original illustrations) ----------
  {
    id: 'A6', series: 'discovery', band: 'A', title: 'Robin Says Hello',
    pages: [
      { art: 'robinMeadow', text: ['Hello, little robin.', 'The robin sits on a branch. It has feathers. Its chest is orange.', 'Can you see the bird?'] },
      { art: 'robinMeadow', text: ['The robin looks this way. Then that way.', 'Its small feet hold tight to the branch.', 'Bird. Feet. Branch.'] },
      { art: 'robinMeadow', text: ['The robin gives a tiny chirp, then flutters its wings.', 'Bye-bye, robin.', 'Can you wave hello and bye-bye?'] },
    ],
  },
  {
    id: 'B6', series: 'discovery', band: 'B', title: 'Ollie Otter and the Smooth Pebble',
    pages: [
      { art: 'otterStream', text: ['Ollie the otter floats in a stream.', 'Look — Ollie is holding a smooth pebble with two little paws.', 'Can you point to Ollie’s paws?'] },
      { art: 'otterStream', text: ['Otters can swim. Ollie’s feet help it paddle through the water.', 'Paddle, paddle. The water makes small circles.', 'Can you make a swimming motion with your hands?'] },
      { art: 'otterStream', text: ['Ollie puts the pebble down and swims toward the reeds.', 'Splash, splash — off Ollie goes.', 'Can you wave goodbye to the little swimmer?'] },
    ],
  },
  {
    id: 'C6', series: 'discovery', band: 'C', title: 'Rory Rabbit Listens',
    pages: [
      { art: 'rabbitBurrow', text: ['Rory Rabbit sits outside a burrow in the meadow.', 'A burrow is a tunnel under the ground. It is a safe place for a rabbit to rest.', 'Can you find the dark burrow behind Rory?'] },
      { art: 'rabbitBurrow', text: ['Rory’s long ears stand tall. They help Rory hear small sounds: a leaf rustling, a bee buzzing, the grass moving in the breeze.', 'Hold your hands beside your ears. What can you hear?'] },
      { art: 'rabbitBurrow', text: ['Rory twitches its ears, then hops into the burrow for a rest.', 'The meadow is still there to explore another day.', 'What sound would you like to listen for next?'] },
    ],
  },

  // ---------- Discovery stories · Band A · 0–9 months ----------
  // Rhythm, repetition, sounds, and one simple idea per story.
  {
    id: 'A7', series: 'discovery', band: 'A', title: 'Moo, Says the Cow',
    pages: [
      { art: 'farmMorning', text: ['Good morning, cow.', 'The cow stands in the green grass. It is big, and brown, and white.', '*Moo*, says the cow.', 'Can you say moo?'] },
      { art: 'farmMorning', text: ['Here comes a duck. Waddle, waddle.', 'It is small and yellow.', '*Quack*, says the duck.', 'Can you say quack?'] },
      { art: 'farmMorning', text: ['The cow lies down. The duck tucks in its head.', 'The sun goes low. The farm goes quiet.', 'Moo. Quack. Shh.', 'Goodnight, cow. Goodnight, duck.', 'Goodnight, {name}.'] },
    ],
  },
  {
    id: 'A8', series: 'discovery', band: 'A', title: 'Splish, Splash, Bath',
    pages: [
      { art: 'bathDuck', text: ['Splish, splash! It is bath time.', 'The water is warm. The bubbles are white and soft.', 'A little yellow duck floats by. Bob, bob, bob.'] },
      { art: 'bathDuck', text: ['Wash two hands. *Splash!*', 'Wash two feet. *Splash!*', 'Wash one round tummy. *Splish!*', "Where are {name's} hands? Where are {name's} feet?"] },
      { art: 'bathDuck', text: ['Out of the bath. Into a big soft towel.', 'Warm and dry. Warm and dry.', 'The little duck rests by the tub.', 'Goodnight, duck. Goodnight, bubbles.', 'Goodnight, {name}.'] },
    ],
  },
  {
    id: 'A9', series: 'discovery', band: 'A', title: 'Where Is the Moon?',
    pages: [
      { art: 'moonCloud', text: ['It is night. The sky is dark blue.', 'Where is the moon?', 'There! Round and white, up high.', 'Hello, moon.'] },
      { art: 'moonCloud', text: ['A soft grey cloud floats by.', 'Slowly, slowly, it covers the moon.', 'Where did the moon go?', 'Wait… wait…', '*Peekaboo!* There it is again.'] },
      { art: 'moonCloud', text: ['The moon shines on the little house.', 'It shines on the window. It shines on {bed}.', 'The moon stays up all night, so you can sleep.', 'Goodnight, moon.', 'Goodnight, {name}.'] },
    ],
  },

  // ---------- Discovery stories · Band B · 9–15 months ----------
  // Naming, pointing, first words, colours, and counting to three.
  {
    id: 'B7', series: 'discovery', band: 'B', title: 'Three Little Ducks',
    pages: [
      { art: 'pondDucks', text: ['A pond. Still and blue.', 'Mama Duck swims across, and behind her come her ducklings.', "Let's count them.", '*One* little duck. *Two* little ducks. *Three* little ducks.', 'Can you point to each one?'] },
      { art: 'pondDucks', text: ['Mama Duck says *quack*.', 'One little duck says *peep*. Two little ducks say *peep, peep*. Three little ducks say *peep, peep, peep*.', 'A big frog on a lily pad watches them go by.'] },
      { art: 'pondDucks', text: ['The sun sinks low and the pond turns gold.', 'One, two, three little ducks paddle home to the reeds.', 'They tuck their heads under their wings.', 'Goodnight, one. Goodnight, two. Goodnight, three.', 'Goodnight, {name}.'] },
    ],
  },
  {
    id: 'B8', series: 'discovery', band: 'B', title: 'Big Bear, Little Mouse',
    pages: [
      { art: 'bearMouse', text: ['Under the tall tree lives a bear.', 'The bear is *big*. Big paws. Big nose. Big, slow steps.', 'Can you show me big? Stretch your arms up high!'] },
      { art: 'bearMouse', text: ['In the grass lives a mouse.', 'The mouse is *little*. Little paws. Little nose. Little, quick steps.', 'Can you show me little? Curl up small, like a ball.'] },
      { art: 'bearMouse', text: ['Night comes. The bear yawns a big yawn.', 'The mouse yawns a little yawn.', 'They share one blanket, big and little, side by side.', 'Goodnight, big bear. Goodnight, little mouse.', 'Goodnight, {name}.'] },
    ],
  },
  {
    id: 'B9', series: 'discovery', band: 'B', title: 'Red Apple, Yellow Sun',
    pages: [
      { art: 'appleTree', text: ['On the hill stands an apple tree.', 'The apples are *red*. Red, red, red.', 'Can you find something red?'] },
      { art: 'appleTree', text: ['Above the tree, the sun is *yellow*. Warm and round.', 'Around the tree, the grass is *green*. Soft and cool.', 'Over everything, the sky is *blue*.', 'Red apple. Yellow sun. Green grass. Blue sky.'] },
      { art: 'appleTree', text: ['The yellow sun slides down behind the hill.', 'The blue sky turns dark. The red apples rest in the leaves.', 'All the colours go to sleep.', 'Goodnight, colours.', 'Goodnight, {name}.'] },
    ],
  },

  // ---------- Discovery stories · Band C · 15 months and up ----------
  // A simple plot, a feeling, a sequence, and counting to five.
  {
    id: 'C7', series: 'discovery', band: 'C', title: 'The Little Seed',
    pages: [
      { art: 'windowsillSprout', text: ['{name} found a seed. It was small, and brown, and very quiet.', '"What do you do?" asked {name}.', "The seed said nothing. Seeds don't talk. They wait.", 'So {name} put the seed in a pot of soft dark soil, on the windowsill where the sun comes in.'] },
      { art: 'windowsillSprout', text: ['Every morning, {name} gave the seed a little water. Not too much. Just enough.', 'Every morning, the sun came through the window and warmed the pot.', 'One day. Two days. Three days. Nothing.', '"Waiting is hard," said {name}.', '"I know," said {parent}. "But the seed is working, down where we can\'t see."'] },
      { art: 'windowsillSprout', text: ['And then one morning, there it was.', 'A tiny green sprout, standing up in the pot, stretching toward the light.', '"You grew!" said {name}.', 'The sprout would grow taller tomorrow, and taller the day after that. But that was for tomorrow.', 'Tonight, the little plant rested in the dark, and so did {name}.', 'Goodnight, little seed.', 'Goodnight, {name}.'] },
    ],
  },
  {
    id: 'C8', series: 'discovery', band: 'C', title: 'Night-Night, Everyone',
    pages: [
      { art: 'cosyBedroom', text: ['The day is done. It is time for night-night.', 'First, the bath. Splash, splash, all clean.', 'Then, pyjamas. One arm, two arms. One leg, two legs.', 'Then, teeth. Brush, brush, brush.', 'What comes next, {name}?'] },
      { art: 'cosyBedroom', text: ['Next comes a book. This book!', '{parent} turns the pages. One, two, three.', 'The lamp is on. The room is warm. Teddy is listening too.', 'Night-night, bath. Night-night, pyjamas. Night-night, toothbrush.'] },
      { art: 'cosyBedroom', text: ['Last of all, into {bed}.', 'Night-night, teddy. Night-night, lamp. *Click.*', 'Night-night, {parent}. And {parent} says: night-night, {name}.', 'The same steps tomorrow. And the same steps the night after that.', 'Goodnight, {name}.'] },
    ],
  },
  {
    id: 'C9', series: 'discovery', band: 'C', title: 'Freddie Frog Counts to Five',
    pages: [
      { art: 'frogLilypads', text: ['Freddie Frog sits on a lily pad in the pond.', 'Across the water there are more lily pads, all in a row.', 'Freddie wants to get to the other side.', '"I\'ll count my hops," says Freddie.'] },
      { art: 'frogLilypads', text: ['*One!* Hop. A splash of water.', '*Two!* Hop. A dragonfly zips by.', '*Three!* Hop. Wobble, wobble, steady.', '*Four!* Hop. Nearly there.', '*Five!* Hop. Freddie lands on the soft green bank.', 'Can you count with Freddie? One, two, three, four, five.'] },
      { art: 'frogLilypads', text: ['Freddie is tired from all that hopping.', 'The pond is still. The lily pads float in the moonlight: one, two, three, four, five.', 'Freddie closes its eyes on the soft green bank.', 'Goodnight, Freddie.', 'Goodnight, {name}.'] },
    ],
  },

  // ---------- From the museum (Van Gogh, one per band) ----------
  {
    id: 'A1', series: 'museum', band: 'A', title: 'Goodnight, Little Star',
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
    id: 'B2', series: 'museum', band: 'B', title: 'Who Is Still Awake?',
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
    id: 'C3', series: 'museum', band: 'C', title: 'The Long Way Home',
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

// Shelf extras, kept apart from the prose: a one-line blurb for the Tonight
// card and a "try this while reading" prompt for the reader — a small,
// concrete thing to do with the baby, not advice. Reading time comes from
// the word count at a read-aloud pace.
export const STORY_EXTRAS = {
  // Animal discovery
  A6: { blurb: 'Meet a robin, its feathers, and its bright orange chest.', prompt: 'Point to the robin and say “bird.” Pause so {name} can look.', learn: 'A robin is a bird. Birds have feathers and feet.' },
  B6: { blurb: 'An otter floats, paddles, and holds a smooth pebble.', prompt: 'Show a gentle swimming motion with your hands and invite {name} to copy.', learn: 'Otters swim. Their feet help them paddle in water.' },
  C6: { blurb: 'A rabbit’s ears listen for the sounds of the meadow.', prompt: 'Cup your hands behind your ears and take turns listening for a sound.', learn: 'A burrow is a tunnel under the ground. Rabbits use their ears to hear.' },
  // Discovery · A
  A7: { blurb: 'A cow, a duck, and the sounds they make.', prompt: 'Say each animal sound slowly and watch {name}’s face.', learn: 'Cows say moo. Ducks say quack.' },
  A8: { blurb: 'Warm water, white bubbles, and one yellow duck.', prompt: 'Touch {name}’s hands, then feet, then tummy as you read each line.', learn: 'We have two hands, two feet, and one tummy.' },
  A9: { blurb: 'The moon plays peekaboo behind a cloud.', prompt: 'Cover your face on “where did the moon go?” and peek out on “peekaboo”.', learn: 'The moon comes out at night. When a cloud hides it, it is still there.' },
  // Discovery · B
  B7: { blurb: 'One, two, three ducklings follow Mama across the pond.', prompt: 'Hold up one finger, then two, then three as you count the ducklings.', learn: 'We can count: one, two, three. Ducklings follow their mama.' },
  B8: { blurb: 'A big bear, a little mouse, and one shared blanket.', prompt: 'Stretch tall for “big” and curl up small for “little”. Let {name} copy you.', learn: 'Big and little are opposites. A bear is big. A mouse is little.' },
  B9: { blurb: 'Red, yellow, green, and blue, all on one hill.', prompt: 'Point to each colour on the page, then find the same colour in the room.', learn: 'Apples can be red. The sun is yellow. Grass is green. The sky is blue.' },
  // Discovery · C
  C7: { blurb: 'A seed, some water, some sun, and a little patience.', prompt: 'Ask {name} what a seed needs to grow. Water, sun, and time are all good answers.', learn: 'Seeds need soil, water, sun, and time to grow into plants.' },
  C8: { blurb: 'Bath, pyjamas, teeth, a book, and bed. In that order.', prompt: 'Ask “what comes next?” before each step and let {name} answer or point.', learn: 'Bedtime has steps that go in order: bath, pyjamas, teeth, a book, then bed.' },
  C9: { blurb: 'Five lily pads, five hops, and one tired frog.', prompt: 'Count on your fingers as Freddie hops, then bounce {name} on your knee five times.', learn: 'We can count to five: one, two, three, four, five. Frogs hop.' },
  // Museum
  A1: { blurb: 'A river, a star, and the quiet of night.', prompt: 'Whisper “goodnight” to the star and let {name} hear the hush.' },
  B2: { blurb: 'Late at night, who is still awake in the café?', prompt: 'Ask “who is awake?” and wait. Then whisper “you are”.' },
  C3: { blurb: 'A very big day, and the long way home.', prompt: 'Ask {name} what was big about today. Any answer counts.' },
}

export function storyExtras(id) {
  return STORY_EXTRAS[id] || { blurb: '', prompt: '', learn: '' }
}

// Minutes to read aloud, with pauses for looking at the painting.
export function readingMinutes(story) {
  const words = story.pages.flatMap(p => p.text).join(' ').split(/\s+/).filter(Boolean).length
  return Math.max(2, Math.round(words / 90 + story.pages.length * 0.5))
}
