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

export const metadata: Metadata = {
  title: 'สุ่มเลขหวย — Ball Machine',
  description: 'Thai Government Lottery — CSPRNG Ball Machine',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="th">
      <body className={`${sarabun.variable} ${spaceMono.variable}`}>{children}</body>
    </html>
  )
}
