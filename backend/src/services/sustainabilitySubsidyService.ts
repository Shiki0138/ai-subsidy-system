import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import { documentTemplateService } from './documentTemplateService';
import { ClaudeAPI } from '@anthropic-ai/sdk';

const prisma = new PrismaClient();

interface CompanyBasicInfo {
  companyName: string;
  representativeName: string;
  businessType: string;
  foundedYear: number;
  employeeCount: number;
  address: string;
  phone: string;
  email: string;
  capital?: number;
  revenue?: number;
}

interface BusinessPlan {
  businessOverview: string;
  marketTrends: string;
  strengths: string;
  managementPolicy: string;
  projectName: string;
  salesExpansion: string;
  efficiencyImprovement: string;
  expectedEffects: string;
}

interface BudgetPlan {
  totalProjectCost: number;
  subsidyAmount: number;
  selfFunding: number;
  expenseDetails: Array<{
    category: string;
    item: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
    description: string;
  }>;
}

interface SustainabilitySubsidyApplication {
  companyInfo: CompanyBasicInfo;
  businessPlan: BusinessPlan;
  budgetPlan: BudgetPlan;
  specialCategories?: {
    wageIncrease?: boolean;
    invoiceSpecial?: boolean;
    businessSuccession?: boolean;
  };
}

class SustainabilitySubsidyService {
  private claude: ClaudeAPI;

  constructor() {
    this.claude = new ClaudeAPI({
      apiKey: process.env.ANTHROPIC_API_KEY || 'test-key'
    });
  }

  /**
   * 小規模企業持続化補助金の申請書テンプレートを初期化
   */
  async initializeTemplates() {
    try {
      // 様式1: 申請書
      await this.createForm1Template();
      
      // 様式2: 経営計画書兼補助事業計画書①
      await this.createForm2Template();
      
      // 様式3: 補助事業計画書②
      await this.createForm3Template();
      
      // 様式5: 補助金交付申請書
      await this.createForm5Template();
      
      // 様式6: 宣誓・同意書
      await this.createForm6Template();
      
      // 様式7: 賃金引上げ枠誓約書
      await this.createForm7Template();

      logger.info('✅ 小規模企業持続化補助金テンプレート初期化完了');
      
      return true;
    } catch (error) {
      logger.error('❌ テンプレート初期化失敗', {
        error: error.message
      });
      throw error;
    }
  }

  /**
   * 様式1: 小規模事業者持続化補助金に係る申請書
   */
  private async createForm1Template() {
    const templateData = {
      documentType: '小規模企業持続化補助金申請書',
      templateName: '様式1_申請書',
      description: '小規模事業者持続化補助金に係る申請書（様式1）',
      category: '持続化補助金',
      tags: ['様式1', '申請書', '持続化補助金'],
      structure: {
        sections: [
          {
            id: 'application_info',
            name: '申請情報',
            type: 'structured',
            fields: [
              { name: 'applicationDate', label: '申請日', type: 'date', required: true },
              { name: 'chamberName', label: '商工会・商工会議所名', type: 'text', required: true },
              { name: 'applicationNumber', label: '申請書番号', type: 'text', required: false }
            ]
          },
          {
            id: 'company_basic',
            name: '事業者基本情報',
            type: 'structured',
            fields: [
              { name: 'companyName', label: '会社名・屋号', type: 'text', required: true },
              { name: 'businessType', label: '事業内容', type: 'text', required: true },
              { name: 'representativeName', label: '代表者氏名', type: 'text', required: true },
              { name: 'address', label: '所在地', type: 'text', required: true },
              { name: 'phone', label: '電話番号', type: 'tel', required: true },
              { name: 'email', label: 'メールアドレス', type: 'email', required: true }
            ]
          },
          {
            id: 'project_summary',
            name: '事業概要',
            type: 'structured',
            fields: [
              { name: 'projectName', label: '補助事業で行う事業名', type: 'text', maxLength: 30, required: true },
              { name: 'requestedAmount', label: '補助金申請額', type: 'number', required: true },
              { name: 'totalProjectCost', label: '補助事業に要する経費総額', type: 'number', required: true }
            ]
          }
        ]
      },
      defaultContent: {
        header: '小規模事業者持続化補助金に係る申請書',
        applicationDate: '{{formatDate applicationDate "令和6年M月d日"}}',
        companyInfo: {
          name: '{{companyName}}',
          business: '{{businessType}}',
          representative: '{{representativeName}}',
          address: '{{address}}',
          phone: '{{phone}}',
          email: '{{email}}'
        },
        projectInfo: {
          name: '{{projectName}}',
          subsidyAmount: '{{formatNumber requestedAmount}}円',
          totalCost: '{{formatNumber totalProjectCost}}円'
        },
        footer: '上記のとおり申請いたします。'
      },
      requiredFields: [
        'applicationDate', 'chamberName', 'companyName', 'businessType',
        'representativeName', 'address', 'phone', 'email',
        'projectName', 'requestedAmount', 'totalProjectCost'
      ],
      formatOptions: {
        pageSize: 'A4',
        margins: { top: 25, bottom: 25, left: 25, right: 25 },
        fontSize: 12,
        fontFamily: 'MS明朝',
        lineHeight: 1.5
      }
    };

    return await documentTemplateService.createTemplate(templateData);
  }

