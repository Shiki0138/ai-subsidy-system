/**
 * E2E Test Suite: Complete User Journey
 * チームD: 新機能統合テスト
 * 作成日: 2025-06-20
 */

import { test, expect, Page } from '@playwright/test';
import { TestDataBuilder } from '../utils/test-data-builder';
import { APIClient } from '../utils/api-client';

interface TestData {
  companyInfo: {
    name: string;
    businessType: string;
    employeeCount: number;
    annualRevenue: number;
  };
  projectInfo: {
    name: string;
    description: string;
    budget: number;
    duration: number;
  };
  guideline: {
    name: string;
    filePath: string;
    expectedScore: number;
  };
}

class UserJourneyHelper {
  constructor(private page: Page, private api: APIClient) {}

  async importGuideline(guidelineData: any) {
    // 募集要項インポート操作
    await this.page.goto('/admin/guidelines/import');
    await this.page.setInputFiles('input[type="file"]', guidelineData.filePath);
    await this.page.click('button[data-testid="import-button"]');
    
    // 解析完了を待機
    await this.page.waitForSelector('[data-testid="parsing-complete"]', { timeout: 60000 });
  }

  async fillCompanyInfo(companyData: any) {
    await this.page.goto('/register');
    await this.page.fill('[data-testid="company-name"]', companyData.name);
    await this.page.selectOption('[data-testid="business-type"]', companyData.businessType);
    await this.page.fill('[data-testid="employee-count"]', companyData.employeeCount.toString());
    await this.page.fill('[data-testid="annual-revenue"]', companyData.annualRevenue.toString());
    await this.page.click('[data-testid="save-company-info"]');
  }

  async checkMatching() {
    await this.page.goto('/matching');
    await this.page.click('[data-testid="start-matching"]');
    await this.page.waitForSelector('[data-testid="matching-results"]');
    
    const scoreElement = await this.page.locator('[data-testid="matching-score"]');
    const score = await scoreElement.textContent();
    return parseInt(score || '0');
  }

  async generateApplication() {
    await this.page.click('[data-testid="generate-application"]');
    await this.page.waitForSelector('[data-testid="generation-complete"]', { timeout: 120000 });
    
    const completenessElement = await this.page.locator('[data-testid="completeness-rate"]');
    const completeness = await completenessElement.textContent();
    return parseInt(completeness || '0');
  }

  async executeAutoFill() {
    // 新機能: フォーム自動入力
    await this.page.click('[data-testid="auto-fill-button"]');
    
    // 提案内容の確認
    await this.page.waitForSelector('[data-testid="auto-fill-suggestions"]');
    
    // 差分表示の確認
    const diffViewer = await this.page.locator('[data-testid="diff-viewer"]');
    await expect(diffViewer).toBeVisible();
    
    // 一括適用
    await this.page.click('[data-testid="apply-all-suggestions"]');
    await this.page.waitForSelector('[data-testid="auto-fill-complete"]');
    
    // 完了率の取得
    const completionElement = await this.page.locator('[data-testid="form-completion-rate"]');
    const completionRate = await completionElement.textContent();
    return parseInt(completionRate || '0');
  }

  async generateAttachments() {
    // 新機能: 添付書類作成
    await this.page.click('[data-testid="generate-attachments"]');
    
    // 必要書類の選択
    await this.page.check('[data-testid="document-type-estimate"]');
    await this.page.check('[data-testid="document-type-business-plan"]');
    await this.page.check('[data-testid="document-type-budget"]');
    await this.page.check('[data-testid="document-type-organization"]');
    await this.page.check('[data-testid="document-type-schedule"]');
    
    await this.page.click('[data-testid="start-generation"]');
    
    // 生成完了を待機
    await this.page.waitForSelector('[data-testid="documents-generated"]', { timeout: 180000 });
    
    // 生成された書類数の確認
    const documentList = await this.page.locator('[data-testid="generated-document"]');
    return await documentList.count();
  }

  async submitApplication() {
    await this.page.click('[data-testid="submit-application"]');
    await this.page.waitForSelector('[data-testid="submission-complete"]');
    
    const statusElement = await this.page.locator('[data-testid="submission-status"]');
    const status = await statusElement.textContent();
    return { status };
  }

