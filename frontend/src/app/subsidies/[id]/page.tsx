import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SubsidyDetailClient } from './SubsidyDetailClient'

interface PageProps {
  params: { id: string }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  // 実際にはAPIから取得
  const subsidyName = params.id === 'jizokukahojokin' 
    ? '小規模事業者持続化補助金'
    : params.id === 'itdounyu'
    ? 'IT導入補助金'
    : 'ものづくり補助金'

  return {
    title: `${subsidyName} - AI補助金申請システム`,
    description: `${subsidyName}の詳細情報、必要書類、申請方法について`
  }
}

export default function SubsidyDetailPage({ params }: PageProps) {
  const validIds = ['jizokukahojokin', 'itdounyu', 'monozukuri']
  
  if (!validIds.includes(params.id)) {
    notFound()
  }

  return <SubsidyDetailClient subsidyId={params.id} />
}