  /**
   * 様式2: 経営計画書兼補助事業計画書①
   */
  private async createForm2Template() {
    const templateData = {
      documentType: '経営計画書兼補助事業計画書',
      templateName: '様式2_経営計画書',
      description: '経営計画書兼補助事業計画書①（様式2）',
      category: '持続化補助金',
      tags: ['様式2', '経営計画書', '持続化補助金'],
      structure: {
        sections: [
          {
            id: 'company_overview',
            name: '1.企業概要',
            type: 'text',
            maxLength: 800,
            required: true,
            placeholder: '◆企業概要（企業名、創業年、従業員数、事業内容、業界での位置付け、顧客層等を400字程度で記載）'
          },
          {
            id: 'market_trends',
            name: '2.顧客ニーズと市場の動向',
            type: 'text',
            maxLength: 800,
            required: true,
            placeholder: '◆顧客ニーズと市場の動向（対象とする市場の動向、顧客ニーズの変化、競合他社の状況等を400字程度で記載）'
          },
          {
            id: 'company_strengths',
            name: '3.自社や自社の提供する商品・サービスの強み',
            type: 'text',
            maxLength: 800,
            required: true,
            placeholder: '◆自社の強み（技術力、商品・サービスの独自性、顧客基盤、立地等の強みを400字程度で記載）'
          },
          {
            id: 'management_policy',
            name: '4.経営方針・目標と今後のプラン',
            type: 'text',
            maxLength: 1000,
            required: true,
            placeholder: '◆経営方針・目標と今後のプラン（今後の経営方針、事業計画、売上目標等を500字程度で記載）'
          },
          {
            id: 'project_name_detail',
            name: '5.補助事業で行う事業名',
            type: 'text',
            maxLength: 30,
            required: true,
            placeholder: '30字以内で事業名を記載'
          },
          {
            id: 'sales_expansion',
            name: '6.販路開拓等（生産性向上）の取組内容',
            type: 'text',
            maxLength: 1500,
            required: true,
            placeholder: '◆販路開拓等の取組内容（新商品・サービス開発、販路開拓、ブランディング等の具体的な取組を750字程度で記載）'
          },
          {
            id: 'efficiency_improvement',
            name: '7.業務効率化（生産性向上）の取組内容',
            type: 'text',
            maxLength: 1000,
            required: true,
            placeholder: '◆業務効率化の取組内容（IT活用、業務プロセス改善等の具体的な取組を500字程度で記載）'
          },
          {
            id: 'expected_effects',
            name: '8.補助事業の効果',
            type: 'text',
            maxLength: 800,
            required: true,
            placeholder: '◆補助事業の効果（売上増加、コスト削減、生産性向上等の具体的な効果と数値目標を400字程度で記載）'
          }
        ]
      },
      defaultContent: {
        header: '経営計画書兼補助事業計画書①',
        sections: {
          companyOverview: '{{company_overview}}',
          marketTrends: '{{market_trends}}',
          companyStrengths: '{{company_strengths}}',
          managementPolicy: '{{management_policy}}',
          projectName: '{{project_name_detail}}',
          salesExpansion: '{{sales_expansion}}',
          efficiencyImprovement: '{{efficiency_improvement}}',
          expectedEffects: '{{expected_effects}}'
        }
      },
      requiredFields: [
        'company_overview', 'market_trends', 'company_strengths',
        'management_policy', 'project_name_detail', 'sales_expansion',
        'efficiency_improvement', 'expected_effects'
      ],
      validationRules: {
        company_overview: { maxLength: 800, minLength: 200 },
        market_trends: { maxLength: 800, minLength: 200 },
        company_strengths: { maxLength: 800, minLength: 200 },
        management_policy: { maxLength: 1000, minLength: 300 },
        project_name_detail: { maxLength: 30, minLength: 5 },
        sales_expansion: { maxLength: 1500, minLength: 500 },
        efficiency_improvement: { maxLength: 1000, minLength: 300 },
        expected_effects: { maxLength: 800, minLength: 200 }
      }
    };

    return await documentTemplateService.createTemplate(templateData);
  }

