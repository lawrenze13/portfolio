// The plain view: the same content as the 3D as one static page that needs no
// JavaScript or WebGL, for phones, recruiters and search engines. Also renders
// llms.txt, resume.json and the head tags both pages share. Run by the
// plain-view plugin in vite.config.js, in dev and at build time.
import { ABOUT, CLUSTERS, CONTACT, INTRO, JOBS, PROJECTS, SITE_URL, SKILLS, WORK_HEADING, countWord } from '../data.js'
import { POINTS } from '../points.js'
import { CSS } from './styles.js'

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ESC[c])
const NAV = [['about', 'About'], ['path', 'Path'], ['work', 'Work'], ['signal', 'Signal']]
const FONTS = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Hanken+Grotesk:wght@400;500;600&display=swap'
const OG_IMAGE = `${SITE_URL}/og.jpg`

// Meta, link preview and fonts, shared by the 3D page (/) and the plain view (/plain/).
export function headTags({ path, icon }) {
  const title = `${INTRO.name} · ${INTRO.title}`
  const person = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: INTRO.name,
    jobTitle: INTRO.title,
    url: SITE_URL + '/',
    email: 'mailto:' + CONTACT.email,
    sameAs: [CONTACT.github, CONTACT.linkedin],
    address: { '@type': 'PostalAddress', addressCountry: 'PH' },
  }
  return `<title>${esc(title)}</title>
  <meta name="description" content="${esc(INTRO.description)}">
  <link rel="canonical" href="${SITE_URL}${path}">
  <meta name="theme-color" content="#05110C">
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="lawrenzem.space">
  <meta property="og:title" content="${esc(title)}">
  <meta property="og:description" content="${esc(INTRO.description)}">
  <meta property="og:url" content="${SITE_URL}${path}">
  <meta property="og:image" content="${OG_IMAGE}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="${esc(INTRO.name)}, ${esc(INTRO.title)}: a field of stars, one for each thing built.">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="${icon}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${FONTS}" rel="stylesheet">
  <script type="application/ld+json">${JSON.stringify(person).replace(/</g, '\\u003c')}</script>`
}

// A still sky behind the page: the same seeded stars every build.
function sky() {
  let a = 20261122
  const r = () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const tints = ['#FFFFFF', '#FFFFFF', '#FFFFFF', '#DCE6EE', '#FFE9C7', '#CFE0FF']
  let stars = ''
  for (let i = 0; i < 170; i++) {
    const m = r() ** 4
    const x = (r() * 1000).toFixed(1)
    const y = (r() * 1000).toFixed(1)
    const tint = tints[Math.floor(r() * tints.length)]
    stars += `<circle cx="${x}" cy="${y}" r="${(0.3 + m * 0.75).toFixed(2)}" fill="${tint}" opacity="${(0.12 + m * 0.45).toFixed(2)}"/>`
  }
  return `<svg class="sky" viewBox="0 0 1000 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false">${stars}</svg>`
}

const buttons = (extra = '') => `<div class="actions">
      <a class="btn primary" href="mailto:${esc(CONTACT.email)}">Email me</a>
      <a class="btn" href="${esc(CONTACT.github)}" rel="noopener">GitHub</a>
      <a class="btn" href="${esc(CONTACT.linkedin)}" rel="noopener">LinkedIn</a>${extra}
    </div>`

function job(j) {
  const now = j.when === 'Now'
  return `<li class="job${now ? ' now' : ''}">
        <span class="star" aria-hidden="true"></span>
        <p class="when">${esc(j.when)}</p>
        <h3>${esc(j.company)}</h3>
        <p class="role">${esc(j.role)}</p>
        <p class="text">${esc(j.text)}</p>
      </li>`
}

// The small stars around a project, folded away so the page stays short.
function more(p) {
  const pts = POINTS.filter((x) => x.parent === p.id)
  if (!pts.length) return ''
  const n = pts.length === 1 ? '1 more thing' : `${pts.length} more things`
  return `<details class="more">
          <summary>${n} in ${esc(p.name)}</summary>
          <ul>${pts.map((x) => `<li><b>${esc(x.name)}</b><span>${esc(x.line)}</span></li>`).join('')}</ul>
        </details>`
}

const tags = (p) => `<ul class="tags" aria-label="Topics">${p.tags.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>`

