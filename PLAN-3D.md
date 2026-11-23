# lawrenzem.space redesign: Latent Space

A complete redesign. The portfolio becomes a 3D **latent space**: every project, tool and
job is a glowing point, placed by what it is about, the way an AI model places text.
Related work clusters together. The camera flies between five fixed stops, a low-poly
version of me guides the visitor, and asking a question lights up the closest work.

## Decisions (22 Nov 2026)

| Area | Decision |
|---|---|
| World | Latent Space (concept A) |
| Look | Concept C's palette: solder-mask black, PCB green, phosphor, copper |
| Type | Bricolage Grotesque (display) + Hanken Grotesk (body). No terminal or pixel fonts |
| Navigation | Five fixed stops; menu, ← →, 1–5, scroll (one stop per gesture), swipe, `#hash` |
| Me | Low-poly 3D avatar (AI image-to-3D from my illustration, cleaned up in Blender), guiding between stops |
| Ask | "Ask the guide": a question lights the nearest points with match scores; the camera flies to the best match |
| Sound | On by default (starts at the first click, tap or key press), toggle; turning it off is remembered |
| Write-ups | Full case study for the top 3, short card for the rest |
| Plain view | A new 2D site in the same identity (not the old site) |
| Positioning | Full-Stack & AI Engineer |
| Carry-over | Logo, avatar illustration and copy are raw material, nothing is locked |
| Points | Every point in the cloud is real: projects, plus smaller things (features, integrations, scripts, notable PRs) with a one-line hover. Drafted from my repos and work, I review before publishing |
| Texture | Subtle animated film grain over everything; no scanlines |
| Pacing | Camera settles in about 1.5 s, slow orbit on Home (agreed after trying the prototype) |
| Case studies | Written from short interviews with me, then edited by me |

## Look

| Token | Hex | Use |
|---|---|---|
| bg | `#05110C` | Space (solder-mask black-green) |
| surface | `#0A1C14` | Panels |
| line | `#1A3A2A` | Borders |
| text | `#D6F5DE` | Body text |
| muted | `#7FA88F` | Secondary text |
| AI | `#7CFFA4` | AI & agents cluster (phosphor) |
| Platform | `#E08A3C` | Platforms cluster (copper) |
| Quality | `#4FD1C5` | Quality cluster (teal) |
| Interface | `#F2C14E` | Interface cluster (solder gold) |
| core | `#E9F0EA` | Core, guide (silkscreen white) |

Type: **Bricolage Grotesque** for display, **Hanken Grotesk** for body (chosen 22 Nov over
Fraunces + Instrument Sans and Archivo Expanded).

Light: points are round, softly twinkling sprites; halos are additive glow sprites; a light
bloom pass (threshold 0.7) lifts only the brightest things. Film grain and a vignette sit
over the scene.

Labels, numbers and scores use the body font with tabular figures, not a monospace.

## Stops

| Stop | Camera | Overlay | Interaction |
|---|---|---|---|
| 1 Home | Whole cloud, slowly orbiting | Name, Full-Stack & AI Engineer, pitch, ask box, Enter | Enter / → flies in |
| 2 About | Close on the core (the densest point) | Bio, three facts | — |
| 3 Path | A glowing trail through space, one marker per job, newest first, ending in the core | Selected role | ↑ ↓ / scroll moves along the trail, then on |
| 4 Work | The clusters | Legend, ask box | Click a point to open its case study |
| 5 Signal | A beam out of the cloud to a receiver | Email, copy email, GitHub, LinkedIn | — |

## Points

| Cluster | Points (★ = full case study) |
|---|---|
| AI & agents | ★ LawStack aiops, ★ VIPTutors AI Suite, Max, Porto, ORKESTRA |
| Platforms | ★ MultiPortal, Hosted Network Tools, Freelance builds |
| Quality | TestHub, LawStack verdict |
| Interface | UI kit |

Employer-owned work (MultiPortal, Hosted Network Tools, Porto, Max, ORKESTRA, TestHub,
UI kit) needs the employer's OK, generic screenshots with test data only, and no internal
architecture detail.

A full case study is: problem, my role, decisions, result (with numbers), a 60-second
walkthrough, screenshots. AI case studies also show prompt/agent design, evaluation,
guardrails and failure handling, and cost/latency.

