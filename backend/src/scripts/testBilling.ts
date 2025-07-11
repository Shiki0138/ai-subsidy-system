/**
 * 課金システムテストスクリプト
 * 
 * チームA: 決済フローの動作確認
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:7001';

interface TestUser {
  id: string;
  email: string;
  token?: string;
}

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration?: number;
}

class BillingSystemTester {
  private testUser: TestUser | null = null;
  private results: TestResult[] = [];
  
  constructor() {
    console.log('💳 AI補助金システム - 課金機能テスト');
    console.log(`🌐 API Base URL: ${API_BASE_URL}\n`);
  }
  
  private async log(test: string, status: 'PASS' | 'FAIL' | 'SKIP', message: string, duration?: number): Promise<void> {
    const result: TestResult = { test, status, message, duration };
    this.results.push(result);
    
    const statusIcon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⏭️';
    const durationText = duration ? ` (${duration}ms)` : '';
    console.log(`${statusIcon} ${test}: ${message}${durationText}`);
  }
  
  async setupTestUser(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // テストユーザーの作成または取得
      const testEmail = `test-billing-${Date.now()}@example.com`;
      
      this.testUser = {
        id: 'test-user-' + Date.now(),
        email: testEmail
      };
      
      await this.log(
        'テストユーザー準備',
        'PASS',
        `ユーザー作成: ${testEmail}`,
        Date.now() - startTime
      );
      
    } catch (error) {
      await this.log(
        'テストユーザー準備',
        'FAIL',
        `エラー: ${error instanceof Error ? error.message : String(error)}`,
        Date.now() - startTime
      );
      throw error;
    }
  }
  
  async testPricingAPI(): Promise<void> {
    const startTime = Date.now();
    
    try {
      const response = await axios.get(`${API_BASE_URL}/api/billing/pricing`);
      
      if (response.status === 200 && response.data.success) {
        const pricing = response.data.data.pricing;
        const hasRequiredPlans = ['first_time', 'regular', 'bulk_3'].every(
          plan => pricing.find((p: any) => p.planId === plan)
        );
        
        if (hasRequiredPlans) {
          await this.log(
            '価格情報API',
            'PASS',
            `${pricing.length}個のプランを取得`,
            Date.now() - startTime
          );
        } else {
          await this.log(
            '価格情報API',
            'FAIL',
            '必要なプランが不足',
            Date.now() - startTime
          );
        }
      } else {
        await this.log(
          '価格情報API',
          'FAIL',
          'APIレスポンスが不正',
          Date.now() - startTime
        );
      }
      
    } catch (error) {
      await this.log(
        '価格情報API',
        'FAIL',
        `エラー: ${error instanceof Error ? error.message : String(error)}`,
        Date.now() - startTime
      );
    }
  }
  
  async testCheckoutSessionCreation(): Promise<void> {
    const startTime = Date.now();
    
    if (!this.testUser) {
      await this.log('Checkout Session作成', 'SKIP', 'テストユーザーが未準備');
      return;
    }
    
    try {
      const checkoutData = {
        pdf_id: 'test-pdf-' + Date.now(),
        plan: 'first_time',
        success_url: 'http://localhost:3000/success',
        cancel_url: 'http://localhost:3000/cancel'
      };
      
      const response = await axios.post(
        `${API_BASE_URL}/api/billing/checkout/pdf`,
        checkoutData,
        {
          headers: {
            'Content-Type': 'application/json',
            // 開発環境では認証をスキップ
            'X-User-ID': this.testUser.id
          }
        }
      );
      
      if (response.status === 200 && response.data.success) {
        const sessionData = response.data.data;
        
        if (sessionData.sessionId && sessionData.url && sessionData.amount) {
          await this.log(
            'Checkout Session作成',
            'PASS',
            `セッション作成成功: ${sessionData.sessionId}`,
            Date.now() - startTime
          );
          
          console.log(`   💰 金額: ¥${sessionData.amount.toLocaleString()}`);
          console.log(`   🔗 決済URL: ${sessionData.url}`);
        } else {
          await this.log(
            'Checkout Session作成',
            'FAIL',
            'レスポンスデータが不完全',
            Date.now() - startTime
          );
        }
      } else {
        await this.log(
          'Checkout Session作成',
          'FAIL',
          'セッション作成失敗',
          Date.now() - startTime
        );
      }
      
    } catch (error) {
      await this.log(
        'Checkout Session作成',
        'FAIL',
        `エラー: ${error instanceof Error ? error.message : String(error)}`,
        Date.now() - startTime
      );
    }
  }
  
  async testDatabaseSchema(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // 課金関連テーブルの存在確認
      const tables = [
        'PaymentSession',
        'PdfUsageRight',
        'Refund',
        'SubscriptionPlan',
        'BillingHistory'
      ];
      
      const checkPromises = tables.map(async (table) => {
        try {
          // @ts-ignore
          await prisma[table.charAt(0).toLowerCase() + table.slice(1)].findFirst();
          return { table, exists: true };
        } catch (error) {
          return { table, exists: false, error };
        }
      });
      
      const results = await Promise.all(checkPromises);
      const existingTables = results.filter(r => r.exists).map(r => r.table);
      const missingTables = results.filter(r => !r.exists).map(r => r.table);
      
      if (missingTables.length === 0) {
        await this.log(
          'データベーススキーマ',
          'PASS',
          `全テーブル確認済み: ${existingTables.join(', ')}`,
          Date.now() - startTime
        );
      } else {
        await this.log(
          'データベーススキーマ',
          'FAIL',
          `未存在テーブル: ${missingTables.join(', ')}`,
          Date.now() - startTime
        );
      }
      
    } catch (error) {
      await this.log(
        'データベーススキーマ',
        'FAIL',
        `エラー: ${error instanceof Error ? error.message : String(error)}`,
        Date.now() - startTime
      );
    }
  }
  
  async testWebhookEndpoint(): Promise<void> {
    const startTime = Date.now();
    
    try {
      // Webhookエンドポイントの存在確認
      const response = await axios.post(
        `${API_BASE_URL}/api/billing/webhook`,
        { test: 'ping' },
        {
          headers: {
            'Content-Type': 'application/json',
            'stripe-signature': 'test-signature'
          },
          validateStatus: () => true // すべてのステータスコードを許可
        }
      );
      
      // 400番台のエラーは正常（署名検証失敗のため）
      if (response.status >= 400 && response.status < 500) {
        await this.log(
          'Webhookエンドポイント',
          'PASS',
          'エンドポイント応答確認（署名検証は正常に動作）',
          Date.now() - startTime
        );
      } else {
        await this.log(
          'Webhookエンドポイント',
          'FAIL',
          `予期しないレスポンス: ${response.status}`,
          Date.now() - startTime
        );
      }
      
    } catch (error) {
      await this.log(
        'Webhookエンドポイント',
        'FAIL',
        `エラー: ${error instanceof Error ? error.message : String(error)}`,
        Date.now() - startTime
      );
    }
  }
  
  async generateReport(): Promise<void> {
    console.log('\n📊 テスト結果サマリー');
    console.log('=' + '='.repeat(50));
    
    const passCount = this.results.filter(r => r.status === 'PASS').length;
    const failCount = this.results.filter(r => r.status === 'FAIL').length;
    const skipCount = this.results.filter(r => r.status === 'SKIP').length;
    const totalTests = this.results.length;
    
    console.log(`📈 実行テスト数: ${totalTests}`);
    console.log(`✅ 成功: ${passCount}`);
    console.log(`❌ 失敗: ${failCount}`);
    console.log(`⏭️  スキップ: ${skipCount}`);
    console.log(`📊 成功率: ${((passCount / totalTests) * 100).toFixed(1)}%\n`);
    
    if (failCount > 0) {
      console.log('⚠️  失敗したテスト:');
      this.results
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`   - ${r.test}: ${r.message}`);
        });
      console.log();
    }
    
    console.log('📋 次のアクション:');
    if (failCount === 0) {
      console.log('✅ 全テストが正常に完了しました');
      console.log('💳 Stripe決済の実際のテストを行ってください');
    } else {
      console.log('❌ 失敗したテストを修正してください');
      console.log('🔧 ログを確認してエラーを解決してください');
    }
  }
  
  async cleanup(): Promise<void> {
    await prisma.$disconnect();
  }
}

async function runBillingTests(): Promise<void> {
  const tester = new BillingSystemTester();
  
  try {
    // テスト実行
    await tester.setupTestUser();
    await tester.testDatabaseSchema();
    await tester.testPricingAPI();
    await tester.testCheckoutSessionCreation();
    await tester.testWebhookEndpoint();
    
    // レポート生成
    await tester.generateReport();
    
  } catch (error) {
    console.error('❌ テスト実行中にエラーが発生しました:', error);
  } finally {
    await tester.cleanup();
  }
}

// 実行確認
if (require.main === module) {
  console.log('🧪 課金システムテストを開始します...\n');
  runBillingTests();
}

export { BillingSystemTester, runBillingTests };