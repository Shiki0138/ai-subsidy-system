import { z } from 'zod';

// 企業情報スキーマ
export const companyInfoSchema = z.object({
  companyName: z.string().min(1, '会社名は必須です').max(100, '会社名は100文字以内で入力してください'),
  representativeName: z.string().min(1, '代表者名は必須です').max(50, '代表者名は50文字以内で入力してください'),
  businessType: z.string().min(1, '業種は必須です'),
  foundedYear: z.number().min(1900, '設立年が不正です').max(new Date().getFullYear(), '設立年が不正です'),
  employeeCount: z.number().min(1, '従業員数は1人以上で入力してください').max(10000, '従業員数が上限を超えています'),
  address: z.string().min(1, '所在地は必須です').max(200, '所在地は200文字以内で入力してください'),
  phone: z.string().regex(/^[0-9\-\(\)\+\s]+$/, '電話番号の形式が正しくありません'),
  website: z.string().url('有効なURLを入力してください').optional().or(z.literal('')),
  annualRevenue: z.string().optional(),
  businessDescription: z.string().min(50, '事業内容は50文字以上で入力してください').max(1000, '事業内容は1000文字以内で入力してください'),
});

// プロジェクト計画スキーマ
export const projectPlanSchema = z.object({
  projectTitle: z.string().min(1, 'プロジェクト名は必須です').max(100, 'プロジェクト名は100文字以内で入力してください'),
  projectDescription: z.string().min(100, 'プロジェクト概要は100文字以上で入力してください').max(2000, 'プロジェクト概要は2000文字以内で入力してください'),
  projectBackground: z.string().min(50, '背景・課題は50文字以上で入力してください').max(1500, '背景・課題は1500文字以内で入力してください'),
  projectGoals: z.string().min(50, '目標・効果は50文字以上で入力してください').max(1500, '目標・効果は1500文字以内で入力してください'),
  implementationPlan: z.string().min(100, '実施計画は100文字以上で入力してください').max(2000, '実施計画は2000文字以内で入力してください'),
  implementationPeriod: z.object({
    startDate: z.date(),
    endDate: z.date(),
  }).refine((data) => data.endDate > data.startDate, {
    message: '終了日は開始日より後の日付を選択してください',
    path: ['endDate'],
  }),
  expectedResults: z.string().min(50, '期待される成果は50文字以上で入力してください').max(1500, '期待される成果は1500文字以内で入力してください'),
  sustainabilityPlan: z.string().min(50, '持続性・発展性は50文字以上で入力してください').max(1000, '持続性・発展性は1000文字以内で入力してください'),
});

// 予算計画スキーマ
export const budgetPlanSchema = z.object({
  totalBudget: z.number().min(1, '総事業費は1円以上で入力してください').max(100000000, '総事業費が上限を超えています'),
  subsidyAmount: z.number().min(1, '補助金申請額は1円以上で入力してください'),
  selfFunding: z.number().min(0, '自己資金は0円以上で入力してください'),
  
  // 経費内訳
  expenses: z.object({
    equipmentCosts: z.array(z.object({
      itemName: z.string().min(1, '項目名は必須です'),
      quantity: z.number().min(1, '数量は1以上で入力してください'),
      unitPrice: z.number().min(1, '単価は1円以上で入力してください'),
      totalPrice: z.number().min(1, '合計金額は1円以上で入力してください'),
      description: z.string().optional(),
    })),
    
    outsourcingCosts: z.array(z.object({
      serviceName: z.string().min(1, 'サービス名は必須です'),
      provider: z.string().min(1, '委託先は必須です'),
      amount: z.number().min(1, '金額は1円以上で入力してください'),
      description: z.string().optional(),
    })),
    
    personnelCosts: z.array(z.object({
      role: z.string().min(1, '役割は必須です'),
      monthlyHours: z.number().min(1, '月当たり時間は1時間以上で入力してください'),
      hourlyRate: z.number().min(1, '時給は1円以上で入力してください'),
      months: z.number().min(1, '月数は1ヶ月以上で入力してください'),
      totalAmount: z.number().min(1, '合計金額は1円以上で入力してください'),
    })),
    
    otherCosts: z.array(z.object({
      itemName: z.string().min(1, '項目名は必須です'),
      amount: z.number().min(1, '金額は1円以上で入力してください'),
      description: z.string().optional(),
    })),
  }),
  
  // 資金調達計画
  fundingPlan: z.string().min(50, '資金調達計画は50文字以上で入力してください').max(1000, '資金調達計画は1000文字以内で入力してください'),
  
  // 収支計画
  revenueProjection: z.string().min(50, '収支計画は50文字以上で入力してください').max(1000, '収支計画は1000文字以内で入力してください'),
}).refine((data) => {
  const totalExpenses = 
    data.expenses.equipmentCosts.reduce((sum, item) => sum + item.totalPrice, 0) +
    data.expenses.outsourcingCosts.reduce((sum, item) => sum + item.amount, 0) +
    data.expenses.personnelCosts.reduce((sum, item) => sum + item.totalAmount, 0) +
    data.expenses.otherCosts.reduce((sum, item) => sum + item.amount, 0);
  
  return Math.abs(totalExpenses - data.totalBudget) < 1000; // 1000円以内の誤差を許容
}, {
  message: '経費内訳の合計と総事業費が一致しません',
  path: ['totalBudget'],
}).refine((data) => {
  return data.subsidyAmount + data.selfFunding >= data.totalBudget;
}, {
  message: '補助金申請額と自己資金の合計が総事業費を下回っています',
  path: ['selfFunding'],
});

