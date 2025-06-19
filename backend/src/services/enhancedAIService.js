/**
 * Enhanced AI Service with Enterprise-grade Error Handling
 * Features: Retry logic, Circuit breaker, Cost monitoring, Timeout management
 */

const { OpenAI } = require('openai');
const winston = require('winston');

// Enhanced logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'logs/ai-error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/ai-combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Configuration
const CONFIG = {
  OPENAI_API_KEY: process.env.OPENAI_API_KEY,
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
  MAX_RETRIES: 3,
  BASE_DELAY: 1000, // 1 second
  MAX_DELAY: 30000, // 30 seconds
  TIMEOUT: {
    short: 30000,   // 30s for simple prompts
    medium: 60000,  // 1m for complex analysis
    long: 120000    // 2m for very complex operations
  },
  CIRCUIT_BREAKER: {
    failureThreshold: 5,
    resetTimeout: 60000, // 1 minute
    monitoringPeriod: 300000 // 5 minutes
  },
  COST_LIMITS: {
    dailyLimit: 50.00, // $50 per day
    monthlyLimit: 1000.00, // $1000 per month
    perRequestLimit: 2.00 // $2 per request
  }
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: CONFIG.OPENAI_API_KEY || 'test-key',
  timeout: CONFIG.TIMEOUT.medium
});

/**
 * Enhanced Error Classes
 */
class AIError extends Error {
  constructor(message, type, provider, retryable = false, retryAfter = null) {
    super(message);
    this.name = 'AIError';
    this.type = type;
    this.provider = provider;
    this.retryable = retryable;
    this.retryAfter = retryAfter;
    this.timestamp = new Date().toISOString();
  }
}

class RateLimitError extends AIError {
  constructor(provider, retryAfter) {
    super(`Rate limit exceeded for ${provider}`, 'rate_limit', provider, true, retryAfter);
  }
}

class QuotaExceededError extends AIError {
  constructor(provider) {
    super(`Quota exceeded for ${provider}`, 'quota_exceeded', provider, false);
  }
}

class NetworkError extends AIError {
  constructor(provider, originalError) {
    super(`Network error for ${provider}: ${originalError.message}`, 'network', provider, true);
    this.originalError = originalError;
  }
}

/**
 * Circuit Breaker Pattern Implementation
 */
class CircuitBreaker {
  constructor(provider, options = {}) {
    this.provider = provider;
    this.failureThreshold = options.failureThreshold || CONFIG.CIRCUIT_BREAKER.failureThreshold;
    this.resetTimeout = options.resetTimeout || CONFIG.CIRCUIT_BREAKER.resetTimeout;
    this.monitoringPeriod = options.monitoringPeriod || CONFIG.CIRCUIT_BREAKER.monitoringPeriod;
    
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = 0;
    this.successCount = 0;
    this.requestCount = 0;
    
    this.resetMonitoringPeriod();
  }

  resetMonitoringPeriod() {
    setInterval(() => {
      this.failureCount = 0;
      this.successCount = 0;
      this.requestCount = 0;
    }, this.monitoringPeriod);
  }

  async execute(operation) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.failureCount = 0;
      } else {
        throw new AIError(
          `Circuit breaker is OPEN for ${this.provider}`,
          'circuit_breaker_open',
          this.provider,
          true,
          this.resetTimeout - (Date.now() - this.lastFailureTime)
        );
      }
    }

    this.requestCount++;

    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  onSuccess() {
    this.successCount++;
    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failureCount = 0;
    }
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      logger.error(`Circuit breaker opened for ${this.provider}`, {
        failureCount: this.failureCount,
        threshold: this.failureThreshold
      });
    }
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      successCount: this.successCount,
      requestCount: this.requestCount,
      failureRate: this.requestCount > 0 ? this.failureCount / this.requestCount : 0
    };
  }
}

/**
 * Cost Tracking and Management
 */
class CostTracker {
  constructor() {
    this.dailyCost = 0;
    this.monthlyCost = 0;
    this.requests = [];
    this.lastResetDate = new Date().toDateString();
    this.lastResetMonth = new Date().getMonth();
  }

  checkAndResetCounters() {
    const now = new Date();
    
    // Reset daily counter
    if (now.toDateString() !== this.lastResetDate) {
      this.dailyCost = 0;
      this.lastResetDate = now.toDateString();
    }
    
    // Reset monthly counter
    if (now.getMonth() !== this.lastResetMonth) {
      this.monthlyCost = 0;
      this.lastResetMonth = now.getMonth();
    }
  }

