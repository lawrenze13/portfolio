// The 3D, in its own chunk: three.js and friends are most of the download, so
// the text and menu appear first and the sky fades in when this arrives.
import { Canvas } from '@react-three/fiber'
import Scene from './scene/Scene.jsx'
import { wasDrag } from './scene/drag.js'

export default function Stage({ nav, reduced }) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      camera={{ fov: 42, near: 0.1, far: 200, position: [0, 5, 19] }}
      onPointerMissed={() => { if (!wasDrag()) nav.setOpen(null) }}
    >
      <Scene
        stop={nav.stop}
        job={nav.job}
        open={nav.open}
        ask={nav.ask}
        reduced={reduced}
        onOpen={nav.setOpen}
      />
    </Canvas>
  )
}
