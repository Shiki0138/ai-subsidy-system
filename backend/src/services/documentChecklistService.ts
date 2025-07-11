import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface DocumentRequirement {
  id: string;
  name: string;
  description: string;
  category: 'mandatory' | 'conditional' | 'optional';
  conditions?: string[]; // 条件付き必要書類の条件
  fileTypes: string[]; // 許可されるファイル形式
  maxSize: number; // 最大ファイルサイズ（MB）
  template?: {
    url: string;
    name: string;
    description: string;
  };
  examples?: {
    url: string;
    name: string;
    description: string;
  }[];
  checkpoints: string[]; // 確認すべき内容
  commonErrors: string[]; // よくある間違い
  tips: string[]; // 作成のコツ
}

interface DocumentCheckResult {
  documentId: string;
  status: 'missing' | 'uploaded' | 'verified' | 'error';
  issues: string[];
  suggestions: string[];
  completeness: number; // 0-100%
}

interface CompanyProfile {
  businessType: string;
  employeeCount: number;
  annualRevenue: number;
  foundedYear: number;
  isStartup: boolean;
  hasIPO: boolean;
  industry: string;
}

export class DocumentChecklistService {
  /**
   * 補助金プログラムと企業プロファイルに基づいて必要書類を生成
   */
  async generateDocumentChecklist(
    subsidyProgramId: string,
    companyProfile: CompanyProfile
  ): Promise<DocumentRequirement[]> {
    const program = await prisma.subsidyProgram.findUnique({
      where: { id: subsidyProgramId },
      include: {
        guidelines: {
          orderBy: { updatedAt: 'desc' },
          take: 1
        }
      }
    });

    if (!program) {
      throw new Error('補助金プログラムが見つかりません');
    }

    const baseDocuments = this.getBaseDocuments(program.category);
    const conditionalDocuments = this.getConditionalDocuments(program.category, companyProfile);
    const industrySpecificDocuments = this.getIndustrySpecificDocuments(companyProfile.industry);

    return [
      ...baseDocuments,
      ...conditionalDocuments,
      ...industrySpecificDocuments
    ];
  }

  /**
   * 基本必要書類の取得
   */
  private getBaseDocuments(category: string): DocumentRequirement[] {
    const commonDocuments: DocumentRequirement[] = [
      {
        id: 'application_form',
        name: '申請書',
        description: 'AI生成された申請書（最終確認・編集済み）',
        category: 'mandatory',
        fileTypes: ['pdf', 'doc', 'docx'],
        maxSize: 10,
        checkpoints: [
          '全ての必須項目が記入されている',
          '数値データに誤りがない',
          '代表者の署名・捺印がある',
          '最新の様式を使用している'
        ],
        commonErrors: [
          '古い様式を使用している',
          '必須項目の記入漏れ',
          '数値の単位間違い',
          '署名・捺印の不備'
        ],
        tips: [
          'AIが生成した内容を必ず最終確認してください',
          '数値データは複数回チェックしてください',
          '印刷時は最新のPDFを使用してください'
        ]
      },
      {
        id: 'business_plan',
        name: '事業計画書',
        description: '具体的な事業実施計画',
        category: 'mandatory',
        fileTypes: ['pdf', 'doc', 'docx', 'ppt', 'pptx'],
        maxSize: 20,
        template: {
          url: '/templates/business_plan_template.docx',
          name: '事業計画書テンプレート',
          description: '標準的な事業計画書の構成テンプレート'
        },
        checkpoints: [
          '事業目的が明確に記載されている',
          '実施スケジュールが具体的',
          '予算の内訳が詳細',
          '期待される成果が定量的'
        ],
        commonErrors: [
          '抽象的な表現が多い',
          'スケジュールが曖昧',
          '予算の根拠が不明確',
          '成果指標が定性的'
        ],
        tips: [
          '具体的な数値を使って説明してください',
          '実現可能性を重視してください',
          '競合分析を含めてください'
        ]
      },
      {
        id: 'company_registration',
        name: '登記事項証明書',
        description: '法人登記簿謄本（3ヶ月以内）',
        category: 'mandatory',
        fileTypes: ['pdf'],
        maxSize: 5,
        checkpoints: [
          '3ヶ月以内に発行されている',
          '現在事項全部証明書である',
          '代表者名が申請書と一致している',
          '資本金が確認できる'
        ],
        commonErrors: [
          '発行日が古い',
          '履歴事項証明書を提出している',
          '代表者名の不一致',
          '不鮮明なコピー'
        ],
        tips: [
          'オンライン申請なら24時間取得可能です',
          '現在事項全部証明書を取得してください',
          '鮮明なPDFで提出してください'
        ]
      },
      {
        id: 'financial_statements',
        name: '決算書',
        description: '直近2期分の決算書（損益計算書・貸借対照表）',
        category: 'mandatory',
        fileTypes: ['pdf'],
        maxSize: 10,
        checkpoints: [
          '直近2期分が含まれている',
          '税理士の署名がある',
          '数値が鮮明に読める',
          '全ページが含まれている'
        ],
        commonErrors: [
          '1期分しか提出していない',
          '一部ページが欠けている',
          '数値が不鮮明',
          '税理士署名がない'
        ],
        tips: [
          '税理士作成の決算書を準備してください',
          '全ページを漏れなく提出してください',
          'スキャン品質を確認してください'
        ]
      }
    ];

    // カテゴリ別の特別書類
    const categorySpecificDocuments = this.getCategorySpecificDocuments(category);

    return [...commonDocuments, ...categorySpecificDocuments];
  }

