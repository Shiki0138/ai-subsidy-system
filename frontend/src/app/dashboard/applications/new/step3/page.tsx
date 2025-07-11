import { Metadata } from 'next'
import { Step3Client } from './Step3Client'

export const metadata: Metadata = {
  title: 'ステップ3: 補助金の確定 - AI補助金申請システム',
  description: '企業情報と申請目的に基づいて最適な補助金プログラムを選定するステップです。',
}

export default function Step3Page() {
  return <Step3Client />
}