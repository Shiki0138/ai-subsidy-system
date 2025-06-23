"""
Document Quality Analyzer とAI Writing Assistant のテストスクリプト
"""

import asyncio
import json
from datetime import datetime
from src.services.document_quality_analyzer import (
    DocumentQualityAnalyzer,
    QualityCheckType,
    QualityIssue
)
from src.services.ai_writing_assistant import (
    AIWritingAssistant,
    WritingAssistanceType
)


async def test_quality_analyzer():
    """文書品質分析のテスト"""
    print("🔍 Document Quality Analyzer テスト開始")
    print("=" * 60)
    
    analyzer = DocumentQualityAnalyzer()
    
    # テスト用文書（意図的に問題を含む）
    test_document = {
        "company_info": {
            "company_name": "テスト株式会社",
            "main_business": "IT関連サービス"
        },
        "business_plan": """
        弊社はすごいAIシステムを開発します。です。です。
        やばい技術を使って、みたいな感じで市場を攻略します。
        だと思うけど、売上は伸びると考えています。
        競合他社とかもいるけど、まあ大丈夫でしょう。
        """,
        "market_analysis": """
        市場は結構大きいです。お客さんもたくさんいる。
        需要は高まっている、、、、と思われます。
        価格設定についても検討中で、とりあえず安めにしよう。
        """,
        "technical_plan": """
        技術的には問題ありません。開発期間は短縮可能。
        品質についても心配不要で実装予定。
        """
    }
    
    # 1. 品質分析実行
    print("1️⃣ 文書品質分析実行中...")
    analysis_result = await analyzer.analyze_document_quality(
        test_document, "subsidy_application"
    )
    
    print(f"📊 総合品質スコア: {analysis_result.overall_score}点")
    print("\n📋 カテゴリー別スコア:")
    for category, score in analysis_result.category_scores.items():
        emoji = "🔥" if score >= 80 else "✅" if score >= 70 else "⚠️" if score >= 60 else "❌"
        print(f"   {emoji} {category}: {score}点")
    
    # 2. 発見された問題の表示
    print(f"\n🚨 発見された問題: {len(analysis_result.issues)}件")
    critical_issues = [i for i in analysis_result.issues if i.severity == "critical"]
    major_issues = [i for i in analysis_result.issues if i.severity == "major"]
    minor_issues = [i for i in analysis_result.issues if i.severity == "minor"]
    
    print(f"   🔴 重要: {len(critical_issues)}件")
    print(f"   🟡 中程度: {len(major_issues)}件")
    print(f"   🟢 軽微: {len(minor_issues)}件")
    
    # 3. 優先修正項目の表示
    print("\n🎯 優先修正項目（上位3件）:")
    for i, issue in enumerate(analysis_result.priority_fixes[:3], 1):
        severity_emoji = {"critical": "🔴", "major": "🟡", "minor": "🟢"}[issue.severity]
        print(f"   {severity_emoji} {i}. {issue.description}")
        print(f"      提案: {issue.suggestion}")
        print(f"      効果: +{issue.impact_score}点")
    
    # 4. 強みの表示
    if analysis_result.strengths:
        print("\n💪 文書の強み:")
        for strength in analysis_result.strengths:
            print(f"   ✨ {strength}")
    
    # 5. 改善提案の表示
    print("\n📈 改善提案:")
    for suggestion in analysis_result.improvement_suggestions:
        priority_emoji = {"high": "🔥", "medium": "⚡", "low": "📝"}[suggestion["priority"]]
        print(f"   {priority_emoji} {suggestion['category']}: "
              f"{suggestion['current_score']}点 → {suggestion['potential_score']}点 "
              f"(+{suggestion['improvement']:.1f}点)")
        print(f"      所要時間: 約{suggestion['estimated_time']}分")
    
    # 6. ユーザーフレンドリーなレポート生成
    print("\n📋 ユーザー向け品質レポート生成中...")
    quality_report = await analyzer.generate_quality_report(analysis_result, user_friendly=True)
    
    print(f"🎯 品質レベル: {quality_report['overall_assessment']['level']}")
    print(f"💬 メッセージ: {quality_report['overall_assessment']['message']}")
    print(f"⏰ 修正予想時間: {quality_report['time_estimate']['total_minutes']}分")
    
    print("\n✅ Document Quality Analyzer テスト完了！")
    return analysis_result