  /**
   * カテゴリ別特別書類
   */
  private getCategorySpecificDocuments(category: string): DocumentRequirement[] {
    const categoryDocuments: { [key: string]: DocumentRequirement[] } = {
      'IT導入': [
        {
          id: 'it_tool_catalog',
          name: 'ITツール詳細資料',
          description: '導入予定ITツールの機能・価格詳細',
          category: 'mandatory',
          fileTypes: ['pdf', 'doc', 'docx'],
          maxSize: 10,
          checkpoints: [
            'ITツールの機能が詳細に記載されている',
            '価格の内訳が明確',
            'ベンダー情報が記載されている',
            '導入効果が定量的に説明されている'
          ],
          commonErrors: [
            '機能説明が不十分',
            '価格情報が曖昧',
            '導入効果が抽象的'
          ],
          tips: [
            'ベンダーから詳細資料を取得してください',
            'ROIを具体的に計算してください'
          ]
        }
      ],
      'ものづくり': [
        {
          id: 'equipment_quote',
          name: '設備機器見積書',
          description: '導入予定設備の詳細見積書',
          category: 'mandatory',
          fileTypes: ['pdf'],
          maxSize: 10,
          checkpoints: [
            '機器の詳細仕様が記載されている',
            '価格の内訳が明確',
            '納期が明記されている',
            'メーカー・販売店の押印がある'
          ],
          commonErrors: [
            '仕様が不明確',
            '価格の根拠が不明',
            '納期の記載がない'
          ],
          tips: [
            '複数社から見積もりを取得してください',
            '仕様書を詳細に確認してください'
          ]
        }
      ],
      '持続化': [
        {
          id: 'marketing_plan',
          name: '販路開拓計画書',
          description: '具体的な販路開拓・市場開拓計画',
          category: 'mandatory',
          fileTypes: ['pdf', 'doc', 'docx'],
          maxSize: 10,
          checkpoints: [
            'ターゲット市場が明確',
            '販路開拓の具体的手法',
            '売上増加の数値目標',
            '実施スケジュールが現実的'
          ],
          commonErrors: [
            'ターゲットが曖昧',
            '手法が抽象的',
            '目標が非現実的'
          ],
          tips: [
            '市場調査データを活用してください',
            '既存顧客の声を取り入れてください'
          ]
        }
      ]
    };

    return categoryDocuments[category] || [];
  }

