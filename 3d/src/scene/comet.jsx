import { useFrame, useThree } from '@react-three/fiber'
import { easing } from 'maath'
import { useLayoutEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PALETTE } from '../data.js'
import { spikeTexture, starTexture } from './glow.jsx'

// The guide: a comet that travels to each stop and streaks to what you ask about.
// Like a real one, its tail points away from the sun (the core at the centre)
// and trails behind it while it moves.
const N = 40
const LENGTH = 2.0
const SEG = LENGTH / (N - 1)

const vertexShader = /* glsl */ `
  attribute float aFade;
  uniform float uPx;
  varying float vFade;
  void main() {
    vFade = aFade;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    // A comet's tail widens and thins as it leaves the head.
    gl_PointSize = uPx * (5.0 + 30.0 * (1.0 - aFade));
    gl_Position = projectionMatrix * mv;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5) * 2.0;
    float a = exp(-d * d * 4.0) * pow(vFade, 1.4) * 0.26;
    if (a < 0.004) discard;
    gl_FragColor = vec4(mix(uColor, vec3(1.0), vFade * vFade * 0.5), a);
    #include <colorspace_fragment>
  }
`

function HeadSprite({ map, color, size, opacity }) {
  return (
    <sprite scale={[size, size, 1]}>
      <spriteMaterial map={map} color={color} sizeAttenuation={false} transparent opacity={opacity}
        blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

export function Comet({ target, reduced, fast }) {
  const head = useRef()
  const first = useRef(true)
  const gl = useThree((s) => s.gl)
  const chain = useMemo(() => Array.from({ length: N }, () => new THREE.Vector3()), [])
  const away = useMemo(() => new THREE.Vector3(), [])
  const want = useMemo(() => new THREE.Vector3(), [])

  const { geometry, material, line } = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    const fade = new Float32Array(N)
    const col = new Float32Array(N * 3)
    const c = new THREE.Color(PALETTE.ai)
    for (let i = 0; i < N; i++) {
      const f = 1 - i / (N - 1)
      fade[i] = f
      col[i * 3] = c.r * f
      col[i * 3 + 1] = c.g * f
      col[i * 3 + 2] = c.b * f
    }
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(N * 3), 3))
    geo.setAttribute('aFade', new THREE.BufferAttribute(fade, 1))
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3))
    const mat = new THREE.ShaderMaterial({
      vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uPx: { value: 1 }, uColor: { value: new THREE.Color(PALETTE.ai) } },
    })
    const tailLine = new THREE.Line(geo, new THREE.LineBasicMaterial({
      vertexColors: true, transparent: true, opacity: 0.5, blending: THREE.AdditiveBlending, depthWrite: false,
    }))
    tailLine.frustumCulled = false
    return { geometry: geo, material: mat, line: tailLine }
  }, [])

  useLayoutEffect(() => { material.uniforms.uPx.value = gl.getPixelRatio() }, [gl, material])

  useFrame((_, dt) => {
    const h = head.current.position
    const snap = first.current || reduced
    if (snap) h.copy(target)
    else easing.damp3(h, target, fast ? 0.45 : 0.9, dt)

    away.copy(h)
    if (away.lengthSq() < 1e-6) away.set(0, 1, 0)
    away.normalize()
    chain[0].copy(h)
    const k = snap ? 1 : 1 - Math.exp(-dt * 9)
    for (let i = 1; i < N; i++) {
      want.copy(chain[i - 1]).addScaledVector(away, SEG)
      chain[i].lerp(want, k)
    }
    first.current = false

    const arr = geometry.attributes.position.array
    chain.forEach((p, i) => p.toArray(arr, i * 3))
    geometry.attributes.position.needsUpdate = true
  })

  return (
    <group>
      <primitive object={line} />
      <points geometry={geometry} material={material} frustumCulled={false} />
      <group ref={head}>
        <HeadSprite map={starTexture()} color={PALETTE.ai} size={0.09} opacity={0.7} />
        <HeadSprite map={starTexture()} color="#ffffff" size={0.05} opacity={1} />
        <HeadSprite map={spikeTexture()} color="#ffffff" size={0.11} opacity={0.35} />
      </group>
    </group>
  )
}
