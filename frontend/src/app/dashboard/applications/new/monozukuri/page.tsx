import { Metadata } from 'next'
import { MonozukuriQuickForm } from '../MonozukuriQuickForm'

export const metadata: Metadata = {
  title: 'ものづくり補助金申請 - AI補助金申請システム',
  description: 'ものづくり補助金の申請書を自動生成します'
}

export default function MonozukuriApplicationPage() {
  return <MonozukuriQuickForm />
}