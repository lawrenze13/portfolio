// The plain view's stylesheet, inlined into the page: same tokens, type and grain as the 3D.
export const CSS = /* css */ `
:root {
  --bg: #05110C; --surface: rgba(10, 28, 20, 0.72); --line: #1A3A2A; --text: #D6F5DE; --muted: #7FA88F;
  --ai: #7CFFA4; --core: #E9F0EA; --on-accent: #04120A;
  --display: 'Bricolage Grotesque', sans-serif; --body: 'Hanken Grotesk', sans-serif;
  --wide: 1120px;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body {
  background: radial-gradient(ellipse 60% 40% at 85% 10%, rgba(124, 255, 164, 0.05), transparent 70%),
    radial-gradient(ellipse 50% 35% at 10% 55%, rgba(224, 138, 60, 0.04), transparent 70%), var(--bg);
  background-attachment: fixed;
  color: var(--text); font: 400 17px/1.65 var(--body); -webkit-font-smoothing: antialiased;
}
a { color: inherit; }
:focus-visible { outline: 2px solid var(--ai); outline-offset: 3px; border-radius: 6px; }
.sky { position: fixed; inset: 0; width: 100%; height: 100%; z-index: -1; pointer-events: none; }
.grain { position: fixed; inset: -60px; z-index: 30; pointer-events: none; opacity: 0.06; mix-blend-mode: screen;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='180' height='180'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  animation: grain 0.8s steps(5) infinite; }
@keyframes grain { 0% { transform: translate(0, 0); } 20% { transform: translate(-22px, 14px); } 40% { transform: translate(18px, -26px); }
  60% { transform: translate(-12px, -8px); } 80% { transform: translate(26px, 20px); } 100% { transform: translate(0, 0); } }
.skip { position: absolute; left: 16px; top: -80px; z-index: 40; background: var(--ai); color: var(--on-accent);
  padding: 10px 16px; border-radius: 10px; font-weight: 600; text-decoration: none; }
.skip:focus { top: 12px; }

/* Header */
.top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 16px;
  padding: 12px max(16px, calc((100% - var(--wide)) / 2)); background: rgba(5, 17, 12, 0.84);
  backdrop-filter: blur(10px); -webkit-backdrop-filter: blur(10px); border-bottom: 1px solid var(--line); }
.brand { display: flex; align-items: center; gap: 10px; color: var(--muted); font-size: 15px; text-decoration: none; margin-right: auto; }
.brand img { height: 26px; width: auto; filter: brightness(0) invert(1); opacity: 0.92; }
.top nav { display: flex; gap: 2px; }
.top nav a { color: var(--muted); text-decoration: none; font-size: 15px; padding: 6px 12px; border-radius: 999px; }
.top nav a:hover { color: var(--text); background: rgba(124, 255, 164, 0.06); }
.chip { border: 1px solid var(--line); border-radius: 999px; padding: 7px 14px; font-size: 14px; font-weight: 500;
  text-decoration: none; white-space: nowrap; }
.chip:hover { border-color: var(--muted); }

/* Type */
main { width: min(var(--wide), 100% - 32px); margin: 0 auto; }
/* A halo in the background colour keeps the sky's specks out of the words. */
main p, main h1, main h2, main h3, main h4, main dd, main li { text-shadow: 0 0 6px var(--bg), 0 0 2px var(--bg); }
section { padding-top: 112px; scroll-margin-top: 40px; }
.eyebrow { font: 600 12px/1 var(--body); letter-spacing: 0.16em; text-transform: uppercase; color: var(--ai); margin-bottom: 16px; }
h1, h2, h3, h4 { font-family: var(--display); font-weight: 700; letter-spacing: -0.03em; line-height: 1.04; }
h1 { font-size: clamp(56px, 10vw, 112px); margin-bottom: 24px; }
h2 { font-size: clamp(34px, 5.2vw, 56px); margin-bottom: 20px; max-width: 16em; }
h4 { font-size: clamp(24px, 3vw, 32px); letter-spacing: -0.02em; }
.lead { font-size: clamp(19px, 2.3vw, 23px); line-height: 1.5; max-width: 32em; }
.body { color: var(--muted); max-width: 40em; margin-top: 14px; }

/* Hero */
.hero { padding-top: clamp(72px, 14vh, 140px); min-height: min(88vh, 860px); }
.hero .body { margin-top: 12px; }
.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 32px; }
.btn { display: inline-flex; align-items: center; min-height: 46px; padding: 0 20px; border-radius: 12px;
  border: 1px solid var(--line); background: rgba(5, 17, 12, 0.6); font-weight: 600; text-decoration: none; }
.btn:hover { border-color: var(--muted); }
.btn.primary { background: var(--ai); border-color: var(--ai); color: var(--on-accent); }
.btn.primary:hover { filter: brightness(1.08); }

/* About */
.facts { display: grid; grid-template-columns: repeat(auto-fit, minmax(210px, 1fr)); gap: 12px; margin-top: 36px; }
.facts div { border: 1px solid var(--line); border-radius: 16px; padding: 20px 22px; background: var(--surface); }
.facts dt { font: 700 26px/1.15 var(--display); letter-spacing: -0.02em; }
.facts dd { color: var(--muted); margin-top: 6px; }

/* Path: a line of stars, oldest at the top */
.path { list-style: none; position: relative; margin-top: 40px; padding-left: 44px; max-width: 46em; }
.path::before { content: ''; position: absolute; left: 11px; top: 10px; bottom: 30px; width: 1px;
  background: linear-gradient(to bottom, var(--line), rgba(214, 245, 222, 0.3) 70%, var(--ai)); }
.job { position: relative; padding-bottom: 36px; }
.job:last-child { padding-bottom: 0; }
.star { position: absolute; left: -44px; top: 0; width: 23px; height: 23px; --s: #DCE6EE;
  background: radial-gradient(circle, #fff 0 9%, var(--s) 15%, transparent 48%); }
.star::before, .star::after { content: ''; position: absolute; left: 50%; top: 50%; background: linear-gradient(var(--dir), transparent, #fff, transparent); opacity: 0.55; }
.star::before { --dir: to right; width: 23px; height: 1px; transform: translate(-50%, -50%); }
.star::after { --dir: to bottom; width: 1px; height: 23px; transform: translate(-50%, -50%); }
.job.now .star { --s: var(--ai); filter: drop-shadow(0 0 8px rgba(124, 255, 164, 0.7)); }
.when { font-size: 13px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase; color: var(--muted); line-height: 23px; }
.job.now .when { color: var(--ai); }
.job h3 { font-size: clamp(24px, 3vw, 30px); letter-spacing: -0.02em; margin-top: 4px; }
.role { margin-top: 4px; }
.text { color: var(--muted); margin-top: 6px; }

/* Work */
.cluster { margin-top: 64px; }
.cluster-head { display: flex; align-items: center; gap: 12px; padding-bottom: 14px; border-bottom: 1px solid var(--line); }
.cluster-head i { width: 9px; height: 9px; border-radius: 50%; background: var(--c); box-shadow: 0 0 12px var(--c); }
.cluster-head h3 { font: 600 13px/1 var(--body); letter-spacing: 0.16em; text-transform: uppercase; color: var(--c); }
.cluster-head span { margin-left: auto; color: var(--muted); font-variant-numeric: tabular-nums; }
.case { margin-top: 20px; border: 1px solid var(--line); border-radius: 22px; background: var(--surface); padding: clamp(22px, 4vw, 44px); scroll-margin-top: 80px; }
.case .eyebrow { color: var(--c); }
.case h4 { font-size: clamp(30px, 4.4vw, 46px); }
.case .lead { margin-top: 12px; }
.kicker { color: var(--text); font-weight: 500; margin-top: 18px; max-width: 40em; }
.results { list-style: none; display: grid; grid-template-columns: repeat(auto-fit, minmax(135px, 1fr)); gap: 16px 12px; margin-top: 28px; }
.results li { border-left: 2px solid var(--c); padding: 2px 0 2px 16px; }
.results strong { display: block; font: 700 clamp(30px, 4vw, 40px)/1.05 var(--display); letter-spacing: -0.02em; color: var(--c); }
.results span { color: var(--muted); font-size: 15px; }
.sections { margin-top: 32px; }
.sections > div { display: grid; grid-template-columns: 170px 1fr; gap: 24px; padding: 20px 0; border-top: 1px solid var(--line); }
.sections dt { font-size: 12px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: var(--muted); padding-top: 4px; }
.sections dd { max-width: 42em; }
.decisions { padding-left: 20px; display: grid; gap: 10px; }
.decisions b { font-weight: 600; }
.link-out { display: inline-block; margin-top: 20px; color: var(--c); font-weight: 600; text-underline-offset: 4px; }
.cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px; margin-top: 20px; align-items: start; }
.card { border: 1px solid var(--line); border-radius: 18px; background: var(--surface); padding: 22px 24px; scroll-margin-top: 80px;
  display: flex; flex-direction: column; gap: 10px; }
.card h4 { font-size: 24px; }
.card p { color: var(--muted); }
.tags { list-style: none; display: flex; flex-wrap: wrap; gap: 6px; }
.tags li { font-size: 13px; color: var(--muted); border: 1px solid var(--line); border-radius: 999px; padding: 2px 10px; }
.more { margin-top: 8px; }
.case .more { margin-top: 24px; border-top: 1px solid var(--line); padding-top: 18px; }
.more summary { cursor: pointer; color: var(--c); font-weight: 600; font-size: 15px; list-style: none; width: fit-content; }
.more summary::-webkit-details-marker { display: none; }
.more summary::before { content: '+'; display: inline-block; width: 1.1em; }
.more[open] summary::before { content: '−'; }
.more ul { list-style: none; display: grid; gap: 12px; margin-top: 14px; }
.case .more ul { grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px 28px; }
.more li b { display: block; font-weight: 600; }
.more li span { color: var(--muted); font-size: 15px; }

/* Signal and footer */
.print-only { display: none; }
.signal { padding-bottom: 120px; }
.email { color: var(--muted); margin-top: 14px; }
footer { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 12px; border-top: 1px solid var(--line);
  padding: 24px max(16px, calc((100% - var(--wide)) / 2)); color: var(--muted); font-size: 14px; }
footer .links { display: flex; gap: 18px; }
footer a { text-underline-offset: 3px; }

@media (max-width: 760px) {
  .top nav { display: none; }
  section { padding-top: 80px; }
  .sections > div { grid-template-columns: 1fr; gap: 6px; }
  .path { padding-left: 38px; }
  .star { left: -38px; }
  .path::before { left: 11px; }
}
@media (prefers-reduced-motion: reduce) {
  html { scroll-behavior: auto; }
  .grain { animation: none; }
}
/* Printing gives a plain CV. */
@media print {
  :root { --bg: #fff; --text: #111; --muted: #444; --line: #ccc; --ai: #111; --surface: none; }
  [style*='--c'] { --c: #111 !important; }
  body { background: #fff; font-size: 10.5pt; }
  main * { text-shadow: none !important; }
  .sky, .grain, .top, .skip, .actions, footer .links { display: none !important; }
  .hero { min-height: 0; padding-top: 0; }
  .print-only { display: block; margin-top: 10px; color: #111; }
  section { padding-top: 28px; }
  h1 { font-size: 34pt; }
  h2 { font-size: 20pt; }
  .case, .card, .facts div, .job { break-inside: avoid; }
  .star { filter: none !important; }
  .brand img { filter: none; }
}
`
