import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { applicationApi } from '../services/api/applicationApi';
import { subsidyProgramApi } from '../services/api/subsidyProgramApi';
import { adoptedCasesApi } from '../services/api/adoptedCasesApi';

// 申請書一覧取得（ページネーション付き）
export const useApplications = ({
  page = 1,
  limit = 20,
  status,
  search,
  sortBy = 'createdAt',
  sortOrder = 'desc',
  enabled = true,
}: {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ['applications', { page, limit, status, search, sortBy, sortOrder }],
    queryFn: () => applicationApi.getList({
      page,
      limit,
      status,
      search,
      sortBy,
      sortOrder,
    }),
    enabled,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    retry: 2,
  });
};

// 無限スクロール対応の申請書一覧
export const useInfiniteApplications = ({
  limit = 20,
  status,
  search,
  sortBy = 'createdAt',
  sortOrder = 'desc',
}: {
  limit?: number;
  status?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
} = {}) => {
  return useInfiniteQuery({
    queryKey: ['applications-infinite', { limit, status, search, sortBy, sortOrder }],
    queryFn: ({ pageParam = 1 }) => applicationApi.getList({
      page: pageParam,
      limit,
      status,
      search,
      sortBy,
      sortOrder,
    }),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      if (lastPage.pagination.hasNext) {
        return lastPage.pagination.currentPage + 1;
      }
      return undefined;
    },
    staleTime: 5 * 60 * 1000,
  });
};

// 特定の申請書詳細取得
export const useApplication = (applicationId: string, enabled = true) => {
  return useQuery({
    queryKey: ['application', applicationId],
    queryFn: () => applicationApi.getById(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 2 * 60 * 1000, // 2分間キャッシュ
    retry: 2,
  });
};

// 申請書の履歴・バージョン取得
export const useApplicationHistory = (applicationId: string, enabled = true) => {
  return useQuery({
    queryKey: ['application-history', applicationId],
    queryFn: () => applicationApi.getHistory(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
  });
};

// 補助金プログラム一覧取得
export const useSubsidyPrograms = ({
  category,
  isActive = true,
  enabled = true,
}: {
  category?: string;
  isActive?: boolean;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ['subsidy-programs', { category, isActive }],
    queryFn: () => subsidyProgramApi.getList({ category, isActive }),
    enabled,
    staleTime: 30 * 60 * 1000, // 30分間キャッシュ（補助金情報は頻繁に変わらない）
  });
};

// 特定の補助金プログラム詳細
export const useSubsidyProgram = (programId: string, enabled = true) => {
  return useQuery({
    queryKey: ['subsidy-program', programId],
    queryFn: () => subsidyProgramApi.getById(programId),
    enabled: enabled && !!programId,
    staleTime: 30 * 60 * 1000,
  });
};

// 補助金プログラムのテンプレート取得
export const useSubsidyProgramTemplate = (programId: string, enabled = true) => {
  return useQuery({
    queryKey: ['subsidy-program-template', programId],
    queryFn: () => subsidyProgramApi.getTemplate(programId),
    enabled: enabled && !!programId,
    staleTime: 60 * 60 * 1000, // 1時間キャッシュ
  });
};

// 採択事例の類似検索
export const useSimilarAdoptedCases = ({
  industry,
  companySize,
  subsidyType,
  limit = 10,
  enabled = true,
}: {
  industry?: string;
  companySize?: string;
  subsidyType?: string;
  limit?: number;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ['similar-adopted-cases', { industry, companySize, subsidyType, limit }],
    queryFn: () => adoptedCasesApi.getSimilarCases({
      industry,
      companySize,
      subsidyType,
      limit,
    }),
    enabled: enabled && (!!industry || !!companySize || !!subsidyType),
    staleTime: 15 * 60 * 1000, // 15分間キャッシュ
  });
};

// 採択事例詳細
export const useAdoptedCase = (caseId: string, enabled = true) => {
  return useQuery({
    queryKey: ['adopted-case', caseId],
    queryFn: () => adoptedCasesApi.getById(caseId),
    enabled: enabled && !!caseId,
    staleTime: 60 * 60 * 1000, // 1時間キャッシュ
  });
};

// 採択事例統計
export const useAdoptedCasesStats = (enabled = true) => {
  return useQuery({
    queryKey: ['adopted-cases-stats'],
    queryFn: () => adoptedCasesApi.getStats(),
    enabled,
    staleTime: 60 * 60 * 1000, // 1時間キャッシュ
  });
};

// ユーザーのダッシュボード統計
export const useDashboardStats = (enabled = true) => {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => applicationApi.getDashboardStats(),
    enabled,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
    retry: 2,
  });
};

