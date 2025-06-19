import { Metadata } from 'next'
import { Step5Client } from './Step5Client'

export const metadata: Metadata = {
  title: 'ステップ5: 採択事例の確認 - AI補助金申請システム',
  description: '選択した補助金の過去の採択事例を分析し、成功パターンを学習するステップです。',
}

export default function Step5Page() {
  return <Step5Client />
}