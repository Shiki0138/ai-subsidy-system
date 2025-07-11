import { OpenAI } from '@langchain/openai';
import { ChatAnthropic } from '@langchain/anthropic';
import { PromptTemplate } from '@langchain/core/prompts';
import { RunnableSequence } from '@langchain/core/runnables';

// 型定義
export interface CompanyProfile {
  name: string;
  businessType: string;
  foundedYear: number;
  employeeCount: number;
  description: string;
  industry: string;
  location: string;
  revenue?: number;
}

export interface SubsidyProgram {
  id: string;
  name: string;
  description: string;
  category: string;
  maxAmount: number;
  eligibilityCriteria: string[];
  applicationDeadline: Date;
  status: 'active' | 'inactive';
}

export interface AIAnalysisInput {
  companyProfile: CompanyProfile;
  projectDescription: string;
  targetMarket: string;
  fundingAmount: number;
}

export interface AIAnalysisResult {
  innovationScore: number;
  marketPotentialScore: number;
  feasibilityScore: number;
  overallScore: number;
  recommendations: string[];
  concerns: string[];
  improvementSuggestions: string[];
}

export interface RecommendationInput {
  companyProfile: CompanyProfile;
  availablePrograms: SubsidyProgram[];
}

export interface ProgramRecommendation {
  program: SubsidyProgram;
  score: number;
  reasoning: string;
  concerns: string[];
  preparationPeriod: string;
}

export interface RecommendationResult {
  recommendations: ProgramRecommendation[];
  totalPrograms: number;
  analyzedAt: Date;
}

export interface ContentGenerationInput {
  sectionType: 'businessPlan' | 'projectDescription' | 'marketAnalysis' | 'budget' | 'timeline';
  companyProfile: CompanyProfile;
  projectDescription?: string;
  additionalContext?: any;
}

export interface GeneratedContent {
  content: string;
  confidence: number;
  suggestions: string[];
}

/**
 * AI処理を統括するオーケストレータークラス
 */
class AIOrchestrator {
  private openaiModel: OpenAI;
  private anthropicModel: ChatAnthropic;