// 申請書の進捗状況
export const useApplicationProgress = (applicationId: string, enabled = true) => {
  return useQuery({
    queryKey: ['application-progress', applicationId],
    queryFn: () => applicationApi.getProgress(applicationId),
    enabled: enabled && !!applicationId,
    refetchInterval: (query) => {
      // 進行中の場合は10秒間隔で更新
      if (query.state.data?.status === 'GENERATING' || query.state.data?.status === 'PROCESSING') {
        return 10000;
      }
      return false;
    },
    staleTime: 0, // 常に最新の進捗を取得
  });
};

// 申請書のAI分析結果
export const useApplicationAnalysis = (applicationId: string, enabled = true) => {
  return useQuery({
    queryKey: ['application-analysis', applicationId],
    queryFn: () => applicationApi.getAnalysis(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
  });
};

// 申請書の推定スコア
export const useApplicationScore = (applicationId: string, enabled = true) => {
  return useQuery({
    queryKey: ['application-score', applicationId],
    queryFn: () => applicationApi.getEstimatedScore(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });
};

// 申請書のチェックリスト
export const useApplicationChecklist = (applicationId: string, enabled = true) => {
  return useQuery({
    queryKey: ['application-checklist', applicationId],
    queryFn: () => applicationApi.getChecklist(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 2 * 60 * 1000, // 2分間キャッシュ
  });
};

// 補助金プログラムの検索
export const useSearchSubsidyPrograms = (query: string, enabled = true) => {
  return useQuery({
    queryKey: ['search-subsidy-programs', query],
    queryFn: () => subsidyProgramApi.search(query),
    enabled: enabled && query.length >= 2, // 2文字以上で検索
    staleTime: 10 * 60 * 1000,
  });
};

// 申請書のコメント・レビュー
export const useApplicationComments = (applicationId: string, enabled = true) => {
  return useQuery({
    queryKey: ['application-comments', applicationId],
    queryFn: () => applicationApi.getComments(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 1 * 60 * 1000, // 1分間キャッシュ
  });
};

// AI生成履歴
export const useAIGenerationHistory = (applicationId: string, enabled = true) => {
  return useQuery({
    queryKey: ['ai-generation-history', applicationId],
    queryFn: () => applicationApi.getAIHistory(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 5 * 60 * 1000,
  });
};

// 申請書のテンプレート一覧
export const useApplicationTemplates = ({
  category,
  isPublic = true,
  enabled = true,
}: {
  category?: string;
  isPublic?: boolean;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ['application-templates', { category, isPublic }],
    queryFn: () => applicationApi.getTemplates({ category, isPublic }),
    enabled,
    staleTime: 30 * 60 * 1000,
  });
};

// 最近の活動履歴
export const useRecentActivity = (limit = 10, enabled = true) => {
  return useQuery({
    queryKey: ['recent-activity', limit],
    queryFn: () => applicationApi.getRecentActivity(limit),
    enabled,
    staleTime: 2 * 60 * 1000,
  });
};

// 申請書の共有設定
export const useApplicationSharing = (applicationId: string, enabled = true) => {
  return useQuery({
    queryKey: ['application-sharing', applicationId],
    queryFn: () => applicationApi.getSharingSettings(applicationId),
    enabled: enabled && !!applicationId,
    staleTime: 5 * 60 * 1000,
  });
};

// 申請期限が近い補助金プログラム
export const useUpcomingDeadlines = (days = 30, enabled = true) => {
  return useQuery({
    queryKey: ['upcoming-deadlines', days],
    queryFn: () => subsidyProgramApi.getUpcomingDeadlines(days),
    enabled,
    staleTime: 60 * 60 * 1000, // 1時間キャッシュ
  });
};

// システム通知
export const useNotifications = ({
  page = 1,
  limit = 20,
  unreadOnly = false,
  enabled = true,
}: {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
  enabled?: boolean;
} = {}) => {
  return useQuery({
    queryKey: ['notifications', { page, limit, unreadOnly }],
    queryFn: () => applicationApi.getNotifications({ page, limit, unreadOnly }),
    enabled,
    staleTime: 1 * 60 * 1000, // 1分間キャッシュ
  });
};

// クエリの事前取得ヘルパー
export const prefetchApplications = (queryClient: any, params = {}) => {
  return queryClient.prefetchQuery({
    queryKey: ['applications', params],
    queryFn: () => applicationApi.getList(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const prefetchSubsidyPrograms = (queryClient: any, params = {}) => {
  return queryClient.prefetchQuery({
    queryKey: ['subsidy-programs', params],
    queryFn: () => subsidyProgramApi.getList(params),
    staleTime: 30 * 60 * 1000,
  });
};