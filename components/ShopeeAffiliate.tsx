'use client'

import { useEffect, useRef, useState } from 'react'

// ─── Config ─────────────────────────────────────────────────────────────────
// Edit NEXT_PUBLIC_SHOPEE_SHORT_URL in .env to add/remove/reorder URLs.
// Format: comma-separated short codes, e.g. "BQZvdhhqE,9ALOYXetw8,W3QGPshtt"
// Each code is appended to the Shopee base URL below.
const BASE = 'https://s.shopee.co.th/'

const SHOPEE_URLS: string[] = (process.env.NEXT_PUBLIC_SHOPEE_SHORT_URL ?? '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .map(code => BASE + code)

function pickRandom(urls: string[]): string {
  if (urls.length === 0) return '#'
  return urls[Math.floor(Math.random() * urls.length)]
}
// ─────────────────────────────────────────────────────────────────────────────

interface Props {
  show: boolean
}

export default function ShopeeAffiliate({ show }: Props) {
  const [inlineVisible, setInlineVisible] = useState(false)
  const [inlineUrl, setInlineUrl] = useState(SHOPEE_URLS[0] ?? '#')
  const [floatVisible, setFloatVisible] = useState(false)
  const [floatDismissed, setFloatDismissed] = useState(false)
  const floatTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const didScheduleFloat = useRef(false)

  // Float widget: appears once after 8 s, uses a random URL picked on mount
  const floatUrl = useRef(SHOPEE_URLS[0] ?? '#')

  // Randomize both URLs after mount so SSR and client start with the same value
  useEffect(() => {
    floatUrl.current = pickRandom(SHOPEE_URLS)
    setInlineUrl(pickRandom(SHOPEE_URLS))
  }, [])

  useEffect(() => {
    if (!didScheduleFloat.current && !floatDismissed) {
      didScheduleFloat.current = true
      floatTimerRef.current = setTimeout(() => setFloatVisible(true), 8000)
    }
    return () => {
      if (floatTimerRef.current) clearTimeout(floatTimerRef.current)
    }
  }, [floatDismissed])

  // Inline banner: re-animate and pick a new random URL on every roll
  useEffect(() => {
    if (!show) return
    setInlineUrl(pickRandom(SHOPEE_URLS))
    setInlineVisible(false)
    const raf = requestAnimationFrame(() =>
      requestAnimationFrame(() => setInlineVisible(true))
    )
    return () => cancelAnimationFrame(raf)
  }, [show])

  return (
    <>
      <div className={`shopee-inline${inlineVisible ? ' visible' : ''}`}>
        <a className="shopee-inline-inner" href={inlineUrl} target="_blank" rel="noopener noreferrer"
          onClick={() => setInlineUrl(pickRandom(SHOPEE_URLS))}>
          <div className="shopee-inline-left">
            <div className="shopee-dot" />
            <div className="shopee-inline-text">
              <strong>Shopee Flash Sale</strong> กำลังมีโปรอยู่ตอนนี้<br />
              สนับสนุนเว็บนี้ได้ด้วยการช้อปผ่านลิงค์นี้ครับ
            </div>
          </div>
          <div className="shopee-inline-cta">ช้อปเลย →</div>
        </a>
      </div>

      <div className={`shopee-float${floatVisible && !floatDismissed ? ' visible' : ''}`}>
        <a className="shopee-float-inner" href={floatUrl.current} target="_blank" rel="noopener noreferrer"
          onClick={() => { floatUrl.current = pickRandom(SHOPEE_URLS) }}>
          <div className="shopee-float-logo">🛍</div>
          <div className="shopee-float-label">
            <b>Flash Sale</b> กำลังจัดอยู่<br />
            <span style={{ fontSize: '0.62rem', opacity: 0.7 }}> แบรนด์แท้ ลดแรง ราคาเริ่ดๆ</span>
          </div>
        </a>
        <div className="shopee-float-close" onClick={() => setFloatDismissed(true)}>✕</div>
      </div>
    </>
  )
}
