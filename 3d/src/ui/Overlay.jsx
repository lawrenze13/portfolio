import { useEffect, useRef, useState } from 'react'
import { ABOUT, CLUSTERS, CONTACT, INTRO, JOBS, PLAIN_URL, PROJECTS, STOPS, WORK_HEADING } from '../data.js'
import { search } from '../search.js'
import { ask as askMeaning, CLOSE, warm } from '../ask/index.js'
import { soundAvailable, soundWanted, toggleSound } from '../sound.js'

const pad = (n) => String(n).padStart(2, '0')

export default function Overlay({ nav }) {
  const { stop, job, open, ask, help, go, setJob, setOpen, setAsk, setHelp, stepProject } = nav
  const stopId = STOPS[stop].id
  const project = open ? PROJECTS.find((p) => p.id === open) : null
  // The first question waits for the model to load; if it cannot, keywords stand in.
  // A newer question, or leaving the stop, wins over an answer still on its way.
  const asked = useRef(0)
  const [sound, setSound] = useState(soundWanted)
  const onAsk = async (query) => {
    const id = ++asked.current
    setAsk({ id, query, pending: true, hits: [], cites: [] })
    let result
    try {
      result = { mode: 'meaning', ...(await askMeaning(query)) }
    } catch {
      result = { mode: 'keyword', hits: search(query), cites: [] }
    }
    setAsk((cur) => (cur?.id === id ? { id, query, ...result } : cur))
  }

  return (
    <div className={`overlay${project ? ' has-case' : ''}`}>
      <header className="hud">
        <a className="brand" href="#home" onClick={(e) => { e.preventDefault(); go(0) }}>
          <img src="./logo.png" alt="" />
          <span>lawrenzem.space</span>
        </a>
        <div className="hud-right">
          {soundAvailable() && (
            <button className="chip sound" type="button" aria-pressed={sound} onClick={() => setSound(toggleSound())}>
              Sound {sound ? 'on' : 'off'}
            </button>
          )}
          <a className="chip" href={PLAIN_URL}>Plain view</a>
          <button className="chip" type="button" onClick={() => setHelp(true)} aria-label="Controls">?</button>
        </div>
      </header>

      {!project && <section key={stopId} className={`panel panel-${stopId}`} data-scroll>
        {stopId === 'home' && (
          <>
            <p className="eyebrow">{INTRO.title}</p>
            <h1 className="display">Lawrenze<br />Maranan</h1>
            <p className="lead">{INTRO.lead} {INTRO.cloud}</p>
            <AskBox onAsk={onAsk} />
            {ask && <AskResult ask={ask} onOpen={setOpen} onClear={() => setAsk(null)} />}
            <button className="primary" type="button" onClick={() => go(1)}>Enter <kbd>↵</kbd></button>
          </>
        )}
        {stopId === 'about' && (
          <>
            <p className="eyebrow">02 · About</p>
            <h2 className="display">{ABOUT.heading}</h2>
            {ABOUT.body.map((t) => <p key={t} className="body">{t}</p>)}
            <dl className="facts">
              {ABOUT.facts.map(([k, d]) => <div key={k}><dt>{k}</dt><dd>{d}</dd></div>)}
            </dl>
          </>
        )}
        {stopId === 'path' && (
          <>
            <p className="eyebrow">03 · Path · {job + 1} of {JOBS.length}</p>
            <h2 className="display">{JOBS[job].company}</h2>
            <p className="role">{JOBS[job].role} · {JOBS[job].when}</p>
            <p className="body">{JOBS[job].text}</p>
            <div className="row">
              <button className="ghost" type="button" disabled={job === 0} onClick={() => setJob(job - 1)}>↑ Earlier</button>
              <button className="ghost" type="button" disabled={job === JOBS.length - 1} onClick={() => setJob(job + 1)}>↓ Later</button>
            </div>
            <p className="hint">Scroll or ↑ ↓ to move along the path.</p>
          </>
        )}
        {stopId === 'work' && (
          <>
            <p className="eyebrow">04 · Work</p>
            <h2 className="display">{WORK_HEADING}</h2>
            <ul className="legend">
              {Object.entries(CLUSTERS).map(([key, c]) => (
                <li key={key}><i style={{ background: c.color }} />{c.label}<span>{PROJECTS.filter((p) => p.cluster === key).length}</span></li>
              ))}
            </ul>
            <p className="hint">Click a point to open it, or ask:</p>
            <AskBox onAsk={onAsk} />
            {ask && <AskResult ask={ask} onOpen={setOpen} onClear={() => setAsk(null)} />}
          </>
        )}
        {stopId === 'signal' && <Signal />}
      </section>}

      {project && <CaseStudy p={project} onClose={() => setOpen(null)} onStep={stepProject} />}

      <nav className="stops" aria-label="Sections">
        <button className="arrow" type="button" onClick={() => go(stop - 1)} disabled={stop === 0} aria-label="Previous section">‹</button>
        {STOPS.map((s, i) => (
          <a key={s.id} href={'#' + s.id} className={i === stop ? 'on' : ''} aria-current={i === stop ? 'step' : undefined}
            onClick={(e) => { e.preventDefault(); go(i) }}>
            <span className="num">{pad(i + 1)}</span>{s.label}
          </a>
        ))}
        <button className="arrow" type="button" onClick={() => go(stop + 1)} disabled={stop === STOPS.length - 1} aria-label="Next section">›</button>
        <span className="keys">← → · 1–5 · ? controls</span>
      </nav>

      {help && <Help onClose={() => setHelp(false)} />}
    </div>
  )
}

