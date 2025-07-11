import { test, expect } from '@playwright/test'

test.describe('補助金申請フロー', () => {
  
  test.beforeEach(async ({ page }) => {
    // テスト用のログイン処理
    await page.goto('/auth/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Test123!')
    await page.click('button[type="submit"]')
    
    // ダッシュボードへの遷移を待機
    await page.waitForURL('/dashboard')
  })
  
  test('持続化補助金の申請書作成（実データ使用）', async ({ page }) => {
    // 新規申請開始
    await page.click('text=新規申請')
    await expect(page).toHaveURL('/dashboard/applications/new')
    
    // 補助金タイプ選択
    await page.selectOption('select[name="subsidyType"]', 'sustainability')
    await page.click('text=次へ')
    
    // 企業情報入力（法人番号から自動取得）
    await page.fill('input[name="corporateNumber"]', '1010001000001') // テスト用法人番号
    await page.click('button:has-text("企業情報を取得")')
    
    // 実データ取得の完了を待機
    await page.waitForSelector('text=企業データ取得完了', { timeout: 10000 })
    
    // 自動入力されたデータの確認
    await expect(page.locator('input[name="companyName"]')).not.toBeEmpty()
    await expect(page.locator('input[name="address"]')).not.toBeEmpty()
    
    // 追加情報の入力
    await page.fill('textarea[name="businessDescription"]', '地域密着型の小売業を営んでおります。')
    await page.fill('input[name="projectTitle"]', '新規顧客開拓のためのECサイト構築')
    
    // AI申請書生成
    await page.click('button:has-text("AI申請書生成")')
    
    // AI生成の完了を待機（最大30秒）
    await page.waitForSelector('.ai-generated-content', { timeout: 30000 })
    
    // 生成された内容の確認
    const generatedContent = await page.locator('.ai-generated-content').textContent()
    expect(generatedContent).toContain('事業概要')
    expect(generatedContent).toContain('実施計画')
    expect(generatedContent).toContain('期待される効果')
    
    // 申請書の保存
    await page.click('button:has-text("下書き保存")')
    await expect(page.locator('.toast-success')).toContainText('保存しました')
    
    // PDF出力
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('button:has-text("PDFダウンロード")')
    ])
    
    expect(download.suggestedFilename()).toMatch(/持続化補助金.*\.pdf/)
  })
  
  test('ものづくり補助金の適格性チェック', async ({ page }) => {
    await page.goto('/dashboard/applications/new')
    
    // 補助金タイプ選択
    await page.selectOption('select[name="subsidyType"]', 'monozukuri')
    
    // 企業情報入力
    await page.fill('input[name="corporateNumber"]', '2010401000001')
    await page.click('button:has-text("企業情報を取得")')
    
    // 適格性チェック結果の確認
    await page.waitForSelector('.eligibility-check-result')
    
    const eligibilityText = await page.locator('.eligibility-status').textContent()
    expect(['適格', '要確認', '非適格']).toContain(eligibilityText)
    
    // 推定補助金額の表示確認
    await expect(page.locator('.estimated-amount')).toBeVisible()
  })
  
  test('複数の補助金を比較', async ({ page }) => {
    await page.goto('/dashboard/subsidy-programs')
    
    // 補助金一覧の表示確認
    await expect(page.locator('.subsidy-card')).toHaveCount(5)
    
    // フィルタリング機能
    await page.fill('input[name="maxAmount"]', '5000000')
    await page.click('button:has-text("絞り込み")')
    
    // フィルタ結果の確認
    const filteredCards = await page.locator('.subsidy-card').count()
    expect(filteredCards).toBeLessThan(5)
    
    // 詳細比較モード
    await page.click('button:has-text("比較モード")')
    await page.click('.subsidy-card:has-text("持続化補助金") input[type="checkbox"]')
    await page.click('.subsidy-card:has-text("IT導入補助金") input[type="checkbox"]')
    await page.click('button:has-text("比較表を表示")')
    
    // 比較表の確認
    await expect(page.locator('.comparison-table')).toBeVisible()
    await expect(page.locator('.comparison-table')).toContainText('最大補助額')
    await expect(page.locator('.comparison-table')).toContainText('補助率')
  })
  
  test('申請書の進捗管理', async ({ page }) => {
    // 既存の申請書一覧へ
    await page.goto('/dashboard/applications')
    
    // ステータスフィルター
    await page.selectOption('select[name="status"]', 'draft')
    
    // 申請書を開く
    await page.click('.application-card:first-child')
    
    // 進捗状況の確認
    const progressBar = page.locator('.progress-bar')
    await expect(progressBar).toBeVisible()
    
    const progressValue = await progressBar.getAttribute('data-progress')
    expect(Number(progressValue)).toBeGreaterThanOrEqual(0)
    expect(Number(progressValue)).toBeLessThanOrEqual(100)
    
    // チェックリストの確認
    await expect(page.locator('.checklist-item')).toHaveCount(7)
  })
  
  test('外部データ連携の動作確認', async ({ page }) => {
    await page.goto('/dashboard/applications/new')
    
    // 法人番号入力
    await page.fill('input[name="corporateNumber"]', '5010001000001')
    await page.click('button:has-text("企業情報を取得")')
    
    // データ取得状況の表示
    await expect(page.locator('.data-source-indicator')).toContainText('法人番号API')
    await expect(page.locator('.data-source-indicator')).toContainText('e-Stat API')
    
    // 業界統計データの表示確認
    await page.click('button:has-text("業界統計を表示")')
    await expect(page.locator('.industry-stats')).toBeVisible()
    await expect(page.locator('.industry-stats')).toContainText('平均従業員数')
    await expect(page.locator('.industry-stats')).toContainText('平均売上高')
  })
})

test.describe('モバイル対応', () => {
  test.use({ viewport: { width: 375, height: 667 } })
  
  test('モバイルでの申請フロー', async ({ page }) => {
    await page.goto('/auth/login')
    
    // モバイルメニューの確認
    await page.click('.mobile-menu-button')
    await expect(page.locator('.mobile-menu')).toBeVisible()
    
    // ログイン
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'Test123!')
    await page.click('button[type="submit"]')
    
    // モバイルダッシュボード
    await expect(page.locator('.mobile-dashboard')).toBeVisible()
    
    // スワイプ可能なカードの確認
    const cards = page.locator('.swipeable-card')
    await expect(cards).toHaveCount(3)
  })
})