/**
 * UI/UX Test Suite for New Features
 * 新機能のユーザーインターフェーステスト
 * 作成日: 2025-06-20
 */

import { test, expect, Page } from '@playwright/test';
import { TestDataBuilder } from '../utils/test-data-builder';

class UITestHelper {
  constructor(private page: Page) {}

  async waitForElementVisible(selector: string, timeout: number = 10000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout });
  }

  async checkResponsiveness(breakpoints: { name: string; width: number; height: number }[]) {
    const results = [];
    
    for (const breakpoint of breakpoints) {
      await this.page.setViewportSize({ width: breakpoint.width, height: breakpoint.height });
      await this.page.waitForTimeout(500); // レンダリング待機
      
      // スクロールバーの確認
      const hasHorizontalScroll = await this.page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth;
      });

      // 要素の重複確認
      const hasOverlapping = await this.page.evaluate(() => {
        const elements = document.querySelectorAll('[data-testid]');
        const rects = Array.from(elements).map(el => el.getBoundingClientRect());
        
        for (let i = 0; i < rects.length; i++) {
          for (let j = i + 1; j < rects.length; j++) {
            const rect1 = rects[i];
            const rect2 = rects[j];
            
            // 重複チェック
            if (rect1.left < rect2.right && rect2.left < rect1.right &&
                rect1.top < rect2.bottom && rect2.top < rect1.bottom) {
              return true;
            }
          }
        }
        return false;
      });

      results.push({
        breakpoint: breakpoint.name,
        hasHorizontalScroll,
        hasOverlapping
      });
    }
    
    return results;
  }

  async testAccessibility() {
    // キーボードナビゲーション
    const focusableElements = await this.page.locator('[tabindex], button, input, select, textarea, a[href]').all();
    
    let keyboardNavigationScore = 0;
    for (let i = 0; i < Math.min(focusableElements.length, 10); i++) {
      await this.page.keyboard.press('Tab');
      const focusedElement = await this.page.evaluate(() => document.activeElement?.tagName);
      if (focusedElement) keyboardNavigationScore++;
    }

    // ARIA属性の確認
    const ariaElements = await this.page.locator('[aria-label], [aria-describedby], [role]').count();
    
    // カラーコントラスト（簡易チェック）
    const contrastIssues = await this.page.evaluate(() => {
      const elements = document.querySelectorAll('*');
      let issues = 0;
      
      Array.from(elements).forEach(el => {
        const styles = window.getComputedStyle(el);
        const bgColor = styles.backgroundColor;
        const textColor = styles.color;
        
        // 基本的な白黒チェック
        if (bgColor === 'rgb(255, 255, 255)' && textColor === 'rgb(255, 255, 255)') {
          issues++;
        }
      });
      
      return issues;
    });

    return {
      keyboardNavigationScore: (keyboardNavigationScore / 10) * 100,
      ariaElementsCount: ariaElements,
      contrastIssues
    };
  }

  async testPerformance() {
    // ページロード時間
    const loadStartTime = Date.now();
    await this.page.reload();
    await this.page.waitForLoadState('networkidle');
    const loadTime = Date.now() - loadStartTime;

    // First Contentful Paint
    const performanceMetrics = await this.page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        loadComplete: navigation.loadEventEnd - navigation.loadEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });

    return {
      pageLoadTime: loadTime,
      ...performanceMetrics
    };
  }
}

