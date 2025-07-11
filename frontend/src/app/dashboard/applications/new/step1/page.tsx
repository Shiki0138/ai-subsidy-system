import { Metadata } from 'next'
import { Step1Client } from './Step1Client'

export const metadata: Metadata = {
  title: 'ステップ1: 補助金が必要な理由 - AI補助金申請システム',
  description: '補助金申請の目的と理由を診断するステップです。',
}

export default function Step1Page() {
  return <Step1Client />
}