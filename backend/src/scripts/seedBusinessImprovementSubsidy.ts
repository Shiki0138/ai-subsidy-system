// 業務改善助成金のデータベース初期設定スクリプト
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedBusinessImprovementSubsidy() {
  console.log('業務改善助成金のデータをシードしています...');

  try {
    // 業務改善助成金のプログラムを作成
    const businessImprovementSubsidy = await prisma.subsidyProgram.create({
      data: {
        name: '業務改善助成金',
        officialName: '業務改善助成金（厚生労働省）',
        category: '賃金向上・生産性向上',
        organizationName: '厚生労働省',
        description: '生産性向上に資する設備投資等を行うとともに、事業場内最低賃金を一定額以上引き上げた場合、その設備投資などにかかった費用の一部を助成する制度',
        purpose: '中小企業・小規模事業者の生産性向上を支援し、事業場内最低賃金の引上げを図ること',
        targetBusiness: '中小企業・小規模事業者（事業場内最低賃金と地域別最低賃金の差が50円以内）',
        maxAmount: 6000000, // 最大600万円
        subsidyRate: 0.9, // 最大90%
        applicationStart: new Date('2024-04-01'),
        applicationEnd: new Date('2024-12-27'),
        requirements: {
          basic: [
            '中小企業・小規模事業者であること',
            '事業場内最低賃金と地域別最低賃金の差が50円以内であること',
            '解雇や賃金引下げ等の不交付事由に該当しないこと'
          ],
          specific: [
            '生産性向上に資する設備投資等を行うこと',
            '事業場内最低賃金を一定額以上引き上げること（30円、45円、60円、90円コース）'
          ]
        },
        documentFormat: {
          mainForms: [
            '交付申請書（様式第1号）',
            '事業実施計画書（様式第1号別紙2）',
            '賃金引上げ計画書'
          ],
          supportingDocs: [
            '見積書（設備投資等）',
            '賃金台帳',
            '労働者名簿',
            '就業規則',
            '決算書（直近2期分）'
          ]
        },
        evaluationCriteria: {
          primary: [
            '生産性向上効果の妥当性',
            '賃金引上げ計画の実現可能性',
            '事業継続性・成長性'
          ],
          scoring: {
            productivityImprovement: 40,
            wageIncreaseImpact: 30,
            businessSustainability: 30
          }
        },
        sourceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/zigyonushi/shienjigyou/03.html',
        isActive: true
      }
    });

    // 業務改善助成金のガイドラインを作成
    const guideline = await prisma.subsidyGuideline.create({
      data: {
        subsidyProgramId: businessImprovementSubsidy.id,
        version: '2024年度',
        title: '令和6年度 業務改善助成金募集要項',
        purpose: '中小企業・小規模事業者の生産性向上を支援し、事業場内最低賃金の引上げを図る',
        overview: '生産性向上のための設備投資等を行い、事業場内最低賃金を一定額以上引き上げた場合に、設備投資等にかかった費用の一部を助成',
        targetBusinessSize: ['中小企業', '小規模事業者'],
        targetIndustries: ['全業種'],
        eligibilityRequirements: {
          mandatory: [
            {
              requirement: '中小企業・小規模事業者であること',
              details: '資本金または出資の総額が3億円以下、または常時使用する労働者数が300人以下（業種により異なる）'
            },
            {
              requirement: '事業場内最低賃金と地域別最低賃金の差が50円以内',
              details: '申請時点での事業場内最低賃金が地域別最低賃金＋50円以内であること'
            },
            {
              requirement: '賃金引上げ計画を策定すること',
              details: '30円、45円、60円、90円のいずれかのコースを選択し、計画的に賃金を引き上げること'
            }
          ]
        },
        minAmount: 300000, // 30万円
        maxAmount: 6000000, // 600万円
        subsidyRate: 0.9, // 90%（生産性要件を満たした場合）
        subsidyDetails: {
          courses: [
            {
              name: '30円コース',
              wageIncrease: 30,
              maxAmount: 1200000,
              subsidyRate: 0.75,
              subsidyRateWithProductivity: 0.9
            },
            {
              name: '45円コース',
              wageIncrease: 45,
              maxAmount: 1800000,
              subsidyRate: 0.8,
              subsidyRateWithProductivity: 0.9
            },
            {
              name: '60円コース',
              wageIncrease: 60,
              maxAmount: 3000000,
              subsidyRate: 0.8,
              subsidyRateWithProductivity: 0.9
            },
            {
              name: '90円コース',
              wageIncrease: 90,
              maxAmount: 6000000,
              subsidyRate: 0.8,
              subsidyRateWithProductivity: 0.9
            }
          ],
          eligibleExpenses: [
            '機械装置等購入費',
            '広告宣伝・販売促進費',
            '建物改修費',
            'システム構築費',
            '外注費',
            '専門家謝金',
            '店舗等借入費',
            '設備等リース費',
            '委託費',
            '設備廃棄費'
          ]
        },
        applicationStart: new Date('2024-04-01'),
        applicationEnd: new Date('2024-12-27'),
        evaluationCriteria: {
          mainCriteria: [
            {
              name: '生産性向上の効果',
              weight: 0.4,
              points: [
                '具体的な生産性向上の数値目標が設定されているか',
                '設備投資等と生産性向上の関連性が明確か',
                '投資効果の測定方法が適切か'
              ]
            },
            {
              name: '賃金引上げの実現可能性',
              weight: 0.3,
              points: [
                '賃金引上げ計画が具体的で実現可能か',
                '労働者への影響が適切に考慮されているか',
                '賃金引上げの持続可能性があるか'
              ]
            },
            {
              name: '事業の継続性・成長性',
              weight: 0.3,
              points: [
                '事業計画が現実的で達成可能か',
                '財務状況が健全で事業継続性があるか',
                '地域経済への波及効果が期待できるか'
              ]
            }
          ]
        },
        scoringWeights: {
          productivity: 40,
          wageIncrease: 30,
          sustainability: 30
        },
        requiredDocuments: {
          application: [
            {
              name: '交付申請書（様式第1号）',
              description: '助成金の交付を申請する基本書類',
              required: true
            },
            {
              name: '事業実施計画書（様式第1号別紙2）',
              description: '生産性向上のための設備投資等の計画',
              required: true
            },
            {
              name: '賃金引上げ計画書',
              description: '事業場内最低賃金の引上げ計画',
              required: true
            }
          ],
          supporting: [
            {
              name: '見積書',
              description: '設備投資等の見積書（2社以上）',
              required: true
            },
            {
              name: '賃金台帳',
              description: '直近3か月分の賃金台帳',
              required: true
            },
            {
              name: '労働者名簿',
              description: '全労働者の名簿',
              required: true
            },
            {
              name: '就業規則',
              description: '賃金規定を含む就業規則',
              required: true
            },
            {
              name: '決算書',
              description: '直近2期分の決算書',
              required: true
            }
          ]
        },
        documentTemplates: {
          forms: [
            {
              id: 'form1',
              name: '交付申請書（様式第1号）',
              sections: [
                '申請者情報',
                '事業場情報',
                '申請額',
                '賃金引上げ計画概要'
              ]
            },
            {
              id: 'form1-2',
              name: '事業実施計画書（様式第1号別紙2）',
              sections: [
                '事業概要',
                '生産性向上の取組内容',
                '設備投資等の内容',
                '期待される効果',
                '実施スケジュール'
              ]
            }
          ]
        },
        importantKeywords: [
          '生産性向上',
          '賃金引上げ',
          '設備投資',
          '労働者の処遇改善',
          '事業場内最低賃金',
          '労働能率の増進',
          '業務効率化',
          'デジタル化',
          '人材育成',
          '職場環境改善'
        ],
        evaluationPhrases: [
          '具体的な数値目標を設定し',
          '投資効果を定量的に示す',
          '労働者全体の賃金向上につながる',
          '持続可能な賃金体系を構築',
          '地域経済の活性化に貢献',
          '生産性向上と賃金向上の好循環を実現'
        ],
        guidelinePdfUrl: 'https://www.mhlw.go.jp/content/11200000/001471309.pdf',
        faqUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/zigyonushi/shienjigyou/03.html#Q&A',
        status: 'ACTIVE',
        publishedAt: new Date('2024-04-01')
      }
    });

    // 関連するドキュメントを作成
    const documents = [
      {
        subsidyProgramId: businessImprovementSubsidy.id,
        type: 'GUIDELINE' as const,
        title: '令和6年度 業務改善助成金 募集要項',
        description: '業務改善助成金の詳細な募集要項と申請方法',
        version: '2024.1',
        publishedDate: new Date('2024-04-01'),
        sourceUrl: 'https://www.mhlw.go.jp/content/11200000/001471309.pdf',
        isLatest: true
      },
      {
        subsidyProgramId: businessImprovementSubsidy.id,
        type: 'APPLICATION_FORM' as const,
        title: '交付申請書（様式第1号）',
        description: '業務改善助成金の交付申請書テンプレート',
        version: '2024.1',
        publishedDate: new Date('2024-04-01'),
        isLatest: true
      },
      {
        subsidyProgramId: businessImprovementSubsidy.id,
        type: 'APPLICATION_FORM' as const,
        title: '事業実施計画書（様式第1号別紙2）',
        description: '生産性向上のための事業実施計画書テンプレート',
        version: '2024.1',
        publishedDate: new Date('2024-04-01'),
        isLatest: true
      },
      {
        subsidyProgramId: businessImprovementSubsidy.id,
        type: 'CHECKLIST' as const,
        title: '申請書類チェックリスト',
        description: '業務改善助成金申請に必要な書類の確認リスト',
        version: '2024.1',
        publishedDate: new Date('2024-04-01'),
        isLatest: true
      },
      {
        subsidyProgramId: businessImprovementSubsidy.id,
        type: 'EXAMPLE' as const,
        title: '記入例集',
        description: '各種申請書類の記入例',
        version: '2024.1',
        publishedDate: new Date('2024-04-01'),
        isLatest: true
      },
      {
        subsidyProgramId: businessImprovementSubsidy.id,
        type: 'FAQ' as const,
        title: 'よくある質問',
        description: '業務改善助成金に関するFAQ',
        version: '2024.1',
        publishedDate: new Date('2024-04-01'),
        sourceUrl: 'https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/koyou_roudou/roudoukijun/zigyonushi/shienjigyou/03.html#Q&A',
        isLatest: true
      }
    ];

    for (const doc of documents) {
      await prisma.subsidyDocument.create({ data: doc });
    }

    // プロンプトテンプレートを作成
    await prisma.promptTemplate.create({
      data: {
        subsidyProgramId: businessImprovementSubsidy.id,
        name: '業務改善助成金申請書生成プロンプト',
        description: '業務改善助成金の申請書を生成するためのプロンプトテンプレート',
        systemPrompt: `あなたは業務改善助成金の申請書作成を支援する専門家です。以下の点に注意して申請書を作成してください：

1. 生産性向上の具体的な効果を定量的に示す
2. 賃金引上げ計画の実現可能性を明確に説明する
3. 事業の継続性と成長性を強調する
4. 労働者への波及効果を具体的に記載する
5. 地域経済への貢献を含める

重要なキーワード：
- 生産性向上
- 賃金引上げ
- 設備投資
- 労働者の処遇改善
- 事業場内最低賃金
- 労働能率の増進
- 業務効率化
- デジタル化
- 人材育成
- 職場環境改善`,
        userPromptTemplate: `以下の情報を基に、業務改善助成金の申請書を作成してください：

企業情報：
{{companyInfo}}

事業計画：
{{businessPlan}}

設備投資計画：
{{investmentPlan}}

賃金引上げ計画：
{{wageIncreasePlan}}

申請書には以下の内容を含めてください：
1. 事業概要と現状の課題
2. 生産性向上のための具体的な取組内容
3. 設備投資等の詳細と期待される効果
4. 賃金引上げの実施計画と労働者への影響
5. 事業の持続可能性と地域経済への貢献`,
        model: 'claude-3-5-sonnet-20241022',
        temperature: 0.3,
        maxTokens: 4000,
        isActive: true,
        priority: 1
      }
    });

    console.log('✅ 業務改善助成金のデータシードが完了しました');
    console.log(`📊 作成されたレコード:
    - SubsidyProgram: 1
    - SubsidyGuideline: 1
    - SubsidyDocument: 6
    - PromptTemplate: 1
    `);

  } catch (error) {
    console.error('❌ エラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトを実行
seedBusinessImprovementSubsidy()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });