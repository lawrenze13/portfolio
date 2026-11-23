import { useFrame, useThree } from '@react-three/fiber'
import { Html, Line } from '@react-three/drei'
import { Bloom, EffectComposer } from '@react-three/postprocessing'
import { easing } from 'maath'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { CLUSTERS, JOBS, PALETTE, PROJECTS, STOPS } from '../data.js'
import { LAYOUT } from '../layout.js'
import { LOOK as look } from '../looks.js'
import { Comet } from './comet.jsx'
import { Meteors } from './meteors.jsx'
import { attachDrag, drag, setCursor, wasDrag } from './drag.js'
import { StarPoints, cloudTexture, spikeTexture, starTexture } from './glow.jsx'

const v = (x, y, z) => new THREE.Vector3(x, y, z)
const LABEL_Z = [10, 0] // keep drei labels under the HTML overlay

// drei's Html first mounts into the canvas's parent, then moves once R3F
// connects its events; the root it unmounts on the way empties the first
// label made (it was the aiops name). One fixed parent from the start avoids it.
function Label(props) {
  const parent = useThree((s) => s.gl.domElement.parentNode)
  const portal = useMemo(() => ({ current: parent }), [parent])
  return <Html portal={portal} zIndexRange={LABEL_Z} {...props} />
}

export default function Scene({ stop, job, open, ask, reduced, onOpen }) {
  const stopId = STOPS[stop].id
  const hits = useMemo(() => new Map((ask?.hits || []).map((h) => [h.id, h.score])), [ask])
  const focusId = open || ask?.hits?.[0]?.id || null
  const target = useTarget(stopId, job, focusId)

  return (
    <>
      <color attach="background" args={[look.bg]} />
      <fog attach="fog" args={[look.bg, 26, 70]} />
      <Sky reduced={reduced} />
      <Sprites items={LAYOUT.nebulae} />
      <Meteors reduced={reduced} quiet={!!open} />
      <Cloud hits={hits} cites={ask?.cites} stopId={stopId} open={open} onOpen={onOpen} reduced={reduced} />
      <Core reduced={reduced} />
      <Path job={job} active={stopId === 'path' && !focusId} />
      <Signal reduced={reduced} active={stopId === 'signal'} />
      <Comet target={target.guide} reduced={reduced} fast={!!focusId} />
      {ask?.hits?.length > 1 && <AskBeams from={LAYOUT.projects[ask.hits[0].id]} hits={ask.hits.slice(1)} />}
      <CameraRig target={target} orbit={stopId === 'home' && !focusId} reduced={reduced} />
      <ViewShift panelOpen={!!open} />
      <EffectComposer multisampling={4}>
        <Bloom mipmapBlur intensity={look.bloom} luminanceThreshold={0.82} luminanceSmoothing={0.15} radius={0.45} />
      </EffectComposer>
    </>
  )
}

// Where the camera sits, what it looks at, and where the guide waits, per state.
function useTarget(stopId, job, focusId) {
  return useMemo(() => {
    if (focusId) {
      // Stand back in front of the point rather than flying into the cloud.
      const p = LAYOUT.projects[focusId]
      return { pos: p.clone().add(v(0, 1.4, 7.5)), look: p.clone(), guide: p.clone().add(v(-0.5, -0.3, 0.6)) }
    }
    switch (stopId) {
      case 'about':
        return { pos: v(4.2, 1.6, 6.6), look: v(0, 0, 0), guide: v(1.3, -0.5, -0.8) }
      case 'path': {
        const m = LAYOUT.jobs[job]
        const out = m.clone().setY(0).normalize()
        const side = new THREE.Vector3().crossVectors(out, v(0, 1, 0)).normalize()
        return {
          pos: m.clone().addScaledVector(out, 7.5).add(v(0, 2.2, 0)),
          look: m.clone(),
          guide: m.clone().addScaledVector(side, 1.0).addScaledVector(out, 0.6).add(v(0, -0.3, 0)),
        }
      }
      case 'work':
        return { pos: v(3.5, 2.8, 13.5), look: v(0, 0.2, 0), guide: v(-2.4, -1.3, 5) }
      case 'signal':
        return { pos: v(8.5, 4.2, 8.5), look: v(0, 4.4, 0), guide: v(1.3, 5.2, 0.5) }
      default:
        return { pos: v(0, 5, 19), look: v(0, 0.3, 0), guide: v(3.4, -1.5, 5.4) }
    }
  }, [stopId, job, focusId])
}

