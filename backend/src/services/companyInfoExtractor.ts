/**
 * Company Information Extraction Service
 * AI-powered web scraping for automatic company profile filling
 */

import puppeteer, { Browser, Page } from 'puppeteer';
import axios from 'axios';
import * as cheerio from 'cheerio';
import OpenAI from 'openai';
import winston from 'winston';
import { URL } from 'url';

interface CompanyInfo {
  companyName?: string;
  representativeName?: string;
  businessType?: string;
  foundedYear?: number;
  employeeCount?: number;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  capitalAmount?: number;
  description?: string;
  services?: string[];
  industry?: string;
  certifications?: string[];
  awards?: string[];
  socialLinks?: {
    facebook?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
  };
}

interface ExtractionResult {
  success: boolean;
  data: CompanyInfo;
  confidence: number;
  sources: string[];
  extractedAt: string;
  processingTime: number;
  errors?: string[];
}

export class CompanyInfoExtractor {
  private browser: Browser | null = null;
  private openai: OpenAI;
  private logger: winston.Logger;

  constructor(logger: winston.Logger) {
    this.logger = logger;
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY!
    });
  }

  /**
   * Extract company information from website URL
   */
  async extractFromWebsite(url: string): Promise<ExtractionResult> {
    const startTime = Date.now();
    const result: ExtractionResult = {
      success: false,
      data: {},
      confidence: 0,
      sources: [],
      extractedAt: new Date().toISOString(),
      processingTime: 0,
      errors: []
    };

    try {
      // Validate URL
      const validatedUrl = this.validateAndNormalizeUrl(url);
      result.sources.push(validatedUrl);

      // Initialize browser if not already done
      if (!this.browser) {
        await this.initializeBrowser();
      }

      // Extract from main page
      const mainPageData = await this.extractFromPage(validatedUrl);
      
      // Try to find and extract from additional pages
      const additionalData = await this.extractFromAdditionalPages(validatedUrl, mainPageData.links);

      // Combine all extracted data
      const rawData = this.combineExtractionData([mainPageData, ...additionalData]);

      // Use AI to clean and structure the data
      const aiProcessedData = await this.processWithAI(rawData, validatedUrl);

      result.data = aiProcessedData.data;
      result.confidence = aiProcessedData.confidence;
      result.success = true;

      this.logger.info('Company information extraction successful', {
        url: validatedUrl,
        confidence: result.confidence,
        extractedFields: Object.keys(result.data).length
      });

    } catch (error: any) {
      result.errors?.push(error.message);
      this.logger.error('Company information extraction failed', {
        url,
        error: error.message,
        stack: error.stack
      });
    } finally {
      result.processingTime = Date.now() - startTime;
    }

    return result;
  }

  /**
   * Extract company information from multiple sources
   */
  async extractFromMultipleSources(urls: string[]): Promise<ExtractionResult> {
    const results: ExtractionResult[] = [];
    
    for (const url of urls) {
      try {
        const result = await this.extractFromWebsite(url);
        results.push(result);
      } catch (error: any) {
        this.logger.warn('Failed to extract from URL', { url, error: error.message });
      }
    }

    // Merge results from multiple sources
    return this.mergeExtractionResults(results);
  }

  /**
   * Initialize Puppeteer browser
   */
  private async initializeBrowser(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
      
      this.logger.info('Puppeteer browser initialized');
    } catch (error: any) {
      this.logger.error('Failed to initialize browser', { error: error.message });
      throw error;
    }
  }

  /**
   * Extract data from a single page
   */
  private async extractFromPage(url: string): Promise<any> {
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }

    const page = await this.browser.newPage();
    
    try {
      // Set user agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1366, height: 768 });

      // Set request interception to block unnecessary resources
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const resourceType = req.resourceType();
        if (['image', 'stylesheet', 'font', 'media'].includes(resourceType)) {
          req.abort();
        } else {
          req.continue();
        }
      });

      // Navigate to page
      await page.goto(url, { 
        waitUntil: 'networkidle2', 
        timeout: 30000 
      });

      // Wait for content to load
      await page.waitForTimeout(2000);

      // Extract structured data (JSON-LD, microdata, etc.)
      const structuredData = await this.extractStructuredData(page);

      // Extract content using CSS selectors
      const contentData = await this.extractContentData(page);

      // Extract meta tags
      const metaData = await this.extractMetaData(page);

      // Get page links for additional pages to scrape
      const links = await this.extractRelevantLinks(page, url);

      return {
        url,
        structuredData,
        contentData,
        metaData,
        links,
        timestamp: new Date().toISOString()
      };

    } finally {
      await page.close();
    }
  }

  /**
   * Extract structured data (JSON-LD, microdata)
   */
  private async extractStructuredData(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const data: any = {};

      // Extract JSON-LD
      const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
      data.jsonLd = Array.from(jsonLdScripts).map(script => {
        try {
          return JSON.parse(script.textContent || '');
        } catch {
          return null;
        }
      }).filter(Boolean);

      // Extract microdata
      const microdataItems = document.querySelectorAll('[itemscope]');
      data.microdata = Array.from(microdataItems).map(item => {
        const itemtype = item.getAttribute('itemtype');
        const properties: any = {};
        
        const propElements = item.querySelectorAll('[itemprop]');
        propElements.forEach(el => {
          const prop = el.getAttribute('itemprop');
          const value = el.getAttribute('content') || el.textContent?.trim();
          if (prop && value) {
            properties[prop] = value;
          }
        });
        
        return { itemtype, properties };
      });

      return data;
    });
  }

  /**
   * Extract content using CSS selectors
   */
  private async extractContentData(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const data: any = {};

      // Common selectors for company information
      const selectors = {
        companyName: [
          'h1', '.company-name', '#company-name', '.brand', '.logo',
          'title', '.site-title', '.company-title'
        ],
        address: [
          '.address', '#address', '.location', '.contact-address',
          '[class*="address"]', '[id*="address"]'
        ],
        phone: [
          '.phone', '#phone', '.tel', '.telephone', '.contact-phone',
          'a[href^="tel:"]', '[class*="phone"]', '[id*="phone"]'
        ],
        email: [
          '.email', '#email', '.contact-email', 'a[href^="mailto:"]',
          '[class*="email"]', '[id*="email"]'
        ],
        description: [
          '.description', '#description', '.about', '.company-description',
          '.overview', '.introduction', '.profile', 'meta[name="description"]'
        ],
        services: [
          '.services', '#services', '.service-list', '.products',
          '.offerings', '.solutions', '.capabilities'
        ]
      };

      // Extract text content for each selector
      Object.keys(selectors).forEach(key => {
        const selectorList = selectors[key as keyof typeof selectors];
        for (const selector of selectorList) {
          const elements = document.querySelectorAll(selector);
          if (elements.length > 0) {
            data[key] = Array.from(elements)
              .map(el => el.textContent?.trim())
              .filter(text => text && text.length > 0)
              .slice(0, 3); // Limit to first 3 matches
            break;
          }
        }
      });

      // Extract contact information from footer
      const footer = document.querySelector('footer');
      if (footer) {
        data.footerContent = footer.textContent?.trim();
      }

      // Extract from contact page sections
      const contactSections = document.querySelectorAll('.contact, #contact, .contact-info');
      data.contactSections = Array.from(contactSections)
        .map(section => section.textContent?.trim())
        .filter(text => text && text.length > 0);

      return data;
    });
  }

  /**
   * Extract meta tags
   */
  private async extractMetaData(page: Page): Promise<any> {
    return await page.evaluate(() => {
      const metaTags: any = {};

      // Common meta tags
      const metaSelectors = [
        'meta[name="description"]',
        'meta[name="keywords"]',
        'meta[property="og:title"]',
        'meta[property="og:description"]',
        'meta[property="og:site_name"]',
        'meta[name="twitter:title"]',
        'meta[name="twitter:description"]'
      ];

      metaSelectors.forEach(selector => {
        const element = document.querySelector(selector);
        if (element) {
          const content = element.getAttribute('content');
          const name = element.getAttribute('name') || element.getAttribute('property');
          if (name && content) {
            metaTags[name] = content;
          }
        }
      });

      // Extract title
      metaTags.title = document.title;

      return metaTags;
    });
  }

  /**
   * Extract relevant internal links
   */
  private async extractRelevantLinks(page: Page, baseUrl: string): Promise<string[]> {
    const links = await page.evaluate(() => {
      const anchorElements = document.querySelectorAll('a[href]');
      return Array.from(anchorElements)
        .map(a => (a as HTMLAnchorElement).href)
        .filter(href => href && !href.startsWith('mailto:') && !href.startsWith('tel:'));
    });

    const baseUrlObj = new URL(baseUrl);
    const relevantKeywords = ['about', 'company', 'profile', 'overview', 'contact', 'info'];

    return links
      .filter(link => {
        try {
          const linkUrl = new URL(link);
          // Only internal links
          if (linkUrl.hostname !== baseUrlObj.hostname) return false;
          
          // Check if URL contains relevant keywords
          const path = linkUrl.pathname.toLowerCase();
          return relevantKeywords.some(keyword => path.includes(keyword));
        } catch {
          return false;
        }
      })
      .slice(0, 5); // Limit to 5 additional pages
  }

  /**
   * Extract from additional relevant pages
   */
  private async extractFromAdditionalPages(baseUrl: string, links: string[]): Promise<any[]> {
    const results = [];
    
    for (const link of links.slice(0, 3)) { // Limit to 3 additional pages
      try {
        const pageData = await this.extractFromPage(link);
        results.push(pageData);
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        this.logger.warn('Failed to extract from additional page', {
          url: link,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Combine extraction data from multiple pages
   */
  private combineExtractionData(dataArray: any[]): any {
    const combined = {
      urls: dataArray.map(d => d.url),
      allContent: dataArray.map(d => ({
        url: d.url,
        structuredData: d.structuredData,
        contentData: d.contentData,
        metaData: d.metaData
      }))
    };

    return combined;
  }

  /**
   * Process extracted data with AI
   */
  private async processWithAI(rawData: any, url: string): Promise<{ data: CompanyInfo; confidence: number }> {
    try {
      const prompt = this.createAIPrompt(rawData, url);
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `あなたは企業情報抽出の専門家です。提供されたウェブサイトのデータから、構造化された企業情報を抽出してください。
            
出力形式:
{
  "companyInfo": {
    "companyName": "企業名",
    "representativeName": "代表者名",
    "businessType": "業種",
    "foundedYear": 設立年(数値),
    "employeeCount": 従業員数(数値),
    "address": "住所",
    "phone": "電話番号",
    "email": "メールアドレス",
    "website": "ウェブサイトURL",
    "capitalAmount": 資本金(数値),
    "description": "事業内容・企業説明",
    "services": ["サービス1", "サービス2"],
    "industry": "業界",
    "certifications": ["認証1", "認証2"],
    "awards": ["受賞歴1", "受賞歴2"]
  },
  "confidence": 信頼度(0-100の数値),
  "reasoning": "抽出根拠"
}`
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 2000
      });

      const aiResult = JSON.parse(response.choices[0].message.content || '{}');
      
      return {
        data: aiResult.companyInfo || {},
        confidence: aiResult.confidence || 0
      };

    } catch (error: any) {
      this.logger.error('AI processing failed', {
        url,
        error: error.message
      });
      
      return {
        data: this.fallbackExtraction(rawData),
        confidence: 30
      };
    }
  }

  /**
   * Create AI prompt from raw data
   */
  private createAIPrompt(rawData: any, url: string): string {
    return `
企業ウェブサイト: ${url}

抽出されたデータ:
${JSON.stringify(rawData, null, 2)}

上記のデータから、企業の基本情報を正確に抽出して構造化してください。
信頼できる情報のみを抽出し、推測や不確実な情報は含めないでください。
日本語の企業情報として適切に整理してください。
`;
  }

  /**
   * Fallback extraction without AI
   */
  private fallbackExtraction(rawData: any): CompanyInfo {
    const info: CompanyInfo = {};
    
    // Try to extract basic information using simple text processing
    // This is a simplified version for when AI processing fails
    
    return info;
  }

  /**
   * Merge results from multiple extraction attempts
   */
  private mergeExtractionResults(results: ExtractionResult[]): ExtractionResult {
    const successfulResults = results.filter(r => r.success);
    
    if (successfulResults.length === 0) {
      return {
        success: false,
        data: {},
        confidence: 0,
        sources: results.flatMap(r => r.sources),
        extractedAt: new Date().toISOString(),
        processingTime: results.reduce((sum, r) => sum + r.processingTime, 0),
        errors: results.flatMap(r => r.errors || [])
      };
    }

    // Merge data from all successful results
    const mergedData: CompanyInfo = {};
    let totalConfidence = 0;

    successfulResults.forEach(result => {
      Object.entries(result.data).forEach(([key, value]) => {
        if (value && !mergedData[key as keyof CompanyInfo]) {
          (mergedData as any)[key] = value;
        }
      });
      totalConfidence += result.confidence;
    });

    return {
      success: true,
      data: mergedData,
      confidence: totalConfidence / successfulResults.length,
      sources: results.flatMap(r => r.sources),
      extractedAt: new Date().toISOString(),
      processingTime: results.reduce((sum, r) => sum + r.processingTime, 0)
    };
  }

  /**
   * Validate and normalize URL
   */
  private validateAndNormalizeUrl(url: string): string {
    try {
      // Add protocol if missing
      if (!url.startsWith('http://') && !url.startsWith('https://')) {
        url = 'https://' + url;
      }

      const urlObj = new URL(url);
      return urlObj.href;
    } catch (error) {
      throw new Error('Invalid URL provided');
    }
  }

  /**
   * Close browser and cleanup
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.logger.info('Browser cleanup completed');
    }
  }

  /**
   * Extract company info from domain/company name search
   */
  async extractFromCompanyName(companyName: string): Promise<ExtractionResult> {
    try {
      // Try common website patterns
      const possibleUrls = [
        `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.co.jp`,
        `https://www.${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
        `https://${companyName.toLowerCase().replace(/\s+/g, '')}.co.jp`,
        `https://${companyName.toLowerCase().replace(/\s+/g, '')}.com`
      ];

      for (const url of possibleUrls) {
        try {
          // Quick check if URL exists
          const response = await axios.head(url, { timeout: 5000 });
          if (response.status === 200) {
            return await this.extractFromWebsite(url);
          }
        } catch {
          // Continue to next URL
        }
      }

      throw new Error('No valid website found for company name');
    } catch (error: any) {
      return {
        success: false,
        data: {},
        confidence: 0,
        sources: [],
        extractedAt: new Date().toISOString(),
        processingTime: 0,
        errors: [error.message]
      };
    }
  }
}

export default CompanyInfoExtractor;