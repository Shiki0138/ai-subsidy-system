/**
 * 返金管理サービス
 * 
 * チームA担当: Week 3 - 返金システムの完全実装
 * ユーザー保護とシステム自動化を重視
 */

import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16',
});

const prisma = new PrismaClient();

export interface RefundRequest {
  sessionId: string;
  userId: string;
  reason: string;
  type: 'user_request' | 'system_error' | 'quality_issue' | 'admin_action';
  amount?: number; // 部分返金の場合
  adminNotes?: string;
}

export interface RefundResult {
  success: boolean;
  refundId?: string;
  amount?: number;
  status: 'processed' | 'processing' | 'failed' | 'rejected';
  message: string;
  estimatedCompletion?: Date;
}

/**
 * 包括的な返金処理システム
 */
export class RefundManagementService {
  
  /**
   * 返金リクエストの処理
   */
  async processRefundRequest(request: RefundRequest): Promise<RefundResult> {
    try {
      logger.info('返金リクエスト処理開始', { 
        sessionId: request.sessionId, 
        type: request.type,
        userId: request.userId 
      });

      // 決済セッション検証
      const paymentSession = await this.validatePaymentSession(
        request.sessionId, 
        request.userId
      );

      if (!paymentSession.isValid) {
        return {
          success: false,
          status: 'rejected',
          message: paymentSession.errorMessage || '対象の決済が見つかりません'
        };
      }

      // 返金タイプ別の処理
      switch (request.type) {
        case 'user_request':
          return await this.handleUserRefundRequest(request, paymentSession.session!);
        
        case 'system_error':
          return await this.handleSystemErrorRefund(request, paymentSession.session!);
        
        case 'quality_issue':
          return await this.handleQualityIssueRefund(request, paymentSession.session!);
        
        case 'admin_action':
          return await this.handleAdminRefund(request, paymentSession.session!);
        
        default:
          throw new Error(`未対応の返金タイプ: ${request.type}`);
      }

    } catch (error) {
      logger.error('返金処理エラー:', error);
      return {
        success: false,
        status: 'failed',
        message: '返金処理中にエラーが発生しました。サポートにお問い合わせください。'
      };
    }
  }

  /**
   * ユーザーリクエストによる返金（24時間キャンセルなど）
   */
  private async handleUserRefundRequest(
    request: RefundRequest, 
    session: any
  ): Promise<RefundResult> {
    const now = new Date();
    const completedAt = session.completedAt;
    const hoursSincePayment = completedAt 
      ? (now.getTime() - completedAt.getTime()) / (1000 * 60 * 60)
      : 999;

    // 24時間以内の無条件返金
    if (hoursSincePayment <= 24) {
      return await this.executeFullRefund(request, session, true);
    }

    // 24時間経過後は個別審査
    return await this.submitForReview(request, session);
  }

  /**
   * システムエラーによる自動返金
   */
  private async handleSystemErrorRefund(
    request: RefundRequest, 
    session: any
  ): Promise<RefundResult> {
    // システムエラーは即座に全額返金
    logger.info('システムエラー返金処理', { sessionId: request.sessionId });
    return await this.executeFullRefund(request, session, true);
  }

  /**
   * 品質問題による返金
   */
  private async handleQualityIssueRefund(
    request: RefundRequest, 
    session: any
  ): Promise<RefundResult> {
    // 品質問題の場合、部分返金も考慮
    const refundAmount = request.amount || session.amount;
    const isPartialRefund = refundAmount < session.amount;

    if (isPartialRefund) {
      return await this.executePartialRefund(request, session, refundAmount);
    } else {
      return await this.executeFullRefund(request, session, false);
    }
  }

  /**
   * 管理者による返金
   */
  private async handleAdminRefund(
    request: RefundRequest, 
    session: any
  ): Promise<RefundResult> {
    const refundAmount = request.amount || session.amount;
    const isPartialRefund = refundAmount < session.amount;

    logger.info('管理者返金処理', { 
      sessionId: request.sessionId,
      amount: refundAmount,
      partial: isPartialRefund,
      adminNotes: request.adminNotes
    });

    if (isPartialRefund) {
      return await this.executePartialRefund(request, session, refundAmount);
    } else {
      return await this.executeFullRefund(request, session, true);
    }
  }