test.describe('自動入力機能 UI/UXテスト', () => {
  let helper: UITestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new UITestHelper(page);
    await page.goto('/applications/new');
  });

  test('自動入力ボタンの表示と操作', async ({ page }) => {
    // 自動入力ボタンの存在確認
    const autoFillButton = page.locator('[data-testid="auto-fill-button"]');
    await expect(autoFillButton).toBeVisible();
    
    // ボタンのラベルとアイコン確認
    await expect(autoFillButton).toHaveText(/自動入力/);
    const icon = autoFillButton.locator('svg, .icon');
    await expect(icon).toBeVisible();

    // ホバー効果の確認
    await autoFillButton.hover();
    const buttonColor = await autoFillButton.evaluate(el => 
      window.getComputedStyle(el).backgroundColor
    );
    expect(buttonColor).not.toBe('initial');
  });

  test('提案内容表示の UI 確認', async ({ page }) => {
    // 自動入力実行
    await page.click('[data-testid="auto-fill-button"]');
    
    // ローディング表示の確認
    const loadingIndicator = page.locator('[data-testid="loading-suggestions"]');
    await expect(loadingIndicator).toBeVisible();
    
    // 提案内容の表示確認
    await helper.waitForElementVisible('[data-testid="auto-fill-suggestions"]');
    
    // 提案項目の構造確認
    const suggestionItems = page.locator('[data-testid="suggestion-item"]');
    const itemCount = await suggestionItems.count();
    expect(itemCount).toBeGreaterThan(0);
    
    // 各提案項目の要素確認
    const firstItem = suggestionItems.first();
    await expect(firstItem.locator('[data-testid="field-label"]')).toBeVisible();
    await expect(firstItem.locator('[data-testid="suggested-value"]')).toBeVisible();
    await expect(firstItem.locator('[data-testid="confidence-score"]')).toBeVisible();
  });

  test('差分表示の視覚的確認', async ({ page }) => {
    // 既存データの入力
    await page.fill('[data-testid="company-name"]', '既存企業名');
    await page.fill('[data-testid="project-name"]', '既存プロジェクト名');
    
    // 自動入力実行
    await page.click('[data-testid="auto-fill-button"]');
    await helper.waitForElementVisible('[data-testid="diff-viewer"]');
    
    // 差分表示の要素確認
    const diffViewer = page.locator('[data-testid="diff-viewer"]');
    await expect(diffViewer).toBeVisible();
    
    // 変更前（赤）と変更後（緑）の表示確認
    const deletions = diffViewer.locator('.diff-deletion');
    const additions = diffViewer.locator('.diff-addition');
    
    await expect(deletions).toHaveCount(2); // 2つのフィールド
    await expect(additions).toHaveCount(2);
    
    // 色の確認（スタイルクラスの存在確認）
    await expect(deletions.first()).toHaveClass(/deletion/);
    await expect(additions.first()).toHaveClass(/addition/);
  });

  test('適用ボタンの状態管理', async ({ page }) => {
    await page.click('[data-testid="auto-fill-button"]');
    await helper.waitForElementVisible('[data-testid="auto-fill-suggestions"]');
    
    // 個別選択チェックボックス
    const checkboxes = page.locator('[data-testid="suggestion-checkbox"]');
    const applyButton = page.locator('[data-testid="apply-suggestions"]');
    
    // 初期状態では無効
    await expect(applyButton).toBeDisabled();
    
    // チェックボックス選択で有効化
    await checkboxes.first().check();
    await expect(applyButton).toBeEnabled();
    
    // 全選択ボタンの確認
    const selectAllButton = page.locator('[data-testid="select-all-suggestions"]');
    await selectAllButton.click();
    
    const checkedCount = await checkboxes.evaluateAll(
      elements => elements.filter(el => (el as HTMLInputElement).checked).length
    );
    expect(checkedCount).toBe(await checkboxes.count());
  });

  test('アニメーション効果の確認', async ({ page }) => {
    await page.click('[data-testid="auto-fill-button"]');
    await helper.waitForElementVisible('[data-testid="auto-fill-suggestions"]');
    
    // 選択した提案を適用
    await page.check('[data-testid="suggestion-checkbox"]');
    await page.click('[data-testid="apply-suggestions"]');
    
    // アニメーション要素の確認
    const animatedFields = page.locator('.auto-fill-animation');
    await expect(animatedFields).toHaveCount(1, { timeout: 5000 });
    
    // アニメーション完了の確認
    await page.waitForSelector('[data-testid="auto-fill-complete"]', { timeout: 10000 });
    
    // 最終的な値の確認
    const updatedField = page.locator('[data-testid="company-name"]');
    const fieldValue = await updatedField.inputValue();
    expect(fieldValue).not.toBe('');
  });
});