function AskBox({ onAsk }) {
  const [q, setQ] = useState('')
  return (
    <form className="ask" onSubmit={(e) => { e.preventDefault(); if (q.trim()) onAsk(q.trim()) }}>
      <label className="visually-hidden" htmlFor="ask-input">Ask about my work</label>
      <input id="ask-input" value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => warm().catch(() => {})}
        placeholder="Ask: have you built agent systems?" autoComplete="off" />
      <button type="submit">Ask</button>
    </form>
  )
}

function AskResult({ ask, onOpen, onClear }) {
  // Bring a new answer into view: on phones it lands below the fold.
  const ref = useRef()
  useEffect(() => {
    const el = ref.current, panel = el?.closest('.panel')
    if (!panel || ask.pending) return
    const below = el.getBoundingClientRect().bottom - panel.getBoundingClientRect().bottom
    if (below > 0) panel.scrollBy({ top: below + 16, behavior: 'smooth' })
  }, [ask.id, ask.pending])

  const loose = ask.mode === 'meaning' && ask.best < CLOSE
  const heading = ask.pending ? 'Reading the sky…' : !ask.hits.length ? 'Nothing close' : loose ? 'Nothing close. The nearest:' : 'Closest matches'
  return (
    <div className="ask-result" ref={ref} aria-live="polite">
      <div className="ask-head">
        <p className="eyebrow">{heading}</p>
        <button className="link" type="button" onClick={onClear}>Clear</button>
      </div>
      {!ask.pending && (ask.hits.length ? (
        <ul>
          {ask.hits.map((h) => {
            const p = PROJECTS.find((x) => x.id === h.id)
            return (
              <li key={h.id}>
                <button type="button" onClick={() => onOpen(h.id)}>
                  <i style={{ background: CLUSTERS[p.cluster].color }} />
                  <span className="name">{p.name}{h.via && <small>{h.via}</small>}</span>
                  <span className="score">{h.score}</span>
                </button>
              </li>
            )
          })}
        </ul>
      ) : (
        <p className="body">Try agents, cloud, testing or design systems.</p>
      ))}
      {!ask.pending && (
        <p className="note">{ask.mode === 'meaning'
          ? "Matched by meaning, here in your browser. Your question isn't sent anywhere."
          : "The matcher didn't load, so this is a keyword match."}</p>
      )}
    </div>
  )
}