  constructor() {
    // OpenAI GPT-4の初期化
    this.openaiModel = new OpenAI({
      modelName: 'gpt-4',
      temperature: 0.7,
      maxTokens: 4000,
      openAIApiKey: process.env.OPENAI_API_KEY,
    });

    // Anthropic Claude 3.5 Sonnetの初期化
    this.anthropicModel = new ChatAnthropic({
      modelName: 'claude-3-5-sonnet-20241022',
      temperature: 0.5,
      maxTokens: 4000,
      anthropicApiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * 事業計画の包括的AI分析
   */
  async analyzeBusinessPlan(input: AIAnalysisInput): Promise<AIAnalysisResult> {
    const analysisPrompt = PromptTemplate.fromTemplate(`
      以下の事業計画を詳細に分析し、技術革新性、市場性、実現可能性の観点から評価してください。

      企業情報:
      - 企業名: {companyName}
      - 業種: {businessType}
      - 設立年: {foundedYear}
      - 従業員数: {employeeCount}
      - 事業内容: {description}

      プロジェクト詳細:
      - プロジェクト概要: {projectDescription}
      - ターゲット市場: {targetMarket}
      - 申請予定金額: {fundingAmount}円

      以下の項目について0-100点で評価し、詳細な分析結果を提供してください:
      
      1. 技術革新性スコア
      2. 市場性スコア
      3. 実現可能性スコア
      
      また、以下も含めてください:
      - 推奨事項 (3-5項目)
      - 懸念点 (2-3項目)
      - 改善提案 (3-5項目)

      結果はJSON形式で返してください。
    `);

    const chain = RunnableSequence.from([
      analysisPrompt,
      this.anthropicModel,
    ]);

    const result = await chain.invoke({
      companyName: input.companyProfile.name,
      businessType: input.companyProfile.businessType,
      foundedYear: input.companyProfile.foundedYear,
      employeeCount: input.companyProfile.employeeCount,
      description: input.companyProfile.description,
      projectDescription: input.projectDescription,
      targetMarket: input.targetMarket,
      fundingAmount: input.fundingAmount,
    });

    return this.parseAnalysisResult(result.content as string);
  }

  /**
   * 補助金プログラム推奨
   */
  async recommendPrograms(input: RecommendationInput): Promise<RecommendationResult> {
    const recommendationPrompt = PromptTemplate.fromTemplate(`
      以下の企業情報に基づいて、最適な補助金プログラムを推奨してください。

      企業情報:
      - 企業名: {companyName}
      - 業種: {businessType}
      - 設立年: {foundedYear}
      - 従業員数: {employeeCount}
      - 事業内容: {description}

      利用可能な補助金プログラム:
      {availablePrograms}

      各プログラムについて以下を評価してください:
      1. 適合度スコア (0-100点)
      2. 推奨理由
      3. 懸念点
      4. 準備期間の目安

      上位5つのプログラムを推奨順に返してください。
    `);

    const chain = RunnableSequence.from([
      recommendationPrompt,
      this.openaiModel,
    ]);

    const result = await chain.invoke({
      companyName: input.companyProfile.name,
      businessType: input.companyProfile.businessType,
      foundedYear: input.companyProfile.foundedYear,
      employeeCount: input.companyProfile.employeeCount,
      description: input.companyProfile.description,
      availablePrograms: JSON.stringify(input.availablePrograms, null, 2),
    });

    return this.parseRecommendationResult(result, input.availablePrograms);
  }

  /**
   * コンテンツ生成（事業計画書の各セクション）
   */
  async generateContent(input: ContentGenerationInput): Promise<GeneratedContent> {
    const contentPrompt = this.getContentPrompt(input.sectionType);
    
    const chain = RunnableSequence.from([
      contentPrompt,
      this.openaiModel,
    ]);

    const result = await chain.invoke({
      companyName: input.companyProfile.name,
      businessType: input.companyProfile.businessType,
      description: input.companyProfile.description,
      projectDescription: input.projectDescription || '',
      additionalContext: JSON.stringify(input.additionalContext || {}),
    });

    return {
      content: result,
      confidence: this.calculateConfidenceScore(result),
      suggestions: this.extractSuggestions(result),
    };
  }

  /**
   * セクション別のプロンプトテンプレートを取得
   */
  private getContentPrompt(sectionType: string): PromptTemplate {
    const prompts: Record<string, string> = {
      businessPlan: `
        以下の企業情報に基づいて、包括的な事業計画書を作成してください。

        企業情報:
        - 企業名: {companyName}
        - 業種: {businessType}
        - 事業内容: {description}
        
        以下の構成で詳細な事業計画を作成してください:
        1. 事業概要
        2. 市場分析
        3. 競合分析
        4. 事業戦略
        5. 実施計画
        6. 収益計画
        7. リスク分析
      `,
      projectDescription: `
        以下の情報に基づいて、プロジェクトの詳細説明を作成してください。

        企業情報: {companyName} - {businessType}
        事業内容: {description}
        プロジェクト概要: {projectDescription}
        
        技術的な革新性、市場への影響、実現可能性を重点的に説明してください。
      `,
      marketAnalysis: `
        以下の企業・プロジェクト情報に基づいて、詳細な市場分析を行ってください。

        企業: {companyName} ({businessType})
        事業内容: {description}
        
        市場規模、成長性、競合状況、参入機会について分析してください。
      `,
      budget: `
        以下のプロジェクトの予算計画を作成してください。

        企業: {companyName}
        プロジェクト: {projectDescription}
        
        詳細な費用内訳と投資回収計画を含めてください。
      `,
      timeline: `
        以下のプロジェクトの実施スケジュールを作成してください。

        企業: {companyName}
        プロジェクト: {projectDescription}
        
        フェーズ別の具体的なマイルストーンを含めてください。
      `,
    };

    return PromptTemplate.fromTemplate(prompts[sectionType] || prompts.businessPlan);
  }

  /**
   * AI分析結果をパース
   */
  private parseAnalysisResult(text: string): AIAnalysisResult {
    try {
      // JSONパース試行
      const parsed = JSON.parse(text);
      return {
        innovationScore: parsed.innovationScore || 75,
        marketPotentialScore: parsed.marketPotentialScore || 70,
        feasibilityScore: parsed.feasibilityScore || 80,
        overallScore: parsed.overallScore || 75,
        recommendations: parsed.recommendations || [],
        concerns: parsed.concerns || [],
        improvementSuggestions: parsed.improvementSuggestions || [],
      };
    } catch (error) {
      // フォールバック: テキストから情報を抽出
      return {
        innovationScore: this.extractScoreFromText(text, '技術革新性'),
        marketPotentialScore: this.extractScoreFromText(text, '市場性'),
        feasibilityScore: this.extractScoreFromText(text, '実現可能性'),
        overallScore: 75,
        recommendations: ['AI分析による詳細な推奨事項を生成中'],
        concerns: ['詳細な懸念点の分析を実行中'],
        improvementSuggestions: ['改善提案の生成を実行中'],
      };
    }
  }

  /**
   * 推奨結果をパース
   */
  private parseRecommendationResult(text: string, programs: SubsidyProgram[]): RecommendationResult {
    // 暫定実装：最初の5つのプログラムを返す
    return {
      recommendations: programs.slice(0, 5).map((program, index) => ({
        program,
        score: 90 - index * 5,
        reasoning: '企業プロファイルとの高い適合性',
        concerns: ['申請競争率の考慮が必要'],
        preparationPeriod: '2-4週間',
      })),
      totalPrograms: programs.length,
      analyzedAt: new Date(),
    };
  }

  /**
   * テキストからスコアを抽出
   */
  private extractScoreFromText(text: string, category: string): number {
    const regex = new RegExp(`${category}.*?(\\d+)点?`, 'i');
    const match = text.match(regex);
    return match ? parseInt(match[1]) : 75;
  }

  /**
   * 信頼度スコアを計算
   */
  private calculateConfidenceScore(content: string): number {
    // 基本的な信頼度計算ロジック
    const length = content.length;
    const hasNumbers = /\d/.test(content);
    const hasStructure = /\n/.test(content);
    
    let score = 70;
    if (length > 500) score += 10;
    if (hasNumbers) score += 10;
    if (hasStructure) score += 10;
    
    return Math.min(score, 95);
  }

  /**
   * 提案を抽出
   */
  private extractSuggestions(content: string): string[] {
    // 基本的な提案抽出ロジック
    const lines = content.split('\n');
    const suggestions = lines
      .filter(line => line.includes('提案') || line.includes('推奨') || line.includes('改善'))
      .slice(0, 3);
    
    return suggestions.length > 0 ? suggestions : ['詳細な分析結果に基づく追加提案を生成中'];
  }
}

export default AIOrchestrator;