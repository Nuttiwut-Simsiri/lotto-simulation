'use client'

import { Fragment, useCallback, useEffect, useRef, useState } from 'react'
import { runRejectionSim, secureDigitsTracked, type Session } from '@/lib/csprng'
import NerdStats from './NerdStats'
import ShopeeAffiliate from './ShopeeAffiliate'

type Mode = 'all' | '6' | '3' | '2'

interface HistoryItem { num: string; time: string; mode: string; n: number }
interface DisplayState { digit: string; lit: boolean }
interface NerdStatsData {
  draws: number; bytes: string; rejRate: string
  entropy: string; sampleSize: string; rejColor: string
}

const REST_POSITIONS = [
  { x: 12, y: 38 }, { x: 32, y: 48 }, { x: 52, y: 48 },
  { x: 22, y: 56 }, { x: 42, y: 58 }, { x: 62, y: 38 },
  { x: 8, y: 22 }, { x: 58, y: 22 }, { x: 30, y: 30 }, { x: 50, y: 32 },
]
const SPIN_POSITIONS = [
  { x: 5, y: 5 }, { x: 28, y: 2 }, { x: 55, y: 8 }, { x: 62, y: 30 }, { x: 55, y: 55 },
  { x: 28, y: 62 }, { x: 5, y: 52 }, { x: 2, y: 28 }, { x: 20, y: 18 }, { x: 45, y: 18 },
]
const BALL_COUNT = 10

const MODE_LABELS: Record<Mode, string> = {
  all: 'ทุกรางวัล (6+3+2)', '6': '6 ตัว', '3': '3 ตัว', '2': '2 ตัว',
}
const HISTORY_LABELS: Record<Mode, string> = {
  all: '6 ตัว', '6': '6 ตัว', '3': '3 ตัว', '2': '2 ตัว',
}

function getNumDigits(m: Mode): number {
  return { all: 6, '6': 6, '3': 3, '2': 2 }[m]
}

function getPosLabels(n: number): string[] {
  if (n === 6) return ['แสนหลัก', 'หมื่น', 'พัน', 'ร้อย', 'สิบ', 'หน่วย']
  if (n === 3) return ['ร้อย', 'สิบ', 'หน่วย']
  return ['สิบ', 'หน่วย']
}

const wait = (ms: number) => new Promise<void>(r => setTimeout(r, ms))
const makeDisplays = (): DisplayState[] => Array(6).fill(null).map(() => ({ digit: '?', lit: false }))