test.describe('進捗管理ダッシュボード UI/UXテスト', () => {
  let helper: UITestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new UITestHelper(page);
    await page.goto('/projects/progress');
  });

  test('ダッシュボードレイアウトの確認', async ({ page }) => {
    // 主要コンポーネントの存在確認
    await expect(page.locator('[data-testid="project-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="milestone-timeline"]')).toBeVisible();
    await expect(page.locator('[data-testid="progress-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="task-list"]')).toBeVisible();
    
    // グリッドレイアウトの確認
    const dashboard = page.locator('[data-testid="progress-dashboard"]');
    const gridColumns = await dashboard.evaluate(el => 
      window.getComputedStyle(el).gridTemplateColumns
    );
    expect(gridColumns).toContain('fr'); // CSS Grid使用確認
  });

  test('プロジェクト概要カードのインタラクション', async ({ page }) => {
    const overviewCard = page.locator('[data-testid="project-overview"]');
    
    // カード内の要素確認
    await expect(overviewCard.locator('[data-testid="project-name"]')).toBeVisible();
    await expect(overviewCard.locator('[data-testid="progress-percentage"]')).toBeVisible();
    await expect(overviewCard.locator('[data-testid="next-milestone"]')).toBeVisible();
    
    // 編集ボタンの確認
    const editButton = overviewCard.locator('[data-testid="edit-project"]');
    await editButton.click();
    
    // 編集モードの確認
    await expect(page.locator('[data-testid="project-edit-modal"]')).toBeVisible();
  });

  test('マイルストーンタイムラインの視覚化', async ({ page }) => {
    const timeline = page.locator('[data-testid="milestone-timeline"]');
    
    // タイムライン要素の確認
    const milestones = timeline.locator('[data-testid="milestone-item"]');
    const milestoneCount = await milestones.count();
    expect(milestoneCount).toBeGreaterThan(0);
    
    // 各マイルストーンの要素確認
    const firstMilestone = milestones.first();
    await expect(firstMilestone.locator('[data-testid="milestone-title"]')).toBeVisible();
    await expect(firstMilestone.locator('[data-testid="milestone-date"]')).toBeVisible();
    await expect(firstMilestone.locator('[data-testid="milestone-status"]')).toBeVisible();
    
    // ステータス表示の色分け確認
    const statusElement = firstMilestone.locator('[data-testid="milestone-status"]');
    const statusClass = await statusElement.getAttribute('class');
    expect(statusClass).toMatch(/(completed|in-progress|pending)/);
  });

  test('進捗チャートの機能確認', async ({ page }) => {
    const progressChart = page.locator('[data-testid="progress-chart"]');
    
    // チャートの存在確認
    await expect(progressChart).toBeVisible();
    
    // チャートライブラリの要素確認（Recharts使用想定）
    const chartContainer = progressChart.locator('.recharts-wrapper');
    await expect(chartContainer).toBeVisible();
    
    // データポイントの確認
    const dataPoints = progressChart.locator('.recharts-dot');
    const pointCount = await dataPoints.count();
    expect(pointCount).toBeGreaterThan(0);
    
    // ツールチップの確認
    await dataPoints.first().hover();
    const tooltip = page.locator('.recharts-tooltip-wrapper');
    await expect(tooltip).toBeVisible({ timeout: 2000 });
  });

  test('タスクリストの操作性確認', async ({ page }) => {
    const taskList = page.locator('[data-testid="task-list"]');
    
    // タスク項目の確認
    const tasks = taskList.locator('[data-testid="task-item"]');
    const taskCount = await tasks.count();
    expect(taskCount).toBeGreaterThan(0);
    
    // 完了チェックボックスの操作
    const firstTaskCheckbox = tasks.first().locator('[data-testid="task-checkbox"]');
    await firstTaskCheckbox.check();
    
    // タスク完了時のスタイル変更確認
    const completedTask = tasks.first();
    await expect(completedTask).toHaveClass(/completed/);
    
    // 新規タスク追加ボタン
    const addTaskButton = taskList.locator('[data-testid="add-task"]');
    await addTaskButton.click();
    
    // タスク追加フォームの表示確認
    await expect(page.locator('[data-testid="new-task-form"]')).toBeVisible();
  });
});

