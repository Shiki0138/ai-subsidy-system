"""
課金関連APIエンドポイント
決済フローとPDFダウンロードの統合
"""

from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse
import asyncio
import logging

from src.services.billing_service import BillingService, PricingPlan
from src.services.pdf_preview_service import PdfPreviewService
from src.middleware.payment_guard import PaymentGuard

logger = logging.getLogger(__name__)

# Router初期化
router = APIRouter(prefix="/api/billing", tags=["billing"])

# サービス初期化
billing_service = BillingService()
preview_service = PdfPreviewService()
payment_guard = PaymentGuard(billing_service)


# === 決済エンドポイント ===

@router.post("/checkout/pdf")
async def create_pdf_checkout(
    request: Request,
    pdf_id: str,
    plan: str = "pay_per_download",
    promotion_code: Optional[str] = None
) -> Dict[str, Any]:
    """
    PDF購入用チェックアウトセッション作成
    
    Returns:
        {
            "checkout_url": "https://checkout.stripe.com/...",
            "session_id": "cs_xxx",
            "amount": 3980,
            "expires_at": "2025-06-20T15:00:00Z"
        }
    """
    try:
        # ユーザー認証（実際の実装では認証ミドルウェアから取得）
        user_id = request.headers.get("X-User-Id", "demo_user")
        
        # 既に購入済みかチェック
        has_access, reason = await billing_service.check_payment_access(
            user_id=user_id,
            pdf_id=pdf_id
        )
        
        if has_access:
            return JSONResponse({
                "already_purchased": True,
                "message": reason,
                "download_url": f"/api/pdf/{pdf_id}/download"
            })
        
        # プラン変換
        pricing_plan = PricingPlan.PAY_PER_DOWNLOAD
        if plan == "growth":
            pricing_plan = PricingPlan.GROWTH
        elif plan == "scale":
            pricing_plan = PricingPlan.SCALE
        
        # チェックアウトセッション作成
        session = await billing_service.create_checkout_session(
            user_id=user_id,
            product_id="subsidy_pdf",
            pdf_id=pdf_id,
            plan=pricing_plan,
            promotion_code=promotion_code
        )
        
        return {
            "checkout_url": session.checkout_url,
            "session_id": session.session_id,
            "amount": session.amount,
            "currency": session.currency,
            "expires_at": session.expires_at.isoformat()
        }
        
    except Exception as e:
        logger.error(f"チェックアウトエラー: {str(e)}")
        raise HTTPException(status_code=500, detail="決済セッション作成に失敗しました")


@router.get("/checkout/success")
async def checkout_success(
    session_id: str,
    request: Request
) -> RedirectResponse:
    """
    決済成功後のリダイレクト処理
    自動的にPDFダウンロードを開始
    """
    try:
        # セッション確認（実際はStripe APIで確認）
        # ここではモック
        
        # フロントエンドの成功ページにリダイレクト
        # クエリパラメータでセッションIDを渡す
        return RedirectResponse(
            url=f"/download/success?session_id={session_id}",
            status_code=302
        )
        
    except Exception as e:
        logger.error(f"決済成功処理エラー: {str(e)}")
        return RedirectResponse(
            url="/download/error?reason=session_invalid",
            status_code=302
        )


