import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import { PLAIN_URL } from './data.js'
import './styles.css'

function hasWebGL() {
  try {
    const c = document.createElement('canvas')
    return !!(c.getContext('webgl2') || c.getContext('webgl'))
  } catch {
    return false
  }
}

function NoWebGL() {
  return (
    <main className="nowebgl">
      <p>This browser can't show the 3D version.</p>
      <a href={PLAIN_URL}>Open the plain view</a>
    </main>
  )
}

createRoot(document.getElementById('root')).render(
  <StrictMode>{hasWebGL() ? <App /> : <NoWebGL />}</StrictMode>,
)
