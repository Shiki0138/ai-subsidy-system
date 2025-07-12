import { Metadata } from 'next'
import { Suspense } from 'react'
import { NewApplicationClient } from './NewApplicationClient'

export const metadata: Metadata = {
  title: '新しい申請書作成 - AI補助金申請システム',
  description: 'AI技術を活用して新しい補助金申請書を作成します。企業情報と事業計画を入力するだけで高品質な申請書を自動生成。',
}

export const dynamic = 'force-dynamic'

export default function NewApplicationPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <NewApplicationClient />
    </Suspense>
  )
}