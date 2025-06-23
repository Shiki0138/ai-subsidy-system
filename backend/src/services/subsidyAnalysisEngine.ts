/**
 * 補助金募集要項分析エンジン
 * 募集要項を解析し、企業ニーズとマッチングして最適な申請書を生成
 */

import { PrismaClient } from '@prisma/client';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import logger from '../config/logger';

interface CompanyProfile {
  id: string;
  companyName: string;
  industry: string;
  businessDescription: string;
  employeeCount: number;
  annualRevenue?: number;
  establishedYear?: number;
  strengths: string[];
  challenges: string[];
  objectives: string[];
}

interface ProjectPlan {
  title: string;
  purpose: string;
  background: string;
  implementation: string;
  expectedResults: string[];
  budget: number;
  timeline: string;
}

interface AnalysisResult {
  matchScore: number; // 0-100
  eligibility: {
    isEligible: boolean;
    reasons: string[];
    missingRequirements: string[];
  };
  recommendations: {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
  };
  keywordAnalysis: {
    matchedKeywords: string[];
    suggestedKeywords: string[];
    keywordDensity: Record<string, number>;
  };
  generatedContent: {
    optimizedTitle: string;
    optimizedPurpose: string;
    optimizedBackground: string;
    keyPhrases: string[];
  };
}

export class SubsidyAnalysisEngine {
  private prisma: PrismaClient;
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    this.prisma = new PrismaClient();
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * 企業プロファイルと募集要項のマッチング分析
   */
  async analyzeMatch(
    subsidyProgramId: string,
    companyProfile: CompanyProfile,
    projectPlan: ProjectPlan
  ): Promise<AnalysisResult> {
    try {
      // 募集要項データの取得
      const subsidyProgram = await this.prisma.subsidyProgram.findUnique({
        where: { id: subsidyProgramId },
        include: {
          guidelines: { 
            take: 1, 
            orderBy: { createdAt: 'desc' },
            include: {
              requirements: true,
              evaluationItems: true,
              successCases: { 
                take: 10, 
                orderBy: { evaluationScore: 'desc' },
                where: { wasAdopted: true }
              }
            }
          }
        }
      });

      if (!subsidyProgram) {
        throw new Error('補助金プログラムが見つかりません');
      }

      const guideline = subsidyProgram.guidelines[0];
      if (!guideline) {
        throw new Error('募集要項が見つかりません');
      }

      // 1. 適格性チェック
      const eligibility = await this.checkEligibility(guideline, companyProfile);

      // 2. 成功事例分析
      const successPatterns = await this.analyzeSuccessPatterns(guideline.successCases);

      // 3. キーワード分析
      const keywordAnalysis = await this.analyzeKeywords(
        guideline,
        projectPlan,
        successPatterns.keywords
      );

      // 4. 内容最適化
      const optimizedContent = await this.optimizeContent(
        guideline,
        subsidyProgram,
        companyProfile,
        projectPlan,
        successPatterns,
        keywordAnalysis
      );

      // 5. マッチスコア計算
      const matchScore = this.calculateMatchScore(
        eligibility,
        keywordAnalysis,
        optimizedContent
      );

      // 6. 改善提案生成
      const recommendations = await this.generateRecommendations(
        guideline,
        subsidyProgram,
        companyProfile,
        projectPlan,
        matchScore,
        keywordAnalysis
      );

      return {
        matchScore,
        eligibility,
        recommendations,
        keywordAnalysis,
        generatedContent: optimizedContent
      };
    } catch (error) {
      logger.error('募集要項分析エラー:', error);
      throw error;
    }
  }