  async createProgressTracking(projectData: any) {
    // 新機能: 進捗管理
    await this.page.goto('/projects/progress');
    await this.page.click('[data-testid="create-progress-tracking"]');
    
    // プロジェクト基本情報
    await this.page.fill('[data-testid="project-name"]', projectData.name);
    await this.page.fill('[data-testid="start-date"]', '2025-07-01');
    await this.page.fill('[data-testid="end-date"]', '2026-06-30');
    
    // マイルストーン設定
    await this.page.click('[data-testid="add-milestone"]');
    await this.page.fill('[data-testid="milestone-0-title"]', '要件定義');
    await this.page.fill('[data-testid="milestone-0-due"]', '2025-08-31');
    
    await this.page.click('[data-testid="add-milestone"]');
    await this.page.fill('[data-testid="milestone-1-title"]', 'システム開発');
    await this.page.fill('[data-testid="milestone-1-due"]', '2026-03-31');
    
    await this.page.click('[data-testid="add-milestone"]');
    await this.page.fill('[data-testid="milestone-2-title"]', 'テスト・検証');
    await this.page.fill('[data-testid="milestone-2-due"]', '2026-05-31');
    
    await this.page.click('[data-testid="add-milestone"]');
    await this.page.fill('[data-testid="milestone-3-title"]', '本格運用開始');
    await this.page.fill('[data-testid="milestone-3-due"]', '2026-06-30');
    
    await this.page.click('[data-testid="save-progress-tracking"]');
    
    // マイルストーン数の確認
    const milestones = await this.page.locator('[data-testid="milestone-item"]');
    return { milestones: await milestones.count() };
  }

  async generateResultReport() {
    // 新機能: 結果報告
    await this.page.goto('/reports/create');
    
    // 報告書ウィザード
    await this.page.selectOption('[data-testid="report-type"]', 'final-report');
    await this.page.fill('[data-testid="report-period"]', '2025-07-01 to 2026-06-30');
    
    // KPI入力
    await this.page.fill('[data-testid="kpi-productivity"]', '150');
    await this.page.fill('[data-testid="kpi-efficiency"]', '130');
    await this.page.fill('[data-testid="kpi-cost-reduction"]', '20');
    
    // AI自動生成
    await this.page.click('[data-testid="generate-narrative"]');
    await this.page.waitForSelector('[data-testid="narrative-generated"]', { timeout: 60000 });
    
    // 財務情報
    await this.page.fill('[data-testid="actual-expenses"]', '8500000');
    await this.page.fill('[data-testid="budget-variance"]', '-1500000');
    
    await this.page.click('[data-testid="save-report"]');
    
    // セクション数の確認
    const sections = await this.page.locator('[data-testid="report-section"]');
    return { sections: await sections.count() };
  }
}

