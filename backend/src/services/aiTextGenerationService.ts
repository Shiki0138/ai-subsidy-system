/**
 * AI文章生成サービス
 * OpenAI GPT-4 と Anthropic Claude を使用した高品質な文章生成
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import logger from '../config/logger';

interface TextGenerationRequest {
  prompt: string;
  fieldType: 'business_description' | 'project_summary' | 'objectives' | 'background' | 'general';
  tone: 'formal' | 'casual' | 'professional';
  length: 'short' | 'medium' | 'long';
  maxLength: number;
}

interface TextGenerationResponse {
  success: boolean;
  generatedText?: string;
  suggestions?: string[];
  error?: string;
  provider?: 'openai' | 'anthropic';
  usage?: {
    tokens: number;
    cost: number;
  };
}

export class AITextGenerationService {
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor() {
    // OpenAI クライアントの初期化
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Anthropic クライアントの初期化
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  /**
   * 文章生成のメイン関数
   */
  async generateText(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    try {
      // プロバイダーの選択（設定に基づく）
      const provider = this.selectProvider();
      
      logger.info('AI文章生成開始', {
        provider,
        fieldType: request.fieldType,
        tone: request.tone,
        length: request.length
      });

      let result: TextGenerationResponse;

      if (provider === 'openai') {
        result = await this.generateWithOpenAI(request);
      } else {
        result = await this.generateWithAnthropic(request);
      }

      // 生成結果のログ
      if (result.success) {
        logger.info('AI文章生成成功', {
          provider: result.provider,
          textLength: result.generatedText?.length,
          usage: result.usage
        });
      } else {
        logger.warn('AI文章生成失敗', {
          provider,
          error: result.error
        });
      }

      return result;
    } catch (error) {
      logger.error('AI文章生成エラー', { error: error.message });
      return {
        success: false,
        error: 'AI文章生成中にエラーが発生しました'
      };
    }
  }

  /**
   * OpenAI GPT-4 による文章生成
   */
  private async generateWithOpenAI(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    try {
      const systemPrompt = this.createSystemPrompt(request);
      const userPrompt = this.createUserPrompt(request);

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: this.getMaxTokens(request.length),
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.3,
        presence_penalty: 0.1
      });

      const generatedText = completion.choices[0]?.message?.content?.trim();
      
      if (!generatedText) {
        throw new Error('GPT-4からレスポンスを取得できませんでした');
      }

      // 使用量の計算
      const usage = {
        tokens: completion.usage?.total_tokens || 0,
        cost: this.calculateOpenAICost(completion.usage?.total_tokens || 0)
      };

      // 提案文の生成
      const suggestions = await this.generateSuggestions(request);

      return {
        success: true,
        generatedText: this.postProcessText(generatedText, request),
        suggestions,
        provider: 'openai',
        usage
      };
    } catch (error) {
      return {
        success: false,
        error: `OpenAI API エラー: ${error.message}`,
        provider: 'openai'
      };
    }
  }

  /**
   * Anthropic Claude による文章生成
   */
  private async generateWithAnthropic(request: TextGenerationRequest): Promise<TextGenerationResponse> {
    try {
      const systemPrompt = this.createSystemPrompt(request);
      const userPrompt = this.createUserPrompt(request);

      const completion = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: this.getMaxTokens(request.length),
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userPrompt }
        ]
      });

      const generatedText = completion.content[0]?.text?.trim();
      
      if (!generatedText) {
        throw new Error('Claude からレスポンスを取得できませんでした');
      }

      // 使用量の計算
      const usage = {
        tokens: completion.usage.input_tokens + completion.usage.output_tokens,
        cost: this.calculateAnthropicCost(completion.usage.input_tokens, completion.usage.output_tokens)
      };

      // 提案文の生成
      const suggestions = await this.generateSuggestions(request);

      return {
        success: true,
        generatedText: this.postProcessText(generatedText, request),
        suggestions,
        provider: 'anthropic',
        usage
      };
    } catch (error) {
      return {
        success: false,
        error: `Anthropic API エラー: ${error.message}`,
        provider: 'anthropic'
      };
    }
  }

  /**
   * システムプロンプトの作成
   */
  private createSystemPrompt(request: TextGenerationRequest): string {
    const fieldInstructions = {
      business_description: '事業内容の説明文を作成する専門家として、読み手に事業の価値と特徴が明確に伝わる文章を生成してください。',
      project_summary: 'プロジェクト要約の専門家として、プロジェクトの核心と期待される成果が分かりやすく伝わる文章を生成してください。',
      objectives: '事業目標設定の専門家として、具体的で測定可能で達成可能な目標文を生成してください。',
      background: '事業背景説明の専門家として、問題意識と解決の必要性が説得力を持って伝わる文章を生成してください。',
      general: '文章作成の専門家として、目的に適した分かりやすく説得力のある文章を生成してください。'
    };

    const toneInstructions = {
      formal: '敬語・丁寧語を使用し、格式高い文体で記述してください。',
      casual: 'です・ます調を使用し、親しみやすい文体で記述してください。',
      professional: 'ビジネス文書として適切な、専門的で信頼性の高い文体で記述してください。'
    };

    return `あなたは補助金申請書作成のプロフェッショナルです。

【役割】
${fieldInstructions[request.fieldType]}

【文体指示】
${toneInstructions[request.tone]}

【重要な制約】
1. 補助金申請書に適した内容にしてください
2. 具体性と説得力を重視してください
3. 審査員が理解しやすい構成にしてください
4. 事実に基づいた現実的な内容にしてください
5. 文字数制限を厳守してください

【出力形式】
- 生成する文章のみを出力してください
- 説明や前置きは不要です
- 改行や段落構成も含めて完成された文章として出力してください`;
  }

  /**
   * ユーザープロンプトの作成
   */
  private createUserPrompt(request: TextGenerationRequest): string {
    const lengthGuide = {
      short: '100文字程度の簡潔な文章',
      medium: '200-300文字程度の適度な文章',
      long: '400-500文字程度の詳細な文章'
    };

    return `以下の要点から、${lengthGuide[request.length]}を作成してください。

【要点・キーワード】
${request.prompt}

【文字数制限】
最大${request.maxLength}文字

【出力指示】
上記の要点を基に、補助金申請書として適切で説得力のある文章を生成してください。`;
  }

  /**
   * 提案文の生成
   */
  private async generateSuggestions(request: TextGenerationRequest): Promise<string[]> {
    try {
      // 簡単な提案文生成（OpenAI使用）
      const suggestionsPrompt = `以下の分野について、入力の参考となる具体的なキーワードや短文を3つ提案してください：

分野: ${request.fieldType}

出力形式: 
- 項目1
- 項目2  
- 項目3

各項目は30文字以内の具体的で実用的な内容にしてください。`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: suggestionsPrompt }],
        max_tokens: 200,
        temperature: 0.8
      });

      const suggestionsText = completion.choices[0]?.message?.content;
      if (suggestionsText) {
        return suggestionsText
          .split('\n')
          .filter(line => line.trim().startsWith('-'))
          .map(line => line.replace(/^-\s*/, '').trim())
          .slice(0, 3);
      }
    } catch (error) {
      logger.warn('提案文生成エラー', { error: error.message });
    }
    
    return [];
  }

  /**
   * プロバイダー選択ロジック
   */
  private selectProvider(): 'openai' | 'anthropic' {
    // 環境変数やロードバランシング設定に基づいて選択
    const preference = process.env.AI_PROVIDER_PREFERENCE || 'openai';
    
    if (preference === 'anthropic' && process.env.ANTHROPIC_API_KEY) {
      return 'anthropic';
    }
    
    return 'openai';
  }

  /**
   * 最大トークン数の計算
   */
  private getMaxTokens(length: 'short' | 'medium' | 'long'): number {
    const tokenMap = {
      short: 150,
      medium: 400,
      long: 700
    };
    
    return tokenMap[length];
  }

  /**
   * テキストの後処理
   */
  private postProcessText(text: string, request: TextGenerationRequest): string {
    // 不要な文字の除去
    let processed = text
      .replace(/^["「『]|["」』]$/g, '') // 引用符の除去
      .replace(/\n{3,}/g, '\n\n') // 過度な改行の調整
      .trim();

    // 文字数制限の適用
    if (processed.length > request.maxLength) {
      processed = processed.substring(0, request.maxLength - 3) + '...';
    }

    return processed;
  }

  /**
   * OpenAI使用量コスト計算
   */
  private calculateOpenAICost(tokens: number): number {
    // GPT-4の価格（2024年）: $0.03 per 1K tokens
    return (tokens / 1000) * 0.03;
  }

  /**
   * Anthropic使用量コスト計算
   */
  private calculateAnthropicCost(inputTokens: number, outputTokens: number): number {
    // Claude 3.5 Sonnetの価格: Input $3 per MTok, Output $15 per MTok
    return (inputTokens / 1000000) * 3 + (outputTokens / 1000000) * 15;
  }
}

export default new AITextGenerationService();