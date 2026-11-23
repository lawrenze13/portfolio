import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../data.js'

// Meteors: every few seconds a short streak burns across the sky, out among
// the far stars. Each starts and ends in the open part of the view (beside
// the text on a desktop, above it on a phone), keeps to the sky while the
// camera moves, and holds off while a case study is open.
const SLOTS = 3
const DIST = 60 // how far out they burn, among the sky's stars
const HALF = 4 // CSS pixels from the centre line to the edge of the quad
const COLOURS = ['#EAF4FF', '#EAF4FF', '#EAF4FF', '#DDFBE8', PALETTE.ai] // mostly white; some burn green
const between = (a, b) => a + Math.random() * (b - a)

const vertexShader = /* glsl */ `
  attribute vec2 aUv;
  attribute float aAlpha;
  attribute float aLen;
  attribute vec3 aColor;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vLen;
  varying vec3 vColor;
  void main() {
    vUv = aUv;
    vAlpha = aAlpha;
    vLen = aLen;
    vColor = aColor;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

// Worked in device pixels so nothing gets thinner than a pixel: a sub-pixel
// line shimmers as it moves. u runs from the tail (0) to the head (1) and a
// little past it for the rounded tip; v runs across (-1 to 1).
const fragmentShader = /* glsl */ `
  uniform float uPx;
  uniform float uHalf;
  varying vec2 vUv;
  varying float vAlpha;
  varying float vLen;
  varying vec3 vColor;
  void main() {
    float back = (1.0 - vUv.x) * vLen; // pixels behind the head; negative ahead of it
    float t = clamp(back / vLen, 0.0, 1.0);
    float y = vUv.y * uHalf;
    float r2 = y * y + (back < 0.0 ? back * back : 0.0);
    float sigma = max(mix(0.85, 0.55, t) * uPx, 0.7);
    float core = exp(-0.5 * r2 / (sigma * sigma)) * pow(1.0 - t, 1.8);
    float glowR = 2.4 * uPx;
    float glow = 0.18 * exp(-0.5 * r2 / (glowR * glowR)) * pow(1.0 - t, 3.0);
    float headR = 4.0 * uPx;
    float head = exp(-0.5 * max(back, 0.0) * max(back, 0.0) / (headR * headR));
    float a = (core + glow) * vAlpha;
    if (a < 0.003) discard;
    gl_FragColor = vec4(vColor * (0.9 + 1.5 * head), a);
    #include <colorspace_fragment>
  }
