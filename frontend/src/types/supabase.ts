/**
 * Supabase データベース型定義
 * 実際の型はSupabase CLIで生成されるが、フォールバックとして基本型を定義
 */

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          company_name: string | null
          representative_name: string | null
          business_type: string | null
          founded_year: number | null
          employee_count: number | null
          capital_stock: number | null
          annual_revenue: number | null
          corporate_number: string | null
          postal_code: string | null
          address: string | null
          phone: string | null
          website: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['user_profiles']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['user_profiles']['Insert']>
      }
      
      subsidy_programs: {
        Row: {
          id: string
          code: string
          name: string
          official_name: string | null
          category: string
          organization_name: string
          description: string | null
          purpose: string | null
          target_business: string | null
          max_amount: number | null
          subsidy_rate: number | null
          application_period_start: string | null
          application_period_end: string | null
          requirements: any | null
          eligible_expenses: any | null
          documents_required: any | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['subsidy_programs']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['subsidy_programs']['Insert']>
      }
      
      applications: {
        Row: {
          id: string
          user_id: string
          subsidy_program_id: string | null
          application_number: string | null
          status: 'draft' | 'submitted' | 'in_review' | 'approved' | 'rejected' | 'completed'
          form_data: any
          ai_generated_content: any
          ai_generation_history: any[]
          external_data: any
          external_data_fetched_at: string | null
          eligibility_score: number | null
          completeness_score: number | null
          ai_review_result: any | null
          submitted_at: string | null
          reviewed_at: string | null
          approved_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['applications']['Row'], 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['applications']['Insert']>
      }
      
      uploaded_files: {
        Row: {
          id: string
          user_id: string
          application_id: string | null
          file_name: string
          file_type: string
          file_size: number
          storage_path: string
          purpose: string | null
          uploaded_at: string
        }
        Insert: Omit<Database['public']['Tables']['uploaded_files']['Row'], 'id' | 'uploaded_at'>
        Update: Partial<Database['public']['Tables']['uploaded_files']['Insert']>
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}