test.describe('結果報告ウィザード UI/UXテスト', () => {
  let helper: UITestHelper;

  test.beforeEach(async ({ page }) => {
    helper = new UITestHelper(page);
    await page.goto('/reports/create');
  });

  test('ウィザードステップの進行確認', async ({ page }) => {
    // ステップインジケーターの確認
    const stepIndicator = page.locator('[data-testid="wizard-steps"]');
    await expect(stepIndicator).toBeVisible();
    
    const steps = stepIndicator.locator('[data-testid="step-item"]');
    const stepCount = await steps.count();
    expect(stepCount).toBe(4); // 想定ステップ数
    
    // 現在ステップのハイライト確認
    const activeStep = steps.locator('.active').first();
    await expect(activeStep).toBeVisible();
    
    // 次へボタンでの進行
    await page.click('[data-testid="next-step"]');
    
    // ステップ進行の確認
    const newActiveStep = stepIndicator.locator('.active').nth(1);
    await expect(newActiveStep).toBeVisible();
  });

  test('KPI入力フォームの使いやすさ', async ({ page }) => {
    // 基本情報ステップを完了
    await page.selectOption('[data-testid="report-type"]', 'final-report');
    await page.fill('[data-testid="report-period"]', '2025-07-01 to 2026-06-30');
    await page.click('[data-testid="next-step"]');
    
    // KPI入力画面に移動
    await helper.waitForElementVisible('[data-testid="kpi-input-section"]');
    
    // 数値入力フィールドの確認
    const kpiFields = page.locator('[data-testid^="kpi-"]');
    const fieldCount = await kpiFields.count();
    expect(fieldCount).toBeGreaterThan(0);
    
    // 入力値のバリデーション確認
    const productivityField = page.locator('[data-testid="kpi-productivity"]');
    await productivityField.fill('-10'); // 負の値
    await page.click('[data-testid="next-step"]');
    
    // エラーメッセージの表示確認
    const errorMessage = page.locator('[data-testid="validation-error"]');
    await expect(errorMessage).toBeVisible();
    
    // 正しい値で再入力
    await productivityField.fill('150');
    
    // 進捗率の視覚的表示確認
    const progressIndicator = page.locator('[data-testid="improvement-indicator"]');
    await expect(progressIndicator).toBeVisible();
  });

  test('AI自動生成機能の UX', async ({ page }) => {
    // KPIステップまで進行
    await page.selectOption('[data-testid="report-type"]', 'final-report');
    await page.click('[data-testid="next-step"]');
    await page.fill('[data-testid="kpi-productivity"]', '150');
    await page.fill('[data-testid="kpi-efficiency"]', '130');
    await page.click('[data-testid="next-step"]');
    
    // AI生成ボタンの確認
    const generateButton = page.locator('[data-testid="generate-narrative"]');
    await expect(generateButton).toBeVisible();
    await expect(generateButton).toHaveText(/AI.*生成/);
    
    // 生成実行
    await generateButton.click();
    
    // ローディング状態の確認
    const loadingSpinner = page.locator('[data-testid="ai-generating"]');
    await expect(loadingSpinner).toBeVisible();
    
    // 進捗表示の確認
    const progressText = page.locator('[data-testid="generation-progress"]');
    await expect(progressText).toBeVisible();
    
    // 生成完了の確認
    await helper.waitForElementVisible('[data-testid="narrative-generated"]', 30000);
    
    // 生成されたテキストの確認
    const generatedText = page.locator('[data-testid="generated-narrative"]');
    const textContent = await generatedText.textContent();
    expect(textContent).toBeTruthy();
    expect(textContent!.length).toBeGreaterThan(100);
    
    // 編集可能性の確認
    await expect(generatedText).toBeEditable();
  });

  test('プレビュー機能の確認', async ({ page }) => {
    // 全ステップを完了してプレビューまで進行
    await page.selectOption('[data-testid="report-type"]', 'final-report');
    await page.click('[data-testid="next-step"]');
    await page.fill('[data-testid="kpi-productivity"]', '150');
    await page.click('[data-testid="next-step"]');
    await page.click('[data-testid="generate-narrative"]');
    await helper.waitForElementVisible('[data-testid="narrative-generated"]', 30000);
    await page.click('[data-testid="next-step"]');
    
    // プレビュー画面の確認
    await helper.waitForElementVisible('[data-testid="report-preview"]');
    
    // レポートセクションの確認
    const sections = page.locator('[data-testid="report-section"]');
    const sectionCount = await sections.count();
    expect(sectionCount).toBe(6); // 想定セクション数
    
    // PDF出力ボタンの確認
    const pdfButton = page.locator('[data-testid="export-pdf"]');
    await expect(pdfButton).toBeVisible();
    
    // Word出力ボタンの確認
    const wordButton = page.locator('[data-testid="export-word"]');
    await expect(wordButton).toBeVisible();
    
    // 編集に戻るボタンの確認
    const editButton = page.locator('[data-testid="back-to-edit"]');
    await expect(editButton).toBeVisible();
  });
});