  /**
   * 条件付き必要書類
   */
  private getConditionalDocuments(
    category: string,
    companyProfile: CompanyProfile
  ): DocumentRequirement[] {
    const conditionalDocs: DocumentRequirement[] = [];

    // 従業員数による条件
    if (companyProfile.employeeCount > 20) {
      conditionalDocs.push({
        id: 'employment_insurance',
        name: '雇用保険適用事業所設置届',
        description: '従業員20名超の場合に必要',
        category: 'conditional',
        conditions: ['従業員数が20名を超える場合'],
        fileTypes: ['pdf'],
        maxSize: 5,
        checkpoints: [
          '最新の届出書である',
          '従業員数が確認できる',
          'ハローワークの受付印がある'
        ],
        commonErrors: [
          '古い届出書を提出',
          '従業員数の不一致'
        ],
        tips: [
          'ハローワークで最新版を取得してください'
        ]
      });
    }

    // 新設法人の場合
    if (companyProfile.foundedYear >= new Date().getFullYear() - 1) {
      conditionalDocs.push({
        id: 'startup_plan',
        name: '創業計画書',
        description: '設立1年以内の法人が対象',
        category: 'conditional',
        conditions: ['設立から1年以内の法人'],
        fileTypes: ['pdf', 'doc', 'docx'],
        maxSize: 10,
        checkpoints: [
          '創業の動機が明確',
          '事業の将来性が説明されている',
          '資金計画が現実的',
          '代表者の経歴が記載されている'
        ],
        commonErrors: [
          '動機が抽象的',
          '資金計画が楽観的',
          '市場分析が不十分'
        ],
        tips: [
          '具体的な市場データを使用してください',
          '保守的な資金計画を立ててください'
        ]
      });
    }

    return conditionalDocs;
  }

  /**
   * 業界特有の必要書類
   */
  private getIndustrySpecificDocuments(industry: string): DocumentRequirement[] {
    const industryDocuments: { [key: string]: DocumentRequirement[] } = {
      '製造業': [
        {
          id: 'manufacturing_license',
          name: '製造業許可証',
          description: '該当する場合のみ',
          category: 'conditional',
          conditions: ['許可が必要な製造業の場合'],
          fileTypes: ['pdf'],
          maxSize: 5,
          checkpoints: [
            '有効期限内である',
            '許可内容が事業と一致している'
          ],
          commonErrors: [
            '期限切れの許可証',
            '許可内容の不一致'
          ],
          tips: [
            '有効期限を必ず確認してください'
          ]
        }
      ],
      '飲食業': [
        {
          id: 'food_business_license',
          name: '飲食店営業許可証',
          description: '飲食業の場合必須',
          category: 'mandatory',
          fileTypes: ['pdf'],
          maxSize: 5,
          checkpoints: [
            '有効期限内である',
            '店舗住所が一致している'
          ],
          commonErrors: [
            '期限切れの許可証',
            '住所の不一致'
          ],
          tips: [
            '更新手続きを忘れずに行ってください'
          ]
        }
      ]
    };

    return industryDocuments[industry] || [];
  }