// 添付書類スキーマ
export const documentsSchema = z.object({
  requiredDocuments: z.array(z.object({
    documentType: z.string(),
    documentName: z.string(),
    fileId: z.string().optional(),
    isRequired: z.boolean(),
    isUploaded: z.boolean(),
  })),
  
  optionalDocuments: z.array(z.object({
    documentType: z.string(),
    documentName: z.string(),
    fileId: z.string().optional(),
    description: z.string().optional(),
  })),
}).refine((data) => {
  const requiredUploaded = data.requiredDocuments.filter(doc => doc.isRequired && doc.isUploaded);
  const totalRequired = data.requiredDocuments.filter(doc => doc.isRequired);
  
  return requiredUploaded.length === totalRequired.length;
}, {
  message: '必須書類がすべてアップロードされていません',
  path: ['requiredDocuments'],
});

// 確認・提出スキーマ
export const reviewSchema = z.object({
  confirmAccuracy: z.boolean().refine(val => val === true, {
    message: '記載内容に相違がないことを確認してください',
  }),
  
  confirmTerms: z.boolean().refine(val => val === true, {
    message: '利用規約に同意してください',
  }),
  
  confirmPrivacy: z.boolean().refine(val => val === true, {
    message: 'プライバシーポリシーに同意してください',
  }),
  
  confirmSubmission: z.boolean().refine(val => val === true, {
    message: '提出内容に間違いがないことを確認してください',
  }),
  
  additionalNotes: z.string().max(500, '備考は500文字以内で入力してください').optional(),
});

// 全体の申請書スキーマ
export const applicationSchema = z.object({
  // 基本情報
  subsidyProgramId: z.string().min(1, '補助金プログラムを選択してください'),
  applicationTitle: z.string().min(1, '申請書タイトルは必須です').max(100, '申請書タイトルは100文字以内で入力してください'),
  
  // 各ステップのスキーマ
  companyInfo: companyInfoSchema,
  projectPlan: projectPlanSchema,
  budgetPlan: budgetPlanSchema,
  documents: documentsSchema,
  review: reviewSchema,
  
  // メタデータ
  isDraft: z.boolean().default(true),
  lastSavedAt: z.date().optional(),
  aiGeneratedSections: z.array(z.string()).optional(),
  estimatedScore: z.number().min(0).max(100).optional(),
});

// ステップ別のスキーマエクスポート
export type CompanyInfoFormData = z.infer<typeof companyInfoSchema>;
export type ProjectPlanFormData = z.infer<typeof projectPlanSchema>;
export type BudgetPlanFormData = z.infer<typeof budgetPlanSchema>;
export type DocumentsFormData = z.infer<typeof documentsSchema>;
export type ReviewFormData = z.infer<typeof reviewSchema>;
export type ApplicationFormData = z.infer<typeof applicationSchema>;

// ステップ定義
export const APPLICATION_STEPS = [
  {
    id: 'company-info',
    title: '企業情報',
    description: '申請企業の基本情報を入力してください',
    schema: companyInfoSchema,
    isRequired: true,
  },
  {
    id: 'project-plan',
    title: '事業計画',
    description: 'プロジェクトの詳細計画を入力してください',
    schema: projectPlanSchema,
    isRequired: true,
  },
  {
    id: 'budget-plan',
    title: '予算計画',
    description: '事業に必要な予算と経費内訳を入力してください',
    schema: budgetPlanSchema,
    isRequired: true,
  },
  {
    id: 'documents',
    title: '添付書類',
    description: '必要書類をアップロードしてください',
    schema: documentsSchema,
    isRequired: true,
  },
  {
    id: 'review',
    title: '確認・提出',
    description: '入力内容を確認して申請書を提出してください',
    schema: reviewSchema,
    isRequired: true,
  },
] as const;

export type ApplicationStepId = typeof APPLICATION_STEPS[number]['id'];

// バリデーションヘルパー関数
export const validateStep = (stepId: ApplicationStepId, data: any) => {
  const step = APPLICATION_STEPS.find(s => s.id === stepId);
  if (!step) {
    throw new Error(`Invalid step ID: ${stepId}`);
  }
  
  return step.schema.safeParse(data);
};

// プログレス計算
export const calculateProgress = (formData: Partial<ApplicationFormData>): number => {
  let completedSteps = 0;
  const totalSteps = APPLICATION_STEPS.length;
  
  APPLICATION_STEPS.forEach(step => {
    const stepData = (formData as any)[step.id.replace('-', '')];
    if (stepData) {
      const validation = step.schema.safeParse(stepData);
      if (validation.success) {
        completedSteps++;
      }
    }
  });
  
  return Math.round((completedSteps / totalSteps) * 100);
};

// 自動保存用の部分スキーマ
export const partialApplicationSchema = applicationSchema.partial();
export type PartialApplicationFormData = z.infer<typeof partialApplicationSchema>;