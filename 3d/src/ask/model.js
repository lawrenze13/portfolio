// Sentence vectors from a static embedding table (see scripts/build-ask-model.mjs).
// The tokenizer is BERT's uncased WordPiece, as the model was trained with:
// clean, split out CJK, strip accents, lower-case, split on spaces and
// punctuation, then greedy longest-match pieces. Unknown words are dropped.

const CONTROL = /[\p{C}]/u
const SPACE = /\s/u
const PUNCT = /[\p{P}!-/:-@[-`{-~]/u
const MAX_WORD = 100

const isCjk = (cp) =>
  (cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x3400 && cp <= 0x4dbf) || (cp >= 0x20000 && cp <= 0x2a6df) ||
  (cp >= 0x2a700 && cp <= 0x2b73f) || (cp >= 0x2b740 && cp <= 0x2b81f) || (cp >= 0x2b820 && cp <= 0x2ceaf) ||
  (cp >= 0xf900 && cp <= 0xfaff) || (cp >= 0x2f800 && cp <= 0x2fa1f)

export function words(text) {
  let s = ''
  for (const ch of text) {
    const cp = ch.codePointAt(0)
    if (cp === 0 || cp === 0xfffd || (CONTROL.test(ch) && !'\t\n\r'.includes(ch))) continue
    else if (SPACE.test(ch)) s += ' '
    else if (isCjk(cp)) s += ` ${ch} `
    else s += ch
  }
  s = s.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase()
  const out = []
  for (const chunk of s.split(' ')) {
    let word = ''
    for (const ch of chunk) {
      if (PUNCT.test(ch)) { if (word) out.push(word); out.push(ch); word = '' } else word += ch
    }
    if (word) out.push(word)
  }
  return out
}

export function createModel({ vocab, dim }, buffer) {
  const index = new Map(vocab.map((t, i) => [t, i]))
  const scales = new Float32Array(buffer, 0, vocab.length)
  const packed = new Uint8Array(buffer, vocab.length * 4, (vocab.length * dim) / 2)

  // Greedy longest-match pieces; a word with any unmatched part is unknown.
  function pieces(word) {
    const chars = Array.from(word)
    if (chars.length > MAX_WORD) return []
    const ids = []
    for (let start = 0; start < chars.length;) {
      let end = chars.length, id
      for (; end > start; end--) {
        id = index.get((start ? '##' : '') + chars.slice(start, end).join(''))
        if (id !== undefined) break
      }
      if (end === start) return []
      ids.push(id)
      start = end
    }
    return ids
  }

  const tokenize = (text) => words(text).flatMap(pieces)

  // The mean of the pieces' vectors, scaled to length 1; null when nothing is known.
  function embed(text) {
    const ids = tokenize(text)
    if (!ids.length) return null
    const v = new Float32Array(dim)
    for (const id of ids) {
      const scale = scales[id], base = (id * dim) / 2
      for (let j = 0; j < dim; j += 2) {
        const b = packed[base + j / 2]
        v[j] += ((b & 15) - 8) * scale
        v[j + 1] += ((b >> 4) - 8) * scale
      }
    }
    return unit(v)
  }

  return { tokenize, embed, vocab, dim }
}

export function unit(v) {
  let n = 0
  for (const x of v) n += x * x
  n = Math.sqrt(n) || 1
  for (let i = 0; i < v.length; i++) v[i] /= n
  return v
}

export function dot(a, b) {
  let s = 0
  for (let i = 0; i < a.length; i++) s += a[i] * b[i]
  return s
}