  validateCostLimits(estimatedCost) {
    this.checkAndResetCounters();
    
    if (estimatedCost > CONFIG.COST_LIMITS.perRequestLimit) {
      throw new AIError(
        `Request cost $${estimatedCost} exceeds per-request limit $${CONFIG.COST_LIMITS.perRequestLimit}`,
        'cost_limit_exceeded',
        'system',
        false
      );
    }
    
    if (this.dailyCost + estimatedCost > CONFIG.COST_LIMITS.dailyLimit) {
      throw new AIError(
        `Daily cost limit exceeded. Current: $${this.dailyCost}, Limit: $${CONFIG.COST_LIMITS.dailyLimit}`,
        'daily_limit_exceeded',
        'system',
        false
      );
    }
    
    if (this.monthlyCost + estimatedCost > CONFIG.COST_LIMITS.monthlyLimit) {
      throw new AIError(
        `Monthly cost limit exceeded. Current: $${this.monthlyCost}, Limit: $${CONFIG.COST_LIMITS.monthlyLimit}`,
        'monthly_limit_exceeded',
        'system',
        false
      );
    }
  }

  recordUsage(usage, provider) {
    const cost = this.calculateCost(usage, provider);
    this.dailyCost += cost;
    this.monthlyCost += cost;
    
    this.requests.push({
      timestamp: new Date().toISOString(),
      provider,
      usage,
      cost,
      dailyTotal: this.dailyCost,
      monthlyTotal: this.monthlyCost
    });

    // Keep only last 1000 requests
    if (this.requests.length > 1000) {
      this.requests = this.requests.slice(-1000);
    }

    logger.info('AI usage recorded', { provider, cost, usage });
    return cost;
  }

  calculateCost(usage, provider) {
    if (provider === 'openai') {
      // GPT-3.5-turbo pricing (2024)
      const inputCost = (usage.prompt_tokens / 1000) * 0.0015;
      const outputCost = (usage.completion_tokens / 1000) * 0.002;
      return inputCost + outputCost;
    } else if (provider === 'anthropic') {
      // Claude 3.5 Sonnet pricing (2024)
      const inputCost = (usage.input_tokens / 1000) * 0.003;
      const outputCost = (usage.output_tokens / 1000) * 0.015;
      return inputCost + outputCost;
    }
    return 0;
  }

  getStats() {
    this.checkAndResetCounters();
    
    const last24h = this.requests.filter(
      req => Date.now() - new Date(req.timestamp).getTime() < 24 * 60 * 60 * 1000
    );
    
    return {
      dailyCost: this.dailyCost,
      monthlyCost: this.monthlyCost,
      requestCount24h: last24h.length,
      avgCostPerRequest: last24h.length > 0 
        ? last24h.reduce((sum, req) => sum + req.cost, 0) / last24h.length 
        : 0,
      limits: CONFIG.COST_LIMITS,
      recentRequests: this.requests.slice(-10)
    };
  }
}

/**
 * Request Queue for Concurrency Control
 */
class RequestQueue {
  constructor(maxConcurrency = 3) {
    this.queue = [];
    this.processing = 0;
    this.maxConcurrency = maxConcurrency;
  }

  async add(operation) {
    return new Promise((resolve, reject) => {
      this.queue.push({ operation, resolve, reject });
      this.process();
    });
  }

  async process() {
    if (this.processing >= this.maxConcurrency || this.queue.length === 0) {
      return;
    }

    const { operation, resolve, reject } = this.queue.shift();
    this.processing++;

    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    } finally {
      this.processing--;
      this.process(); // Process next item
    }
  }

  getStatus() {
    return {
      queueLength: this.queue.length,
      processing: this.processing,
      maxConcurrency: this.maxConcurrency
    };
  }
}

// Initialize global instances
const circuitBreakers = {
  openai: new CircuitBreaker('openai'),
  anthropic: new CircuitBreaker('anthropic')
};

const costTracker = new CostTracker();
const requestQueue = new RequestQueue(3);

/**
 * Enhanced Retry Logic with Exponential Backoff
 */