@router.post("/webhook")
async def stripe_webhook(request: Request) -> Dict[str, str]:
    """
    Stripe Webhookエンドポイント
    """
    try:
        # Webhook署名検証（実際の実装）
        # stripe.Webhook.construct_event(
        #     payload, sig_header, webhook_secret
        # )
        
        # イベントデータ取得
        data = await request.json()
        event_type = data.get("type")
        session_id = data.get("data", {}).get("object", {}).get("id")
        
        # Webhook処理
        success = await billing_service.process_webhook(
            event_type=event_type,
            session_id=session_id,
            stripe_data=data
        )
        
        if not success:
            raise HTTPException(status_code=400, detail="Webhook処理失敗")
        
        return {"status": "success"}
        
    except Exception as e:
        logger.error(f"Webhookエラー: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))


# === 価格・プラン関連 ===

@router.get("/pricing")
async def get_pricing(request: Request) -> Dict[str, Any]:
    """
    価格情報取得
    ユーザーの状況に応じた最適価格を返す
    """
    try:
        user_id = request.headers.get("X-User-Id")
        
        # 基本価格情報
        pricing = {
            "pay_per_download": {
                "name": "都度購入",
                "prices": {
                    "single": 3980,
                    "first_time": 1980,  # 初回限定
                    "bulk_3": 9800,
                    "bulk_5": 14800
                },
                "features": [
                    "1申請書PDFダウンロード",
                    "24時間再ダウンロード可能",
                    "最大3回ダウンロード"
                ]
            },
            "growth": {
                "name": "Growthプラン",
                "price": 9800,
                "billing": "monthly",
                "features": [
                    "無制限PDFダウンロード",
                    "全補助金タイプ対応",
                    "優先カスタマーサポート",
                    "申請書アーカイブ",
                    "新機能早期アクセス"
                ]
            },
            "scale": {
                "name": "Scaleプラン",
                "price": 29800,
                "billing": "monthly",
                "features": [
                    "Growthプランの全機能",
                    "API access",
                    "専任カスタマーサクセス",
                    "カスタマイズ相談",
                    "請求書払い対応"
                ]
            }
        }
        
        # ユーザー固有の情報を追加
        if user_id:
            # 初回購入判定
            is_first_purchase = await billing_service._is_first_purchase(user_id)
            if is_first_purchase:
                pricing["special_offer"] = {
                    "type": "first_time_discount",
                    "discount_rate": 0.5,
                    "message": "初回限定50%オフ！"
                }
            
            # 使用履歴から推奨プラン
            # モックデータ
            usage_history = []  # 実際はDBから取得
            recommendation = await billing_service.get_pricing_recommendation(
                user_id, usage_history
            )
            pricing["recommendation"] = recommendation
        
        return pricing
        
    except Exception as e:
        logger.error(f"価格情報取得エラー: {str(e)}")
        raise HTTPException(status_code=500, detail="価格情報の取得に失敗しました")


@router.post("/upgrade")
async def upgrade_plan(
    request: Request,
    target_plan: str,
    billing_period: str = "monthly"
) -> Dict[str, Any]:
    """
    プランアップグレード
    """
    try:
        user_id = request.headers.get("X-User-Id", "demo_user")
        
        # 現在のプラン確認
        current_plan = "starter"  # 実際はDBから取得
        
        if current_plan == target_plan:
            return {
                "error": "既に同じプランに加入しています"
            }
        
        # アップグレード用のチェックアウトセッション作成
        plan_map = {
            "growth": PricingPlan.GROWTH,
            "scale": PricingPlan.SCALE
        }
        
        session = await billing_service.create_checkout_session(
            user_id=user_id,
            product_id=f"subscription_{target_plan}",
            pdf_id="",  # サブスクリプションなのでPDF IDは不要
            plan=plan_map.get(target_plan, PricingPlan.GROWTH)
        )
        
        return {
            "checkout_url": session.checkout_url,
            "session_id": session.session_id,
            "upgrade_benefits": [
                "即座に全機能が利用可能",
                "日割り計算で公平な料金",
                "いつでもダウングレード可能"
            ]
        }
        
    except Exception as e:
        logger.error(f"アップグレードエラー: {str(e)}")
        raise HTTPException(status_code=500, detail="プランアップグレードに失敗しました")


# === アクセス確認 ===

@router.get("/access/{pdf_id}")
async def check_access(
    pdf_id: str,
    request: Request
) -> Dict[str, Any]:
    """
    PDFアクセス権確認
    フロントエンドでのUI制御用
    """
    try:
        user_id = request.headers.get("X-User-Id", "demo_user")
        
        has_access, reason = await billing_service.check_payment_access(
            user_id=user_id,
            pdf_id=pdf_id
        )
        
        response = {
            "has_access": has_access,
            "access_type": reason if has_access else None,
            "requires_payment": not has_access
        }
        
        # アクセスがない場合、購入オプションを追加
        if not has_access:
            response["purchase_options"] = {
                "one_time": {
                    "price": 3980,
                    "checkout_url": f"/api/billing/checkout/pdf?pdf_id={pdf_id}"
                },
                "subscription": {
                    "monthly_price": 9800,
                    "upgrade_url": "/api/billing/upgrade?target_plan=growth"
                }
            }
        
        return response
        
    except Exception as e:
        logger.error(f"アクセス確認エラー: {str(e)}")
        raise HTTPException(status_code=500, detail="アクセス確認に失敗しました")


# === 使用履歴・請求 ===

@router.get("/usage")
async def get_usage_history(
    request: Request,
    limit: int = 10,
    offset: int = 0
) -> Dict[str, Any]:
    """
    使用履歴取得
    """
    try:
        user_id = request.headers.get("X-User-Id", "demo_user")
        
        # モックデータ（実際はDBから取得）
        usage_history = [
            {
                "date": "2025-06-15T10:30:00Z",
                "type": "pdf_download",
                "description": "持続化補助金申請書",
                "amount": 3980,
                "status": "completed"
            },
            {
                "date": "2025-06-10T14:20:00Z",
                "type": "pdf_download",
                "description": "ものづくり補助金申請書",
                "amount": 1980,
                "status": "completed",
                "note": "初回限定価格"
            }
        ]
        
        return {
            "total": len(usage_history),
            "items": usage_history[offset:offset+limit],
            "summary": {
                "total_spent": sum(item["amount"] for item in usage_history),
                "download_count": len(usage_history),
                "active_subscription": None  # または現在のプラン情報
            }
        }
        
    except Exception as e:
        logger.error(f"使用履歴取得エラー: {str(e)}")
        raise HTTPException(status_code=500, detail="使用履歴の取得に失敗しました")


# === プレビュー関連 ===

@router.get("/preview/{pdf_id}")
async def get_pdf_preview(
    pdf_id: str,
    request: Request
) -> Dict[str, Any]:
    """
    PDFプレビュー取得
    購入前の品質確認用
    """
    try:
        user_id = request.headers.get("X-User-Id", "demo_user")
        
        # プレビュー生成（実際はキャッシュから取得）
        preview = await preview_service.generate_preview(
            application_id=pdf_id,
            document_type="subsidy_application",
            full_content={
                "basic_info": {
                    "company_name": "サンプル株式会社",
                    "project_title": "DX推進による生産性向上事業"
                },
                "business_plan": "事業計画の詳細...",
                "financial_plan": "財務計画の詳細...",
                "implementation_schedule": "実施スケジュール..."
            }
        )
        
        return {
            "preview_url": preview["preview_url"],
            "quality_indicators": preview["quality_indicators"],
            "purchase_prompt": {
                "message": "完全版をダウンロードして申請準備を完了させましょう",
                "cta_text": "PDFを購入（¥3,980）",
                "benefits": [
                    "編集可能なPDFファイル",
                    "申請に必要な全ページ収録",
                    "24時間ダウンロード可能"
                ]
            }
        }
        
    except Exception as e:
        logger.error(f"プレビュー取得エラー: {str(e)}")
        raise HTTPException(status_code=500, detail="プレビューの生成に失敗しました")


# === テスト用エンドポイント ===

@router.get("/test/reset")
async def reset_test_data(request: Request) -> Dict[str, str]:
    """テストデータリセット（開発環境のみ）"""
    # 実際の実装では環境変数で制御
    billing_service.payment_sessions.clear()
    billing_service.usage_purchases.clear()
    billing_service.subscriptions.clear()
    
    return {"status": "reset completed"}