  /**
   * 適格性チェック
   */
  private async checkEligibility(
    guideline: any,
    companyProfile: CompanyProfile
  ): Promise<AnalysisResult['eligibility']> {
    const requirements = guideline.requirements;
    const missingRequirements: string[] = [];
    const reasons: string[] = [];

    // 事業規模チェック
    if (guideline.targetBusinessSize?.length > 0) {
      const sizeMatch = this.checkBusinessSize(
        companyProfile.employeeCount,
        guideline.targetBusinessSize
      );
      if (!sizeMatch) {
        missingRequirements.push('事業規模が対象外です');
      }
    }

    // 業種チェック
    if (guideline.targetIndustries?.length > 0) {
      const industryMatch = guideline.targetIndustries.includes(companyProfile.industry);
      if (!industryMatch) {
        missingRequirements.push('業種が対象外です');
      }
    }

    // 必須要件チェック
    for (const req of requirements.filter(r => r.isMandatory)) {
      const checkResult = await this.checkRequirement(req, companyProfile);
      if (!checkResult.met) {
        missingRequirements.push(checkResult.reason);
      } else {
        reasons.push(checkResult.reason);
      }
    }

    const isEligible = missingRequirements.length === 0;

    return {
      isEligible,
      reasons,
      missingRequirements
    };
  }

  /**
   * 成功パターン分析
   */
  private async analyzeSuccessPatterns(successCases: any[]) {
    if (successCases.length === 0) {
      return {
        patterns: [],
        keywords: [],
        commonFactors: []
      };
    }

    // キーワード抽出
    const allKeywords: string[] = [];
    const allFactors: string[] = [];

    successCases.forEach(case_ => {
      allKeywords.push(...(case_.keyPhrases || []));
      allFactors.push(...(case_.successFactors || []));
    });

    // 頻出キーワードの分析
    const keywordFrequency = this.calculateFrequency(allKeywords);
    const topKeywords = Object.entries(keywordFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 20)
      .map(([keyword]) => keyword);

    // 共通成功要因の抽出
    const factorFrequency = this.calculateFrequency(allFactors);
    const commonFactors = Object.entries(factorFrequency)
      .filter(([, count]) => count >= successCases.length * 0.3) // 30%以上で共通
      .map(([factor]) => factor);

    return {
      patterns: this.extractPatterns(successCases),
      keywords: topKeywords,
      commonFactors
    };
  }

  /**
   * キーワード分析
   */
  private async analyzeKeywords(
    guideline: any,
    projectPlan: ProjectPlan,
    successKeywords: string[]
  ): Promise<AnalysisResult['keywordAnalysis']> {
    const evaluationCriteria = guideline.evaluationItems;

    // 重要キーワードの抽出
    const importantKeywords = new Set<string>();
    
    // 評価基準からキーワード抽出
    evaluationCriteria.forEach(criterion => {
      importantKeywords.add(...(criterion.keywords || []));
    });

    // 成功事例からのキーワード追加
    successKeywords.forEach(kw => importantKeywords.add(kw));

    // プロジェクト計画内のキーワードマッチング
    const projectText = `${projectPlan.title} ${projectPlan.purpose} ${projectPlan.background} ${projectPlan.implementation}`;
    const matchedKeywords: string[] = [];
    const keywordDensity: Record<string, number> = {};

    importantKeywords.forEach(keyword => {
      const count = (projectText.match(new RegExp(keyword, 'gi')) || []).length;
      if (count > 0) {
        matchedKeywords.push(keyword);
        keywordDensity[keyword] = count;
      }
    });

    // 不足キーワードの提案
    const suggestedKeywords = Array.from(importantKeywords)
      .filter(kw => !matchedKeywords.includes(kw))
      .slice(0, 10);

    return {
      matchedKeywords,
      suggestedKeywords,
      keywordDensity
    };
  }

