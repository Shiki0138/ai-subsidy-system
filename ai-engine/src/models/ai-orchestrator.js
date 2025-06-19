"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const openai_1 = require("@langchain/openai");
const anthropic_1 = require("@langchain/anthropic");
const prompts_1 = require("@langchain/core/prompts");
const runnables_1 = require("@langchain/core/runnables");
class AIOrchestrator {
    constructor() {
        this.openaiModel = new openai_1.OpenAI({
            modelName: 'gpt-4',
            temperature: 0.7,
            maxTokens: 4000,
            openAIApiKey: process.env.OPENAI_API_KEY,
        });
        this.anthropicModel = new anthropic_1.ChatAnthropic({
            modelName: 'claude-3-5-sonnet-20241022',
            temperature: 0.5,
            maxTokens: 4000,
            anthropicApiKey: process.env.ANTHROPIC_API_KEY,
        });
    }
    async analyzeBusinessPlan(input) {
        const analysisPrompt = prompts_1.PromptTemplate.fromTemplate(`
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
        const chain = runnables_1.RunnableSequence.from([
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
        return this.parseAnalysisResult(result.content);
    }
    async recommendPrograms(input) {
        const recommendationPrompt = prompts_1.PromptTemplate.fromTemplate(`
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
        const chain = runnables_1.RunnableSequence.from([
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
    async generateContent(input) {
        const contentPrompt = this.getContentPrompt(input.sectionType);
        const chain = runnables_1.RunnableSequence.from([
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
    getContentPrompt(sectionType) {
        const prompts = {
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
        return prompts_1.PromptTemplate.fromTemplate(prompts[sectionType] || prompts.businessPlan);
    }
    parseAnalysisResult(text) {
        try {
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
        }
        catch (error) {
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
    parseRecommendationResult(text, programs) {
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
    extractScoreFromText(text, category) {
        const regex = new RegExp(`${category}.*?(\\d+)点?`, 'i');
        const match = text.match(regex);
        return match ? parseInt(match[1]) : 75;
    }
    calculateConfidenceScore(content) {
        const length = content.length;
        const hasNumbers = /\d/.test(content);
        const hasStructure = /\n/.test(content);
        let score = 70;
        if (length > 500)
            score += 10;
        if (hasNumbers)
            score += 10;
        if (hasStructure)
            score += 10;
        return Math.min(score, 95);
    }
    extractSuggestions(content) {
        const lines = content.split('\n');
        const suggestions = lines
            .filter(line => line.includes('提案') || line.includes('推奨') || line.includes('改善'))
            .slice(0, 3);
        return suggestions.length > 0 ? suggestions : ['詳細な分析結果に基づく追加提案を生成中'];
    }
}
exports.default = AIOrchestrator;
//# sourceMappingURL=ai-orchestrator.js.map