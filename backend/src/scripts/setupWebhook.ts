/**
 * Stripe Webhook設定スクリプト
 * 
 * チームA: 本番環境向けWebhookエンドポイントの設定
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY環境変数が設定されていません');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

// 監視対象のWebhookイベント
const WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'payment_intent.succeeded',
  'payment_intent.payment_failed',
  'invoice.payment_succeeded',
  'invoice.payment_failed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted'
];

async function setupWebhookEndpoint(): Promise<void> {
  console.log('🌐 Stripe Webhookエンドポイントの設定を開始します...\n');
  
  const baseUrl = process.env.WEBHOOK_BASE_URL || 'https://your-domain.com';
  const webhookUrl = `${baseUrl}/api/billing/webhook`;
  
  try {
    console.log(`📡 Webhook URL: ${webhookUrl}`);
    console.log(`📋 監視イベント: ${WEBHOOK_EVENTS.length}個`);
    
    // 既存のWebhookエンドポイントを確認
    const existingEndpoints = await stripe.webhookEndpoints.list();
    const existingEndpoint = existingEndpoints.data.find(
      endpoint => endpoint.url === webhookUrl
    );
    
    if (existingEndpoint) {
      console.log('⚠️  既存のWebhookエンドポイントが見つかりました');
      console.log(`ID: ${existingEndpoint.id}`);
      console.log(`Status: ${existingEndpoint.status}`);
      
      // 既存エンドポイントの更新
      const updatedEndpoint = await stripe.webhookEndpoints.update(
        existingEndpoint.id,
        {
          enabled_events: WEBHOOK_EVENTS,
          metadata: {
            environment: process.env.NODE_ENV || 'development',
            service: 'ai-subsidy-system',
            team: 'team-a',
            updated_at: new Date().toISOString()
          }
        }
      );
      
      console.log('✅ 既存Webhookエンドポイントを更新しました');
      console.log(`Secret: ${updatedEndpoint.secret}\n`);
      
      return;
    }
    
    // 新しいWebhookエンドポイントを作成
    const webhookEndpoint = await stripe.webhookEndpoints.create({
      url: webhookUrl,
      enabled_events: WEBHOOK_EVENTS,
      description: 'AI補助金申請システム - チームA決済処理',
      metadata: {
        environment: process.env.NODE_ENV || 'development',
        service: 'ai-subsidy-system',
        team: 'team-a',
        created_at: new Date().toISOString()
      }
    });
    
    console.log('✅ Webhookエンドポイントの作成が完了しました！\n');
    
    console.log('📋 作成結果:');
    console.log(`Webhook ID: ${webhookEndpoint.id}`);
    console.log(`URL: ${webhookEndpoint.url}`);
    console.log(`Status: ${webhookEndpoint.status}`);
    console.log(`Secret: ${webhookEndpoint.secret}\n`);
    
    console.log('🔧 環境変数に追加してください:');
    console.log(`STRIPE_WEBHOOK_SECRET=${webhookEndpoint.secret}`);
    console.log(`STRIPE_WEBHOOK_ID=${webhookEndpoint.id}\n`);
    
    console.log('📌 監視対象イベント:');
    WEBHOOK_EVENTS.forEach((event, index) => {
      console.log(`${index + 1}. ${event}`);
    });
    
  } catch (error) {
    console.error('❌ Webhook設定エラー:', error);
    throw error;
  }
}

async function testWebhookEndpoint(): Promise<void> {
  console.log('\n🧪 Webhookエンドポイントのテストを実行します...');
  
  try {
    // テスト用のCheckout Sessionを作成してWebhookをトリガー
    const testSession = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      line_items: [{
        price_data: {
          currency: 'jpy',
          product_data: {
            name: 'Webhook Test Product',
          },
          unit_amount: 100, // ¥100 テスト用最小金額
        },
        quantity: 1,
      }],
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      metadata: {
        test: 'webhook_test',
        team: 'team-a'
      }
    });
    
    console.log('✅ テストセッション作成完了');
    console.log(`Test Session ID: ${testSession.id}`);
    console.log(`Test Session URL: ${testSession.url}\n`);
    
    console.log('📝 テスト手順:');
    console.log('1. 上記URLでテスト決済を実行');
    console.log('2. Webhookが正常に呼び出されることを確認');
    console.log('3. ログでイベント処理を確認');
    
  } catch (error) {
    console.error('❌ Webhookテストエラー:', error);
  }
}

async function main(): Promise<void> {
  try {
    await setupWebhookEndpoint();
    
    // テスト環境でのみWebhookテストを実行
    if (process.env.NODE_ENV !== 'production') {
      await testWebhookEndpoint();
    }
    
  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error);
    process.exit(1);
  }
}

// 実行確認
if (require.main === module) {
  console.log('🔗 Stripe Webhook設定スクリプト\n');
  
  if (!process.env.WEBHOOK_BASE_URL) {
    console.log('⚠️  WEBHOOK_BASE_URL環境変数が設定されていません');
    console.log('デフォルトのプレースホルダーを使用します\n');
  }
  
  main();
}

export { setupWebhookEndpoint, testWebhookEndpoint };