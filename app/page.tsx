import LotteryMachine from '@/components/LotteryMachine'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://example.com'

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'สุ่มเลขหวย — เครื่องออกรางวัล CSPRNG',
  description:
    'สุ่มเลขสลากกินแบ่งรัฐบาลด้วย CSPRNG และ Rejection Sampling — ทุกหลักมีโอกาสออกเท่ากัน 10% ไม่มี bias',
  url: SITE_URL,
  applicationCategory: 'UtilityApplication',
  operatingSystem: 'Any',
  inLanguage: 'th',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'THB' },
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LotteryMachine />
    </>
  )
}
