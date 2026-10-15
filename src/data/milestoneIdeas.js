// Suggestions for "Add a milestone".
//
// Deliberately NOT developmental — the CDC list in milestones.js already covers
// rolling, babbling and pincer grips. These are the other kind: the firsts a
// parent wants to remember rather than the ones a pediatrician asks about.
// Keepsake, not assessment.
//
// Keyed by the same checkpoints as MILESTONES so a parent is offered things
// that are plausibly happening right about now. Each carries a `tip`, shown
// when the parent taps "Not yet" — the same gentle nudge the curated list gives.

export const MILESTONE_IDEAS = {
  2: [
    { text: 'Slept a long stretch', tip: 'A calm, dim wind-down at the same time each evening helps the longer stretches come. They arrive when they arrive.' },
    { text: 'Met the whole family', tip: 'One or two visitors at a time, with a quiet break in between, keeps the day gentle for everyone.' },
    { text: 'First bath at home', tip: 'Warm room, warm water, a hand on the chest the whole time. Two minutes is plenty the first time.' },
    { text: 'Outgrew newborn clothes', tip: 'Snap a photo in the current favourite outfit now — it will be too small sooner than you think.' },
    { text: 'First proper outing', tip: 'Pick a short, close one between feeds and bring one more change of clothes than feels necessary.' },
  ],
  4: [
    { text: 'Slept through the night', tip: 'Keep night feeds dim and quiet, and give a moment before stepping in when they stir. Longer stretches usually come on their own.' },
    { text: 'Laughed out loud', tip: 'Big surprised faces, gentle tickles and silly sounds. Repeat whatever got the first chuckle.' },
    { text: 'Found their own feet', tip: 'Some floor time without socks, and a bright pair when they are on — feet are more interesting when they are easy to see.' },
    { text: 'First time in a swing', tip: 'A bucket swing with support, a slow push, and stop at the first frown. Most babies warm to it on the second try.' },
    { text: 'Grabbed my hair', tip: 'Lean in close during play. Reaching for whatever dangles is how they practise grabbing.' },
  ],
  6: [
    { text: 'First taste of real food', tip: 'Offer a spoon of something soft when they are sitting steadily and curious, not hungry or tired. Faces of surprise are normal.' },
    { text: 'First tooth', tip: 'A cold, clean teething ring eases the gums. Teeth arrive anywhere from four months to past the first birthday.' },
    { text: 'Sat up on their own', tip: 'Sit them between your legs or in a ring of cushions for short stretches so they can practise balancing.' },
    { text: 'First time in a high chair', tip: 'Start with a few minutes at family mealtimes with a toy on the tray, before any food is involved.' },
    { text: 'Splashed in the pool', tip: 'Warm water, a slow start held close to you, and out before they get cold. Ten minutes is a good first swim.' },
  ],
  9: [
    { text: 'Pulled up on the sofa', tip: 'Put a favourite toy on the sofa cushion just out of reach, and stay close for the first wobbly stands.' },
    { text: 'Waved goodbye', tip: 'Wave and say "bye-bye" every time someone leaves, and take their hand to wave too. They copy what they see often.' },
    { text: 'Crawled to me', tip: 'Sit a little way off on the floor and call them with open arms. A toy halfway helps.' },
    { text: 'Ate with their fingers', tip: 'Soft, graspable pieces on the tray — banana, steamed carrot, toast strips — and let the mess happen.' },
    { text: 'Slept in their own room', tip: 'Start with naps in the new room so it feels familiar before the first full night.' },
  ],
  12: [
    { text: 'First birthday', tip: 'Keep it small and short, around their best time of day. The cake photo is the only part that needs to go to plan.' },
    { text: 'First steps', tip: 'Let them cruise along the sofa, offer a sturdy push toy, and kneel a step away with open arms. Bare feet help. Walking anywhere from 9 to 18 months is typical.' },
    { text: 'First haircut', tip: 'Go when they are fed and rested, bring a snack and a toy, and ask for just a trim. Keep a lock for the journal.' },
    { text: 'Blew out a candle', tip: 'Practise blowing bubbles or a pinwheel for a few days before — it turns blowing into a game.' },
    { text: 'Said a real word', tip: 'Name the things they point at, pause so they can try, and celebrate any attempt that sounds close.' },
  ],
  15: [
    { text: 'Ran for the first time', tip: 'Open grass, a ball to chase and you a few steps ahead. Running follows steady walking by a month or two.' },
    { text: 'Used a spoon properly', tip: 'Thick foods like yogurt or porridge, a short-handled spoon, and your own spoon to copy. Expect most of it to miss at first.' },
    { text: 'Danced to music', tip: 'Put on something with a beat and dance yourself. Bouncing to music usually starts with copying you.' },
    { text: 'First trip away', tip: 'Bring the familiar sleep things — sheet, sleeping bag, white noise — and keep the first night close to routine.' },
    { text: 'Climbed something they shouldn’t', tip: 'Give them something they can climb — a low step, cushions on the floor — and the sofa becomes less tempting.' },
  ],
  18: [
    { text: 'Put two words together', tip: 'Add one word to what they say: "car" becomes "big car", "more" becomes "more milk". They borrow the pattern.' },
    { text: 'Walked up the stairs', tip: 'One hand on the rail, one in yours, one step at a time. Going up comes well before going down.' },
    { text: 'Named a body part', tip: 'Point and name during the bath and when dressing: nose, toes, tummy. Ask "where is your nose?" and wait.' },
    { text: 'Slept in a big bed', tip: 'A low bed or mattress on the floor, same bedtime routine, and a guard rail. Give it a week before judging.' },
    { text: 'Helped tidy up', tip: 'Make it a game with a song, and hand them one thing at a time to put in the basket. Praise the effort, not the result.' },
  ],
  24: [
    { text: 'Counted to three', tip: 'Count the stairs, the buttons, the strawberries — out loud, every day. The numbers stick before their meaning does.' },
    { text: 'Got dressed (mostly) alone', tip: 'Loose clothes, big armholes, and a few extra minutes. Let them finish what they start even if it is inside out.' },
    { text: 'Made a friend', tip: 'Regular time with the same one or two children. Side-by-side play comes first; playing together follows.' },
    { text: 'Used the potty', tip: 'Let the potty sit in the bathroom for a while before asking anything of it. Interest comes before readiness, and both come on their own schedule.' },
    { text: 'Told their first joke', tip: 'Laugh at their silliness — a shoe on the head, a wrong animal sound. Being funny on purpose starts with getting a laugh.' },
  ],
}

/**
 * Ideas for a checkpoint, minus anything already added.
 * Matching is case- and whitespace-insensitive so "first tooth" doesn't get
 * offered again after the parent typed "First Tooth" themselves.
 */
export function ideasFor(checkpoint, alreadyAdded = []) {
  const taken = new Set(alreadyAdded.map(m => (m.text || '').trim().toLowerCase()))
  return (MILESTONE_IDEAS[checkpoint] || []).filter(idea => !taken.has(idea.text.toLowerCase()))
}

/** The tip for a text the parent may have typed themselves, if it matches an idea. */
export function tipForIdea(text) {
  const t = (text || '').trim().toLowerCase()
  for (const list of Object.values(MILESTONE_IDEAS)) {
    const hit = list.find(i => i.text.toLowerCase() === t)
    if (hit) return hit.tip
  }
  return null
}
