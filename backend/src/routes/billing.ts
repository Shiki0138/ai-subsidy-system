/**
 * 決済・課金APIエンドポイント
 * 
 * チームA担当: ユーザーファーストな決済体験を提供
 */

import express, { Request, Response } from 'express';
import { body, param, query, validationResult } from 'express-validator';
import Stripe from 'stripe';
import { authenticate, AuthenticatedRequest } from '../middleware/authenticate';
import { conditionalAuth } from '../middleware/devAuthBypass';
import stripeService, { 
  PricingPlan, 
  PRICING_CONFIG,
  PAYMENT_ERROR_MESSAGES 
} from '../services/stripeService';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

/**
 * 価格情報の取得
 * 透明性を重視したユーザーフレンドリーな価格表示
 */
router.get('/pricing', async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id; // ログイン状態を確認
    let suggestedPlan: any = null;
    
    // ログインユーザーの場合は最適なプランを提案
    if (userId) {
      suggestedPlan = await stripeService.suggestOptimalPlan(userId);
    }
    
    // ユーザーに分かりやすい価格情報を返す
    const pricingInfo = Object.entries(PRICING_CONFIG).map(([key, config]) => ({
      planId: key,
      name: config.name,
      description: config.description,
      amount: config.amount,
      currency: config.currency,
      isRecommended: suggestedPlan?.plan === key,
      savings: key === suggestedPlan?.plan ? suggestedPlan.savings : undefined,
      reason: key === suggestedPlan?.plan ? suggestedPlan.reason : undefined,
      // 価格の透明性を確保
      priceBreakdown: {
        basePrice: config.amount,
        taxes: 0, // 現在は税込み価格
        fees: 0,  // 隠れた手数料なし
        total: config.amount
      },
      features: getPlanFeatures(key as PricingPlan),
      metadata: config.metadata
    }));
    
    res.json({
      success: true,
      data: {
        pricing: pricingInfo,
        suggestedPlan,
        guarantees: [
          '24時間以内の無条件キャンセル可能',
          '品質保証付き（プレビュー機能）',
          '隠れた費用一切なし',
          'SSL暗号化による安全な決済'
        ]
      }
    });
    
  } catch (error) {
    logger.error('価格情報取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'price_fetch_failed',
      message: '価格情報の取得に失敗しました。しばらく時間をおいて再度お試しください。'
    });
  }
});

/**
 * PDF購入のCheckout Session作成
 * シンプルで分かりやすい決済フロー
 */
router.post('/checkout/pdf',
  conditionalAuth(authenticate),
  [
    body('pdf_id').notEmpty().withMessage('PDF IDが必要です'),
    body('plan').isIn(Object.keys(PRICING_CONFIG)).withMessage('有効なプランを選択してください'),
    body('promotion_code').optional().isString(),
    body('success_url').isURL().withMessage('有効な成功時URLが必要です'),
    body('cancel_url').isURL().withMessage('有効なキャンセル時URLが必要です')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'validation_failed',
          message: '入力内容に問題があります',
          details: errors.array()
        });
      }
      
      const { pdf_id, plan, promotion_code, success_url, cancel_url } = req.body;
      const userId = req.user.id;
      
      // 重複決済の防止
      const existingSession = await prisma.paymentSession.findFirst({
        where: {
          userId,
          pdfId: pdf_id,
          status: 'PENDING',
          expiresAt: {
            gt: new Date()
          }
        }
      });
      
      if (existingSession) {
        return res.json({
          success: true,
          data: {
            sessionId: existingSession.sessionId,
            url: `https://checkout.stripe.com/pay/${existingSession.sessionId}`,
            amount: existingSession.amount,
            expiresAt: existingSession.expiresAt,
            message: '既存の決済セッションがあります'
          }
        });
      }
      
      // Checkout Session作成
      const checkoutData = await stripeService.createCheckoutSession({
        userId,
        pdfId: pdf_id,
        plan: plan as PricingPlan,
        promotionCode: promotion_code,
        successUrl: success_url,
        cancelUrl: cancel_url
      });
      
      // 成功レスポンス（ユーザーフレンドリー）
      res.json({
        success: true,
        data: {
          ...checkoutData,
          message: '決済ページを準備しました',
          nextSteps: [
            '安全な決済ページに移動します',
            '24時間以内であればキャンセル可能です',
            '決済完了後、すぐにPDFをダウンロードできます'
          ]
        }
      });
      
    } catch (error) {
      logger.error('Checkout Session作成エラー:', error);
      res.status(500).json({
        success: false,
        error: 'checkout_creation_failed',
        message: '決済ページの準備に失敗しました。しばらく時間をおいて再度お試しください。',
        supportContact: 'お困りの場合はサポートまでお問い合わせください'
      });
    }
  }
);

/**
 * 決済状況の確認
 * リアルタイムでユーザーに状況を伝える
 */
