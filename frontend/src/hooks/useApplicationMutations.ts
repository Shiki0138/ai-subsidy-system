import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { applicationApi } from '../services/api/applicationApi';
import { autoFillApi } from '../services/api/autoFillApi';
import type { 
  ApplicationFormData, 
  PartialApplicationFormData,
  ApplicationStepId 
} from '../schemas/applicationSchema';

// 申請書作成
export const useCreateApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: applicationApi.create,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('申請書を作成しました');
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '申請書の作成に失敗しました');
      throw error;
    },
  });
};

// 申請書更新（ステップ別）
export const useUpdateApplicationStep = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      applicationId, 
      stepId, 
      data 
    }: { 
      applicationId: string; 
      stepId: ApplicationStepId; 
      data: any;
    }) => {
      return applicationApi.updateStep(applicationId, stepId, data);
    },
    onSuccess: (data, variables) => {
      // 特定の申請書のキャッシュを更新
      queryClient.invalidateQueries({ 
        queryKey: ['application', variables.applicationId] 
      });
      
      // 申請書一覧のキャッシュも更新
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      
      toast.success('変更を保存しました');
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '保存に失敗しました');
      throw error;
    },
  });
};

// 申請書の自動保存
export const useAutoSaveApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      applicationId, 
      data 
    }: { 
      applicationId: string; 
      data: PartialApplicationFormData;
    }) => {
      return applicationApi.autoSave(applicationId, data);
    },
    onSuccess: (data, variables) => {
      // サイレント更新（トーストを表示しない）
      queryClient.setQueryData(
        ['application', variables.applicationId], 
        (oldData: any) => ({
          ...oldData,
          ...data,
          lastSavedAt: new Date(),
        })
      );
    },
    onError: (error: any) => {
      console.warn('Auto-save failed:', error);
      // 自動保存のエラーは表示しない（UXを損なわないため）
    },
  });
};

// AI生成
export const useGenerateWithAI = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      applicationId, 
      sectionType, 
      additionalContext 
    }: { 
      applicationId: string; 
      sectionType: string; 
      additionalContext?: any;
    }) => {
      return applicationApi.generateSection(applicationId, sectionType, additionalContext);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ 
        queryKey: ['application', variables.applicationId] 
      });
      toast.success('AI生成が完了しました');
      return data;
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'AI生成に失敗しました');
      throw error;
    },
  });
};

// 自動入力提案取得
export const useGetAutoFillSuggestions = () => {
  return useMutation({
    mutationFn: ({ 
      subsidyGuidelineId, 
      companyProfileId 
    }: { 
      subsidyGuidelineId: string; 
      companyProfileId?: string;
    }) => {
      return autoFillApi.getSuggestions(subsidyGuidelineId, companyProfileId);
    },
    onSuccess: () => {
      toast.success('自動入力提案を取得しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '自動入力提案の取得に失敗しました');
      throw error;
    },
  });
};

// Webサイトデータ抽出
export const useExtractWebsiteData = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ websiteUrl }: { websiteUrl: string }) => {
      return autoFillApi.extractWebsiteData(websiteUrl);
    },
    onSuccess: () => {
      // ユーザープロフィールを再取得
      queryClient.invalidateQueries({ queryKey: ['user-profile'] });
      toast.success('Webサイトからデータを抽出しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Webサイトデータの抽出に失敗しました');
      throw error;
    },
  });
};

// PDF生成
export const useGeneratePDF = () => {
  return useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) => {
      return applicationApi.generatePDF(applicationId);
    },
    onSuccess: () => {
      toast.success('PDFを生成しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'PDF生成に失敗しました');
      throw error;
    },
  });
};

// 申請書提出
export const useSubmitApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      applicationId, 
      finalReview 
    }: { 
      applicationId: string; 
      finalReview: any;
    }) => {
      return applicationApi.submit(applicationId, finalReview);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('申請書を提出しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '申請書の提出に失敗しました');
      throw error;
    },
  });
};

// 申請書削除
export const useDeleteApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ applicationId }: { applicationId: string }) => {
      return applicationApi.delete(applicationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('申請書を削除しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '申請書の削除に失敗しました');
      throw error;
    },
  });
};

// 申請書複製
export const useDuplicateApplication = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ 
      applicationId, 
      newTitle 
    }: { 
      applicationId: string; 
      newTitle?: string;
    }) => {
      return applicationApi.duplicate(applicationId, newTitle);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success('申請書を複製しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '申請書の複製に失敗しました');
      throw error;
    },
  });
};

// ファイルアップロード
export const useUploadFile = () => {
  return useMutation({
    mutationFn: ({ 
      file, 
      purpose, 
      applicationId 
    }: { 
      file: File; 
      purpose: string; 
      applicationId?: string;
    }) => {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('purpose', purpose);
      if (applicationId) {
        formData.append('applicationId', applicationId);
      }
      
      return applicationApi.uploadFile(formData);
    },
    onSuccess: () => {
      toast.success('ファイルをアップロードしました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'ファイルのアップロードに失敗しました');
      throw error;
    },
  });
};

// プロセス状況チェック（長時間処理用）
export const useCheckProcessStatus = () => {
  return useMutation({
    mutationFn: ({ processId }: { processId: string }) => {
      return applicationApi.checkProcessStatus(processId);
    },
    retry: 3,
    retryDelay: 2000,
  });
};

// バッチ操作（複数申請書の一括操作）
export const useBatchDeleteApplications = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ applicationIds }: { applicationIds: string[] }) => {
      return applicationApi.batchDelete(applicationIds);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applications'] });
      toast.success(`${data.deletedCount}件の申請書を削除しました`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || '一括削除に失敗しました');
      throw error;
    },
  });
};

// エクスポート機能
export const useExportApplications = () => {
  return useMutation({
    mutationFn: ({ 
      applicationIds, 
      format 
    }: { 
      applicationIds: string[]; 
      format: 'pdf' | 'excel' | 'csv';
    }) => {
      return applicationApi.exportApplications(applicationIds, format);
    },
    onSuccess: () => {
      toast.success('エクスポートを開始しました');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'エクスポートに失敗しました');
      throw error;
    },
  });
};