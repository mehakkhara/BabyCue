// Parent checklists: things to prepare for, tick off, and know what to expect.
// A checklist has a `month` it is aimed at and a `window` [from, to] of baby
// ages (in completed months) during which it shows on Today as a "To do".
// Content is logistics and what-to-expect only. Nothing here lists symptoms,
// warning signs or when to seek care — that is deliberately out of scope.
// Placeholders: {baby}, {they}, {them}, {their} (see lib/pronouns.js).

const VISIT_BRING = [
  { id: 'card', text: 'Insurance or health card and the clinic\'s paperwork' },
  { id: 'record', text: '{baby}\'s vaccination record, if the clinic keeps a paper one' },
  { id: 'questions', text: 'Your list of questions (there is a section below to fill in)' },
  { id: 'diaper', text: 'A spare diaper, wipes and a change of clothes' },
  { id: 'comfort', text: 'A pacifier, lovey or small toy for the waiting room' },
]

const VISIT_AFTER = [
  { id: 'cuddles', text: 'Plan a quiet rest of the day. Extra cuddles and feeds help after shots.' },
  { id: 'sleepy', text: 'A sleepier or fussier day after vaccines is common. Keep offering feeds as usual.' },
  { id: 'note', text: 'Jot the weight and length into the Growth tab while you remember.' },
]

function wellVisit({ id, month, window, title, intro, expect, questions, vaccines, bring = VISIT_BRING, after = VISIT_AFTER }) {
  const sections = [
    { title: 'What happens at this visit', items: expect },
  ]
  if (vaccines?.length) sections.push({ title: 'Vaccines usually offered', note: 'Follows the CDC schedule. Your clinic may space some differently.', items: vaccines })
  sections.push({ title: 'Questions worth asking', items: questions })
  sections.push({ title: 'What to bring', items: bring })
  sections.push({ title: 'After the visit', items: after })
  return { id, kind: 'wellVisit', emoji: '🩺', hue: 'sky', month, window, title, intro, sections, source: 'AAP Bright Futures · CDC immunization schedule' }
}

