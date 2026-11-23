// Sound, on by default; the chip in the top bar turns it off, and that choice
// is remembered. Browsers only let sound start from a click, tap or key
// press, so it begins with the visitor's first one. All of it is made in the
// browser with the Web Audio API, so there is nothing to download: slow,
// quiet chords under the sky, a soft three-note phrase when moving between
// stops, and a small chime when a case opens or a question finds something.
import { useEffect, useRef } from 'react'

const LEVEL = 0.7 // master volume when on
const FADE_IN = 1.5
const FADE_OUT = 0.4

let ctx = null
let out = null
let space = null // the room the music and chimes play in
let armed = false
let lastMove = 0

// What the visitor wants: on unless they turned it off before.
const PREF = 'sound'
let want = (() => { try { return localStorage.getItem(PREF) !== 'off' } catch { return true } })()
const remember = () => { try { localStorage.setItem(PREF, want ? 'on' : 'off') } catch { /* private mode: not remembered */ } }
export const soundWanted = () => want

const between = (a, b) => a + Math.random() * (b - a)

// The background: slow chords that change every BAR seconds, each fading
// into the next, in the range laptop and phone speakers can play, with a
// faint high note now and then, like a star. No noise anywhere in it.
const BAR = 14
const ATTACK = 5
const RELEASE = 7
const CHORDS = [
  [110, 220, 329.63, 493.88], // A: A2 A3 E4 B4
  [92.5, 185, 277.18, 440], // F#m: F#2 F#3 C#4 A4
  [73.42, 220, 369.99, 554.37], // Dmaj7: D2 A3 F#4 C#5
  [82.41, 246.94, 369.99, 493.88], // Esus2: E2 B3 F#4 B4
]
const STARS = [880, 987.77, 1108.73, 1318.51, 1479.98] // A major pentatonic, two octaves up: fits every chord

// A soft room: the input plays dry and through a generated reverb tail.
export function room(ac, dest, { wet = 0.5, seconds = 3.5 } = {}) {
  const input = ac.createGain()
  const tail = ac.createBuffer(2, Math.floor(ac.sampleRate * seconds), ac.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = tail.getChannelData(c)
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) ** 3
  }
  const verb = ac.createConvolver()
  verb.buffer = tail
  const dark = ac.createBiquadFilter()
  dark.type = 'lowpass'
  dark.frequency.value = 3000
  const mix = ac.createGain()
  mix.gain.value = wet
  input.connect(dest)
  input.connect(verb)
  verb.connect(dark)
  dark.connect(mix)
  mix.connect(dest)
  return input
}

// One chord: each note a sine with a slightly sharp triangle beside it, so it
// shimmers gently; it swells in, holds for the bar and fades into the next.
export function chord(ac, dest, notes, t, length = BAR) {
  notes.forEach((hz, i) => {
    const level = i === 0 ? 0.03 : 0.016
    const gain = ac.createGain()
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(level, t + ATTACK)
    gain.gain.setValueAtTime(level, t + length)
    gain.gain.linearRampToValueAtTime(0, t + length + RELEASE)
    gain.connect(dest)
    for (const [type, cents] of [['sine', 0], ['triangle', 5]]) {
      const osc = ac.createOscillator()
      osc.type = type
      osc.frequency.value = hz
      osc.detune.value = cents
      osc.connect(gain)
      osc.start(t)
      osc.stop(t + length + RELEASE + 0.1)
    }
  })
}

// A single faint high note, placed somewhere left or right.
export function twinkle(ac, dest, hz, t, level = 0.02) {
  const osc = ac.createOscillator()
  osc.frequency.value = hz
  const gain = ac.createGain()
  gain.gain.setValueAtTime(0.0001, t)
  gain.gain.exponentialRampToValueAtTime(level, t + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, t + 2.5)
  osc.connect(gain)
  if (ac.createStereoPanner) {
    const pan = ac.createStereoPanner()
    pan.pan.value = between(-0.6, 0.6)
    gain.connect(pan)
    pan.connect(dest)
  } else gain.connect(dest)
  osc.start(t)
  osc.stop(t + 2.6)
}

// Returns fill(until): schedules every chord and star that starts before
// `until` (in the context's time). Chords pass through a lowpass that opens
// and closes very slowly.
export function makeAmbience(ac, dest) {
  const soft = ac.createBiquadFilter()
  soft.type = 'lowpass'
  soft.frequency.value = 1400
  const drift = ac.createOscillator()
  drift.frequency.value = 0.03
  const depth = ac.createGain()
  depth.gain.value = 500
  drift.connect(depth)
  depth.connect(soft.frequency)
  drift.start()
  soft.connect(dest)
  let next = ac.currentTime + 0.05
  let star = next + 6
  let n = 0
  return (until) => {
    for (; next < until; next += BAR) chord(ac, soft, CHORDS[n++ % CHORDS.length], next)
    for (; star < until; star += between(4, 10)) twinkle(ac, dest, STARS[Math.floor(Math.random() * STARS.length)], star)
  }
}