  /**
   * 内容最適化
   */
  private async optimizeContent(
    guideline: any,
    subsidyProgram: any,
    companyProfile: CompanyProfile,
    projectPlan: ProjectPlan,
    successPatterns: any,
    keywordAnalysis: any
  ): Promise<AnalysisResult['generatedContent']> {
    
    // GPT-4による最適化
    const optimizationPrompt = this.createOptimizationPrompt(
      guideline,
      subsidyProgram,
      companyProfile,
      projectPlan,
      successPatterns,
      keywordAnalysis
    );

    const completion = await this.openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content: '補助金申請書の専門家として、募集要項に完全に適合した内容を生成してください。'
        },
        {
          role: 'user',
          content: optimizationPrompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000
    });

    const result = JSON.parse(completion.choices[0]?.message?.content || '{}');

    // Claude 3.5による追加最適化
    const enhancedContent = await this.enhanceWithClaude(
      result,
      subsidyProgram,
      keywordAnalysis.suggestedKeywords
    );

    return enhancedContent;
  }

  /**
   * Claudeによる内容強化
   */
  private async enhanceWithClaude(
    content: any,
    subsidyProgram: any,
    suggestedKeywords: string[]
  ) {
    const message = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1500,
      temperature: 0.2,
      system: `あなたは補助金申請書作成の専門家です。
以下の内容を、募集要項の評価基準に完全に適合するよう最適化してください。
重要キーワードを自然に含め、具体性と説得力を高めてください。`,
      messages: [
        {
          role: 'user',
          content: `
補助金名: ${subsidyProgram.name}
評価基準の重要キーワード: ${suggestedKeywords.join(', ')}

以下の内容を改善してください：
タイトル: ${content.optimizedTitle}
目的: ${content.optimizedPurpose}
背景: ${content.optimizedBackground}

改善ポイント：
1. 評価基準のキーワードを自然に含める
2. 具体的な数値や効果を明記
3. 補助金の目的と完全に合致させる
4. 審査員に伝わりやすい構成にする
`
        }
      ]
    });

    const enhancedText = message.content[0].text;
    
    // 構造化して返す
    return this.parseEnhancedContent(enhancedText, content);
  }

  /**
   * マッチスコア計算
   */
  private calculateMatchScore(
    eligibility: AnalysisResult['eligibility'],
    keywordAnalysis: AnalysisResult['keywordAnalysis'],
    optimizedContent: any
  ): number {
    let score = 0;

    // 適格性（40点）
    if (eligibility.isEligible) {
      score += 40;
    } else {
      score += Math.max(0, 40 - eligibility.missingRequirements.length * 10);
    }

    // キーワードマッチング（30点）
    const keywordScore = Math.min(30, keywordAnalysis.matchedKeywords.length * 3);
    score += keywordScore;

    // 内容の質（30点）
    if (optimizedContent) {
      score += 20; // 基本点
      if (optimizedContent.keyPhrases?.length >= 5) {
        score += 10;
      }
    }

    return Math.min(100, Math.max(0, score));
  }

  /**
   * 改善提案生成
   */
  private async generateRecommendations(
    guideline: any,
    subsidyProgram: any,
    companyProfile: CompanyProfile,
    projectPlan: ProjectPlan,
    matchScore: number,
    keywordAnalysis: any
  ): Promise<AnalysisResult['recommendations']> {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const improvements: string[] = [];

    // 強みの分析
    if (matchScore >= 70) {
      strengths.push('募集要項との整合性が高い');
    }
    if (keywordAnalysis.matchedKeywords.length >= 10) {
      strengths.push('重要キーワードを適切に含んでいる');
    }
    if (companyProfile.strengths.length > 0) {
      strengths.push('企業の強みが明確');
    }

    // 弱みの分析
    if (matchScore < 50) {
      weaknesses.push('募集要項との整合性が低い');
    }
    if (keywordAnalysis.suggestedKeywords.length > 5) {
      weaknesses.push('重要キーワードが不足している');
    }
    if (!projectPlan.expectedResults || projectPlan.expectedResults.length < 3) {
      weaknesses.push('期待される成果が不明確');
    }

    // 改善提案
    if (keywordAnalysis.suggestedKeywords.length > 0) {
      improvements.push(
        `以下のキーワードを自然に含めてください: ${keywordAnalysis.suggestedKeywords.slice(0, 5).join(', ')}`
      );
    }
    if (projectPlan.budget < guideline.minAmount) {
      improvements.push('事業規模を拡大し、最小補助額以上の計画にしてください');
    }
    improvements.push('具体的な数値目標（売上向上率、コスト削減率等）を明記してください');
    improvements.push('地域経済への波及効果を具体的に記載してください');

    return {
      strengths,
      weaknesses,
      improvements
    };
  }

  // ヘルパーメソッド
  private checkBusinessSize(employeeCount: number, targetSizes: string[]): boolean {
    // 事業規模のチェックロジック
    if (targetSizes.includes('小規模') && employeeCount <= 20) return true;
    if (targetSizes.includes('中規模') && employeeCount <= 300) return true;
    if (targetSizes.includes('中小企業') && employeeCount <= 300) return true;
    return false;
  }

  private async checkRequirement(
    requirement: any,
    companyProfile: CompanyProfile
  ): Promise<{ met: boolean; reason: string }> {
    // 要件チェックの詳細ロジック
    // 実際の実装では、より詳細な条件判定を行う
    return {
      met: true,
      reason: requirement.requirement
    };
  }

  private calculateFrequency(items: string[]): Record<string, number> {
    return items.reduce((acc, item) => {
      acc[item] = (acc[item] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  }

  private extractPatterns(successCases: any[]): string[] {
    // 成功パターンの抽出ロジック
    return successCases
      .flatMap(c => c.successFactors || [])
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 10);
  }

  private createOptimizationPrompt(
    guideline: any,
    subsidyProgram: any,
    companyProfile: CompanyProfile,
    projectPlan: ProjectPlan,
    successPatterns: any,
    keywordAnalysis: any
  ): string {
    return `
補助金名: ${subsidyProgram.name}
募集要項の目的: ${guideline.purpose || ''}

企業情報:
- 企業名: ${companyProfile.companyName}
- 業種: ${companyProfile.industry}
- 従業員数: ${companyProfile.employeeCount}
- 強み: ${companyProfile.strengths.join(', ')}
- 課題: ${companyProfile.challenges.join(', ')}

事業計画:
- タイトル: ${projectPlan.title}
- 目的: ${projectPlan.purpose}
- 背景: ${projectPlan.background}
- 実施内容: ${projectPlan.implementation}
- 期待成果: ${projectPlan.expectedResults.join(', ')}

成功事例のキーワード: ${successPatterns.keywords.join(', ')}
推奨キーワード: ${keywordAnalysis.suggestedKeywords.join(', ')}

以下の形式でJSONを生成してください：
{
  "optimizedTitle": "募集要項に完全に適合した事業タイトル",
  "optimizedPurpose": "評価基準を満たす具体的な事業目的（200-300字）",
  "optimizedBackground": "説得力のある事業背景（300-400字）",
  "keyPhrases": ["評価を高める5つのキーフレーズ"]
}
`;
  }

  private parseEnhancedContent(enhancedText: string, originalContent: any): any {
    // Claudeの応答を解析して構造化
    try {
      // 実際の実装では、より詳細な解析を行う
      return {
        ...originalContent,
        optimizedTitle: this.extractSection(enhancedText, 'タイトル'),
        optimizedPurpose: this.extractSection(enhancedText, '目的'),
        optimizedBackground: this.extractSection(enhancedText, '背景'),
        keyPhrases: this.extractKeyPhrases(enhancedText)
      };
    } catch {
      return originalContent;
    }
  }

  private extractSection(text: string, sectionName: string): string {
    const regex = new RegExp(`${sectionName}[：:]\s*(.+?)(?=\n|$)`, 's');
    const match = text.match(regex);
    return match ? match[1].trim() : '';
  }

  private extractKeyPhrases(text: string): string[] {
    // キーフレーズ抽出ロジック
    const phrases: string[] = [];
    const lines = text.split('\n');
    lines.forEach(line => {
      if (line.includes('キーフレーズ') || line.includes('重要')) {
        phrases.push(line.replace(/[・\-\*]/, '').trim());
      }
    });
    return phrases.slice(0, 5);
  }
}

export default new SubsidyAnalysisEngine();