function CameraRig({ target, orbit, reduced }) {
  const look = useRef(target.look.clone())
  const base = useRef(target.pos.clone()) // where the camera would be without dragging
  const desired = useMemo(() => new THREE.Vector3(), [])
  const offset = useMemo(() => new THREE.Vector3(), [])
  const sph = useMemo(() => new THREE.Spherical(), [])
  const first = useRef(true)
  const last = useRef(target)
  const returning = useRef(false)
  const gl = useThree((s) => s.gl)
  useEffect(() => attachDrag(gl.domElement), [gl])

  useFrame((state, dt) => {
    desired.copy(target.pos)
    if (orbit && !reduced) {
      const a = state.clock.elapsedTime * 0.05
      const radius = Math.hypot(target.pos.x, target.pos.z)
      desired.set(Math.sin(a) * radius, target.pos.y, Math.cos(a) * radius)
    }
    if (reduced || first.current) {
      base.current.copy(desired)
      look.current.copy(target.look)
      first.current = false
    } else {
      easing.damp3(base.current, desired, 0.8, dt)
      easing.damp3(look.current, target.look, 0.7, dt)
    }

    // A new stop brings the composed view back; a drag keeps its own.
    if (last.current !== target) {
      last.current = target
      returning.current = true
      drag.yaw = Math.atan2(Math.sin(drag.yaw), Math.cos(drag.yaw)) // the short way round
    }
    if (drag.active) returning.current = false
    else if (returning.current) {
      easing.damp(drag, 'yaw', 0, 0.6, dt)
      easing.damp(drag, 'pitch', 0, 0.6, dt)
      drag.vy = drag.vp = 0
      if (Math.abs(drag.yaw) + Math.abs(drag.pitch) < 1e-3) returning.current = false
    } else if (!reduced) {
      // Let a flick carry on for a moment.
      drag.yaw += drag.vy
      drag.pitch = Math.min(0.6, Math.max(-0.6, drag.pitch + drag.vp))
      const decay = Math.pow(0.86, dt * 60)
      drag.vy *= decay
      drag.vp *= decay
    }

    offset.copy(base.current).sub(look.current)
    sph.setFromVector3(offset)
    sph.theta += drag.yaw
    sph.phi = Math.min(Math.PI - 0.2, Math.max(0.2, sph.phi - drag.pitch))
    const cam = state.camera
    cam.position.copy(look.current).add(offset.setFromSpherical(sph))
    cam.lookAt(look.current)
  })
  return null
}

// Shifts the picture so the 3D sits beside the text: right of the left panel on
// desktop, left of an open case study, and above the text on phones.
function ViewShift({ panelOpen }) {
  const cur = useRef({ x: 0, y: 0 })
  useFrame((state, dt) => {
    const { size, camera } = state
    const phone = size.width < 760
    const tx = phone ? 0 : (panelOpen ? 0.2 : -0.17) * size.width
    const ty = phone ? 0.22 * size.height : 0
    easing.damp(cur.current, 'x', tx, 0.5, dt)
    easing.damp(cur.current, 'y', ty, 0.5, dt)
    camera.setViewOffset(size.width, size.height, cur.current.x, cur.current.y, size.width, size.height)
  })
  return null
}

