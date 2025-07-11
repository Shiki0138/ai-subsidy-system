import { Metadata } from 'next'
import { ApplicationDetailsClient } from './ApplicationDetailsClient'

interface PageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: '申請書詳細 - AI補助金申請システム',
  description: 'AI生成された補助金申請書の詳細確認・編集ページです。',
}

export default function ApplicationDetailsPage({ params }: PageProps) {
  return <ApplicationDetailsClient applicationId={params.id} />
}