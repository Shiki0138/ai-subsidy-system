/**
 * Stripe統合サービス
 * 
 * チームA担当: 決済・課金基盤
 * ユーザーファースト原則に基づく設計
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

// Stripe設定
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
  typescript: true,
});

const prisma = new PrismaClient();

// 価格体系（ユーザーに優しい価格設定）
export const PRICING_CONFIG = {
  first_time: {
    amount: 1980, // ¥1,980 初回限定50%オフ
    name: 'PDF申請書作成（初回限定）',
    description: '初回限定50%オフ！お試し価格でご利用いただけます',
    currency: 'jpy',
    metadata: {
      type: 'first_time_discount',
      regular_price: '3980',
      discount_percentage: '50'
    }
  },
  regular: {
    amount: 3980, // ¥3,980 通常価格
    name: 'PDF申請書作成（通常価格）',
    description: 'AI技術による高品質な申請書を即座に生成',
    currency: 'jpy',
    metadata: {
      type: 'regular'
    }
  },
  bulk_3: {
    amount: 9800, // ¥9,800 3回分パック
    name: 'PDF申請書作成（3回パック）',
    description: '3回分パック - 2,140円お得！',
    currency: 'jpy',
    metadata: {
      type: 'bulk',
      quantity: '3',
      unit_price: '3267',
      savings: '2140'
    }
  },
  bulk_5: {
    amount: 14800, // ¥14,800 5回分パック
    name: 'PDF申請書作成（5回パック）',
    description: '5回分パック - 5,100円お得！',
    currency: 'jpy',
    metadata: {
      type: 'bulk',
      quantity: '5',
      unit_price: '2960',
      savings: '5100'
    }
  },
  subscription_growth: {
    amount: 9800, // ¥9,800/月
    name: 'Growth プラン',
    description: '月間3回まで利用可能 + プレミアムサポート',
    currency: 'jpy',
    recurring: {
      interval: 'month' as const
    },
    metadata: {
      type: 'subscription',
      plan: 'growth',
      usage_limit: '3'
    }
  },
  subscription_scale: {
    amount: 29800, // ¥29,800/月
    name: 'Scale プラン',
    description: '月間10回まで利用可能 + 優先サポート + API アクセス',
    currency: 'jpy',
    recurring: {
      interval: 'month' as const
    },
    metadata: {
      type: 'subscription',
      plan: 'scale',
      usage_limit: '10'
    }
  }
} as const;

export type PricingPlan = keyof typeof PRICING_CONFIG;

/**
 * ユーザーが初回利用者かどうかを判定
 */
export async function isFirstTimeUser(userId: string): Promise<boolean> {
  try {
    const existingPurchase = await prisma.paymentSession.findFirst({
      where: {
        userId,
        status: 'completed'
      }
    });
    
    return !existingPurchase;
  } catch (error) {
    logger.error('初回ユーザー判定エラー:', error);
    // エラー時は初回として扱わない（安全側に倒す）
    return false;
  }
}

/**
 * 最適な価格プランを提案
 */
export async function suggestOptimalPlan(userId: string, requestedPlan?: PricingPlan): Promise<{
  plan: PricingPlan;
  reason: string;
  savings?: number;
}> {
  const isFirstTime = await isFirstTimeUser(userId);
  
  // 初回ユーザーには初回限定価格を提案
  if (isFirstTime && (!requestedPlan || requestedPlan === 'regular')) {
    return {
      plan: 'first_time',
      reason: '初回限定50%オフでお得にお試しいただけます！',
      savings: 2000
    };
  }
  
  // ユーザーの利用履歴を分析して最適なプランを提案
  const recentUsage = await prisma.paymentSession.count({
    where: {
      userId,
      status: 'completed',
      createdAt: {
        gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) // 過去30日
      }
    }
  });
  
  // 頻繁に利用するユーザーにはサブスクリプションを提案
  if (recentUsage >= 3) {
    return {
      plan: 'subscription_growth',
      reason: 'よくご利用いただいているため、Growthプランがお得です',
      savings: (PRICING_CONFIG.regular.amount * 3) - PRICING_CONFIG.subscription_growth.amount
    };
  }
  
  return {
    plan: requestedPlan || 'regular',
    reason: '最適なプランです'
  };
}

