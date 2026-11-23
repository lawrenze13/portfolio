// Keyword overlap with a few synonyms: what Ask falls back to when the
// meaning model (src/ask/) cannot load.
import { PROJECTS } from './data.js'

const norm = (w) => w.toLowerCase().replace(/[^a-z0-9+#-]/g, '').replace(/ies$/, 'y').replace(/s$/, '')

const STOPWORDS = new Set(['have', 'ha', 'you', 'built', 'build', 'any', 'the', 'a', 'an', 'do', 'did', 'doe', 'with', 'and', 'or',
  'of', 'in', 'on', 'for', 'to', 'what', 'your', 'i', 'me', 'is', 'are', 'ever', 'work', 'worked', 'done', 'something', 'about',
  'can', 'how', 'which', 'thing', 'made', 'make', 'experience', 'project', 'show'])

const SYNONYMS = {
  ai: ['llm', 'agent', 'openai', 'assistant'], llm: ['ai', 'agent', 'rag'], agent: ['orchestration', 'ai', 'tool'],
  chatbot: ['assistant', 'chat', 'rag'], test: ['testing', 'e2e', 'playwright', 'qa'], testing: ['e2e', 'playwright', 'qa'],
  qa: ['testing'], cloud: ['proxmox', 'multi-tenant', 'saas'], design: ['design-system', 'ui', 'theming'],
  ui: ['design-system', 'frontend', 'theming'], frontend: ['ui', 'vue'], backend: ['php', 'api'], payment: ['stripe', 'ecommerce'],
}

export function search(query) {
  const words = query.split(/\s+/).map(norm).filter((w) => w && !STOPWORDS.has(w))
  if (!words.length) return []
  const expanded = new Map()
  for (const w of words) {
    expanded.set(w, 1)
    for (const s of SYNONYMS[w] || []) if (!expanded.has(norm(s))) expanded.set(norm(s), 0.5)
  }
  const scored = PROJECTS.map((p) => {
    const bag = new Set([...p.tags, ...p.name.split(/\s+/), ...p.blurb.split(/\s+/)].map(norm))
    let hits = 0
    expanded.forEach((weight, w) => { if (bag.has(w)) hits += weight })
    // Divide by the size of the project's vocabulary, like a cosine similarity,
    // so a focused match outranks a broad one.
    return { id: p.id, hits: hits / Math.sqrt(bag.size) }
  }).filter((s) => s.hits > 0).sort((a, b) => b.hits - a.hits).slice(0, 3)
  const max = scored[0]?.hits || 1
  return scored.map((s) => ({ id: s.id, score: (0.62 + 0.33 * (s.hits / max)).toFixed(2) }))
}
