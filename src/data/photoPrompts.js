// Photo-hunt prompts — nine tiny photo missions per age band. They answer
// "what should I even photograph?" and rotate as the baby grows, so each
// month's grid feels fresh. Kept playful and zero-pressure; nothing here is
// a milestone or a should.

const BANDS = [
  {
    max: 2,
    prompts: [
      { id: 'tiny-toes',      emoji: '🦶', label: 'Tiny toes' },
      { id: 'mid-yawn',       emoji: '🥱', label: 'Mid-yawn' },
      { id: 'swaddled',       emoji: '🌯', label: 'Swaddled up' },
      { id: 'fast-asleep',    emoji: '😴', label: 'Fast asleep' },
      { id: 'tiny-hand',      emoji: '🤝', label: 'Hand in yours' },
      { id: 'bath-time',      emoji: '🛁', label: 'Bath time' },
      { id: 'tiny-outfit',    emoji: '🧸', label: 'Littlest outfit' },
      { id: 'family-cuddle',  emoji: '👵', label: 'Family cuddle' },
      { id: 'first-walk',     emoji: '🌳', label: 'Out for a walk' },
    ],
  },
  {
    max: 5,
    prompts: [
      { id: 'tummy-time',     emoji: '💪', label: 'Tummy time' },
      { id: 'gummy-smile',    emoji: '😁', label: 'Big gummy smile' },
      { id: 'toy-grab',       emoji: '🧸', label: 'Grabbing a toy' },
      { id: 'mid-laugh',      emoji: '🤭', label: 'Mid-laugh' },
      { id: 'bath-splash',    emoji: '🛁', label: 'Bath splash' },
      { id: 'nap-sprawl',     emoji: '😴', label: 'Nap sprawl' },
      { id: 'story-time',     emoji: '📖', label: 'Story time' },
      { id: 'family-moment',  emoji: '👵', label: 'Family moment' },
      { id: 'park-day',       emoji: '🌳', label: 'A day outside' },
    ],
  },
  {
    max: 8,
    prompts: [
      { id: 'solids-face',    emoji: '🥄', label: 'First-solids face' },
      { id: 'sitting-tall',   emoji: '🪑', label: 'Sitting up tall' },
      { id: 'camera-reach',   emoji: '📷', label: 'Reaching for the camera' },
      { id: 'peekaboo',       emoji: '🙈', label: 'Peekaboo grin' },
      { id: 'messy-meal',     emoji: '🍌', label: 'Messy meal' },
      { id: 'bath-toys',      emoji: '🦆', label: 'Bath toys' },
      { id: 'almost-crawling',emoji: '🐢', label: 'Almost crawling' },
      { id: 'morning-hair',   emoji: '🌞', label: 'Morning bedhead' },
      { id: 'with-a-friend',  emoji: '👶', label: 'With a friend' },
    ],
  },
  {
    max: 12,
    prompts: [
      { id: 'standing',       emoji: '🧍', label: 'Standing practice' },
      { id: 'clapping',       emoji: '👏', label: 'Clapping hands' },
      { id: 'food-everywhere',emoji: '🍝', label: 'Food everywhere' },
      { id: 'pointing',       emoji: '👉', label: 'Pointing at something' },
      { id: 'favorite-book',  emoji: '📚', label: 'Favorite book' },
      { id: 'on-the-move',    emoji: '🚼', label: 'On the move' },
      { id: 'silly-face',     emoji: '🤪', label: 'Silly face' },
      { id: 'family-walk',    emoji: '🌳', label: 'Family walk' },
      { id: 'big-moment',     emoji: '🎈', label: 'A big little moment' },
    ],
  },
  {
    max: 18,
    prompts: [
      { id: 'walking',        emoji: '🚶', label: 'Walking adventure' },
      { id: 'climbing',       emoji: '🧗', label: 'Climbing something' },
      { id: 'scribbles',      emoji: '🖍️', label: 'Scribble art' },
      { id: 'dancing',        emoji: '💃', label: 'Dancing' },
      { id: 'snack-face',     emoji: '🍓', label: 'Snack face' },
      { id: 'new-word',       emoji: '💬', label: 'New-word moment' },
      { id: 'puddle-sand',    emoji: '🏖️', label: 'Puddle or sand' },
      { id: 'little-helper',  emoji: '🧹', label: 'Little helper' },
      { id: 'best-friend',    emoji: '🐶', label: 'Best friend' },
    ],
  },
  {
    max: 24,
    prompts: [
      { id: 'running-blur',   emoji: '🏃', label: 'Running blur' },
      { id: 'big-kid-swing',  emoji: '🛝', label: 'Big-kid swing' },
      { id: 'block-tower',    emoji: '🧱', label: 'Block tower' },
      { id: 'pretend-play',   emoji: '🎭', label: 'Pretend play' },
      { id: 'little-chef',    emoji: '🍳', label: 'Chef in training' },
      { id: 'bedtime-routine',emoji: '🌙', label: 'Bedtime routine' },
      { id: 'favorite-outfit',emoji: '👕', label: 'Favorite outfit' },
      { id: 'explorer',       emoji: '🔍', label: 'Little explorer' },
      { id: 'phone-call',     emoji: '📞', label: '“Phone call”' },
    ],
  },
]

export function promptsForAge(ageInMonths) {
  const band = BANDS.find(b => ageInMonths <= b.max) || BANDS[BANDS.length - 1]
  return band.prompts
}
