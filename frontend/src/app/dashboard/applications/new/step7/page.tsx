import { Metadata } from 'next'
import { Step7Client } from './Step7Client'

export const metadata: Metadata = {
  title: 'ステップ7: PDF出力・完了 - AI補助金申請システム',
  description: '完成した申請書をPDF形式で出力し、申請手続きを完了するステップです。',
}

export default function Step7Page() {
  return <Step7Client />
}