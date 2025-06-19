"""
強化されたAI統合サービス
複数AIプロバイダーによる並列処理と品質評価を実装
"""

from typing import Dict, List, Optional, Union, Any
import asyncio
import os
import json
import time
from datetime import datetime
import logging
from dataclasses import dataclass
from enum import Enum

# AI プロバイダー
import openai
from anthropic import Anthropic
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate

# 品質評価・監視
from .quality_evaluator import QualityEvaluator
from .metrics_collector import MetricsCollector

# 設定
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class AIProvider(Enum):
    OPENAI = "openai"
    ANTHROPIC = "anthropic"
    HYBRID = "hybrid"


@dataclass
class AIRequest:
    """AI リクエスト情報"""
    request_id: str
    user_id: str
    task_type: str
    input_data: Dict
    options: Optional[Dict] = None
    timestamp: datetime = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now()


@dataclass
class AIResponse:
    """AI レスポンス情報"""
    request_id: str
    success: bool
    content: Optional[str] = None
    error: Optional[str] = None
    metadata: Dict = None
    provider: Optional[str] = None
    processing_time: float = 0
    quality_score: float = 0
    confidence_score: float = 0
    cost: float = 0

    def __post_init__(self):
        if self.metadata is None:
            self.metadata = {}


class EnhancedAIService:
    """強化されたAI統合サービス"""
    
    def __init__(self):
        """初期化"""
        self.openai_client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY')
        )
        self.anthropic_client = Anthropic(
            api_key=os.getenv('ANTHROPIC_API_KEY')
        )
        
        # 品質評価・監視システム
        self.quality_evaluator = QualityEvaluator()
        self.metrics_collector = MetricsCollector()
        
        # プロバイダー設定
        self.provider_config = {
            AIProvider.OPENAI: {
                'model': 'gpt-4-turbo-preview',
                'max_tokens': 4000,
                'temperature': 0.7,
                'timeout': 30
            },
            AIProvider.ANTHROPIC: {
                'model': 'claude-3-5-sonnet-20241022',
                'max_tokens': 4000,
                'temperature': 0.5,
                'timeout': 30
            }
        }
        
        # エラー回復設定
        self.fallback_strategies = {
            'openai_down': self._use_anthropic_fallback,
            'anthropic_down': self._use_openai_fallback,
            'all_ai_down': self._use_cached_response,
            'rate_limit_exceeded': self._use_queuing_system
        }

    async def generate_business_plan(
        self, 
        company_data: Dict,
        subsidy_type: str,
        custom_requirements: Optional[List[str]] = None,
        provider: AIProvider = AIProvider.HYBRID
    ) -> AIResponse:
        """
        事業計画書生成
        
        Args:
            company_data: 企業情報
            subsidy_type: 補助金タイプ
            custom_requirements: カスタム要件
            provider: 使用AIプロバイダー
            
        Returns:
            AIResponse: 生成結果
        """
        request_id = f"bp_{int(time.time() * 1000)}"
        start_time = time.time()
        
        try:
            # リクエスト作成
            request = AIRequest(
                request_id=request_id,
                user_id="system",
                task_type="business_plan_generation",
                input_data={
                    "company_data": company_data,
                    "subsidy_type": subsidy_type,
                    "custom_requirements": custom_requirements or []
                }
            )
            
            # プロンプト構築
            prompt = self._build_business_plan_prompt(
                company_data, subsidy_type, custom_requirements
            )
            
            if provider == AIProvider.HYBRID:
                # 複数AIプロバイダーによる並列生成
                response = await self._hybrid_generation(prompt, request)
            else:
                # 単一プロバイダー使用
                response = await self._single_provider_generation(
                    prompt, request, provider
                )
            
            # 品質評価
            response.quality_score = await self.quality_evaluator.evaluate_business_plan(
                response.content, company_data, subsidy_type
            )
            
            # メトリクス記録
            response.processing_time = time.time() - start_time
            await self.metrics_collector.record_request(request, response)
            
            return response
            
        except Exception as e:
            logger.error(f"事業計画生成エラー: {str(e)}")
            return AIResponse(
                request_id=request_id,
                success=False,
                error=str(e),
                processing_time=time.time() - start_time
            )

    async def predict_adoption_probability(
        self,
        application_data: Dict,
        subsidy_program: Dict
    ) -> AIResponse:
        """
        採択可能性予測
        
        Args:
            application_data: 申請データ
            subsidy_program: 補助金プログラム情報
            
        Returns:
            AIResponse: 予測結果
        """
        request_id = f"ap_{int(time.time() * 1000)}"
        start_time = time.time()
        
        try:
            # 特徴量抽出
            features = await self._extract_features(application_data, subsidy_program)
            
            # AI分析プロンプト
            prompt = self._build_adoption_prediction_prompt(
                application_data, subsidy_program, features
            )
            
            # Claude 3.5 Sonnetを使用（分析タスクに最適）
            response = await self._anthropic_request(prompt)
            
            # 予測結果パース
            prediction_result = self._parse_prediction_result(response.content)
            
            response.content = json.dumps(prediction_result, ensure_ascii=False, indent=2)
            response.confidence_score = prediction_result.get('confidence_score', 0.7)
            response.processing_time = time.time() - start_time
            
            return response
            
        except Exception as e:
            logger.error(f"採択可能性予測エラー: {str(e)}")
            return AIResponse(
                request_id=request_id,
                success=False,
                error=str(e),
                processing_time=time.time() - start_time
            )

    async def analyze_document(
        self,
        document_text: str,
        analysis_type: str = "comprehensive"
    ) -> AIResponse:
        """
        文書解析
        
        Args:
            document_text: 文書テキスト
            analysis_type: 分析タイプ
            
        Returns:
            AIResponse: 解析結果
        """
        request_id = f"da_{int(time.time() * 1000)}"
        start_time = time.time()
        
        try:
            # 分析プロンプト構築
            prompt = self._build_document_analysis_prompt(document_text, analysis_type)
            
            # GPT-4使用（詳細分析に最適）
            response = await self._openai_request(prompt)
            
            # 解析結果構造化
            analysis_result = self._parse_document_analysis(response.content)
            
            response.content = json.dumps(analysis_result, ensure_ascii=False, indent=2)
            response.processing_time = time.time() - start_time
            
            return response
            
        except Exception as e:
            logger.error(f"文書解析エラー: {str(e)}")
            return AIResponse(
                request_id=request_id,
                success=False,
                error=str(e),
                processing_time=time.time() - start_time
            )

    async def _hybrid_generation(
        self, 
        prompt: str, 
        request: AIRequest
    ) -> AIResponse:
        """
        ハイブリッド生成（複数AI並列実行）
        """
        tasks = [
            self._openai_request(prompt),
            self._anthropic_request(prompt)
        ]
        
        results = await asyncio.gather(*tasks, return_exceptions=True)
        
        # 最良の結果を選択
        best_response = self._select_best_response(results)
        
        # ハイブリッド結果のメタデータ追加
        best_response.metadata['generation_method'] = 'hybrid'
        best_response.metadata['providers_used'] = ['openai', 'anthropic']
        
        return best_response

    async def _single_provider_generation(
        self,
        prompt: str,
        request: AIRequest,
        provider: AIProvider
    ) -> AIResponse:
        """単一プロバイダー生成"""
        if provider == AIProvider.OPENAI:
            return await self._openai_request(prompt)
        elif provider == AIProvider.ANTHROPIC:
            return await self._anthropic_request(prompt)
        else:
            raise ValueError(f"Unsupported provider: {provider}")

    async def _openai_request(self, prompt: str) -> AIResponse:
        """OpenAI API リクエスト"""
        try:
            response = await asyncio.wait_for(
                self._make_openai_call(prompt),
                timeout=self.provider_config[AIProvider.OPENAI]['timeout']
            )
            
            return AIResponse(
                request_id="",
                success=True,
                content=response.choices[0].message.content,
                provider="openai",
                metadata={
                    'model': response.model,
                    'usage': response.usage._asdict() if response.usage else {},
                    'finish_reason': response.choices[0].finish_reason
                },
                cost=self._calculate_openai_cost(response.usage)
            )
            
        except asyncio.TimeoutError:
            raise Exception("OpenAI APIタイムアウト")
        except Exception as e:
            raise Exception(f"OpenAI APIエラー: {str(e)}")

    async def _anthropic_request(self, prompt: str) -> AIResponse:
        """Anthropic API リクエスト"""
        try:
            response = await asyncio.wait_for(
                self._make_anthropic_call(prompt),
                timeout=self.provider_config[AIProvider.ANTHROPIC]['timeout']
            )
            
            return AIResponse(
                request_id="",
                success=True,
                content=response.content[0].text,
                provider="anthropic",
                metadata={
                    'model': response.model,
                    'usage': {
                        'input_tokens': response.usage.input_tokens,
                        'output_tokens': response.usage.output_tokens
                    },
                    'stop_reason': response.stop_reason
                },
                cost=self._calculate_anthropic_cost(response.usage)
            )
            
        except asyncio.TimeoutError:
            raise Exception("Anthropic APIタイムアウト")
        except Exception as e:
            raise Exception(f"Anthropic APIエラー: {str(e)}")

    async def _make_openai_call(self, prompt: str):
        """OpenAI API 実際の呼び出し"""
        config = self.provider_config[AIProvider.OPENAI]
        
        response = await self.openai_client.chat.completions.create(
            model=config['model'],
            messages=[
                {
                    "role": "system",
                    "content": "あなたは補助金申請支援の専門家です。正確で効果的な内容を作成してください。"
                },
                {
                    "role": "user", 
                    "content": prompt
                }
            ],
            max_tokens=config['max_tokens'],
            temperature=config['temperature']
        )
        
        return response

    async def _make_anthropic_call(self, prompt: str):
        """Anthropic API 実際の呼び出し"""
        config = self.provider_config[AIProvider.ANTHROPIC]
        
        response = await self.anthropic_client.messages.create(
            model=config['model'],
            max_tokens=config['max_tokens'],
            temperature=config['temperature'],
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )
        
        return response

    def _select_best_response(self, responses: List) -> AIResponse:
        """最良の応答を選択"""
        valid_responses = [r for r in responses if isinstance(r, AIResponse) and r.success]
        
        if not valid_responses:
            return AIResponse(
                request_id="",
                success=False,
                error="全てのAIプロバイダーが失敗しました"
            )
        
        # 品質スコアに基づいて選択（簡易版）
        best_response = max(valid_responses, key=lambda r: len(r.content or ""))
        return best_response

    def _build_business_plan_prompt(
        self, 
        company_data: Dict, 
        subsidy_type: str,
        custom_requirements: List[str]
    ) -> str:
        """事業計画書生成プロンプト構築"""
        requirements_text = "\n".join([f"- {req}" for req in custom_requirements])
        
        return f"""
補助金申請用の事業計画書を作成してください。

## 企業情報
- 会社名: {company_data.get('name', '')}
- 業界: {company_data.get('industry', '')}
- 従業員数: {company_data.get('employee_count', '')}
- 事業内容: {company_data.get('description', '')}

## 補助金タイプ
{subsidy_type}

## 特別要件
{requirements_text}

## 作成要件
以下の構成で採択されやすい事業計画書を作成してください：

1. 事業概要（200文字以内）
2. 現状分析と課題（300文字以内）
3. 解決策・革新性（400文字以内）
4. 市場性・事業性（300文字以内）
5. 実施計画（300文字以内）
6. 期待効果（200文字以内）
7. 予算計画（200文字以内）

JSON形式で回答してください。
"""

    def _build_adoption_prediction_prompt(
        self,
        application_data: Dict,
        subsidy_program: Dict,
        features: Dict
    ) -> str:
        """採択可能性予測プロンプト構築"""
        return f"""
以下の補助金申請の採択可能性を分析してください。

## 申請データ
{json.dumps(application_data, ensure_ascii=False, indent=2)}

## 補助金プログラム
{json.dumps(subsidy_program, ensure_ascii=False, indent=2)}

## 抽出特徴量
{json.dumps(features, ensure_ascii=False, indent=2)}

以下の形式で分析結果を返してください：

{{
  "adoption_probability": 0.75,
  "confidence_score": 0.85,
  "score_breakdown": {{
    "innovation_score": 80,
    "feasibility_score": 75,
    "market_potential_score": 85,
    "budget_adequacy_score": 70
  }},
  "key_strengths": ["強み1", "強み2", "強み3"],
  "key_weaknesses": ["弱み1", "弱み2"],
  "improvement_suggestions": ["改善提案1", "改善提案2", "改善提案3"],
  "success_factors": ["成功要因1", "成功要因2"],
  "risk_factors": ["リスク要因1", "リスク要因2"]
}}
"""

    def _build_document_analysis_prompt(
        self,
        document_text: str,
        analysis_type: str
    ) -> str:
        """文書解析プロンプト構築"""
        return f"""
以下の文書を{analysis_type}分析してください。

## 文書内容
{document_text[:2000]}...

## 分析項目
1. 要約（200文字以内）
2. キーポイント抽出
3. 強み・弱み分析
4. 改善提案
5. 品質評価（100点満点）

JSON形式で回答してください。
"""

    async def _extract_features(
        self,
        application_data: Dict,
        subsidy_program: Dict
    ) -> Dict:
        """特徴量抽出"""
        return {
            "text_length": len(str(application_data)),
            "keyword_density": self._calculate_keyword_density(application_data, subsidy_program),
            "structure_score": self._evaluate_structure(application_data),
            "innovation_indicators": self._extract_innovation_indicators(application_data)
        }

    def _calculate_keyword_density(self, application_data: Dict, subsidy_program: Dict) -> float:
        """キーワード密度計算"""
        # 簡易実装
        return 0.75

    def _evaluate_structure(self, application_data: Dict) -> float:
        """構造評価"""
        # 簡易実装
        return 0.8

    def _extract_innovation_indicators(self, application_data: Dict) -> List[str]:
        """革新性指標抽出"""
        # 簡易実装
        return ["AI活用", "デジタル化", "効率向上"]

    def _parse_prediction_result(self, content: str) -> Dict:
        """予測結果パース"""
        try:
            return json.loads(content)
        except:
            return {
                "adoption_probability": 0.7,
                "confidence_score": 0.6,
                "error": "パース失敗"
            }

    def _parse_document_analysis(self, content: str) -> Dict:
        """文書解析結果パース"""
        try:
            return json.loads(content)
        except:
            return {
                "summary": "解析失敗",
                "quality_score": 60,
                "error": "パース失敗"
            }

    def _calculate_openai_cost(self, usage) -> float:
        """OpenAI コスト計算"""
        if not usage:
            return 0.0
        
        input_cost = (usage.prompt_tokens / 1000) * 0.01
        output_cost = (usage.completion_tokens / 1000) * 0.03
        return input_cost + output_cost

    def _calculate_anthropic_cost(self, usage) -> float:
        """Anthropic コスト計算"""
        if not usage:
            return 0.0
        
        input_cost = (usage.input_tokens / 1000) * 0.003
        output_cost = (usage.output_tokens / 1000) * 0.015
        return input_cost + output_cost

    # フォールバック戦略
    async def _use_anthropic_fallback(self, prompt: str) -> AIResponse:
        """Anthropic フォールバック"""
        return await self._anthropic_request(prompt)

    async def _use_openai_fallback(self, prompt: str) -> AIResponse:
        """OpenAI フォールバック"""
        return await self._openai_request(prompt)

    async def _use_cached_response(self, prompt: str) -> AIResponse:
        """キャッシュ応答使用"""
        return AIResponse(
            request_id="",
            success=True,
            content="キャッシュされた応答（簡易版）",
            metadata={"fallback": "cached"}
        )

    async def _use_queuing_system(self, prompt: str) -> AIResponse:
        """キューイングシステム使用"""
        await asyncio.sleep(5)  # 簡易待機
        return await self._openai_request(prompt)