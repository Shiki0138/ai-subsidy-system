"""
Enhanced Preview Service のテストスクリプト
"""

import asyncio
import json
from datetime import datetime, timedelta
from src.services.enhanced_preview_service import (
    EnhancedPreviewService,
    QualityLevel,
    ValueProposition
)
from src.services.user_experience_optimizer import (
    UserExperienceOptimizer,
    UserContext,
    UserType,
    PurchaseIntent
)


async def test_enhanced_preview():
    """Enhanced Preview Service のテスト"""
    print("🧪 Enhanced Preview Service テスト開始")
    print("=" * 60)
    
    # サービス初期化
    preview_service = EnhancedPreviewService()
    ux_optimizer = UserExperienceOptimizer()
    
    # テストデータ作成
    test_application = {
        "company_info": {
            "company_name": "テックイノベーション株式会社",
            "representative_name": "田中太郎",
            "employee_count": 15,
            "main_business": "AIソリューション開発"
        },
        "project_info": {
            "project_title": "中小企業向けAI営業支援システムの開発・販売事業",
            "total_budget": 8000000,
            "subsidy_amount": 5000000
        },
        "business_plan": """
        弊社は、中小企業の営業活動効率化を支援するAIシステムを開発・販売いたします。
        従来の営業活動では、見込み客の特定や効果的なアプローチ方法の判断に多大な時間を要していました。
        本システムでは、機械学習技術を活用して顧客データを分析し、最適な営業戦略を自動提案することで、
        営業効率を30%向上させることができます。ターゲット市場は年商1億円以下の中小企業約150万社で、
        初年度売上目標は3億円、3年後には15億円の売上を目指します。
        """,
        "financial_plan": {
            "initial_investment": 8000000,
            "year1_revenue": 300000000,
            "year2_revenue": 800000000,
            "year3_revenue": 1500000000,
            "break_even_month": 18
        },
        "implementation_schedule": "2025年7月開発開始、2026年1月リリース、2026年4月本格販売開始"
    }
    
    # ユーザーコンテキスト（初回ユーザー、高い購入意図）
    user_context = UserContext(
        user_id="test_user_001",
        user_type=UserType.FIRST_TIME,
        purchase_intent=PurchaseIntent.HIGH,
        session_time=420,  # 7分
        page_views=5,
        device_type="desktop",
        referrer_source="google_ads"
    )
    
    # 1. Enhanced Preview 生成
    print("1️⃣ スマートプレビュー生成中...")
    smart_preview = await preview_service.generate_smart_preview(
        test_application, 
        user_context.__dict__
    )
    
    print(f"✅ プレビューID: {smart_preview.preview_id}")
    print(f"📊 品質レベル: {smart_preview.quality_level.value}")
    print(f"🎯 総合スコア: {smart_preview.overall_score}点")
    print(f"📈 採択確率: {smart_preview.success_probability*100:.1f}%")
    
    # 2. カテゴリー別スコア表示
    print("\n2️⃣ カテゴリー別品質スコア:")
    for category, score in smart_preview.category_scores.items():
        emoji = "🔥" if score >= 80 else "✅" if score >= 70 else "⚠️"
        print(f"   {emoji} {category}: {score}点")
    
    # 3. 価値訴求の表示
    print("\n3️⃣ 価値訴求メッセージ:")
    vp = smart_preview.value_proposition
    print(f"💰 価格正当化: {vp.price_justification}")
    print("🌟 品質ハイライト:")
    for highlight in vp.quality_highlights:
        print(f"   • {highlight}")
    
    print("🎁 ユーザーメリット:")
    for benefit in vp.user_benefits:
        print(f"   • {benefit}")
    
    # 4. 改善提案の表示
    print("\n4️⃣ 改善提案（優先度順）:")
    for i, suggestion in enumerate(smart_preview.improvement_suggestions, 1):
        priority_emoji = "🔴" if suggestion["priority"] == "high" else "🟡"
        print(f"   {priority_emoji} {i}. {suggestion['title']}")
        print(f"      効果: {suggestion['impact']}, 難易度: {suggestion['effort']}")
        print(f"      {suggestion['description']}")
    
    # 5. UX最適化
    print("\n5️⃣ UX最適化戦略生成中...")
    ux_strategy = await ux_optimizer.optimize_user_experience(
        user_context,
        {
            "overall_score": smart_preview.overall_score,
            "category_scores": smart_preview.category_scores,
            "success_probability": smart_preview.success_probability
        },
        smart_preview.preview_content
    )
    
    print(f"🎯 メインメッセージ: {ux_strategy.primary_message}")
    print("📢 サブメッセージ:")
    for msg in ux_strategy.secondary_messages:
        print(f"   • {msg}")
    
    print(f"⚡ 緊急度: {ux_strategy.urgency_level}")
    print(f"📞 CTA: {ux_strategy.call_to_action}")
    
    # 6. コンバージョン確率予測
    conversion_prob = ux_optimizer.calculate_conversion_probability(
        user_context, ux_strategy
    )
    print(f"\n6️⃣ 予測コンバージョン率: {conversion_prob*100:.1f}%")
    
    # 7. パーソナライズされたメッセージ
    print(f"\n7️⃣ パーソナライズメッセージ:")
    print(f"💬 {smart_preview.personalized_message}")
    
    if smart_preview.purchase_urgency:
        print(f"🔥 {smart_preview.purchase_urgency}")
    
    # 8. ベンチマーク比較
    print(f"\n8️⃣ ベンチマーク比較:")
    benchmark = smart_preview.benchmark_comparison
    print(f"📊 品質ランキング: {benchmark['comparison_text']}")
    print(f"📈 平均との比較: {benchmark['average_comparison']}")
    print(f"🎯 採択率比較: {benchmark['success_rate_vs_average']}")
    
    print("\n" + "=" * 60)
    print("✅ Enhanced Preview Service テスト完了！")
    
    # 9. 実際のプレビューファイル生成確認
    preview_files = list(preview_service.output_dir.glob("*"))
    if preview_files:
        print(f"📁 生成されたプレビューファイル: {len(preview_files)}件")
        for file_path in preview_files[:3]:  # 最初の3件のみ表示
            print(f"   📄 {file_path.name}")