  /**
   * 様式3: 補助事業計画書②
   */
  private async createForm3Template() {
    const templateData = {
      documentType: '補助事業計画書',
      templateName: '様式3_補助事業計画書',
      description: '補助事業計画書②（様式3）',
      category: '持続化補助金',
      tags: ['様式3', '補助事業計画書', '持続化補助金'],
      structure: {
        sections: [
          {
            id: 'expense_details',
            name: '経費明細表',
            type: 'table',
            required: true,
            columns: [
              { name: 'category', label: '経費区分', type: 'select', required: true },
              { name: 'item', label: '品目・内容', type: 'text', required: true },
              { name: 'quantity', label: '数量', type: 'number', required: true },
              { name: 'unitPrice', label: '単価', type: 'number', required: true },
              { name: 'totalPrice', label: '金額', type: 'calculated', required: true },
              { name: 'description', label: '説明・根拠', type: 'text', required: true }
            ]
          },
          {
            id: 'funding_plan',
            name: '資金調達方法',
            type: 'structured',
            required: true,
            fields: [
              { name: 'totalCost', label: '補助事業に要する経費総額', type: 'number', required: true },
              { name: 'subsidyAmount', label: '補助金申請額', type: 'number', required: true },
              { name: 'selfFunding', label: '自己負担額', type: 'calculated', required: true },
              { name: 'fundingSource', label: '自己負担額の調達方法', type: 'text', required: true }
            ]
          }
        ]
      },
      defaultContent: {
        header: '補助事業計画書②',
        expenseTable: '{{#each expenseDetails}}\n{{category}}\t{{item}}\t{{quantity}}\t{{formatNumber unitPrice}}\t{{formatNumber totalPrice}}\t{{description}}\n{{/each}}',
        funding: {
          totalCost: '{{formatNumber totalCost}}円',
          subsidyAmount: '{{formatNumber subsidyAmount}}円',
          selfFunding: '{{formatNumber selfFunding}}円',
          fundingSource: '{{fundingSource}}'
        }
      },
      requiredFields: [
        'expenseDetails', 'totalCost', 'subsidyAmount', 'fundingSource'
      ]
    };

    return await documentTemplateService.createTemplate(templateData);
  }

  /**
   * 様式5: 補助金交付申請書
   */
  private async createForm5Template() {
    const templateData = {
      documentType: '補助金交付申請書',
      templateName: '様式5_交付申請書',
      description: '補助金交付申請書（様式5）',
      category: '持続化補助金',
      tags: ['様式5', '交付申請書', '持続化補助金'],
      structure: {
        sections: [
          {
            id: 'application_basic',
            name: '申請基本情報',
            type: 'structured',
            fields: [
              { name: 'applicationDate', label: '申請日', type: 'date', required: true },
              { name: 'fiscalYear', label: '実施年度', type: 'text', required: true },
              { name: 'subsidyAmount', label: '補助金額', type: 'number', required: true }
            ]
          }
        ]
      },
      defaultContent: {
        header: '小規模事業者持続化補助金交付申請書',
        content: `
令和{{formatDate applicationDate "Y年M月d日"}}

{{companyName}}
代表者　{{representativeName}}　　印

　標記について、下記のとおり申請いたします。

記

1. 交付申請金額　金{{formatNumber subsidyAmount}}円

2. 事業実施期間　{{fiscalYear}}

以上
        `,
        footer: '上記のとおり申請いたします。'
      },
      requiredFields: ['applicationDate', 'fiscalYear', 'subsidyAmount']
    };

    return await documentTemplateService.createTemplate(templateData);
  }

