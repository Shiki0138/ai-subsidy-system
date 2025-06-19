import { Metadata } from 'next'
import { Step6Client } from './Step6Client'

export const metadata: Metadata = {
  title: 'ステップ6: AI申請書作成支援 - AI補助金申請システム',
  description: 'AIが質問を生成し、回答に基づいて申請書を自動作成するステップです。',
}

export default function Step6Page() {
  return <Step6Client />
}