function caseStudy(p) {
  const s = p.story
  const c = CLUSTERS[p.cluster]
  return `<article class="case" id="${p.id}">
        <p class="eyebrow">${esc(c.label)} · Case study</p>
        <h4>${esc(p.name)}</h4>
        <p class="lead">${esc(p.blurb)}</p>
        ${s.kicker ? `<p class="kicker">${esc(s.kicker)}</p>` : ''}
        <ul class="results">${s.result.map(([n, l]) => `<li><strong>${esc(n)}</strong><span>${esc(l)}</span></li>`).join('')}</ul>
        <dl class="sections">
          <div><dt>Problem</dt><dd>${esc(s.problem)}</dd></div>
          <div><dt>My role</dt><dd>${esc(s.role)}</dd></div>
          <div><dt>How it works</dt><dd>${esc(s.how)}</dd></div>
          <div><dt>Decisions</dt><dd><ol class="decisions">${s.decisions.map(([h, t]) => `<li><b>${esc(h)}.</b> ${esc(t)}</li>`).join('')}</ol></dd></div>
          <div><dt>Stack</dt><dd>${esc(s.stack)}</dd></div>
        </dl>
        ${s.link ? `<p><a class="link-out" href="${esc(s.link[1])}" rel="noopener">${esc(s.link[0])} ↗</a></p>` : ''}
        ${more(p)}
      </article>`
}

function card(p) {
  return `<article class="card" id="${p.id}">
          <h4>${esc(p.name)}</h4>
          <p>${esc(p.blurb)}</p>
          ${tags(p)}
          ${more(p)}
        </article>`
}

function cluster([key, c]) {
  const list = PROJECTS.filter((p) => p.cluster === key)
  const featured = list.filter((p) => p.story)
  const rest = list.filter((p) => !p.story)
  return `<div class="cluster" style="--c:${c.color}">
      <div class="cluster-head"><i aria-hidden="true"></i><h3>${esc(c.label)}</h3><span>${list.length}</span></div>
      ${featured.map(caseStudy).join('\n      ')}
      ${rest.length ? `<div class="cards">${rest.map(card).join('')}</div>` : ''}
    </div>`
}

export function renderPlain() {
  const [first, ...last] = INTRO.name.split(' ')
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  ${headTags({ path: '/plain/', icon: '../logo.png' })}
  <style>${CSS}</style>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  ${sky()}
  <header class="top">
    <a class="brand" href="#top"><img src="../logo.png" alt="" height="26"><span>lawrenzem.space</span></a>
    <nav aria-label="Sections">${NAV.map(([id, l]) => `<a href="#${id}">${l}</a>`).join('')}</nav>
    <a class="chip" href="../">View in 3D</a>
  </header>
  <main id="main">
    <section class="hero" id="top">
      <p class="eyebrow">${esc(INTRO.title)}</p>
      <h1>${esc(first)}<br>${esc(last.join(' '))}</h1>
      <p class="lead">${esc(INTRO.lead)}</p>
      <p class="body">${esc(CONTACT.where)}</p>
      ${buttons()}
      <p class="print-only">${[CONTACT.email, CONTACT.github, CONTACT.linkedin].map((u) => esc(u.replace(/^https:\/\/(www\.)?/, '').replace(/\/$/, ''))).join(' · ')}</p>
    </section>

    <section id="about">
      <p class="eyebrow">02 · About</p>
      <h2>${esc(ABOUT.heading)}</h2>
      ${ABOUT.body.map((t) => `<p class="body">${esc(t)}</p>`).join('\n      ')}
      <dl class="facts">${ABOUT.facts.map(([k, d]) => `<div><dt>${esc(k)}</dt><dd>${esc(d)}</dd></div>`).join('')}</dl>
    </section>

    <section id="path">
      <p class="eyebrow">03 · Path</p>
      <h2>From ${esc(JOBS[0].when)} to now</h2>
      <ol class="path">
      ${JOBS.map(job).join('\n      ')}
      </ol>
    </section>

    <section id="work">
      <p class="eyebrow">04 · Work</p>
      <h2>${esc(WORK_HEADING)}</h2>
      <p class="body">${countWord(PROJECTS.filter((p) => p.story).length)} in depth, the rest in short. Open any of them for the smaller things inside.</p>
      ${Object.entries(CLUSTERS).map(cluster).join('\n    ')}
    </section>

    <section id="signal" class="signal">
      <p class="eyebrow">05 · Signal</p>
      <h2>${esc(CONTACT.heading)}</h2>
      <p class="body">${esc(CONTACT.where)}</p>
      ${buttons()}
      <p class="email">${esc(CONTACT.email)}</p>
    </section>
  </main>
  <footer>
    <p>© ${new Date().getFullYear()} ${esc(INTRO.name)}</p>
    <p class="links"><a href="../">3D view</a><a href="../llms.txt">llms.txt</a><a href="../resume.json">resume.json</a></p>
  </footer>
  <div class="grain" aria-hidden="true"></div>
</body>
</html>
`
}

// GitHub Pages serves this for any missing address, at any depth, so every
// link in it starts from the site root.
export function render404() {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Not found · lawrenzem.space</title>
  <meta name="robots" content="noindex">
  <meta name="theme-color" content="#05110C">
  <link rel="icon" href="/logo.png">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${FONTS}" rel="stylesheet">
  <style>${CSS}</style>
</head>
<body>
  ${sky()}
  <header class="top">
    <a class="brand" href="/"><img src="/logo.png" alt="" height="26"><span>lawrenzem.space</span></a>
  </header>
  <main id="main">
    <section class="hero">
      <p class="eyebrow">404 · Not found</p>
      <h1>Nothing out<br>this way.</h1>
      <p class="lead">There's no page at this address. Everything I've built is in the sky, or in the plain view.</p>
      <div class="actions">
        <a class="btn primary" href="/">Back to the sky</a>
        <a class="btn" href="/plain/">Plain view</a>
      </div>
    </section>
  </main>
  <div class="grain" aria-hidden="true"></div>
</body>
</html>
`
}