  /**
   * 様式6: 宣誓・同意書
   */
  private async createForm6Template() {
    const templateData = {
      documentType: '宣誓・同意書',
      templateName: '様式6_宣誓同意書',
      description: '宣誓・同意書（様式6）',
      category: '持続化補助金',
      tags: ['様式6', '宣誓同意書', '持続化補助金'],
      structure: {
        sections: [
          {
            id: 'declaration_date',
            name: '宣誓日',
            type: 'structured',
            fields: [
              { name: 'declarationDate', label: '宣誓日', type: 'date', required: true }
            ]
          }
        ]
      },
      defaultContent: {
        header: '宣誓・同意書',
        content: `
令和{{formatDate declarationDate "Y年M月d日"}}

{{companyName}}
代表者　{{representativeName}}　　印

　私は、小規模事業者持続化補助金の申請に当たり、以下の事項について宣誓・同意いたします。

【宣誓事項】
1. 申請書類等の記載内容は事実と相違ありません。
2. 小規模事業者の要件を満たしています。
3. 補助対象となる経費は、補助事業のためのものです。
4. 補助事業に係る取得財産等は、補助事業の目的に従って使用します。
5. 補助金等に係る予算の執行の適正化に関する法律等を遵守します。

【同意事項】
1. 交付決定前に発注等を行った経費は補助対象外となることに同意します。
2. 補助事業の実施状況について必要に応じ報告を行うことに同意します。
3. 補助事業に関する書類を保存することに同意します。

以上、宣誓・同意いたします。
        `
      },
      requiredFields: ['declarationDate']
    };

    return await documentTemplateService.createTemplate(templateData);
  }

  /**
   * 様式7: 賃金引上げ枠誓約書
   */
  private async createForm7Template() {
    const templateData = {
      documentType: '賃金引上げ枠誓約書',
      templateName: '様式7_賃金引上げ誓約書',
      description: '賃金引上げ枠の申請に係る誓約書（様式7）',
      category: '持続化補助金',
      tags: ['様式7', '賃金引上げ誓約書', '持続化補助金'],
      structure: {
        sections: [
          {
            id: 'pledge_info',
            name: '誓約情報',
            type: 'structured',
            fields: [
              { name: 'pledgeDate', label: '誓約日', type: 'date', required: true },
              { name: 'currentMinWage', label: '現在の最低賃金', type: 'number', required: true },
              { name: 'targetMinWage', label: '引上げ後の最低賃金', type: 'number', required: true },
              { name: 'implementationDate', label: '実施予定日', type: 'date', required: true }
            ]
          }
        ]
      },
      defaultContent: {
        header: '賃金引上げ枠の申請に係る誓約書',
        content: `
令和{{formatDate pledgeDate "Y年M月d日"}}

{{companyName}}
代表者　{{representativeName}}　　印

　私は、賃金引上げ枠での申請に当たり、以下のとおり誓約いたします。

記

1. 事業場内最低賃金を{{formatDate implementationDate "令和Y年M月d日"}}までに時間額{{targetMinWage}}円以上とすることを誓約いたします。

2. 現在の事業場内最低賃金：時間額{{currentMinWage}}円

3. 引上げ後の事業場内最低賃金：時間額{{targetMinWage}}円

4. 上記引上げを確実に実施し、実施後は賃金台帳等により報告いたします。

以上、誓約いたします。
        `
      },
      requiredFields: ['pledgeDate', 'currentMinWage', 'targetMinWage', 'implementationDate']
    };

    return await documentTemplateService.createTemplate(templateData);
  }

