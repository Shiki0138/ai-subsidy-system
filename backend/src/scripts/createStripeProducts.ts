/**
 * Stripe商品・価格作成スクリプト
 * 
 * チームA: ハイブリッド課金モデルの商品をStripeに作成
 */

import Stripe from 'stripe';
import dotenv from 'dotenv';
import { PRICING_CONFIG } from '../services/stripeService';

dotenv.config();

if (!process.env.STRIPE_SECRET_KEY) {
  console.error('❌ STRIPE_SECRET_KEY環境変数が設定されていません');
  process.exit(1);
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
});

interface CreatedProduct {
  productId: string;
  priceId: string;
  plan: string;
  name: string;
  amount: number;
}

async function createStripeProducts(): Promise<void> {
  console.log('🚀 Stripe商品・価格の作成を開始します...\n');
  
  const createdProducts: CreatedProduct[] = [];
  
  for (const [planKey, config] of Object.entries(PRICING_CONFIG)) {
    try {
      console.log(`📦 ${config.name} を作成中...`);
      
      // 商品作成
      const product = await stripe.products.create({
        name: config.name,
        description: config.description,
        metadata: {
          plan: planKey,
          type: config.metadata?.type || 'one_time',
          ...config.metadata
        },
        // 決済完了後の自動配信設定
        features: [
          { name: '高品質PDF自動生成' },
          { name: '24時間キャンセル可能' },
          { name: 'メールサポート' }
        ]
      });
      
      // 価格作成
      const isSubscription = planKey.startsWith('subscription_');
      const priceData: Stripe.PriceCreateParams = {
        product: product.id,
        currency: config.currency,
        metadata: {
          plan: planKey,
          ...config.metadata
        }
      };
      
      if (isSubscription) {
        // サブスクリプション価格
        priceData.recurring = {
          interval: (config as any).recurring.interval
        };
        priceData.unit_amount = config.amount;
      } else {
        // 単発決済価格
        priceData.unit_amount = config.amount;
      }
      
      const price = await stripe.prices.create(priceData);
      
      createdProducts.push({
        productId: product.id,
        priceId: price.id,
        plan: planKey,
        name: config.name,
        amount: config.amount
      });
      
      console.log(`✅ ${config.name}: product_${product.id}, price_${price.id}`);
      
    } catch (error) {
      console.error(`❌ ${config.name} の作成中にエラー:`, error);
    }
  }
  
  console.log('\n🎉 商品・価格の作成が完了しました！\n');
  
  // 作成結果の表示
  console.log('📋 作成された商品一覧:');
  console.table(createdProducts);
  
  // 環境変数用の出力
  console.log('\n🔧 環境変数に追加してください:');
  createdProducts.forEach(product => {
    const envKey = `STRIPE_PRICE_${product.plan.toUpperCase()}`;
    console.log(`${envKey}=${product.priceId}`);
  });
  
  console.log('\n📌 次のステップ:');
  console.log('1. 上記の環境変数を.envファイルに追加');
  console.log('2. Webhookエンドポイントの設定');
  console.log('3. 決済フローのテスト実行');
}

async function main(): Promise<void> {
  try {
    await createStripeProducts();
  } catch (error) {
    console.error('❌ スクリプト実行エラー:', error);
    process.exit(1);
  }
}

// 実行確認
if (require.main === module) {
  console.log('⚠️  このスクリプトはStripeアカウントに実際の商品を作成します。');
  console.log('テスト環境でのみ実行してください。\n');
  
  // 本番環境での実行を防ぐ
  if (process.env.NODE_ENV === 'production') {
    console.error('❌ 本番環境では実行できません');
    process.exit(1);
  }
  
  main();
}

export { createStripeProducts };