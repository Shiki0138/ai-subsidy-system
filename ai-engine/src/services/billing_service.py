"""
課金・決済サービス
Stripe統合とハイブリッド課金モデル管理
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import logging
import hashlib
import uuid

logger = logging.getLogger(__name__)


class PricingPlan(Enum):
    """料金プラン"""
    STARTER = "starter"              # 無料（プレビューのみ）
    PAY_PER_DOWNLOAD = "pay_per_download"  # 都度課金
    GROWTH = "growth"               # 月額9,800円
    SCALE = "scale"                 # 月額29,800円
    ENTERPRISE = "enterprise"       # 要相談


class PaymentStatus(Enum):
    """決済ステータス"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    REFUNDED = "refunded"
    EXPIRED = "expired"


@dataclass
class PaymentSession:
    """決済セッション"""
    session_id: str
    user_id: str
    product_id: str
    amount: int
    currency: str = "JPY"
    plan: PricingPlan = PricingPlan.PAY_PER_DOWNLOAD
    status: PaymentStatus = PaymentStatus.PENDING
    checkout_url: Optional[str] = None
    expires_at: datetime = field(default_factory=lambda: datetime.now() + timedelta(minutes=15))
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)


@dataclass
class UsagePurchase:
    """使用権購入記録"""
    purchase_id: str
    user_id: str
    tenant_id: str
    product_id: str
    pdf_id: str
    amount: int
    currency: str = "JPY"
    valid_until: datetime = field(default_factory=lambda: datetime.now() + timedelta(hours=24))
    download_count: int = 0
    max_downloads: int = 3
    created_at: datetime = field(default_factory=datetime.now)


@dataclass
class Subscription:
    """サブスクリプション"""
    subscription_id: str
    user_id: str
    tenant_id: str
    plan: PricingPlan
    status: str = "active"  # active, canceled, past_due, etc.
    current_period_start: datetime = field(default_factory=datetime.now)
    current_period_end: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=30))
    cancel_at_period_end: bool = False
    metadata: Dict[str, Any] = field(default_factory=dict)


