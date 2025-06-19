/**
 * AI文章生成API ルート
 */

import express from 'express';
import { Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import aiTextGenerationService from '../services/aiTextGenerationService';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
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
    const { prompt, fieldType, tone, length, maxLength } = req.body;

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
    const validFieldTypes = ['business_description', 'project_summary', 'objectives', 'background', 'general'];
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

    // AI文章生成サービスの呼び出し
    const result = await aiTextGenerationService.generateText({
      prompt: prompt.trim(),
      fieldType: fieldType || 'general',
      tone: tone || 'professional',
      length: length || 'medium',
      maxLength: maxLength || 500
    });

    // 生成結果のログ
    if (result.success) {
      logger.info('AI文章生成成功', {
        userId: req.user.id,
        provider: result.provider,
        textLength: result.generatedText?.length,
        usage: result.usage
      });
    } else {
      logger.warn('AI文章生成失敗', {
        userId: req.user.id,
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

export default router;