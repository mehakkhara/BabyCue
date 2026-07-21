// Developmental milestones by age checkpoint (CDC/AAP "Learn the Signs" style,
// grouped by the checkpoints the CDC uses). These are typical ranges, not a
// test — every baby moves at their own pace. Each milestone carries a `tip`:
// a gentle, concrete way to encourage it, shown when a parent taps "Not yet".

export const DOMAINS = {
  social:   { label: 'Social',   color: '#7C6FF7' },
  language: { label: 'Talking',  color: '#4F7CF7' },
  motor:    { label: 'Moving',   color: '#059669' },
  thinking: { label: 'Thinking', color: '#D97706' },
}

export const CHECKPOINTS = [2, 4, 6, 9, 12, 15, 18, 24]

// Largest checkpoint at or below the baby's age (so a 5-month-old sees the
// 4-month set that's blooming now). Babies younger than the first checkpoint
// see it as "coming up".
export function checkpointForAge(months) {
  let cp = CHECKPOINTS[0]
  for (const c of CHECKPOINTS) if (months >= c) cp = c
  return cp
}

export function nextCheckpoint(checkpoint) {
  const i = CHECKPOINTS.indexOf(checkpoint)
  return i >= 0 && i < CHECKPOINTS.length - 1 ? CHECKPOINTS[i + 1] : null
}