  /**
   * 全額返金の実行
   */
  private async executeFullRefund(
    request: RefundRequest, 
    session: any, 
    autoApproved: boolean
  ): Promise<RefundResult> {
    try {
      // Stripe返金処理
      const refund = await stripe.refunds.create({
        payment_intent: session.paymentIntentId,
        reason: this.getStripeRefundReason(request.type),
        metadata: {
          user_id: request.userId,
          session_id: request.sessionId,
          refund_type: request.type,
          auto_approved: autoApproved.toString(),
          admin_notes: request.adminNotes || ''
        }
      });

      // データベース記録
      await prisma.refund.create({
        data: {
          refundId: refund.id,
          sessionId: request.sessionId,
          userId: request.userId,
          amount: session.amount,
          reason: request.reason,
          status: 'processing',
          autoApproved,
          notes: request.adminNotes
        }
      });

      // 請求履歴に記録
      await prisma.billingHistory.create({
        data: {
          userId: request.userId,
          type: 'REFUND',
          amount: -session.amount, // 負の値で返金を表現
          description: `返金: ${this.getRefundDescription(request.type)}`,
          sessionId: request.sessionId,
          refundId: refund.id
        }
      });

      // PDF使用権の無効化
      await this.revokePdfUsageRights(request.sessionId);

      logger.info('全額返金処理完了', { 
        refundId: refund.id, 
        amount: session.amount 
      });

      return {
        success: true,
        refundId: refund.id,
        amount: session.amount,
        status: 'processing',
        message: '返金処理を開始しました。5-10営業日以内にご返金いたします。',
        estimatedCompletion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) // 10日後
      };

    } catch (error) {
      logger.error('全額返金実行エラー:', error);
      throw error;
    }
  }

  /**
   * 部分返金の実行
   */
  private async executePartialRefund(
    request: RefundRequest, 
    session: any, 
    refundAmount: number
  ): Promise<RefundResult> {
    try {
      // Stripe部分返金処理
      const refund = await stripe.refunds.create({
        payment_intent: session.paymentIntentId,
        amount: refundAmount, // 円単位
        reason: this.getStripeRefundReason(request.type),
        metadata: {
          user_id: request.userId,
          session_id: request.sessionId,
          refund_type: request.type,
          original_amount: session.amount.toString(),
          admin_notes: request.adminNotes || ''
        }
      });

      // データベース記録
      await prisma.refund.create({
        data: {
          refundId: refund.id,
          sessionId: request.sessionId,
          userId: request.userId,
          amount: refundAmount,
          reason: `部分返金: ${request.reason}`,
          status: 'processing',
          autoApproved: true,
          notes: request.adminNotes
        }
      });

      // 請求履歴に記録
      await prisma.billingHistory.create({
        data: {
          userId: request.userId,
          type: 'REFUND',
          amount: -refundAmount,
          description: `部分返金: ${this.getRefundDescription(request.type)}`,
          sessionId: request.sessionId,
          refundId: refund.id
        }
      });

      logger.info('部分返金処理完了', { 
        refundId: refund.id, 
        amount: refundAmount,
        originalAmount: session.amount
      });

      return {
        success: true,
        refundId: refund.id,
        amount: refundAmount,
        status: 'processing',
        message: `部分返金（¥${refundAmount.toLocaleString()}）を処理しました。5-10営業日以内にご返金いたします。`,
        estimatedCompletion: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000)
      };

    } catch (error) {
      logger.error('部分返金実行エラー:', error);
      throw error;
    }
  }

  /**
   * 個別審査への送信
   */
  private async submitForReview(
    request: RefundRequest, 
    session: any
  ): Promise<RefundResult> {
    // 審査待ちとして記録
    await prisma.refund.create({
      data: {
        refundId: `pending_${Date.now()}`,
        sessionId: request.sessionId,
        userId: request.userId,
        amount: session.amount,
        reason: request.reason,
        status: 'pending',
        autoApproved: false
      }
    });

    // 管理者に通知
    await this.notifyAdminForReview(request, session);

    return {
      success: true,
      status: 'processing',
      message: '返金リクエストを受け付けました。3営業日以内に審査結果をお知らせいたします。'
    };
  }

  /**
   * 決済セッションの検証
   */
  private async validatePaymentSession(sessionId: string, userId: string) {
    try {
      const session = await prisma.paymentSession.findFirst({
        where: {
          sessionId,
          userId,
          status: 'COMPLETED'
        }
      });

      if (!session) {
        return {
          isValid: false,
          errorMessage: '対象の決済が見つかりません。'
        };
      }

      // 既に返金済みかチェック
      const existingRefund = await prisma.refund.findFirst({
        where: {
          sessionId,
          status: { in: ['processing', 'completed'] }
        }
      });

      if (existingRefund) {
        return {
          isValid: false,
          errorMessage: 'この決済は既に返金処理済みです。'
        };
      }

      return {
        isValid: true,
        session
      };

    } catch (error) {
      logger.error('決済セッション検証エラー:', error);
      return {
        isValid: false,
        errorMessage: 'システムエラーが発生しました。'
      };
    }
  }

  /**
   * PDF使用権の無効化
   */
  private async revokePdfUsageRights(sessionId: string): Promise<void> {
    try {
      await prisma.pdfUsageRight.updateMany({
        where: { sessionId },
        data: { status: 'REVOKED' }
      });
      
      logger.info('PDF使用権無効化完了', { sessionId });
    } catch (error) {
      logger.error('PDF使用権無効化エラー:', error);
    }
  }

  /**
   * 管理者通知
   */
  private async notifyAdminForReview(request: RefundRequest, session: any): Promise<void> {
    // TODO: 実際の通知システムと連携
    logger.info('管理者審査通知', {
      sessionId: request.sessionId,
      userId: request.userId,
      amount: session.amount,
      reason: request.reason
    });
  }

  /**
   * Stripe返金理由の取得
   */
  private getStripeRefundReason(type: string): 'duplicate' | 'fraudulent' | 'requested_by_customer' {
    switch (type) {
      case 'system_error':
        return 'duplicate';
      case 'quality_issue':
      case 'admin_action':
        return 'requested_by_customer';
      default:
        return 'requested_by_customer';
    }
  }

  /**
   * 返金説明の取得
   */
  private getRefundDescription(type: string): string {
    switch (type) {
      case 'user_request':
        return '24時間キャンセル';
      case 'system_error':
        return 'システム障害による返金';
      case 'quality_issue':
        return '品質問題による返金';
      case 'admin_action':
        return '管理者による返金';
      default:
        return '返金';
    }
  }

  /**
   * 返金統計の取得
   */
  async getRefundStatistics(userId?: string, startDate?: Date, endDate?: Date) {
    const where: any = {};
    
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const [total, byStatus, byType] = await Promise.all([
      // 総返金件数・金額
      prisma.refund.aggregate({
        where,
        _count: { id: true },
        _sum: { amount: true }
      }),
      
      // ステータス別集計
      prisma.refund.groupBy({
        where,
        by: ['status'],
        _count: { id: true },
        _sum: { amount: true }
      }),
      
      // 返金タイプ別集計（reasonから推定）
      prisma.refund.findMany({
        where,
        select: { reason: true, amount: true }
      })
    ]);

    return {
      summary: {
        totalRefunds: total._count.id || 0,
        totalAmount: total._sum.amount || 0
      },
      byStatus,
      byType: this.analyzeRefundTypes(byType)
    };
  }

  /**
   * 返金タイプ分析
   */
  private analyzeRefundTypes(refunds: any[]) {
    const types = {
      user_cancel: { count: 0, amount: 0 },
      system_error: { count: 0, amount: 0 },
      quality_issue: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 }
    };

    refunds.forEach(refund => {
      const reason = refund.reason.toLowerCase();
      let type = 'other';
      
      if (reason.includes('キャンセル') || reason.includes('cancel')) {
        type = 'user_cancel';
      } else if (reason.includes('システム') || reason.includes('障害')) {
        type = 'system_error';
      } else if (reason.includes('品質') || reason.includes('quality')) {
        type = 'quality_issue';
      }

      types[type as keyof typeof types].count++;
      types[type as keyof typeof types].amount += refund.amount;
    });

    return types;
  }
}

// デフォルトエクスポート
const refundManagementService = new RefundManagementService();
export default refundManagementService;