# สุ่มเลขหวย — เครื่องออกรางวัล CSPRNG

เว็บจำลองเครื่องออกรางวัลสลากกินแบ่งรัฐบาลไทย สุ่มตัวเลขด้วย CSPRNG และ Rejection Sampling เพื่อความสมบูรณ์ทางสถิติ

**Live:** https://lotto-simulation.vercel.app

---

## Features

- เครื่องออกรางวัล 3D พร้อมลูกบอลเคลื่อนไหว แสดงผลรางวัลที่ 1 (6 หลัก), 3 ตัว และ 2 ตัว
- CSPRNG ผ่าน Web Crypto API — ไม่ใช้ `Math.random()`
- Rejection Sampling กำจัด modulo bias ทุกหลักมีโอกาสออก 10% เท่ากันทุกตัว
- Nerd Stats Panel แสดง algorithm, entropy, rejection rate แบบ real-time
- ประวัติการสุ่มย้อนหลัง 10 ครั้ง บันทึกใน localStorage

---

## Algorithm

### CSPRNG + Rejection Sampling

```ts
function secureDigit(): number {
  const buf = new Uint8Array(1)
  let b: number
  do {
    crypto.getRandomValues(buf) // OS-level entropy (/dev/urandom, BCryptGenRandom)
    b = buf[0]                  // 0–255
  } while (b >= 250)            // reject 250–255 (6 values)
  return b % 10                 // 0–249 → 25 values per digit, uniform
}
```

**ทำไมต้อง reject 250–255?**
256 % 10 = 6 ทำให้ digit 0–5 มีโอกาส 26/256 แต่ digit 6–9 มีเพียง 25/256
การ reject ทำให้ 0–249 = 250 values = 25×10 พอดี → uniform 100%

**Expected rejection rate:** ~2.35% (6/256)

### Pre-project Data Analysis

วิเคราะห์ข้อมูลหวยจาก myhora.com ย้อนหลัง 20 ปี (480 งวด)

| Test | Result |
|---|---|
| Chi-Square Goodness-of-Fit | ไม่ reject H₀ (α=0.05) — แต่ละ digit มีโอกาสเท่ากัน |
| Ljung-Box Test | ไม่มี autocorrelation — i.i.d. confirmed |
| Shannon Entropy | ~19.93 bits (≈ theoretical max log₂(10⁶)) |

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | CSS (global, no framework) |
| Font | Sarabun + Space Mono via `next/font/google` |
| Deploy | Vercel |

---

## Getting Started

```bash
npm install
npm run dev
```

เปิด http://localhost:3000

### Build

```bash
npm run build
npm run start
```

---

## Environment Variables

สร้างไฟล์ `.env` ที่ root:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SHOPEE_SHORT_URL="CODE1,CODE2,CODE3"
```

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SITE_URL` | URL ของเว็บ ใช้สำหรับ SEO metadata, sitemap, canonical URL |
| `NEXT_PUBLIC_SHOPEE_SHORT_URL` | Short code ของ Shopee affiliate link คั่นด้วย `,` (เพิ่มได้ไม่จำกัด) |

Shopee short code คือส่วนท้ายของ URL: `https://s.shopee.co.th/**CODE**`

---

## Project Structure

```
app/
  layout.tsx        # Root layout, fonts, global SEO metadata
  page.tsx          # Entry point + JSON-LD structured data
  globals.css       # All styles
  sitemap.ts        # Auto-generated /sitemap.xml
  robots.ts         # Auto-generated /robots.txt
components/
  LotteryMachine.tsx  # Main component — animation, state, roll logic
  NerdStats.tsx       # Algorithm & entropy stats panel
  ShopeeAffiliate.tsx # Affiliate banner + floating widget
lib/
  csprng.ts         # secureDigitsTracked(), runRejectionSim()
```

---

## Operating Modes

| Mode | Digits | Description |
|---|---|---|
| ทุกรางวัล | 6 | รางวัลที่ 1 + 3 ตัวท้าย + 2 ตัวท้าย |
| 6 ตัว | 6 | รางวัลที่ 1 |
| 3 ตัว | 3 | 3 ตัวบน/ล่าง |
| 2 ตัว | 2 | 2 ตัวบน/ล่าง |

---

## Developer Notes

- ใช้ `crypto.getRandomValues()` เท่านั้นสำหรับสุ่มตัวเลข — `Math.random()` ใช้ได้เฉพาะ visual effect (ball animation)
- Ball animation ใช้ direct DOM manipulation (`document.getElementById`) เป็น intentional React escape hatch — React reconciler ไม่ยุ่งกับ inline styles ที่ไม่ได้ track ผ่าน state
- `localStorage` ใช้เก็บประวัติการสุ่ม โหลดใน `useEffect` หลัง mount เพื่อหลีกเลี่ยง SSR hydration mismatch