function Stars({ reduced }) {
  return <StarPoints items={LAYOUT.stars} reduced={reduced} fade={[400, 500]} halo={look.halo} flicker={look.flicker}
    spikes={look.spikes} gain={look.sky * 1.1} />
}

// One star as the eye sees it: constant on screen whatever the distance.
function Star({ color, size, opacity = 1, map = starTexture() }) {
  return (
    <sprite scale={[size, size, 1]}>
      <spriteMaterial map={map} color={color} sizeAttenuation={false} transparent opacity={opacity}
        blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
    </sprite>
  )
}

// The far stars and the dust along the band turn slowly about a tilted pole,
// as the real sky does, so the background drifts on every stop, not only
// during Home's orbit. About six pixels a second near the middle of the view.
const POLE = new THREE.Vector3(0.25, 1, 0.15).normalize()
function Sky({ reduced }) {
  const sky = useRef()
  useFrame((_, dt) => { if (!reduced) sky.current.rotateOnAxis(POLE, Math.min(dt, 0.1) * 0.005) })
  return (
    <group ref={sky}>
      <Stars reduced={reduced} />
      <Sprites items={LAYOUT.dust} />
    </group>
  )
}

// Faint clouds: nebulae around each cluster, or dust along the band.
function Sprites({ items }) {
  return (
    <group>
      {items.map((n, i) => (
        <sprite key={i} position={n.pos} scale={[n.size, n.size * 0.62, 1]}>
          <spriteMaterial map={cloudTexture()} color={n.color} transparent opacity={n.opacity} rotation={n.rotation}
            blending={THREE.AdditiveBlending} depthWrite={false} fog={false} toneMapped={false} />
        </sprite>
      ))}
    </group>
  )
}

function Cloud({ hits, cites, stopId, open, onOpen, reduced }) {
  const edges = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.Float32BufferAttribute(LAYOUT.edgePositions, 3))
    geo.setAttribute('color', new THREE.Float32BufferAttribute(LAYOUT.edgeColors, 3))
    return geo
  }, [])

  const labelsDim = !(stopId === 'home' || stopId === 'work') && hits.size === 0 && !open
  // Names only where they help: on Work, or when something is asked or open.
  const naming = stopId === 'work' || hits.size > 0 || !!open
  // The small stars: hover for what each one is, click to open its project.
  const [tip, setTip] = useState(null)
  const raycaster = useThree((s) => s.raycaster)
  useLayoutEffect(() => { raycaster.params.Points.threshold = 0.14 }, [raycaster])
  const camera = useThree((s) => s.camera)
  // Dev only: lets the screenshot script find a star on screen.
  if (import.meta.env.DEV) window.__stars = { camera, fillers: LAYOUT.fillers }

  return (
    <group>
      <lineSegments geometry={edges}>
        <lineBasicMaterial vertexColors transparent opacity={look.lines} depthWrite={false} />
      </lineSegments>
      <StarPoints items={LAYOUT.fillers} reduced={reduced} size={1.6} atten={1}
        tint={look.tint} halo={look.halo} flicker={look.flicker} spikes={look.spikes * 0.5}
        onPointerMove={(e) => { e.stopPropagation(); setTip(e.index); if (!drag.active) setCursor('pointer') }}
        onPointerOut={() => { setTip(null); setCursor('') }}
        onClick={(e) => { e.stopPropagation(); if (!wasDrag()) onOpen(LAYOUT.fillers[e.index].parent) }} />
      {tip != null && LAYOUT.fillers[tip] && <PointTip f={LAYOUT.fillers[tip]} />}
      {!open && cites?.map((name) => {
        const f = LAYOUT.fillers.find((x) => x.name === name)
        return f && <CitedStar key={name} f={f} />
      })}
      {PROJECTS.map((p) => (
        <ProjectPoint key={p.id} p={p} score={hits.get(p.id)} isOpen={open === p.id} showName={naming} faded={hits.size > 0 || !!open} onOpen={onOpen} />
      ))}
      {Object.entries(CLUSTERS).map(([key, c]) => (
        <Label key={key} position={LAYOUT.clusterLabel[key]} center distanceFactor={14} zIndexRange={LABEL_Z} style={{ pointerEvents: 'none' }}>
          <div className={`cluster-label${labelsDim ? ' dim' : ''}`} style={{ color: c.color }}>{c.label}</div>
        </Label>
      ))}
    </group>
  )
}

