import { Metadata } from 'next'
import { IntegratedKnowledgeBaseManager } from '@/components/subsidy/IntegratedKnowledgeBaseManager'

export const metadata: Metadata = {
  title: '知識ベース統合管理 - AI補助金申請システム',
  description: '全補助金の知識ベースを1ページで完結管理。アップロード書類やウェブサイトの詳細も一覧表示。',
}

export default function KnowledgeBasePage() {
  return <IntegratedKnowledgeBaseManager />
}