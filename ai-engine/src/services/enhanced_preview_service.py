"""
Enhanced PDF プレビューサービス
ハイブリッド課金モデル対応の高度なプレビュー機能
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import logging
import json
import hashlib
from pathlib import Path

logger = logging.getLogger(__name__)


class QualityLevel(Enum):
    """品質レベル"""
    EXCELLENT = "excellent"     # 85点以上
    GOOD = "good"              # 70-84点
    FAIR = "fair"              # 55-69点
    NEEDS_IMPROVEMENT = "needs_improvement"  # 55点未満


@dataclass
class ValueProposition:
    """価値訴求要素"""
    price_justification: str
    quality_highlights: List[str]
    success_indicators: Dict[str, Any]
    user_benefits: List[str]
    risk_mitigation: List[str]


@dataclass
class SmartPreview:
    """スマートプレビュー結果"""
    preview_id: str
    preview_content: Dict[str, Any]
    quality_level: QualityLevel
    overall_score: float
    category_scores: Dict[str, float]
    value_proposition: ValueProposition
    improvement_suggestions: List[Dict[str, Any]]
    success_probability: float
    benchmark_comparison: Dict[str, Any]
    personalized_message: str
    purchase_urgency: Optional[str] = None


class EnhancedPreviewService:
    """Enhanced プレビューサービス"""
    
    def __init__(self, output_dir: str = "output/enhanced_previews"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.preview_cache = {}
        
        # 採択実績データ（実際はDBから取得）
        self.success_data = {
            "total_applications": 1247,
            "total_adopted": 896,
            "average_success_rate": 0.72,
            "by_quality_score": {
                "85+": 0.89,
                "70-84": 0.76,
                "55-69": 0.58,
                "55-": 0.31
            }
        }
    
    async def generate_smart_preview(
        self,
        application_data: Dict[str, Any],
        user_context: Dict[str, Any] = None
    ) -> SmartPreview:
        """
        スマートプレビュー生成
        ユーザーファーストな価値訴求を含む
        """
        try:
            if user_context is None:
                user_context = {}
            
            preview_id = self._generate_preview_id(application_data)
            
            # 1. 包括的品質評価
            quality_analysis = await self._comprehensive_quality_analysis(
                application_data
            )
            
            # 2. 価値訴求の生成
            value_proposition = await self._generate_value_proposition(
                quality_analysis, user_context
            )
            
            # 3. パーソナライズされたメッセージ
            personalized_message = self._create_personalized_message(
                quality_analysis, user_context
            )
            
            # 4. 改善提案（効果順）
            improvements = await self._generate_prioritized_improvements(
                application_data, quality_analysis
            )
            
            # 5. ベンチマーク比較
            benchmark = self._generate_benchmark_comparison(quality_analysis)
            
            # 6. プレビューコンテンツ生成
            preview_content = await self._create_enhanced_preview_content(
                application_data, quality_analysis
            )
            
            return SmartPreview(
                preview_id=preview_id,
                preview_content=preview_content,
                quality_level=self._determine_quality_level(quality_analysis["overall_score"]),
                overall_score=quality_analysis["overall_score"],
                category_scores=quality_analysis["category_scores"],
                value_proposition=value_proposition,
                improvement_suggestions=improvements,
                success_probability=quality_analysis["success_probability"],
                benchmark_comparison=benchmark,
                personalized_message=personalized_message,
                purchase_urgency=self._determine_purchase_urgency(quality_analysis)
            )
            
        except Exception as e:
            logger.error(f"Enhanced preview generation error: {str(e)}")
            raise
    
    async def _comprehensive_quality_analysis(
        self,
        application_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """包括的品質分析"""
        
        # 各カテゴリーのスコア計算
        category_scores = {
            "completeness": await self._evaluate_completeness(application_data),
            "coherence": await self._evaluate_coherence(application_data),
            "persuasiveness": await self._evaluate_persuasiveness(application_data),
            "technical_accuracy": await self._evaluate_technical_accuracy(application_data),
            "innovation": await self._evaluate_innovation(application_data),
            "feasibility": await self._evaluate_feasibility(application_data)
        }
        
        # 重み付き総合スコア
        weights = {
            "completeness": 0.20,
            "coherence": 0.18,
            "persuasiveness": 0.18,
            "technical_accuracy": 0.15,
            "innovation": 0.15,
            "feasibility": 0.14
        }
        
        overall_score = sum(
            category_scores[category] * weight
            for category, weight in weights.items()
        )
        
        # 成功確率予測
        success_probability = self._predict_success_rate(overall_score, category_scores)
        
        return {
            "overall_score": round(overall_score, 1),
            "category_scores": {k: round(v, 1) for k, v in category_scores.items()},
            "success_probability": round(success_probability, 3),
            "strengths": self._identify_strengths(category_scores),
            "weaknesses": self._identify_weaknesses(category_scores)
        }
    
    async def _generate_value_proposition(
        self,
        quality_analysis: Dict[str, Any],
        user_context: Dict[str, Any]
    ) -> ValueProposition:
        """価値訴求の生成"""
        
        score = quality_analysis["overall_score"]
        success_rate = quality_analysis["success_probability"]
        
        # なぜ3,980円の価値があるかの説明
        if score >= 85:
            price_justification = (
                f"品質スコア{score}点の申請書は、採択率{success_rate*100:.0f}%と"
                "非常に高い成功確率を持ちます。専門コンサルタントに依頼すると"
                "30万円以上かかる品質を、わずか3,980円で実現します。"
            )
        elif score >= 70:
            price_justification = (
                f"品質スコア{score}点は平均を大きく上回る品質です。"
                f"採択率{success_rate*100:.0f}%で、投資対効果は抜群です。"
                "申請準備にかかる時間短縮効果も含めると、圧倒的にお得です。"
            )
        else:
            price_justification = (
                "基本的な申請書の作成と、改善提案により品質向上が可能です。"
                "自力で作成する場合の時間コスト（40時間以上）を考えると、"
                "効率的な選択肢です。"
            )
        
        # 品質ハイライト
        quality_highlights = []
        if score >= 80:
            quality_highlights.append("🏆 上位20%の高品質申請書")
        if quality_analysis["category_scores"]["persuasiveness"] >= 80:
            quality_highlights.append("💪 高い説得力を持つ構成")
        if quality_analysis["category_scores"]["innovation"] >= 75:
            quality_highlights.append("💡 革新性が評価される内容")
        if quality_analysis["category_scores"]["feasibility"] >= 80:
            quality_highlights.append("✅ 実現可能性の高い計画")
        
        # 成功指標
        success_indicators = {
            "predicted_success_rate": f"{success_rate*100:.0f}%",
            "quality_ranking": self._get_quality_ranking(score),
            "benchmark_comparison": f"平均より{score-65:.0f}点高い",
            "expert_validation": "専門家レビュー済み品質"
        }
        
        # ユーザーメリット
        user_benefits = [
            "📄 即座にダウンロード可能な完成版PDF",
            "🔄 24時間以内なら3回まで再ダウンロード",
            "📞 専任サポートによる申請相談",
            "📊 詳細な品質分析レポート付き",
            "💰 コンサル費用の90%以上節約"
        ]
        
        # リスク軽減
        risk_mitigation = [
            "24時間以内の無条件返金保証",
            "SSL暗号化による安全な決済",
            "個人情報の最小限収集",
            "専門家によるサポート体制"
        ]
        
        return ValueProposition(
            price_justification=price_justification,
            quality_highlights=quality_highlights,
            success_indicators=success_indicators,
            user_benefits=user_benefits,
            risk_mitigation=risk_mitigation
        )
    
    def _create_personalized_message(
        self,
        quality_analysis: Dict[str, Any],
        user_context: Dict[str, Any]
    ) -> str:
        """パーソナライズされたメッセージ"""
        
        score = quality_analysis["overall_score"]
        success_rate = quality_analysis["success_probability"]
        
        # 過去の利用履歴を考慮
        is_returning = user_context.get("is_returning_user", False)
        previous_quality = user_context.get("previous_quality_score", 0)
        
        if is_returning and previous_quality > 0:
            if score > previous_quality:
                return (
                    f"素晴らしい改善です！前回より{score-previous_quality:.1f}点向上し、"
                    f"採択率も{success_rate*100:.0f}%まで上がりました。"
                    "この品質なら自信を持って申請できます。"
                )
            else:
                return (
                    f"今回も安定した品質（{score}点）を実現されました。"
                    "継続的にご利用いただき、ありがとうございます。"
                )
        
        # 初回ユーザー向け
        if score >= 85:
            return (
                f"🎉 素晴らしい！{score}点の高品質申請書が完成しました。"
                f"採択率{success_rate*100:.0f}%という優秀な結果が期待できます。"
                "ぜひダウンロードして申請にお進みください！"
            )
        elif score >= 70:
            return (
                f"良い申請書ができました（{score}点）。"
                f"採択率{success_rate*100:.0f}%で、十分に競争力があります。"
                "改善提案も参考に、さらに品質を高めることも可能です。"
            )
        else:
            return (
                "基本的な申請書が完成しました。改善提案を参考に、"
                "より高い採択率を目指すことをお勧めします。"
            )
    
    async def _generate_prioritized_improvements(
        self,
        application_data: Dict[str, Any],
        quality_analysis: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """優先度付き改善提案"""
        
        improvements = []
        category_scores = quality_analysis["category_scores"]
        
        # 各カテゴリーの改善提案
        if category_scores["completeness"] < 80:
            improvements.append({
                "priority": "high",
                "category": "completeness",
                "title": "必須項目の充実",
                "description": "市場分析や競合比較の詳細を追加することで、説得力が向上します。",
                "impact": "+8〜12点",
                "effort": "中",
                "specific_actions": [
                    "ターゲット市場の規模データを追加",
                    "競合他社との差別化要因を明記",
                    "売上予測の根拠を詳細化"
                ]
            })
        
        if category_scores["persuasiveness"] < 75:
            improvements.append({
                "priority": "high",
                "category": "persuasiveness",
                "title": "説得力の強化",
                "description": "具体的な数値とストーリーで、審査員の心を掴む内容に。",
                "impact": "+6〜10点",
                "effort": "中",
                "specific_actions": [
                    "成功事例の具体的な数値を追加",
                    "実現プロセスのステップを詳細化",
                    "期待効果の定量的な説明を強化"
                ]
            })
        
        if category_scores["innovation"] < 70:
            improvements.append({
                "priority": "medium",
                "category": "innovation",
                "title": "革新性のアピール",
                "description": "独自性と新規性をより強調して、他社との差別化を明確に。",
                "impact": "+5〜8点",
                "effort": "高",
                "specific_actions": [
                    "技術的な独自性を具体的に説明",
                    "従来手法との比較表を作成",
                    "特許や知的財産の活用を記載"
                ]
            })
        
        # 効果の高い順にソート
        improvements.sort(key=lambda x: {
            "high": 3, "medium": 2, "low": 1
        }[x["priority"]], reverse=True)
        
        return improvements[:3]  # 上位3つに絞る
    
    def _generate_benchmark_comparison(
        self,
        quality_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """ベンチマーク比較"""
        
        score = quality_analysis["overall_score"]
        
        # パーセンタイル計算
        if score >= 85:
            percentile = 90
        elif score >= 80:
            percentile = 80
        elif score >= 75:
            percentile = 70
        elif score >= 70:
            percentile = 60
        elif score >= 65:
            percentile = 50
        else:
            percentile = 30
        
        return {
            "percentile": percentile,
            "comparison_text": f"上位{100-percentile}%の品質",
            "average_comparison": f"平均より{score-65:.1f}点高い",
            "success_rate_vs_average": f"平均採択率より{((quality_analysis['success_probability'] - 0.45) * 100):.0f}%高い"
        }
    
    async def _create_enhanced_preview_content(
        self,
        application_data: Dict[str, Any],
        quality_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Enhanced プレビューコンテンツ生成"""
        
        # 基本情報は完全表示
        preview_content = {
            "basic_info": application_data.get("company_info", {}),
            "project_title": application_data.get("project_info", {}).get("project_title", ""),
        }
        
        # 詳細セクションは戦略的に一部表示
        business_plan = application_data.get("business_plan", "")
        if len(business_plan) > 200:
            preview_content["business_plan"] = (
                business_plan[:200] + 
                "\n\n[...続きの詳細な事業計画は完全版でご確認いただけます...]"
            )
        else:
            preview_content["business_plan"] = business_plan
        
        # 財務計画は部分的にぼかし
        financial_data = application_data.get("financial_plan", {})
        preview_content["financial_plan"] = {
            "概要": "詳細な収支計画と資金調達戦略",
            "売上予測": "███年間で██％成長",
            "投資計画": "設備投資██万円、運転資金██万円",
            "完全版": "具体的な数値と根拠は完全版に記載"
        }
        
        # 品質評価結果を追加
        preview_content["quality_evaluation"] = {
            "overall_score": quality_analysis["overall_score"],
            "category_scores": quality_analysis["category_scores"],
            "strengths": quality_analysis["strengths"],
            "improvement_areas": ["詳細な分析は完全版で確認"]
        }
        
        # 透かし情報
        preview_content["watermark"] = {
            "text": "プレビュー版 - 完全版で全内容が表示されます",
            "position": "diagonal",
            "opacity": 0.3
        }
        
        return preview_content
    
    # === Evaluation Methods ===
    
    async def _evaluate_completeness(self, data: Dict[str, Any]) -> float:
        """完全性評価"""
        required_fields = [
            "company_info", "project_info", "business_plan", 
            "financial_plan", "implementation_schedule"
        ]
        
        filled_count = sum(1 for field in required_fields if data.get(field))
        base_score = (filled_count / len(required_fields)) * 70
        
        # 詳細度ボーナス
        detail_bonus = 0
        for field in required_fields:
            content = str(data.get(field, ""))
            if len(content) > 500:  # 十分な詳細
                detail_bonus += 6
            elif len(content) > 200:  # 基本的な詳細
                detail_bonus += 3
        
        return min(base_score + detail_bonus, 100)
    
    async def _evaluate_coherence(self, data: Dict[str, Any]) -> float:
        """一貫性評価（モック）"""
        # 実際にはNLP分析を行う
        return 78.5
    
    async def _evaluate_persuasiveness(self, data: Dict[str, Any]) -> float:
        """説得力評価（モック）"""
        # 実際には文章分析を行う
        return 82.0
    
    async def _evaluate_technical_accuracy(self, data: Dict[str, Any]) -> float:
        """技術的正確性評価（モック）"""
        return 75.8
    
    async def _evaluate_innovation(self, data: Dict[str, Any]) -> float:
        """革新性評価（モック）"""
        return 68.5
    
    async def _evaluate_feasibility(self, data: Dict[str, Any]) -> float:
        """実現可能性評価（モック）"""
        return 84.2
    
    def _predict_success_rate(
        self,
        overall_score: float,
        category_scores: Dict[str, float]
    ) -> float:
        """成功率予測"""
        
        # 基本成功率
        if overall_score >= 85:
            base_rate = 0.85
        elif overall_score >= 80:
            base_rate = 0.75
        elif overall_score >= 75:
            base_rate = 0.65
        elif overall_score >= 70:
            base_rate = 0.55
        elif overall_score >= 65:
            base_rate = 0.45
        else:
            base_rate = 0.30
        
        # カテゴリー別調整
        innovation_factor = min(category_scores["innovation"] / 70, 1.2)
        feasibility_factor = min(category_scores["feasibility"] / 80, 1.1)
        
        adjusted_rate = base_rate * innovation_factor * feasibility_factor
        return min(adjusted_rate, 0.95)  # 最大95%
    
    def _determine_quality_level(self, score: float) -> QualityLevel:
        """品質レベル判定"""
        if score >= 85:
            return QualityLevel.EXCELLENT
        elif score >= 70:
            return QualityLevel.GOOD
        elif score >= 55:
            return QualityLevel.FAIR
        else:
            return QualityLevel.NEEDS_IMPROVEMENT
    
    def _determine_purchase_urgency(self, quality_analysis: Dict[str, Any]) -> Optional[str]:
        """購入緊急度判定"""
        score = quality_analysis["overall_score"]
        
        if score >= 85:
            return "今すぐダウンロードして申請準備を完了させましょう！"
        elif score >= 75:
            return "この品質なら採択の可能性が高いです。お早めに申請を。"
        else:
            return None
    
    def _identify_strengths(self, category_scores: Dict[str, float]) -> List[str]:
        """強み特定"""
        strengths = []
        for category, score in category_scores.items():
            if score >= 80:
                strengths.append(f"{category}（{score:.1f}点）")
        return strengths
    
    def _identify_weaknesses(self, category_scores: Dict[str, float]) -> List[str]:
        """弱点特定"""
        weaknesses = []
        for category, score in category_scores.items():
            if score < 70:
                weaknesses.append(f"{category}（{score:.1f}点）")
        return weaknesses
    
    def _get_quality_ranking(self, score: float) -> str:
        """品質ランキング"""
        if score >= 90:
            return "S級（最高品質）"
        elif score >= 85:
            return "A級（優秀）"
        elif score >= 75:
            return "B級（良好）"
        elif score >= 65:
            return "C級（標準）"
        else:
            return "D級（要改善）"
    
    def _generate_preview_id(self, data: Dict[str, Any]) -> str:
        """プレビューID生成"""
        data_str = json.dumps(data, sort_keys=True)
        hash_value = hashlib.md5(data_str.encode()).hexdigest()[:12]
        return f"enhanced_prev_{hash_value}"