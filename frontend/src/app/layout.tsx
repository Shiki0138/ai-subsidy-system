import type { Metadata } from 'next'
import { Inter, Noto_Sans_JP } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansJP = Noto_Sans_JP({
  subsets: ['latin'],
  variable: '--font-noto-sans-jp',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'AI補助金申請システム',
  description: 'AI技術による高品質な補助金申請書自動生成システム',
}

export function generateViewport() {
  return {
    width: 'device-width',
    initialScale: 1,
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja" className={`${inter.variable} ${notoSansJP.variable}`}>
      <head />
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}