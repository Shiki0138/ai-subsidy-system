/**
 * Supabaseクライアント設定（エラーハンドリング対応）
 */

import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { SUPABASE_URL, SUPABASE_ANON_KEY, FEATURES } from '@/config/environment'

// モックモードの場合はダミークライアントを提供
const createMockClient = () => {
  console.warn('📦 Supabase Mock Mode: 実際のデータベース接続はありません')
  
  return {
    auth: {
      signUp: async () => ({ data: null, error: new Error('Mock mode') }),
      signIn: async () => ({ data: null, error: new Error('Mock mode') }),
      signOut: async () => ({ error: null }),
      getUser: async () => ({ data: { user: null }, error: null }),
      getSession: async () => ({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({ data: [], error: null }),
      insert: () => ({ data: null, error: null }),
      update: () => ({ data: null, error: null }),
      delete: () => ({ error: null }),
    }),
    storage: {
      from: () => ({
        upload: async () => ({ data: null, error: null }),
        download: async () => ({ data: null, error: null }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as any
}

// Supabaseクライアントの作成（エラーハンドリング付き）
export const supabase = FEATURES.USE_SUPABASE 
  ? createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'x-application-name': 'ai-subsidy-system'
    }
  }
})
  : createMockClient()

// 管理者用クライアント（サーバーサイドのみ）
export const createAdminClient = () => {
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY
  
  if (!supabaseServiceKey) {
    throw new Error('SUPABASE_SERVICE_KEY is not set')
  }
  
  return createClient<Database>(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}

// 認証ヘルパー関数
export const auth = {
  // サインアップ
  async signUp(email: string, password: string, metadata?: any) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata
      }
    })
    
    if (error) throw error
    return data
  },
  
  // サインイン
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw error
    return data
  },
  
  // サインアウト
  async signOut() {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
  
  // 現在のユーザー取得
  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  },
  
  // セッション取得
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) throw error
    return session
  },
  
  // パスワードリセット
  async resetPassword(email: string) {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    })
    
    if (error) throw error
  }
}

// データベースヘルパー関数
export const db = {
  // ユーザープロファイル
  userProfiles: {
    async get(userId: string) {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      if (error) throw error
      return data
    },
    
    async upsert(profile: any) {
      const { data, error } = await supabase
        .from('user_profiles')
        .upsert(profile)
        .select()
        .single()
      
      if (error) throw error
      return data
    }
  },
  
  // 申請書
  applications: {
    async list(userId: string) {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          subsidy_programs (
            name,
            category,
            max_amount
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data
    },
    
    async get(id: string) {
      const { data, error } = await supabase
        .from('applications')
        .select(`
          *,
          subsidy_programs (*),
          uploaded_files (*)
        `)
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    
    async create(application: any) {
      const { data, error } = await supabase
        .from('applications')
        .insert(application)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    
    async update(id: string, updates: any) {
      const { data, error } = await supabase
        .from('applications')
        .update(updates)
        .eq('id', id)
        .select()
        .single()
      
      if (error) throw error
      return data
    },
    
    async delete(id: string) {
      const { error } = await supabase
        .from('applications')
        .delete()
        .eq('id', id)
      
      if (error) throw error
    }
  },
  
  // 補助金プログラム
  subsidyPrograms: {
    async list(active = true) {
      let query = supabase
        .from('subsidy_programs')
        .select('*')
      
      if (active) {
        query = query.eq('is_active', true)
      }
      
      const { data, error } = await query.order('name')
      
      if (error) throw error
      return data
    },
    
    async get(id: string) {
      const { data, error } = await supabase
        .from('subsidy_programs')
        .select('*')
        .eq('id', id)
        .single()
      
      if (error) throw error
      return data
    },
    
    async getByCode(code: string) {
      const { data, error } = await supabase
        .from('subsidy_programs')
        .select('*')
        .eq('code', code)
        .single()
      
      if (error) throw error
      return data
    }
  }
}

// ストレージヘルパー関数
export const storage = {
  // ファイルアップロード
  async upload(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })
    
    if (error) throw error
    return data
  },
  
  // ファイルダウンロード
  async download(bucket: string, path: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .download(path)
    
    if (error) throw error
    return data
  },
  
  // 公開URLの取得
  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path)
    
    return data.publicUrl
  },
  
  // 署名付きURLの取得
  async getSignedUrl(bucket: string, path: string, expiresIn = 3600) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn)
    
    if (error) throw error
    return data.signedUrl
  },
  
  // ファイル削除
  async delete(bucket: string, paths: string[]) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove(paths)
    
    if (error) throw error
  }
}

// リアルタイム購読
export const realtime = {
  // 申請書の変更を購読
  subscribeToApplicationChanges(
    userId: string,
    callback: (payload: any) => void
  ) {
    return supabase
      .channel('application-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'applications',
          filter: `user_id=eq.${userId}`
        },
        callback
      )
      .subscribe()
  },
  
  // チャンネルの購読解除
  unsubscribe(channel: any) {
    supabase.removeChannel(channel)
  }
}