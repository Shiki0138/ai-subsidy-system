import { Metadata } from 'next'
import { DocumentsClient } from './DocumentsClient'

interface PageProps {
  params: { id: string }
}

export const metadata: Metadata = {
  title: '申請書類管理 - AI補助金申請システム',
  description: '申請書類の自動入力とPDF生成'
}

export default function ApplicationDocumentsPage({ params }: PageProps) {
  return <DocumentsClient applicationId={params.id} />
}