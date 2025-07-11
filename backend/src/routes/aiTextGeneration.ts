/**
 * AI文章生成API ルート
 */

import express from 'express';
import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import aiTextGenerationService from '../services/aiTextGenerationService';
import { devAuthBypass as authenticate, AuthenticatedRequest } from '../middleware/auth';
import logger from '../config/logger';

const router = express.Router();

// AI文章生成専用のレート制限（より厳しく設定）
const aiGenerationRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分
  max: 20, // 15分間に最大20回
  message: {
    error: 'AI文章生成の利用回数が上限に達しました。しばらく時間をおいてから再度お試しください。',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * POST /api/ai/generate-text
 * AI文章生成エンドポイント
 */
router.post('/generate-text', aiGenerationRateLimit, authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { prompt, fieldType, tone, length, maxLength, maxTokens, temperature } = req.body;

    // バリデーション
    if (!prompt || typeof prompt !== 'string' || prompt.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: '要点・キーワードを入力してください'
      });
    }

    if (prompt.length > 1000) {
      return res.status(400).json({
        success: false,
        error: '入力内容が長すぎます（最大1000文字）'
      });
    }

    // フィールドタイプのバリデーション
    const validFieldTypes = ['business_plan', 'market_analysis', 'financial_plan', 'risk_assessment', 'implementation_plan', 'general'];
    if (fieldType && !validFieldTypes.includes(fieldType)) {
      return res.status(400).json({
        success: false,
        error: '無効なフィールドタイプです'
      });
    }

    // トーンのバリデーション
    const validTones = ['formal', 'casual', 'professional'];
    if (tone && !validTones.includes(tone)) {
      return res.status(400).json({
        success: false,
        error: '無効な文体です'
      });
    }

    // 長さのバリデーション
    const validLengths = ['short', 'medium', 'long'];
    if (length && !validLengths.includes(length)) {
      return res.status(400).json({
        success: false,
        error: '無効な文章長指定です'
      });
    }

    // 文字数制限のバリデーション
    if (maxLength && (typeof maxLength !== 'number' || maxLength < 50 || maxLength > 2000)) {
      return res.status(400).json({
        success: false,
        error: '文字数制限は50-2000文字の範囲で指定してください'
      });
    }

    // リクエストログ
    logger.info('AI文章生成リクエスト', {
      userId: req.user.id,
      fieldType: fieldType || 'general',
      tone: tone || 'professional',
      length: length || 'medium',
      promptLength: prompt.length
    });

    // AI文章生成サービスの呼び出し（モック実装）
    const result = await generateMockText({
      prompt: prompt.trim(),
      fieldType: fieldType || 'general',
      tone: tone || 'professional',
      length: length || 'medium',
      maxLength: maxLength || 500,
      maxTokens: maxTokens || 800,
      temperature: temperature || 0.7
    });

    // 生成結果のログ
    if (result.success) {
      logger.info('AI文章生成成功', {
        userId: req.user?.id || 'dev-user',
        provider: result.provider,
        textLength: result.text?.length || result.generated_text?.length,
        usage: result.usage
      });
    } else {
      logger.warn('AI文章生成失敗', {
        userId: req.user?.id || 'dev-user',
        error: result.error
      });
    }

    res.json(result);

  } catch (error) {
    logger.error('AI文章生成エンドポイントエラー', {
      userId: req.user?.id,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      error: 'サーバーエラーが発生しました。しばらく時間をおいてから再度お試しください。'
    });
  }
});

/**
 * GET /api/ai/usage-stats
 * ユーザーのAI使用統計取得
 */
router.get('/usage-stats', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    // 使用統計の取得ロジック（実装例）
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    // 今月の使用回数を取得（実際にはデータベースから取得）
    const monthlyUsage = {
      generationCount: 0, // 今月の生成回数
      tokenUsage: 0,      // 今月のトークン使用量
      costUsage: 0        // 今月のコスト
    };

    // レート制限情報
    const rateLimitInfo = {
      remaining: 20, // 残り回数
      resetTime: Date.now() + (15 * 60 * 1000) // リセット時刻
    };

    res.json({
      success: true,
      data: {
        monthly: monthlyUsage,
        rateLimit: rateLimitInfo
      }
    });

  } catch (error) {
    logger.error('AI使用統計取得エラー', {
      userId: req.user.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'データの取得に失敗しました'
    });
  }
});

/**
 * POST /api/ai/feedback
 * 生成結果のフィードバック送信
 */
