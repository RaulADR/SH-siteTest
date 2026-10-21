# Soft Hoarders #12560

A redesigned website for **Soft Hoarders**, the student-run FIRST Tech Challenge
team from Colegiul Național „Frații Buzești”, Craiova, Romania (team **12560**,
program code **RO031**, founded 2016).

Built as a static site — no build step, no framework, no runtime dependencies.

---

## Running it

```bash
node serve.js          # http://localhost:8099
node serve.js 3000     # pick another port
```

Or use anything else that serves static files (`npx serve`, `python -m http.server`).

Opening `index.html` directly from the filesystem also works — the live results
request still succeeds — but a local server is recommended because it gives the
page a real origin, which is how it will behave in production.

---

## Layout

```
index.html              the whole page (hero + 8 sections)
serve.js                zero-dependency static server
assets/
  css/main.css          the liquid-glass system + all responsive rules
  js/main.js            every interaction (i18n, reveals, drawer, results, motes)
  js/i18n.js            EN/RO dictionary — 161 UI keys + 8 applied from JS + 17 member bios
  i18n.json             the original site's dictionary, kept as the source of truth
  logo.webp  robot.webp
  team/*.webp           17 member photos
  sponsors/*.png        7 sponsor logos
```

Everything is local. The site makes exactly one outbound request, to the
FTC Scout GraphQL API, for live competition results.

---

## Sections

`About` · `Programs` · `How we work` · `Record` · `Results` · `Team` ·
`Sponsors` · `Contact`

- **Bilingual** — EN/RO toggle in the header (and in the drawer below 560px).
  All copy lives in `assets/js/i18n.js`; `data-i18n` attributes in the HTML
  point at the keys. The Romanian wording follows the team's own conventions
  from the original site (`Eveniment Premier European`, `Partener Alianță
  Finalistă`, `CONECTAT · PREGĂTIT`); official award and event names —
  `Inspire Award`, `Connect Award`, `Maryland Tech Invitational` — stay in
  English, as they did before.
- **Live results** — pulled from `https://api.ftcscout.org/graphql` for seasons
  2025 and 2026. Events with published stats come first, newest first; events
  FTC Scout has not scored yet render in a distinct "results not published"
  state. If the API is unreachable, a fallback link to the FTC Scout team page
  is shown instead.
- **Team** — 17 members grouped by department (Hardware 7, Non-technical 6,
  Software 4). Hover a member for their first-person bio; click for the full
  card.

---

## The liquid-glass treatment

`backdrop-filter` alone gives frosted acrylic, not glass. What is implemented
here:

- **Refraction** — an SVG `feTurbulence` + `feDisplacementMap` filter
  (`#glass-distort`) is piped into `backdrop-filter: url(#glass-distort) blur()
  saturate() brightness()`, so the backdrop genuinely bends at the edges of a
  panel instead of just going soft.
- **Chromatic rim** — a conic gradient is masked to a 1.4px ring with
  `mask-composite: exclude`, giving a faint red/green/blue fringe along the
  border the way a real glass edge splits light.
- **Specular highlight** — the panel tracks the pointer via `--mx` / `--my`
  custom properties, so the bright spot follows the cursor.
- **Inset rim lights** — top and bottom inner shadows fake the way light
  catches a thick edge.
- **Fallback** — `@supports` degrades to a plain blur where `backdrop-filter`
  is unavailable, so the page never renders as flat grey boxes.

Motion carries the page: split-text headline reveals, rules that draw
themselves in, magnetic buttons, a pointer-tilted hero panel, a slowly pulsing
accent line, drifting orbs, film grain, canvas motes, a scanning robot plate,
marquees, counters, and a staggered entrance for the live result cards.
Everything collapses to static under `prefers-reduced-motion: reduce`.

---

## Verified

Checked programmatically through the Chrome DevTools Protocol at 1440 / 1180 /
820 / 390 / 320 px:

- no horizontal scroll (`scrollWidth - clientWidth === 0`, and scrolling
  rightwards does not move)
- 0 console errors, 0 broken images, all 17 member photos loaded
- all 48 scroll-reveal elements become visible, including after a
  single-frame fling to the bottom of the page
- 6 result cards render from the live API, and the loading skeletons hold
  within ~3px of the final grid height (no jump for the sections below)
- EN/RO toggle, drawer (including `inert` and Escape), focus trap, bio
  tooltip and every primary control respond to real mouse events

---

## Content

The member bios, awards and history are the team's own words, carried over
from the original site and lightly tidied. Please check them before going
live — particularly the awards list and the competition dates.