async def test_different_user_types():
    """異なるユーザータイプでのテスト"""
    print("\n🧪 ユーザータイプ別テスト開始")
    print("=" * 60)
    
    ux_optimizer = UserExperienceOptimizer()
    
    # 基本品質データ
    quality_analysis = {
        "overall_score": 78.5,
        "category_scores": {
            "completeness": 85.0,
            "coherence": 78.0,
            "persuasiveness": 82.0,
            "technical_accuracy": 75.0,
            "innovation": 68.0,
            "feasibility": 84.0
        },
        "success_probability": 0.67
    }
    
    user_types = [
        (UserType.FIRST_TIME, PurchaseIntent.HIGH, "初回・高意図"),
        (UserType.RETURNING, PurchaseIntent.MEDIUM, "リピート・中意図"),
        (UserType.FREQUENT, PurchaseIntent.LOW, "頻繁・低意図"),
        (UserType.SUBSCRIBER, PurchaseIntent.EXPLORATION, "サブスク・探索")
    ]
    
    for user_type, intent, description in user_types:
        print(f"\n👤 {description}ユーザーのテスト:")
        
        user_context = UserContext(
            user_id=f"test_{user_type.value}",
            user_type=user_type,
            purchase_intent=intent,
            session_time=300,
            page_views=3,
            previous_scores=[75.2, 82.1] if user_type == UserType.RETURNING else []
        )
        
        strategy = await ux_optimizer.optimize_user_experience(
            user_context, quality_analysis, {}
        )
        
        print(f"   🎯 メインメッセージ: {strategy.primary_message}")
        print(f"   ⚡ 緊急度: {strategy.urgency_level}")
        print(f"   📞 CTA: {strategy.call_to_action}")
        
        conversion_prob = ux_optimizer.calculate_conversion_probability(
            user_context, strategy
        )
        print(f"   📊 予測転換率: {conversion_prob*100:.1f}%")


if __name__ == "__main__":
    async def main():
        await test_enhanced_preview()
        await test_different_user_types()
    
    asyncio.run(main())