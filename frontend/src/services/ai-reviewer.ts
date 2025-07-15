import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIReviewResult, WeakPoint, Suggestion } from '@/types/success-patterns';
import { SUCCESS_PATTERNS, REVIEWER_POINTS } from '@/data/gyomu-kaizen-success-patterns';

export class AIReviewer {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  }

  async reviewApplication(applicationData: any): Promise<AIReviewResult> {
    try {
      const prompt = this.createReviewPrompt(applicationData);
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      return this.parseReviewResult(text, applicationData);
    } catch (error) {
      console.error('AI審査エラー:', error);
      throw error;
    }
  }

  private createReviewPrompt(data: any): string {
    const reviewPoints = REVIEWER_POINTS;
    
    return `
業務改善助成金の申請書を審査してください。以下の観点から評価し、JSONフォーマットで結果を返してください。

【申請内容】
事業者名: ${data.companyName}
業種: ${data.industry}
従業員数: ${data.employeeCount}
現在の最低賃金: ${data.currentMinimumWage}円
引上げ後の賃金: ${data.targetWage}円
生産性向上計画: ${data.productivityPlan}
導入設備: ${data.equipment}
所要経費: ${data.totalCost}円

【審査基準】
${Object.entries(reviewPoints).map(([key, point]) => 
  `- ${point.label}: ${point.checkPoints.join('、')}`
).join('\n')}

【採択成功パターン】
${SUCCESS_PATTERNS.map(pattern => 
  `- ${pattern.industry}: ${pattern.description}`
).join('\n')}

【要求フォーマット】
{
  "overallScore": 0-100の数値,
  "sectionScores": {
    "necessity": 0-100,
    "feasibility": 0-100,
    "effectiveness": 0-100,
    "sustainability": 0-100
  },
  "weakPoints": [
    {
      "section": "セクション名",
      "issue": "問題点",
      "severity": "high/medium/low",
      "impact": "採択への影響"
    }
  ],
  "suggestions": [
    {
      "section": "セクション名",
      "currentContent": "現在の内容",
      "suggestedContent": "改善案",
      "reason": "改善理由"
    }
  ],
  "strongPoints": ["強み1", "強み2"],
  "recommendation": "採択可能性（高/中/低）と理由"
}
`;
  }

  private parseReviewResult(text: string, applicationData: any): AIReviewResult {
    try {
      // JSONを抽出
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('JSON形式の結果が見つかりません');
      }
      
      const parsed = JSON.parse(jsonMatch[0]);
      
      return {
        applicationId: `review-${Date.now()}`,
        overallScore: parsed.overallScore || 0,
        sectionScores: {
          necessity: parsed.sectionScores?.necessity || 0,
          feasibility: parsed.sectionScores?.feasibility || 0,
          effectiveness: parsed.sectionScores?.effectiveness || 0,
          sustainability: parsed.sectionScores?.sustainability || 0
        },
        weakPoints: parsed.weakPoints || [],
        suggestions: parsed.suggestions || [],
        reviewDate: new Date().toISOString(),
        reviewerComments: parsed.recommendation || '',
        improvementPotential: this.calculateImprovementPotential(parsed)
      };
    } catch (error) {
      console.error('結果パースエラー:', error);
      // デフォルト結果を返す
      return this.getDefaultReviewResult();
    }
  }

  private calculateImprovementPotential(parsed: any): number {
    const currentScore = parsed.overallScore || 0;
    const suggestionCount = parsed.suggestions?.length || 0;
    const highSeverityCount = parsed.weakPoints?.filter((w: any) => w.severity === 'high').length || 0;
    
    // 改善可能性を計算（現在のスコアが低く、改善提案が多いほど高い）
    const potential = Math.min(100, (100 - currentScore) * 0.6 + suggestionCount * 10 - highSeverityCount * 5);
    return Math.max(0, potential);
  }

  private getDefaultReviewResult(): AIReviewResult {
    return {
      applicationId: `review-${Date.now()}`,
      overallScore: 50,
      sectionScores: {
        necessity: 50,
        feasibility: 50,
        effectiveness: 50,
        sustainability: 50
      },
      weakPoints: [],
      suggestions: [],
      reviewDate: new Date().toISOString(),
      reviewerComments: '審査を完了できませんでした',
      improvementPotential: 50
    };
  }

  async generateImprovedContent(
    section: string, 
    currentContent: string, 
    suggestions: Suggestion[]
  ): Promise<string> {
    const relevantSuggestions = suggestions.filter(s => s.section === section);
    
    if (relevantSuggestions.length === 0) {
      return currentContent;
    }
    
    const prompt = `
以下の内容を改善してください：

【現在の内容】
${currentContent}

【改善提案】
${relevantSuggestions.map(s => `- ${s.reason}: ${s.suggestedContent}`).join('\n')}

【要求】
- 具体的で説得力のある内容に改善
- 数値や具体例を含める
- 審査員が評価しやすい構成にする
- 日本語で回答
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('内容改善エラー:', error);
      return currentContent;
    }
  }

  async compareWithSuccessPatterns(applicationData: any): Promise<{
    matchingPattern: any;
    matchScore: number;
    recommendations: string[];
  }> {
    const industryPattern = SUCCESS_PATTERNS.find(p => p.industry === applicationData.industry);
    
    if (!industryPattern) {
      return {
        matchingPattern: null,
        matchScore: 0,
        recommendations: ['業界別の成功パターンが見つかりません']
      };
    }
    
    const prompt = `
以下の申請内容が成功パターンとどの程度一致するか評価してください：

【申請内容】
${JSON.stringify(applicationData, null, 2)}

【成功パターン】
${JSON.stringify(industryPattern, null, 2)}

【評価項目】
1. 設備投資の適合性
2. 生産性向上指標の妥当性
3. 賃金戦略の一致度
4. 全体的な説得力

0-100のスコアと改善推奨事項をJSON形式で返してください。
`;

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return {
          matchingPattern: industryPattern,
          matchScore: parsed.score || 0,
          recommendations: parsed.recommendations || []
        };
      }
    } catch (error) {
      console.error('パターン比較エラー:', error);
    }
    
    return {
      matchingPattern: industryPattern,
      matchScore: 50,
      recommendations: ['成功パターンとの比較分析を実行できませんでした']
    };
  }
}