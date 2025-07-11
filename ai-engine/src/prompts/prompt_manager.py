"""
プロンプト管理システム
A/Bテスト、バージョン管理、動的最適化機能付き
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime, timedelta
from enum import Enum
import json
import os
import hashlib
import asyncio
import logging
from collections import defaultdict, deque
import statistics
import random

logger = logging.getLogger(__name__)


class PromptType(Enum):
    """プロンプトタイプ"""
    BUSINESS_PLAN = "business_plan"
    IMPROVEMENT_SUGGESTION = "improvement_suggestion"
    ADOPTION_PREDICTION = "adoption_prediction"
    DOCUMENT_ANALYSIS = "document_analysis"
    CONTENT_GENERATION = "content_generation"
    SUMMARY = "summary"
    TRANSLATION = "translation"


class PromptVersion(Enum):
    """プロンプトバージョン"""
    STABLE = "stable"
    EXPERIMENTAL = "experimental"
    DEPRECATED = "deprecated"
    TESTING = "testing"


@dataclass
class PromptTemplate:
    """プロンプトテンプレート"""
    id: str
    name: str
    prompt_type: PromptType
    template: str
    variables: List[str]
    version: str = "1.0.0"
    status: PromptVersion = PromptVersion.STABLE
    description: str = ""
    tags: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    usage_count: int = 0
    success_rate: float = 0.0
    avg_quality_score: float = 0.0
    performance_metrics: Dict[str, float] = field(default_factory=dict)


@dataclass
class ABTest:
    """A/Bテスト設定"""
    test_id: str
    name: str
    prompt_type: PromptType
    variant_a: str  # プロンプトID
    variant_b: str  # プロンプトID
    traffic_split: float = 0.5  # A/B の分割比率
    start_date: datetime = field(default_factory=datetime.now)
    end_date: Optional[datetime] = None
    success_metric: str = "quality_score"  # success_rate, quality_score, response_time
    min_sample_size: int = 100
    significance_threshold: float = 0.05
    status: str = "active"  # active, paused, completed
    results: Dict[str, Any] = field(default_factory=dict)


@dataclass
class PromptUsageStats:
    """プロンプト使用統計"""
    prompt_id: str
    total_usage: int
    success_count: int
    failure_count: int
    avg_response_time: float
    avg_quality_score: float
    last_used: datetime
    user_feedback: List[Dict[str, Any]] = field(default_factory=list)


@dataclass
class PromptOptimizationResult:
    """プロンプト最適化結果"""
    original_prompt_id: str
    optimized_prompt: str
    optimization_type: str  # length, clarity, specificity, context
    improvement_score: float
    test_results: Dict[str, Any]
    recommendation: str


class PromptManager:
    """プロンプト管理システム"""
    
    def __init__(self, storage_path: str = "prompts/"):
        """
        初期化
        
        Args:
            storage_path: プロンプト保存パス
        """
        self.storage_path = storage_path
        self.templates: Dict[str, PromptTemplate] = {}
        self.ab_tests: Dict[str, ABTest] = {}
        self.usage_stats: Dict[str, PromptUsageStats] = {}
        
        # A/Bテスト結果履歴
        self.test_history: deque = deque(maxlen=1000)
        
        # 動的最適化設定
        self.optimization_config = {
            'auto_optimize': True,
            'optimization_threshold': 0.1,  # 品質向上の最小閾値
            'min_samples_for_optimization': 50,
            'optimization_frequency': timedelta(days=7)
        }
        
        # パフォーマンス追跡
        self.performance_tracker = defaultdict(list)
        
        # ディレクトリ作成
        os.makedirs(storage_path, exist_ok=True)
        
        # 初期化処理
        self._load_templates()
        self._load_ab_tests()
        self._load_usage_stats()
        self._initialize_default_templates()

    async def get_optimized_prompt(
        self,
        prompt_type: PromptType,
        context: Dict[str, Any],
        user_segment: str = "default",
        use_ab_testing: bool = True
    ) -> Tuple[str, str]:
        """
        最適化されたプロンプト取得
        
        Args:
            prompt_type: プロンプトタイプ
            context: コンテキスト変数
            user_segment: ユーザーセグメント
            use_ab_testing: A/Bテスト使用フラグ
            
        Returns:
            Tuple[str, str]: (最適化プロンプト, 使用プロンプトID)
        """
        try:
            # A/Bテスト中のプロンプト取得
            if use_ab_testing:
                ab_prompt, prompt_id = await self._get_ab_test_prompt(
                    prompt_type, user_segment
                )
                if ab_prompt:
                    optimized_prompt = self._apply_context(ab_prompt, context)
                    await self._track_usage(prompt_id, context)
                    return optimized_prompt, prompt_id
            
            # 通常のプロンプト取得
            template = self._get_best_template(prompt_type, user_segment)
            if not template:
                raise ValueError(f"プロンプトが見つかりません: {prompt_type}")
            
            # コンテキスト変数埋め込み
            optimized_prompt = self._apply_context(template.template, context)
            
            # パーソナライゼーション適用
            personalized_prompt = await self._apply_personalization(
                optimized_prompt, user_segment, context
            )
            
            # 使用統計更新
            await self._track_usage(template.id, context)
            
            return personalized_prompt, template.id
            
        except Exception as e:
            logger.error(f"プロンプト取得エラー: {str(e)}")
            # フォールバック
            fallback_prompt = self._get_fallback_prompt(prompt_type, context)
            return fallback_prompt, "fallback"

    async def create_prompt_template(
        self,
        name: str,
        prompt_type: PromptType,
        template: str,
        variables: List[str],
        description: str = "",
        tags: List[str] = None
    ) -> str:
        """
        プロンプトテンプレート作成
        
        Args:
            name: テンプレート名
            prompt_type: プロンプトタイプ
            template: プロンプトテンプレート
            variables: 変数リスト
            description: 説明
            tags: タグリスト
            
        Returns:
            str: テンプレートID
        """
        try:
            # テンプレートID生成
            template_id = self._generate_template_id(name, prompt_type, template)
            
            # プロンプトテンプレート作成
            prompt_template = PromptTemplate(
                id=template_id,
                name=name,
                prompt_type=prompt_type,
                template=template,
                variables=variables,
                description=description,
                tags=tags or [],
                created_at=datetime.now(),
                updated_at=datetime.now()
            )
            
            # バリデーション
            validation_result = await self._validate_template(prompt_template)
            if not validation_result['valid']:
                raise ValueError(f"テンプレート検証失敗: {validation_result['errors']}")
            
            # 保存
            self.templates[template_id] = prompt_template
            await self._save_template(prompt_template)
            
            logger.info(f"プロンプトテンプレート作成: {template_id}")
            return template_id
            
        except Exception as e:
            logger.error(f"テンプレート作成エラー: {str(e)}")
            raise

    async def start_ab_test(
        self,
        test_name: str,
        prompt_type: PromptType,
        variant_a_id: str,
        variant_b_id: str,
        traffic_split: float = 0.5,
        success_metric: str = "quality_score",
        duration_days: int = 7,
        min_sample_size: int = 100
    ) -> str:
        """
        A/Bテスト開始
        
        Args:
            test_name: テスト名
            prompt_type: プロンプトタイプ
            variant_a_id: バリアントAのプロンプトID
            variant_b_id: バリアントBのプロンプトID
            traffic_split: トラフィック分割比率
            success_metric: 成功指標
            duration_days: テスト期間（日）
            min_sample_size: 最小サンプルサイズ
            
        Returns:
            str: テストID
        """
        try:
            # テストID生成
            test_id = f"abtest_{int(datetime.now().timestamp())}_{hash(test_name) % 10000}"
            
            # バリアント存在確認
            if variant_a_id not in self.templates:
                raise ValueError(f"バリアントA が見つかりません: {variant_a_id}")
            if variant_b_id not in self.templates:
                raise ValueError(f"バリアントB が見つかりません: {variant_b_id}")
            
            # A/Bテスト作成
            ab_test = ABTest(
                test_id=test_id,
                name=test_name,
                prompt_type=prompt_type,
                variant_a=variant_a_id,
                variant_b=variant_b_id,
                traffic_split=traffic_split,
                start_date=datetime.now(),
                end_date=datetime.now() + timedelta(days=duration_days),
                success_metric=success_metric,
                min_sample_size=min_sample_size,
                status="active"
            )
            
            # 保存
            self.ab_tests[test_id] = ab_test
            await self._save_ab_test(ab_test)
            
            logger.info(f"A/Bテスト開始: {test_id}")
            return test_id
            
        except Exception as e:
            logger.error(f"A/Bテスト開始エラー: {str(e)}")
            raise

    async def evaluate_ab_test(self, test_id: str) -> Dict[str, Any]:
        """
        A/Bテスト評価
        
        Args:
            test_id: テストID
            
        Returns:
            Dict: 評価結果
        """
        try:
            if test_id not in self.ab_tests:
                raise ValueError(f"A/Bテストが見つかりません: {test_id}")
            
            ab_test = self.ab_tests[test_id]
            
            # 各バリアントの統計取得
            stats_a = self.usage_stats.get(ab_test.variant_a, None)
            stats_b = self.usage_stats.get(ab_test.variant_b, None)
            
            if not stats_a or not stats_b:
                return {"error": "統計データが不足しています"}
            
            # 統計的有意性検定
            significance_result = await self._statistical_significance_test(
                stats_a, stats_b, ab_test.success_metric
            )
            
            # 結果分析
            results = {
                "test_id": test_id,
                "test_name": ab_test.name,
                "status": ab_test.status,
                "duration": (datetime.now() - ab_test.start_date).days,
                "variant_a_stats": {
                    "sample_size": stats_a.total_usage,
                    "success_rate": stats_a.success_count / stats_a.total_usage,
                    "avg_quality_score": stats_a.avg_quality_score,
                    "avg_response_time": stats_a.avg_response_time
                },
                "variant_b_stats": {
                    "sample_size": stats_b.total_usage,
                    "success_rate": stats_b.success_count / stats_b.total_usage,
                    "avg_quality_score": stats_b.avg_quality_score,
                    "avg_response_time": stats_b.avg_response_time
                },
                "significance": significance_result,
                "recommendation": self._generate_ab_test_recommendation(
                    stats_a, stats_b, significance_result
                )
            }
            
            # テスト完了チェック
            if self._should_complete_test(ab_test, stats_a, stats_b, significance_result):
                await self._complete_ab_test(test_id, results)
            
            return results
            
        except Exception as e:
            logger.error(f"A/Bテスト評価エラー: {str(e)}")
            return {"error": str(e)}

    async def optimize_prompt_performance(
        self,
        prompt_id: str,
        optimization_type: str = "auto"
    ) -> PromptOptimizationResult:
        """
        プロンプトパフォーマンス最適化
        
        Args:
            prompt_id: プロンプトID
            optimization_type: 最適化タイプ (auto, length, clarity, specificity)
            
        Returns:
            PromptOptimizationResult: 最適化結果
        """
        try:
            if prompt_id not in self.templates:
                raise ValueError(f"プロンプトが見つかりません: {prompt_id}")
            
            template = self.templates[prompt_id]
            usage_stats = self.usage_stats.get(prompt_id)
            
            if not usage_stats or usage_stats.total_usage < self.optimization_config['min_samples_for_optimization']:
                raise ValueError("最適化に十分なデータがありません")
            
            # 最適化実行
            if optimization_type == "auto":
                optimization_result = await self._auto_optimize(template, usage_stats)
            elif optimization_type == "length":
                optimization_result = await self._optimize_length(template, usage_stats)
            elif optimization_type == "clarity":
                optimization_result = await self._optimize_clarity(template, usage_stats)
            elif optimization_type == "specificity":
                optimization_result = await self._optimize_specificity(template, usage_stats)
            else:
                raise ValueError(f"未対応の最適化タイプ: {optimization_type}")
            
            # 最適化結果テスト
            test_results = await self._test_optimization(template, optimization_result)
            
            # 結果作成
            result = PromptOptimizationResult(
                original_prompt_id=prompt_id,
                optimized_prompt=optimization_result['optimized_prompt'],
                optimization_type=optimization_type,
                improvement_score=optimization_result['improvement_score'],
                test_results=test_results,
                recommendation=optimization_result['recommendation']
            )
            
            logger.info(f"プロンプト最適化完了: {prompt_id}")
            return result
            
        except Exception as e:
            logger.error(f"プロンプト最適化エラー: {str(e)}")
            raise

    async def get_prompt_analytics(
        self,
        time_range: timedelta = timedelta(days=30)
    ) -> Dict[str, Any]:
        """
        プロンプト分析情報取得
        
        Args:
            time_range: 分析期間
            
        Returns:
            Dict: 分析結果
        """
        try:
            cutoff_date = datetime.now() - time_range
            
            # 全体統計
            total_usage = sum(stats.total_usage for stats in self.usage_stats.values())
            avg_success_rate = statistics.mean([
                stats.success_count / stats.total_usage 
                for stats in self.usage_stats.values() 
                if stats.total_usage > 0
            ]) if self.usage_stats else 0
            
            # プロンプトタイプ別統計
            type_stats = defaultdict(lambda: {'usage': 0, 'success_rate': 0})
            for template in self.templates.values():
                stats = self.usage_stats.get(template.id)
                if stats and stats.last_used >= cutoff_date:
                    type_stats[template.prompt_type.value]['usage'] += stats.total_usage
                    type_stats[template.prompt_type.value]['success_rate'] = max(
                        type_stats[template.prompt_type.value]['success_rate'],
                        stats.success_count / stats.total_usage if stats.total_usage > 0 else 0
                    )
            
            # トップパフォーマー
            top_performers = sorted(
                [
                    {
                        'template_id': template.id,
                        'name': template.name,
                        'type': template.prompt_type.value,
                        'success_rate': (
                            self.usage_stats[template.id].success_count / 
                            self.usage_stats[template.id].total_usage
                        ) if template.id in self.usage_stats and self.usage_stats[template.id].total_usage > 0 else 0,
                        'usage_count': self.usage_stats[template.id].total_usage if template.id in self.usage_stats else 0
                    }
                    for template in self.templates.values()
                ],
                key=lambda x: x['success_rate'],
                reverse=True
            )[:10]
            
            # A/Bテスト結果サマリー
            active_tests = [test for test in self.ab_tests.values() if test.status == "active"]
            completed_tests = [test for test in self.ab_tests.values() if test.status == "completed"]
            
            return {
                "overview": {
                    "total_templates": len(self.templates),
                    "total_usage": total_usage,
                    "avg_success_rate": round(avg_success_rate, 3),
                    "active_ab_tests": len(active_tests),
                    "completed_ab_tests": len(completed_tests)
                },
                "type_breakdown": dict(type_stats),
                "top_performers": top_performers,
                "ab_test_summary": {
                    "active_tests": [
                        {
                            "test_id": test.test_id,
                            "name": test.name,
                            "type": test.prompt_type.value,
                            "progress": self._calculate_test_progress(test)
                        }
                        for test in active_tests
                    ]
                },
                "optimization_opportunities": await self._identify_optimization_opportunities()
            }
            
        except Exception as e:
            logger.error(f"プロンプト分析エラー: {str(e)}")
            return {"error": str(e)}

    # 内部メソッド

    async def _get_ab_test_prompt(
        self, 
        prompt_type: PromptType, 
        user_segment: str
    ) -> Tuple[Optional[str], Optional[str]]:
        """A/Bテスト中のプロンプト取得"""
        active_tests = [
            test for test in self.ab_tests.values()
            if test.status == "active" and test.prompt_type == prompt_type
        ]
        
        if not active_tests:
            return None, None
        
        # 最初のアクティブなテストを使用
        test = active_tests[0]
        
        # トラフィック分割に基づいてバリアント選択
        if random.random() < test.traffic_split:
            variant_id = test.variant_a
        else:
            variant_id = test.variant_b
        
        if variant_id in self.templates:
            return self.templates[variant_id].template, variant_id
        
        return None, None

    def _get_best_template(
        self, 
        prompt_type: PromptType, 
        user_segment: str
    ) -> Optional[PromptTemplate]:
        """最適なテンプレート取得"""
        candidates = [
            template for template in self.templates.values()
            if template.prompt_type == prompt_type and template.status == PromptVersion.STABLE
        ]
        
        if not candidates:
            return None
        
        # 成功率とクオリティスコアで評価
        def template_score(template):
            stats = self.usage_stats.get(template.id)
            if not stats or stats.total_usage == 0:
                return 0.5  # デフォルトスコア
            
            success_rate = stats.success_count / stats.total_usage
            quality_score = stats.avg_quality_score / 100.0  # 0-1に正規化
            
            return (success_rate * 0.6 + quality_score * 0.4)
        
        return max(candidates, key=template_score)

    def _apply_context(self, template: str, context: Dict[str, Any]) -> str:
        """コンテキスト変数埋め込み"""
        try:
            return template.format(**context)
        except KeyError as e:
            logger.warning(f"変数が見つかりません: {e}")
            return template
        except Exception as e:
            logger.error(f"コンテキスト適用エラー: {str(e)}")
            return template

    async def _apply_personalization(
        self,
        prompt: str,
        user_segment: str,
        context: Dict[str, Any]
    ) -> str:
        """パーソナライゼーション適用"""
        # ユーザーセグメント別の調整
        if user_segment == "beginner":
            prompt = self._add_explanatory_context(prompt)
        elif user_segment == "expert":
            prompt = self._add_technical_details(prompt)
        elif user_segment == "enterprise":
            prompt = self._add_enterprise_focus(prompt)
        
        return prompt

    async def _track_usage(self, prompt_id: str, context: Dict[str, Any]):
        """使用統計追跡"""
        if prompt_id not in self.usage_stats:
            self.usage_stats[prompt_id] = PromptUsageStats(
                prompt_id=prompt_id,
                total_usage=0,
                success_count=0,
                failure_count=0,
                avg_response_time=0.0,
                avg_quality_score=0.0,
                last_used=datetime.now()
            )
        
        stats = self.usage_stats[prompt_id]
        stats.total_usage += 1
        stats.last_used = datetime.now()

    def _get_fallback_prompt(
        self, 
        prompt_type: PromptType, 
        context: Dict[str, Any]
    ) -> str:
        """フォールバックプロンプト"""
        fallback_templates = {
            PromptType.BUSINESS_PLAN: """
