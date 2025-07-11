import { Metadata } from 'next'
import { ApplicationsListClient } from './ApplicationsListClient'

export const metadata: Metadata = {
  title: '申請書管理 - AI補助金申請システム',
  description: '作成済み申請書の一覧表示・管理ページです。',
}

export default function ApplicationsListPage() {
  return <ApplicationsListClient />
}