import { useFrame, useThree } from '@react-three/fiber'
import { useLayoutEffect, useMemo } from 'react'
import * as THREE from 'three'

// A star's light: a tight white-hot core falling off into a faint halo.
let starTex
export function starTexture() {
  if (starTex) return starTex
  const s = 128
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = s
  const g = canvas.getContext('2d')
  const grd = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  grd.addColorStop(0, 'rgba(255,255,255,1)')
  grd.addColorStop(0.06, 'rgba(255,255,255,0.9)')
  grd.addColorStop(0.14, 'rgba(255,255,255,0.3)')
  grd.addColorStop(0.3, 'rgba(255,255,255,0.06)')
  grd.addColorStop(0.55, 'rgba(255,255,255,0.012)')
  grd.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grd
  g.fillRect(0, 0, s, s)
  starTex = new THREE.CanvasTexture(canvas)
  starTex.colorSpace = THREE.SRGBColorSpace
  return starTex
}

// Diffraction spikes, as a telescope photographs a bright star.
let spikeTex
export function spikeTexture() {
  if (spikeTex) return spikeTex
  const s = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = s
  const g = canvas.getContext('2d')
  const img = g.createImageData(s, s)
  for (let y = 0; y < s; y++) {
    for (let x = 0; x < s; x++) {
      const px = Math.abs((x + 0.5) / s - 0.5) * 2
      const py = Math.abs((y + 0.5) / s - 0.5) * 2
      const v = Math.exp(-py * 90) * Math.exp(-px * 3.2) + Math.exp(-px * 90) * Math.exp(-py * 3.2)
      const i = (y * s + x) * 4
      img.data[i] = img.data[i + 1] = img.data[i + 2] = 255
      img.data[i + 3] = Math.min(255, v * 255)
    }
  }
  g.putImageData(img, 0, 0)
  spikeTex = new THREE.CanvasTexture(canvas)
  spikeTex.colorSpace = THREE.SRGBColorSpace
  return spikeTex
}

// A soft, uneven cloud for nebulae and dust: many faint blobs inside a round fade.
let cloudTex
export function cloudTexture() {
  if (cloudTex) return cloudTex
  const s = 256
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = s
  const g = canvas.getContext('2d')
  let seed = 7
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647)
  g.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 60; i++) {
    const a = rnd() * Math.PI * 2
    const d = Math.pow(rnd(), 0.7) * s * 0.3
    const x = s / 2 + Math.cos(a) * d
    const y = s / 2 + Math.sin(a) * d
    const r = s * (0.04 + rnd() * 0.12)
    const grd = g.createRadialGradient(x, y, 0, x, y, r)
    grd.addColorStop(0, `rgba(255,255,255,${0.05 + rnd() * 0.07})`)
    grd.addColorStop(1, 'rgba(255,255,255,0)')
    g.fillStyle = grd
    g.fillRect(0, 0, s, s)
  }
  g.globalCompositeOperation = 'destination-in'
  const fade = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2)
  fade.addColorStop(0, 'rgba(0,0,0,1)')
  fade.addColorStop(0.6, 'rgba(0,0,0,0.6)')
  fade.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = fade
  g.fillRect(0, 0, s, s)
  cloudTex = new THREE.CanvasTexture(canvas)
  cloudTex.colorSpace = THREE.SRGBColorSpace
  return cloudTex
}

const vertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute float aMag;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPx;
  uniform float uSize;
  uniform float uAtten;
  uniform float uFadeNear;
  uniform float uFadeFar;
  uniform float uFlicker;
  uniform float uSpikes;
  varying vec3 vColor;
  varying float vMag;
  varying float vAlpha;
  varying float vSpread;
  varying float vSize;
  varying float vScale;
  varying float vSigma;
  varying float vCoreGain;
  void main() {
    vColor = aColor;
    vMag = aMag;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // Scintillation: small, quick and uneven, and stronger on bright stars.
    float flick = (0.5 + 0.5 * sin(uTime * 2.3 + aPhase)) * (0.5 + 0.5 * sin(uTime * 3.9 + aPhase * 1.7));
    vAlpha = (1.0 - 0.22 * uFlicker * aMag * flick) * (1.0 - smoothstep(uFadeNear, uFadeFar, -mv.z));
    // Stars are point sources: size follows brightness, barely distance.
    float att = mix(1.0, clamp(14.0 / -mv.z, 0.7, 1.6), uAtten);
    // Bright stars get a bigger sprite so their spikes have room.
    vSpread = 1.0 + uSpikes * smoothstep(0.45, 0.95, aMag) * 1.4;
    float size = uPx * uSize * (2.6 + 10.0 * aMag * aMag) * att * vSpread;
    // A core narrower than a pixel blinks on and off as the star crosses
    // pixels while the sky turns or the camera moves. Keep it at least 0.7
    // device pixels wide, spreading its light (a quarter more, as a spread
    // dot reads dimmer than a pinpoint), and grow the sprite so the core is
    // never cut off at its edge.
    float sigma = size / (9.8 * vSpread); // the core's width as designed
    vSigma = max(sigma, 0.7);
    vCoreGain = min(1.0, 1.25 * (sigma * sigma) / (vSigma * vSigma));
    vSize = max(size, vSigma * 6.0 + 1.0);
    vScale = size / vSize;
    gl_PointSize = vSize;
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTint;
  uniform float uHalo;
  uniform float uSpikes;
  uniform float uGain;
  varying vec3 vColor;
  varying float vMag;
  varying float vAlpha;
  varying float vSpread;
  varying float vSize;
  varying float vScale;
  varying float vSigma;
  varying float vCoreGain;
  void main() {
    vec2 q = (gl_PointCoord - 0.5) * vSize; // device pixels from the centre
    vec2 p = q * 2.0 * vSpread / (vSize * vScale); // the designed shape's units
    float d = length(p);
    float shape = exp(-0.5 * dot(q, q) / (vSigma * vSigma));
    float core = shape * vCoreGain;
    float halo = exp(-d * 5.0) * 0.3 * vMag * uHalo;
    float spike = 0.0;
    if (uSpikes > 0.0) {
      float k = smoothstep(0.45, 0.95, vMag) * uSpikes;
      spike = (exp(-abs(p.y) * 28.0) * exp(-abs(p.x) * 1.6) + exp(-abs(p.x) * 28.0) * exp(-abs(p.y) * 1.6)) * 0.35 * k;
    }
    float a = (core + halo + spike) * vAlpha * (0.45 + 0.55 * vMag) * uGain;
    if (a < 0.004) discard;
    vec3 col = mix(vColor, vec3(1.0), uTint);
    gl_FragColor = vec4(mix(col, vec3(1.0), shape * 0.55), a);
    #include <colorspace_fragment>
  }
`

// Crisp stars drawn in one call. `items` = [{ pos, color, mag }], mag 0..1.
// `atten` lets nearby stars grow a little (for the clusters, not the sky);
// tint, halo, flicker, spikes and gain come from the chosen look.
export function StarPoints({ items, reduced, size = 1, atten = 0, fade = [22, 70], tint = 0, halo = 1, flicker = 1, spikes = 0, gain = 1, ...events }) {
  const { gl } = useThree()
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const pos = new Float32Array(items.length * 3)
    const col = new Float32Array(items.length * 3)
    const mag = new Float32Array(items.length)
    const ph = new Float32Array(items.length)
    const c = new THREE.Color()
    items.forEach((it, i) => {
      it.pos.toArray(pos, i * 3)
      c.set(it.color).toArray(col, i * 3)
      mag[i] = it.mag
      ph[i] = (i * 2.399963) % (Math.PI * 2)
    })
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    geo.setAttribute('aColor', new THREE.BufferAttribute(col, 3))
    geo.setAttribute('aMag', new THREE.BufferAttribute(mag, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(ph, 1))
    return geo
  }, [items])
  // Built here rather than as JSX: R3F copies a `uniforms` prop, so writes to
  // our object would never reach the shader.
  const material = useMemo(() => new THREE.ShaderMaterial({
    vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: Object.fromEntries(['uTime', 'uPx', 'uSize', 'uAtten', 'uFadeNear', 'uFadeFar', 'uFlicker', 'uSpikes', 'uTint', 'uHalo', 'uGain']
      .map((k) => [k, { value: 0 }])),
  }), [])

  useLayoutEffect(() => {
    const u = material.uniforms
    u.uPx.value = gl.getPixelRatio()
    u.uSize.value = size
    u.uAtten.value = atten
    u.uFadeNear.value = fade[0]
    u.uFadeFar.value = fade[1]
    u.uTint.value = tint
    u.uHalo.value = halo
    u.uFlicker.value = flicker
    u.uSpikes.value = spikes
    u.uGain.value = gain
  }, [material, gl, size, atten, fade[0], fade[1], tint, halo, flicker, spikes, gain])
  useFrame((state) => { if (!reduced) material.uniforms.uTime.value = state.clock.elapsedTime })

  return <points geometry={geometry} material={material} {...events} />
}
