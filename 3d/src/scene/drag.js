// Drag to look around. The offsets turn the camera about whatever it is looking
// at; the camera rig eases them back to zero when you move to another stop.
export const drag = { yaw: 0, pitch: 0, vy: 0, vp: 0, active: false, moved: 0 }

// A press that travelled this far was a drag, so it must not count as a click.
export const wasDrag = () => drag.moved > 6

// One place for the cursor: the stage shows grab, pointer or grabbing.
export function setCursor(kind) {
  if (kind) document.body.dataset.cursor = kind
  else delete document.body.dataset.cursor
}

const clamp = (x, a, b) => Math.min(b, Math.max(a, x))

export function attachDrag(el) {
  let id = null
  let lx = 0
  let ly = 0
  let lt = 0
  const down = (e) => {
    if (e.button !== 0) return
    id = e.pointerId
    lx = e.clientX
    ly = e.clientY
    drag.active = true
    drag.moved = 0
    drag.vy = drag.vp = 0
  }
  const move = (e) => {
    if (!drag.active || e.pointerId !== id) return
    const dx = e.clientX - lx
    const dy = e.clientY - ly
    lx = e.clientX
    ly = e.clientY
    lt = performance.now()
    drag.moved += Math.abs(dx) + Math.abs(dy)
    const k = 0.0032 // radians per pixel: a full-width drag turns about 120 degrees
    drag.yaw -= dx * k
    drag.pitch = clamp(drag.pitch + dy * k * 0.8, -0.6, 0.6)
    drag.vy = -dx * k * 0.5
    drag.vp = dy * k * 0.4
    if (wasDrag()) setCursor('grabbing')
  }
  const up = (e) => {
    if (e.pointerId !== id) return
    drag.active = false
    id = null
    // Held still before letting go: no coasting.
    if (performance.now() - lt > 80) drag.vy = drag.vp = 0
    if (document.body.dataset.cursor === 'grabbing') setCursor('')
  }
  el.addEventListener('pointerdown', down)
  window.addEventListener('pointermove', move)
  window.addEventListener('pointerup', up)
  window.addEventListener('pointercancel', up)
  return () => {
    el.removeEventListener('pointerdown', down)
    window.removeEventListener('pointermove', move)
    window.removeEventListener('pointerup', up)
    window.removeEventListener('pointercancel', up)
  }
}

// Dev only: lets the screenshot script read the drag.
if (import.meta.env.DEV) window.__drag = drag