async function withRetry(operation, provider, maxRetries = CONFIG.MAX_RETRIES) {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.info(`AI request attempt ${attempt}/${maxRetries}`, { provider });
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Don't retry for non-retryable errors
      if (error instanceof AIError && !error.retryable) {
        throw error;
      }
      
      // Don't retry on last attempt
      if (attempt === maxRetries) {
        break;
      }
      
      // Calculate delay with exponential backoff and jitter
      const baseDelay = Math.min(CONFIG.BASE_DELAY * Math.pow(2, attempt - 1), CONFIG.MAX_DELAY);
      const jitter = Math.random() * 1000; // Add up to 1 second jitter
      const delay = baseDelay + jitter;
      
      // Use retry-after header if available
      const actualDelay = error.retryAfter ? Math.min(error.retryAfter * 1000, CONFIG.MAX_DELAY) : delay;
      
      logger.warn(`AI request failed, retrying in ${actualDelay}ms`, {
        provider,
        attempt,
        error: error.message,
        delay: actualDelay
      });
      
      await new Promise(resolve => setTimeout(resolve, actualDelay));
    }
  }
  
  throw lastError;
}

/**
 * Enhanced OpenAI Request Handler
 */
async function makeOpenAIRequest(prompt, systemMessage, options = {}) {
  const {
    maxTokens = 1000,
    temperature = 0.7,
    model = 'gpt-3.5-turbo',
    timeout = CONFIG.TIMEOUT.medium
  } = options;

  // Estimate cost before making request
  const estimatedTokens = Math.ceil((prompt.length + (systemMessage || '').length) / 4) + maxTokens;
  const estimatedCost = costTracker.calculateCost({ 
    prompt_tokens: estimatedTokens * 0.7, 
    completion_tokens: maxTokens * 0.3 
  }, 'openai');
  
  costTracker.validateCostLimits(estimatedCost);

  const operation = async () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const messages = [
        {
          role: 'system',
          content: systemMessage || 'あなたは補助金申請書作成の専門家です。正確で説得力のある内容を作成してください。'
        },
        {
          role: 'user',
          content: prompt
        }
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${CONFIG.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model,
          messages,
          max_tokens: maxTokens,
          temperature
        }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status === 429) {
          const retryAfter = parseInt(response.headers.get('retry-after')) || 60;
          throw new RateLimitError('openai', retryAfter);
        } else if (response.status === 402) {
          throw new QuotaExceededError('openai');
        } else if (response.status >= 500) {
          throw new NetworkError('openai', new Error(`Server error: ${response.status}`));
        } else {
          throw new AIError(`OpenAI API Error: ${response.status}`, 'api_error', 'openai', false);
        }
      }

      const data = await response.json();
      
      // Record actual usage
      if (data.usage) {
        costTracker.recordUsage(data.usage, 'openai');
      }

      return {
        content: data.choices[0].message.content,
        usage: data.usage,
        model: data.model,
        timestamp: new Date().toISOString(),
        provider: 'openai'
      };

    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error.name === 'AbortError') {
        throw new AIError(`Request timeout after ${timeout}ms`, 'timeout', 'openai', true);
      }
      
      if (error instanceof AIError) {
        throw error;
      }
      
      throw new NetworkError('openai', error);
    }
  };

  return await requestQueue.add(() => 
    circuitBreakers.openai.execute(() => 
      withRetry(operation, 'openai')
    )
  );
}

/**
 * Mock Response for Development
 */
