import { Metadata } from 'next'
import { EditApplicationClient } from './EditApplicationClient'

interface PageProps {
  params: {
    id: string
  }
}

export const metadata: Metadata = {
  title: '申請書編集 - AI補助金申請システム',
  description: 'AI生成された補助金申請書の編集ページです。',
}

export default function EditApplicationPage({ params }: PageProps) {
  return <EditApplicationClient applicationId={params.id} />
}