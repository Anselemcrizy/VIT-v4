import { useEffect, useRef, useState } from 'react'

const LEAGUE_LABELS = {
  premier_league: 'Premier League',
  serie_a: 'Serie A',
  la_liga: 'La Liga',
  bundesliga: 'Bundesliga',
  ligue_1: 'Ligue 1',
}

const SIDE_LABELS = { home: 'HOME WIN', draw: 'DRAW', away: 'AWAY WIN' }
const SIDE_COLORS = { home: '#0ea5e9', draw: '#f59e0b', away: '#8b5cf6' }

function ProbBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#64748b', marginBottom: 3 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 700, color }}>{(value * 100).toFixed(1)}%</span>
      </div>
      <div style={{ background: '#e2e8f0', borderRadius: 99, height: 6, overflow: 'hidden' }}>
        <div style={{ width: `${value * 100}%`, background: color, height: '100%', borderRadius: 99, transition: 'width 0.6s ease' }} />
      </div>
    </div>
  )
}

function PredictionCard({ item, index }) {
  const sideColor = SIDE_COLORS[item.best_side] || '#0ea5e9'
  const sideLabel = SIDE_LABELS[item.best_side] || item.best_side?.toUpperCase()

  return (
    <div className="admin-pred-card" style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="admin-pred-header">
        <div>
          <span className="admin-pred-idx">#{item.index}</span>
          <span className="admin-pred-match">{item.home_team} <span style={{ color: '#94a3b8' }}>vs</span> {item.away_team}</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <span className="admin-league-badge">{LEAGUE_LABELS[item.league] || item.league}</span>
          <span className="admin-date-badge">{item.kickoff}</span>
          {item.alert_sent
            ? <span className="admin-alert-badge sent">📲 Sent</span>
            : <span className="admin-alert-badge pending">⏳ No alert</span>}
        </div>
      </div>

      <div className="admin-pred-body">
        <div style={{ flex: 1, minWidth: 180 }}>
          <ProbBar label="Home Win" value={item.home_prob} color="#0ea5e9" />
          <ProbBar label="Draw"     value={item.draw_prob} color="#f59e0b" />
          <ProbBar label="Away Win" value={item.away_prob} color="#8b5cf6" />
        </div>

        <div className="admin-pred-meta">
          <div className="admin-pick" style={{ borderColor: sideColor, color: sideColor }}>
            {sideLabel}
          </div>
          <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: 8, textAlign: 'center' }}>
            <div>Edge: <strong style={{ color: item.edge > 0.02 ? '#10b981' : '#ef4444' }}>{(item.edge * 100).toFixed(2)}%</strong></div>
            <div>Stake: <strong style={{ color: '#0ea5e9' }}>{(item.stake * 100).toFixed(2)}%</strong></div>
            <div>O2.5: <strong>{(item.over_25 * 100).toFixed(1)}%</strong> &nbsp;|&nbsp; BTTS: <strong>{(item.btts * 100).toFixed(1)}%</strong></div>
          </div>
        </div>
      </div>
    </div>
  )
}

function ProgressBar({ current, total }) {
  const pct = total > 0 ? (current / total) * 100 : 0
  return (
    <div style={{ margin: '16px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#64748b', marginBottom: 6 }}>
        <span>Generating predictions…</span>
        <span>{current} / {total}</span>
      </div>
      <div style={{ background: '#e2e8f0', borderRadius: 99, height: 10, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, background: 'linear-gradient(90deg,#0ea5e9,#6366f1)', height: '100%', borderRadius: 99, transition: 'width 0.4s ease' }} />
      </div>
    </div>
  )
}

