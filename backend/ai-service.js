/**
 * AI統合サービス - GPT-3.5-turbo（コスト効率重視）
 * 申請書作成・分析・PDF生成支援
 */

const { OpenAI } = require('openai');
// const { emailService } = require('./src/services/emailService');

// OpenAI設定（GPT-3.5-turbo使用）
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-test-key-for-development'
});

// AI使用ログ
const aiUsageLog = [];

// 環境変数チェック強化
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const USE_MOCK = !OPENAI_API_KEY || OPENAI_API_KEY.includes('test') || OPENAI_API_KEY === 'your-api-key-here';

// プロンプトテンプレート
const PROMPTS = {
  businessPlan: `あなたは補助金申請書作成の専門家です。以下の企業情報を基に、効果的な事業計画を作成してください。

企業情報:
- 会社名: {companyName}
- 業界: {industry}
- 従業員数: {employeeCount}
- 事業内容: {businessDescription}
- 申請する補助金: {subsidyType}

以下の観点で事業計画を作成してください:
1. 現状の課題
2. 解決策
3. 期待される効果
4. 実施スケジュール
5. 予算計画

採択されやすい具体的で説得力のある内容で、800-1200文字程度で作成してください。`,

  applicationContent: `補助金申請書の{section}部分を作成してください。

企業情報: {companyInfo}
事業計画: {businessPlan}
補助金タイプ: {subsidyType}

{section}として適切な内容を、採択されやすい観点で400-600文字で作成してください。`,

  approvalPrediction: `以下の申請書内容の採択可能性を分析してください。

申請内容:
{applicationContent}

補助金タイプ: {subsidyType}

以下の観点で100点満点で評価し、改善提案も含めてください:
1. 事業の妥当性 (25点)
2. 実現可能性 (25点) 
3. 効果の明確性 (25点)
4. 予算の妥当性 (25点)

評価結果をJSON形式で返してください:
{
  "totalScore": 点数,
  "breakdown": {
    "feasibility": 点数,
    "viability": 点数,
    "effectiveness": 点数,
    "budget": 点数
  },
  "suggestions": ["改善提案1", "改善提案2", "改善提案3"]
}`
};

/**
 * 基本的なAIリクエスト処理
 */