// A small star an answer drew on: lit, with a ring, until the question is cleared.
function CitedStar({ f }) {
  const color = CLUSTERS[f.cluster].color
  return (
    <group position={f.pos}>
      <Star color={color} size={0.04} opacity={0.85} />
      <Star color="#ffffff" size={0.022} />
      <Label zIndexRange={LABEL_Z} style={{ pointerEvents: 'none' }}>
        <div className="reticle small" style={{ color }} />
      </Label>
    </group>
  )
}

function PointTip({ f }) {
  const camera = useThree((s) => s.camera)
  // Open towards the middle of the screen so the tip never runs off the edge.
  const flip = f.pos.clone().project(camera).x > 0.3
  return (
    <Label position={f.pos} zIndexRange={LABEL_Z} style={{ pointerEvents: 'none' }}>
      <div className="reticle small" style={{ color: CLUSTERS[f.cluster].color }} />
      <div className={`point-tip${flip ? ' flip' : ''}`}><b>{f.name}</b>{f.line}</div>
    </Label>
  )
}

function ProjectPoint({ p, score, isOpen, showName, faded, onOpen }) {
  const [hover, setHover] = useState(false)
  const scaler = useRef()
  const color = CLUSTERS[p.cluster].color
  const lit = hover || isOpen || !!score
  const base = p.featured ? 1.25 : 1
  useFrame((state, dt) => {
    const s = base * (lit ? 1.3 + Math.sin(state.clock.elapsedTime * 3) * 0.04 : 1)
    easing.damp3(scaler.current.scale, [s, s, s], 0.15, dt)
  })
  const label = `point-label${showName || lit ? '' : ' hidden'}${faded && !lit ? ' dim' : ''}${lit ? ' lit' : ''}`
  return (
    <group position={LAYOUT.projects[p.id]}>
      <group ref={scaler}>
        <Star color={color} size={0.06} opacity={lit ? 0.9 : 0.55} />
        <Star color="#ffffff" size={0.042} />
        <Star color="#ffffff" size={0.085} opacity={0.32} map={spikeTexture()} />
      </group>
      <mesh
        onPointerOver={(e) => { e.stopPropagation(); setHover(true); if (!drag.active) setCursor('pointer') }}
        onPointerOut={() => { setHover(false); setCursor('') }}
        onClick={(e) => { e.stopPropagation(); if (!wasDrag()) onOpen(p.id) }}
      >
        <sphereGeometry args={[0.4, 8, 8]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {lit && (
        <Label center zIndexRange={LABEL_Z} style={{ pointerEvents: 'none' }}>
          <div className="reticle" style={{ color }} />
        </Label>
      )}
      <Label position={[0, 0.3, 0]} center distanceFactor={10} zIndexRange={LABEL_Z} style={{ pointerEvents: 'none' }}>
        <div className={label}>
          {p.name}
          {score && <span className="score">{score}</span>}
        </div>
      </Label>
    </group>
  )
}

function Core({ reduced }) {
  const ring = useRef()
  useFrame((_, dt) => { if (!reduced) ring.current.rotation.z += dt * 0.4 })
  return (
    <group>
      <Star color={PALETTE.ai} size={0.1} opacity={0.3} />
      <Star color="#ffffff" size={0.075} />
      <Star color="#ffffff" size={0.13} opacity={0.4} map={spikeTexture()} />
      <mesh ref={ring} rotation={[1.1, 0, 0]}>
        <torusGeometry args={[0.75, 0.008, 8, 128]} />
        <meshBasicMaterial color={PALETTE.ai} transparent opacity={0.4} toneMapped={false} />
      </mesh>
    </group>
  )
}

function Path({ job, active }) {
  const points = useMemo(
    () => new THREE.CatmullRomCurve3([...LAYOUT.jobs, v(0, 0, 0)]).getPoints(200),
    [],
  )
  return (
    <group>
      <Line points={points} color={PALETTE.text} lineWidth={1} transparent opacity={active ? 0.3 : 0.1} />
      {LAYOUT.jobs.map((m, i) => (
        <JobStar key={i} pos={m} on={active && i === job} active={active} label={JOBS[i].when} />
      ))}
    </group>
  )
}

// Each job is a star like the rest of the sky; the one you are reading is lit.
function JobStar({ pos, on, active, label }) {
  const scaler = useRef()
  useFrame((state, dt) => {
    const s = on ? 1.45 + Math.sin(state.clock.elapsedTime * 3) * 0.04 : active ? 1 : 0.8
    easing.damp3(scaler.current.scale, [s, s, s], 0.15, dt)
  })
  const k = active ? 1 : 0.45
  return (
    <group position={pos}>
      <group ref={scaler}>
        <Star color={on ? PALETTE.ai : '#DCE6EE'} size={0.05} opacity={(on ? 0.9 : 0.5) * k} />
        <Star color="#ffffff" size={0.034} opacity={k} />
        <Star color="#ffffff" size={0.075} opacity={0.3 * k} map={spikeTexture()} />
      </group>
      {on && (
        <Label center zIndexRange={LABEL_Z} style={{ pointerEvents: 'none' }}>
          <div className="reticle" style={{ color: PALETTE.ai }} />
        </Label>
      )}
      <Label position={[0, 0.32, 0]} center distanceFactor={10} zIndexRange={LABEL_Z} style={{ pointerEvents: 'none' }}>
        {/* Years only on the Path: elsewhere the camera can pass close to a job,
            and a label sized by distance would fill the screen. */}
        <div className={`point-label year${on ? ' lit' : active ? '' : ' hidden'}`}>{label}</div>
      </Label>
    </group>
  )
}

function Signal({ reduced, active }) {
  const pulse = useRef()
  useFrame((state) => {
    if (!reduced) pulse.current.position.y = 0.4 + ((state.clock.elapsedTime * 1.6) % 7.1)
  })
  return (
    <group>
      <mesh position={[0, 3.95, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 7.1, 8]} />
        <meshBasicMaterial color={PALETTE.ai} transparent opacity={active ? 0.5 : 0.1} toneMapped={false} />
      </mesh>
      <group ref={pulse} position={[0, 2, 0]} visible={active}>
        <Star color={PALETTE.ai} size={0.05} opacity={0.8} />
        <Star color="#ffffff" size={0.03} />
      </group>
      <group position={[0, 7.5, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.5, 0.015, 8, 64]} />
          <meshBasicMaterial color={PALETTE.interface} toneMapped={false} />
        </mesh>
        <Star color={PALETTE.interface} size={0.07} opacity={active ? 0.9 : 0.4} />
        <Star color="#ffffff" size={0.045} opacity={active ? 1 : 0.5} />
        <Star color="#ffffff" size={0.1} opacity={active ? 0.35 : 0.15} map={spikeTexture()} />
      </group>
    </group>
  )
}

function AskBeams({ from, hits }) {
  const group = useRef()
  useFrame((_, dt) => {
    group.current?.children.forEach((line) => { if (line.material) line.material.dashOffset -= dt * 0.5 })
  })
  return <group ref={group}>{hits.map((h) => (
    <Line
      key={h.id}
      points={[from, LAYOUT.projects[h.id]]}
      color={PALETTE.ai}
      lineWidth={1}
      dashed
      dashSize={0.15}
      gapSize={0.1}
      transparent
      opacity={0.8}
    />
  ))}</group>
}