  /**
   * 申請データから全書類を一括生成
   */
  async generateAllDocuments(applicationData: SustainabilitySubsidyApplication, userId: string) {
    try {
      logger.info('申請書類一括生成開始', {
        userId,
        companyName: applicationData.companyInfo.companyName,
        projectName: applicationData.businessPlan.projectName
      });

      // 開発環境用の簡単なモック実装
      if (process.env.NODE_ENV !== 'production') {
        const documents = [
          {
            id: `form1_${Date.now()}`,
            title: '様式1：申請書',
            description: '小規模事業者持続化補助金に係る申請書',
            type: 'APPLICATION_FORM',
            content: `申請書（様式1）\n企業名: ${applicationData.companyInfo.companyName}\n申請金額: ${applicationData.budgetPlan.subsidyAmount.toLocaleString()}円`,
            downloadUrl: '#',
            generatedAt: new Date()
          },
          {
            id: `form2_${Date.now()}`,
            title: '様式2：経営計画書兼補助事業計画書①',
            description: 'AI支援による経営計画書',
            type: 'BUSINESS_PLAN',
            content: `経営計画書（様式2）\n事業名: ${applicationData.businessPlan.projectName}\n企業概要: ${applicationData.companyInfo.companyName}は${applicationData.companyInfo.businessType}を営む企業です。`,
            downloadUrl: '#',
            generatedAt: new Date()
          },
          {
            id: `form3_${Date.now()}`,
            title: '様式3：補助事業計画書②（経費明細）',
            description: '補助事業計画書と経費明細',
            type: 'EXPENSE_PLAN',
            content: `補助事業計画書（様式3）\n総事業費: ${applicationData.budgetPlan.totalProjectCost.toLocaleString()}円\n経費明細: ${applicationData.budgetPlan.expenseDetails.length}件`,
            downloadUrl: '#',
            generatedAt: new Date()
          },
          {
            id: `form5_${Date.now()}`,
            title: '様式5：交付申請書',
            description: '補助金交付申請書',
            type: 'GRANT_APPLICATION',
            content: `交付申請書（様式5）\n申請者: ${applicationData.companyInfo.companyName}\n申請額: ${applicationData.budgetPlan.subsidyAmount.toLocaleString()}円`,
            downloadUrl: '#',
            generatedAt: new Date()
          },
          {
            id: `form6_${Date.now()}`,
            title: '様式6：宣誓・同意書',
            description: '宣誓・同意書',
            type: 'DECLARATION',
            content: `宣誓・同意書（様式6）\n申請者: ${applicationData.companyInfo.companyName}\n代表者: ${applicationData.companyInfo.representativeName}`,
            downloadUrl: '#',
            generatedAt: new Date()
          }
        ];

        // 賃金引上げ枠の場合は様式7も追加
        if (applicationData.specialCategories?.wageIncrease) {
          documents.push({
            id: `form7_${Date.now()}`,
            title: '様式7：賃金引上げ枠誓約書',
            description: '賃金引上げ枠の申請に係る誓約書',
            type: 'WAGE_PLEDGE',
            content: `賃金引上げ枠誓約書（様式7）\n申請者: ${applicationData.companyInfo.companyName}`,
            downloadUrl: '#',
            generatedAt: new Date()
          });
        }

        logger.info('✅ 開発環境: 申請書類一括生成完了（モック）', {
          userId,
          companyName: applicationData.companyInfo.companyName,
          documentsCount: documents.length
        });

        return {
          success: true,
          documents,
          summary: {
            totalDocuments: documents.length,
            generatedAt: new Date(),
            applicant: applicationData.companyInfo.companyName,
            projectName: applicationData.businessPlan.projectName
          }
        };
      }

      // 本番環境用の実装
      const documents = [];

      // 様式1: 申請書
      const form1 = await this.generateForm1(applicationData, userId);
      documents.push(form1);

      // 様式2: 経営計画書（AI支援）
      const form2 = await this.generateForm2WithAI(applicationData, userId);
      documents.push(form2);

      // 様式3: 補助事業計画書
      const form3 = await this.generateForm3(applicationData, userId);
      documents.push(form3);

      // 様式5: 交付申請書
      const form5 = await this.generateForm5(applicationData, userId);
      documents.push(form5);

      // 様式6: 宣誓・同意書
      const form6 = await this.generateForm6(applicationData, userId);
      documents.push(form6);

      // 賃金引上げ枠の場合
      if (applicationData.specialCategories?.wageIncrease) {
        const form7 = await this.generateForm7(applicationData, userId);
        documents.push(form7);
      }

      logger.info('✅ 小規模企業持続化補助金申請書類一括生成完了', {
        userId,
        companyName: applicationData.companyInfo.companyName,
        documentsCount: documents.length
      });

      return {
        success: true,
        documents,
        summary: {
          totalDocuments: documents.length,
          generatedAt: new Date(),
          applicant: applicationData.companyInfo.companyName,
          projectName: applicationData.businessPlan.projectName
        }
      };

    } catch (error) {
      logger.error('❌ 申請書類生成失敗', {
        userId,
        error: error.message,
        companyName: applicationData.companyInfo?.companyName
      });
      throw error;
    }
  }