function generateMockResponse(prompt, systemMessage, startTime) {
  const mockResponses = {
    businessPlan: `【AI生成事業計画書】

## 1. 現状の課題分析
当社の現在の業務プロセスにおいて、以下の重要な課題が確認されています：
- 手作業による非効率な業務処理（処理時間40%増）
- データの分散管理による情報連携不備
- 属人的な業務ノウハウの蓄積とリスク

## 2. デジタル変革による解決策
最新のAI・IoT技術を活用した統合業務プラットフォームを構築し、包括的なデジタル変革を実施します：
- AIによる自動データ分析・予測システム
- クラウドベースの統合業務管理
- リアルタイム監視・制御システム

## 3. 定量的な期待効果
- 業務効率向上：35%の処理時間短縮
- コスト削減：年間300万円の運営費削減
- 売上向上：20%の顧客満足度向上による売上増

## 4. 詳細実施スケジュール
フェーズ1（1-3ヶ月）：要件定義・システム設計・プロトタイプ開発
フェーズ2（4-6ヶ月）：本格開発・テスト・試験運用
フェーズ3（7-9ヶ月）：本格稼働・効果測定・改善実施

## 5. 投資対効果を重視した予算計画
総事業費：500万円（補助金活用）
- システム開発・導入：350万円
- 機器・インフラ：100万円
- 研修・運用支援：50万円`,

    applicationContent: `【補助金申請書・事業概要】

本事業は、中小企業におけるDX推進の課題を解決する革新的な統合業務プラットフォームの開発・導入プロジェクトです。

AI技術とクラウドコンピューティングを組み合わせた次世代型業務システムにより、従来の分散した業務プロセスを統合し、データドリブンな経営判断を可能にします。

具体的には、顧客管理・在庫管理・財務管理・人事管理を一元化し、リアルタイムダッシュボードによる可視化と、機械学習による予測分析機能を実装します。

これにより、業務効率35%向上、コスト20%削減、売上15%増加を実現し、地域の中小企業のモデルケースとして地域経済の活性化に貢献します。`,

    approvalPrediction: `{
  "totalScore": 82,
  "confidence": "高",
  "breakdown": {
    "feasibility": 85,
    "viability": 80,
    "effectiveness": 84,
    "budget": 79,
    "innovation": 86
  },
  "strengths": [
    "具体的な数値目標と効果測定指標が明確",
    "最新技術の効果的な活用方法が示されている",
    "段階的な実施計画で実現可能性が高い",
    "地域経済への波及効果が期待できる"
  ],
  "suggestions": [
    "競合他社分析と差別化ポイントをより詳細に記載",
    "技術的リスクとその対策を具体的に明示", 
    "事業継続性と収益性の長期展望を追加",
    "外部パートナーとの連携体制を明確化"
  ],
  "adoptionProbability": "75%",
  "recommendedImprovements": [
    "市場調査データの追加による事業妥当性の強化",
    "プロトタイプ・実証実験結果の提示",
    "知的財産戦略の明確化"
  ]
}`
  };

  let content = mockResponses.businessPlan;
  if (prompt.includes('申請書') || prompt.includes('事業概要')) {
    content = mockResponses.applicationContent;
  }
  if (prompt.includes('採択') || prompt.includes('評価') || prompt.includes('分析')) {
    content = mockResponses.approvalPrediction;
  }
  
  return {
    content,
    usage: { 
      prompt_tokens: Math.ceil(prompt.length / 4), 
      completion_tokens: Math.ceil(content.length / 4), 
      total_tokens: Math.ceil((prompt.length + content.length) / 4) 
    },
    processingTime: Date.now() - startTime,
    timestamp: new Date().toISOString(),
    provider: 'mock',
    mock: true
  };
}

/**
 * Main AI Request Function with Fallback
 */
async function makeAIRequest(prompt, systemMessage = null, options = {}) {
  const startTime = Date.now();
  
  // Use mock if no API key or in development mode
  if (!CONFIG.OPENAI_API_KEY || CONFIG.OPENAI_API_KEY.includes('test')) {
    logger.info('Using mock AI response (development mode)');
    await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API delay
    return generateMockResponse(prompt, systemMessage, startTime);
  }

  try {
    const result = await makeOpenAIRequest(prompt, systemMessage, options);
    result.processingTime = Date.now() - startTime;
    
    logger.info('AI request completed successfully', {
      provider: 'openai',
      tokens: result.usage?.total_tokens,
      processingTime: result.processingTime
    });
    
    return result;
  } catch (error) {
    logger.error('AI request failed, falling back to mock', {
      error: error.message,
      type: error.type,
      provider: error.provider
    });
    
    // Fallback to mock response
    return generateMockResponse(prompt, systemMessage, startTime);
  }
}

/**
 * System Health and Status
 */
function getSystemStatus() {
  return {
    timestamp: new Date().toISOString(),
    circuitBreakers: Object.keys(circuitBreakers).reduce((acc, key) => {
      acc[key] = circuitBreakers[key].getStatus();
      return acc;
    }, {}),
    costTracking: costTracker.getStats(),
    requestQueue: requestQueue.getStatus(),
    configuration: {
      maxRetries: CONFIG.MAX_RETRIES,
      timeouts: CONFIG.TIMEOUT,
      costLimits: CONFIG.COST_LIMITS
    }
  };
}

module.exports = {
  makeAIRequest,
  getSystemStatus,
  AIError,
  RateLimitError,
  QuotaExceededError,
  NetworkError,
  CONFIG
};