// llms.txt (llmstxt.org): a short Markdown map of the site for AI tools.
export function renderLlms() {
  const url = (p) => `${SITE_URL}/plain/#${p.id}`
  const featured = PROJECTS.filter((p) => p.story)
  const rest = PROJECTS.filter((p) => !p.story)
  return `# ${INTRO.name}

> ${INTRO.title}. ${INTRO.lead} ${CONTACT.where}

${ABOUT.body.join('\n\n')}

## Case studies

${featured.map((p) => `- [${p.name}](${url(p)}): ${p.blurb} ${p.story.result.map(([n, l]) => `${n} ${l}`).join('; ')}.`).join('\n')}

## Other work

${rest.map((p) => `- [${p.name}](${url(p)}): ${p.blurb}`).join('\n')}

## Experience, oldest first

${JOBS.map((j) => `- ${j.when}: ${j.company}, ${j.role}. ${j.text}`).join('\n')}

## Contact

- [Email](mailto:${CONTACT.email})
- [GitHub](${CONTACT.github})
- [LinkedIn](${CONTACT.linkedin})

## Optional

- [Résumé as JSON Resume](${SITE_URL}/resume.json)
- [The 3D portfolio](${SITE_URL}/)
`
}

// resume.json in the JSON Resume format (jsonresume.org). Work is newest first,
// as résumé tools expect; a job's year is its start year.
export function renderResume() {
  const resume = {
    $schema: 'https://raw.githubusercontent.com/jsonresume/resume-schema/v1.0.0/schema.json',
    basics: {
      name: INTRO.name,
      label: INTRO.title,
      email: CONTACT.email,
      url: SITE_URL + '/',
      summary: `${INTRO.lead} ${ABOUT.body.join(' ')}`,
      location: { countryCode: 'PH' },
      profiles: [
        { network: 'GitHub', username: CONTACT.github.split('/').filter(Boolean).pop(), url: CONTACT.github },
        { network: 'LinkedIn', username: CONTACT.linkedin.split('/').filter(Boolean).pop(), url: CONTACT.linkedin },
      ],
    },
    work: [...JOBS].reverse().map((j) => ({
      name: j.company,
      position: j.role,
      ...(j.when === 'Now' ? {} : { startDate: j.when }),
      summary: j.text,
    })),
    projects: PROJECTS.map((p) => ({
      name: p.name,
      description: p.blurb,
      ...(p.story ? { highlights: p.story.result.map(([n, l]) => `${n} ${l}`) } : {}),
      keywords: p.tags,
      url: p.story?.link ? p.story.link[1] : `${SITE_URL}/plain/#${p.id}`,
    })),
    skills: SKILLS,
    meta: { canonical: `${SITE_URL}/resume.json`, version: 'v1.0.0' },
  }
  return JSON.stringify(resume, null, 2) + '\n'
}
