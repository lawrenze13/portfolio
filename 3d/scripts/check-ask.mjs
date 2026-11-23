// Runs the Ask test questions through the same code the browser uses and
// reports how often the right project comes back. Re-run after editing the
// projects or stars: npm run check-ask
import { readFileSync } from 'node:fs'
import { buildIndex, match, FLOOR, CLOSE } from '../src/ask/index.js'
import { createModel } from '../src/ask/model.js'

const file = (p) => readFileSync(new URL(p, import.meta.url))
const meta = JSON.parse(file('../public/ask/vocab.json'))
const bin = file('../public/ask/model.bin')
const index = buildIndex(createModel(meta, bin.buffer.slice(bin.byteOffset, bin.byteOffset + bin.byteLength)))
const { questions, offTopic } = JSON.parse(file('./ask-questions.json'))

let first = 0, three = 0, loose = 0
for (const [q, want] of questions) {
  const { hits, best } = match(index, q)
  const ids = hits.map((h) => h.id)
  const ok1 = want.includes(ids[0]), ok3 = ids.some((id) => want.includes(id))
  first += ok1; three += ok3; loose += best < CLOSE
  if (!ok1) console.log(`${ok3 ? 'second' : 'MISS  '}  ${q}  →  ${hits.map((h) => `${h.id} ${h.score}`).join(', ') || 'nothing'}  (want ${want.join('/')})`)
}
const off = offTopic.map((q) => ({ q, ...match(index, q) }))
for (const o of off) if (o.best >= FLOOR) console.log(`${o.best >= CLOSE ? 'CLOSE ' : 'loose '}  off-topic "${o.q}" → ${o.hits[0].id} ${o.hits[0].score}`)
console.log(`\n${questions.length} questions: right project first ${first}, in the top three ${three}, shown as loose ${loose}`)
console.log(`${offTopic.length} off-topic: nothing shown ${off.filter((o) => o.best < FLOOR).length}, loose ${off.filter((o) => o.best >= FLOOR && o.best < CLOSE).length}, shown as close ${off.filter((o) => o.best >= CLOSE).length}`)
if (three < questions.length) process.exitCode = 1
