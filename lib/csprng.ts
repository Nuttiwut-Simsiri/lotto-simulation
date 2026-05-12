export interface Session {
  draws: number
  bytesTotal: number
  bytesRejected: number
  entropyBits: number
}

function secureDigitTracked(session: Session): number {
  const buf = new Uint8Array(1)
  let b: number
  do {
    crypto.getRandomValues(buf)
    b = buf[0]
    session.bytesTotal++
    if (b >= 250) session.bytesRejected++
  } while (b >= 250)
  return b % 10
}

export function secureDigitsTracked(n: number, session: Session): number[] {
  return Array.from({ length: n }, () => secureDigitTracked(session))
}

export function runRejectionSim(session: Session): void {
  const buf = new Uint8Array(1000)
  crypto.getRandomValues(buf)
  for (const b of buf) {
    session.bytesTotal++
    if (b >= 250) session.bytesRejected++
  }
}
