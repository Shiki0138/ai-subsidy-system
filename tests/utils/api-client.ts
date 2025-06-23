/**
 * API Client for Testing
 * テスト用APIクライアント
 * 作成日: 2025-06-20
 */

import axios, { AxiosInstance, AxiosResponse, AxiosRequestConfig } from 'axios';

export interface APIResponse<T = any> {
  status: number;
  data: T;
  headers: Record<string, string>;
  duration: number;
}

export interface APIError {
  status: number;
  message: string;
  code?: string;
  details?: any;
}

export class APIClient {
  private client: AxiosInstance;
  private baseURL: string;
  private authToken?: string;
  private requestTimings: Map<string, number> = new Map();

  constructor(baseURL: string = 'http://localhost:3000') {
    this.baseURL = baseURL;
    this.client = axios.create({
      baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // リクエスト・レスポンスインターセプター
    this.setupInterceptors();
  }

  /**
   * インターセプターの設定
   */
  private setupInterceptors() {
    // リクエストインターセプター
    this.client.interceptors.request.use(
      (config) => {
        // 認証トークンの自動付与
        if (this.authToken) {
          config.headers.Authorization = `Bearer ${this.authToken}`;
        }

        // リクエスト開始時間の記録
        const requestId = `${config.method?.toUpperCase()}-${config.url}`;
        this.requestTimings.set(requestId, Date.now());

        // テスト用ヘッダーの追加
        config.headers['X-Test-Client'] = 'playwright-e2e';
        config.headers['X-Test-Timestamp'] = new Date().toISOString();

        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // レスポンスインターセプター
    this.client.interceptors.response.use(
      (response) => {
        // レスポンス時間の計算
        const requestId = `${response.config.method?.toUpperCase()}-${response.config.url}`;
        const startTime = this.requestTimings.get(requestId);
        if (startTime) {
          const duration = Date.now() - startTime;
          (response as any).duration = duration;
          this.requestTimings.delete(requestId);
        }

        return response;
      },
      (error) => {
        // エラーレスポンスの標準化
        const apiError: APIError = {
          status: error.response?.status || 500,
          message: error.response?.data?.message || error.message,
          code: error.response?.data?.code,
          details: error.response?.data?.details
        };
        
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * 認証
   */
  async authenticate(email: string, password: string): Promise<APIResponse<{token: string}>> {
    const response = await this.post('/api/auth/login', { email, password });
    this.authToken = response.data.token;
    return response;
  }

  /**
   * GETリクエスト
   */
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    const response = await this.client.get(url, config);
    return this.formatResponse(response);
  }

  /**
   * POSTリクエスト
   */
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    const response = await this.client.post(url, data, config);
    return this.formatResponse(response);
  }

  /**
   * PUTリクエスト
   */
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    const response = await this.client.put(url, data, config);
    return this.formatResponse(response);
  }

  /**
   * DELETEリクエスト
   */
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    const response = await this.client.delete(url, config);
    return this.formatResponse(response);
  }

  /**
   * PATCHリクエスト
   */
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<APIResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return this.formatResponse(response);
  }

  /**
   * レスポンスの標準化
   */
  private formatResponse<T>(response: AxiosResponse): APIResponse<T> {
    return {
      status: response.status,
      data: response.data,
      headers: response.headers as Record<string, string>,
      duration: (response as any).duration || 0
    };
  }

  /**
   * バッチリクエスト実行
   */
  async batch(requests: Array<{
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    url: string;
    data?: any;
    config?: AxiosRequestConfig;
  }>): Promise<APIResponse[]> {
    const promises = requests.map(req => {
      switch (req.method) {
        case 'GET':
          return this.get(req.url, req.config);
        case 'POST':
          return this.post(req.url, req.data, req.config);
        case 'PUT':
          return this.put(req.url, req.data, req.config);
        case 'DELETE':
          return this.delete(req.url, req.config);
        case 'PATCH':
          return this.patch(req.url, req.data, req.config);
        default:
          throw new Error(`Unsupported method: ${req.method}`);
      }
    });

    return Promise.all(promises);
  }

  /**
   * 進捗管理API
   */
  async progressAPI() {
    return {
      create: (applicationId: string, data: any) => 
        this.post(`/api/projects/${applicationId}/progress`, data),
      
      get: (applicationId: string) => 
        this.get(`/api/projects/${applicationId}/progress`),
      
      update: (applicationId: string, data: any) => 
        this.put(`/api/projects/${applicationId}/progress`, data),
      
      delete: (applicationId: string) => 
        this.delete(`/api/projects/${applicationId}/progress`),
      
      addMilestone: (projectId: string, milestone: any) => 
        this.post(`/api/projects/${projectId}/milestones`, milestone),
      
      updateMilestone: (milestoneId: string, data: any) => 
        this.put(`/api/milestones/${milestoneId}`, data),
      
      deleteMilestone: (milestoneId: string) => 
        this.delete(`/api/milestones/${milestoneId}`)
    };
  }

  /**
   * 結果報告API
   */
  async reportsAPI() {
    return {
      create: (applicationId: string, report: any) => 
        this.post(`/api/applications/${applicationId}/reports`, report),
      
      get: (applicationId: string) => 
        this.get(`/api/applications/${applicationId}/reports`),
      
      update: (reportId: string, data: any) => 
        this.put(`/api/reports/${reportId}`, data),
      
      submit: (reportId: string) => 
        this.post(`/api/reports/${reportId}/submit`),
      
      approve: (reportId: string) => 
        this.post(`/api/reports/${reportId}/approve`)
    };
  }

  /**
   * 添付書類API
   */
  async documentsAPI() {
    return {
      generate: (documentData: any) => 
        this.post('/api/documents/generate', documentData),
      
      getTemplates: () => 
        this.get('/api/documents/templates'),
      
      createTemplate: (template: any) => 
        this.post('/api/documents/templates', template),
      
      updateTemplate: (templateId: string, data: any) => 
        this.put(`/api/documents/templates/${templateId}`, data)
    };
  }

  /**
   * 自動入力API
   */
  async autoFillAPI() {
    return {
      getSuggestions: (applicationId: string, sections?: string[]) => 
        this.post('/api/auto-fill/suggestions', { applicationId, sections }),
      
      applySuggestions: (applicationId: string, suggestions: any) => 
        this.post('/api/auto-fill/apply', { applicationId, suggestions }),
      
      getProgress: (applicationId: string) => 
        this.get(`/api/auto-fill/progress/${applicationId}`)
    };
  }

  /**
   * 募集要項API
   */
  async guidelinesAPI() {
    return {
      parse: (source: { url?: string; file?: Buffer; text?: string }) => 
        this.post('/api/guidelines/parse', source),
      
      getAll: () => 
        this.get('/api/guidelines'),
      
      getById: (id: string) => 
        this.get(`/api/guidelines/${id}`),
      
      update: (id: string, data: any) => 
        this.put(`/api/guidelines/${id}`, data),
      
      delete: (id: string) => 
        this.delete(`/api/guidelines/${id}`)
    };
  }

  /**
   * パフォーマンス測定ユーティリティ
   */
  async measurePerformance<T>(
    operation: () => Promise<T>,
    iterations: number = 1
  ): Promise<{
    result: T;
    averageTime: number;
    minTime: number;
    maxTime: number;
    times: number[];
  }> {
    const times: number[] = [];
    let result: T;

    for (let i = 0; i < iterations; i++) {
      const start = Date.now();
      result = await operation();
      const end = Date.now();
      times.push(end - start);
    }

    return {
      result: result!,
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      times
    };
  }

  /**
   * 負荷テスト実行
   */
  async loadTest(
    requests: Array<() => Promise<any>>,
    concurrency: number = 10
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    errors: APIError[];
  }> {
    const chunks = [];
    for (let i = 0; i < requests.length; i += concurrency) {
      chunks.push(requests.slice(i, i + concurrency));
    }

    let successfulRequests = 0;
    let failedRequests = 0;
    const responseTimes: number[] = [];
    const errors: APIError[] = [];

    for (const chunk of chunks) {
      const promises = chunk.map(async (request) => {
        const start = Date.now();
        try {
          await request();
          responseTimes.push(Date.now() - start);
          successfulRequests++;
        } catch (error) {
          failedRequests++;
          errors.push(error as APIError);
        }
      });

      await Promise.all(promises);
    }

    return {
      totalRequests: requests.length,
      successfulRequests,
      failedRequests,
      averageResponseTime: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
      errors
    };
  }

  /**
   * ヘルスチェック
   */
  async healthCheck(): Promise<{
    status: 'healthy' | 'unhealthy';
    services: Record<string, 'up' | 'down'>;
    responseTime: number;
  }> {
    const start = Date.now();
    
    try {
      const response = await this.get('/api/health');
      const responseTime = Date.now() - start;
      
      return {
        status: response.data.status,
        services: response.data.services,
        responseTime
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        services: {},
        responseTime: Date.now() - start
      };
    }
  }

  /**
   * テストデータのクリーンアップ
   */
  async cleanup(): Promise<void> {
    try {
      await this.delete('/api/test/cleanup');
    } catch (error) {
      console.warn('Cleanup failed:', error);
    }
  }

  /**
   * 認証トークンのクリア
   */
  clearAuth(): void {
    this.authToken = undefined;
  }
}

/**
 * テスト用のAPIクライアントファクトリ
 */
export class APIClientFactory {
  static createForEnvironment(env: 'development' | 'staging' | 'production'): APIClient {
    const baseURLs = {
      development: 'http://localhost:3000',
      staging: 'https://staging-api.ai-subsidy.com',
      production: 'https://api.ai-subsidy.com'
    };

    return new APIClient(baseURLs[env]);
  }

  static createWithAuth(baseURL: string, token: string): APIClient {
    const client = new APIClient(baseURL);
    (client as any).authToken = token;
    return client;
  }
}