test.describe('補助金申請完全フローテスト', () => {
  let testData: TestData;
  let helper: UserJourneyHelper;
  let api: APIClient;

  test.beforeEach(async ({ page }) => {
    api = new APIClient();
    helper = new UserJourneyHelper(page, api);
    
    testData = TestDataBuilder.createCompleteJourneyData();
    
    // 認証
    await page.goto('/login');
    await page.fill('[data-testid="email"]', 'test@example.com');
    await page.fill('[data-testid="password"]', 'testpass123');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('/dashboard');
  });

  test('新規募集要項の取り込みから報告書提出まで', async ({ page }) => {
    console.log('🚀 完全ユーザージャーニーテスト開始');
    
    // 1. 募集要項インポート
    console.log('📄 募集要項インポート中...');
    await helper.importGuideline(testData.guideline);
    
    // インポート成功の確認
    const importStatus = await page.locator('[data-testid="import-status"]').textContent();
    expect(importStatus).toBe('parsed');
    
    // 2. 企業情報入力
    console.log('🏢 企業情報入力中...');
    await helper.fillCompanyInfo(testData.companyInfo);
    
    // 3. マッチング確認
    console.log('🎯 マッチング実行中...');
    const matchingScore = await helper.checkMatching();
    expect(matchingScore).toBeGreaterThan(70);
    console.log(`✅ マッチングスコア: ${matchingScore}%`);
    
    // 4. 申請書自動生成
    console.log('📝 申請書自動生成中...');
    const applicationCompleteness = await helper.generateApplication();
    expect(applicationCompleteness).toBeGreaterThan(80);
    console.log(`✅ 申請書完成度: ${applicationCompleteness}%`);
    
    // 5. フォーム自動入力（新機能）
    console.log('🤖 フォーム自動入力実行中...');
    const formCompletionRate = await helper.executeAutoFill();
    expect(formCompletionRate).toBeGreaterThan(90);
    console.log(`✅ フォーム完了率: ${formCompletionRate}%`);
    
    // 6. 添付書類作成（新機能）
    console.log('📎 添付書類生成中...');
    const documentCount = await helper.generateAttachments();
    expect(documentCount).toBe(5);
    console.log(`✅ 生成書類数: ${documentCount}件`);
    
    // 7. 申請提出
    console.log('📤 申請提出中...');
    const submission = await helper.submitApplication();
    expect(submission.status).toBe('submitted');
    console.log(`✅ 申請状況: ${submission.status}`);
    
    // 8. 進捗管理（新機能）
    console.log('📊 進捗管理作成中...');
    const project = await helper.createProgressTracking(testData.projectInfo);
    expect(project.milestones).toBe(4);
    console.log(`✅ マイルストーン数: ${project.milestones}件`);
    
    // 9. 結果報告（新機能）
    console.log('📋 結果報告書作成中...');
    const report = await helper.generateResultReport();
    expect(report.sections).toBe(6);
    console.log(`✅ 報告書セクション数: ${report.sections}件`);
    
    console.log('🎉 完全ユーザージャーニーテスト完了');
  });

  test('複数補助金の並行管理', async ({ page }) => {
    console.log('🔄 複数補助金並行管理テスト開始');
    
    // 1つ目の補助金申請
    await helper.importGuideline({
      name: 'ものづくり補助金',
      filePath: './test-data/monodukuri-guideline.pdf',
      expectedScore: 85
    });
    
    await helper.fillCompanyInfo(testData.companyInfo);
    const score1 = await helper.checkMatching();
    expect(score1).toBeGreaterThan(70);
    
    // 2つ目の補助金申請
    await helper.importGuideline({
      name: 'IT導入補助金',
      filePath: './test-data/it-introduction-guideline.pdf',
      expectedScore: 90
    });
    
    const score2 = await helper.checkMatching();
    expect(score2).toBeGreaterThan(70);
    
    // 両方の進捗管理が作成できることを確認
    const project1 = await helper.createProgressTracking({
      name: 'ものづくりDXプロジェクト',
      description: '製造工程のデジタル化'
    });
    
    const project2 = await helper.createProgressTracking({
      name: 'ITシステム導入プロジェクト',
      description: '基幹システムの刷新'
    });
    
    expect(project1.milestones).toBeGreaterThan(0);
    expect(project2.milestones).toBeGreaterThan(0);
    
    console.log('✅ 複数補助金並行管理テスト完了');
  });

  test('エラー回復シナリオ', async ({ page }) => {
    console.log('🔧 エラー回復シナリオテスト開始');
    
    // ネットワークエラーをシミュレート
    await page.route('**/api/auto-fill/suggestions', route => {
      route.abort('failed');
    });
    
    // 自動入力実行（エラーが発生するはず）
    await page.click('[data-testid="auto-fill-button"]');
    
    // エラーメッセージの確認
    const errorMessage = await page.locator('[data-testid="error-message"]');
    await expect(errorMessage).toBeVisible();
    
    // ネットワーク復旧をシミュレート
    await page.unroute('**/api/auto-fill/suggestions');
    
    // リトライボタンクリック
    await page.click('[data-testid="retry-auto-fill"]');
    
    // 成功確認
    await page.waitForSelector('[data-testid="auto-fill-complete"]');
    const completionRate = await page.locator('[data-testid="form-completion-rate"]').textContent();
    expect(parseInt(completionRate || '0')).toBeGreaterThan(0);
    
    console.log('✅ エラー回復シナリオテスト完了');
  });

  test('パフォーマンス要件確認', async ({ page }) => {
    console.log('⚡ パフォーマンス要件確認テスト開始');
    
    // 申請書生成時間測定
    const startTime = Date.now();
    await helper.generateApplication();
    const generationTime = Date.now() - startTime;
    
    expect(generationTime).toBeLessThan(30000); // 30秒以内
    console.log(`✅ 申請書生成時間: ${generationTime}ms`);
    
    // フォーム自動入力時間測定
    const autoFillStart = Date.now();
    const completionRate = await helper.executeAutoFill();
    const autoFillTime = Date.now() - autoFillStart;
    
    expect(autoFillTime).toBeLessThan(10000); // 10秒以内
    expect(completionRate).toBeGreaterThan(90);
    console.log(`✅ 自動入力時間: ${autoFillTime}ms`);
    
    // 書類生成時間測定
    const docGenStart = Date.now();
    const documentCount = await helper.generateAttachments();
    const docGenTime = Date.now() - docGenStart;
    
    expect(docGenTime).toBeLessThan(60000); // 60秒以内
    expect(documentCount).toBeGreaterThan(0);
    console.log(`✅ 書類生成時間: ${docGenTime}ms`);
    
    console.log('✅ パフォーマンス要件確認テスト完了');
  });

  test('アクセシビリティ要件確認', async ({ page }) => {
    console.log('♿ アクセシビリティ要件確認テスト開始');
    
    // キーボードナビゲーションテスト
    await page.goto('/applications/new');
    
    // Tabキーでの移動確認
    await page.keyboard.press('Tab');
    let focusedElement = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focusedElement).toBeTruthy();
    
    // Enterキーでの操作確認
    await page.keyboard.press('Enter');
    
    // スクリーンリーダー対応確認（aria-label等の存在）
    const autoFillButton = await page.locator('[data-testid="auto-fill-button"]');
    const ariaLabel = await autoFillButton.getAttribute('aria-label');
    expect(ariaLabel).toBeTruthy();
    
    // 色彩コントラスト確認（視覚的確認は手動）
    const buttons = await page.locator('button');
    const buttonCount = await buttons.count();
    expect(buttonCount).toBeGreaterThan(0);
    
    console.log('✅ アクセシビリティ要件確認テスト完了');
  });
});

