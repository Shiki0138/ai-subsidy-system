"""
決済ガードミドルウェア
PDF生成前の決済確認と権限チェック
"""

from typing import Callable, Optional, Dict, Any
from functools import wraps
import asyncio
import logging
from datetime import datetime
from enum import Enum

from src.services.billing_service import BillingService, PricingPlan

logger = logging.getLogger(__name__)


class AccessDeniedReason(Enum):
    """アクセス拒否理由"""
    NO_PAYMENT = "no_payment"
    QUOTA_EXCEEDED = "quota_exceeded"
    EXPIRED = "expired"
    INVALID_PLAN = "invalid_plan"
    SYSTEM_ERROR = "system_error"


class PaymentGuard:
    """決済ガード"""
    
    def __init__(self, billing_service: Optional[BillingService] = None):
        self.billing_service = billing_service or BillingService()
        self.access_log = []  # アクセスログ（監査用）
    
    def require_payment(
        self,
        resource_type: str = "pdf",
        allow_preview: bool = True
    ):
        """
        決済必須デコレータ
        
        Args:
            resource_type: リソースタイプ（pdf, api, etc）
            allow_preview: プレビューアクセスを許可するか
        """
        def decorator(func: Callable) -> Callable:
            @wraps(func)
            async def wrapper(*args, **kwargs):
                # リクエストコンテキストから情報取得
                request_context = kwargs.get("request_context", {})
                user_id = request_context.get("user_id")
                resource_id = request_context.get("resource_id", "")
                
                if not user_id:
                    return self._create_error_response(
                        "認証が必要です",
                        status_code=401
                    )
                
                # アクセス権確認
                has_access, access_info = await self._check_access(
                    user_id=user_id,
                    resource_id=resource_id,
                    resource_type=resource_type,
                    allow_preview=allow_preview
                )
                
                # アクセスログ記録
                self._log_access(
                    user_id=user_id,
                    resource_id=resource_id,
                    resource_type=resource_type,
                    has_access=has_access,
                    access_info=access_info
                )
                
                if not has_access:
                    return self._create_payment_required_response(
                        user_id=user_id,
                        resource_id=resource_id,
                        access_info=access_info
                    )
                
                # アクセス情報をコンテキストに追加
                kwargs["payment_context"] = {
                    "has_access": True,
                    "access_type": access_info.get("access_type"),
                    "remaining_quota": access_info.get("remaining_quota")
                }
                
                # 元の関数を実行
                result = await func(*args, **kwargs)
                
                # ダウンロード記録（成功時のみ）
                if result.get("success", False):
                    await self.billing_service.record_download(
                        user_id=user_id,
                        pdf_id=resource_id
                    )
                
                return result
            
            return wrapper
        return decorator
    
    async def check_bulk_access(
        self,
        user_id: str,
        resource_ids: list[str],
        resource_type: str = "pdf"
    ) -> Dict[str, bool]:
        """
        複数リソースへのアクセス権一括確認
        
        Returns:
            {resource_id: has_access}
        """
        results = {}
        
        for resource_id in resource_ids:
            has_access, _ = await self._check_access(
                user_id=user_id,
                resource_id=resource_id,
                resource_type=resource_type
            )
            results[resource_id] = has_access
        
        return results
    
    async def _check_access(
        self,
        user_id: str,
        resource_id: str,
        resource_type: str,
        allow_preview: bool = True
    ) -> tuple[bool, Dict[str, Any]]:
        """
        アクセス権確認
        
        Returns:
            (has_access, access_info)
        """
        try:
            # 1. Billing Serviceでアクセス確認
            has_access, reason = await self.billing_service.check_payment_access(
                user_id=user_id,
                pdf_id=resource_id
            )
            
            if has_access:
                return True, {
                    "access_type": reason,
                    "remaining_quota": await self._get_remaining_quota(
                        user_id, resource_id
                    )
                }
            
            # 2. プレビューアクセス確認
            if allow_preview and resource_type == "pdf":
                preview_access = await self._check_preview_access(
                    user_id, resource_id
                )
                if preview_access:
                    return True, {
                        "access_type": "preview",
                        "is_preview": True,
                        "upgrade_prompt": True
                    }
            
            # 3. アクセス拒否
            return False, {
                "reason": self._determine_denial_reason(reason),
                "message": reason,
                "upgrade_options": await self._get_upgrade_options(user_id)
            }
            
        except Exception as e:
            logger.error(f"アクセス確認エラー: {str(e)}")
            return False, {
                "reason": AccessDeniedReason.SYSTEM_ERROR,
                "message": "システムエラーが発生しました"
            }
    
    async def _check_preview_access(
        self,
        user_id: str,
        resource_id: str
    ) -> bool:
        """プレビューアクセス確認"""
        # Starterプランユーザーはプレビュー可能
        # または初回アクセスユーザー
        # 実際の実装では、データベースでユーザープランを確認
        return True  # 簡易実装
    
    async def _get_remaining_quota(
        self,
        user_id: str,
        resource_id: str
    ) -> Optional[int]:
        """残り利用可能回数取得"""
        # 実装では購入履歴から計算
        return 3  # モック値
    
    def _determine_denial_reason(self, message: str) -> AccessDeniedReason:
        """拒否理由の判定"""
        if "購入が必要" in message:
            return AccessDeniedReason.NO_PAYMENT
        elif "上限" in message:
            return AccessDeniedReason.QUOTA_EXCEEDED
        elif "期限" in message:
            return AccessDeniedReason.EXPIRED
        else:
            return AccessDeniedReason.INVALID_PLAN
    
    async def _get_upgrade_options(self, user_id: str) -> list[Dict[str, Any]]:
        """アップグレードオプション取得"""
        return [
            {
                "type": "one_time",
                "price": 3980,
                "label": "今すぐダウンロード",
                "benefits": ["PDF即時ダウンロード", "24時間有効", "3回まで再ダウンロード可能"]
            },
            {
                "type": "subscription",
                "plan": "growth",
                "price": 9800,
                "label": "Growthプランに加入",
                "benefits": ["無制限ダウンロード", "全機能利用可能", "優先サポート"],
                "special_offer": "初月50%オフ"
            }
        ]
    
    def _create_error_response(
        self,
        message: str,
        status_code: int = 400
    ) -> Dict[str, Any]:
        """エラーレスポンス作成"""
        return {
            "success": False,
            "error": {
                "message": message,
                "code": status_code
            }
        }
    
    def _create_payment_required_response(
        self,
        user_id: str,
        resource_id: str,
        access_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """決済必須レスポンス作成"""
        return {
            "success": False,
            "payment_required": True,
            "error": {
                "code": 402,  # Payment Required
                "message": access_info.get("message", "決済が必要です"),
                "reason": access_info.get("reason", AccessDeniedReason.NO_PAYMENT).value
            },
            "payment_options": {
                "checkout_url": f"/api/billing/checkout?resource={resource_id}",
                "pricing": {
                    "one_time": 3980,
                    "subscription": {
                        "growth": 9800,
                        "scale": 29800
                    }
                },
                "upgrade_options": access_info.get("upgrade_options", [])
            },
            "preview_available": access_info.get("is_preview", False)
        }
    
    def _log_access(
        self,
        user_id: str,
        resource_id: str,
        resource_type: str,
        has_access: bool,
        access_info: Dict[str, Any]
    ):
        """アクセスログ記録"""
        log_entry = {
            "timestamp": datetime.now().isoformat(),
            "user_id": user_id,
            "resource_id": resource_id,
            "resource_type": resource_type,
            "has_access": has_access,
            "access_type": access_info.get("access_type"),
            "denial_reason": access_info.get("reason") if not has_access else None
        }
        
        self.access_log.append(log_entry)
        
        # 実際の実装では、データベースや外部ログサービスに記録
        if not has_access:
            logger.warning(f"アクセス拒否: {log_entry}")
        else:
            logger.info(f"アクセス許可: {log_entry}")


# === 使用例 ===

payment_guard = PaymentGuard()


@payment_guard.require_payment(resource_type="pdf", allow_preview=False)
async def generate_pdf_endpoint(request_context: Dict[str, Any], payment_context: Dict[str, Any]):
    """PDF生成エンドポイント（決済必須）"""
    # payment_contextには決済情報が含まれる
    print(f"アクセスタイプ: {payment_context.get('access_type')}")
    print(f"残り回数: {payment_context.get('remaining_quota')}")
    
    # PDF生成処理
    return {
        "success": True,
        "pdf_url": "/downloads/sample.pdf"
    }


# === テスト用ヘルパー ===

async def test_payment_guard():
    """決済ガードのテスト"""
    # 1. 未決済ユーザー
    result = await generate_pdf_endpoint(
        request_context={
            "user_id": "user_001",
            "resource_id": "pdf_001"
        },
        payment_context={}
    )
    print("未決済ユーザー:", result)
    
    # 2. サブスクユーザー（モック用にBillingServiceに追加が必要）
    billing_service = BillingService()
    # サブスク登録をモック
    from src.services.billing_service import Subscription
    billing_service.subscriptions["sub_001"] = Subscription(
        subscription_id="sub_001",
        user_id="user_002",
        tenant_id="tenant_001",
        plan=PricingPlan.GROWTH
    )
    
    guard_with_sub = PaymentGuard(billing_service)
    
    @guard_with_sub.require_payment()
    async def test_endpoint(request_context, payment_context):
        return {"success": True}
    
    result = await test_endpoint(
        request_context={
            "user_id": "user_002",
            "resource_id": "pdf_002"
        },
        payment_context={}
    )
    print("サブスクユーザー:", result)


if __name__ == "__main__":
    asyncio.run(test_payment_guard())