export const MILESTONES = {
  2: [
    { id: 'm2-1', domain: 'social',   text: 'Smiles at people', tip: 'Smile and make warm eye contact often — around 6–8 weeks babies begin smiling back.' },
    { id: 'm2-2', domain: 'social',   text: 'Can briefly calm themselves', tip: 'Give a moment before stepping in, and offer their own fist or a clean finger to suck.' },
    { id: 'm2-3', domain: 'language', text: 'Coos and makes gurgling sounds', tip: 'Coo and talk back when they make a sound — pause as if it’s their turn to reply.' },
    { id: 'm2-4', domain: 'language', text: 'Turns head toward sounds', tip: 'Talk from different sides and use a soft rattle so they practice finding the sound.' },
    { id: 'm2-5', domain: 'thinking', text: 'Watches faces and follows things with their eyes', tip: 'Hold your face 8–12 inches away and slowly move side to side for them to track.' },
    { id: 'm2-6', domain: 'motor',    text: 'Holds head up during tummy time', tip: 'Do short tummy-time sessions several times a day; a rolled towel under the chest helps.' },
  ],
  4: [
    { id: 'm4-1', domain: 'social',   text: 'Smiles on their own to get your attention', tip: 'Respond every time they smile at you — it teaches them their smile “works.”' },
    { id: 'm4-2', domain: 'social',   text: 'Chuckles when you try to make them', tip: 'Play gently — soft tickles, funny faces and sounds — and watch for the first chuckles.' },
    { id: 'm4-3', domain: 'language', text: 'Makes cooing sounds and babbles back to you', tip: 'Have back-and-forth “chats”: say something, wait, then answer their sounds.' },
    { id: 'm4-4', domain: 'thinking', text: 'Reaches for and grabs a toy', tip: 'Dangle a light, easy-to-grab toy just within reach to invite reaching.' },
    { id: 'm4-5', domain: 'motor',    text: 'Holds head steady without support', tip: 'Keep up daily tummy time and hold them upright against your shoulder.' },
    { id: 'm4-6', domain: 'motor',    text: 'Brings hands to mouth; pushes up on elbows in tummy time', tip: 'In tummy time, place a toy just ahead so they push up to see it.' },
  ],
  6: [
    { id: 'm6-1', domain: 'social',   text: 'Knows familiar faces; likes looking in a mirror', tip: 'Play in front of a mirror and name family members in photos.' },
    { id: 'm6-2', domain: 'language', text: 'Takes turns making sounds with you', tip: 'Copy the sounds they make, then add a new one for them to try.' },
    { id: 'm6-3', domain: 'language', text: 'Responds to their own name', tip: 'Use their name often, especially right before you speak to them.' },
    { id: 'm6-4', domain: 'thinking', text: 'Brings things to their mouth to explore', tip: 'Offer safe, textured toys they can mouth and turn over.' },
    { id: 'm6-5', domain: 'motor',    text: 'Rolls over in both directions', tip: 'Give floor time and set a toy to the side to encourage rolling toward it.' },
    { id: 'm6-6', domain: 'motor',    text: 'Begins to sit with a little support', tip: 'Practice supported sitting with pillows or your hands around their hips.' },
  ],
  9: [
    { id: 'm9-1', domain: 'social',   text: 'Is clingy with familiar adults; has favorite toys', tip: 'Play peek-a-boo and short goodbye games so they learn you always come back.' },
    { id: 'm9-2', domain: 'language', text: 'Makes lots of sounds like "mamama" and "bababa"', tip: 'Repeat simple sounds back and label things out loud all day long.' },
    { id: 'm9-3', domain: 'thinking', text: 'Looks for objects when they drop out of sight', tip: 'Play drop-and-find, and hide a toy under a cloth for them to uncover.' },
    { id: 'm9-4', domain: 'thinking', text: 'Plays peek-a-boo', tip: 'Cover your face and reappear — the happy surprise builds object permanence.' },
    { id: 'm9-5', domain: 'motor',    text: 'Sits without support', tip: 'Give lots of unpropped floor sitting with toys placed just out of reach.' },
    { id: 'm9-6', domain: 'motor',    text: 'Moves things from one hand to the other', tip: 'Offer a soft block or toy they can pass back and forth between hands.' },
  ],
  12: [
    { id: 'm12-1', domain: 'social',   text: 'Plays games like pat-a-cake; waves bye-bye', tip: 'Model waving and clapping every day and celebrate when they copy you.' },
    { id: 'm12-2', domain: 'language', text: 'Says "mama" or "dada"; tries to copy your words', tip: 'Narrate and repeat simple words, pausing to give them a turn to try.' },
    { id: 'm12-3', domain: 'language', text: 'Understands simple requests like "come here"', tip: 'Pair words with gestures — say “come here” with open arms.' },
    { id: 'm12-4', domain: 'thinking', text: 'Puts something in a container; looks for hidden things', tip: 'Play fill-and-dump with a cup and blocks; hide a toy for them to find.' },
    { id: 'm12-5', domain: 'motor',    text: 'Pulls up to stand and "cruises" along furniture', tip: 'Arrange stable furniture so they can cruise between pieces; bare feet help balance.' },
    { id: 'm12-6', domain: 'motor',    text: 'Picks up small things with thumb and finger', tip: 'Offer safe soft finger foods (like puffs) to practice the thumb-and-finger pinch.' },
  ],
  15: [
    { id: 'm15-1', domain: 'social',   text: 'Copies other children; shows you affection', tip: 'Arrange playdates and model gentle hugs and sharing.' },
    { id: 'm15-2', domain: 'language', text: 'Tries to say one or two words besides "mama/dada"', tip: 'Name everything, keep words simple, and warmly expand on their attempts.' },
    { id: 'm15-3', domain: 'thinking', text: 'Uses things the right way — a cup, a phone, a brush', tip: 'Let them practice with real objects and show them how each one is used.' },
    { id: 'm15-4', domain: 'motor',    text: 'Takes a few steps on their own', tip: 'Encourage cruising, offer a sturdy push toy, and hold one hand as they step.' },
    { id: 'm15-5', domain: 'motor',    text: 'Points to ask for something or get help', tip: 'Respond warmly when they point, naming what they want out loud.' },
  ],
  18: [
    { id: 'm18-1', domain: 'social',   text: 'Points to show you something interesting', tip: 'Follow their point, name it, and share their excitement.' },
    { id: 'm18-2', domain: 'social',   text: 'Plays simple pretend, like feeding a doll', tip: 'Model pretend play — feed a doll, pretend to sip — and invite them to join.' },
    { id: 'm18-3', domain: 'language', text: 'Says several single words; shakes head "no"', tip: 'Offer simple choices (“milk or water?”) and honor their yes and no.' },
    { id: 'm18-4', domain: 'thinking', text: 'Follows a one-step direction without gestures', tip: 'Give short, clear directions during routines, like “bring me the ball.”' },
    { id: 'm18-5', domain: 'motor',    text: 'Walks alone; tries to use a spoon', tip: 'Give safe walking space and let them self-feed with a spoon — the mess is part of learning.' },
  ],
  24: [
    { id: 'm24-1', domain: 'social',   text: 'Notices when others are hurt or upset', tip: 'Name feelings — yours and others’ — and model comforting someone.' },
    { id: 'm24-2', domain: 'language', text: 'Says two-word phrases like "more milk"', tip: 'Expand their words: they say “more milk,” you say “you want more milk!”' },
    { id: 'm24-3', domain: 'language', text: 'Points to things in a book when you name them', tip: 'Read together daily and ask “where’s the dog?” as you go.' },
    { id: 'm24-4', domain: 'thinking', text: 'Follows two-step instructions; sorts shapes and colors', tip: 'Play sorting games and give two-step tasks: “get your shoes and bring them here.”' },
    { id: 'm24-5', domain: 'motor',    text: 'Kicks a ball and runs', tip: 'Head to open space for kicking, chasing, and simple ball games.' },
    { id: 'm24-6', domain: 'motor',    text: 'Stacks several blocks; eats with a spoon', tip: 'Offer blocks to stack and let them keep practicing utensils at meals.' },
  ],
}

export const MILESTONE_NOTE =
  'Every baby develops at their own pace — these are typical ranges, not a checklist to race. If you have concerns about your baby’s development, your pediatrician is the best person to ask.'