/**
 * Checkout Session作成
 * ユーザーファーストな決済体験を提供
 */
export async function createCheckoutSession({
  userId,
  pdfId,
  plan,
  promotionCode,
  successUrl,
  cancelUrl
}: {
  userId: string;
  pdfId: string;
  plan: PricingPlan;
  promotionCode?: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<{
  sessionId: string;
  url: string;
  amount: number;
  expiresAt: Date;
}> {
  try {
    const pricing = PRICING_CONFIG[plan];
    const isSubscription = plan.startsWith('subscription_');
    
    // 透明性を保つため、金額と内容を明確に表示
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      payment_method_types: ['card'],
      mode: isSubscription ? 'subscription' : 'payment',
      customer_email: undefined, // プライバシー配慮：強制入力させない
      client_reference_id: userId,
      success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${cancelUrl}?cancelled=true`,
      expires_at: Math.floor((Date.now() + 30 * 60 * 1000) / 1000), // 30分後に期限切れ
      
      line_items: [{
        price_data: {
          currency: pricing.currency,
          product_data: {
            name: pricing.name,
            description: pricing.description,
            metadata: {
              pdf_id: pdfId,
              user_id: userId,
              ...pricing.metadata
            }
          },
          ...(isSubscription 
            ? { recurring: pricing.recurring }
            : { unit_amount: pricing.amount }
          )
        },
        quantity: 1,
      }],
      
      // ユーザー保護機能
      payment_intent_data: isSubscription ? undefined : {
        metadata: {
          pdf_id: pdfId,
          user_id: userId,
          plan,
          created_by: 'ai_subsidy_system'
        },
        description: `AI補助金申請書PDF作成 - ${pricing.name}`
      },
      
      // 透明性の確保
      metadata: {
        pdf_id: pdfId,
        user_id: userId,
        plan,
        pricing_version: '1.0',
        created_at: new Date().toISOString()
      },
      
      // カスタマーサポート情報
      custom_text: {
        submit: {
          message: '24時間以内であればキャンセル可能です。ご不明な点がございましたらサポートまでお気軽にお問い合わせください。'
        }
      }
    };
    
    // プロモーションコード適用
    if (promotionCode) {
      sessionParams.discounts = [{ promotion_code: promotionCode }];
    }
    
    const session = await stripe.checkout.sessions.create(sessionParams);
    
    // セッション情報をデータベースに保存
    await prisma.paymentSession.create({
      data: {
        sessionId: session.id,
        userId,
        pdfId,
        plan,
        amount: pricing.amount,
        currency: pricing.currency,
        status: 'pending',
        metadata: {
          stripe_session_id: session.id,
          promotion_code: promotionCode,
          ...pricing.metadata
        },
        expiresAt: new Date(session.expires_at! * 1000)
      }
    });
    
    logger.info('Checkout Session作成成功', {
      sessionId: session.id,
      userId,
      plan,
      amount: pricing.amount
    });
    
    return {
      sessionId: session.id,
      url: session.url!,
      amount: pricing.amount,
      expiresAt: new Date(session.expires_at! * 1000)
    };
    
  } catch (error) {
    logger.error('Checkout Session作成エラー:', error);
    throw new Error('決済セッションの作成に失敗しました。しばらく時間をおいて再度お試しください。');
  }
}

/**
 * 24時間キャンセル機能
 * ユーザー保護のための重要機能
 */
export async function requestCancellation({
  sessionId,
  userId,
  reason
}: {
  sessionId: string;
  userId: string;
  reason: string;
}): Promise<{
  success: boolean;
  refundId?: string;
  message: string;
}> {
  try {
    const paymentSession = await prisma.paymentSession.findFirst({
      where: {
        sessionId,
        userId,
        status: 'completed'
      }
    });
    
    if (!paymentSession) {
      return {
        success: false,
        message: '対象の決済が見つかりません。'
      };
    }
    
    const now = new Date();
    const completedAt = paymentSession.completedAt;
    const hoursSincePayment = completedAt 
      ? (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60)
      : 999;
    
    // 24時間以内の無条件キャンセル
    if (hoursSincePayment <= 24) {
      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentSession.paymentIntentId!
      );
      
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntent.id,
        reason: 'requested_by_customer',
        metadata: {
          user_id: userId,
          session_id: sessionId,
          cancel_reason: reason,
          auto_approved: 'true'
        }
      });
      
      // 返金記録の保存
      await prisma.refund.create({
        data: {
          refundId: refund.id,
          sessionId,
          userId,
          amount: paymentSession.amount,
          reason,
          status: 'processing',
          autoApproved: true
        }
      });
      
      logger.info('24時間キャンセル処理完了', {
        sessionId,
        userId,
        refundId: refund.id,
        amount: paymentSession.amount
      });
      
      return {
        success: true,
        refundId: refund.id,
        message: 'キャンセルを承りました。返金処理は5-10営業日以内に完了いたします。'
      };
    } else {
      // 24時間経過後はカスタマーサポート経由
      return {
        success: false,
        message: 'キャンセル期限（24時間）を過ぎているため、カスタマーサポートまでお問い合わせください。'
      };
    }
    
  } catch (error) {
    logger.error('キャンセル処理エラー:', error);
    return {
      success: false,
      message: 'キャンセル処理中にエラーが発生しました。カスタマーサポートまでお問い合わせください。'
    };
  }
}

/**
 * 決済成功時の処理
 * Webhookで呼び出される
 */
export async function handlePaymentSuccess(sessionId: string): Promise<void> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    
    await prisma.paymentSession.update({
      where: { sessionId },
      data: {
        status: 'completed',
        paymentIntentId: session.payment_intent as string,
        completedAt: new Date(),
        metadata: {
          ...session.metadata,
          completed_at: new Date().toISOString()
        }
      }
    });
    
    // PDF使用権の付与
    await prisma.pdfUsageRight.create({
      data: {
        userId: session.client_reference_id!,
        pdfId: session.metadata!.pdf_id,
        sessionId,
        validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30日間有効
        downloadLimit: 3, // 最大3回ダウンロード
        downloadCount: 0
      }
    });
    
    logger.info('決済成功処理完了', {
      sessionId,
      userId: session.client_reference_id,
      pdfId: session.metadata!.pdf_id
    });
    
  } catch (error) {
    logger.error('決済成功処理エラー:', error);
    throw error;
  }
}

/**
 * ユーザーフレンドリーなエラーメッセージ
 */
export const PAYMENT_ERROR_MESSAGES = {
  card_declined: {
    title: 'カードが利用できませんでした',
    message: 'お使いのカードで決済ができませんでした。別のカードをお試しいただくか、カード会社にお問い合わせください。',
    actions: ['別のカードを試す', 'サポートに連絡']
  },
  insufficient_funds: {
    title: '残高不足です',
    message: 'カードの利用限度額を超えているか、残高が不足しています。別のカードをお試しください。',
    actions: ['別のカードを試す', 'カード会社に連絡']
  },
  expired_card: {
    title: 'カードの有効期限が切れています',
    message: 'お使いのカードの有効期限が切れています。新しいカード情報をご入力ください。',
    actions: ['新しいカードを入力', 'カード情報を確認']
  },
  processing_error: {
    title: '決済処理中にエラーが発生しました',
    message: '一時的なエラーが発生しました。しばらく時間をおいて再度お試しください。',
    actions: ['再試行', 'サポートに連絡']
  },
  network_error: {
    title: 'ネットワークエラーが発生しました',
    message: 'インターネット接続を確認して、再度お試しください。',
    actions: ['再試行', 'ネットワークを確認']
  }
} as const;

export default {
  createCheckoutSession,
  handlePaymentSuccess,
  requestCancellation,
  isFirstTimeUser,
  suggestOptimalPlan,
  PRICING_CONFIG,
  PAYMENT_ERROR_MESSAGES
};