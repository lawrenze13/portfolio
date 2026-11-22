# lawrenzem.space: 3D data-centre portfolio

The portfolio becomes a small, stylised data centre. The camera flies between five
fixed stops, a low-poly version of me guides the visitor, and every project is a
server rack you can open. The current site stays as the **plain view** fallback.

## Decisions (22 Nov 2026)

| Area | Decision |
|---|---|
| Navigation | Five fixed stops; menu, ← →, 1–5, scroll (one stop per gesture), swipe |
| Home | Outside: the hall as a floating cut-away block, then fly in |
| Me | Low-poly 3D avatar (AI image-to-3D from my illustration, cleaned up in Blender); guides between stops |
| Contact | Terminal with clickable commands; typing optional |
| Sound | Off by default, toggle |
| Projects | One hot aisle, two rows: **AI** and **Platform** |
| Write-ups | Full case study for the top 3, short card for the rest |
| Positioning | Full-Stack & AI Engineer |

## Floor plan

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   (3) EXPERIENCE - overhead cable tray, newest first           │
│   NOW ●─────●─────●─────●─────●─────●─────● 2018               │
│                                                                │
│   (2) ABOUT          (4) PROJECTS - one hot aisle, two rows    │
│   ops desk +         AI row    [VIP][AIO][MAX][PRT][ORK]       │
│   3 wall monitors     · · · · · aisle, avatar leads → · · ·    │
│                      Platform  [MP ][HNT][UIK][THB][VRD][FRL]  │
│                                                                │
│                 (5) CONTACT                                    │
│                 terminal on a crash cart                       │
│                                                                │
└───────────────────────────── ▲ ────────────────────────────────┘
                              (1) HOME
             outside: the hall as a floating cut-away block;
             the avatar waves at the door, then leads you in
```

## Stops

| Stop | Camera sees | Overlay (HTML) | Interaction |
|---|---|---|---|
| 1 Home | Hall as a floating cut-away block | Hello / name / Full-Stack & AI Engineer / pitch / Enter | Enter, click, scroll or → flies in |
| 2 About | Ops desk, three wall monitors (years, AI, stack) | Short bio + quote | Hover a monitor for detail |
| 3 Experience | Cable tray, one junction box per job | Card for the selected role | ↑ ↓ / scroll moves along the tray, then on to the next stop |
| 4 Projects | Hot aisle, AI row + Platform row | Small hint only | Hover lights a rack; click opens it into a case study |
| 5 Contact | Terminal close-up | Terminal: contact, cv, github, linkedin | Click or type commands; copy email |

## Racks

| Row | Racks (★ = full case study) |
|---|---|
| AI | ★ VIPTutors AI Suite, ★ LawStack aiops, Max, Porto, ORKESTRA |
| Platform | ★ MultiPortal, Hosted Network Tools, UI kit, TestHub, LawStack verdict, a freelance build |

Employer-owned work (MultiPortal, Hosted Network Tools, Porto, Max, ORKESTRA, TestHub,
UI kit) needs the employer's OK, generic screenshots with test data only, and no internal
architecture detail.

A full case study is: problem, my role, decisions, result (with numbers), a 60-second
walkthrough, screenshots. AI case studies also show prompt/agent design, evaluation,
guardrails and failure handling, and cost/latency.

## Showing AI engineering

1. The AI row is visibly different (GPU racks, their own glow).
2. **Ask the guide** (phase 2): a grounded Q&A where the avatar walks to the rack that
   answers. Answers only from the case studies, cites the rack, says when it does not
   know. Needs a small serverless function (GitHub Pages cannot hold an API key), a
   spending cap and rate limits.
3. One About monitor covers AI work; hero says Full-Stack & AI Engineer.
4. `/llms.txt` and `resume.json` so AI screening tools read the profile correctly.
5. Job titles stay as they were; the AI identity comes from the work shown.

## Interaction map

| Input | Does |
|---|---|
| Menu, 1–5 | Fly to that stop |
| → ←, swipe, scroll | Next / previous stop (one per gesture) |
| ↑ ↓ / scroll at Experience | Move along the timeline first |
| Click a rack | Open its case study; Esc or ✕ closes; ← → moves between racks |
| `?` | Controls |
| Plain view | The 2D site |

States: loading (progress + "Skip → plain view"), reduced motion (cut, don't fly),
no WebGL (plain view), deep links (`/#projects` lands at stop 4).

## Phases

1. **Grey-box** (`3d/`): blocks at the real positions, capsule avatar, camera flights,
   grey overlay panels, keyboard / scroll / swipe / hash navigation. Tune pacing here.
2. **Art**: model the hall and racks in Blender, bake lighting, apply the palette
   (charcoal `#222831`, cream `#DFD0B8`, steel blue `#7A9BB5`, amber accents),
   compress with `gltfjsx --transform`.
3. **Avatar**: image-to-3D from the illustration, simplify, rig, idle/walk/point.
4. **Content**: three full case studies, short cards, About numbers, terminal commands.
5. **Polish**: loader, light bloom, sound toggle, mobile tuning, reduced motion, plain
   view, meta/Open Graph, `/llms.txt`.
6. **Ask the guide**.
7. **Ship**: decide deployment (3D at `/`, current site at `/plain/`).

## Fixes carried over from the audit of the current site

- VIPTutors and Hosted Network gallery images return 404; two cards say "Coming Soon".
- MultiPortal screenshots show the Next.js dev-mode badge.
- Tailwind Play CDN in production; `hero.png` is 1.26 MB.
- No meta description / Open Graph image; nav links are `href="#"`.
- Mobile hero: the split panel runs through the text; scroll dots overlap it.