router.post('/feedback', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { generatedText, originalPrompt, rating, feedback, fieldType } = req.body;

    // バリデーション
    if (!generatedText || !originalPrompt || typeof rating !== 'number') {
      return res.status(400).json({
        success: false,
        error: '必要な情報が不足しています'
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        error: '評価は1-5の範囲で入力してください'
      });
    }

    // フィードバックログの記録
    logger.info('AI文章生成フィードバック', {
      userId: req.user.id,
      fieldType,
      rating,
      feedback: feedback || null,
      generatedTextLength: generatedText.length,
      originalPromptLength: originalPrompt.length
    });

    // 実際の実装では、フィードバックをデータベースに保存し、
    // AI モデルの改善に活用する

    res.json({
      success: true,
      message: 'フィードバックを送信しました。ありがとうございます。'
    });

  } catch (error) {
    logger.error('フィードバック送信エラー', {
      userId: req.user.id,
      error: error.message
    });

    res.status(500).json({
      success: false,
      error: 'フィードバックの送信に失敗しました'
    });
  }
});

// モック文章生成関数
async function generateMockText(params: any) {
  const { prompt, fieldType, maxLength } = params;
  
  // 事業再構築補助金に特化したモック文章生成
  const templates = {
    business_plan: `【事業計画】\n\n${prompt}について、以下の計画で推進いたします。\n\n■事業の背景と必要性\n当社では、市場環境の変化に対応するため、${prompt}を核とした新たな事業展開を図ります。従来の事業基盤を活かしながら、デジタル技術を活用した革新的なサービスを提供することで、持続的な成長を実現いたします。\n\n■具体的な事業内容\n${prompt}を活用した新規事業では、顧客の多様なニーズに対応できる高付加価値サービスの提供を行います。特に、効率化とコスト削減を両立させた事業モデルを構築し、競合他社との差別化を図ります。\n\n■期待される効果\n本事業により、3年後には売上高30%増、営業利益率15%向上を目指します。また、新規雇用創出と地域経済活性化にも貢献いたします。`,
    
    market_analysis: `【市場分析】\n\n${prompt}に関する市場について、以下の通り分析いたします。\n\n■市場規模と成長性\n対象市場は年々拡大傾向にあり、今後5年間で約20%の成長が見込まれています。特に${prompt}の分野では、デジタル化の進展により高い成長ポテンシャルを有しています。\n\n■顧客ニーズと市場機会\n市場調査の結果、${prompt}に対する強いニーズが確認されました。既存サービスでは満たされていない潜在的な需要が存在し、大きな市場機会となっています。\n\n■競合状況\n現在の競合他社は限定的で、当社が計画するサービスレベルでの直接的な競合は少ない状況です。技術力と顧客対応力により、明確な優位性を確保できます。`,
    
    financial_plan: `【財務計画】\n\n${prompt}に関する財務計画を以下の通り策定いたします。\n\n■投資計画\n総投資額○○万円のうち、設備投資○○万円、システム投資○○万円を予定しています。${prompt}に必要な専門設備の導入により、効率的な事業運営を実現します。\n\n■収益予測\n1年目：売上○○万円、利益率○%\n2年目：売上○○万円、利益率○%\n3年目：売上○○万円、利益率○%\n\n■資金調達\n補助金○○万円、自己資金○○万円、金融機関借入○○万円により、安定的な事業基盤を構築します。`,
    
    risk_assessment: `【リスク評価と対策】\n\n${prompt}の実施において想定されるリスクと対策について以下の通り分析いたします。\n\n■想定されるリスク\n1. 市場環境の変化リスク\n2. 技術的な課題\n3. 人材確保の困難\n4. 競合他社の参入\n\n■対策と軽減方法\n各リスクに対して、事前の市場調査、技術者研修の実施、採用戦略の見直し、独自性の強化等により、リスクの最小化を図ります。\n\n■代替案\n主要リスクが顕在化した場合の代替計画も準備し、事業継続性を確保いたします。`,
    
    implementation_plan: `【実施計画】\n\n${prompt}の実施について、以下のスケジュールで進行いたします。\n\n■実施スケジュール\n第1段階（1-3ヶ月）：基盤整備・人材確保\n第2段階（4-8ヶ月）：システム構築・試験運用\n第3段階（9-12ヶ月）：本格運用・効果測定\n\n■実施体制\n専任プロジェクトチーム○名を編成し、各段階での進捗管理と品質確保を徹底いたします。\n\n■成功要因\n${prompt}の成功には、社内の協力体制、外部パートナーとの連携、継続的な改善活動が重要です。`
  };
  
  let generatedText = templates[fieldType] || `${prompt}について、事業再構築補助金の審査基準を満たす詳細な説明を以下に記載いたします。\n\n当社では、${prompt}を通じて事業の抜本的な見直しと新たな価値創造に取り組みます。具体的には、市場ニーズの変化に対応した革新的な取り組みを実施し、持続的な成長を実現いたします。\n\nこの取り組みにより、売上の回復と更なる成長を実現し、雇用の維持・拡大にも貢献いたします。`;
  
  // 文字数制限に合わせて調整
  if (maxLength && generatedText.length > maxLength) {
    generatedText = generatedText.substring(0, maxLength - 3) + '...';
  }
  
  return {
    success: true,
    text: generatedText,
    generated_text: generatedText,
    provider: 'mock',
    usage: {
      tokens: Math.floor(generatedText.length / 2),
      cost: 0.01
    }
  };
}

export default router;