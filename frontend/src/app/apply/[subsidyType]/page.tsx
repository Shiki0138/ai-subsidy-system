import { Metadata } from 'next'
import { TemplateFormClient } from './TemplateFormClient'
import { SUBSIDY_TEMPLATES } from '@/config/subsidy-templates'

interface PageProps {
  params: {
    subsidyType: string
  }
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const template = SUBSIDY_TEMPLATES[params.subsidyType]
  const title = template ? `${template.name} 申請書作成` : '補助金申請書作成'
  
  return {
    title: `${title} - AI補助金申請システム`,
    description: 'AIが最適な申請書を自動生成します。',
  }
}

export default function ApplyPage({ params }: PageProps) {
  return <TemplateFormClient subsidyType={params.subsidyType} />
}