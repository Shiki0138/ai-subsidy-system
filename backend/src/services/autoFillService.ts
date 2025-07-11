import { PrismaClient } from '@prisma/client';
import { logger } from '../config/logger';
import { OpenAI } from 'openai';

const prisma = new PrismaClient();

interface CompanyProfile {
  id: string;
  companyName: string;
  industry: string;
  businessDescription: string;
  employeeCount: string;
  address: string;
  website?: string;
  annualRevenue?: string;
  establishedYear?: number;
}

interface SubsidyGuideline {
  name: string;
  applicationSections: {
    sectionName: string;
    description: string;
    maxLength?: number;
    required: boolean;
  }[];
  eligibilityCriteria: string[];
}

interface AutoFillSuggestion {
  sectionId: string;
  sectionName: string;
  suggestedContent: string;
  confidence: number; // 0-100%の確信度
  sources: string[]; // データソース
  alternatives?: string[]; // 代替案
}

class AutoFillService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || 'test-key'
    });
  }

  /**
   * 企業プロフィールと補助金要項に基づく自動入力提案
   */
  async generateAutoFillSuggestions(
    companyProfileId: string,
    subsidyGuidelineId: string
  ): Promise<AutoFillSuggestion[]> {
    try {
      logger.info('🤖 Starting auto-fill generation', {
        companyProfileId,
        subsidyGuidelineId
      });

      // 1. 企業プロフィール取得
      const companyProfile = await this.getCompanyProfile(companyProfileId);
      
      // 2. 補助金要項取得
      const subsidyGuideline = await this.getSubsidyGuideline(subsidyGuidelineId);
      
      // 3. 過去の申請実績取得（学習データ）
      const pastApplications = await this.getPastApplications(companyProfileId);
      
      // 4. セクション別に自動入力内容生成
      const suggestions: AutoFillSuggestion[] = [];
      
      for (const section of subsidyGuideline.applicationSections) {
        const suggestion = await this.generateSectionContent(
          companyProfile,
          section,
          subsidyGuideline,
          pastApplications
        );
        
        if (suggestion) {
          suggestions.push(suggestion);
        }
      }

      logger.info('✅ Auto-fill generation completed', {
        companyProfileId,
        suggestionsCount: suggestions.length
      });

      return suggestions;

    } catch (error) {
      logger.error('❌ Auto-fill generation failed', {
        companyProfileId,
        subsidyGuidelineId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * 企業プロフィール取得
   */
  private async getCompanyProfile(companyProfileId: string): Promise<CompanyProfile> {
    const user = await prisma.user.findUnique({
      where: { id: companyProfileId },
      select: {
        id: true,
        companyName: true,
        industry: true,
        businessDescription: true,
        employeeCount: true,
        address: true,
        website: true,
        annualRevenue: true,
        establishedYear: true
      }
    });

    if (!user) {
      throw new Error('Company profile not found');
    }

    return user as CompanyProfile;
  }

  /**
   * 補助金要項取得
   */
  private async getSubsidyGuideline(subsidyGuidelineId: string): Promise<SubsidyGuideline> {
    const guideline = await prisma.subsidyProgram.findUnique({
      where: { id: subsidyGuidelineId },
      select: {
        name: true,
        applicationGuidelines: true
      }
    });

    if (!guideline || !guideline.applicationGuidelines) {
      throw new Error('Subsidy guideline not found');
    }

    return JSON.parse(guideline.applicationGuidelines as string);
  }

  /**
   * 過去の申請実績取得
   */
  private async getPastApplications(companyProfileId: string): Promise<any[]> {
    const applications = await prisma.application.findMany({
      where: { 
        userId: companyProfileId,
        status: { in: ['COMPLETED', 'SUBMITTED'] }
      },
      select: {
        title: true,
        subsidyType: true,
        projectDescription: true,
        businessPlan: true,
        budget: true,
        expectedResults: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' },
      take: 5 // 最新5件
    });

    return applications;
  }

  /**
   * セクション別コンテンツ生成
   */
  private async generateSectionContent(
    companyProfile: CompanyProfile,
    section: any,
    subsidyGuideline: SubsidyGuideline,
    pastApplications: any[]
  ): Promise<AutoFillSuggestion | null> {
    try {
      const sectionName = section.sectionName.toLowerCase();
      
      // セクションタイプに応じた生成ロジック
      if (sectionName.includes('企業概要') || sectionName.includes('会社概要')) {
        return this.generateCompanyOverview(companyProfile, section);
      } else if (sectionName.includes('事業計画') || sectionName.includes('事業内容')) {
        return this.generateBusinessPlan(companyProfile, section, subsidyGuideline);
      } else if (sectionName.includes('予算') || sectionName.includes('経費')) {
        return this.generateBudgetPlan(companyProfile, section, subsidyGuideline);
      } else if (sectionName.includes('効果') || sectionName.includes('成果')) {
        return this.generateExpectedResults(companyProfile, section, subsidyGuideline);
      } else {
        return this.generateGenericContent(companyProfile, section, subsidyGuideline, pastApplications);
      }

    } catch (error) {
      logger.error('❌ Section content generation failed', {
        sectionName: section.sectionName,
        error: error.message
      });
      return null;
    }
  }

  /**
   * 企業概要生成
   */
  private async generateCompanyOverview(
    companyProfile: CompanyProfile,
    section: any
  ): Promise<AutoFillSuggestion> {
    const content = `
【企業概要】

◆会社名
${companyProfile.companyName}

◆業界・事業分野
${companyProfile.industry}

◆従業員数
${companyProfile.employeeCount}

◆事業内容
${companyProfile.businessDescription}

◆所在地
${companyProfile.address || '東京都内'}

◆設立年
${companyProfile.establishedYear ? `${companyProfile.establishedYear}年` : '20XX年'}

◆企業の特徴・強み
当社は${companyProfile.industry}分野において、${companyProfile.businessDescription}を通じて顧客価値の創造に取り組んでおります。${companyProfile.employeeCount}の体制で、質の高いサービス提供と継続的な事業成長を実現しています。
    `.trim();

    return {
      sectionId: section.sectionName.toLowerCase().replace(/\s+/g, '_'),
      sectionName: section.sectionName,
      suggestedContent: content,
      confidence: 95,
      sources: ['企業プロフィール'],
      alternatives: [
        '簡潔版：基本情報のみの短い説明',
        '詳細版：より詳しい企業背景と実績を含む説明'
      ]
    };
  }

  /**
   * 事業計画生成
   */
  private async generateBusinessPlan(
    companyProfile: CompanyProfile,
    section: any,
    subsidyGuideline: SubsidyGuideline
  ): Promise<AutoFillSuggestion> {
    const isDevelopment = process.env.NODE_ENV === 'development';
    
    if (isDevelopment || !process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY.includes('test')) {
      // 開発環境では模擬応答
      const content = this.generateMockBusinessPlan(companyProfile, subsidyGuideline);
      
      return {
        sectionId: section.sectionName.toLowerCase().replace(/\s+/g, '_'),
        sectionName: section.sectionName,
        suggestedContent: content,
        confidence: 85,
        sources: ['企業プロフィール', 'AI生成（模擬）'],
        alternatives: [
          '保守的アプローチ：リスクを抑えた着実な計画',
          '積極的アプローチ：高い成長目標を設定した計画'
        ]
      };
    }

    try {
      const prompt = `
以下の企業情報と補助金要項に基づいて、効果的な事業計画を作成してください。

【企業情報】
- 会社名: ${companyProfile.companyName}
- 業界: ${companyProfile.industry}
- 事業内容: ${companyProfile.businessDescription}
- 従業員数: ${companyProfile.employeeCount}

【補助金】
- 名称: ${subsidyGuideline.name}
- セクション要求: ${section.description}

【作成要件】
- ${section.maxLength ? `文字数: ${section.maxLength}文字以内` : '800-1200文字程度'}
- 具体的で説得力のある内容
- 採択されやすい観点での記載

以下の構成で事業計画を作成してください：
1. 事業の背景・課題
2. 解決策・取り組み内容
3. 期待される効果
4. 実施体制・スケジュール
`;

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'あなたは補助金申請の専門家です。採択率の高い事業計画を作成してください。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      });

      const content = response.choices[0].message.content || this.generateMockBusinessPlan(companyProfile, subsidyGuideline);

      return {
        sectionId: section.sectionName.toLowerCase().replace(/\s+/g, '_'),
        sectionName: section.sectionName,
        suggestedContent: content,
        confidence: 88,
        sources: ['企業プロフィール', 'AI生成'],
        alternatives: [
          '技術重視版：技術的な側面を強調した計画',
          '市場重視版：市場機会と顧客価値を重視した計画'
        ]
      };

    } catch (error) {
      logger.warn('⚠️ OpenAI API failed, using fallback', { error: error.message });
      
      const content = this.generateMockBusinessPlan(companyProfile, subsidyGuideline);
      
      return {
        sectionId: section.sectionName.toLowerCase().replace(/\s+/g, '_'),
        sectionName: section.sectionName,
        suggestedContent: content,
        confidence: 75,
        sources: ['企業プロフィール', 'テンプレート'],
        alternatives: [
          '標準版：一般的な事業計画の構成',
          'カスタム版：業界特化型の事業計画'
        ]
      };
    }
  }

  /**
   * 模擬事業計画生成
   */
  private generateMockBusinessPlan(
    companyProfile: CompanyProfile,
    subsidyGuideline: SubsidyGuideline
  ): string {
    return `
【事業計画】

◆事業の背景・課題
当社は${companyProfile.industry}分野で事業を展開する中で、以下の課題に直面しています：
・業務効率化の必要性
・デジタル技術活用による競争力強化
・持続可能な成長基盤の構築

◆解決策・取り組み内容
本事業では、${subsidyGuideline.name}を活用して以下の取り組みを実施します：
・先進的なシステム・設備の導入
・業務プロセスの最適化
・従業員のスキルアップ・人材育成
・新規顧客開拓・販路拡大

◆期待される効果
【定量的効果】
・生産性向上：約20%の効率改善
・売上拡大：年間売上の15%増加
・コスト削減：運営費用の10%削減

【定性的効果】
・顧客満足度の向上
・従業員の働きがい向上
・企業競争力の強化

◆実施体制・スケジュール
【実施体制】
・プロジェクトマネージャー：代表取締役
・実務担当者：${companyProfile.employeeCount}体制
・外部専門家：必要に応じてコンサルタント活用

【実施スケジュール】
・1-3ヶ月：準備・調達
・4-8ヶ月：導入・実装
・9-12ヶ月：運用・効果測定

当社の${companyProfile.businessDescription}における豊富な経験と、${companyProfile.employeeCount}の確実な実施体制により、本事業の成功を確信しております。
    `.trim();
  }

  /**
   * 予算計画生成
   */
  private async generateBudgetPlan(
    companyProfile: CompanyProfile,
    section: any,
    subsidyGuideline: SubsidyGuideline
  ): Promise<AutoFillSuggestion> {
    const content = `
【予算計画】

◆補助対象経費の内訳

【設備費】（60%）
・システム・機器導入費：3,000,000円
・設置・設定費用：500,000円
小計：3,500,000円

【外注費】（25%）
・システム開発・カスタマイズ：1,200,000円
・コンサルティング費用：300,000円
小計：1,500,000円

【人件費・研修費】（15%）
・従業員研修費：600,000円
・技術習得費用：300,000円
小計：900,000円

◆総事業費：5,900,000円
◆補助金申請額：2,950,000円（50%）
◆自己負担額：2,950,000円

◆資金調達計画
・自己資金：2,000,000円
・金融機関借入：950,000円

◆投資対効果
・投資回収期間：約2年
・年間収益向上：1,500,000円
・ROI：約25%

当社の財務状況は健全であり、自己負担分の資金調達についても確実な見通しを持っております。
    `;

    return {
      sectionId: section.sectionName.toLowerCase().replace(/\s+/g, '_'),
      sectionName: section.sectionName,
      suggestedContent: content,
      confidence: 82,
      sources: ['標準テンプレート', '業界平均値'],
      alternatives: [
        '設備重視版：設備投資の比重を高めた予算',
        '人材重視版：研修・人材育成の比重を高めた予算'
      ]
    };
  }

  /**
   * 期待される効果生成
   */
  private async generateExpectedResults(
    companyProfile: CompanyProfile,
    section: any,
    subsidyGuideline: SubsidyGuideline
  ): Promise<AutoFillSuggestion> {
    const content = `
【期待される効果・成果】

◆定量的効果

【生産性向上】
・業務処理時間：30%短縮
・エラー率：50%削減
・処理能力：200%向上

【売上・収益改善】
・売上高：年間15%増加（約1,500万円増）
・利益率：5%ポイント改善
・新規顧客獲得：月間20件増

【コスト削減】
・人件費効率化：年間300万円削減
・運営費用：10%削減
・外注費用：20%削減

◆定性的効果

【顧客価値向上】
・サービス品質の向上
・顧客満足度の改善
・リピート率の向上

【組織力強化】
・従業員スキルの向上
・業務の標準化・効率化
・働き方改革の実現

【競争力強化】
・市場での差別化
・新サービス提供能力
・業界内での地位向上

◆社会的意義
・${companyProfile.industry}業界の発展に寄与
・地域経済の活性化
・雇用創出（新規2-3名採用予定）

◆効果測定方法
・月次業績レビュー
・顧客満足度調査
・従業員アンケート
・KPI達成度評価

これらの効果により、当社は${companyProfile.industry}分野でのリーディングカンパニーとしての地位確立を目指します。
    `;

    return {
      sectionId: section.sectionName.toLowerCase().replace(/\s+/g, '_'),
      sectionName: section.sectionName,
      suggestedContent: content,
      confidence: 85,
      sources: ['企業プロフィール', '業界ベンチマーク'],
      alternatives: [
        '保守的予測：控えめな効果を想定した計画',
        '積極的予測：高い成長効果を想定した計画'
      ]
    };
  }

  /**
   * 汎用コンテンツ生成
   */
  private async generateGenericContent(
    companyProfile: CompanyProfile,
    section: any,
    subsidyGuideline: SubsidyGuideline,
    pastApplications: any[]
  ): Promise<AutoFillSuggestion> {
    const content = `
【${section.sectionName}】

${section.description}

当社${companyProfile.companyName}では、${companyProfile.industry}分野における${companyProfile.businessDescription}を基盤として、以下の内容で取り組みを進めてまいります。

◆基本方針
・事業目標と補助金目的の整合性確保
・実現可能性と効果の最大化
・継続的な改善と発展

◆具体的内容
[ここに具体的な取り組み内容を記載]

◆期待される成果
・事業効率の向上
・競争力の強化
・持続的成長の実現

※この内容は企業情報を基に自動生成されたテンプレートです。具体的な数値や詳細を追加してカスタマイズしてください。
    `;

    return {
      sectionId: section.sectionName.toLowerCase().replace(/\s+/g, '_'),
      sectionName: section.sectionName,
      suggestedContent: content,
      confidence: 70,
      sources: ['企業プロフィール', 'テンプレート'],
      alternatives: [
        '詳細版：より具体的な説明を含む内容',
        '簡潔版：要点を絞った簡潔な内容'
      ]
    };
  }

  /**
   * 過去の申請実績を基にした学習機能
   */
  async learnFromPastApplications(userId: string): Promise<void> {
    try {
      const applications = await prisma.application.findMany({
        where: { 
          userId,
          status: { in: ['COMPLETED', 'SUBMITTED'] }
        },
        select: {
          title: true,
          subsidyType: true,
          projectDescription: true,
          businessPlan: true,
          budget: true,
          expectedResults: true,
          generatedContent: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      // 学習データとして保存
      // 実装：成功パターンの分析、よく使われる表現の抽出など
      
      logger.info('📚 Learning from past applications', {
        userId,
        applicationsCount: applications.length
      });

    } catch (error) {
      logger.error('❌ Learning from past applications failed', {
        userId,
        error: error.message
      });
    }
  }
}

export const autoFillService = new AutoFillService();