以下の情報に基づいて事業計画を作成してください：

企業情報: {company_name}
業界: {industry}
事業内容: {description}

効果的で採択されやすい事業計画を提案してください。
""",
            PromptType.IMPROVEMENT_SUGGESTION: """
以下の内容について改善提案をしてください：

{content}

具体的で実行可能な改善案を提供してください。
""",
            PromptType.DOCUMENT_ANALYSIS: """
以下の文書を分析してください：

{document}

要約と主要なポイントを抽出してください。
"""
        }
        
        template = fallback_templates.get(prompt_type, "入力内容を分析してください: {content}")
        return self._apply_context(template, context)

    def _generate_template_id(
        self, 
        name: str, 
        prompt_type: PromptType, 
        template: str
    ) -> str:
        """テンプレートID生成"""
        content = f"{name}_{prompt_type.value}_{template[:100]}"
        return f"prompt_{hashlib.md5(content.encode()).hexdigest()[:12]}"

    async def _validate_template(self, template: PromptTemplate) -> Dict[str, Any]:
        """テンプレート検証"""
        errors = []
        
        # 必須フィールドチェック
        if not template.name:
            errors.append("テンプレート名が必要です")
        
        if not template.template:
            errors.append("プロンプトテンプレートが必要です")
        
        # 変数チェック
        template_vars = set(re.findall(r'{(\w+)}', template.template))
        declared_vars = set(template.variables)
        
        missing_vars = template_vars - declared_vars
        if missing_vars:
            errors.append(f"未宣言の変数: {missing_vars}")
        
        unused_vars = declared_vars - template_vars
        if unused_vars:
            errors.append(f"未使用の変数: {unused_vars}")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors
        }

    async def _statistical_significance_test(
        self,
        stats_a: PromptUsageStats,
        stats_b: PromptUsageStats,
        metric: str
    ) -> Dict[str, Any]:
        """統計的有意性検定"""
        # 簡易実装（実際にはt-testやカイ二乗検定を使用）
        
        if metric == "success_rate":
            rate_a = stats_a.success_count / stats_a.total_usage
            rate_b = stats_b.success_count / stats_b.total_usage
            
            difference = abs(rate_a - rate_b)
            # 簡易的な有意性判定
            significant = difference > 0.05 and min(stats_a.total_usage, stats_b.total_usage) > 30
            
            return {
                "metric": metric,
                "value_a": rate_a,
                "value_b": rate_b,
                "difference": difference,
                "significant": significant,
                "p_value": 0.03 if significant else 0.1,  # 仮の値
                "confidence_level": 0.95
            }
        
        elif metric == "quality_score":
            difference = abs(stats_a.avg_quality_score - stats_b.avg_quality_score)
            significant = difference > 5.0  # 5ポイント以上の差
            
            return {
                "metric": metric,
                "value_a": stats_a.avg_quality_score,
                "value_b": stats_b.avg_quality_score,
                "difference": difference,
                "significant": significant,
                "p_value": 0.02 if significant else 0.15,
                "confidence_level": 0.95
            }
        
        return {"error": f"未対応のメトリック: {metric}"}

    def _generate_ab_test_recommendation(
        self,
        stats_a: PromptUsageStats,
        stats_b: PromptUsageStats,
        significance: Dict[str, Any]
    ) -> str:
        """A/Bテスト推奨結果生成"""
        if not significance.get("significant", False):
            return "統計的有意差が見られません。テストを継続するか、サンプルサイズを増やしてください。"
        
        if significance["value_a"] > significance["value_b"]:
            return f"バリアントAが有意に優れています（差: {significance['difference']:.3f}）。バリアントAの採用を推奨します。"
        else:
            return f"バリアントBが有意に優れています（差: {significance['difference']:.3f}）。バリアントBの採用を推奨します。"

    def _should_complete_test(
        self,
        test: ABTest,
        stats_a: PromptUsageStats,
        stats_b: PromptUsageStats,
        significance: Dict[str, Any]
    ) -> bool:
        """テスト完了判定"""
        # 最小サンプルサイズ
        if min(stats_a.total_usage, stats_b.total_usage) < test.min_sample_size:
            return False
        
        # 期間終了
        if test.end_date and datetime.now() > test.end_date:
            return True
        
        # 統計的有意性達成
        if significance.get("significant", False):
            return True
        
        return False

    async def _complete_ab_test(self, test_id: str, results: Dict[str, Any]):
        """A/Bテスト完了処理"""
        test = self.ab_tests[test_id]
        test.status = "completed"
        test.results = results
        
        # 履歴に保存
        self.test_history.append({
            "test_id": test_id,
            "completed_at": datetime.now(),
            "results": results
        })
        
        await self._save_ab_test(test)
        logger.info(f"A/Bテスト完了: {test_id}")

    async def _auto_optimize(
        self, 
        template: PromptTemplate, 
        stats: PromptUsageStats
    ) -> Dict[str, Any]:
        """自動最適化"""
        # 簡易実装（実際にはAIベースの最適化を実装）
        
        # 成功率が低い場合の改善
        success_rate = stats.success_count / stats.total_usage
        if success_rate < 0.7:
            optimization_type = "clarity"
            optimized_prompt = self._improve_clarity(template.template)
            improvement_score = 0.15
        # 品質スコアが低い場合
        elif stats.avg_quality_score < 70:
            optimization_type = "specificity"
            optimized_prompt = self._improve_specificity(template.template)
            improvement_score = 0.12
        # 応答時間が長い場合
        elif stats.avg_response_time > 5.0:
            optimization_type = "length"
            optimized_prompt = self._reduce_length(template.template)
            improvement_score = 0.08
        else:
            optimization_type = "general"
            optimized_prompt = template.template
            improvement_score = 0.0
        
        return {
            "optimized_prompt": optimized_prompt,
            "optimization_type": optimization_type,
            "improvement_score": improvement_score,
            "recommendation": f"{optimization_type}の観点から最適化しました"
        }

    async def _optimize_length(
        self, 
        template: PromptTemplate, 
        stats: PromptUsageStats
    ) -> Dict[str, Any]:
        """長さ最適化"""
        optimized = self._reduce_length(template.template)
        return {
            "optimized_prompt": optimized,
            "optimization_type": "length",
            "improvement_score": 0.1,
            "recommendation": "プロンプトの長さを最適化しました"
        }

    async def _optimize_clarity(
        self, 
        template: PromptTemplate, 
        stats: PromptUsageStats
    ) -> Dict[str, Any]:
        """明瞭性最適化"""
        optimized = self._improve_clarity(template.template)
        return {
            "optimized_prompt": optimized,
            "optimization_type": "clarity",
            "improvement_score": 0.15,
            "recommendation": "プロンプトの明瞭性を改善しました"
        }

    async def _optimize_specificity(
        self, 
        template: PromptTemplate, 
        stats: PromptUsageStats
    ) -> Dict[str, Any]:
        """具体性最適化"""
        optimized = self._improve_specificity(template.template)
        return {
            "optimized_prompt": optimized,
            "optimization_type": "specificity",
            "improvement_score": 0.12,
            "recommendation": "プロンプトの具体性を強化しました"
        }

    async def _test_optimization(
        self, 
        original: PromptTemplate, 
        optimization: Dict[str, Any]
    ) -> Dict[str, Any]:
        """最適化テスト"""
        # 仮のテスト結果
        return {
            "test_type": "simulation",
            "original_score": 75.0,
            "optimized_score": 75.0 + (optimization["improvement_score"] * 100),
            "improvement": optimization["improvement_score"],
            "confidence": 0.85
        }

    def _calculate_test_progress(self, test: ABTest) -> float:
        """テスト進捗計算"""
        stats_a = self.usage_stats.get(test.variant_a, PromptUsageStats(test.variant_a, 0, 0, 0, 0, 0, datetime.now()))
        stats_b = self.usage_stats.get(test.variant_b, PromptUsageStats(test.variant_b, 0, 0, 0, 0, 0, datetime.now()))
        
        current_samples = min(stats_a.total_usage, stats_b.total_usage)
        progress = min(current_samples / test.min_sample_size, 1.0)
        
        return round(progress, 2)

    async def _identify_optimization_opportunities(self) -> List[Dict[str, Any]]:
        """最適化機会特定"""
        opportunities = []
        
        for template_id, stats in self.usage_stats.items():
            if stats.total_usage < 10:
                continue
            
            success_rate = stats.success_count / stats.total_usage
            
            if success_rate < 0.7:
                opportunities.append({
                    "template_id": template_id,
                    "type": "low_success_rate",
                    "current_value": success_rate,
                    "recommendation": "成功率改善の最適化が必要"
                })
            
            if stats.avg_quality_score < 70:
                opportunities.append({
                    "template_id": template_id,
                    "type": "low_quality_score",
                    "current_value": stats.avg_quality_score,
                    "recommendation": "品質スコア向上の最適化が必要"
                })
        
        return opportunities[:5]  # 上位5つ

    # テキスト最適化ヘルパー

    def _reduce_length(self, prompt: str) -> str:
        """プロンプト長さ削減"""
        # 冗長な表現を削除
        optimized = prompt.replace("について詳細に", "を")
        optimized = optimized.replace("具体的に説明してください", "説明してください")
        optimized = optimized.replace("以下の内容について", "以下を")
        return optimized

    def _improve_clarity(self, prompt: str) -> str:
        """明瞭性改善"""
        # 明確な指示を追加
        if "してください" not in prompt:
            prompt += "\n\n明確で具体的な回答をしてください。"
        
        # 構造化指示追加
        if "以下の形式で" not in prompt:
            prompt += "\n\n回答は構造化された形式で提供してください。"
        
        return prompt

    def _improve_specificity(self, prompt: str) -> str:
        """具体性強化"""
        # 具体的な要求追加
        if "例" not in prompt:
            prompt += "\n\n具体例を含めて回答してください。"
        
        # 数値要求追加
        if "数値" not in prompt:
            prompt += "\n\n可能な限り数値データを含めてください。"
        
        return prompt

    def _add_explanatory_context(self, prompt: str) -> str:
        """説明的コンテキスト追加（初心者向け）"""
        return f"【初心者向け】\n{prompt}\n\n専門用語は分かりやすく説明してください。"

    def _add_technical_details(self, prompt: str) -> str:
        """技術的詳細追加（専門家向け）"""
        return f"【専門家向け】\n{prompt}\n\n技術的な詳細と高度な分析を含めてください。"

    def _add_enterprise_focus(self, prompt: str) -> str:
        """企業向けフォーカス追加"""
        return f"【企業向け】\n{prompt}\n\nビジネス観点とROIを重視した回答をしてください。"

    # データ永続化

    async def _save_template(self, template: PromptTemplate):
        """テンプレート保存"""
        file_path = os.path.join(self.storage_path, f"template_{template.id}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(asdict(template), f, ensure_ascii=False, indent=2, default=str)

    async def _save_ab_test(self, test: ABTest):
        """A/Bテスト保存"""
        file_path = os.path.join(self.storage_path, f"abtest_{test.test_id}.json")
        with open(file_path, 'w', encoding='utf-8') as f:
            json.dump(asdict(test), f, ensure_ascii=False, indent=2, default=str)

    def _load_templates(self):
        """テンプレート読み込み"""
        try:
            for filename in os.listdir(self.storage_path):
                if filename.startswith("template_") and filename.endswith(".json"):
                    file_path = os.path.join(self.storage_path, filename)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        template = PromptTemplate(**data)
                        self.templates[template.id] = template
        except Exception as e:
            logger.error(f"テンプレート読み込みエラー: {str(e)}")

    def _load_ab_tests(self):
        """A/Bテスト読み込み"""
        try:
            for filename in os.listdir(self.storage_path):
                if filename.startswith("abtest_") and filename.endswith(".json"):
                    file_path = os.path.join(self.storage_path, filename)
                    with open(file_path, 'r', encoding='utf-8') as f:
                        data = json.load(f)
                        test = ABTest(**data)
                        self.ab_tests[test.test_id] = test
        except Exception as e:
            logger.error(f"A/Bテスト読み込みエラー: {str(e)}")

    def _load_usage_stats(self):
        """使用統計読み込み"""
        try:
            stats_file = os.path.join(self.storage_path, "usage_stats.json")
            if os.path.exists(stats_file):
                with open(stats_file, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    for prompt_id, stats_data in data.items():
                        self.usage_stats[prompt_id] = PromptUsageStats(**stats_data)
        except Exception as e:
            logger.error(f"使用統計読み込みエラー: {str(e)}")

    def _initialize_default_templates(self):
        """デフォルトテンプレート初期化"""
        if not self.templates:
            # デフォルトテンプレート作成
            default_templates = [
                {
                    "name": "事業計画書生成",
                    "prompt_type": PromptType.BUSINESS_PLAN,
                    "template": """
以下の企業情報に基づいて、補助金申請用の効果的な事業計画書を作成してください。

## 企業情報
- 会社名: {company_name}
- 業界: {industry}
- 従業員数: {employee_count}
- 事業内容: {description}

## 補助金情報
- 補助金タイプ: {subsidy_type}
- 申請金額: {requested_amount}

## 作成要件
以下の構成で、採択されやすい説得力のある事業計画書を作成してください：

1. 事業概要（200文字以内）
2. 課題・背景（300文字以内）
3. 解決策・アプローチ（400文字以内）
4. 期待効果・成果（300文字以内）
5. 実施計画（300文字以内）
6. 予算計画（200文字以内）

各セクションは具体的で測定可能な内容を含め、審査員に響く表現を使用してください。
""",
                    "variables": ["company_name", "industry", "employee_count", "description", "subsidy_type", "requested_amount"],
                    "description": "補助金申請用事業計画書生成のデフォルトテンプレート"
                }
            ]
            
            for template_data in default_templates:
                asyncio.create_task(self.create_prompt_template(**template_data))