  /**
   * 様式1生成
   */
  private async generateForm1(applicationData: SustainabilitySubsidyApplication, userId: string) {
    // 開発環境用のモック実装
    if (process.env.NODE_ENV !== 'production') {
      logger.info('開発環境: 様式1を生成（モック）');
      return {
        id: `form1_${Date.now()}`,
        title: '様式1：申請書',
        description: '小規模事業者持続化補助金に係る申請書',
        type: 'APPLICATION_FORM',
        content: `
小規模事業者持続化補助金 申請書

申請日: ${new Date().toLocaleDateString('ja-JP')}
商工会議所: ○○商工会議所

申請者情報:
企業名: ${applicationData.companyInfo.companyName}
代表者名: ${applicationData.companyInfo.representativeName}
業種: ${applicationData.companyInfo.businessType}
所在地: ${applicationData.companyInfo.address}
電話番号: ${applicationData.companyInfo.phone}
メールアドレス: ${applicationData.companyInfo.email}

事業計画:
事業名: ${applicationData.businessPlan.projectName}
申請金額: ${applicationData.budgetPlan.subsidyAmount.toLocaleString()}円
総事業費: ${applicationData.budgetPlan.totalProjectCost.toLocaleString()}円
自己負担額: ${applicationData.budgetPlan.selfFunding.toLocaleString()}円

上記のとおり申請いたします。
        `,
        downloadUrl: '#',
        generatedAt: new Date()
      };
    }

    // 本番環境用の実装
    const template = await prisma.documentTemplate.findFirst({
      where: { templateName: '様式1_申請書', isActive: true }
    });

    if (!template) {
      throw new Error('様式1テンプレートが見つかりません');
    }

    const inputData = {
      applicationDate: new Date(),
      chamberName: '○○商工会議所',
      companyName: applicationData.companyInfo.companyName,
      businessType: applicationData.companyInfo.businessType,
      representativeName: applicationData.companyInfo.representativeName,
      address: applicationData.companyInfo.address,
      phone: applicationData.companyInfo.phone,
      email: applicationData.companyInfo.email,
      projectName: applicationData.businessPlan.projectName,
      requestedAmount: applicationData.budgetPlan.subsidyAmount,
      totalProjectCost: applicationData.budgetPlan.totalProjectCost
    };

    return await documentTemplateService.generateDocument(
      template.id,
      inputData,
      '様式1_申請書',
      'PDF',
      userId
    );
  }

  /**
   * 様式2生成（AI支援）
   */
  private async generateForm2WithAI(applicationData: SustainabilitySubsidyApplication, userId: string) {
    // 開発環境用のモック実装
    if (process.env.NODE_ENV !== 'production') {
      logger.info('開発環境: 様式2を生成（モック）');
      return {
        id: `form2_${Date.now()}`,
        title: '様式2：経営計画書兼補助事業計画書①',
        description: 'AI支援による経営計画書',
        type: 'BUSINESS_PLAN',
        content: `
経営計画書兼補助事業計画書①

【1. 企業概要】
企業名: ${applicationData.companyInfo.companyName}
代表者: ${applicationData.companyInfo.representativeName}
業種: ${applicationData.companyInfo.businessType}
従業員数: ${applicationData.companyInfo.employeeCount}人
設立年: ${applicationData.companyInfo.foundedYear}年

【2. 顧客ニーズと市場の動向】
当社の業界では、デジタル化による効率化と顧客サービスの向上が重要な課題となっています。
新型コロナウイルスの影響により、非接触型サービスへの需要が急速に高まっており、
これに対応するための設備投資と販路拡大が急務となっています。

【3. 自社や自社の提供する商品・サービスの強み】
当社は長年にわたり地域に根ざした事業を展開し、顧客との信頼関係を築いてきました。
品質へのこだわりと迅速な対応力が当社の強みです。

【4. 経営方針・目標と今後のプラン】
事業名: ${applicationData.businessPlan.projectName}
目標: 生産性向上と販路拡大により、売上20%向上を目指します。
計画: ${applicationData.businessPlan.businessOverview || 'デジタル化による業務効率化を推進し、新たな顧客層の開拓を図ります。'}

【5. 補助事業の内容】
総事業費: ${applicationData.budgetPlan.totalProjectCost.toLocaleString()}円
補助申請額: ${applicationData.budgetPlan.subsidyAmount.toLocaleString()}円
自己負担額: ${applicationData.budgetPlan.selfFunding.toLocaleString()}円

【6. 期待される効果】
本事業により、作業効率の30%向上と新規顧客獲得により売上向上を見込んでいます。
        `,
        downloadUrl: '#',
        generatedAt: new Date()
      };
    }

    // 本番環境用の実装
    const template = await prisma.documentTemplate.findFirst({
      where: { templateName: '様式2_経営計画書', isActive: true }
    });

    if (!template) {
      throw new Error('様式2テンプレートが見つかりません');
    }

    // AI支援による経営計画書内容生成
    const aiGeneratedContent = await this.generateBusinessPlanWithAI(applicationData);

    const inputData = {
      ...aiGeneratedContent,
      project_name_detail: applicationData.businessPlan.projectName
    };

    return await documentTemplateService.generateDocument(
      template.id,
      inputData,
      '様式2_経営計画書兼補助事業計画書',
      'PDF',
      userId
    );
  }

