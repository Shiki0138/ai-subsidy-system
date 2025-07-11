import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { toast } from 'react-hot-toast';

// API設定
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/api` : 'http://localhost:7001/api';
const REQUEST_TIMEOUT = 30000; // 30秒

// レスポンス型定義
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface ApiError {
  message: string;
  status: number;
  code?: string;
  details?: any;
}

// Axiosインスタンス作成
const createApiInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      'Content-Type': 'application/json',
    },
  });

  // リクエストインターセプター
  instance.interceptors.request.use(
    (config) => {
      // 認証トークンを自動付与
      const token = getAuthToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      // リクエストID付与（デバッグ用）
      config.headers['X-Request-ID'] = generateRequestId();

      // 開発環境でのログ出力
      if (process.env.NODE_ENV === 'development') {
        console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`, {
          data: config.data,
          params: config.params,
        });
      }

      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  // レスポンスインターセプター
  instance.interceptors.response.use(
    (response: AxiosResponse<ApiResponse>) => {
      // 開発環境でのログ出力
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ API Response: ${response.config.method?.toUpperCase()} ${response.config.url}`, {
          status: response.status,
          data: response.data,
        });
      }

      // API レスポンスが success: false の場合はエラーとして扱う
      if (response.data && response.data.success === false) {
        const error: ApiError = {
          message: response.data.error || response.data.message || 'API エラーが発生しました',
          status: response.status,
          details: response.data,
        };
        return Promise.reject(error);
      }

      return response;
    },
    (error) => {
      // 開発環境でのログ出力
      if (process.env.NODE_ENV === 'development') {
        console.error(`❌ API Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
          status: error.response?.status,
          message: error.message,
          data: error.response?.data,
        });
      }

      // エラーハンドリング
      const apiError = handleApiError(error);
      
      // 特定のエラーに対する自動処理
      if (apiError.status === 401) {
        handleUnauthorized();
      } else if (apiError.status >= 500) {
        // サーバーエラーの場合はトースト表示
        toast.error('サーバーエラーが発生しました。しばらく後でお試しください。');
      }

      return Promise.reject(apiError);
    }
  );

  return instance;
};

// エラーハンドリング
const handleApiError = (error: any): ApiError => {
  if (error.response) {
    // サーバーからのレスポンスエラー
    const status = error.response.status;
    const data = error.response.data;
    
    let message = 'エラーが発生しました';
    
    if (data?.error) {
      message = data.error;
    } else if (data?.message) {
      message = data.message;
    } else {
      // ステータスコードに基づくデフォルトメッセージ
      switch (status) {
        case 400:
          message = '不正なリクエストです';
          break;
        case 401:
          message = '認証が必要です';
          break;
        case 403:
          message = 'アクセス権限がありません';
          break;
        case 404:
          message = 'リソースが見つかりません';
          break;
        case 422:
          message = '入力内容に問題があります';
          break;
        case 429:
          message = 'リクエストが多すぎます。しばらく後でお試しください';
          break;
        case 500:
          message = 'サーバー内部エラーが発生しました';
          break;
        case 502:
        case 503:
        case 504:
          message = 'サーバーが一時的に利用できません';
          break;
        default:
          message = `エラーが発生しました (${status})`;
      }
    }

    return {
      message,
      status,
      code: data?.code,
      details: data,
    };
  } else if (error.request) {
    // ネットワークエラー
    return {
      message: 'ネットワークエラーが発生しました。インターネット接続を確認してください。',
      status: 0,
    };
  } else {
    // その他のエラー
    return {
      message: error.message || '予期しないエラーが発生しました',
      status: 0,
    };
  }
};

// 認証トークン取得
const getAuthToken = (): string | null => {
  // ローカルストレージまたはセッションストレージからトークンを取得
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};

// 認証トークン設定
export const setAuthToken = (token: string, persistent = false): void => {
  if (persistent) {
    localStorage.setItem('authToken', token);
    sessionStorage.removeItem('authToken');
  } else {
    sessionStorage.setItem('authToken', token);
    localStorage.removeItem('authToken');
  }
};

// 認証トークン削除
export const removeAuthToken = (): void => {
  localStorage.removeItem('authToken');
  sessionStorage.removeItem('authToken');
};

// 未認証時の処理
const handleUnauthorized = (): void => {
  removeAuthToken();
  
  // 現在のページがログインページでない場合はリダイレクト
  if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
    // リダイレクト先を保存
    sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
    
    // ログインページにリダイレクト
    window.location.href = '/login?reason=session_expired';
  }
};

// リクエストID生成
const generateRequestId = (): string => {
  return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// ファイルダウンロード
export const downloadFile = async (url: string, filename?: string): Promise<void> => {
  try {
    const response = await api.get(url, {
      responseType: 'blob',
    });

    const blob = new Blob([response.data]);
    const downloadUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename || 'download';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    window.URL.revokeObjectURL(downloadUrl);
  } catch (error) {
    console.error('File download failed:', error);
    toast.error('ファイルのダウンロードに失敗しました');
  }
};

// リトライ機能付きリクエスト
export const retryRequest = async <T>(
  requestFn: () => Promise<T>,
  maxRetries = 3,
  delay = 1000
): Promise<T> => {
  let lastError: any;

  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await requestFn();
    } catch (error) {
      lastError = error;
      
      if (i < maxRetries) {
        // 指数バックオフでリトライ間隔を調整
        const retryDelay = delay * Math.pow(2, i);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        
        console.warn(`Request failed, retrying... (${i + 1}/${maxRetries})`, error);
      }
    }
  }

  throw lastError;
};

// APIインスタンス
export const api = createApiInstance();

// APIヘルス チェック
export const checkApiHealth = async (): Promise<{
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  version?: string;
  uptime?: number;
}> => {
  try {
    const response = await api.get('/health');
    return response.data;
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
    };
  }
};

// TypeScript用の型エクスポート
export type { AxiosRequestConfig as ApiRequestConfig };
export type { AxiosResponse as ApiRawResponse };