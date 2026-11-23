// All navigation state and input: keys, wheel (one stop per gesture), swipe, #hash.
import { useCallback, useEffect, useRef, useState } from 'react'
import { JOBS, PROJECTS, STOPS } from './data.js'

const LAST = STOPS.length - 1
const PATH = STOPS.findIndex((s) => s.id === 'path')
const stopFromHash = () => Math.max(0, STOPS.findIndex((s) => '#' + s.id === window.location.hash))

export function useNavigation() {
  const [stop, setStop] = useState(stopFromHash)
  const [job, setJob] = useState(0)
  const [open, setOpen] = useState(null)
  const [ask, setAsk] = useState(null)
  const [help, setHelp] = useState(false)

  const live = useRef({})
  live.current = { stop, job, open }

  // The Path runs oldest to newest. Arriving by scrolling back (fromEnd) lands
  // on the newest job; any other way in (menu, 1–5, arrows) starts at the first.
  const go = useCallback((i, { fromEnd = false } = {}) => {
    const target = Math.min(Math.max(i, 0), LAST)
    const from = live.current.stop
    if (target === PATH && target !== from) setJob(fromEnd ? JOBS.length - 1 : 0)
    setStop(target)
    setOpen(null)
    setAsk(null)
  }, [])

  // Forward/back that walks the Path one job at a time before leaving it.
  const step = useCallback((dir) => {
    const { stop: s, job: j, open: o } = live.current
    if (o) return
    if (s === PATH) {
      const next = j + dir
      if (next >= 0 && next < JOBS.length) { setJob(next); return }
    }
    go(s + dir, { fromEnd: dir < 0 })
  }, [go])

  const stepProject = useCallback((dir) => {
    const i = PROJECTS.findIndex((p) => p.id === live.current.open)
    setOpen(PROJECTS[(i + dir + PROJECTS.length) % PROJECTS.length].id)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      const typing = e.target.closest?.('input, textarea')
      if (e.key === 'Escape') {
        if (typing) e.target.blur()
        setHelp(false); setOpen(null); setAsk(null)
        return
      }
      if (typing) return
      if (e.key === '?') { setHelp((h) => !h); return }
      if (live.current.open) {
        if (e.key === 'ArrowRight') stepProject(1)
        if (e.key === 'ArrowLeft') stepProject(-1)
        return
      }
      const s = live.current.stop
      if (e.key === 'ArrowRight') go(s + 1)
      else if (e.key === 'ArrowLeft') go(s - 1)
      else if (e.key === 'ArrowDown') { e.preventDefault(); step(1) }
      else if (e.key === 'ArrowUp') { e.preventDefault(); step(-1) }
      else if (/^[1-5]$/.test(e.key)) go(Number(e.key) - 1)
      else if (e.key === 'Enter' && STOPS[s].id === 'home' && !e.target.closest?.('button, a')) go(1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [go, step, stepProject])

  useEffect(() => {
    let locked = false
    let timer
    const onWheel = (e) => {
      if (e.target.closest?.('[data-scroll]')) return
      clearTimeout(timer)
      timer = setTimeout(() => { locked = false }, 240) // a gesture ends after 240 ms of quiet
      if (locked || Math.abs(e.deltaY) < 4) return
      locked = true
      step(Math.sign(e.deltaY))
    }
    window.addEventListener('wheel', onWheel, { passive: true })
    return () => { window.removeEventListener('wheel', onWheel); clearTimeout(timer) }
  }, [step])

  useEffect(() => {
    let sx = 0, sy = 0, ignore = false
    const start = (e) => {
      const t = e.touches[0]
      sx = t.clientX; sy = t.clientY
      // A drag on the 3D turns it; swipes elsewhere move between stops.
      ignore = !!e.target.closest?.('[data-scroll], input, button, a, canvas')
    }
    const end = (e) => {
      if (ignore) return
      const t = e.changedTouches[0]
      const dx = t.clientX - sx, dy = t.clientY - sy
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 60) return
      if (Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1)
      else step(dy < 0 ? 1 : -1)
    }
    window.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchend', end, { passive: true })
    return () => { window.removeEventListener('touchstart', start); window.removeEventListener('touchend', end) }
  }, [step])

  useEffect(() => {
    const id = '#' + STOPS[stop].id
    if (window.location.hash !== id) history.replaceState(null, '', id)
  }, [stop])

  useEffect(() => {
    const onHash = () => go(stopFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [go])

  return { stop, job, open, ask, help, go, step, stepProject, setJob, setOpen, setAsk, setHelp }
}

export function useReducedMotion() {
  const query = '(prefers-reduced-motion: reduce)'
  const [reduced, setReduced] = useState(() => window.matchMedia(query).matches)
  useEffect(() => {
    const m = window.matchMedia(query)
    const onChange = () => setReduced(m.matches)
    m.addEventListener('change', onChange)
    return () => m.removeEventListener('change', onChange)
  }, [])
  return reduced
}