  /**
   * AI支援による経営計画書内容生成
   */
  private async generateBusinessPlanWithAI(applicationData: SustainabilitySubsidyApplication) {
    try {
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      if (isDevelopment || !process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY.includes('test')) {
        return this.generateMockBusinessPlan(applicationData);
      }

      const prompt = `
以下の企業情報に基づき、小規模企業持続化補助金の様式2「経営計画書兼補助事業計画書①」の各項目を作成してください。

【企業情報】
会社名: ${applicationData.companyInfo.companyName}
事業内容: ${applicationData.companyInfo.businessType}
従業員数: ${applicationData.companyInfo.employeeCount}人
設立年: ${applicationData.companyInfo.foundedYear}年
プロジェクト名: ${applicationData.businessPlan.projectName}

【事業計画概要】
${applicationData.businessPlan.businessOverview || ''}

以下の形式で回答してください:
{
  "company_overview": "企業概要（400字程度）",
  "market_trends": "顧客ニーズと市場の動向（400字程度）",
  "company_strengths": "自社の強み（400字程度）",
  "management_policy": "経営方針・目標と今後のプラン（500字程度）",
  "sales_expansion": "販路開拓等の取組内容（750字程度）",
  "efficiency_improvement": "業務効率化の取組内容（500字程度）",
  "expected_effects": "補助事業の効果（400字程度）"
}
`;

      const response = await this.claude.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 3000,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const responseText = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        throw new Error('AI response does not contain valid JSON');
      }

      return JSON.parse(jsonMatch[0]);

    } catch (error) {
      logger.error('❌ AI経営計画書生成失敗', {
        error: error.message
      });
      return this.generateMockBusinessPlan(applicationData);
    }
  }

  /**
   * 模擬経営計画書生成
   */
  private generateMockBusinessPlan(applicationData: SustainabilitySubsidyApplication) {
    return {
      company_overview: `${applicationData.companyInfo.companyName}は、${applicationData.companyInfo.foundedYear}年に設立された${applicationData.companyInfo.businessType}を主力事業とする企業です。従業員数${applicationData.companyInfo.employeeCount}名の小規模事業者として、地域に根ざした事業活動を展開しています。長年培った技術力と顧客との信頼関係を基盤に、品質の高いサービスを提供し続けています。`,
      
      market_trends: `近年、当社の事業分野において、デジタル化の波が押し寄せており、顧客ニーズも多様化・高度化しています。特に新型コロナウイルスの影響により、非対面・非接触のサービス需要が急激に高まっています。競合他社も新たな取り組みを開始しており、市場での差別化が重要な課題となっています。`,
      
      company_strengths: `当社の強みは、長年の事業実績により培われた専門技術と、地域密着型の営業体制にあります。顧客との長期的な信頼関係を構築しており、リピート率が高いことが特徴です。また、小回りの利く組織体制により、顧客の要望に迅速かつ柔軟に対応できることも大きな競争優位性となっています。`,
      
      management_policy: `今後3年間で、デジタル技術を活用した業務効率化と新サービス開発により、売上高20%増を目指します。既存事業の安定的な成長を図りながら、新たな収益源の確保に取り組みます。人材育成にも力を入れ、従業員のスキルアップを図ることで、サービス品質の向上を実現します。`,
      
      sales_expansion: `${applicationData.businessPlan.projectName}の実施により、新たな顧客層の開拓と既存顧客への提供価値向上を図ります。具体的には、デジタルマーケティングの導入によるオンライン集客の強化、ホームページのリニューアルによる情報発信力の向上、SNSを活用したブランディング強化などに取り組みます。これらの施策により、認知度向上と新規顧客獲得を実現します。`,
      
      efficiency_improvement: `業務プロセスのデジタル化により、作業効率の大幅な改善を図ります。具体的には、顧客管理システムの導入による営業活動の効率化、業務管理システムの導入による進捗管理の最適化、電子化による書類作成・管理業務の効率化などを実施します。これにより、労働生産性を20%向上させます。`,
      
      expected_effects: `本補助事業の実施により、売上高の15%増加、業務効率の20%向上、新規顧客の30%増を見込んでいます。投資回収期間は2年を予定しており、事業の持続的成長の基盤を構築できます。また、従業員の労働環境改善により、人材の定着率向上も期待できます。`
    };
  }

  /**
   * 様式3生成
   */
  private async generateForm3(applicationData: SustainabilitySubsidyApplication, userId: string) {
    const template = await prisma.documentTemplate.findFirst({
      where: { templateName: '様式3_補助事業計画書', isActive: true }
    });

    if (!template) {
      throw new Error('様式3テンプレートが見つかりません');
    }

    const inputData = {
      expenseDetails: applicationData.budgetPlan.expenseDetails,
      totalCost: applicationData.budgetPlan.totalProjectCost,
      subsidyAmount: applicationData.budgetPlan.subsidyAmount,
      selfFunding: applicationData.budgetPlan.selfFunding,
      fundingSource: '自己資金により調達'
    };

    return await documentTemplateService.generateDocument(
      template.id,
      inputData,
      '様式3_補助事業計画書',
      'PDF',
      userId
    );
  }

  /**
   * 様式5生成
   */
  private async generateForm5(applicationData: SustainabilitySubsidyApplication, userId: string) {
    const template = await prisma.documentTemplate.findFirst({
      where: { templateName: '様式5_交付申請書', isActive: true }
    });

    if (!template) {
      throw new Error('様式5テンプレートが見つかりません');
    }

    const inputData = {
      applicationDate: new Date(),
      fiscalYear: '令和6年度',
      subsidyAmount: applicationData.budgetPlan.subsidyAmount,
      companyName: applicationData.companyInfo.companyName,
      representativeName: applicationData.companyInfo.representativeName
    };

    return await documentTemplateService.generateDocument(
      template.id,
      inputData,
      '様式5_補助金交付申請書',
      'PDF',
      userId
    );
  }

  /**
   * 様式6生成
   */
  private async generateForm6(applicationData: SustainabilitySubsidyApplication, userId: string) {
    const template = await prisma.documentTemplate.findFirst({
      where: { templateName: '様式6_宣誓同意書', isActive: true }
    });

    if (!template) {
      throw new Error('様式6テンプレートが見つかりません');
    }

    const inputData = {
      declarationDate: new Date(),
      companyName: applicationData.companyInfo.companyName,
      representativeName: applicationData.companyInfo.representativeName
    };

    return await documentTemplateService.generateDocument(
      template.id,
      inputData,
      '様式6_宣誓・同意書',
      'PDF',
      userId
    );
  }

  /**
   * 様式7生成（賃金引上げ枠）
   */
  private async generateForm7(applicationData: SustainabilitySubsidyApplication, userId: string) {
    const template = await prisma.documentTemplate.findFirst({
      where: { templateName: '様式7_賃金引上げ誓約書', isActive: true }
    });

    if (!template) {
      throw new Error('様式7テンプレートが見つかりません');
    }

    const inputData = {
      pledgeDate: new Date(),
      currentMinWage: 900, // 実際は入力値
      targetMinWage: 950, // 実際は入力値
      implementationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 1ヶ月後
      companyName: applicationData.companyInfo.companyName,
      representativeName: applicationData.companyInfo.representativeName
    };

    return await documentTemplateService.generateDocument(
      template.id,
      inputData,
      '様式7_賃金引上げ枠誓約書',
      'PDF',
      userId
    );
  }
}

export const sustainabilitySubsidyService = new SustainabilitySubsidyService();