เพื่อให้ไฟล์ `CLAUDE.md` ดูเป็นมืออาชีพและเป็นสากลมากขึ้น ผมได้ปรับแก้ภาษาอังกฤษโดยรักษาเนื้อหาทางเทคนิค (Technical Terms) ไว้อย่างครบถ้วนครับ

---

# CLAUDE.md — Project Context

## Project Overview

A web-based Thai Lottery randomizer designed to match the randomness of official drawing machines. The UI features a 3D-simulated transparent spherical machine with red balls, mirroring the actual equipment used by the Government Lottery Office (GLO).

---

## Pre-Project Data Analysis

* **Dataset**: Scraped 20 years of historical data from *myhora.com*, totaling **480 draws** (April 1, 2006 – Present).
* **Chi-Square Goodness-of-Fit Test**: Failed to reject $H_0$ ($\alpha = 0.05$); each digit has an equal probability of appearing.
* **Ljung-Box Test**: No significant autocorrelation between draws (i.i.d. confirmed).
* **Shannon Entropy**: $\approx 19.93$ bits (approaching theoretical maximum $log_2(10^6) = 19.93$ bits), indicating near-perfect randomness.

**Conclusion:** The 1st Prize outcome cannot be predicted using any mathematical patterns or equations.

---

## Randomization Algorithm

### 1. CSPRNG — Cryptographically Secure PRNG

The app utilizes the **Web Crypto API** instead of `Math.random()`, as the latter uses a predictable seed and is not cryptographically secure.

* **Entropy Source**: OS-level pools (e.g., `/dev/urandom` on Linux, `BCryptGenRandom` on Windows, `SecRandomCopyBytes` on macOS/iOS).

### 2. Rejection Sampling — Eliminating Modulo Bias

To ensure a perfectly uniform distribution, we implement rejection sampling to avoid **Modulo Bias**.

```js
function secureDigit() {
  const buf = new Uint8Array(1);
  let b;
  do {
    crypto.getRandomValues(buf);
    b = buf[0]; // Range: 0–255
  } while (b >= 250); // Reject values 250–255
  return b % 10; // 0–249 maps perfectly to 0–9 (25 times each)
}

```

**Why reject 250–255?**

* Without rejection, $256 \pmod{10}$ results in digits 0–5 having a $26/256$ probability, while 6–9 have $25/256$.
* By rejecting values $\ge 250$, every digit has an exact $25/250$ (**10%**) probability.
* **Expected Rejection Rate**: $\approx 2.35\%$ ($6/256$).

### 3. i.i.d. — Independent and Identically Distributed

Each digit is sampled independently, ensuring no correlation between positions—matching the characteristics found in the 20-year historical dataset.

---

## File Structure

* **`lottery_machine.html`**: A standalone single-file application containing:
* **UI**: Spherical drawing machine (CSS + SVG), digit displays, and history log.
* **Logic**: CSPRNG core, rejection sampling, and mode switching.
* **Nerd Stats Panel**: An expandable dashboard showing algorithm details, real-time entropy, and session stats.



---

## Operating Modes

| Mode | Digits | Description |
| --- | --- | --- |
| `all` | 6 | Full 1st Prize + Automatic 3-digit and 2-digit generation. |
| `6` | 6 | 1st Prize only. |
| `3` | 3 | 3-digit prize (Top/Bottom). |
| `2` | 2 | 2-digit prize (Top/Bottom). |

---

## Animation Sequence (Per Machine)

1. **Phase 1 (300ms)**: 10 balls disperse and fill the dome.
2. **Phase 2 (1000ms)**: Dome rotates $720^\circ$+; balls move chaotically.
3. **Phase 3 (600ms)**: Rotation slows down; balls settle.
4. **Phase 4**: The winning ball (Gold) drops into the tube; the digit display lights up.

*Machines trigger sequentially from left to right with varying delays (400ms–700ms) based on the selected mode.*

---

## Nerd Stats Panel

Includes a toggle-able dashboard for transparency:

* **Algorithm Breakdown**: Badges and descriptions for CSPRNG, Rejection Sampling, and i.i.d.
* **Entropy Monitor**: Visual bar and bit calculation ($H = n \times log_2 10$).
* **Modulo Bias Visualizer**: Bar chart comparing `Math.random()` vs. CSPRNG.
* **Session Statistics**: Tracking total draws, bytes consumed, real-time rejection rate, and accumulated entropy.

---

## Design System

* **Palette**:
* `--bg`: `#0d1117` (Deep Dark)
* `--gold`: `#d4a843` (Primary Accent)
* `--red-ball`: `#e8392a` (Ball color)


* **Typography**:
* **Sarabun**: Thai UI
* **Space Mono**: Numerical data and code snippets



---

## Developer Notes

* **Strict Rule**: Only use `crypto.getRandomValues()` for number generation. `Math.random()` is permitted only for visual-only effects (e.g., ball shuffling).
* **Performance**: The app runs `runRejectionSim()` (1,000 samples) on load to pre-warm the statistics panel.
* **Rejection Monitoring**: Real-world rejection rates should hover between 2.0%–2.7% once the sample size exceeds 500 bytes.

## สิ่งที่ยังไม่ได้ทำ / อาจทำต่อ

- [ ] Port algorithm ไป **Rust** (ใช้ `rand::rngs::OsRng`)
- [ ] Port ไป **MQL5** (ใช้ `CryptRand()` หรือ Windows CryptoAPI)
- [ ] เพิ่มเสียง SFX ตอนลูกบอลหมุน/ตก
- [ ] Export ผลลัพธ์เป็น CSV
- [ ] Backend API สำหรับ audit log