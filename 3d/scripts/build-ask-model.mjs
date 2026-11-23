// Builds the files Ask matches questions with: public/ask/model.bin and
// public/ask/vocab.json. Run it once (npm run ask-model) and commit the output;
// the site build never downloads anything.
//
// The model is potion-base-8M by Minish Lab (MIT): static word-piece vectors
// distilled from bge-base-en-v1.5. A sentence's vector is the mean of its
// pieces' vectors, so matching needs no runtime, just a table lookup.
// To keep the download small each row is stored as 4-bit integers with one
// float scale.
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const REPO = 'minishlab/potion-base-8M'
const REVISION = 'bf8b056651a2c21b8d2565580b8569da283cab23'
const BITS = 4
const LEVEL = 2 ** (BITS - 1) - 1 // 7: values run -7..7

const root = fileURLToPath(new URL('..', import.meta.url))
const cache = root + 'node_modules/.cache/ask-model/'
const out = root + 'public/ask/'

async function fetchFile(name) {
  const path = cache + name
  if (!existsSync(path)) {
    const res = await fetch(`https://huggingface.co/${REPO}/resolve/${REVISION}/${name}`)
    if (!res.ok) throw new Error(`${name}: HTTP ${res.status}`)
    await writeFile(path, Buffer.from(await res.arrayBuffer()))
  }
  return readFile(path)
}

await mkdir(cache, { recursive: true })
await mkdir(out, { recursive: true })
const config = JSON.parse(await fetchFile('config.json'))
const tokenizer = JSON.parse(await fetchFile('tokenizer.json'))
const tensors = await fetchFile('model.safetensors')

// src/ask/model.js implements exactly this tokenizer; stop if the model changes it.
const expect = (what, got, want) => {
  if (JSON.stringify(got) !== JSON.stringify(want)) throw new Error(`${what}: expected ${JSON.stringify(want)}, got ${JSON.stringify(got)}`)
}
expect('normalizer', tokenizer.normalizer, { type: 'BertNormalizer', clean_text: true, handle_chinese_chars: true, strip_accents: null, lowercase: true })
expect('pre_tokenizer', tokenizer.pre_tokenizer, { type: 'BertPreTokenizer' })
const { vocab, ...wordpiece } = tokenizer.model
expect('model', wordpiece, { type: 'WordPiece', unk_token: '[UNK]', continuing_subword_prefix: '##', max_input_chars_per_word: 100 })
expect('normalize', config.normalize, true)

// safetensors: an 8-byte header length, a JSON header, then the raw tensor.
const headerLength = Number(tensors.readBigUInt64LE(0))
const header = JSON.parse(tensors.subarray(8, 8 + headerLength).toString('utf8'))
const { dtype, shape: [rows, dim], data_offsets: [start] } = header.embeddings
expect('dtype', dtype, 'F32')
const body = 8 + headerLength + start
const table = new Float32Array(tensors.buffer.slice(tensors.byteOffset + body, tensors.byteOffset + body + rows * dim * 4))

// Every piece but the special tokens, which never come out of a sentence:
// the reference model drops [UNK] too.
const pieces = Object.entries(vocab).sort((a, b) => a[1] - b[1])
expect('vocabulary size', pieces.length, rows)
const keep = pieces.filter(([t]) => !/^\[(PAD|UNK|CLS|SEP|MASK)\]$/.test(t))

const scales = new Float32Array(keep.length)
const packed = new Uint8Array(keep.length * dim / 2)
keep.forEach(([, id], r) => {
  const row = table.subarray(id * dim, (id + 1) * dim)
  let max = 0
  for (const x of row) max = Math.max(max, Math.abs(x))
  const scale = max / LEVEL || 1
  scales[r] = scale
  for (let j = 0; j < dim; j += 2) {
    const q = (x) => Math.max(-LEVEL, Math.min(LEVEL, Math.round(x / scale))) + 8
    packed[(r * dim + j) / 2] = q(row[j]) | (q(row[j + 1]) << 4)
  }
})

await writeFile(out + 'model.bin', Buffer.concat([Buffer.from(scales.buffer), Buffer.from(packed.buffer)]))
await writeFile(out + 'vocab.json', JSON.stringify({
  model: `${REPO}@${REVISION.slice(0, 7)}`, licence: 'MIT, Minish Lab', dim, bits: BITS, vocab: keep.map(([t]) => t),
}))
console.log(`ask model: ${keep.length} of ${rows} pieces, ${dim} dims, ${BITS}-bit, ${((scales.byteLength + packed.byteLength) / 1e6).toFixed(1)} MB`)
