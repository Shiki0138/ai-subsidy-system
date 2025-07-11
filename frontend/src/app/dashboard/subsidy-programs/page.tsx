import { Metadata } from 'next'
import { SubsidyProgramsClient } from './SubsidyProgramsClient'

export const metadata: Metadata = {
  title: '補助金情報 - AI補助金申請システム',
  description: '利用可能な補助金プログラムの一覧と詳細情報です。',
}

export default function SubsidyProgramsPage() {
  return <SubsidyProgramsClient />
}