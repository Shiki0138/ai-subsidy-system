"""
AI品質評価システム
生成されたコンテンツの品質を多次元で評価
"""

from typing import Dict, List, Optional, Tuple
import re
import json
import asyncio
from dataclasses import dataclass
from datetime import datetime
import logging

logger = logging.getLogger(__name__)


@dataclass
class QualityMetrics:
    """品質評価メトリクス"""
    relevance_score: float = 0.0      # 関連性スコア
    coherence_score: float = 0.0      # 一貫性スコア  
    factuality_score: float = 0.0     # 事実性スコア
    completeness_score: float = 0.0   # 完全性スコア
    clarity_score: float = 0.0        # 明瞭性スコア
    innovation_score: float = 0.0     # 革新性スコア
    overall_score: float = 0.0        # 総合スコア
    confidence_level: float = 0.0     # 信頼度レベル


@dataclass
class QualityFeedback:
    """品質フィードバック"""
    metrics: QualityMetrics
    strengths: List[str]
    weaknesses: List[str]
    improvement_suggestions: List[str]
    quality_grade: str  # A, B, C, D, F
    timestamp: datetime


class QualityEvaluator:
    """AI品質評価器"""
    
    def __init__(self):
        """初期化"""
        self.evaluation_criteria = self._load_evaluation_criteria()
        self.quality_thresholds = {
            'A': 90,
            'B': 80, 
            'C': 70,
            'D': 60,
            'F': 0
        }
        
        # 業界特化評価ルール
        self.industry_rules = self._load_industry_rules()
        
        # キーワード辞書
        self.keyword_dict = self._load_keyword_dictionary()

    async def evaluate_business_plan(
        self,
        content: str,
        company_data: Dict,
        subsidy_type: str
    ) -> float:
        """
        事業計画書の品質評価
        
        Args:
            content: 事業計画書コンテンツ
            company_data: 企業データ
            subsidy_type: 補助金タイプ
            
        Returns:
            float: 品質スコア (0-100)
        """
        try:
            # 各メトリクスを並列評価
            tasks = [
                self._evaluate_relevance(content, company_data, subsidy_type),
                self._evaluate_coherence(content),
                self._evaluate_factuality(content, company_data),
                self._evaluate_completeness(content, subsidy_type),
                self._evaluate_clarity(content),
                self._evaluate_innovation(content, company_data)
            ]
            
            scores = await asyncio.gather(*tasks)
            
            metrics = QualityMetrics(
                relevance_score=scores[0],
                coherence_score=scores[1],
                factuality_score=scores[2],
                completeness_score=scores[3],
                clarity_score=scores[4],
                innovation_score=scores[5]
            )
            
            # 重み付け総合スコア計算
            metrics.overall_score = self._calculate_weighted_score(metrics)
            metrics.confidence_level = self._calculate_confidence(metrics)
            
            return metrics.overall_score
            
        except Exception as e:
            logger.error(f"品質評価エラー: {str(e)}")
            return 60.0  # デフォルトスコア

    async def comprehensive_evaluation(
        self,
        content: str,
        context: Dict,
        evaluation_type: str = "business_plan"
    ) -> QualityFeedback:
        """
        包括的品質評価
        
        Args:
            content: 評価対象コンテンツ
            context: コンテキスト情報
            evaluation_type: 評価タイプ
            
        Returns:
            QualityFeedback: 詳細評価結果
        """
        try:
            # 基本メトリクス評価
            metrics = await self._evaluate_all_metrics(content, context, evaluation_type)
            
            # 強み・弱み分析
            strengths = self._analyze_strengths(content, metrics)
            weaknesses = self._analyze_weaknesses(content, metrics)
            
            # 改善提案生成
            suggestions = self._generate_improvement_suggestions(content, metrics, context)
            
            # 品質グレード決定
            grade = self._assign_quality_grade(metrics.overall_score)
            
            return QualityFeedback(
                metrics=metrics,
                strengths=strengths,
                weaknesses=weaknesses,
                improvement_suggestions=suggestions,
                quality_grade=grade,
                timestamp=datetime.now()
            )
            
        except Exception as e:
            logger.error(f"包括的評価エラー: {str(e)}")
            # フォールバック評価
            return self._fallback_evaluation(content)

    async def _evaluate_relevance(
        self,
        content: str,
        company_data: Dict,
        subsidy_type: str
    ) -> float:
        """関連性評価"""
        score = 70.0  # ベーススコア
        
        # 企業情報との関連性チェック
        company_keywords = self._extract_company_keywords(company_data)
        content_lower = content.lower()
        
        keyword_matches = sum(1 for keyword in company_keywords if keyword.lower() in content_lower)
        keyword_relevance = min(keyword_matches * 5, 20)  # 最大20点
        
        # 補助金タイプとの適合性チェック
        subsidy_keywords = self.keyword_dict.get(subsidy_type, [])
        subsidy_matches = sum(1 for keyword in subsidy_keywords if keyword.lower() in content_lower)
        subsidy_relevance = min(subsidy_matches * 3, 15)  # 最大15点
        
        score += keyword_relevance + subsidy_relevance
        
        return min(score, 100.0)

    async def _evaluate_coherence(self, content: str) -> float:
        """一貫性評価"""
        score = 70.0
        
        # 文章構造の一貫性
        sentences = self._split_sentences(content)
        if len(sentences) < 3:
            return 50.0
        
        # 段落構造チェック
        paragraphs = content.split('\n\n')
        if len(paragraphs) >= 3:
            score += 10
        
        # 論理的流れの評価
        logical_connectors = ['そのため', 'したがって', 'また', 'さらに', 'その結果']
        connector_count = sum(1 for connector in logical_connectors if connector in content)
        score += min(connector_count * 2, 10)
        
        # 重複表現のチェック
        repetition_penalty = self._calculate_repetition_penalty(content)
        score -= repetition_penalty
        
        return max(min(score, 100.0), 30.0)

    async def _evaluate_factuality(self, content: str, company_data: Dict) -> float:
        """事実性評価"""
        score = 75.0
        
        # 数値の妥当性チェック
        numbers = re.findall(r'\d+(?:\.\d+)?%?', content)
        for number in numbers:
            if self._is_reasonable_number(number):
                score += 1
            else:
                score -= 3
        
        # 企業情報との整合性
        inconsistencies = self._check_company_data_consistency(content, company_data)
        score -= len(inconsistencies) * 5
        
        # 非現実的な主張のチェック
        unrealistic_claims = self._detect_unrealistic_claims(content)
        score -= len(unrealistic_claims) * 8
        
        return max(min(score, 100.0), 40.0)

    async def _evaluate_completeness(self, content: str, subsidy_type: str) -> float:
        """完全性評価"""
        score = 60.0
        
        # 必須要素のチェック
        required_elements = self._get_required_elements(subsidy_type)
        present_elements = self._check_elements_presence(content, required_elements)
        
        completion_rate = len(present_elements) / len(required_elements)
        score += completion_rate * 30
        
        # 内容の詳細度
        detail_score = self._evaluate_detail_level(content)
        score += detail_score
        
        return min(score, 100.0)

    async def _evaluate_clarity(self, content: str) -> float:
        """明瞭性評価"""
        score = 70.0
        
        # 読みやすさ指標
        readability = self._calculate_readability(content)
        score += readability * 0.3
        
        # 専門用語の適切な使用
        jargon_score = self._evaluate_jargon_usage(content)
        score += jargon_score
        
        # 文章の明瞭性
        clarity_indicators = ['具体的', '明確', '詳細', '効果的']
        clarity_count = sum(1 for indicator in clarity_indicators if indicator in content)
        score += min(clarity_count * 2, 8)
        
        return min(score, 100.0)

    async def _evaluate_innovation(self, content: str, company_data: Dict) -> float:
        """革新性評価"""
        score = 65.0
        
        # 革新性キーワード
        innovation_keywords = [
            'AI', '人工知能', 'IoT', 'DX', 'デジタル変革', 
            '自動化', '効率化', '最適化', '革新', '新技術'
        ]
        
        innovation_count = sum(1 for keyword in innovation_keywords if keyword in content)
        score += min(innovation_count * 3, 20)
        
        # 独自性の評価
        uniqueness_score = self._evaluate_uniqueness(content, company_data)
        score += uniqueness_score
        
        return min(score, 100.0)

    def _calculate_weighted_score(self, metrics: QualityMetrics) -> float:
        """重み付け総合スコア計算"""
        weights = {
            'relevance': 0.25,
            'coherence': 0.20,
            'factuality': 0.20,
            'completeness': 0.15,
            'clarity': 0.10,
            'innovation': 0.10
        }
        
        weighted_sum = (
            metrics.relevance_score * weights['relevance'] +
            metrics.coherence_score * weights['coherence'] +
            metrics.factuality_score * weights['factuality'] +
            metrics.completeness_score * weights['completeness'] +
            metrics.clarity_score * weights['clarity'] +
            metrics.innovation_score * weights['innovation']
        )
        
        return round(weighted_sum, 2)

    def _calculate_confidence(self, metrics: QualityMetrics) -> float:
        """信頼度計算"""
        scores = [
            metrics.relevance_score,
            metrics.coherence_score,
            metrics.factuality_score,
            metrics.completeness_score,
            metrics.clarity_score,
            metrics.innovation_score
        ]
        
        # 分散が小さいほど信頼度が高い
        variance = sum((score - metrics.overall_score) ** 2 for score in scores) / len(scores)
        confidence = max(100 - variance / 10, 50)
        
        return round(confidence, 2)

    def _analyze_strengths(self, content: str, metrics: QualityMetrics) -> List[str]:
        """強み分析"""
        strengths = []
        
        if metrics.relevance_score >= 80:
            strengths.append("企業情報と補助金要件に高い関連性を持つ")
        
        if metrics.coherence_score >= 80:
            strengths.append("論理的で一貫性のある構成")
        
        if metrics.factuality_score >= 80:
            strengths.append("事実に基づいた信頼性の高い内容")
        
        if metrics.completeness_score >= 80:
            strengths.append("必要な要素を網羅的に含んでいる")
        
        if metrics.clarity_score >= 80:
            strengths.append("明瞭で理解しやすい表現")
        
        if metrics.innovation_score >= 80:
            strengths.append("革新性と独自性が評価できる")
        
        return strengths

    def _analyze_weaknesses(self, content: str, metrics: QualityMetrics) -> List[str]:
        """弱み分析"""
        weaknesses = []
        
        if metrics.relevance_score < 70:
            weaknesses.append("企業特性や補助金要件との関連性が不十分")
        
        if metrics.coherence_score < 70:
            weaknesses.append("文章構造や論理的流れに改善の余地")
        
        if metrics.factuality_score < 70:
            weaknesses.append("事実性や数値の妥当性に疑問点")
        
        if metrics.completeness_score < 70:
            weaknesses.append("必要な要素や詳細が不足")
        
        if metrics.clarity_score < 70:
            weaknesses.append("表現の明瞭性に改善が必要")
        
        if metrics.innovation_score < 70:
            weaknesses.append("革新性や独自性の訴求が不足")
        
        return weaknesses

    def _generate_improvement_suggestions(
        self,
        content: str,
        metrics: QualityMetrics,
        context: Dict
    ) -> List[str]:
        """改善提案生成"""
        suggestions = []
        
        if metrics.relevance_score < 80:
            suggestions.append("企業の特徴的な事業内容をより具体的に記載してください")
        
        if metrics.coherence_score < 80:
            suggestions.append("段落間の論理的つながりを強化してください")
        
        if metrics.factuality_score < 80:
            suggestions.append("数値目標をより現実的で具体的に設定してください")
        
        if metrics.completeness_score < 80:
            suggestions.append("補助金申請に必要な要素を追加で盛り込んでください")
        
        if metrics.clarity_score < 80:
            suggestions.append("専門用語の説明を追加し、より分かりやすく表現してください")
        
        if metrics.innovation_score < 80:
            suggestions.append("技術革新性や独自性をより強調してください")
        
        return suggestions

    def _assign_quality_grade(self, overall_score: float) -> str:
        """品質グレード決定"""
        for grade, threshold in sorted(self.quality_thresholds.items(), key=lambda x: x[1], reverse=True):
            if overall_score >= threshold:
                return grade
        return 'F'

    # ヘルパーメソッド
    def _load_evaluation_criteria(self) -> Dict:
        """評価基準読み込み"""
        return {
            "business_plan": {
                "required_sections": ["事業概要", "課題", "解決策", "効果", "予算"],
                "min_length": 800,
                "max_length": 2000
            }
        }

    def _load_industry_rules(self) -> Dict:
        """業界特化ルール読み込み"""
        return {
            "IT": ["DX", "システム", "効率化"],
            "製造業": ["IoT", "自動化", "品質向上"],
            "サービス業": ["顧客満足", "サービス向上", "業務効率"]
        }

    def _load_keyword_dictionary(self) -> Dict:
        """キーワード辞書読み込み"""
        return {
            "IT導入補助金": ["IT", "システム", "デジタル", "効率化"],
            "ものづくり補助金": ["製造", "技術", "設備", "開発"],
            "事業再構築補助金": ["事業転換", "新分野", "業態転換"]
        }

    async def _evaluate_all_metrics(
        self,
        content: str,
        context: Dict,
        evaluation_type: str
    ) -> QualityMetrics:
        """全メトリクス評価"""
        # 簡易実装（実際の評価ロジックを実装）
        return QualityMetrics(
            relevance_score=75.0,
            coherence_score=80.0,
            factuality_score=78.0,
            completeness_score=73.0,
            clarity_score=82.0,
            innovation_score=70.0,
            overall_score=76.3,
            confidence_level=85.0
        )

    def _fallback_evaluation(self, content: str) -> QualityFeedback:
        """フォールバック評価"""
        metrics = QualityMetrics(
            relevance_score=70.0,
            coherence_score=70.0,
            factuality_score=70.0,
            completeness_score=70.0,
            clarity_score=70.0,
            innovation_score=70.0,
            overall_score=70.0,
            confidence_level=60.0
        )
        
        return QualityFeedback(
            metrics=metrics,
            strengths=["基本的な要件を満たしている"],
            weaknesses=["詳細評価が必要"],
            improvement_suggestions=["内容をより具体的に記載してください"],
            quality_grade="C",
            timestamp=datetime.now()
        )

    # 各種ヘルパーメソッドの簡易実装
    def _extract_company_keywords(self, company_data: Dict) -> List[str]:
        """企業キーワード抽出"""
        keywords = []
        if 'name' in company_data:
            keywords.append(company_data['name'])
        if 'industry' in company_data:
            keywords.append(company_data['industry'])
        return keywords

    def _split_sentences(self, text: str) -> List[str]:
        """文分割"""
        return re.split(r'[。！？]', text)

    def _calculate_repetition_penalty(self, text: str) -> float:
        """重複ペナルティ計算"""
        return 0.0  # 簡易実装

    def _is_reasonable_number(self, number: str) -> bool:
        """数値妥当性チェック"""
        return True  # 簡易実装

    def _check_company_data_consistency(self, content: str, company_data: Dict) -> List[str]:
        """企業データ整合性チェック"""
        return []  # 簡易実装

    def _detect_unrealistic_claims(self, content: str) -> List[str]:
        """非現実的主張検出"""
        return []  # 簡易実装

    def _get_required_elements(self, subsidy_type: str) -> List[str]:
        """必須要素取得"""
        return ["事業概要", "課題", "解決策", "効果"]

    def _check_elements_presence(self, content: str, elements: List[str]) -> List[str]:
        """要素存在チェック"""
        return [elem for elem in elements if elem in content]

    def _evaluate_detail_level(self, content: str) -> float:
        """詳細度評価"""
        return min(len(content) / 100, 10)

    def _calculate_readability(self, content: str) -> float:
        """読みやすさ計算"""
        return 70.0  # 簡易実装

    def _evaluate_jargon_usage(self, content: str) -> float:
        """専門用語使用評価"""
        return 5.0  # 簡易実装

    def _evaluate_uniqueness(self, content: str, company_data: Dict) -> float:
        """独自性評価"""
        return 10.0  # 簡易実装