router.get('/status/:sessionId',
  conditionalAuth(authenticate),
  [param('sessionId').notEmpty().withMessage('セッションIDが必要です')],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { sessionId } = req.params;
      const userId = req.user.id;
      
      const paymentSession = await prisma.paymentSession.findFirst({
        where: {
          sessionId,
          userId
        }
      });
      
      if (!paymentSession) {
        return res.status(404).json({
          success: false,
          error: 'session_not_found',
          message: '決済セッションが見つかりません'
        });
      }
      
      let stripeSession;
      try {
        stripeSession = await stripe.checkout.sessions.retrieve(sessionId);
      } catch (stripeError) {
        logger.warn('Stripe Session取得エラー:', stripeError);
      }
      
      // ユーザーフレンドリーなステータス情報
      const statusInfo = {
        status: paymentSession.status,
        amount: paymentSession.amount,
        plan: paymentSession.plan,
        createdAt: paymentSession.createdAt,
        expiresAt: paymentSession.expiresAt,
        completedAt: paymentSession.completedAt,
        canCancel: paymentSession.status === 'COMPLETED' && 
                   paymentSession.completedAt &&
                   (Date.now() - paymentSession.completedAt.getTime()) < 24 * 60 * 60 * 1000
      };
      
      const userMessage = getStatusMessage(paymentSession.status);
      
      res.json({
        success: true,
        data: {
          ...statusInfo,
          message: userMessage.message,
          nextSteps: userMessage.nextSteps,
          stripeStatus: stripeSession?.payment_status
        }
      });
      
    } catch (error) {
      logger.error('決済状況確認エラー:', error);
      res.status(500).json({
        success: false,
        error: 'status_check_failed',
        message: '決済状況の確認に失敗しました'
      });
    }
  }
);

/**
 * 24時間キャンセル機能
 * ユーザー保護のための重要機能
 */
router.post('/cancel/:sessionId',
  conditionalAuth(authenticate),
  [
    param('sessionId').notEmpty().withMessage('セッションIDが必要です'),
    body('reason').notEmpty().withMessage('キャンセル理由を入力してください')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          error: 'validation_failed',
          message: 'キャンセル理由を入力してください',
          details: errors.array()
        });
      }
      
      const { sessionId } = req.params;
      const { reason } = req.body;
      const userId = req.user.id;
      
      const result = await stripeService.requestCancellation({
        sessionId,
        userId,
        reason
      });
      
      if (result.success) {
        res.json({
          success: true,
          data: {
            refundId: result.refundId,
            message: result.message,
            timeline: [
              '返金処理を開始しました',
              '通常5-10営業日以内にご返金',
              'メールで返金完了をお知らせします'
            ]
          }
        });
      } else {
        res.status(400).json({
          success: false,
          error: 'cancellation_failed',
          message: result.message,
          supportContact: 'カスタマーサポートまでお問い合わせください'
        });
      }
      
    } catch (error) {
      logger.error('キャンセル処理エラー:', error);
      res.status(500).json({
        success: false,
        error: 'cancellation_error',
        message: 'キャンセル処理中にエラーが発生しました。カスタマーサポートまでお問い合わせください。'
      });
    }
  }
);

/**
 * Stripe Webhook エンドポイント
 * セキュアなWebhook処理
 */
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req: Request, res: Response) => {
    const sig = req.headers['stripe-signature'] as string;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;
    
    let event: Stripe.Event;
    
    try {
      // Webhook署名の検証
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err: any) {
      logger.error('Webhook署名検証失敗:', err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
      // イベント処理
      switch (event.type) {
        case 'checkout.session.completed':
          const session = event.data.object as Stripe.Checkout.Session;
          await stripeService.handlePaymentSuccess(session.id);
          logger.info('決済完了Webhook処理成功:', { sessionId: session.id });
          break;
          
        case 'payment_intent.payment_failed':
          const failedPayment = event.data.object as Stripe.PaymentIntent;
          await handlePaymentFailure(failedPayment);
          logger.info('決済失敗Webhook処理成功:', { paymentIntentId: failedPayment.id });
          break;
          
        case 'invoice.payment_succeeded':
          const invoice = event.data.object as Stripe.Invoice;
          await handleSubscriptionPayment(invoice);
          logger.info('サブスクリプション決済成功:', { invoiceId: invoice.id });
          break;
          
        default:
          logger.info('未対応Webhookイベント:', { type: event.type });
      }
      
      res.json({ received: true });
      
    } catch (error) {
      logger.error('Webhook処理エラー:', error);
      res.status(500).json({ error: 'webhook_processing_failed' });
    }
  }
);

/**
 * ユーザーの決済履歴取得
 * 透明性のある履歴表示
 */