class BillingService:
    """課金サービス"""
    
    def __init__(self):
        self.payment_sessions: Dict[str, PaymentSession] = {}
        self.usage_purchases: Dict[str, UsagePurchase] = {}
        self.subscriptions: Dict[str, Subscription] = {}
        
        # Stripe価格設定（モック）
        self.pricing = {
            PricingPlan.PAY_PER_DOWNLOAD: {
                "first_time": 1980,      # 初回限定価格
                "regular": 3980,         # 通常価格
                "bulk_3": 9800,         # 3回分パック
                "bulk_5": 14800         # 5回分パック
            },
            PricingPlan.GROWTH: {
                "monthly": 9800,
                "yearly": 98000  # 2ヶ月分お得
            },
            PricingPlan.SCALE: {
                "monthly": 29800,
                "yearly": 298000  # 2ヶ月分お得
            }
        }
    
    async def create_checkout_session(
        self,
        user_id: str,
        product_id: str,
        pdf_id: str,
        plan: PricingPlan = PricingPlan.PAY_PER_DOWNLOAD,
        promotion_code: Optional[str] = None
    ) -> PaymentSession:
        """
        Checkout Session作成
        
        Returns:
            PaymentSession with checkout_url
        """
        try:
            # 価格決定
            amount = await self._calculate_price(
                user_id, product_id, plan, promotion_code
            )
            
            # セッションID生成
            session_id = f"cs_{uuid.uuid4().hex[:24]}"
            
            # Stripeチェックアウトセッション作成（モック）
            checkout_url = await self._create_stripe_session(
                session_id, user_id, product_id, amount
            )
            
            # セッション保存
            session = PaymentSession(
                session_id=session_id,
                user_id=user_id,
                product_id=product_id,
                amount=amount,
                plan=plan,
                checkout_url=checkout_url,
                metadata={
                    "pdf_id": pdf_id,
                    "promotion_code": promotion_code,
                    "is_first_purchase": await self._is_first_purchase(user_id)
                }
            )
            
            self.payment_sessions[session_id] = session
            
            logger.info(f"決済セッション作成: {session_id}, 金額: ¥{amount}")
            return session
            
        except Exception as e:
            logger.error(f"決済セッション作成エラー: {str(e)}")
            raise
    
    async def process_webhook(
        self,
        event_type: str,
        session_id: str,
        stripe_data: Dict[str, Any]
    ) -> bool:
        """
        Stripe Webhook処理
        
        Returns:
            処理成功: True/False
        """
        try:
            if event_type == "checkout.session.completed":
                return await self._handle_checkout_completed(
                    session_id, stripe_data
                )
            elif event_type == "payment_intent.payment_failed":
                return await self._handle_payment_failed(
                    session_id, stripe_data
                )
            elif event_type == "customer.subscription.updated":
                return await self._handle_subscription_updated(
                    stripe_data
                )
            else:
                logger.warning(f"未対応のWebhookイベント: {event_type}")
                return True
                
        except Exception as e:
            logger.error(f"Webhook処理エラー: {str(e)}")
            return False
    
    async def check_payment_access(
        self,
        user_id: str,
        pdf_id: str
    ) -> Tuple[bool, Optional[str]]:
        """
        決済アクセス確認
        
        Returns:
            (アクセス可否, 理由メッセージ)
        """
        # 1. アクティブなサブスクリプション確認
        if await self._has_active_subscription(user_id):
            return True, "サブスクリプション有効"
        
        # 2. 24時間以内の購入確認
        recent_purchase = await self._get_recent_purchase(user_id, pdf_id)
        if recent_purchase:
            if recent_purchase.download_count < recent_purchase.max_downloads:
                return True, f"購入済み（残り{recent_purchase.max_downloads - recent_purchase.download_count}回）"
            else:
                return False, "ダウンロード回数上限に達しました"
        
        # 3. 無料枠確認（Starterプラン）
        if await self._has_free_quota(user_id):
            return True, "無料プレビュー"
        
        return False, "購入が必要です"
    
    async def record_download(
        self,
        user_id: str,
        pdf_id: str
    ) -> bool:
        """ダウンロード記録"""
        # 購入記録を探す
        for purchase in self.usage_purchases.values():
            if (purchase.user_id == user_id and 
                purchase.pdf_id == pdf_id and
                purchase.valid_until > datetime.now()):
                purchase.download_count += 1
                logger.info(
                    f"ダウンロード記録: user={user_id}, "
                    f"count={purchase.download_count}/{purchase.max_downloads}"
                )
                return True
        
        # サブスクリプションユーザーの場合は記録不要
        if await self._has_active_subscription(user_id):
            logger.info(f"サブスクユーザーのダウンロード: user={user_id}")
            return True
        
        return False
    
    async def get_pricing_recommendation(
        self,
        user_id: str,
        usage_history: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        価格プラン推奨
        
        Returns:
            {
                "recommended_plan": "growth",
                "reason": "月3回以上利用されているため",
                "potential_savings": 5940,
                "upgrade_benefits": ["無制限ダウンロード", "優先サポート"]
            }
        """
        # 過去の利用履歴分析
        monthly_usage = self._calculate_monthly_usage(usage_history)
        
        if monthly_usage >= 3:
            # 月3回以上使用 → Growth推奨
            single_cost = self.pricing[PricingPlan.PAY_PER_DOWNLOAD]["regular"]
            growth_cost = self.pricing[PricingPlan.GROWTH]["monthly"]
            savings = (single_cost * monthly_usage) - growth_cost
            
            return {
                "recommended_plan": PricingPlan.GROWTH.value,
                "reason": f"月平均{monthly_usage}回ご利用されているため",
                "potential_savings": max(savings, 0),
                "upgrade_benefits": [
                    "無制限ダウンロード",
                    "優先カスタマーサポート",
                    "新機能の早期アクセス",
                    "過去の申請書アーカイブ"
                ],
                "special_offer": {
                    "discount_rate": 0.2,  # 20%オフ
                    "valid_until": (datetime.now() + timedelta(days=7)).isoformat(),
                    "promo_code": "UPGRADE20"
                }
            }
        
        elif monthly_usage >= 10:
            # 月10回以上 → Scale推奨
            return {
                "recommended_plan": PricingPlan.SCALE.value,
                "reason": "ヘビーユーザー様向けのお得なプラン",
                "potential_savings": 50000,
                "upgrade_benefits": [
                    "無制限ダウンロード",
                    "専任カスタマーサクセス",
                    "API access",
                    "カスタマイズ相談",
                    "優先的な機能開発"
                ]
            }
        
        else:
            # 都度課金継続を推奨
            return {
                "recommended_plan": PricingPlan.PAY_PER_DOWNLOAD.value,
                "reason": "現在の利用頻度では都度課金がお得です",
                "bulk_offer": {
                    "3_pack": {
                        "price": self.pricing[PricingPlan.PAY_PER_DOWNLOAD]["bulk_3"],
                        "savings": 1940
                    },
                    "5_pack": {
                        "price": self.pricing[PricingPlan.PAY_PER_DOWNLOAD]["bulk_5"],
                        "savings": 5100
                    }
                }
            }
    
    # === Private Methods ===
    
    async def _calculate_price(
        self,
        user_id: str,
        product_id: str,
        plan: PricingPlan,
        promotion_code: Optional[str]
    ) -> int:
        """価格計算"""
        base_price = 0
        
        if plan == PricingPlan.PAY_PER_DOWNLOAD:
            # 初回割引チェック
            if await self._is_first_purchase(user_id):
                base_price = self.pricing[plan]["first_time"]
            else:
                base_price = self.pricing[plan]["regular"]
        else:
            base_price = self.pricing[plan]["monthly"]
        
        # プロモーションコード適用
        if promotion_code:
            discount = await self._get_promotion_discount(promotion_code)
            base_price = int(base_price * (1 - discount))
        
        return base_price
    
    async def _create_stripe_session(
        self,
        session_id: str,
        user_id: str,
        product_id: str,
        amount: int
    ) -> str:
        """Stripeチェックアウトセッション作成（モック）"""
        # 実際にはStripe APIを呼び出す
        return f"https://checkout.stripe.com/pay/{session_id}?amount={amount}"
    
    async def _handle_checkout_completed(
        self,
        session_id: str,
        stripe_data: Dict[str, Any]
    ) -> bool:
        """決済完了処理"""
        session = self.payment_sessions.get(session_id)
        if not session:
            logger.error(f"セッション not found: {session_id}")
            return False
        
        # ステータス更新
        session.status = PaymentStatus.COMPLETED
        session.updated_at = datetime.now()
        
        # 使用権作成
        purchase = UsagePurchase(
            purchase_id=f"pur_{uuid.uuid4().hex[:24]}",
            user_id=session.user_id,
            tenant_id=stripe_data.get("customer", "default"),
            product_id=session.product_id,
            pdf_id=session.metadata.get("pdf_id", ""),
            amount=session.amount
        )
        
        self.usage_purchases[purchase.purchase_id] = purchase
        
        logger.info(f"決済完了: {session_id}, 購入ID: {purchase.purchase_id}")
        return True
    
    async def _handle_payment_failed(
        self,
        session_id: str,
        stripe_data: Dict[str, Any]
    ) -> bool:
        """決済失敗処理"""
        session = self.payment_sessions.get(session_id)
        if session:
            session.status = PaymentStatus.FAILED
            session.updated_at = datetime.now()
        
        logger.warning(f"決済失敗: {session_id}")
        return True
    
    async def _handle_subscription_updated(
        self,
        stripe_data: Dict[str, Any]
    ) -> bool:
        """サブスクリプション更新処理"""
        # サブスクリプション情報更新
        logger.info(f"サブスク更新: {stripe_data.get('id')}")
        return True
    
    async def _has_active_subscription(self, user_id: str) -> bool:
        """アクティブなサブスクリプション確認"""
        for sub in self.subscriptions.values():
            if (sub.user_id == user_id and 
                sub.status == "active" and
                sub.current_period_end > datetime.now()):
                return True
        return False
    
    async def _get_recent_purchase(
        self,
        user_id: str,
        pdf_id: str
    ) -> Optional[UsagePurchase]:
        """直近の購入確認"""
        for purchase in self.usage_purchases.values():
            if (purchase.user_id == user_id and
                purchase.pdf_id == pdf_id and
                purchase.valid_until > datetime.now()):
                return purchase
        return None
    
    async def _has_free_quota(self, user_id: str) -> bool:
        """無料枠確認（Starterプラン）"""
        # 実装によってはユーザーごとの無料枠管理
        return False
    
    async def _is_first_purchase(self, user_id: str) -> bool:
        """初回購入確認"""
        for purchase in self.usage_purchases.values():
            if purchase.user_id == user_id:
                return False
        return True
    
    async def _get_promotion_discount(self, code: str) -> float:
        """プロモーションコード割引率取得"""
        promotions = {
            "FIRST50": 0.5,     # 50%オフ
            "UPGRADE20": 0.2,   # 20%オフ
            "FRIEND10": 0.1     # 10%オフ
        }
        return promotions.get(code, 0.0)
    
    def _calculate_monthly_usage(
        self,
        usage_history: List[Dict[str, Any]]
    ) -> int:
        """月間使用回数計算"""
        if not usage_history:
            return 0
        
        # 過去3ヶ月の平均を計算
        three_months_ago = datetime.now() - timedelta(days=90)
        recent_usage = [
            u for u in usage_history 
            if datetime.fromisoformat(u.get("created_at", "")) > three_months_ago
        ]
        
        if not recent_usage:
            return 0
        
        return len(recent_usage) // 3  # 3ヶ月で割る