import type { Metadata } from 'next'
import { Sarabun, Space_Mono } from 'next/font/google'
import './globals.css'

const sarabun = Sarabun({
  subsets: ['thai', 'latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-sarabun',
  display: 'swap',
})

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
})

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'สุ่มเลขหวย — เครื่องออกรางวัล CSPRNG',
    template: '%s | สุ่มเลขหวย',
  },
  description:
    'สุ่มเลขสลากกินแบ่งรัฐบาลด้วย CSPRNG และ Rejection Sampling — ทุกหลักมีโอกาสออกเท่ากัน 10% ไม่มี bias รองรับรางวัลที่ 1 (6 หลัก), 3 ตัว และ 2 ตัว',
  keywords: [
    'สุ่มเลขหวย', 'หวย', 'สลากกินแบ่งรัฐบาล', 'เครื่องออกรางวัล',
    'CSPRNG', 'random lottery', 'Thai lottery', 'สุ่มตัวเลข',
  ],
  authors: [{ name: 'Lotto Simulation' }],
  creator: 'Lotto Simulation',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'th_TH',
    url: SITE_URL,
    siteName: 'สุ่มเลขหวย',
    title: 'สุ่มเลขหวย — เครื่องออกรางวัล CSPRNG',
    description:
      'สุ่มเลขสลากกินแบ่งรัฐบาลด้วย CSPRNG และ Rejection Sampling ทุกหลักมีโอกาสออกเท่ากัน 10%',
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: 'สุ่มเลขหวย — เครื่องออกรางวัล' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'สุ่มเลขหวย — เครื่องออกรางวัล CSPRNG',
    description: 'สุ่มเลขสลากกินแบ่งรัฐบาลด้วย CSPRNG และ Rejection Sampling ทุกหลักมีโอกาสออกเท่ากัน 10%',
    images: ['/og-image.png'],
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} ${spaceMono.variable}`}>{children}</body>
    </html>
  )
}
