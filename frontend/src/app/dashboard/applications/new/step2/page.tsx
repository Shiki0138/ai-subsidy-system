import { Metadata } from 'next'
import { Step2Client } from './Step2Client'

export const metadata: Metadata = {
  title: 'ステップ2: 自社情報の読み込み - AI補助金申請システム',
  description: '企業ホームページやドキュメントから自社情報を自動取得するステップです。',
}

export default function Step2Page() {
  return <Step2Client />
}