## Ask the guide

- Built (phase 6): matching by meaning in the visitor's browser, so nothing typed leaves
  the page. A static embedding model (potion-base-8M, MIT, 4-bit, 3.9 MB in
  `public/ask/`) loads the first time someone focuses the box. Each project's
  description, tags, case-study passages and small stars are scored by similarity plus a
  small bonus for the question's own words; the top three projects come back with the
  star that matched, and those stars light up. Below 0.30 it says nothing is close; below
  0.40 it says the match is loose. If the model cannot load, keyword matching stands in
  and says so.
- Checks: `npm run check-ask` runs 55 questions and 18 off-topic ones through the same
  code (right project first 51, in the top three 55). Rebuild the model with
  `npm run ask-model` (downloads once, at a pinned revision).
- Later, optional: written answers from the case studies, citing the points used and
  saying when it does not know. Needs a small serverless function (GitHub Pages cannot
  hold an API key), a spending cap and rate limits.

## Interaction map

| Input | Does |
|---|---|
| Menu, 1–5 | Fly to that stop |
| → ← | Next / previous stop |
| ↓ ↑, scroll, swipe | Next / previous, moving along the Path first |
| Click a point | Open its case study; Esc or ✕ closes; ← → moves between points |
| Enter on Home | Fly in |
| `?` | Controls |

States: reduced motion (cut, don't fly; no orbit), no WebGL (plain view), deep links
(`/#work` lands at stop 4).

## Phases

1. **Prototype** (`3d/`, Vite + React Three Fiber + drei + maath): real layout of the
   cloud, path, core and signal; capsule guide; camera flights; overlay panels; mock ask;
   type switcher. Tune pacing and framing here. *Done.*
2. **Look**: bloom, point sprites, subtle grain, final type pairing, motion polish. *Done:
   remaining polish (sound, bundle splitting) moves to Ship.*
3. **Guide**: a comet that flies to what each stop is about (replaced the avatar). *Done.*
4. **Content**: three full case studies (interviews), short cards, every filler point made
   real (drafted, then reviewed), About facts, final copy.
5. **Plain view**: the 2D site in the same identity; meta, Open Graph, `/llms.txt`,
   `resume.json`. *Done.*
6. **Ask the guide**, for real: matching by meaning in the browser. *Done.*
7. **Ship**: GitHub Pages deploy of the built site, 3D at `/`, plain at `/plain/`. *Built, not
   deployed.* Sound is on by default (browsers start it at the first click, tap or key press;
   turning it off is remembered) and made in the browser (Web Audio, no files): slow, quiet
   chords (A, F#m, Dmaj7, Esus2, 14 s each) in a soft room with a faint high note now and then;
   three soft notes from the A major triad on each stop change (rising forward, falling back;
   Path steps silent); a chime when a case opens or Ask answers. Tried and dropped: a low drone
   with noise (read as white noise) and a noise rush on each flight. The 3D is its own
   chunk, so the text shows after 87 KB (gzip) while three.js (300 KB) arrives; if the 3D fails
   to load, the text and menu keep working. The build carries `CNAME`, `.nojekyll` and a
   `404.html`; the dev hooks are dev-only and absent from it. *Live since 23 Nov 2026*: Pages
   serves the `gh-pages` branch (built files only), HTTPS enforced. The old site is still on
   `main` but no longer served; switching the Pages source back to `main` restores it.
   Still open: the content review (case studies and stars).

## Publishing

Pages serves the `gh-pages` branch as plain files, so a change goes live by building and
committing the output there (no workflow needed):

```sh
cd 3d && npm run build && npm run check-ask
git worktree add --detach /tmp/site && cd /tmp/site && git checkout gh-pages
git rm -rq . && cp -a ../path/to/3d/dist/. . && git add -A
git commit -m "Publish the site" && git push   # Pages rebuilds in about a minute
cd - && git worktree remove /tmp/site
```

## Fixes carried over from the audit of the old site

- VIPTutors and Hosted Network gallery images return 404; two cards say "Coming Soon".
- MultiPortal screenshots show the Next.js dev-mode badge.
- Tailwind Play CDN in production; `hero.png` is 1.26 MB.
- No meta description / Open Graph image; nav links are `href="#"`.