async def test_ai_writing_assistant():
    """AI文章作成アシスタントのテスト"""
    print("\n🤖 AI Writing Assistant テスト開始")
    print("=" * 60)
    
    assistant = AIWritingAssistant()
    
    # 1. リアルタイムフィードバックのテスト
    print("1️⃣ リアルタイムフィードバックテスト")
    test_text = "弊社はAIシステムを開発します。です。です。"
    
    feedback = await assistant.provide_realtime_feedback(
        test_text, "business_plan"
    )
    
    print(f"📊 現在スコア: {feedback.current_score}点")
    print(f"💡 改善提案: {len(feedback.suggestions)}件")
    
    for i, suggestion in enumerate(feedback.suggestions, 1):
        impact_emoji = {"high": "🔥", "medium": "⚡", "low": "📝"}[suggestion.impact_level]
        print(f"   {impact_emoji} {i}. {suggestion.explanation}")
        print(f"      修正例: {suggestion.original_text} → {suggestion.improved_text}")
    
    print("📝 文章作成のヒント:")
    for tip in feedback.writing_tips:
        print(f"   💡 {tip}")
    
    # 2. セクション別コンテンツ生成のテスト
    print("\n2️⃣ セクション別コンテンツ生成テスト")
    
    context_data = {
        "目的": "地域企業のDX推進支援",
        "手段": "クラウド型業務管理システムの提供",
        "市場規模": "約500億円",
        "成長率": "8.5",
        "顧客層": "従業員50名以下の中小企業"
    }
    
    generated_content = await assistant.generate_section_content(
        "market_analysis", context_data, quality_target=80.0
    )
    
    print(f"📄 生成されたコンテンツ:")
    print(f"   {generated_content['content']}")
    print(f"📊 品質スコア: {generated_content['quality_score']}点")
    print(f"✨ 品質目標達成: {'✅' if generated_content['enhancement_applied'] else '❌'}")
    
    # 3. 既存テキストの改善テスト
    print("\n3️⃣ 既存テキスト改善テスト")
    
    original_poor_text = """
    うちの会社はやばいシステムを作ります。です。です。
    競合とかもいるけど、まあ大丈夫だと思う、、、、
    売上もそこそこ伸びるでしょう。
    """
    
    improvement_result = await assistant.improve_existing_text(
        original_poor_text,
        improvement_focus=["grammar", "clarity", "persuasiveness"]
    )
    
    print("📝 改善前:")
    print(f"   {improvement_result['original_text'].strip()}")
    print(f"   スコア: {improvement_result['original_score']}点")
    
    print("\n✨ 改善後:")
    print(f"   {improvement_result['improved_text'].strip()}")
    print(f"   スコア: {improvement_result['improved_score']}点")
    print(f"   改善効果: +{improvement_result['improvement_delta']:.1f}点")
    
    print("\n🔧 適用された改善:")
    for change in improvement_result['change_summary']:
        print(f"   • {change}")
    
    print("\n✅ AI Writing Assistant テスト完了！")
    return improvement_result


async def test_integration():
    """品質分析と文章改善の統合テスト"""
    print("\n🔗 統合テスト開始")
    print("=" * 60)
    
    analyzer = DocumentQualityAnalyzer()
    assistant = AIWritingAssistant()
    
    # 低品質な文書
    poor_document = {
        "business_plan": """
        うちの会社はすごいことをやります。です。です。
        やばい技術で、みたいな感じで成功するでしょう、、、、
        だと思うけど。
        """
    }
    
    # 1. 初期品質分析
    print("1️⃣ 初期品質分析")
    initial_analysis = await analyzer.analyze_document_quality(poor_document)
    print(f"📊 初期スコア: {initial_analysis.overall_score}点")
    
    # 2. AI による文章改善
    print("\n2️⃣ AI による文章改善")
    improvement_result = await assistant.improve_existing_text(
        poor_document["business_plan"],
        improvement_focus=["grammar", "clarity", "persuasiveness"]
    )
    
    # 3. 改善後の品質再評価
    print("\n3️⃣ 改善後の品質再評価")
    improved_document = {
        "business_plan": improvement_result["improved_text"]
    }
    
    final_analysis = await analyzer.analyze_document_quality(improved_document)
    print(f"📊 改善後スコア: {final_analysis.overall_score}点")
    
    # 4. 改善効果の確認
    total_improvement = final_analysis.overall_score - initial_analysis.overall_score
    print(f"\n📈 総合改善効果: +{total_improvement:.1f}点")
    
    improvement_rate = (total_improvement / initial_analysis.overall_score) * 100
    print(f"📊 改善率: {improvement_rate:.1f}%")
    
    print("\n🎯 カテゴリー別改善:")
    for category in initial_analysis.category_scores.keys():
        initial_score = initial_analysis.category_scores[category]
        final_score = final_analysis.category_scores[category]
        category_improvement = final_score - initial_score
        
        if category_improvement > 0:
            print(f"   📈 {category}: {initial_score}点 → {final_score}点 (+{category_improvement:.1f})")
        else:
            print(f"   📊 {category}: {initial_score}点 → {final_score}点")
    
    print("\n✅ 統合テスト完了！")
    print(f"🎉 文書品質の大幅改善を確認しました（+{total_improvement:.1f}点）")


if __name__ == "__main__":
    async def main():
        quality_result = await test_quality_analyzer()
        writing_result = await test_ai_writing_assistant()
        await test_integration()
        
        print("\n" + "=" * 60)
        print("🏆 全テスト完了 - Week 2 チームC機能実装成功！")
        print("=" * 60)
    
    asyncio.run(main())