// Deterministic positions for everything in the cloud, computed once.
import * as THREE from 'three'
import { CLUSTERS, JOBS, PROJECTS } from './data.js'
import { POINTS } from './points.js'

function rng(seed) {
  return function () {
    seed |= 0; seed = (seed + 0x6D2B79F5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const r = rng(20261122)
const g = () => r() + r() + r() - 1.5 // roughly normal, centred on 0

const projects = {}
const fillers = []
const clusterLabel = {}
const edgePositions = []
const edgeColors = []
const colour = new THREE.Color()
const white = new THREE.Color('#ffffff')

// A constellation figure: the minimum spanning tree of its brightest stars,
// so each cluster reads as a few clean strokes rather than a web.
function figure(nodes) {
  const inTree = [0]
  const segs = []
  while (inTree.length < nodes.length) {
    let best = null
    for (const i of inTree) {
      nodes.forEach((q, j) => {
        if (inTree.includes(j)) return
        const d = nodes[i].distanceTo(q)
        if (!best || d < best[2]) best = [i, j, d]
      })
    }
    inTree.push(best[1])
    segs.push([nodes[best[0]], nodes[best[1]]])
  }
  return segs
}

for (const [key, c] of Object.entries(CLUSTERS)) {
  const centre = new THREE.Vector3(...c.centre)
  const named = PROJECTS.filter((p) => p.cluster === key)
  const nodes = []

  // Named stars sit on a loose shell so their labels don't collide.
  named.forEach((p, i) => {
    const n = named.length
    const y = n === 1 ? 0 : 1 - (2 * (i + 0.5)) / n
    const rad = Math.sqrt(1 - y * y)
    const th = i * 2.399963
    const pos = centre.clone().add(new THREE.Vector3(Math.cos(th) * rad, y * 0.75, Math.sin(th) * rad).multiplyScalar(c.spread * 0.8))
    projects[p.id] = pos
    nodes.push(pos)
  })

  // Fillers: mostly faint, a few bright, tinted towards white like real stars.
  colour.set(c.color) // each look tints it towards white as it likes
  // Each one is a real piece of work, placed in a loose swarm around the
  // project it belongs to.
  const own = []
  for (const pt of POINTS.filter((x) => x.cluster === key)) {
    const home = projects[pt.parent] || centre
    const dir = new THREE.Vector3(g(), g() * 0.7, g()).normalize()
    const pos = home.clone().addScaledVector(dir, 0.5 + r() * c.spread * 0.55)
    const mag = 0.18 + Math.pow(r(), 2.2) * 0.5
    own.push({ ...pt, pos, color: '#' + colour.getHexString(), mag })
  }
  fillers.push(...own)

  // The figure joins the named stars and the brightest few fillers.
  own.slice().sort((a, b) => b.mag - a.mag).slice(0, named.length > 2 ? 3 : 2).forEach((f) => {
    f.mag = Math.max(f.mag, 0.6) // a figure's stars are its bright ones
    nodes.push(f.pos)
  })
  colour.set(c.color).lerp(white, 0.2)
  for (const [a, b] of figure(nodes)) {
    // Stop short of each star, the way a star chart draws its lines.
    const dir = b.clone().sub(a).normalize()
    const gap = Math.min(0.24, a.distanceTo(b) * 0.2)
    const p = a.clone().addScaledVector(dir, gap)
    const q = b.clone().addScaledVector(dir, -gap)
    edgePositions.push(p.x, p.y, p.z, q.x, q.y, q.z)
    edgeColors.push(colour.r, colour.g, colour.b, colour.r, colour.g, colour.b)
  }
  clusterLabel[key] = centre.clone().add(new THREE.Vector3(0, c.spread * 1.25 + 0.3, 0)).toArray()
}

// The Path: an arc in front of the cloud, oldest on the left, newest on the right.
// JOBS is oldest first, so the last one is "Now".
const jobs = JOBS.map((_, i) => {
  const t = JOBS.length === 1 ? 1 : i / (JOBS.length - 1)
  const a = THREE.MathUtils.degToRad(150 - 120 * t)
  return new THREE.Vector3(Math.cos(a) * 8.5, -3.2 + 2.4 * t, Math.sin(a) * 8.5)
})

// The sky behind it all: mostly faint stars, a few bright ones, in real star
// colours, with a denser band like the Milky Way.
const STAR_COLOURS = [[0.1, '#c9d7ff'], [0.35, '#f4f6ff'], [0.3, '#fff3e6'], [0.15, '#ffe6c2'], [0.1, '#ffcf9e']]
const pickColour = () => {
  let x = r()
  for (const [w, hex] of STAR_COLOURS) { if ((x -= w) <= 0) return hex }
  return STAR_COLOURS[1][1]
}
const bandNormal = new THREE.Vector3(0.35, 1, 0.45).normalize()
const bandU = new THREE.Vector3(1, 0, 0).cross(bandNormal).normalize()
const bandV = bandNormal.clone().cross(bandU)
const stars = []
for (let i = 0; i < 4200; i++) {
  let d
  if (r() < 0.5) {
    const th = r() * Math.PI * 2
    const lat = g() * 0.16
    d = bandU.clone().multiplyScalar(Math.cos(th)).addScaledVector(bandV, Math.sin(th)).addScaledVector(bandNormal, lat).normalize()
  } else {
    d = new THREE.Vector3(g(), g(), g()).normalize()
  }
  stars.push({ pos: d.multiplyScalar(48 + r() * 40), color: pickColour(), mag: Math.pow(r(), 6) })
}

// Faint clouds for the Deep field look: a few per cluster, and dust along the band.
// Computed last so nothing above moves.
const nebulae = []
for (const c of Object.values(CLUSTERS)) {
  const centre = new THREE.Vector3(...c.centre)
  for (let i = 0; i < 6; i++) {
    nebulae.push({
      pos: centre.clone().add(new THREE.Vector3(g(), g() * 0.7, g()).multiplyScalar(c.spread * 0.9)).add(new THREE.Vector3(0, 0, -1.2)),
      size: c.spread * (1.6 + r() * 1.8), color: c.color, opacity: 0.018 + r() * 0.02, rotation: r() * Math.PI * 2,
    })
  }
}
const dust = []
for (let i = 0; i < 28; i++) {
  const th = r() * Math.PI * 2
  const d = bandU.clone().multiplyScalar(Math.cos(th)).addScaledVector(bandV, Math.sin(th)).addScaledVector(bandNormal, g() * 0.08).normalize()
  dust.push({ pos: d.multiplyScalar(80), size: 22 + r() * 26, color: r() < 0.5 ? '#d9cbb0' : '#a9b8d6', opacity: 0.015 + r() * 0.015, rotation: r() * Math.PI * 2 })
}

export const LAYOUT = { projects, fillers, edgePositions, edgeColors, clusterLabel, jobs, stars, nebulae, dust }
