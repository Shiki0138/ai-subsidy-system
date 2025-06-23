"""
ユーザー体験最適化サービス
課金モデルでのユーザー満足度を最大化
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import logging
import json

logger = logging.getLogger(__name__)


class UserType(Enum):
    """ユーザータイプ"""
    FIRST_TIME = "first_time"           # 初回ユーザー
    RETURNING = "returning"             # リピートユーザー
    FREQUENT = "frequent"               # 頻繁利用ユーザー
    SUBSCRIBER = "subscriber"           # サブスクライバー


class PurchaseIntent(Enum):
    """購入意図"""
    HIGH = "high"                       # 高い購入意図
    MEDIUM = "medium"                   # 中程度の購入意図
    LOW = "low"                         # 低い購入意図
    EXPLORATION = "exploration"         # 検討段階


@dataclass
class UserContext:
    """ユーザーコンテキスト"""
    user_id: str
    user_type: UserType
    purchase_intent: PurchaseIntent
    session_time: int  # 秒
    page_views: int
    previous_scores: List[float] = field(default_factory=list)
    last_visit: Optional[datetime] = None
    device_type: str = "desktop"
    referrer_source: Optional[str] = None


@dataclass
class OptimizationStrategy:
    """最適化戦略"""
    primary_message: str
    secondary_messages: List[str]
    visual_emphasis: Dict[str, str]
    urgency_level: str  # "none", "low", "medium", "high"
    social_proof: List[str]
    risk_reduction: List[str]
    call_to_action: str
    pricing_display: Dict[str, Any]


class UserExperienceOptimizer:
    """ユーザー体験最適化サービス"""
    
    def __init__(self):
        self.conversion_patterns = {
            "first_time_high_intent": 0.35,
            "first_time_medium_intent": 0.18,
            "returning_high_intent": 0.65,
            "frequent_user": 0.80
        }
        
        # A/Bテストデータ（実際はDBから取得）
        self.ab_test_results = {
            "pricing_display": {
                "discount_first": {"conversion": 0.28, "satisfaction": 4.2},
                "value_first": {"conversion": 0.32, "satisfaction": 4.5},
                "savings_first": {"conversion": 0.25, "satisfaction": 4.1}
            },
            "urgency_messaging": {
                "none": {"conversion": 0.22, "satisfaction": 4.4},
                "low": {"conversion": 0.26, "satisfaction": 4.3},
                "medium": {"conversion": 0.31, "satisfaction": 4.1},
                "high": {"conversion": 0.29, "satisfaction": 3.8}
            }
        }
    
    async def optimize_user_experience(
        self,
        user_context: UserContext,
        quality_analysis: Dict[str, Any],
        preview_data: Dict[str, Any]
    ) -> OptimizationStrategy:
        """
        ユーザー体験の最適化
        ユーザーファーストの原則で個別最適化
        """
        try:
            # 1. ユーザータイプ別戦略決定
            base_strategy = self._get_base_strategy(user_context)
            
            # 2. 品質に基づく価値訴求調整
            quality_adjusted = self._adjust_for_quality(
                base_strategy, quality_analysis
            )
            
            # 3. 心理的要因の考慮
            psychological_optimized = self._apply_psychological_principles(
                quality_adjusted, user_context
            )
            
            # 4. パーソナライゼーション
            personalized = self._personalize_experience(
                psychological_optimized, user_context
            )
            
            # 5. A/Bテスト結果の反映
            final_strategy = self._apply_ab_test_insights(
                personalized, user_context
            )
            
            logger.info(f"UX optimization completed for user {user_context.user_id}")
            return final_strategy
            
        except Exception as e:
            logger.error(f"UX optimization error: {str(e)}")
            # フォールバック戦略
            return self._get_fallback_strategy()
    
    def _get_base_strategy(self, user_context: UserContext) -> OptimizationStrategy:
        """ユーザータイプ別基本戦略"""
        
        if user_context.user_type == UserType.FIRST_TIME:
            return OptimizationStrategy(
                primary_message="初回限定50%オフ！高品質な申請書を特別価格で",
                secondary_messages=[
                    "専門家レベルの申請書を3分で生成",
                    "24時間以内なら無条件返金",
                    "平均採択率72%の実績"
                ],
                visual_emphasis={
                    "price_highlight": "初回限定価格",
                    "savings_badge": "50%オフ",
                    "trust_elements": "security_badges"
                },
                urgency_level="low",
                social_proof=[
                    "1,247件の申請実績",
                    "896件の採択成功",
                    "顧客満足度4.3/5"
                ],
                risk_reduction=[
                    "24時間返金保証",
                    "SSL暗号化決済",
                    "個人情報保護"
                ],
                call_to_action="特別価格で今すぐ申請書を取得",
                pricing_display={
                    "style": "discount_first",
                    "show_savings": True,
                    "highlight_value": True
                }
            )
        
        elif user_context.user_type == UserType.RETURNING:
            if len(user_context.previous_scores) > 0:
                avg_score = sum(user_context.previous_scores) / len(user_context.previous_scores)
                return OptimizationStrategy(
                    primary_message=f"前回（{avg_score:.1f}点）より更に高品質な申請書を作成",
                    secondary_messages=[
                        "継続利用で品質が向上",
                        "あなたの成功をサポート",
                        "Growthプランで更にお得に"
                    ],
                    visual_emphasis={
                        "progress_indicator": "quality_improvement",
                        "loyalty_badge": "valued_customer"
                    },
                    urgency_level="none",
                    social_proof=[
                        "継続利用者の93%が満足",
                        "リピート率78%"
                    ],
                    risk_reduction=[
                        "安心の品質保証",
                        "いつでもサポート"
                    ],
                    call_to_action="更に高品質な申請書を作成",
                    pricing_display={
                        "style": "value_first",
                        "show_comparison": True,
                        "highlight_loyalty": True
                    }
                )
        
        elif user_context.user_type == UserType.FREQUENT:
            return OptimizationStrategy(
                primary_message="月額プランで無制限利用がお得です",
                secondary_messages=[
                    "年間68%の節約効果",
                    "専任サポート付き",
                    "優先処理で更に高速"
                ],
                visual_emphasis={
                    "roi_calculator": "savings_highlight",
                    "premium_badge": "vip_user"
                },
                urgency_level="none",
                social_proof=[
                    "ヘビーユーザーの89%がプラン移行",
                    "平均年間12万円の節約"
                ],
                risk_reduction=[
                    "いつでもプラン変更可能",
                    "日割り計算で無駄なし"
                ],
                call_to_action="Growthプランで更にお得に",
                pricing_display={
                    "style": "savings_first",
                    "show_roi": True,
                    "highlight_upgrade": True
                }
            )
        
        else:  # SUBSCRIBER
            return OptimizationStrategy(
                primary_message="サブスクライバー特典：即座にダウンロード可能",
                secondary_messages=[
                    "追加費用なし",
                    "プレミアムサポート利用可能",
                    "新機能優先アクセス"
                ],
                visual_emphasis={
                    "member_badge": "subscriber",
                    "instant_access": "highlighted"
                },
                urgency_level="none",
                social_proof=[
                    "サブスクライバー限定品質",
                    "プレミアムサポート"
                ],
                risk_reduction=[],
                call_to_action="即座にダウンロード",
                pricing_display={
                    "style": "subscriber_free",
                    "show_benefits": True
                }
            )
    
    def _adjust_for_quality(
        self,
        strategy: OptimizationStrategy,
        quality_analysis: Dict[str, Any]
    ) -> OptimizationStrategy:
        """品質に基づく価値訴求調整"""
        
        score = quality_analysis["overall_score"]
        success_rate = quality_analysis["success_probability"]
        
        if score >= 85:
            # 高品質の場合、価値を強調
            strategy.primary_message = (
                f"🏆 最高級品質（{score}点）の申請書が完成！"
                f"採択率{success_rate*100:.0f}%で安心申請"
            )
            strategy.visual_emphasis["quality_badge"] = "premium"
            strategy.social_proof.insert(0, f"品質スコア{score}点（上位10%）")
            
        elif score >= 70:
            # 良品質の場合、安心感を強調
            strategy.primary_message = (
                f"✅ 高品質（{score}点）申請書で採択率{success_rate*100:.0f}%"
            )
            strategy.visual_emphasis["quality_badge"] = "high_quality"
            
        else:
            # 改善余地がある場合、サポートを強調
            strategy.secondary_messages.append("改善提案で更に品質アップ可能")
            strategy.visual_emphasis["improvement_badge"] = "growth_potential"
        
        return strategy
    
    def _apply_psychological_principles(
        self,
        strategy: OptimizationStrategy,
        user_context: UserContext
    ) -> OptimizationStrategy:
        """心理学的原則の適用"""
        
        # 1. 希少性の原則（適度に）
        if user_context.user_type == UserType.FIRST_TIME:
            if user_context.session_time > 300:  # 5分以上滞在
                strategy.urgency_level = "low"
                strategy.secondary_messages.append(
                    "初回限定価格は今回のみ"
                )
        
        # 2. 社会的証明の強化
        if user_context.purchase_intent == PurchaseIntent.MEDIUM:
            strategy.social_proof.extend([
                "同規模企業の78%が利用",
                "今月だけで156件の申請支援"
            ])
        
        # 3. 権威性の活用
        strategy.social_proof.append("中小企業診断士監修")
        
        # 4. 一貫性の原則
        if user_context.user_type == UserType.RETURNING:
            strategy.secondary_messages.append(
                "継続的な品質向上への投資"
            )
        
        return strategy
    
    def _personalize_experience(
        self,
        strategy: OptimizationStrategy,
        user_context: UserContext
    ) -> OptimizationStrategy:
        """パーソナライゼーション"""
        
        # デバイス別最適化
        if user_context.device_type == "mobile":
            strategy.call_to_action = "タップして申請書を取得"
            strategy.pricing_display["mobile_optimized"] = True
        
        # 時間帯による調整
        current_hour = datetime.now().hour
        if 9 <= current_hour <= 17:  # 営業時間
            strategy.secondary_messages.append("営業時間内サポート対応中")
        else:
            strategy.secondary_messages.append("24時間自動処理で即座に対応")
        
        # 流入元による調整
        if user_context.referrer_source == "google_ads":
            strategy.visual_emphasis["ad_match"] = "search_intent"
        elif user_context.referrer_source == "organic":
            strategy.visual_emphasis["trust_focus"] = "organic_trust"
        
        return strategy
    
    def _apply_ab_test_insights(
        self,
        strategy: OptimizationStrategy,
        user_context: UserContext
    ) -> OptimizationStrategy:
        """A/Bテスト結果の反映"""
        
        # 価格表示方式の最適化
        pricing_tests = self.ab_test_results["pricing_display"]
        best_pricing = max(
            pricing_tests.items(),
            key=lambda x: x[1]["conversion"] * 0.7 + x[1]["satisfaction"] * 0.3
        )[0]
        
        strategy.pricing_display["ab_optimized"] = best_pricing
        
        # 緊急性メッセージの最適化
        urgency_tests = self.ab_test_results["urgency_messaging"]
        if user_context.user_type == UserType.FIRST_TIME:
            # 初回ユーザーには中程度の緊急性が効果的
            strategy.urgency_level = "medium"
        else:
            # リピートユーザーには緊急性を控えめに
            strategy.urgency_level = "low"
        
        return strategy
    
    def _get_fallback_strategy(self) -> OptimizationStrategy:
        """フォールバック戦略"""
        return OptimizationStrategy(
            primary_message="高品質な申請書を手軽に作成",
            secondary_messages=[
                "専門家レベルの品質",
                "安全・確実な決済",
                "24時間サポート"
            ],
            visual_emphasis={"safe_choice": "default"},
            urgency_level="none",
            social_proof=["1,000件以上の実績"],
            risk_reduction=["返金保証", "セキュア決済"],
            call_to_action="申請書を作成",
            pricing_display={"style": "simple", "show_value": True}
        )
    
    async def track_user_behavior(
        self,
        user_id: str,
        action: str,
        context: Dict[str, Any]
    ):
        """ユーザー行動トラッキング"""
        
        tracking_data = {
            "user_id": user_id,
            "action": action,
            "timestamp": datetime.now().isoformat(),
            "context": context
        }
        
        # 実際の実装では分析システムに送信
        logger.info(f"User behavior tracked: {tracking_data}")
        
        # A/Bテストデータの更新
        await self._update_ab_test_data(tracking_data)
    
    async def _update_ab_test_data(self, tracking_data: Dict[str, Any]):
        """A/Bテストデータの更新"""
        # 実際の実装では統計的有意性を考慮してデータ更新
        pass
    
    def calculate_conversion_probability(
        self,
        user_context: UserContext,
        optimization_strategy: OptimizationStrategy
    ) -> float:
        """コンバージョン確率予測"""
        
        base_rate = 0.25  # ベース転換率
        
        # ユーザータイプ調整
        type_multiplier = {
            UserType.FIRST_TIME: 1.0,
            UserType.RETURNING: 1.8,
            UserType.FREQUENT: 2.2,
            UserType.SUBSCRIBER: 0.1  # 既にサブスク
        }[user_context.user_type]
        
        # 購入意図調整
        intent_multiplier = {
            PurchaseIntent.HIGH: 2.5,
            PurchaseIntent.MEDIUM: 1.5,
            PurchaseIntent.LOW: 0.8,
            PurchaseIntent.EXPLORATION: 0.3
        }[user_context.purchase_intent]
        
        # セッション時間による調整
        time_factor = min(user_context.session_time / 300, 2.0)  # 5分で最適
        
        predicted_rate = base_rate * type_multiplier * intent_multiplier * time_factor
        
        return min(predicted_rate, 0.8)  # 最大80%