import { Metadata } from 'next'
import { DashboardClient } from './DashboardClient'

export const metadata: Metadata = {
  title: 'ダッシュボード - AI補助金申請システム',
  description: 'AI補助金申請システムのメインダッシュボード。申請書の作成・管理、進捗状況の確認ができます。',
}

export const dynamic = 'force-dynamic'

export default function DashboardPage() {
  return <DashboardClient />
}