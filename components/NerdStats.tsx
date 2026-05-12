const BIASED_WEIGHTS = [26, 26, 26, 26, 26, 26, 25, 25, 25, 25]
const UNIFORM_WEIGHTS = Array<number>(10).fill(25)
const MAX_W = 26

interface Stats {
  draws: number
  bytes: string
  rejRate: string
  entropy: string
  sampleSize: string
  rejColor: string
}

interface Props {
  open: boolean
  onToggle: () => void
  stats: Stats
}

function BiasViz({ weights, type }: { weights: number[]; type: 'biased' | 'uniform' }) {
  return (
    <div className="bias-row">
      {weights.map((w, d) => (
        <div key={d} className="bias-col">
          <div className="bias-bar-wrap">
            <div className={`bias-bar ${type}`} style={{ height: Math.round(w / MAX_W * 100) + '%' }} />
          </div>
          <div className="bias-digit">{d}</div>
        </div>
      ))}
    </div>
  )
}

export default function NerdStats({ open, onToggle, stats }: Props) {
  return (
    <>
      <div
        className="nerd-toggle-row"
        onClick={onToggle}
        style={{ borderRadius: open ? '10px 10px 0 0' : '10px' }}
      >
        <div className="nerd-toggle-label">
          <span className="nerd-icon">⚙</span>
          <span>Nerd Stats — Algorithm & Entropy</span>
        </div>
        <div className={`toggle-sw${open ? ' on' : ''}`} />
      </div>

      <div className={`nerd-panel${open ? ' open' : ''}`}>
        <div className="nerd-section-title">Algorithm ที่ใช้</div>
        <div className="algo-grid">
          <div className="algo-item">
            <span className="algo-badge badge-csprng">CSPRNG</span>
            <div className="algo-text">
              ใช้ <code>crypto.getRandomValues()</code> (Web Crypto API) ซึ่ง browser เรียก OS-level entropy pool
              (Linux: <code>/dev/urandom</code>, Windows: <code>BCryptGenRandom</code>) — ไม่ใช่{' '}
              <code>Math.random()</code> ที่ seed ได้
            </div>
          </div>
          <div className="algo-item">
            <span className="algo-badge badge-rej">Rejection Sampling</span>
            <div className="algo-text">
              สุ่ม byte 0–255 → รับเฉพาะ 0–249 (250 ค่า = 25×10 พอดี) → <code>byte % 10</code> = digit ที่ uniform
              ทุกตัว ถ้าได้ 250–255 → สุ่มใหม่ หลีกเลี่ยง modulo bias ที่ทำให้เลข 0–5 ออกบ่อยกว่า
            </div>
          </div>
          <div className="algo-item">
            <span className="algo-badge badge-iid">i.i.d.</span>
            <div className="algo-text">
              แต่ละหลักสุ่มอิสระจากกัน (Independent and Identically Distributed) ตรงกับที่ข้อมูล myhora 480 งวดผ่าน
              Ljung-Box test — ไม่มี autocorrelation ระหว่างหลัก
            </div>
          </div>
        </div>

        <div className="nerd-section-title">Entropy Monitor (live)</div>
        {[
          { label: '6 หลัก — รางวัลที่ 1', pct: 99.85, val: '19.93 bits' },
          { label: '3 หลัก — 3 ตัวบน/ล่าง', pct: 50.0, val: '9.97 bits' },
          { label: '2 หลัก — 2 ตัวบน/ล่าง', pct: 33.3, val: '6.64 bits' },
        ].map(e => (
          <div key={e.label} className="entropy-row">
            <div className="entropy-label">{e.label}</div>
            <div className="entropy-track">
              <div className="entropy-fill" style={{ width: e.pct + '%' }} />
            </div>
            <div className="entropy-val">{e.val}</div>
          </div>
        ))}
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '6px', lineHeight: 1.6, fontFamily: 'var(--font-sarabun)' }}>
          Shannon Entropy H = n × log₂(10) bits &nbsp;|&nbsp; Max entropy หมายความว่าทุก outcome มีโอกาสเท่ากัน = random สมบูรณ์ที่สุด
        </div>

        <div className="nerd-section-title">Modulo Bias — ทำไมต้อง Rejection Sampling?</div>
        <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
          <div>
            <div className="bias-title">❌ Math.random() × 10 (มี bias)</div>
            <BiasViz weights={BIASED_WEIGHTS} type="biased" />
          </div>
          <div>
            <div className="bias-title">✅ CSPRNG + Rejection (uniform)</div>
            <BiasViz weights={UNIFORM_WEIGHTS} type="uniform" />
          </div>
        </div>
        <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)', marginTop: '8px', lineHeight: 1.6, fontFamily: 'var(--font-sarabun)' }}>
          ความสูงแท่ง = สัดส่วนโอกาสออก &nbsp;|&nbsp; 256 % 10 = 6 ทำให้ digit 0–5 มีโอกาส 26/256 แต่ digit 6–9 มีเพียง 25/256
        </div>

        <div className="nerd-section-title">Session Statistics</div>
        <div className="stat-grid">
          <div className="stat-item">
            <div className="stat-label">จำนวนครั้งที่สุ่ม</div>
            <div className="stat-value">{stats.draws}</div>
            <div className="stat-sub">งวดนี้</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Total Bytes Used</div>
            <div className="stat-value">{stats.bytes}</div>
            <div className="stat-sub">จาก CSPRNG pool</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Rejection Rate</div>
            <div className="stat-value" style={{ color: stats.rejColor || undefined }}>{stats.rejRate}</div>
            <div className="stat-sub">expected ≈ 2.35% | n={stats.sampleSize}</div>
          </div>
          <div className="stat-item">
            <div className="stat-label">Entropy Generated</div>
            <div className="stat-value">{stats.entropy}</div>
            <div className="stat-sub">bits สะสม</div>
          </div>
        </div>
      </div>
    </>
  )
}
