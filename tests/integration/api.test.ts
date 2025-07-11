/**
 * API統合テスト
 */

import { describe, test, expect, beforeAll, afterAll } from '@jest/globals'
import { createClient } from '@supabase/supabase-js'

// テスト用のSupabaseクライアント
let supabase: any
let testUserId: string
let testApplicationId: string

beforeAll(async () => {
  // テスト環境のSupabaseクライアント初期化
  supabase = createClient(
    process.env.TEST_SUPABASE_URL || 'http://localhost:54321',
    process.env.TEST_SUPABASE_ANON_KEY || 'test-anon-key'
  )
  
  // テストユーザー作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: 'test@example.com',
    password: 'Test123!'
  })
  
  if (authError) throw authError
  testUserId = authData.user?.id || ''
})

afterAll(async () => {
  // テストデータのクリーンアップ
  if (testApplicationId) {
    await supabase.from('applications').delete().eq('id', testApplicationId)
  }
  
  if (testUserId) {
    await supabase.auth.admin.deleteUser(testUserId)
  }
})

describe('企業データ取得API', () => {
  test('法人番号から企業情報を取得', async () => {
    const response = await fetch('/api/external/company-data?corporateNumber=1010001000001')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.company.basic).toBeDefined()
    expect(data.data.company.basic.name).toBeTruthy()
    expect(data.data.company.basic.address).toBeTruthy()
  })
  
  test('無効な法人番号でエラー', async () => {
    const response = await fetch('/api/external/company-data?corporateNumber=invalid')
    const data = await response.json()
    
    expect(response.status).toBe(500)
    expect(data.success).toBe(false)
    expect(data.error).toContain('無効な法人番号')
  })
  
  test('企業名検索', async () => {
    const response = await fetch('/api/external/company-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        companyName: 'トヨタ',
        prefecture: '愛知県'
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(Array.isArray(data.data)).toBe(true)
    expect(data.count).toBeGreaterThan(0)
  })
})

describe('AI申請書生成API', () => {
  test('持続化補助金の申請書生成', async () => {
    const response = await fetch('/api/applications/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subsidyType: 'sustainability',
        corporateNumber: '1010001000001',
        additionalInfo: 'ECサイト構築による販路拡大'
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.data.generatedContent).toBeDefined()
    expect(data.data.eligibility.eligibleSubsidies).toContain('sustainability')
  })
  
  test('セクション単位での生成', async () => {
    const response = await fetch('/api/applications/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subsidyType: 'monozukuri',
        corporateNumber: '2010401000001',
        sectionType: 'businessOverview'
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(typeof data.data.generatedContent).toBe('string')
    expect(data.data.generatedContent.length).toBeGreaterThan(100)
  })
  
  test('レビュー機能付き生成', async () => {
    const response = await fetch('/api/applications/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subsidyType: 'it-subsidy',
        corporateNumber: '3010001000001',
        includeReview: true
      })
    })
    
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.data.review).toBeDefined()
    expect(data.data.review.score).toBeGreaterThanOrEqual(0)
    expect(data.data.review.score).toBeLessThanOrEqual(100)
    expect(Array.isArray(data.data.review.strengths)).toBe(true)
    expect(Array.isArray(data.data.review.improvements)).toBe(true)
  })
})

describe('Supabaseデータベース操作', () => {
  test('申請書の作成と取得', async () => {
    // 補助金プログラムIDを取得
    const { data: programs } = await supabase
      .from('subsidy_programs')
      .select('id')
      .eq('code', 'sustainability')
      .single()
    
    // 申請書作成
    const applicationData = {
      user_id: testUserId,
      subsidy_program_id: programs.id,
      form_data: {
        companyName: 'テスト株式会社',
        projectTitle: 'テストプロジェクト'
      }
    }
    
    const { data: created, error: createError } = await supabase
      .from('applications')
      .insert(applicationData)
      .select()
      .single()
    
    expect(createError).toBeNull()
    expect(created.id).toBeDefined()
    testApplicationId = created.id
    
    // 申請書取得
    const { data: fetched, error: fetchError } = await supabase
      .from('applications')
      .select('*')
      .eq('id', testApplicationId)
      .single()
    
    expect(fetchError).toBeNull()
    expect(fetched.form_data.companyName).toBe('テスト株式会社')
  })
  
  test('申請書の更新', async () => {
    const updates = {
      status: 'submitted',
      form_data: {
        companyName: 'テスト株式会社',
        projectTitle: '更新されたプロジェクト'
      }
    }
    
    const { data, error } = await supabase
      .from('applications')
      .update(updates)
      .eq('id', testApplicationId)
      .select()
      .single()
    
    expect(error).toBeNull()
    expect(data.status).toBe('submitted')
    expect(data.form_data.projectTitle).toBe('更新されたプロジェクト')
  })
  
  test('Row Level Securityの動作確認', async () => {
    // 別ユーザーでログイン
    const { data: otherAuth } = await supabase.auth.signUp({
      email: 'other@example.com',
      password: 'Other123!'
    })
    
    // 他人の申請書にアクセス試行
    const { data, error } = await supabase
      .from('applications')
      .select('*')
      .eq('id', testApplicationId)
      .single()
    
    // RLSによりアクセス拒否されることを確認
    expect(error).toBeDefined()
    expect(data).toBeNull()
    
    // クリーンアップ
    if (otherAuth.user) {
      await supabase.auth.admin.deleteUser(otherAuth.user.id)
    }
  })
})

describe('ファイルアップロード', () => {
  test('PDFファイルのアップロード', async () => {
    const testPdf = new Blob(['test pdf content'], { type: 'application/pdf' })
    const fileName = `test-${Date.now()}.pdf`
    
    const { data, error } = await supabase.storage
      .from('uploaded-documents')
      .upload(`${testUserId}/${fileName}`, testPdf)
    
    expect(error).toBeNull()
    expect(data.path).toContain(fileName)
    
    // クリーンアップ
    await supabase.storage
      .from('uploaded-documents')
      .remove([`${testUserId}/${fileName}`])
  })
  
  test('署名付きURLの生成', async () => {
    const fileName = 'test-document.pdf'
    const testFile = new Blob(['content'], { type: 'application/pdf' })
    
    // ファイルアップロード
    await supabase.storage
      .from('application-pdfs')
      .upload(`${testUserId}/${fileName}`, testFile)
    
    // 署名付きURL生成
    const { data, error } = await supabase.storage
      .from('application-pdfs')
      .createSignedUrl(`${testUserId}/${fileName}`, 3600)
    
    expect(error).toBeNull()
    expect(data.signedUrl).toContain('token=')
    
    // クリーンアップ
    await supabase.storage
      .from('application-pdfs')
      .remove([`${testUserId}/${fileName}`])
  })
})

describe('統計データ取得', () => {
  test('業界統計の取得', async () => {
    const response = await fetch('/api/external/industry-stats?industryCode=E&prefecture=13')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.numberOfCompanies).toBeGreaterThan(0)
    expect(data.numberOfEmployees).toBeGreaterThan(0)
    expect(data.salesAmount).toBeGreaterThan(0)
  })
  
  test('最低賃金データの取得', async () => {
    const response = await fetch('/api/external/minimum-wage?prefecture=13')
    const data = await response.json()
    
    expect(response.status).toBe(200)
    expect(data.minimumWage).toBeGreaterThan(1000)
  })
})