router.get('/history',
  conditionalAuth(authenticate),
  [
    query('page').optional().isInt({ min: 1 }).withMessage('ページ番号は1以上の整数です'),
    query('limit').optional().isInt({ min: 1, max: 50 }).withMessage('表示件数は1-50の範囲です')
  ],
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const skip = (page - 1) * limit;
      const userId = req.user.id;
      
      const [history, total] = await Promise.all([
        prisma.billingHistory.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.billingHistory.count({
          where: { userId }
        })
      ]);
      
      const formattedHistory = history.map(item => ({
        id: item.id,
        type: item.type,
        amount: item.amount,
        description: item.description,
        date: item.createdAt,
        status: getTransactionStatus(item),
        // 透明性のための詳細情報
        details: {
          sessionId: item.sessionId,
          subscriptionId: item.subscriptionId,
          refundId: item.refundId
        }
      }));
      
      res.json({
        success: true,
        data: {
          history: formattedHistory,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
            hasNext: skip + limit < total,
            hasPrev: page > 1
          }
        }
      });
      
    } catch (error) {
      logger.error('決済履歴取得エラー:', error);
      res.status(500).json({
        success: false,
        error: 'history_fetch_failed',
        message: '決済履歴の取得に失敗しました'
      });
    }
  }
);

// ===== ヘルパー関数 =====

function getPlanFeatures(plan: PricingPlan): string[] {
  const features: Record<PricingPlan, string[]> = {
    first_time: [
      '初回限定50%オフ',
      '高品質PDF生成',
      '24時間キャンセル可能',
      '最大3回ダウンロード'
    ],
    regular: [
      '高品質PDF生成',
      '24時間キャンセル可能',
      '最大3回ダウンロード',
      'メールサポート'
    ],
    bulk_3: [
      '3回分まとめて購入',
      '2,140円お得',
      '有効期限90日',
      'メールサポート'
    ],
    bulk_5: [
      '5回分まとめて購入',
      '5,100円お得',
      '有効期限90日',
      'メールサポート'
    ],
    subscription_growth: [
      '月間3回まで利用',
      'プレミアムサポート',
      '優先処理',
      '月額固定で安心'
    ],
    subscription_scale: [
      '月間10回まで利用',
      '優先サポート',
      'API アクセス',
      '企業向け機能'
    ]
  };
  
  return features[plan] || [];
}

function getStatusMessage(status: string): { message: string; nextSteps: string[] } {
  const messages = {
    PENDING: {
      message: '決済処理中です',
      nextSteps: ['決済ページで手続きを完了してください', '30分以内に完了する必要があります']
    },
    COMPLETED: {
      message: '決済が完了しました',
      nextSteps: ['PDFのダウンロードが可能です', '24時間以内であればキャンセル可能です']
    },
    FAILED: {
      message: '決済に失敗しました',
      nextSteps: ['別のカードをお試しください', 'サポートまでお問い合わせください']
    },
    EXPIRED: {
      message: '決済セッションが期限切れです',
      nextSteps: ['新しい決済セッションを作成してください']
    },
    CANCELED: {
      message: '決済がキャンセルされました',
      nextSteps: ['必要に応じて再度お試しください']
    }
  };
  
  return messages[status as keyof typeof messages] || {
    message: '状況を確認中です',
    nextSteps: ['しばらくお待ちください']
  };
}

function getTransactionStatus(item: any): string {
  // 取引状況の判定ロジック
  if (item.type === 'PAYMENT') return 'completed';
  if (item.type === 'REFUND') return 'refunded';
  if (item.type === 'SUBSCRIPTION') return 'active';
  return 'unknown';
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  try {
    const sessionId = paymentIntent.metadata?.session_id;
    if (sessionId) {
      await prisma.paymentSession.update({
        where: { sessionId },
        data: { 
          status: 'FAILED',
          metadata: {
            failure_reason: paymentIntent.last_payment_error?.message,
            failure_code: paymentIntent.last_payment_error?.code
          }
        }
      });
    }
  } catch (error) {
    logger.error('決済失敗処理エラー:', error);
  }
}

async function handleSubscriptionPayment(invoice: Stripe.Invoice): Promise<void> {
  try {
    // サブスクリプション決済成功処理
    const subscriptionId = invoice.subscription as string;
    
    await prisma.subscriptionPlan.update({
      where: { stripeSubscriptionId: subscriptionId },
      data: { 
        usageCount: 0, // 月次利用回数リセット
        currentPeriodStart: new Date(invoice.period_start * 1000),
        currentPeriodEnd: new Date(invoice.period_end * 1000)
      }
    });
    
    // 請求履歴に記録
    const subscription = await prisma.subscriptionPlan.findUnique({
      where: { stripeSubscriptionId: subscriptionId }
    });
    
    if (subscription) {
      await prisma.billingHistory.create({
        data: {
          userId: subscription.userId,
          type: 'SUBSCRIPTION',
          amount: invoice.amount_paid,
          description: `${subscription.planType}プラン 月額料金`,
          subscriptionId,
          stripeInvoiceId: invoice.id
        }
      });
    }
  } catch (error) {
    logger.error('サブスクリプション決済処理エラー:', error);
  }
}

export default router;