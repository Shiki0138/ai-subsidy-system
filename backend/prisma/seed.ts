import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const subsidyPrograms = [
  {
    id: 'jizokukahojokin',
    name: '小規模事業者持続化補助金',
    officialName: '小規模事業者持続化補助金（一般型）',
    category: '一般型',
    organizationName: '商工会議所',
    description: '販路開拓・業務効率化の取組を支援',
    purpose: '小規模事業者の持続的発展を目指し、経営計画に基づく販路開拓や業務効率化の取組を支援',
    targetBusiness: '商工会議所の管轄地域内で事業を営んでいる小規模事業者',
    maxAmount: 500000,
    subsidyRate: 0.67,
    applicationStart: new Date('2024-01-01'),
    applicationEnd: new Date('2024-12-31'),
    requirements: {
      employeeLimit: 20,
      businessPlanRequired: true,
      supportPlanRequired: true,
      conditions: [
        '従業員数20人以下',
        '商工会議所の事業支援計画書が必要',
        '補助事業の成果を適切に報告できること'
      ]
    },
    documentFormat: {
      sections: [
        '事業概要',
        '販路開拓等の取組内容',
        '業務効率化の取組内容',
        '事業スケジュール',
        '経費明細'
      ]
    },
    evaluationCriteria: {
      innovativeness: '新規性・独自性',
      feasibility: '実現可能性',
      effectiveness: '事業効果',
      publicBenefit: '政策的意義',
      weights: {
        innovativeness: 25,
        feasibility: 30,
        effectiveness: 30,
        publicBenefit: 15
      }
    },
    isActive: true
  },
  {
    id: 'itdounyu',
    name: 'IT導入補助金',
    officialName: 'IT導入補助金（デジタル化基盤導入類型）',
    category: 'デジタル化基盤導入類型',
    organizationName: '一般社団法人サービスデザイン推進協議会',
    description: 'ITツール導入による業務効率化支援',
    purpose: '中小企業・小規模事業者等がITツールを導入し、業務効率化・売上アップを支援',
    targetBusiness: '中小企業・小規模事業者等',
    maxAmount: 4500000,
    subsidyRate: 0.75,
    applicationStart: new Date('2024-01-01'),
    applicationEnd: new Date('2024-12-31'),
    requirements: {
      employeeLimit: 300,
      itVendorRequired: true,
      conditions: [
        '中小企業・小規模事業者',
        'IT導入支援事業者による申請',
        'gBizIDプライムの取得'
      ]
    },
    documentFormat: {
      sections: [
        '事業概要',
        'IT導入による効果',
        'ITツールの機能要件',
        '導入スケジュール',
        '費用対効果'
      ]
    },
    evaluationCriteria: {
      businessImprovement: '業務改善効果',
      productivity: '生産性向上',
      digitalTransformation: 'デジタル化推進',
      sustainability: '持続可能性',
      weights: {
        businessImprovement: 35,
        productivity: 30,
        digitalTransformation: 25,
        sustainability: 10
      }
    },
    isActive: true
  },
  {
    id: 'monodukuri',
    name: 'ものづくり補助金',
    officialName: 'ものづくり・商業・サービス生産性向上促進補助金',
    category: '一般・グローバル展開型',
    organizationName: '全国中小企業団体中央会',
    description: '革新的な製品・サービス開発支援',
    purpose: '中小企業・小規模事業者等が取り組む革新的サービス開発・試作品開発・生産プロセスの改善を行うための設備投資等を支援',
    targetBusiness: '中小企業・小規模事業者等',
    maxAmount: 10000000,
    subsidyRate: 0.5,
    applicationStart: new Date('2024-01-01'),
    applicationEnd: new Date('2024-12-31'),
    requirements: {
      businessPlanYears: 5,
      supportOrgRequired: true,
      conditions: [
        '認定支援機関の事業計画策定支援',
        '3～5年の事業計画策定',
        '付加価値額年率平均3%以上増加'
      ]
    },
    documentFormat: {
      sections: [
        '事業計画書',
        '技術面での革新性',
        '事業化に向けた取組',
        '政策的意義',
        '費用対効果分析'
      ]
    },
    evaluationCriteria: {
      technicalInnovation: '技術面での革新性',
      marketPotential: '市場ニーズへの適応',
      businessFeasibility: '事業化可能性',
      policyAlignment: '政策的意義',
      weights: {
        technicalInnovation: 30,
        marketPotential: 25,
        businessFeasibility: 30,
        policyAlignment: 15
      }
    },
    isActive: true
  }
]

async function main() {
  console.log('Starting database seeding...')

  for (const program of subsidyPrograms) {
    await prisma.subsidyProgram.upsert({
      where: { id: program.id },
      update: program,
      create: program,
    })
    console.log(`✓ Seeded subsidy program: ${program.name}`)
  }

  console.log('Database seeding completed!')
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })