/**
 * Advanced Rate Limiting Middleware
 * Redis-integrated, user-specific, dynamic rate limiting with cost tracking
 */

import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';
import { Request, Response, NextFunction } from 'express';
import winston from 'winston';

interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

interface RateLimitOptions {
  windowMs: number;
  max: number;
  message: string;
  errorCode?: string;
  keyGenerator?: (req: AuthenticatedRequest) => string;
  skipIf?: (req: AuthenticatedRequest) => boolean;
  costFunction?: (req: AuthenticatedRequest) => number;
  userTierLimits?: Record<string, number>;
}

interface CostBasedLimitOptions {
  windowMs: number;
  maxCost: number;
  message: string;
  costFunction: (req: AuthenticatedRequest) => number;
  keyGenerator?: (req: AuthenticatedRequest) => string;
}

export class AdvancedRateLimiter {
  private redis: Redis;
  private logger: winston.Logger;

  constructor(redis: Redis, logger: winston.Logger) {
    this.redis = redis;
    this.logger = logger;
  }

  /**
   * Create user-specific rate limiter
   */
  createUserSpecificLimiter(options: RateLimitOptions) {
    const redisStore = new RedisStore({
      client: this.redis,
      prefix: 'rl:user:',
      resetExpiryOnChange: true,
      sendCommand: (...args: any[]) => this.redis.call(args[0], ...args.slice(1)),
    });

    return rateLimit({
      store: redisStore,
      windowMs: options.windowMs,
      max: (req: any) => {
        const userRole = req.user?.role || 'USER';
        
        // Apply role-based limits
        if (options.userTierLimits && options.userTierLimits[userRole]) {
          return options.userTierLimits[userRole];
        }
        
        return options.max;
      },
      message: {
        success: false,
        error: options.message,
        errorCode: options.errorCode || 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil(options.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: options.keyGenerator || ((req: AuthenticatedRequest) => {
        return req.user?.id || req.ip;
      }),
      skip: options.skipIf || (() => false),
      onLimitReached: (req: AuthenticatedRequest) => {
        this.logger.warn('Rate limit exceeded', {
          userId: req.user?.id,
          userRole: req.user?.role,
          ip: req.ip,
          path: req.path,
          userAgent: req.get('User-Agent')
        });
      }
    });
  }

  /**
   * Create API endpoint specific limiter
   */
  createEndpointLimiter(endpoint: string, options: RateLimitOptions) {
    const redisStore = new RedisStore({
      client: this.redis,
      prefix: `rl:endpoint:${endpoint}:`,
      resetExpiryOnChange: true,
      sendCommand: (...args: any[]) => this.redis.call(args[0], ...args.slice(1)),
    });

    return rateLimit({
      store: redisStore,
      windowMs: options.windowMs,
      max: options.max,
      message: {
        success: false,
        error: options.message,
        errorCode: options.errorCode || 'ENDPOINT_RATE_LIMIT_EXCEEDED',
        endpoint,
        retryAfter: Math.ceil(options.windowMs / 1000)
      },
      standardHeaders: true,
      legacyHeaders: false,
      keyGenerator: options.keyGenerator || ((req: AuthenticatedRequest) => {
        return `${req.user?.id || req.ip}:${endpoint}`;
      }),
      onLimitReached: (req: AuthenticatedRequest) => {
        this.logger.warn('Endpoint rate limit exceeded', {
          endpoint,
          userId: req.user?.id,
          ip: req.ip,
          path: req.path
        });
      }
    });
  }

  /**
   * Create cost-based rate limiter (for AI API usage)
   */
  createCostBasedLimiter(options: CostBasedLimitOptions) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const key = options.keyGenerator ? 
          options.keyGenerator(req) : 
          `cost:${req.user?.id || req.ip}`;
        
        const cost = options.costFunction(req);
        const windowKey = `${key}:${Math.floor(Date.now() / options.windowMs)}`;
        
        // Get current cost within window
        const currentCost = await this.redis.get(windowKey) || '0';
        const totalCost = parseInt(currentCost) + cost;
        
        if (totalCost > options.maxCost) {
          this.logger.warn('Cost-based rate limit exceeded', {
            userId: req.user?.id,
            currentCost: parseInt(currentCost),
            requestCost: cost,
            totalCost,
            maxCost: options.maxCost,
            path: req.path
          });
          
          return res.status(429).json({
            success: false,
            error: options.message,
            errorCode: 'COST_LIMIT_EXCEEDED',
            usage: {
              current: parseInt(currentCost),
              requested: cost,
              total: totalCost,
              limit: options.maxCost
            },
            retryAfter: Math.ceil(options.windowMs / 1000)
          });
        }
        
        // Update cost counter
        await this.redis.setex(windowKey, Math.ceil(options.windowMs / 1000), totalCost.toString());
        
        // Add usage info to response headers
        res.set({
          'X-RateLimit-Cost-Current': currentCost,
          'X-RateLimit-Cost-Limit': options.maxCost.toString(),
          'X-RateLimit-Cost-Remaining': (options.maxCost - totalCost).toString()
        });
        
        next();
        
      } catch (error: any) {
        this.logger.error('Cost-based rate limiter error', {
          userId: req.user?.id,
          error: error.message,
          path: req.path
        });
        
        // Fail open - allow request if Redis is down
        next();
      }
    };
  }

  /**
   * Create dynamic rate limiter that adjusts based on system load
   */
  createDynamicLimiter(baseOptions: RateLimitOptions, loadThresholds: { cpu: number; memory: number }) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        // Get system load metrics
        const systemLoad = await this.getSystemLoad();
        
        // Adjust limits based on system load
        let adjustedMax = baseOptions.max;
        
        if (systemLoad.cpu > loadThresholds.cpu || systemLoad.memory > loadThresholds.memory) {
          // Reduce limits during high load
          adjustedMax = Math.floor(baseOptions.max * 0.5);
          
          this.logger.info('Rate limits reduced due to high system load', {
            systemLoad,
            originalLimit: baseOptions.max,
            adjustedLimit: adjustedMax
          });
        }

        // Create dynamic rate limiter
        const dynamicLimiter = this.createUserSpecificLimiter({
          ...baseOptions,
          max: adjustedMax
        });

        dynamicLimiter(req, res, next);
        
      } catch (error: any) {
        this.logger.error('Dynamic rate limiter error', {
          error: error.message,
          path: req.path
        });
        
        // Fallback to base limiter
        const fallbackLimiter = this.createUserSpecificLimiter(baseOptions);
        fallbackLimiter(req, res, next);
      }
    };
  }

  /**
   * Create IP-based suspicious activity detector
   */
  createSuspiciousActivityDetector() {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        const ip = req.ip;
        const suspiciousKey = `suspicious:${ip}`;
        
        // Track request patterns
        const patterns = {
          rapidRequests: await this.trackRapidRequests(ip),
          errorRate: await this.trackErrorRate(ip),
          uniqueEndpoints: await this.trackUniqueEndpoints(ip),
          userAgentChanges: await this.trackUserAgentChanges(ip, req.get('User-Agent') || '')
        };
        
        // Calculate suspicion score
        const suspicionScore = this.calculateSuspicionScore(patterns);
        
        if (suspicionScore > 80) {
          // Block suspicious requests
          await this.redis.setex(`blocked:${ip}`, 3600, suspicionScore.toString()); // 1 hour block
          
          this.logger.warn('Suspicious activity detected - IP blocked', {
            ip,
            suspicionScore,
            patterns,
            userAgent: req.get('User-Agent')
          });
          
          return res.status(429).json({
            success: false,
            error: '不審なアクティビティが検出されました。しばらく時間をおいて再度お試しください。',
            errorCode: 'SUSPICIOUS_ACTIVITY_BLOCKED',
            blockDuration: 3600
          });
        }
        
        if (suspicionScore > 60) {
          // Apply additional rate limiting for moderately suspicious requests
          const strictLimiter = this.createUserSpecificLimiter({
            windowMs: 60 * 1000, // 1 minute
            max: 5,
            message: '不審なアクティビティのため、レート制限が強化されています',
            errorCode: 'ENHANCED_RATE_LIMIT'
          });
          
          return strictLimiter(req, res, next);
        }
        
        next();
        
      } catch (error: any) {
        this.logger.error('Suspicious activity detector error', {
          error: error.message,
          ip: req.ip
        });
        next();
      }
    };
  }

  /**
   * Check if IP is blocked
   */
  async isIPBlocked(ip: string): Promise<boolean> {
    try {
      const blocked = await this.redis.get(`blocked:${ip}`);
      return !!blocked;
    } catch (error) {
      return false;
    }
  }

  /**
   * Whitelist management
   */
  async addToWhitelist(identifier: string, type: 'ip' | 'user', duration?: number) {
    const key = `whitelist:${type}:${identifier}`;
    if (duration) {
      await this.redis.setex(key, duration, '1');
    } else {
      await this.redis.set(key, '1');
    }
    
    this.logger.info('Added to whitelist', { identifier, type, duration });
  }

  async removeFromWhitelist(identifier: string, type: 'ip' | 'user') {
    const key = `whitelist:${type}:${identifier}`;
    await this.redis.del(key);
    
    this.logger.info('Removed from whitelist', { identifier, type });
  }

  async isWhitelisted(identifier: string, type: 'ip' | 'user'): Promise<boolean> {
    const key = `whitelist:${type}:${identifier}`;
    const whitelisted = await this.redis.get(key);
    return !!whitelisted;
  }

  /**
   * Helper methods
   */
  private async getSystemLoad(): Promise<{ cpu: number; memory: number }> {
    // In a real implementation, this would get actual system metrics
    // For now, return mock values
    return {
      cpu: Math.random() * 100,
      memory: Math.random() * 100
    };
  }

  private async trackRapidRequests(ip: string): Promise<number> {
    const key = `rapid:${ip}`;
    const count = await this.redis.incr(key);
    if (count === 1) {
      await this.redis.expire(key, 60); // 1 minute window
    }
    return count;
  }

  private async trackErrorRate(ip: string): Promise<number> {
    const errorKey = `errors:${ip}`;
    const totalKey = `total:${ip}`;
    
    const errors = parseInt(await this.redis.get(errorKey) || '0');
    const total = parseInt(await this.redis.get(totalKey) || '0');
    
    return total > 0 ? (errors / total) * 100 : 0;
  }

  private async trackUniqueEndpoints(ip: string): Promise<number> {
    const key = `endpoints:${ip}`;
    const count = await this.redis.scard(key);
    return count;
  }

  private async trackUserAgentChanges(ip: string, userAgent: string): Promise<number> {
    const key = `ua:${ip}`;
    await this.redis.sadd(key, userAgent);
    await this.redis.expire(key, 3600); // 1 hour
    return await this.redis.scard(key);
  }

  private calculateSuspicionScore(patterns: any): number {
    let score = 0;
    
    // Rapid requests (> 60 per minute)
    if (patterns.rapidRequests > 60) score += 30;
    else if (patterns.rapidRequests > 30) score += 15;
    
    // High error rate (> 50%)
    if (patterns.errorRate > 50) score += 25;
    else if (patterns.errorRate > 25) score += 10;
    
    // Many unique endpoints (> 20)
    if (patterns.uniqueEndpoints > 20) score += 20;
    else if (patterns.uniqueEndpoints > 10) score += 10;
    
    // Multiple user agents (> 5)
    if (patterns.userAgentChanges > 5) score += 25;
    else if (patterns.userAgentChanges > 2) score += 10;
    
    return score;
  }

  /**
   * Get rate limit statistics
   */
  async getRateLimitStats(userId?: string): Promise<any> {
    try {
      const pattern = userId ? `rl:user:${userId}:*` : 'rl:*';
      const keys = await this.redis.keys(pattern);
      
      const stats = {
        totalLimiters: keys.length,
        activeLimits: 0,
        blockedIPs: 0,
        whitelistedUsers: 0,
        timestamp: new Date().toISOString()
      };
      
      // Count active limits
      for (const key of keys) {
        const value = await this.redis.get(key);
        if (value && parseInt(value) > 0) {
          stats.activeLimits++;
        }
      }
      
      // Count blocked IPs
      const blockedKeys = await this.redis.keys('blocked:*');
      stats.blockedIPs = blockedKeys.length;
      
      // Count whitelisted users
      const whitelistKeys = await this.redis.keys('whitelist:user:*');
      stats.whitelistedUsers = whitelistKeys.length;
      
      return stats;
    } catch (error: any) {
      this.logger.error('Error getting rate limit stats', { error: error.message });
      return null;
    }
  }
}

export default AdvancedRateLimiter;