  /**
   * 書類チェック実行
   */
  async checkDocuments(
    subsidyProgramId: string,
    companyProfile: CompanyProfile,
    uploadedDocuments: { id: string; fileName: string; fileType: string; size: number }[]
  ): Promise<{
    checklist: DocumentRequirement[];
    results: DocumentCheckResult[];
    overallCompleteness: number;
    missingDocuments: DocumentRequirement[];
    recommendations: string[];
  }> {
    const checklist = await this.generateDocumentChecklist(subsidyProgramId, companyProfile);
    const results: DocumentCheckResult[] = [];
    
    for (const requirement of checklist) {
      const uploadedDoc = uploadedDocuments.find(doc => 
        doc.id === requirement.id || 
        doc.fileName.toLowerCase().includes(requirement.name.toLowerCase())
      );

      if (!uploadedDoc) {
        results.push({
          documentId: requirement.id,
          status: 'missing',
          issues: ['書類が未提出です'],
          suggestions: [`${requirement.name}をアップロードしてください`],
          completeness: 0
        });
      } else {
        const checkResult = await this.validateDocument(requirement, uploadedDoc);
        results.push(checkResult);
      }
    }

    const mandatoryResults = results.filter((_, index) => checklist[index].category === 'mandatory');
    const overallCompleteness = mandatoryResults.length > 0 
      ? Math.round(mandatoryResults.reduce((sum, result) => sum + result.completeness, 0) / mandatoryResults.length)
      : 0;

    const missingDocuments = checklist.filter((doc, index) => 
      doc.category === 'mandatory' && results[index].status === 'missing'
    );

    const recommendations = this.generateRecommendations(checklist, results);

    return {
      checklist,
      results,
      overallCompleteness,
      missingDocuments,
      recommendations
    };
  }

  /**
   * 個別書類の検証
   */
  private async validateDocument(
    requirement: DocumentRequirement,
    uploadedDoc: { fileName: string; fileType: string; size: number }
  ): Promise<DocumentCheckResult> {
    const issues: string[] = [];
    const suggestions: string[] = [];
    let completeness = 100;

    // ファイル形式チェック
    if (!requirement.fileTypes.includes(uploadedDoc.fileType.toLowerCase())) {
      issues.push(`ファイル形式が不正です（許可形式: ${requirement.fileTypes.join(', ')}）`);
      suggestions.push(`${requirement.fileTypes[0]}形式で再アップロードしてください`);
      completeness -= 20;
    }

    // ファイルサイズチェック
    const sizeInMB = uploadedDoc.size / (1024 * 1024);
    if (sizeInMB > requirement.maxSize) {
      issues.push(`ファイルサイズが上限を超えています（上限: ${requirement.maxSize}MB）`);
      suggestions.push('ファイルサイズを圧縮してください');
      completeness -= 10;
    }

    // ファイル名チェック
    if (!this.isAppropriateFileName(uploadedDoc.fileName, requirement.name)) {
      suggestions.push('ファイル名を分かりやすく変更することをお勧めします');
      completeness -= 5;
    }

    const status = issues.length === 0 ? 'uploaded' : 'error';

    return {
      documentId: requirement.id,
      status,
      issues,
      suggestions,
      completeness: Math.max(0, completeness)
    };
  }

  /**
   * ファイル名の適切性チェック
   */
  private isAppropriateFileName(fileName: string, requirementName: string): boolean {
    const normalizedFileName = fileName.toLowerCase();
    const normalizedRequirement = requirementName.toLowerCase();
    
    return normalizedFileName.includes(normalizedRequirement) ||
           normalizedFileName.includes('申請') ||
           normalizedFileName.includes('計画') ||
           normalizedFileName.includes('決算');
  }

  /**
   * 改善提案の生成
   */
  private generateRecommendations(
    checklist: DocumentRequirement[],
    results: DocumentCheckResult[]
  ): string[] {
    const recommendations: string[] = [];

    const missingMandatory = results.filter((result, index) => 
      checklist[index].category === 'mandatory' && result.status === 'missing'
    ).length;

    if (missingMandatory > 0) {
      recommendations.push(`必須書類が${missingMandatory}件不足しています。最優先で準備してください。`);
    }

    const hasErrors = results.some(result => result.status === 'error');
    if (hasErrors) {
      recommendations.push('ファイル形式やサイズに問題がある書類があります。修正して再アップロードしてください。');
    }

    const conditionalDocs = checklist.filter(doc => doc.category === 'conditional').length;
    if (conditionalDocs > 0) {
      recommendations.push(`条件付き書類が${conditionalDocs}件あります。該当する場合は忘れずに提出してください。`);
    }

    recommendations.push('提出前に全ての書類を再度確認し、記載内容に誤りがないかチェックしてください。');

    return recommendations;
  }
}

export const documentChecklistService = new DocumentChecklistService();