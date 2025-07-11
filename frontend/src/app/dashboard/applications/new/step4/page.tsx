import { Metadata } from 'next'
import { Step4Client } from './Step4Client'

export const metadata: Metadata = {
  title: 'ステップ4: 募集要項の確認 - AI補助金申請システム',
  description: '選択した補助金の詳細な募集要項を確認・分析するステップです。',
}

export default function Step4Page() {
  return <Step4Client />
}