export default function LotteryMachine() {
  const [mode, setMode] = useState<Mode>('all')
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [rolling, setRolling] = useState(false)
  const rollingRef = useRef(false)
  const [status, setStatusState] = useState({ text: 'กดปุ่มเพื่อเริ่มสุ่มเลข', active: false })
  const [result, setResult] = useState({ number: '——', show: false, sub: '' })
  const [subResults, setSubResults] = useState({ d3Top: '—', d2Bot: '—' })
  const [showSubResults, setShowSubResults] = useState(true)
  const [displays, setDisplays] = useState<DisplayState[]>(makeDisplays)
  const [showAffiliate, setShowAffiliate] = useState(false)
  const [nerdOpen, setNerdOpen] = useState(false)
  const [nerdStats, setNerdStats] = useState<NerdStatsData>({
    draws: 0, bytes: '0', rejRate: '—', entropy: '0', sampleSize: '0', rejColor: '',
  })
  const sessionRef = useRef<Session>({ draws: 0, bytesTotal: 0, bytesRejected: 0, entropyBits: 0 })

  useEffect(() => { runRejectionSim(sessionRef.current) }, [])

  // Load persisted history after mount (avoids SSR/client mismatch)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('lotto-history')
      if (stored) setHistory(JSON.parse(stored) as HistoryItem[])
    } catch { /* private browsing or quota */ }
  }, [])

  useEffect(() => {
    try { localStorage.setItem('lotto-history', JSON.stringify(history)) } catch { /* quota exceeded */ }
  }, [history])

  const n = getNumDigits(mode)
  const posLabels = getPosLabels(n)

  const updateStatus = useCallback((text: string, active = false) => {
    setStatusState({ text, active })
  }, [])

  // ── Ball animation helpers (direct DOM, bypasses React reconciler) ──

  const initBalls = useCallback((idx: number) => {
    for (let b = 0; b < BALL_COUNT; b++) {
      const ball = document.getElementById(`ball-${idx}-${b}`)
      if (!ball) continue
      ball.style.cssText = ''
      ball.style.left = REST_POSITIONS[b].x + 'px'
      ball.style.top = REST_POSITIONS[b].y + 'px'
      ball.textContent = ''
    }
  }, [])

  const loadBalls = useCallback((idx: number) => {
    for (let b = 0; b < BALL_COUNT; b++) {
      const ball = document.getElementById(`ball-${idx}-${b}`)
      if (!ball) continue
      ball.style.transition = 'left 0.3s ease, top 0.3s ease'
      ball.style.left = SPIN_POSITIONS[b].x + 'px'
      ball.style.top = SPIN_POSITIONS[b].y + 'px'
      ball.style.opacity = '1'
      ball.textContent = ''
    }
  }, [])

  const shuffleBalls = useCallback((idx: number) => {
    for (let b = 0; b < BALL_COUNT; b++) {
      const ball = document.getElementById(`ball-${idx}-${b}`)
      if (!ball) continue
      ball.style.transition = 'left 0.1s, top 0.1s'
      ball.style.left = (4 + Math.random() * 56) + 'px'
      ball.style.top = (4 + Math.random() * 56) + 'px'
    }
  }, [])

  const settleBalls = useCallback((idx: number) => {
    for (let b = 0; b < BALL_COUNT; b++) {
      const ball = document.getElementById(`ball-${idx}-${b}`)
      if (!ball) continue
      ball.style.transition = 'left 0.5s ease, top 0.5s ease'
      ball.style.left = REST_POSITIONS[b].x + 'px'
      ball.style.top = REST_POSITIONS[b].y + 'px'
    }
  }, [])

  const dropBall = useCallback(async (idx: number, digit: number) => {
    const winner = document.getElementById(`ball-${idx}-0`)
    if (!winner) return
    winner.style.transition = 'left 0.3s ease, top 0.3s ease, background 0.2s'
    winner.style.left = '29px'
    winner.style.top = '64px'
    winner.textContent = String(digit)
    winner.style.fontSize = '9px'
    winner.style.background = 'radial-gradient(circle at 35% 30%, #ff9, #e8a020 45%, #8a5500 100%)'
    await wait(350)
    for (let b = 1; b < BALL_COUNT; b++) {
      const ball = document.getElementById(`ball-${idx}-${b}`)
      if (ball) ball.style.opacity = '0.3'
    }
    await wait(200)
  }, [])

  const animateMachine = useCallback(async (idx: number, digit: number, delay: number) => {
    await wait(delay)
    const drum = document.getElementById(`drum-${idx}`)
    if (!drum) return

    updateStatus(`กำลังหมุนเครื่องหลักที่ ${idx + 1}...`)

    loadBalls(idx)
    await wait(300)

    const targetRot = 720 + Math.random() * 180
    drum.style.transition = 'transform 1.8s cubic-bezier(0.4,0,0.2,1)'
    drum.style.transform = `rotate(${targetRot}deg)`

    const spinInterval = setInterval(() => shuffleBalls(idx), 80)
    await wait(1000)

    clearInterval(spinInterval)
    settleBalls(idx)
    drum.style.transition = 'transform 0.8s ease-out'
    drum.style.transform = 'rotate(0deg)'
    await wait(600)

    await dropBall(idx, digit)
    await wait(150)

    setDisplays(prev => {
      const next = [...prev]
      next[idx] = { digit: String(digit), lit: true }
      return next
    })

    const disp = document.getElementById(`disp-${idx}`)
    if (disp) {
      disp.style.transform = 'scale(1.1)'
      setTimeout(() => { disp.style.transform = 'scale(1)'; disp.style.transition = 'transform 0.2s' }, 150)
    }

    drum.style.transition = 'none'
    drum.style.transform = 'rotate(0deg)'
  }, [loadBalls, shuffleBalls, settleBalls, dropBall, updateStatus])

  const updateNerdStats = useCallback((numDigits: number) => {
    const s = sessionRef.current
    s.draws++
    s.entropyBits += numDigits * Math.log2(10)
    if (s.bytesTotal < 500) runRejectionSim(s)

    const actualRate = s.bytesTotal > 0
      ? (s.bytesRejected / s.bytesTotal * 100).toFixed(2)
      : '0.00'
    const diff = Math.abs(parseFloat(actualRate) - 2.35)
    const rejColor = diff < 1.0 ? '#70d490' : diff < 2.0 ? 'var(--gold-light)' : '#e05050'

    setNerdStats({
      draws: s.draws,
      bytes: s.bytesTotal.toLocaleString(),
      rejRate: actualRate + '%',
      entropy: s.entropyBits.toFixed(1),
      sampleSize: s.bytesTotal.toLocaleString(),
      rejColor,
    })
  }, [])

  const roll = useCallback(async () => {
    if (rollingRef.current) return
    rollingRef.current = true
    setRolling(true)

    const numDigits = getNumDigits(mode)
    const digits = secureDigitsTracked(numDigits, sessionRef.current)

    setDisplays(makeDisplays)
    setResult({ number: '——', show: false, sub: '' })
    setSubResults({ d3Top: '—', d2Bot: '—' })
    for (let i = 0; i < numDigits; i++) initBalls(i)

    updateStatus('กำลังเริ่มออกรางวัล...', true)

    const machineDelay = numDigits === 6 ? 400 : numDigits === 3 ? 550 : 700
    digits.forEach((d, i) => animateMachine(i, d, i * machineDelay))

    // wait for the last machine to finish: its start offset + animation duration
    await wait((numDigits - 1) * machineDelay + 2600)

    const numStr = digits.join('')
    const formatted = numDigits === 6
      ? numStr.slice(0, 3) + ' – ' + numStr.slice(3)
      : numStr.split('').join(' ')
    const sub = mode === 'all'
      ? 'รางวัลที่ 1'
      : ({ '6': 'รางวัลที่ 1 (6 หลัก)', '3': '3 ตัว', '2': '2 ตัว' } as Record<string, string>)[mode] ?? ''

    setResult({ number: formatted, show: true, sub })
    if (mode === 'all') setSubResults({ d3Top: numStr.slice(3), d2Bot: numStr.slice(4) })

    updateStatus('ออกรางวัลเรียบร้อยแล้ว ✦')

    const timeStr = new Date().toTimeString().slice(0, 8)
    setHistory(prev =>
      [{ num: numStr, time: timeStr, mode: HISTORY_LABELS[mode], n: numDigits }, ...prev].slice(0, 10)
    )

    updateNerdStats(numDigits)
    setShowAffiliate(v => !v)
    rollingRef.current = false
    setRolling(false)
  }, [mode, animateMachine, initBalls, updateStatus, updateNerdStats])

  const handleSetMode = useCallback((m: Mode) => {
    if (rollingRef.current) return
    setMode(m)
    setShowSubResults(m === 'all')
    setResult({ number: '——', show: false, sub: '' })
    setSubResults({ d3Top: '—', d2Bot: '—' })
    setDisplays(makeDisplays)
    updateStatus('กดปุ่มเพื่อเริ่มสุ่มเลข')
  }, [updateStatus])

  return (
    <div className="wrapper">
      <header>
        <div className="header-deco">
          <div className="deco-line" />
          <span style={{ color: 'var(--gold)', fontSize: '0.7rem', letterSpacing: '0.2em' }}>✦</span>
          <div className="deco-line r" />
        </div>
        <h1>เครื่องออกรางวัล</h1>
        <div className="sub">Thai Government Lottery — CSPRNG Ball Machine</div>
      </header>

      <div className="mode-tabs">
        {(['all', '6', '3', '2'] as Mode[]).map(m => (
          <button
            key={m}
            className={`mode-tab${mode === m ? ' active' : ''}`}
            onClick={() => handleSetMode(m)}
          >
            {MODE_LABELS[m]}
          </button>
        ))}
      </div>

      <div className={`status${status.active ? ' active' : ''}`}>{status.text}</div>

      <div className="machines-row">
        {Array.from({ length: n }, (_, i) => (
          <Fragment key={`${mode}-${i}`}>
            {n === 6 && i === 3 && (
              <div className="sep-machine">
                <div className="sep-dash">–</div>
              </div>
            )}
            <div className="machine-wrap" id={`wrap-${i}`}>
              <div className="machine-label">{posLabels[i]}</div>
              <div className="machine">
                <div className="drum" id={`drum-${i}`}>
                  <div className="balls-container">
                    {Array.from({ length: BALL_COUNT }, (_, b) => (
                      <div
                        key={b}
                        className="ball"
                        id={`ball-${i}-${b}`}
                        style={{ left: REST_POSITIONS[b].x + 'px', top: REST_POSITIONS[b].y + 'px' }}
                      />
                    ))}
                  </div>
                  <div className="axle" />
                </div>
              </div>
              <div className="stand" />
              <div className="stand-base" />
              <div className="tube" />
              <div className={`result-display${displays[i]?.lit ? ' lit' : ''}`} id={`disp-${i}`}>
                {displays[i]?.digit ?? '?'}
              </div>
            </div>
          </Fragment>
        ))}
      </div>

      <div className="result-banner">
        <div className={`result-number${result.show ? ' show' : ''}`}>{result.number}</div>
        <div className="result-sub">{result.sub}</div>
      </div>

      <button className="roll-btn" onClick={roll} disabled={rolling}>
        ▶ หมุนเครื่องออกรางวัล
      </button>

      {showSubResults && (
        <div className="sub-results">
          <div className="sub-card">
            <div className="sub-card-label">3 ตัวท้าย (บน)</div>
            <div className="sub-digits">{subResults.d3Top}</div>
          </div>
          <div className="sub-card">
            <div className="sub-card-label">2 ตัวท้าย (ล่าง)</div>
            <div className="sub-digits">{subResults.d2Bot}</div>
          </div>
        </div>
      )}

      <div className="history-section">
        <div className="history-header">
          <div className="history-title">ประวัติการสุ่ม</div>
          <button className="clear-btn" onClick={() => { setHistory([]); localStorage.removeItem('lotto-history') }}>ล้างประวัติ</button>
        </div>
        <div className="history-list">
          {history.map((h, idx) => {
            const fmt = h.n === 6
              ? h.num.slice(0, 3) + ' – ' + h.num.slice(3)
              : h.num.split('').join(' ')
            return (
              <div key={idx} className="history-item">
                <span className="history-badge">{h.mode}</span>
                <span className="history-num">{fmt}</span>
                <span className="history-time">{h.time}</span>
              </div>
            )
          })}
        </div>
      </div>

      <ShopeeAffiliate show={showAffiliate} />

      <NerdStats open={nerdOpen} onToggle={() => setNerdOpen(o => !o)} stats={nerdStats} />
    </div>
  )
}