export default function AdminPanel({ apiKey }) {
  const [status, setStatus]       = useState('idle')
  const [log, setLog]             = useState([])
  const [predictions, setPreds]   = useState([])
  const [progress, setProgress]   = useState({ current: 0, total: 0 })
  const [count, setCount]         = useState(10)
  const [error, setError]         = useState('')
  const esRef                     = useRef(null)
  const bottomRef                 = useRef(null)

  useEffect(() => () => esRef.current?.close(), [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [predictions, log])

  function pushLog(msg) {
    setLog(prev => [...prev, { msg, ts: new Date().toLocaleTimeString() }])
  }

  function startStream() {
    if (esRef.current) {
      esRef.current.close()
    }

    setStatus('running')
    setLog([])
    setPreds([])
    setProgress({ current: 0, total: 0 })
    setError('')

    const params = new URLSearchParams({
      api_key: apiKey,
      count: String(count),
      force_alert: 'true',
    })

    const es = new EventSource(`/admin/stream-predictions?${params}`)
    esRef.current = es

    es.onmessage = (e) => {
      let data
      try { data = JSON.parse(e.data) } catch { return }

      if (data.type === 'status') {
        pushLog(data.message)
      } else if (data.type === 'progress') {
        setProgress({ current: data.current, total: data.total })
        pushLog(`Running ${data.current}/${data.total}: ${data.fixture}`)
      } else if (data.type === 'prediction') {
        setPreds(prev => [...prev, data])
      } else if (data.type === 'error') {
        pushLog(`⚠️ ${data.fixture ? data.fixture + ': ' : ''}${data.message}`)
      } else if (data.type === 'done') {
        pushLog(`✅ Done — ${data.total} predictions generated.`)
        setStatus('done')
        es.close()
      }
    }

    es.onerror = () => {
      if (status !== 'done') {
        setError('Stream connection lost. Check server logs.')
        setStatus('error')
      }
      es.close()
    }
  }

  function stopStream() {
    esRef.current?.close()
    setStatus('stopped')
    pushLog('⛔ Stopped by admin.')
  }

  const isRunning = status === 'running'

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <div>
          <h2 style={{ margin: 0, fontSize: '1.5rem', color: '#0f172a' }}>⚙️ Admin — Batch Predictions</h2>
          <p style={{ margin: '6px 0 0', color: '#64748b', fontSize: '0.95rem' }}>
            Generate predictions for upcoming fixtures across all leagues and push alerts to Telegram.
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <label style={{ fontWeight: 600, color: '#334155', fontSize: '0.9rem' }}>Fixtures:</label>
            <select
              value={count}
              onChange={e => setCount(Number(e.target.value))}
              disabled={isRunning}
              style={{ padding: '8px 12px', borderRadius: 8, border: '2px solid #e2e8f0', fontWeight: 600, background: '#fff' }}
            >
              {[5, 10, 15, 20].map(n => <option key={n} value={n}>{n}</option>)}
            </select>
          </div>

          {!isRunning ? (
            <button className="admin-run-btn" onClick={startStream}>
              ⚡ Generate {count} Predictions
            </button>
          ) : (
            <button className="admin-stop-btn" onClick={stopStream}>
              ⛔ Stop
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert error" style={{ margin: '16px 0 0' }}>{error}</div>}

      {(isRunning || status === 'done' || status === 'stopped') && (
        <>
          {isRunning && <ProgressBar current={progress.current} total={progress.total || count} />}

          <div className="admin-log">
            {log.map((l, i) => (
              <div key={i} className="admin-log-line">
                <span className="admin-log-ts">{l.ts}</span>
                <span>{l.msg}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {predictions.length > 0 && (
        <div style={{ marginTop: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ margin: 0, color: '#0f172a' }}>
              📊 Results <span style={{ color: '#64748b', fontWeight: 400, fontSize: '0.9rem' }}>({predictions.length} predictions)</span>
            </h3>
            <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>
              📲 {predictions.filter(p => p.alert_sent).length} sent to Telegram
            </span>
          </div>
          <div className="admin-pred-list">
            {predictions.map((item, i) => (
              <PredictionCard key={item.match_id || i} item={item} index={i} />
            ))}
          </div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