`

export function Meteors({ reduced, quiet }) {
  const gl = useThree((s) => s.gl)
  const mesh = useRef()
  const wait = useRef(1.5) // the first comes soon after the page opens
  const slots = useMemo(() => Array.from({ length: SLOTS }, () => ({
    active: false, t: 0, dur: 1, start: new THREE.Vector3(), path: new THREE.Vector3(), trail: 0,
  })), [])
  const tmp = useMemo(() => ({
    head: new THREE.Vector3(), tail: new THREE.Vector3(), tip: new THREE.Vector3(), side: new THREE.Vector3(),
    eye: new THREE.Vector3(), dir: new THREE.Vector3(), ndc: new THREE.Vector3(),
  }), [])

  const { geometry, material } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const index = []
    for (let i = 0; i < SLOTS; i++) {
      const o = i * 4
      index.push(o, o + 2, o + 1, o + 2, o + 3, o + 1)
    }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(SLOTS * 12), 3))
    geo.setAttribute('aUv', new THREE.BufferAttribute(new Float32Array(SLOTS * 8), 2))
    geo.setAttribute('aAlpha', new THREE.BufferAttribute(new Float32Array(SLOTS * 4), 1))
    geo.setAttribute('aLen', new THREE.BufferAttribute(new Float32Array(SLOTS * 4).fill(1), 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(new Float32Array(SLOTS * 12), 3))
    geo.setIndex(index)
    const mat = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide, uniforms: { uPx: { value: 1 }, uHalf: { value: HALF } },
    })
    return { geometry: geo, material: mat }
  }, [])
  useLayoutEffect(() => {
    material.uniforms.uPx.value = gl.getPixelRatio()
    material.uniforms.uHalf.value = HALF * gl.getPixelRatio()
  }, [gl, material])

  // A point DIST out along the line of sight through a spot on the screen.
  const atScreen = (camera, x, y, out) => {
    tmp.ndc.set(x, y, 0.5).unproject(camera).sub(camera.position).normalize()
    return out.copy(camera.position).addScaledVector(tmp.ndc, DIST)
  }

  function spawn(camera, size) {
    const m = slots.find((s) => !s.active)
    if (!m) return
    // The open sky, in screen units (-1 to 1): right of the text on a desktop,
    // above it on a phone. The whole flight stays inside it.
    const phone = size.width < 760
    const box = phone ? { x0: -0.9, x1: 0.9, y0: 0.05, y1: 0.9 } : { x0: -0.2, x1: 0.95, y0: -0.7, y1: 0.9 }
    const aspect = size.width / size.height
    const angle = between(0.25, 0.8) // 15° to 45° below level
    let reach = between(0.35, 0.65) * (phone ? 1.6 : 1) // in widths of half the screen
    let x = between(box.x0, box.x1), y = between(box.y0 + 0.3, box.y1)
    let dx = Math.cos(angle) * reach, dy = -Math.sin(angle) * reach * aspect
    if (x + dx > box.x1 || (x - dx >= box.x0 && Math.random() < 0.5)) dx = -dx // head the way there is room
    const fit = Math.min(1, dx > 0 ? (box.x1 - x) / dx : (box.x0 - x) / dx, (y - box.y0) / -dy)
    dx *= fit; dy *= fit
    if (Math.hypot(dx, dy / aspect) < 0.15) return // no room: skip this one
    atScreen(camera, x, y, m.start)
    atScreen(camera, x + dx, y + dy, m.path).sub(m.start)
    m.trail = m.path.length() * between(0.3, 0.5)
    m.dur = between(0.7, 1.3)
    m.t = 0
    m.active = true
    const c = new THREE.Color(COLOURS[Math.floor(Math.random() * COLOURS.length)])
    const i = slots.indexOf(m)
    for (let k = 0; k < 4; k++) c.toArray(geometry.attributes.aColor.array, (i * 4 + k) * 3)
    geometry.attributes.aColor.needsUpdate = true
  }

  if (import.meta.env.DEV) window.__meteors = { spawn: () => (wait.current = 0), slots, mesh, wait }

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const { camera, size } = state
    if (!reduced && !quiet) {
      wait.current -= dt
      if (wait.current <= 0) {
        spawn(camera, size)
        wait.current = between(2.5, 7)
      }
    }
    const { position: P, aUv: U, aAlpha: A, aLen: L } = geometry.attributes
    const perPx = (2 * DIST * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)) / size.height // world units per CSS pixel
    const half = HALF * perPx
    slots.forEach((m, i) => {
      let a = 0
      if (m.active) {
        m.t += dt
        const k = m.t / m.dur
        if (k >= 1) m.active = false
        else {
          const { head, tail, tip, side, eye, dir } = tmp
          head.copy(m.start).addScaledVector(m.path, Math.pow(k, 0.85)) // fast, easing off as it burns out
          dir.copy(m.path).normalize()
          const len = Math.max(Math.min(head.distanceTo(m.start), m.trail), perPx)
          tail.copy(head).addScaledVector(dir, -len)
          tip.copy(head).addScaledVector(dir, half) // room for the rounded tip
          eye.copy(camera.position).sub(head)
          side.copy(dir).cross(eye).normalize().multiplyScalar(half)
          const lenPx = (len / perPx) * gl.getPixelRatio()
          const front = 1 + half / len
          const o = i * 12
          P.array.set([tail.x - side.x, tail.y - side.y, tail.z - side.z, tail.x + side.x, tail.y + side.y, tail.z + side.z,
            tip.x - side.x, tip.y - side.y, tip.z - side.z, tip.x + side.x, tip.y + side.y, tip.z + side.z], o)
          U.array.set([0, -1, 0, 1, front, -1, front, 1], i * 8)
          L.array.fill(lenPx, i * 4, i * 4 + 4)
          a = THREE.MathUtils.smoothstep(k, 0, 0.1) * (1 - THREE.MathUtils.smoothstep(k, 0.65, 1))
        }
      }
      A.array.fill(a, i * 4, i * 4 + 4)
    })
    P.needsUpdate = U.needsUpdate = A.needsUpdate = L.needsUpdate = true
  })

  return <mesh ref={mesh} geometry={geometry} material={material} frustumCulled={false} renderOrder={-1} />
}
