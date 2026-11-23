// Ask: matches a question to the projects and small stars by meaning, in the
// visitor's browser. Nothing typed is sent anywhere. The model files load the
// first time someone reaches for the Ask box.
import { PROJECTS } from '../data.js'
import { POINTS } from '../points.js'
import { createModel, dot, unit, words } from './model.js'

// What some tags and short forms stand for. Passages and questions both get the
// words written out, so "LLMs" and "large language models" find the same work.
// Used for matching only; never shown.
const SAYS = {
  rag: 'retrieval-augmented generation, answers grounded in documents',
  llm: 'large language models',
  mcp: 'Model Context Protocol tools',
  translations: 'translations, internationalisation, localisation, languages',
  e2e: 'end-to-end tests',
  ci: 'continuous integration pipelines',
  msp: 'managed service providers',
  telco: 'telecommunications carriers',
  saas: 'software as a service',
  qa: 'quality assurance',
  'dark-mode': 'dark mode',
  'design-system': 'design system',
  guardrails: 'guardrails, safety, human approval',
}

// Below FLOOR nothing is close enough to show; below CLOSE the best match is
// only loosely related. Set from 55 test questions and 18 off-topic ones.
export const FLOOR = 0.3
export const CLOSE = 0.4
const BLEND = 0.3 // how much of its project's description each passage carries
const EXACT = 0.15 // bonus when the question's own words appear in a passage
const MAX_HITS = 3
const BEHIND = 0.25 // a match this far behind the best is left out
const MAX_CITES = 4

// Words too common in questions to count as an exact match.
const STOP = new Set(('a an and are about any can did do does done ever for from has have how i in is it me my of on or the to ' +
  'what which who with you your built build made make worked work anything something tell experience').split(' '))
// Plurals count as the word: agents finds agent, policies finds policy.
const stem = (w) => (w.length > 4 && w.endsWith('ies') ? w.slice(0, -3) + 'y' : w.length > 3 && /[^s]s$/.test(w) ? w.slice(0, -1) : w)
const terms = (text) => words(text).filter((w) => /[a-z0-9]/.test(w) && !STOP.has(w)).map(stem)

function passages() {
  const out = []
  for (const p of PROJECTS) {
    const s = p.story || {}
    out.push({ id: p.id, text: `${p.name}: ${p.blurb}` })
    out.push({ id: p.id, text: p.tags.map((t) => (SAYS[t] ? `${t} (${SAYS[t]})` : t)).join(', ') })
    for (const k of ['kicker', 'problem', 'how', 'stack']) if (s[k]) out.push({ id: p.id, text: s[k] })
    for (const [title, text] of s.decisions || []) out.push({ id: p.id, text: `${title}. ${text}` })
  }
  for (const pt of POINTS) out.push({ id: pt.parent, point: pt.name, text: `${pt.name}. ${pt.line}` })
  return out
}

// Builds the index from a loaded model. Exported for the tests.
export function buildIndex(model) {
  const list = passages()
  const about = Object.fromEntries(PROJECTS.map((p) => [p.id, model.embed(`${p.name}: ${p.blurb}`)]))
  for (const item of list) {
    const v = model.embed(item.text)
    for (let i = 0; i < v.length; i++) v[i] += BLEND * about[item.id][i]
    item.vec = unit(v)
    item.words = new Set(terms(item.text))
  }
  return { model, list }
}

// Similarity of meaning, plus a little for each of the question's own words
// the passage uses, so a name like Next.js or PayMongo finds where it is written.
// { hits: [{ id, score, via }], cites: [point names], best }
export function match({ model, list }, query) {
  const asked = terms(query)
  const q = model.embed([query, ...asked.filter((w) => SAYS[w]).map((w) => SAYS[w])].join('. '))
  if (!q) return { hits: [], cites: [], best: 0 }
  const exact = (item) => (asked.length ? asked.filter((w) => item.words.has(w)).length / asked.length : 0)
  const scored = list.map((item) => ({ ...item, score: dot(q, item.vec) + EXACT * exact(item) }))
    .sort((a, b) => b.score - a.score)
  const best = scored[0].score
  const top = new Map()
  for (const item of scored) if (!top.has(item.id)) top.set(item.id, item)
  const hits = [...top.values()].filter((h) => h.score >= Math.max(FLOOR, best - BEHIND)).slice(0, MAX_HITS)
    .map((h) => ({ id: h.id, score: Math.min(h.score, 0.99).toFixed(2), via: h.point || null }))
  const shown = new Set(hits.map((h) => h.id))
  const cites = scored.filter((s) => s.point && shown.has(s.id) && s.score >= Math.max(FLOOR, best - 0.12))
    .slice(0, MAX_CITES).map((s) => s.point)
  return { hits, cites, best }
}

let loading = null

async function load() {
  const at = (name) => new URL(`ask/${name}`, document.baseURI)
  const get = async (name) => {
    const res = await fetch(at(name))
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`)
    return res
  }
  const [meta, buffer] = await Promise.all([
    get('vocab.json').then((r) => r.json()),
    get('model.bin').then((r) => r.arrayBuffer()),
  ])
  if (buffer.byteLength !== meta.vocab.length * (4 + meta.dim / 2)) throw new Error('model.bin does not match vocab.json')
  return buildIndex(createModel(meta, buffer))
}

// Starts loading the model; safe to call often. A failed load can be retried.
export function warm() {
  loading ||= load().catch((e) => { loading = null; throw e })
  return loading
}

export async function ask(query) {
  return match(await warm(), query)
}