export const CHECKLISTS = [
  wellVisit({
    id: 'visit-newborn', month: 0, window: [0, 0], title: 'Newborn visit',
    intro: 'Usually within the first week home. Short, gentle, and mostly about feeding and weight.',
    expect: [
      { id: 'e1', text: 'Weight, length and head measurement, compared with the birth numbers' },
      { id: 'e2', text: 'A look at {their} skin colour, umbilical stump and hips' },
      { id: 'e3', text: 'Questions about feeding, wet diapers and how you are recovering' },
      { id: 'e4', text: 'Confirmation that the newborn hearing screen and heel-prick test were done' },
    ],
    vaccines: [{ id: 'v1', text: 'Hepatitis B, if the first dose was not given at birth' }],
    questions: [
      { id: 'q1', text: 'How often should {baby} be feeding, and how do I know {they} are getting enough?' },
      { id: 'q2', text: 'When can we go outside, and when can visitors come?' },
      { id: 'q3', text: 'What is the plan for the next visit?' },
    ],
  }),
  wellVisit({
    id: 'visit-1m', month: 1, window: [1, 1], title: '1-month visit',
    intro: 'A check that feeding and weight gain are on track, plus your first real chance to ask questions.',
    expect: [
      { id: 'e1', text: 'Weight, length and head measurement plotted on the growth chart' },
      { id: 'e2', text: 'Questions about feeding, sleep position and where {baby} sleeps' },
      { id: 'e3', text: 'A quick look at how {they} move, focus and respond to sound' },
      { id: 'e4', text: 'A few questions about how you are feeling and sleeping too' },
    ],
    vaccines: [{ id: 'v1', text: 'Hepatitis B dose 2 (some clinics give it at the 2-month visit instead)' }],
    questions: [
      { id: 'q1', text: 'Is {their} weight gain where you would expect?' },
      { id: 'q2', text: 'How much tummy time should we be doing?' },
      { id: 'q3', text: 'Anything about {their} sleep set-up you would change?' },
    ],
  }),
  wellVisit({
    id: 'visit-2m', month: 2, window: [2, 2], title: '2-month visit',
    intro: 'The first big round of vaccines. Plan a calm afternoon afterwards.',
    expect: [
      { id: 'e1', text: 'Weight, length and head measurement on the growth chart' },
      { id: 'e2', text: 'Questions about smiling, cooing, head control and tummy time' },
      { id: 'e3', text: 'A chat about feeding, sleep and safe-sleep basics' },
      { id: 'e4', text: 'A short questionnaire about your own mood and support' },
    ],
    vaccines: [
      { id: 'v1', text: 'DTaP (diphtheria, tetanus, whooping cough)' },
      { id: 'v2', text: 'Polio (IPV)' },
      { id: 'v3', text: 'Hib' },
      { id: 'v4', text: 'Pneumococcal (PCV)' },
      { id: 'v5', text: 'Rotavirus (drops by mouth)' },
      { id: 'v6', text: 'Hepatitis B, if dose 2 was not given at 1 month' },
    ],
    questions: [
      { id: 'q1', text: 'What can we do to make the shots easier on {baby}?' },
      { id: 'q2', text: 'Is {their} head shape fine, and how do we vary {their} position?' },
      { id: 'q3', text: 'When should we expect longer night stretches?' },
    ],
  }),
  wellVisit({
    id: 'visit-4m', month: 4, window: [4, 4], title: '4-month visit',
    intro: 'Second round of the same vaccines, and a good time to talk about the months ahead.',
    expect: [
      { id: 'e1', text: 'Measurements on the growth chart' },
      { id: 'e2', text: 'Questions about rolling, reaching, babbling and laughing' },
      { id: 'e3', text: 'A chat about sleep changes and starting to think about solids' },
    ],
    vaccines: [
      { id: 'v1', text: 'DTaP dose 2' },
      { id: 'v2', text: 'Polio (IPV) dose 2' },
      { id: 'v3', text: 'Hib dose 2' },
      { id: 'v4', text: 'Pneumococcal (PCV) dose 2' },
      { id: 'v5', text: 'Rotavirus dose 2' },
    ],
    questions: [
      { id: 'q1', text: 'What are the signs {baby} is ready for solids, and when should we start?' },
      { id: 'q2', text: 'Is it time to stop swaddling?' },
      { id: 'q3', text: 'Any thoughts on {their} sleep routine?' },
    ],
  }),
  wellVisit({
    id: 'visit-6m', month: 6, window: [6, 6], title: '6-month visit',
    intro: 'The solids visit. Bring every food question you have.',
    expect: [
      { id: 'e1', text: 'Measurements on the growth chart' },
      { id: 'e2', text: 'Questions about sitting, passing toys between hands and responding to {their} name' },
      { id: 'e3', text: 'A talk about first foods, allergens and cups' },
      { id: 'e4', text: 'A look at {their} gums and a chat about tooth care' },
    ],
    vaccines: [
      { id: 'v1', text: 'DTaP dose 3' },
      { id: 'v2', text: 'Pneumococcal (PCV) dose 3' },
      { id: 'v3', text: 'Hib and rotavirus, depending on the brand used' },
      { id: 'v4', text: 'Hepatitis B and polio doses may be given between 6 and 18 months' },
      { id: 'v5', text: 'Flu vaccine, yearly from 6 months (two doses the first year)' },
      { id: 'v6', text: 'COVID-19 and RSV protection, depending on the season and your clinic' },
    ],
    questions: [
      { id: 'q1', text: 'How should we introduce peanut and egg?' },
      { id: 'q2', text: 'How much milk does {baby} still need once solids start?' },
      { id: 'q3', text: 'When do we start brushing, and with what?' },
    ],
  }),
  wellVisit({
    id: 'visit-9m', month: 9, window: [9, 9], title: '9-month visit',
    intro: 'Usually no shots. This one is about development, with a questionnaire to fill in.',
    expect: [
      { id: 'e1', text: 'Measurements on the growth chart' },
      { id: 'e2', text: 'A developmental questionnaire (the Growth tab has the same milestones)' },
      { id: 'e3', text: 'Questions about crawling, pulling up, babbling and finger foods' },
      { id: 'e4', text: 'A chat about babyproofing now that {baby} is on the move' },
    ],
    vaccines: [{ id: 'v1', text: 'Usually none. Any missed doses may be caught up.' }],
    questions: [
      { id: 'q1', text: 'Which textures should we be offering now?' },
      { id: 'q2', text: 'Is {their} sleep schedule about right for this age?' },
      { id: 'q3', text: 'What should we have babyproofed by the next visit?' },
    ],
  }),
  wellVisit({
    id: 'visit-12m', month: 12, window: [12, 12], title: '12-month visit',
    intro: 'A big one: new vaccines, a blood test, and the switch from formula to milk.',
    expect: [
      { id: 'e1', text: 'Measurements on the growth chart' },
      { id: 'e2', text: 'Questions about first words, pointing, waving and standing' },
      { id: 'e3', text: 'A finger-prick blood test for iron and lead levels' },
      { id: 'e4', text: 'A chat about cow\'s milk, cups instead of bottles, and tooth care' },
    ],
    vaccines: [
      { id: 'v1', text: 'MMR (measles, mumps, rubella)' },
      { id: 'v2', text: 'Chickenpox (varicella)' },
      { id: 'v3', text: 'Hepatitis A dose 1' },
      { id: 'v4', text: 'Hib and pneumococcal (PCV) final doses, at 12 or 15 months' },
    ],
    questions: [
      { id: 'q1', text: 'How do we move from bottles to cups?' },
      { id: 'q2', text: 'How much cow\'s milk a day, and what about water?' },
      { id: 'q3', text: 'When should we see a dentist?' },
    ],
  }),
  wellVisit({
    id: 'visit-15m', month: 15, window: [15, 15], title: '15-month visit',
    intro: 'A shorter visit. Nutrition and walking are the main topics.',
    expect: [
      { id: 'e1', text: 'Measurements on the growth chart' },
      { id: 'e2', text: 'Questions about walking, words, pointing and copying' },
      { id: 'e3', text: 'A chat about picky eating and daily milk' },
    ],
    vaccines: [
      { id: 'v1', text: 'DTaP dose 4, at 15 or 18 months' },
      { id: 'v2', text: 'Hib and pneumococcal (PCV), if not given at 12 months' },
    ],
    questions: [
      { id: 'q1', text: 'Is {their} eating varied enough? Bring a rough three-day food list.' },
      { id: 'q2', text: 'Are we still on track with two naps, or is it time for one?' },
    ],
  }),
  wellVisit({
    id: 'visit-18m', month: 18, window: [18, 18], title: '18-month visit',
    intro: 'Another questionnaire visit. Expect questions about words, pointing and play.',
    expect: [
      { id: 'e1', text: 'Measurements on the growth chart' },
      { id: 'e2', text: 'A developmental questionnaire, plus a short one about social play and communication' },
      { id: 'e3', text: 'Questions about words, following simple instructions and pretend play' },
      { id: 'e4', text: 'A chat about tantrums, sleep and screen time' },
    ],
    vaccines: [
      { id: 'v1', text: 'Hepatitis A dose 2' },
      { id: 'v2', text: 'DTaP dose 4, if not given at 15 months' },
      { id: 'v3', text: 'Hepatitis B and polio final doses, if not already done' },
    ],
    questions: [
      { id: 'q1', text: 'How many words should {baby} have, and how do we help?' },
      { id: 'q2', text: 'What is a reasonable approach to tantrums right now?' },
      { id: 'q3', text: 'Anything to start thinking about for potty training?' },
    ],
  }),
  wellVisit({
    id: 'visit-24m', month: 24, window: [24, 24], title: '2-year visit',
    intro: 'Usually no shots. Talking, eating and the toddler years ahead.',
    expect: [
      { id: 'e1', text: 'Height, weight and now a body-mass reading on the growth chart' },
      { id: 'e2', text: 'A developmental questionnaire and questions about two-word phrases' },
      { id: 'e3', text: 'A chat about iron, calcium and vitamin D in {their} diet' },
      { id: 'e4', text: 'Questions about toilet training readiness and sleep' },
    ],
    vaccines: [{ id: 'v1', text: 'Usually none, apart from the yearly flu vaccine' }],
    questions: [
      { id: 'q1', text: 'Is {their} speech where you would expect?' },
      { id: 'q2', text: 'What should meals look like now?' },
      { id: 'q3', text: 'When does the next visit happen, and how often after that?' },
    ],
  }),

  {
    id: 'solids', kind: 'prep', emoji: '🥄', hue: 'peach', month: 6, window: [5, 7],
    title: 'Starting solids',
    intro: 'Most babies start around 6 months. Getting the set-up ready first makes the first week calmer.',
    source: 'AAP · WHO',
    sections: [
      { title: 'Signs {baby} is ready', items: [
        { id: 'r1', text: 'Sits with a little support and holds {their} head steady' },
        { id: 'r2', text: 'Watches you eat and reaches for your food' },
        { id: 'r3', text: 'Opens {their} mouth for a spoon and no longer pushes food straight out' },
      ]},
      { title: 'Things to have ready', items: [
        { id: 'g1', text: 'A high chair with a strap, where {baby} sits upright' },
        { id: 'g2', text: 'Soft-tipped spoons and a couple of bibs' },
        { id: 'g3', text: 'A small open cup or straw cup for sips of water' },
        { id: 'g4', text: 'A wipe-clean mat under the chair. It will be messy, and that is fine.' },
      ]},
      { title: 'First foods', items: [
        { id: 'f1', text: 'Iron-rich options first: iron-fortified cereal, pureed meat, lentils or beans' },
        { id: 'f2', text: 'One new food at a time, a few days apart, so you can spot reactions' },
        { id: 'f3', text: 'Common allergens (peanut, egg, dairy, wheat) introduced early, once the first foods are going well. Ask at the 6-month visit how to do this for {baby}.' },
        { id: 'f4', text: 'Milk stays the main food. Solids are practice, not replacement, for now.' },
      ]},
      { title: 'Safety basics', items: [
        { id: 's1', text: 'Always seated upright and never left alone while eating' },
        { id: 's2', text: 'No honey before 12 months' },
        { id: 's3', text: 'Avoid choking shapes: whole grapes, nuts, hard raw vegetables, hot dog rounds' },
        { id: 's4', text: 'Foods soft enough to squash between your finger and thumb' },
      ]},
    ],
  },
  {
    id: 'babyproofing', kind: 'prep', emoji: '🔒', hue: 'mint', month: 8, window: [7, 10],
    title: 'Babyproofing before {they} crawl',
    intro: 'Once {baby} moves, the room does the watching for you. Get down on hands and knees and look from {their} height.',
    source: 'AAP · CPSC',
    sections: [
      { title: 'Furniture and falls', items: [
        { id: 'a1', text: 'Anchor bookcases, dressers and the TV to the wall' },
        { id: 'a2', text: 'Gates at the top and bottom of stairs' },
        { id: 'a3', text: 'Crib mattress on the lowest setting' },
        { id: 'a4', text: 'Corner guards on low sharp tables, or move them for now' },
      ]},
      { title: 'Cords, sockets and water', items: [
        { id: 'b1', text: 'Outlet covers or sliding plates on unused sockets' },
        { id: 'b2', text: 'Blind and curtain cords tied up out of reach' },
        { id: 'b3', text: 'Water heater set to 120°F (49°C) or below' },
        { id: 'b4', text: 'Toilet lid lock, and never leave water standing in the bath' },
      ]},
      { title: 'Small things and cupboards', items: [
        { id: 'c1', text: 'Anything that fits through a toilet-paper tube goes up high' },
        { id: 'c2', text: 'Latches on cupboards with cleaning products, medicines or bin bags' },
        { id: 'c3', text: 'Medicines, vitamins and cosmetics in a high locked cupboard' },
        { id: 'c4', text: 'Houseplants, pet food and pet bowls moved out of reach' },
      ]},
      { title: 'Daily habits', items: [
        { id: 'd1', text: 'Hot drinks never held while holding {baby}' },
        { id: 'd2', text: 'Pot handles turned inward on the stove' },
        { id: 'd3', text: 'Bags and purses (coins, pills, batteries) hung up, not on the floor' },
        { id: 'd4', text: 'Save the poison control number in your phone' },
      ]},
    ],
  },
]

export function checklistById(id) {
  return CHECKLISTS.find(c => c.id === id) || null
}

export function itemCount(checklist) {
  return checklist.sections.reduce((n, s) => n + s.items.length, 0)
}

// Checklists that apply to a baby of `ageInMonths` (completed months) right now.
export function dueChecklists(ageInMonths) {
  return CHECKLISTS.filter(c => ageInMonths >= c.window[0] && ageInMonths <= c.window[1])
}

// Rough grouping for the list screen.
export function groupChecklists(ageInMonths) {
  const now = [], soon = [], past = []
  for (const c of CHECKLISTS) {
    if (ageInMonths >= c.window[0] && ageInMonths <= c.window[1]) now.push(c)
    else if (ageInMonths < c.window[0]) soon.push(c)
    else past.push(c)
  }
  return { now, soon, past }
}
