/**
 * 課金システム専用テストサーバー
 * TypeScriptエラーを回避してStripe統合をテスト
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = 7001;

// ミドルウェア設定
app.use(cors());
app.use(express.json());
app.use(express.raw({ type: 'application/json' }));

// 価格設定（stripeService.tsと同じ構成）
const PRICING_CONFIG = {
  first_time: {
    amount: 1980,
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
    amount: 3980,
    name: 'PDF申請書作成（通常価格）',
    description: 'AI技術による高品質な申請書を即座に生成',
    currency: 'jpy',
    metadata: {
      type: 'regular'
    }
  },
  bulk_3: {
    amount: 9800,
    name: 'PDF申請書作成（3回パック）',
    description: '3回分パック - 2,140円お得！',
    currency: 'jpy',
    metadata: {
      type: 'bulk',
      quantity: '3',
      unit_price: '3267',
      savings: '2140'
    }
  }
};

// 価格情報API
app.get('/api/billing/pricing', (req, res) => {
  try {
    console.log('📋 価格情報APIが呼び出されました');
    
    const pricingInfo = Object.entries(PRICING_CONFIG).map(([key, config]) => ({
      planId: key,
      name: config.name,
      description: config.description,
      amount: config.amount,
      currency: config.currency,
      priceBreakdown: {
        basePrice: config.amount,
        taxes: 0,
        fees: 0,
        total: config.amount
      },
      features: getPlanFeatures(key),
      metadata: config.metadata
    }));
    
    res.json({
      success: true,
      data: {
        pricing: pricingInfo,
        guarantees: [
          '24時間以内の無条件キャンセル可能',
          '品質保証付き（プレビュー機能）',
          '隠れた費用一切なし',
          'SSL暗号化による安全な決済'
        ]
      }
    });
    
    console.log(`✅ ${pricingInfo.length}個のプランを返しました`);
    
  } catch (error) {
    console.error('❌ 価格情報取得エラー:', error);
    res.status(500).json({
      success: false,
      error: 'price_fetch_failed',
      message: '価格情報の取得に失敗しました。'
    });
  }
});

// Checkout Session作成API
app.post('/api/billing/checkout/pdf', (req, res) => {
  try {
    console.log('💳 Checkout Session作成APIが呼び出されました');
    console.log('Request body:', req.body);
    
    const { pdf_id, plan, success_url, cancel_url } = req.body;
    
    // バリデーション
    if (!pdf_id || !plan || !success_url || !cancel_url) {
      return res.status(400).json({
        success: false,
        error: 'validation_failed',
        message: '必要なパラメータが不足しています'
      });
    }
    
    if (!PRICING_CONFIG[plan]) {
      return res.status(400).json({
        success: false,
        error: 'invalid_plan',
        message: '無効なプランが指定されました'
      });
    }
    
    const pricing = PRICING_CONFIG[plan];
    const sessionId = `cs_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // モックのCheckout Session
    const checkoutData = {
      sessionId,
      url: `https://checkout.stripe.com/pay/${sessionId}`,
      amount: pricing.amount,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30分後
      message: '決済ページを準備しました',
      nextSteps: [
        '安全な決済ページに移動します',
        '24時間以内であればキャンセル可能です',
        '決済完了後、すぐにPDFをダウンロードできます'
      ]
    };
    
    res.json({
      success: true,
      data: checkoutData
    });
    
    console.log(`✅ Checkout Session作成成功: ${sessionId}`);
    console.log(`💰 金額: ¥${pricing.amount.toLocaleString()}`);
    
  } catch (error) {
    console.error('❌ Checkout Session作成エラー:', error);
    res.status(500).json({
      success: false,
      error: 'checkout_creation_failed',
      message: '決済ページの準備に失敗しました。'
    });
  }
});

// Webhookエンドポイント
app.post('/api/billing/webhook', (req, res) => {
  try {
    console.log('🔗 Webhookが呼び出されました');
    
    const signature = req.headers['stripe-signature'];
    if (!signature || signature === 'test-signature') {
      console.log('⚠️  テスト用署名または署名なし');
      return res.status(400).json({
        error: 'Invalid signature'
      });
    }
    
    console.log('✅ Webhook署名検証（模擬）');
    res.json({ received: true });
    
  } catch (error) {
    console.error('❌ Webhook処理エラー:', error);
    res.status(500).json({
      error: 'webhook_processing_failed'
    });
  }
});

// ヘルスチェック
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    service: 'billing-test-server',
    timestamp: new Date().toISOString(),
    features: ['pricing', 'checkout', 'webhook']
  });
});

// プラン機能取得
function getPlanFeatures(plan) {
  const features = {
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
    ]
  };
  
  return features[plan] || [];
}

// サーバー起動
app.listen(PORT, () => {
  console.log('💳 課金システム専用テストサーバー起動');
  console.log(`📡 ポート: ${PORT}`);
  console.log(`🌐 API Base URL: http://localhost:${PORT}`);
  console.log('\n🔧 利用可能なエンドポイント:');
  console.log(`   価格情報: GET http://localhost:${PORT}/api/billing/pricing`);
  console.log(`   決済作成: POST http://localhost:${PORT}/api/billing/checkout/pdf`);
  console.log(`   Webhook: POST http://localhost:${PORT}/api/billing/webhook`);
  console.log(`   ヘルス: GET http://localhost:${PORT}/api/health`);
  console.log('\n✨ 課金システムテスト準備完了！');
});

// グレースフルシャットダウン
process.on('SIGINT', () => {
  console.log('\n🛑 サーバーを停止しています...');
  process.exit(0);
});