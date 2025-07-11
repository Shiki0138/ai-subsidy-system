# 決済API完全ドキュメント

**作成日**: 2025-06-20  
**作成者**: チームA（課金・決済担当）  
**バージョン**: 1.0  
**対象**: フロントエンド開発者、システム統合担当者

---

## 📋 目次

1. [概要](#概要)
2. [認証](#認証)
3. [共通仕様](#共通仕様)
4. [エンドポイント一覧](#エンドポイント一覧)
5. [エラーハンドリング](#エラーハンドリング)
6. [サンプルコード](#サンプルコード)
7. [テスト手順](#テスト手順)

---

## 概要

AI補助金申請システムの決済API仕様書です。Stripe統合による安全で使いやすい決済機能を提供します。

### 基本設計思想
- **ユーザーファースト**: わかりやすく、使いやすく
- **透明性**: 隠れた費用なし、明確な価格表示
- **安全性**: PCI DSS準拠、エンドツーエンド暗号化
- **信頼性**: 99.9%可用性、自動リトライ機能

### 価格体系
| プラン | 価格 | 説明 | 備考 |
|--------|------|------|------|
| first_time | ¥1,980 | 初回限定50%オフ | 一人一回限り |
| regular | ¥3,980 | 通常価格 | 最も一般的 |
| bulk_3 | ¥9,800 | 3回パック | 2,140円お得 |
| bulk_5 | ¥14,800 | 5回パック | 5,100円お得 |
| subscription_growth | ¥9,800/月 | 月間3回まで | 継続利用者向け |
| subscription_scale | ¥29,800/月 | 月間10回まで | 企業向け |

---

## 認証

### 開発環境
```http
# ヘッダーに追加（開発用）
X-User-ID: test-user-123
```

### 本番環境
```http
# JWTトークンを使用
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 共通仕様

### Base URL
```
開発環境: http://localhost:7001
本番環境: https://api.ai-subsidy.com
```

### Content-Type
```http
Content-Type: application/json
```

### レスポンス形式
```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}
```

---

## エンドポイント一覧

### 1. 価格情報の取得

#### リクエスト
```http
GET /api/billing/pricing
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "pricing": [
      {
        "planId": "first_time",
        "name": "PDF申請書作成（初回限定）",
        "description": "初回限定50%オフ！お試し価格でご利用いただけます",
        "amount": 1980,
        "currency": "jpy",
        "isRecommended": true,
        "savings": 2000,
        "reason": "初回限定50%オフでお得にお試しいただけます！",
        "priceBreakdown": {
          "basePrice": 1980,
          "taxes": 0,
          "fees": 0,
          "total": 1980
        },
        "features": [
          "初回限定50%オフ",
          "高品質PDF生成",
          "24時間キャンセル可能",
          "最大3回ダウンロード"
        ],
        "metadata": {
          "type": "first_time_discount",
          "regular_price": "3980",
          "discount_percentage": "50"
        }
      }
    ],
    "guarantees": [
      "24時間以内の無条件キャンセル可能",
      "品質保証付き（プレビュー機能）",
      "隠れた費用一切なし",
      "SSL暗号化による安全な決済"
    ]
  }
}
```

### 2. Checkout Session作成

#### リクエスト
```http
POST /api/billing/checkout/pdf
```

```json
{
  "pdf_id": "pdf_123456789",
  "plan": "first_time",
  "promotion_code": "WELCOME2024",
  "success_url": "https://example.com/success?session_id={CHECKOUT_SESSION_ID}",
  "cancel_url": "https://example.com/cancel"
}
```

#### パラメータ
| 項目 | 型 | 必須 | 説明 |
|------|----|----|------|
| pdf_id | string | ✅ | 対象PDF ID |
| plan | string | ✅ | 価格プランID |
| promotion_code | string | ❌ | プロモーションコード |
| success_url | string | ✅ | 決済成功時のURL |
| cancel_url | string | ✅ | キャンセル時のURL |

#### レスポンス
```json
{
  "success": true,
  "data": {
    "sessionId": "cs_test_abc123...",
    "url": "https://checkout.stripe.com/pay/cs_test_abc123...",
    "amount": 1980,
    "expiresAt": "2025-06-20T17:30:00.000Z",
    "message": "決済ページを準備しました",
    "nextSteps": [
      "安全な決済ページに移動します",
      "24時間以内であればキャンセル可能です",
      "決済完了後、すぐにPDFをダウンロードできます"
    ]
  }
}
```

### 3. 決済状況確認

#### リクエスト
```http
GET /api/billing/status/:sessionId
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "status": "COMPLETED",
    "amount": 1980,
    "plan": "first_time",
    "createdAt": "2025-06-20T17:00:00.000Z",
    "expiresAt": "2025-06-20T17:30:00.000Z",
    "completedAt": "2025-06-20T17:05:00.000Z",
    "canCancel": true,
    "message": "決済が完了しました",
    "nextSteps": [
      "PDFのダウンロードが可能です",
      "24時間以内であればキャンセル可能です"
    ],
    "stripeStatus": "paid"
  }
}
```

#### ステータス一覧
| ステータス | 説明 | 次のアクション |
|------------|------|----------------|
| PENDING | 決済処理中 | 決済ページで手続き完了 |
| COMPLETED | 決済完了 | PDFダウンロード可能 |
| FAILED | 決済失敗 | 別のカードで再試行 |
| EXPIRED | セッション期限切れ | 新しいセッション作成 |
| CANCELED | キャンセル済み | 必要に応じて再試行 |

### 4. 24時間キャンセル

#### リクエスト
```http
POST /api/billing/cancel/:sessionId
```

```json
{
  "reason": "操作ミス"
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "refundId": "re_abc123...",
    "message": "キャンセルを承りました。返金処理は5-10営業日以内に完了いたします。",
    "timeline": [
      "返金処理を開始しました",
      "通常5-10営業日以内にご返金",
      "メールで返金完了をお知らせします"
    ]
  }
}
```

### 5. 決済履歴取得

#### リクエスト
```http
GET /api/billing/history?page=1&limit=10
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "history": [
      {
        "id": "bh_123456",
        "type": "PAYMENT",
        "amount": 1980,
        "description": "PDF申請書作成（初回限定）",
        "date": "2025-06-20T17:05:00.000Z",
        "status": "completed",
        "details": {
          "sessionId": "cs_test_abc123...",
          "subscriptionId": null,
          "refundId": null
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 15,
      "totalPages": 2,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
```

### 6. Webhook エンドポイント

#### リクエスト
```http
POST /api/billing/webhook
Content-Type: application/json
Stripe-Signature: t=1608069381,v1=abc123...
```

#### 処理対象イベント
- `checkout.session.completed`: 決済完了
- `payment_intent.payment_failed`: 決済失敗
- `invoice.payment_succeeded`: サブスクリプション決済成功
- `customer.subscription.deleted`: サブスクリプション解約

---

## エラーハンドリング

### エラーレスポンス形式
```json
{
  "success": false,
  "error": {
    "code": "PAYMENT_FAILED",
    "message": "決済処理に問題が発生しました。別のカードをお試しいただくか、しばらく時間をおいて再度お試しください。",
    "details": {
      "stripe_error": "card_declined",
      "retry_possible": true,
      "support_contact": "お困りの場合は、サポートまでお気軽にお問い合わせください。"
    }
  },
  "timestamp": "2025-06-20T17:00:00.000Z"
}
```

### 主要エラーコード
| コード | 意味 | ユーザー対応 |
|--------|------|------------|
| VALIDATION_FAILED | 入力値エラー | 入力内容を確認 |
| PAYMENT_FAILED | 決済失敗 | 別のカード使用 |
| SESSION_EXPIRED | セッション期限切れ | 新しいセッション作成 |
| INSUFFICIENT_FUNDS | 残高不足 | カード会社に連絡 |
| CARD_DECLINED | カード拒否 | 別のカード使用 |
| NETWORK_ERROR | ネットワークエラー | しばらく待って再試行 |
| RATE_LIMITED | レート制限 | しばらく待って再試行 |

### フロントエンド実装例
```typescript
async function handlePaymentError(error: PaymentError) {
  const errorMessages = {
    PAYMENT_FAILED: {
      title: 'カードが利用できませんでした',
      message: error.message,
      actions: ['別のカードを試す', 'サポートに連絡']
    },
    INSUFFICIENT_FUNDS: {
      title: '残高不足です',
      message: 'カードの利用限度額を超えているか、残高が不足しています。',
      actions: ['別のカードを試す', 'カード会社に連絡']
    }
  };
  
  const uiError = errorMessages[error.code] || {
    title: 'エラーが発生しました',
    message: 'しばらく時間をおいて再度お試しください。',
    actions: ['再試行', 'サポートに連絡']
  };
  
  showErrorDialog(uiError);
}
```

---

## サンプルコード

### React + TypeScript
```typescript
import { useState } from 'react';

interface PaymentService {
  createCheckoutSession(data: CheckoutData): Promise<CheckoutResponse>;
  getPaymentStatus(sessionId: string): Promise<PaymentStatus>;
}

const usePayment = (): PaymentService => {
  const [loading, setLoading] = useState(false);
  
  const createCheckoutSession = async (data: CheckoutData) => {
    setLoading(true);
    try {
      const response = await fetch('/api/billing/checkout/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': getCurrentUserId()
        },
        body: JSON.stringify(data)
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error.message);
      }
      
      return result.data;
    } catch (error) {
      handlePaymentError(error);
      throw error;
    } finally {
      setLoading(false);
    }
  };
  
  const getPaymentStatus = async (sessionId: string) => {
    const response = await fetch(`/api/billing/status/${sessionId}`, {
      headers: {
        'X-User-ID': getCurrentUserId()
      }
    });
    
    const result = await response.json();
    return result.data;
  };
  
  return { createCheckoutSession, getPaymentStatus };
};

// 使用例
const CheckoutButton = ({ pdfId, plan }: Props) => {
  const { createCheckoutSession } = usePayment();
  
  const handleCheckout = async () => {
    try {
      const session = await createCheckoutSession({
        pdf_id: pdfId,
        plan: plan,
        success_url: `${window.location.origin}/success`,
        cancel_url: `${window.location.origin}/cancel`
      });
      
      // Stripeの決済ページにリダイレクト
      window.location.href = session.url;
    } catch (error) {
      console.error('決済開始エラー:', error);
    }
  };
  
  return (
    <button onClick={handleCheckout} className="checkout-button">
      決済へ進む
    </button>
  );
};
```

### Node.js + Express
```javascript
const express = require('express');
const axios = require('axios');

const app = express();

// 決済ページ作成
app.post('/create-payment', async (req, res) => {
  try {
    const { pdf_id, plan } = req.body;
    
    const response = await axios.post('http://localhost:7001/api/billing/checkout/pdf', {
      pdf_id,
      plan,
      success_url: `${req.protocol}://${req.get('host')}/success`,
      cancel_url: `${req.protocol}://${req.get('host')}/cancel`
    }, {
      headers: {
        'Content-Type': 'application/json',
        'X-User-ID': req.user.id
      }
    });
    
    res.json(response.data);
  } catch (error) {
    res.status(500).json({
      error: 'Payment creation failed',
      message: error.response?.data?.error?.message || error.message
    });
  }
});
```

---

## テスト手順

### 1. 開発環境セットアップ
```bash
# 課金テストサーバー起動
cd backend
node billing-test-server.js

# APIヘルスチェック
curl http://localhost:7001/api/health
```

### 2. 価格情報取得テスト
```bash
curl -X GET http://localhost:7001/api/billing/pricing \
  -H "Content-Type: application/json" | jq
```

### 3. Checkout Session作成テスト
```bash
curl -X POST http://localhost:7001/api/billing/checkout/pdf \
  -H "Content-Type: application/json" \
  -H "X-User-ID: test-user-123" \
  -d '{
    "pdf_id": "test-pdf-123",
    "plan": "first_time",
    "success_url": "http://localhost:3000/success",
    "cancel_url": "http://localhost:3000/cancel"
  }' | jq
```

### 4. 自動テスト実行
```bash
# 課金システム総合テスト
npx ts-node ./src/scripts/testBilling.ts
```

### 5. フロントエンド統合テスト
1. 価格表示の確認
2. 決済ボタンの動作確認
3. エラーハンドリングの確認
4. レスポンシブデザインの確認

---

## セキュリティ要件

### データ保護
- PCI DSS準拠
- クレジットカード情報の非保持
- エンドツーエンド暗号化
- HTTPS必須

### アクセス制御
- JWT認証
- レート制限（100req/min）
- IP制限（必要に応じて）

### 監査ログ
- 全決済取引の記録
- エラー発生の詳細ログ
- ユーザー操作履歴

---

## サポート・お問い合わせ

**技術的な質問**:
- チームA（課金・決済担当）
- Slack: #team-a-billing

**緊急時連絡先**:
- 決済システム障害時の対応手順参照
- エスカレーションフロー確認

**リソース**:
- [Stripe API Documentation](https://stripe.com/docs/api)
- [PCI DSS Compliance Guide](https://stripe.com/docs/security)

---

**最終更新**: 2025-06-20  
**次回レビュー**: 2025-06-27  
**承認者**: チームAリーダー