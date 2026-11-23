import { Component, lazy, Suspense } from 'react'
import { useSoundCues } from './sound.js'
import Overlay from './ui/Overlay.jsx'
import { useNavigation, useReducedMotion } from './useNavigation.js'

// Downloaded on first render, which happens only where WebGL works.
const Stage = lazy(() => import('./Stage.jsx'))

// If the 3D fails to load or start, the text and menu carry on without it.
class Without3D extends Component {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch(error) { console.error('3D view failed; continuing without it.', error) }
  render() { return this.state.failed ? null : this.props.children }
}

export default function App() {
  const nav = useNavigation()
  const reduced = useReducedMotion()
  useSoundCues(nav)

  return (
    <>
      <div className="stage">
        <Without3D>
          <Suspense fallback={null}>
            <Stage nav={nav} reduced={reduced} />
          </Suspense>
        </Without3D>
        <div className="vignette" aria-hidden="true" />
      </div>
      <Overlay nav={nav} />
      <div className="grain" aria-hidden="true" />
    </>
  )
}