test.describe('API統合テスト', () => {
  let api: APIClient;

  test.beforeEach(async () => {
    api = new APIClient();
    await api.authenticate('test@example.com', 'testpass123');
  });

  test('進捗管理API', async () => {
    // プロジェクト作成
    const createResponse = await api.post('/api/projects/test-app-1/progress', {
      projectName: 'DXプロジェクト',
      startDate: '2025-07-01',
      endDate: '2026-06-30',
      milestones: [
        { title: '要件定義', dueDate: '2025-08-31' },
        { title: 'システム開発', dueDate: '2026-03-31' }
      ]
    });
    
    expect(createResponse.status).toBe(201);
    expect(createResponse.data.overallProgress).toBe(0);
    
    // 進捗取得
    const getResponse = await api.get('/api/projects/test-app-1/progress');
    expect(getResponse.status).toBe(200);
    expect(getResponse.data.projectName).toBe('DXプロジェクト');
  });

  test('結果報告API', async () => {
    const reportResponse = await api.post('/api/applications/test-app-1/reports', {
      reportType: 'final-report',
      reportPeriod: '2025-07-01 to 2026-06-30',
      kpiAchievements: {
        productivity: 150,
        efficiency: 130
      },
      narrative: 'プロジェクトは計画通り進行し、目標を上回る成果を達成しました。'
    });
    
    expect(reportResponse.status).toBe(201);
    expect(reportResponse.data.reportType).toBe('final-report');
  });

  test('添付書類生成API', async () => {
    const docResponse = await api.post('/api/documents/generate', {
      documentType: 'business-plan',
      templateId: 'template-001',
      data: {
        companyName: '株式会社テスト',
        projectName: 'DXプロジェクト'
      }
    });
    
    expect(docResponse.status).toBe(201);
    expect(docResponse.data.documentUrl).toContain('.pdf');
  });
});