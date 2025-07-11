/**
 * 補助金募集要項のサンプルデータを投入するスクリプト
 */

import { PrismaClient } from '@prisma/client'
import { addDays } from 'date-fns'

const prisma = new PrismaClient()

async function seedSubsidyData() {
  console.log('🌱 補助金データのシード開始...')

  try {
    // 1. 小規模事業者持続化補助金
    const jizokukahojokin = await prisma.subsidyProgram.upsert({
      where: { id: 'jizokukahojokin' },
      update: {},
      create: {
        id: 'jizokukahojokin',
        name: '小規模事業者持続化補助金',
        officialName: '令和6年度小規模事業者持続化補助金＜一般型＞',
        category: '販路開拓・業務効率化',
        organizationName: '全国商工会連合会',
        description: '小規模事業者の販路開拓や業務効率化の取組を支援',
        purpose: '小規模事業者の持続的な経営を支援し、地域経済の活性化を図る',
        targetBusiness: '従業員20人以下（商業・サービス業は5人以下）の小規模事業者',
        maxAmount: 500000,
        subsidyRate: 0.67,
        applicationStart: new Date('2024-04-01'),
        applicationEnd: new Date('2024-06-30'),
        requirements: {
          businessSize: ['従業員20人以下', '商業・サービス業は5人以下'],
          otherRequirements: ['商工会議所の支援を受けること', '事業計画書の作成']
        },
        evaluationCriteria: {
          criteria: [
            { name: '事業の必要性', weight: 0.3 },
            { name: '実現可能性', weight: 0.3 },
            { name: '効果・成果', weight: 0.4 }
          ]
        },
        isActive: true
      }
    })

    // 小規模事業者持続化補助金のガイドライン
    await prisma.subsidyGuideline.create({
      data: {
        subsidyProgramId: jizokukahojokin.id,
        version: '2024年度第1回',
        title: '令和6年度小規模事業者持続化補助金＜一般型＞募集要項',
        purpose: '小規模事業者の販路開拓等の取組を支援し、持続的な経営を実現する',
        overview: '販路開拓や業務効率化に取り組む小規模事業者に対し、経費の一部を補助',
        targetBusinessSize: ['小規模'],
        targetIndustries: ['全業種'],
        eligibilityRequirements: {
          mandatory: [
            '従業員数が20人以下（商業・サービス業は5人以下）',
            '商工会議所の管轄地域で事業を営んでいること',
            '持続的な経営に向けた経営計画を策定していること'
          ],
          optional: ['過去3年以内に同補助金の交付を受けていないこと']
        },
        minAmount: 300000,
        maxAmount: 500000,
        subsidyRate: 0.67,
        subsidyDetails: {
          targetExpenses: [
            '機械装置等費',
            '広報費',
            'ウェブサイト関連費',
            '展示会等出展費',
            '旅費',
            '開発費',
            '資料購入費',
            '雑役務費',
            '借料',
            '設備処分費',
            '委託・外注費'
          ],
          nonTargetExpenses: [
            '人件費',
            '不動産購入費',
            '車両購入費（特殊用途車両を除く）'
          ]
        },
        applicationStart: new Date('2024-04-01'),
        applicationEnd: new Date('2024-06-30'),
        evaluationCriteria: {
          items: [
            {
              name: '事業の必要性・重要性',
              description: '自社の経営課題を的確に把握し、その解決に必要な取組であるか',
              weight: 0.3,
              keywords: ['経営課題', '解決策', '必要性', '重要性', '緊急性']
            },
            {
              name: '事業の実現可能性',
              description: '事業実施のための体制や計画が具体的で実現可能か',
              weight: 0.3,
              keywords: ['実施体制', '計画性', '具体性', '実現可能性', 'スケジュール']
            },
            {
              name: '事業の効果・成果',
              description: '売上向上や業務効率化などの効果が見込めるか',
              weight: 0.4,
              keywords: ['売上向上', '業務効率化', '顧客満足度', '競争力強化', '数値目標']
            }
          ]
        },
        scoringWeights: {
          necessity: 0.3,
          feasibility: 0.3,
          effectiveness: 0.4
        },
        requiredDocuments: {
          mandatory: [
            '経営計画書',
            '補助事業計画書',
            '事業支援計画書（商工会議所発行）',
            '決算書（直近2期分）',
            '見積書（単価50万円以上の場合）'
          ],
          conditional: [
            '許認可証の写し（該当業種の場合）',
            '従業員数を証明する書類'
          ]
        },
        importantKeywords: [
          '販路開拓',
          '新規顧客獲得',
          '業務効率化',
          '生産性向上',
          'DX推進',
          '地域活性化',
          '持続的経営',
          '売上向上',
          '顧客満足度向上',
          '競争力強化'
        ],
        evaluationPhrases: [
          '具体的な数値目標を設定し',
          '明確な効果測定指標により',
          '持続的な経営改善につながる',
          '地域経済の活性化に寄与する',
          '他の小規模事業者の模範となる'
        ],
        guidelinePdfUrl: 'https://example.com/jizokukahojokin_guideline.pdf',
        faqUrl: 'https://example.com/jizokukahojokin_faq',
        status: 'ACTIVE',
        publishedAt: new Date('2024-03-15')
      }
    })

    // 2. IT導入補助金
    const itHojokin = await prisma.subsidyProgram.upsert({
      where: { id: 'itdounyu' },
      update: {},
      create: {
        id: 'itdounyu',
        name: 'IT導入補助金',
        officialName: 'IT導入補助金2024（デジタル化基盤導入類型）',
        category: 'デジタル化・DX推進',
        organizationName: '一般社団法人サービスデザイン推進協議会',
        description: 'ITツール導入による業務効率化・DX推進を支援',
        purpose: '中小企業・小規模事業者等のデジタル化を推進し、生産性向上を実現',
        targetBusiness: '中小企業・小規模事業者',
        maxAmount: 4500000,
        subsidyRate: 0.75,
        applicationStart: new Date('2024-04-15'),
        applicationEnd: new Date('2024-07-15'),
        requirements: {
          businessSize: ['中小企業', '小規模事業者'],
          otherRequirements: ['IT導入支援事業者と連携', 'ITツールの導入']
        },
        isActive: true
      }
    })

    // IT導入補助金のガイドライン
    await prisma.subsidyGuideline.create({
      data: {
        subsidyProgramId: itHojokin.id,
        version: '2024年度',
        title: 'IT導入補助金2024 デジタル化基盤導入類型 公募要領',
        purpose: 'インボイス対応も見据えた企業間取引のデジタル化推進',
        overview: '会計ソフト・受発注ソフト・決済ソフト・ECソフトの導入費用を補助',
        targetBusinessSize: ['中小企業', '小規模事業者'],
        targetIndustries: ['全業種'],
        eligibilityRequirements: {
          mandatory: [
            '日本国内で事業を行う中小企業・小規模事業者等',
            'IT導入支援事業者と共同で事業を実施すること',
            '交付申請時点で事業を営んでいること'
          ]
        },
        minAmount: 50000,
        maxAmount: 4500000,
        subsidyRate: 0.75,
        subsidyDetails: {
          targetExpenses: [
            'ソフトウェア購入費',
            'クラウド利用料（最大2年分）',
            '導入関連費（導入コンサルティング、導入設定等）',
            'ハードウェア購入費（PC、タブレット、レジ等）'
          ],
          subsidyRateDetails: {
            '50万円以下': 0.75,
            '50万円超〜350万円': 0.67,
            'ハードウェア': 0.5
          }
        },
        applicationStart: new Date('2024-04-15'),
        applicationEnd: new Date('2024-07-15'),
        evaluationCriteria: {
          items: [
            {
              name: '生産性向上の効果',
              description: 'ITツール導入により期待される生産性向上効果',
              weight: 0.4,
              keywords: ['生産性向上', '業務時間削減', '効率化', '自動化', 'デジタル化']
            },
            {
              name: '事業計画の妥当性',
              description: '導入計画の具体性と実現可能性',
              weight: 0.3,
              keywords: ['計画性', '具体性', '実現可能性', '導入体制', '活用計画']
            },
            {
              name: '政策加点項目',
              description: 'インボイス対応、賃上げ、地域経済牽引等',
              weight: 0.3,
              keywords: ['インボイス', '賃上げ', '地域貢献', 'サイバーセキュリティ']
            }
          ]
        },
        importantKeywords: [
          'デジタル化',
          'DX推進',
          '生産性向上',
          '業務効率化',
          'インボイス対応',
          'クラウド化',
          'ペーパーレス',
          'テレワーク',
          'データ連携',
          'セキュリティ強化'
        ],
        evaluationPhrases: [
          'デジタル化による抜本的な業務改革',
          '定量的な生産性向上効果',
          'データを活用した経営判断',
          '取引先を含めたサプライチェーン全体の効率化',
          'サイバーセキュリティ対策の強化'
        ],
        status: 'ACTIVE',
        publishedAt: new Date('2024-04-01')
      }
    })

    // 3. ものづくり補助金
    const monozukuri = await prisma.subsidyProgram.upsert({
      where: { id: 'monozukuri' },
      update: {},
      create: {
        id: 'monozukuri',
        name: 'ものづくり補助金',
        officialName: 'ものづくり・商業・サービス生産性向上促進補助金',
        category: '設備投資・技術開発',
        organizationName: '全国中小企業団体中央会',
        description: '革新的サービス開発・生産プロセス改善を支援',
        purpose: '中小企業の革新的な設備投資やサービス開発を支援し、生産性向上を実現',
        targetBusiness: '中小企業・小規模事業者',
        maxAmount: 10000000,
        subsidyRate: 0.5,
        applicationStart: new Date('2024-05-01'),
        applicationEnd: new Date('2024-08-20'),
        requirements: {
          businessSize: ['中小企業'],
          otherRequirements: ['3年以上の事業実績', '付加価値向上計画の策定']
        },
        isActive: true
      }
    })

    // サンプル成功事例の追加
    const guideline = await prisma.subsidyGuideline.findFirst({
      where: { subsidyProgramId: jizokukahojokin.id }
    })

    if (guideline) {
      await prisma.successCase.createMany({
        data: [
          {
            guidelineId: guideline.id,
            companyName: '株式会社A（製造業）',
            projectTitle: 'ECサイト構築による新規顧客開拓事業',
            applicationYear: 2023,
            businessPlan: {
              background: 'コロナ禍による対面営業の制限',
              objective: 'オンライン販売チャネルの確立',
              implementation: 'ECサイト構築とデジタルマーケティング'
            },
            applicationContent: {
              sections: {
                purpose: 'withコロナ時代に対応した非対面型ビジネスモデルの構築',
                expectedEffect: '新規顧客100社獲得、売上30%向上'
              }
            },
            keyPhrases: [
              'withコロナ時代への対応',
              '非対面型ビジネスモデル',
              'DXによる販路拡大',
              '新規顧客獲得',
              '売上向上'
            ],
            evaluationScore: 85,
            wasAdopted: true,
            successFactors: [
              '具体的な数値目標の設定',
              '実現可能な計画',
              '地域経済への波及効果'
            ],
            strongPoints: [
              '明確な課題認識',
              '具体的な実施計画',
              '定量的な効果測定'
            ],
            improvementAreas: [
              'より詳細なスケジュール',
              'リスク対策の記載'
            ],
            extractedPatterns: {
              structure: '課題→解決策→期待効果の論理的な流れ',
              keywords: '重要キーワードの適切な使用'
            },
            confidenceScore: 0.9
          },
          {
            guidelineId: guideline.id,
            companyName: '有限会社B（小売業）',
            projectTitle: 'POSシステム導入による業務効率化事業',
            applicationYear: 2023,
            businessPlan: {
              background: '在庫管理の非効率性と機会損失',
              objective: 'データに基づく経営判断の実現',
              implementation: 'クラウド型POSシステムの導入'
            },
            applicationContent: {
              sections: {
                purpose: '在庫の最適化と顧客満足度の向上',
                expectedEffect: '在庫回転率50%改善、廃棄ロス80%削減'
              }
            },
            keyPhrases: [
              'データドリブン経営',
              '在庫最適化',
              '顧客満足度向上',
              '業務効率化',
              '廃棄ロス削減'
            ],
            evaluationScore: 82,
            wasAdopted: true,
            successFactors: [
              'ROIの明確な提示',
              '段階的な導入計画',
              '従業員教育計画の具体性'
            ],
            strongPoints: [
              '費用対効果の明確化',
              '実施体制の具体性',
              '持続可能性の説明'
            ],
            improvementAreas: [
              '競合他社との差別化',
              '長期的なビジョン'
            ],
            extractedPatterns: {
              structure: '現状分析→課題特定→解決手法→期待成果',
              keywords: '業界特有の課題と汎用的な解決策の組み合わせ'
            },
            confidenceScore: 0.85
          }
        ]
      })
    }

    console.log('✅ 補助金データのシード完了！')
    
    // 統計情報の表示
    const programCount = await prisma.subsidyProgram.count()
    const guidelineCount = await prisma.subsidyGuideline.count()
    const successCaseCount = await prisma.successCase.count()
    
    console.log(`
📊 投入データ統計:
- 補助金プログラム: ${programCount}件
- 募集要項: ${guidelineCount}件
- 成功事例: ${successCaseCount}件
    `)

  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// スクリプトの実行
seedSubsidyData()
  .then(() => {
    console.log('🎉 すべての処理が完了しました')
    process.exit(0)
  })
  .catch((error) => {
    console.error('💥 スクリプトの実行に失敗しました:', error)
    process.exit(1)
  })