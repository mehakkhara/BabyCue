# BabyCue — Project Context

## What the Product Does

A personalized mom assistant app that delivers age-specific, evidence-based guidance to new mothers. Instead of overwhelming generic advice, the app surfaces the *right* information at the *right* time — based on the baby's exact age and the mother's chosen parenting style. As the baby grows month by month, the content evolves with them. For example, a mom in month 4 gets targeted sleep training guidance; a mom in month 8 gets guidance on introducing solids. Every suggestion is backed by pediatric research and studies.

## Who It's For

- New and first-time mothers who feel overwhelmed by the volume and inconsistency of baby advice online
- Mothers who want personalized, non-generic guidance that reflects *their* baby and *their* values
- Mothers across a range of parenting styles (attachment parenting, sleep training, baby-led weaning, etc.)

## Core Personalization Axes

1. **Baby's age** — content is gated and surfaced by the baby's month (0–24 months initially)
2. **Parenting style** — mom sets her philosophy (e.g., attachment, gentle, schedule-based) and all suggestions align to it
3. **Individual context** — future: baby's specific milestones, feeding method (breast/formula), sleep situation

## How It's Built

- Stack: TBD — likely React Native (cross-platform mobile) or Flutter
- Backend: TBD — needs a content database organized by age range + parenting style tags
- Content layer: curated tips, articles, and checklists sourced from peer-reviewed pediatric studies (AAP, WHO guidelines, etc.)
- Auth: user accounts to persist baby profile (DOB, parenting style preferences)

## What We're Working On

- [ ] Define the full information architecture (what content exists per month, per parenting style)
- [ ] Design the onboarding flow (baby DOB + parenting style quiz)
- [ ] Build the age-aware content engine (logic that surfaces the right content for the baby's current month)
- [ ] Curate and structure the initial content library (months 0–6 as MVP)

## What We Don't Do

- No generic, one-size-fits-all advice — every tip must be contextualized to the user's profile
- No medical diagnosis or treatment recommendations — we surface guidance, not medical advice
- No social feed or community features (at least not in v1)
- No content that isn't backed by a credible pediatric source

## Key Product Principles

1. **Specificity over completeness** — better to surface 3 highly relevant tips than 20 generic ones
2. **Evidence-based** — every content item should cite a source (AAP, WHO, peer-reviewed study)
3. **Style-aware** — a gentle parenting mom should never see advice that conflicts with her philosophy without context
4. **Reduces overwhelm** — the UI/UX should feel calm, not information-dense
