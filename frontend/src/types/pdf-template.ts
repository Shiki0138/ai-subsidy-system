// PDF申請書テンプレートの型定義

export interface PDFTemplateInfo {
  id: string;
  subsidyType: string;
  name: string;
  description: string;
  fileName: string;
  uploadDate: string;
  isActive: boolean;
  fieldMapping: FieldMapping;
  pageCount: number;
  hasFormFields: boolean;
  isGovernmentOfficial: boolean;
}

export interface FieldMapping {
  [key: string]: FieldConfig;
}

export interface FieldConfig {
  type: 'text' | 'number' | 'date' | 'multiline' | 'checkbox' | 'select';
  fieldName?: string;           // フォームフィールド名（存在する場合）
  coordinates?: {               // 座標ベース配置（フィールドがない場合）
    page: number;
    x: number;
    y: number;
    width?: number;
    height?: number;
  };
  format?: {
    fontSize?: number;
    fontColor?: string;
    maxLength?: number;
    lineHeight?: number;
    alignment?: 'left' | 'center' | 'right';
  };
  validation?: {
    required?: boolean;
    pattern?: string;
    min?: number;
    max?: number;
  };
  defaultValue?: string;
  placeholder?: string;
  label: string;
  description?: string;
}

// 標準的な申請書フィールド
export interface StandardApplicationFields {
  // 基本情報
  companyName: string;
  representative: string;
  postalCode: string;
  address: string;
  phoneNumber: string;
  faxNumber?: string;
  emailAddress: string;
  website?: string;
  
  // 事業情報
  industryType: string;
  businessScale: string;
  employeeCount: number;
  annualRevenue?: number;
  establishedYear: number;
  
  // 申請情報
  applicationDate: string;
  projectTitle: string;
  projectPeriod: {
    startDate: string;
    endDate: string;
  };
  
  // 事業計画
  businessPurpose: string;
  businessPlan: string;
  necessity: string;
  expectedEffect: string;
  implementationMethod: string;
  
  // 予算・費用
  totalProjectCost: number;
  equipmentCost: number;
  personalCost: number;
  otherCosts: number;
  subsidyRequestAmount: number;
  selfFundingAmount: number;
  
  // 添付書類
  attachments?: string[];
  
  // その他
  remarks?: string;
  certificationItems?: string[];
}

// 補助金タイプ別のフィールドマッピング
export interface SubsidyTypeMapping {
  [subsidyType: string]: {
    templateId: string;
    requiredFields: (keyof StandardApplicationFields)[];
    optionalFields: (keyof StandardApplicationFields)[];
    customFields?: { [key: string]: FieldConfig };
  };
}

// PDF操作結果
export interface PDFProcessResult {
  success: boolean;
  message: string;
  filledPdfUrl?: string;
  errors?: string[];
  warnings?: string[];
}