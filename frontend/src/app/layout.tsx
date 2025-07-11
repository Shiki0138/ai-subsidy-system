import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'AI補助金申請システム',
  description: 'AI技術による高品質な補助金申請書自動生成システム',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  )
}