function Signal() {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try { await navigator.clipboard.writeText(CONTACT.email); setCopied(true) } catch { setCopied(false) }
  }
  return (
    <>
      <p className="eyebrow">05 · Signal</p>
      <h2 className="display">{CONTACT.heading}</h2>
      <p className="body">{CONTACT.where}</p>
      <div className="commands">
        <a className="primary" href={`mailto:${CONTACT.email}`}>Email me</a>
        <button className="ghost" type="button" onClick={copy}>{copied ? 'Copied' : 'Copy email'}</button>
        <a className="ghost" href={CONTACT.github} target="_blank" rel="noreferrer">GitHub</a>
        <a className="ghost" href={CONTACT.linkedin} target="_blank" rel="noreferrer">LinkedIn</a>
      </div>
      <p className="hint">{CONTACT.email}</p>
    </>
  )
}

function CaseStudy({ p, onClose, onStep }) {
  const c = CLUSTERS[p.cluster]
  return (
    <aside className="case" data-scroll aria-label={p.name}>
      <div className="case-head">
        <span className="eyebrow" style={{ color: c.color }}>{c.label}{p.featured ? ' · Case study' : ''}</span>
        <button className="icon" type="button" onClick={onClose} aria-label="Close">✕</button>
      </div>
      <h2 className="display">{p.name}</h2>
      <p className="lead">{p.blurb}</p>
      <div className="tags">{p.tags.map((t) => <span key={t}>{t}</span>)}</div>
      {p.story ? <Story s={p.story} color={c.color} /> : p.featured ? (
        <>
          <dl className="sections">
            {['Problem', 'My role', 'Decisions', 'Result'].map((s) => <div key={s}><dt>{s}</dt><dd className="todo">To write.</dd></div>)}
          </dl>
          <div className="media todo">60-second walkthrough</div>
        </>
      ) : (
        <p className="body muted">Short card: screenshots and links go here.</p>
      )}
      <div className="row">
        <button className="ghost" type="button" onClick={() => onStep(-1)}>← Previous</button>
        <button className="ghost" type="button" onClick={() => onStep(1)}>Next →</button>
      </div>
    </aside>
  )
}

function Story({ s, color }) {
  return (
    <>
      {s.kicker && <p className="body kicker">{s.kicker}</p>}
      <ul className="results">
        {s.result.map(([n, l]) => <li key={l}><strong style={{ color }}>{n}</strong>{l}</li>)}
      </ul>
      <dl className="sections">
        <div><dt>Problem</dt><dd>{s.problem}</dd></div>
        <div><dt>My role</dt><dd>{s.role}</dd></div>
        <div><dt>How it works</dt><dd>{s.how}</dd></div>
        <div><dt>Decisions</dt><dd>
          <ol className="decisions">{s.decisions.map(([h, t]) => <li key={h}><b>{h}.</b> {t}</li>)}</ol>
        </dd></div>
        <div><dt>Stack</dt><dd>{s.stack}</dd></div>
      </dl>
      <div className="media todo">{s.media || '60-second walkthrough (staged data only)'}</div>
      {s.link && <p className="body"><a className="link-out" href={s.link[1]} target="_blank" rel="noreferrer">{s.link[0]} ↗</a></p>}
    </>
  )
}

function Help({ onClose }) {
  const rows = [
    ['← →', 'Previous / next section'],
    ['↑ ↓ or scroll', 'Move along (the Path moves one job at a time)'],
    ['1 – 5', 'Jump to a section'],
    ['Click a point', 'Open it; Esc closes'],
    ['?', 'This list'],
  ]
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label="Controls" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="case-head"><span className="eyebrow">Controls</span><button className="icon" type="button" onClick={onClose} aria-label="Close">✕</button></div>
        <dl className="keys-list">{rows.map(([k, d]) => <div key={k}><dt>{k}</dt><dd>{d}</dd></div>)}</dl>
      </div>
    </div>
  )
}
