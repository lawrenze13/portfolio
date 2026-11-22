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
| Type | **No terminal or pixel fonts.** Pick one of three pairings in the prototype (below) |
| Navigation | Five fixed stops; menu, ← →, 1–5, scroll (one stop per gesture), swipe, `#hash` |
| Me | Low-poly 3D avatar (AI image-to-3D from my illustration, cleaned up in Blender), guiding between stops |
| Ask | "Ask the guide": a question lights the nearest points with match scores; the camera flies to the best match |
| Sound | Off by default, toggle |
| Write-ups | Full case study for the top 3, short card for the rest |
| Plain view | A new 2D site in the same identity (not the old site) |
| Positioning | Full-Stack & AI Engineer |
| Carry-over | Logo, avatar illustration and copy are raw material, nothing is locked |

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

Type pairings to choose from (switcher in the prototype, bottom-right):

1. **Bricolage Grotesque + Hanken Grotesk**: characterful grotesk, warm.
2. **Fraunces + Instrument Sans**: soft serif display against the tech palette.
3. **Archivo Expanded + Archivo**: wide, engineered, technical without being mono.

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

- Prototype: local keyword-overlap scoring, labelled as a mock.
- Real (phase 6): answers only from the case studies, cites the points it used, says
  when it does not know. Needs a small serverless function (GitHub Pages cannot hold an
  API key), a spending cap and rate limits.

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
   type switcher. Tune pacing and framing here.
2. **Look**: bloom, point sprites, subtle grain, final type pairing, motion polish.
3. **Avatar**: image-to-3D from the illustration, simplify, rig, idle / float / point.
4. **Content**: three full case studies, short cards, About facts, final copy.
5. **Plain view**: the 2D site in the same identity; meta, Open Graph, `/llms.txt`,
   `resume.json`.
6. **Ask the guide**, for real.
7. **Ship**: GitHub Pages deploy of the built site; decide paths (3D at `/`, plain at `/plain/`).

## Fixes carried over from the audit of the old site

- VIPTutors and Hosted Network gallery images return 404; two cards say "Coming Soon".
- MultiPortal screenshots show the Next.js dev-mode badge.
- Tailwind Play CDN in production; `hero.png` is 1.26 MB.
- No meta description / Open Graph image; nav links are `href="#"`.