async function makeAIRequest(prompt, systemMessage = null, maxTokens = 1000) {
  const startTime = Date.now();
  
  if (USE_MOCK) {
    console.log('🔧 モック AI 応答を使用中（開発環境）');
    await new Promise(resolve => setTimeout(resolve, 1500)); // リアルな遅延
    return generateMockResponse(prompt, systemMessage, startTime);
  }

  try {

    const messages = [
      {
        role: 'system',
        content: systemMessage || 'あなたは補助金申請書作成の専門家です。正確で説得力のある内容を作成してください。'
      },
      {
        role: 'user',
        content: prompt
      }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API Error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      content: data.choices[0].message.content,
      usage: data.usage,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error('AI API エラー:', error);
    return generateMockResponse(prompt, systemMessage, startTime);
  }
}

/**
 * 開発環境用モック応答生成
 */
function generateMockResponse(prompt, systemMessage, startTime) {
  const mockResponses = {
    businessPlan: `【事業計画書】

## 1. 現状の課題
当社では従来の手作業による業務プロセスが多く、以下の課題を抱えています：
- 業務効率の低下
- 人的ミスの発生
- 競争力の低下

## 2. 解決策
最新のIT技術を活用したデジタル化により、業務プロセスを自動化し効率化を図ります：
- 業務管理システムの導入
- AI技術の活用
- クラウド基盤の構築

## 3. 期待される効果
- 業務効率 30% 向上
- エラー率 50% 削減
- 売上 20% 増加

## 4. 実施スケジュール
第1段階（1-3ヶ月）：システム設計・開発
第2段階（4-6ヶ月）：導入・テスト
第3段階（7-9ヶ月）：本格運用・効果測定

## 5. 予算計画
総事業費：300万円
- システム開発費：200万円
- 機器購入費：80万円
- 研修費：20万円`,

    applicationContent: `【申請書内容】

本事業は、AI技術を活用した業務効率化システムの導入により、企業の競争力強化と持続的成長を目指すものです。

具体的には、顧客管理・在庫管理・販売管理を統合したクラウドベースのシステムを構築し、データの一元化と業務プロセスの自動化を実現します。

これにより、従来比30%の業務効率向上と、年間売上20%の増加を見込んでおり、地域経済の活性化にも寄与いたします。`,

    approvalPrediction: `{
  "totalScore": 78,
  "breakdown": {
    "feasibility": 82,
    "viability": 75,
    "effectiveness": 80,
    "budget": 76
  },
  "suggestions": [
    "具体的な数値目標をより詳細に記載してください",
    "競合他社との差別化ポイントを明確にしてください", 
    "リスク対策と対応策を追加してください"
  ]
}`
  };

  let content = mockResponses.businessPlan;
  if (prompt.includes('申請書')) content = mockResponses.applicationContent;
  if (prompt.includes('採択可能性')) content = mockResponses.approvalPrediction;
  
  return {
    content,
    usage: { prompt_tokens: 150, completion_tokens: 400, total_tokens: 550 },
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    mock: true
  };
}

/**
 * GPT-3.5-turboのコスト計算（2024年料金）
 */
function calculateCost(usage) {
  const inputCost = (usage.prompt_tokens / 1000) * 0.0015;  // $0.0015/1K tokens
  const outputCost = (usage.completion_tokens / 1000) * 0.002;  // $0.002/1K tokens
  return (inputCost + outputCost).toFixed(6);
}

/**
 * 補助金申請書のビジネスプラン生成
 */
async function generateBusinessPlan(userInput) {
  const systemMessage = `
あなたは補助金申請書作成の専門家です。
以下の要件で効果的なビジネスプランを作成してください：

- 簡潔で説得力がある内容
- 補助金審査員に響く構成
- 具体的な数値目標を含む
- 実現可能性を重視
- 日本語で回答
`;

  const prompt = `
以下の情報を基に、補助金申請用のビジネスプランを作成してください：

## 入力情報
${JSON.stringify(userInput, null, 2)}

## 出力形式
以下のJSONフォーマットで回答してください：

{
  "companyOverview": "会社概要（200文字以内）",
  "projectDescription": "プロジェクト概要（300文字以内）",
  "marketAnalysis": "市場分析（250文字以内）",
  "businessPlan": "事業計画（400文字以内）",
  "expectedOutcomes": "期待効果（200文字以内）",
  "budgetPlan": "予算計画（300文字以内）",
  "implementation": "実施スケジュール（200文字以内）"
}
`;

  const result = await makeAIRequest(prompt, systemMessage, 1500);
  
  if (result.success) {
    try {
      const businessPlan = JSON.parse(result.content);
      return {
        success: true,
        businessPlan,
        usage: result.usage
      };
    } catch (parseError) {
      return {
        success: false,
        error: 'AI応答の解析に失敗しました'
      };
    }
  }
  
  return result;
}

/**
 * 申請書内容の改善提案
 */
async function improvementSuggestions(applicationData) {
  const systemMessage = `
あなたは補助金申請書のレビュー専門家です。
申請書の内容を分析し、改善提案を行ってください。
`;

  const prompt = `
以下の申請書内容を分析し、改善提案をしてください：

${JSON.stringify(applicationData, null, 2)}

以下の観点で評価し、具体的な改善提案をしてください：
1. 明確性・具体性
2. 説得力
3. 実現可能性
4. 革新性
5. 社会的意義

JSON形式で回答してください：
{
  "overallScore": 85,
  "improvements": [
    {
      "section": "セクション名",
      "issue": "問題点",
      "suggestion": "改善提案"
    }
  ],
  "strengths": ["強み1", "強み2"],
  "summary": "総合評価とコメント"
}
`;

  return await makeAIRequest(prompt, systemMessage, 1200);
}

/**
 * 補助金プログラム推奨
 */
async function recommendSubsidyPrograms(companyProfile) {
  const systemMessage = `
あなたは補助金制度の専門家です。
企業情報を基に最適な補助金プログラムを推奨してください。
`;

  const prompt = `
以下の企業情報に基づき、適切な補助金プログラムを推奨してください：

${JSON.stringify(companyProfile, null, 2)}

JSON形式で回答してください：
{
  "recommendations": [
    {
      "programName": "補助金名",
      "matchScore": 85,
      "reason": "推奨理由",
      "maxAmount": "最大支給額",
      "deadline": "申請期限",
      "requirements": ["要件1", "要件2"]
    }
  ]
}
`;

  return await makeAIRequest(prompt, systemMessage, 1000);
}

/**
 * AI使用統計取得
 */
function getAIUsageStats() {
  const totalRequests = aiUsageLog.length;
  const totalTokens = aiUsageLog.reduce((sum, log) => sum + log.totalTokens, 0);
  const totalCost = aiUsageLog.reduce((sum, log) => sum + parseFloat(log.cost), 0);
  const avgResponseTime = aiUsageLog.reduce((sum, log) => sum + log.responseTime, 0) / totalRequests;

  return {
    totalRequests,
    totalTokens,
    totalCost: totalCost.toFixed(6),
    avgResponseTime: Math.round(avgResponseTime),
    recentUsage: aiUsageLog.slice(-10),
    costPerRequest: totalRequests > 0 ? (totalCost / totalRequests).toFixed(6) : '0.000000'
  };
}

module.exports = {
  generateBusinessPlan,
  improvementSuggestions,
  recommendSubsidyPrograms,
  getAIUsageStats,
  makeAIRequest
};