// A glassy bell: each note a sine with two quieter, faster-fading partials above it.
export function chime(ac, dest, notes, { at = ac.currentTime, gap = 0.09, level = 0.09, decay = 1.8 } = {}) {
  notes.forEach((hz, i) => {
    const t = at + 0.01 + i * gap
    for (const [mult, amp] of [[1, 1], [2.76, 0.25], [5.4, 0.08]]) {
      const osc = ac.createOscillator()
      osc.frequency.value = hz * mult
      const gain = ac.createGain()
      const end = t + decay / Math.sqrt(mult)
      gain.gain.setValueAtTime(0.0001, t)
      gain.gain.exponentialRampToValueAtTime(level * amp, t + 0.006)
      gain.gain.exponentialRampToValueAtTime(0.0001, end)
      osc.connect(gain)
      gain.connect(dest)
      osc.start(t)
      osc.stop(end + 0.05)
    }
  })
}

// Moving between stops: three soft mallet notes from the music's key (A major
// triad, which sits inside every chord), rising going forward, falling going back.
export function move(ac, dest, dir, { at = ac.currentTime, level = 0.05, gap = 0.07, decay = 1.4 } = {}) {
  const notes = dir > 0 ? [554.37, 659.25, 880] : [880, 659.25, 554.37]
  notes.forEach((hz, i) => {
    const t = at + 0.01 + i * gap
    const gain = ac.createGain()
    gain.gain.setValueAtTime(0.0001, t)
    gain.gain.exponentialRampToValueAtTime(level * (i === 2 ? 1 : 0.8), t + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, t + decay)
    gain.connect(dest)
    for (const [mult, amp] of [[1, 1], [2, 0.15], [3, 0.05]]) {
      const osc = ac.createOscillator()
      osc.frequency.value = hz * mult
      const partial = ac.createGain()
      partial.gain.value = amp
      osc.connect(partial)
      partial.connect(gain)
      osc.start(t)
      osc.stop(t + decay + 0.05)
    }
  })
}

// Builds the graph, inside a click or key press as browsers require.
function setup() {
  const AC = window.AudioContext || window.webkitAudioContext
  if (!AC) return false
  ctx = new AC()
  out = ctx.createGain()
  out.gain.value = 0
  out.connect(ctx.destination)
  space = room(ctx, out)
  // Keeps the music scheduled a little ahead; nothing is added while the
  // context sleeps (sound off or a background tab), as its clock stops.
  const fill = makeAmbience(ctx, space)
  const ahead = () => { if (ctx.state === 'running') fill(ctx.currentTime + 2) }
  ahead()
  setInterval(ahead, 500)
  // Quiet in a background tab.
  document.addEventListener('visibilitychange', () => {
    if (want) document.hidden ? ctx.suspend() : ctx.resume()
  })
  return true
}

// Fades towards what the visitor wants, and sleeps when off.
function apply() {
  const t = ctx.currentTime
  out.gain.cancelScheduledValues(t)
  out.gain.setValueAtTime(out.gain.value, t)
  if (want) {
    ctx.resume()
    out.gain.linearRampToValueAtTime(LEVEL, t + FADE_IN)
  } else {
    out.gain.linearRampToValueAtTime(0, t + FADE_OUT)
    setTimeout(() => { if (!want) ctx.suspend() }, FADE_OUT * 1000 + 100)
  }
}

// The chip: turns sound on or off and remembers it; returns whether it is now on.
export function toggleSound() {
  want = !want
  remember()
  if (ctx || (want && setup())) apply()
  return want
}

export const soundAvailable = () => typeof window !== 'undefined' && !!(window.AudioContext || window.webkitAudioContext)

// Sound is on by default, but can only start from the visitor's first click,
// tap or key press, so wait for it. (A press on the chip is the chip's own.)
export function armSound() {
  if (armed || !soundAvailable()) return
  armed = true
  const events = ['pointerdown', 'pointerup', 'touchend', 'keydown', 'click']
  const done = () => events.forEach((name) => window.removeEventListener(name, first, true))
  function first(e) {
    if (!want) return done()
    if (e.target?.closest?.('.chip.sound')) return
    if (!ctx) {
      if (!setup()) return done()
      apply()
    } else if (ctx.state !== 'running') apply()
    if (ctx.state === 'running') done()
  }
  events.forEach((name) => window.addEventListener(name, first, true))
}

const play = {
  move: (dir) => move(ctx, space, dir),
  open: () => chime(ctx, space, [659.25]),
  answer: (found) => chime(ctx, space, found ? [880, 1318.5] : [392], { level: found ? 0.08 : 0.06 }),
}
const cue = (name, ...args) => { if (want && ctx?.state === 'running') play[name](...args) }

// Plays the cues: a phrase when the stop changes (one at a time, however fast
// the keys), a chime when a case opens or an answer arrives.
export function useSoundCues({ stop, open, ask }) {
  useEffect(() => armSound(), [])
  const last = useRef(stop)
  useEffect(() => {
    const dir = stop - last.current
    last.current = stop
    if (dir && performance.now() - lastMove > 250) {
      lastMove = performance.now()
      cue('move', dir)
    }
  }, [stop])
  useEffect(() => { if (open) cue('open') }, [open])
  const answered = ask && !ask.pending ? ask.id : null
  const found = !!ask?.hits?.length
  useEffect(() => { if (answered) cue('answer', found) }, [answered, found])
}