test.describe('添付書類作成 UI/UXテスト', () => {
  test('書類タイプ選択インターフェース', async ({ page }) => {
    await page.goto('/documents/create');
    
    // 書類タイプ選択画面の確認
    const documentTypes = page.locator('[data-testid="document-type-card"]');
    const typeCount = await documentTypes.count();
    expect(typeCount).toBeGreaterThan(0);
    
    // 各カードの要素確認
    const firstCard = documentTypes.first();
    await expect(firstCard.locator('[data-testid="document-icon"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="document-title"]')).toBeVisible();
    await expect(firstCard.locator('[data-testid="document-description"]')).toBeVisible();
    
    // ホバー効果の確認
    await firstCard.hover();
    const cardShadow = await firstCard.evaluate(el => 
      window.getComputedStyle(el).boxShadow
    );
    expect(cardShadow).not.toBe('none');
    
    // 選択機能の確認
    await firstCard.click();
    await expect(firstCard).toHaveClass(/selected/);
  });

  test('フィールド入力支援機能', async ({ page }) => {
    await page.goto('/documents/create');
    await page.click('[data-testid="document-type-estimate"]');
    await page.click('[data-testid="continue-button"]');
    
    // フィールド入力画面の確認
    await page.waitForSelector('[data-testid="document-fields"]');
    
    // AI支援入力ボタンの確認
    const aiAssistButton = page.locator('[data-testid="ai-assist-button"]');
    await expect(aiAssistButton).toBeVisible();
    
    // フィールドのオートコンプリート確認
    const companyField = page.locator('[data-testid="field-company-name"]');
    await companyField.fill('株式会社');
    
    // サジェスト表示の確認
    const suggestions = page.locator('[data-testid="field-suggestions"]');
    await expect(suggestions).toBeVisible({ timeout: 3000 });
    
    // サジェスト選択
    const firstSuggestion = suggestions.locator('[data-testid="suggestion-item"]').first();
    await firstSuggestion.click();
    
    // 選択値の反映確認
    const fieldValue = await companyField.inputValue();
    expect(fieldValue).toContain('株式会社');
  });
});

test.describe('レスポンシブデザインテスト', () => {
  test('各画面のレスポンシブ対応確認', async ({ page }) => {
    const helper = new UITestHelper(page);
    
    const breakpoints = [
      { name: 'Mobile', width: 375, height: 667 },
      { name: 'Tablet', width: 768, height: 1024 },
      { name: 'Desktop', width: 1920, height: 1080 }
    ];

    const pages = [
      '/applications/new',
      '/projects/progress',
      '/reports/create',
      '/documents/create'
    ];

    for (const pageUrl of pages) {
      await page.goto(pageUrl);
      
      const results = await helper.checkResponsiveness(breakpoints);
      
      for (const result of results) {
        // 水平スクロールがないことを確認
        expect(result.hasHorizontalScroll).toBeFalsy();
        
        // 要素の重複がないことを確認
        expect(result.hasOverlapping).toBeFalsy();
      }
    }
  });
});

test.describe('アクセシビリティテスト', () => {
  test('キーボードナビゲーション', async ({ page }) => {
    const helper = new UITestHelper(page);
    await page.goto('/applications/new');
    
    const accessibilityResult = await helper.testAccessibility();
    
    // キーボードナビゲーションスコア
    expect(accessibilityResult.keyboardNavigationScore).toBeGreaterThan(80);
    
    // ARIA属性の存在
    expect(accessibilityResult.ariaElementsCount).toBeGreaterThan(5);
    
    // コントラスト問題の最小化
    expect(accessibilityResult.contrastIssues).toBeLessThan(3);
  });

  test('スクリーンリーダー対応', async ({ page }) => {
    await page.goto('/projects/progress');
    
    // 主要要素のaria-label確認
    const importantElements = [
      '[data-testid="auto-fill-button"]',
      '[data-testid="add-task"]',
      '[data-testid="generate-narrative"]'
    ];

    for (const selector of importantElements) {
      const element = page.locator(selector);
      if (await element.count() > 0) {
        const ariaLabel = await element.getAttribute('aria-label');
        const title = await element.getAttribute('title');
        
        // aria-labelまたはtitleのいずれかが存在することを確認
        expect(ariaLabel || title).toBeTruthy();
      }
    }
  });
});

test.describe('パフォーマンステスト', () => {
  test('ページロード性能', async ({ page }) => {
    const helper = new UITestHelper(page);
    
    const performanceResult = await helper.testPerformance();
    
    // ページロード時間（3秒以内）
    expect(performanceResult.pageLoadTime).toBeLessThan(3000);
    
    // First Contentful Paint（1.5秒以内）
    expect(performanceResult.firstContentfulPaint).toBeLessThan(1500);
    
    // DOM Content Loaded（2秒以内）
    expect(performanceResult.domContentLoaded).toBeLessThan(2000);
  });
});