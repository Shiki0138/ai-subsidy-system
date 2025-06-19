"""
申請書作成機能統合テスト
ワークフロー全体と個別コンポーネントのテスト
"""

import pytest
import asyncio
import json
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass

# テスト対象のインポート
from src.workflows.application_workflow import (
    ApplicationWorkflow, WorkflowConfiguration, WorkflowStage, WorkflowStatus
)
from src.services.application_writer import (
    ApplicationSection, WritingStyle, ApplicationDocument, GeneratedSection
)
from src.services.document_proofreader import (
    DocumentProofreader, StyleGuide, ProofreadingResult, IssueType, Severity
)
from src.templates.application_template_manager import (
    ApplicationTemplateManager, ApplicationTemplate, TemplateCategory
)


class TestApplicationCreationWorkflow:
    """申請書作成ワークフローテスト"""
    
    @pytest.fixture
    def sample_company_profile(self):
        """サンプル企業プロファイル"""
        return {
            "name": "テスト株式会社",
            "industry": "IT・ソフトウェア",
            "employee_count": 50,
            "founded_year": 2020,
            "description": "AI技術を活用したソリューション開発企業",
            "revenue": 500000000,
            "strengths": ["AI技術", "クラウド開発", "データ分析"],
            "certifications": ["ISO27001", "プライバシーマーク"]
        }
    
    @pytest.fixture
    def sample_project_info(self):
        """サンプルプロジェクト情報"""
        return {
            "title": "AI活用業務効率化システム開発",
            "description": "機械学習とRPAを活用した業務プロセス自動化システムの開発",
            "objectives": [
                "業務効率30%向上",
                "コスト削減20%達成", 
                "作業時間50%短縮"
            ],
            "timeline": "12ヶ月",
            "budget": 5000000,
            "team_size": 8,
            "innovation_level": "high",
            "technical_complexity": "medium",
            "market_focus": "domestic"
        }
    
    @pytest.fixture
    def workflow_configuration(self):
        """ワークフロー設定"""
        return WorkflowConfiguration(
            auto_template_selection=True,
            auto_proofreading=True,
            quality_threshold=75.0,
            writing_style=WritingStyle.FORMAL_BUSINESS,
            enable_quality_checks=True,
            enable_consistency_checks=True,
            enable_adoption_prediction=True,
            max_iterations=2,
            parallel_processing=True
        )
    
    @pytest.fixture
    async def workflow_instance(self):
        """ワークフローインスタンス"""
        return ApplicationWorkflow()
    
    @pytest.mark.asyncio
    async def test_complete_workflow_execution(
        self,
        workflow_instance,
        sample_company_profile,
        sample_project_info,
        workflow_configuration
    ):
        """完全ワークフロー実行テスト"""
        print("\n🚀 完全ワークフロー実行テスト開始")
        
        try:
            # ワークフロー実行
            workflow_id, result = await workflow_instance.create_application(
                company_profile=sample_company_profile,
                project_info=sample_project_info,
                subsidy_type="IT導入補助金",
                configuration=workflow_configuration
            )
            
            # 基本結果検証
            assert workflow_id is not None
            assert result is not None
            assert result.workflow_id == workflow_id
            print(f"  ✅ ワークフローID: {workflow_id}")
            print(f"  ✅ 実行成功: {result.success}")
            
            # 進行状況検証
            progress = await workflow_instance.get_workflow_progress(workflow_id)
            assert progress is not None
            assert progress.current_stage == WorkflowStage.COMPLETED
            assert progress.status == WorkflowStatus.COMPLETED
            assert progress.progress_percentage == 100.0
            print(f"  ✅ 進行状況: {progress.progress_percentage}% 完了")
            
            # 生成文書検証
            if result.success and result.final_document:
                document = result.final_document
                assert isinstance(document, ApplicationDocument)
                assert len(document.sections) > 0
                assert document.total_word_count > 0
                print(f"  ✅ 生成セクション数: {len(document.sections)}")
                print(f"  ✅ 総文字数: {document.total_word_count}")
                
                # 各セクションの検証
                for section, generated_section in document.sections.items():
                    assert isinstance(generated_section, GeneratedSection)
                    assert len(generated_section.content) > 0
                    assert generated_section.quality_score >= 0
                    print(f"    - {section.value}: {generated_section.word_count}文字, 品質{generated_section.quality_score:.1f}")
            
            # 品質スコア検証
            if result.quality_scores:
                overall_quality = result.quality_scores.get("overall_score", 0)
                assert overall_quality >= 0
                assert overall_quality <= 100
                print(f"  ✅ 全体品質スコア: {overall_quality:.1f}")
            
            # 採択可能性検証
            if result.adoption_probability is not None:
                assert 0 <= result.adoption_probability <= 1
                print(f"  ✅ 採択可能性: {result.adoption_probability:.3f}")
            
            # 処理時間・コスト検証
            assert result.processing_time > 0
            assert isinstance(result.cost_breakdown, dict)
            print(f"  ✅ 処理時間: {result.processing_time:.2f}秒")
            print(f"  ✅ 総コスト: ${result.cost_breakdown.get('total', 0):.3f}")
            
            print("🎉 完全ワークフロー実行テスト完了")
            
        except Exception as e:
            print(f"❌ ワークフローテストエラー: {str(e)}")
            pytest.fail(f"ワークフロー実行エラー: {str(e)}")
    
    @pytest.mark.asyncio
    async def test_workflow_progress_tracking(
        self,
        workflow_instance,
        sample_company_profile,
        sample_project_info
    ):
        """ワークフロー進行状況追跡テスト"""
        print("\n📊 進行状況追跡テスト開始")
        
        # 非同期でワークフロー開始
        task = asyncio.create_task(
            workflow_instance.create_application(
                company_profile=sample_company_profile,
                project_info=sample_project_info,
                subsidy_type="ものづくり補助金"
            )
        )
        
        # 進行状況を複数回チェック
        await asyncio.sleep(0.1)  # 少し待機
        
        # ワークフローが開始されているかチェック
        active_workflows = workflow_instance.active_workflows
        assert len(active_workflows) > 0
        
        workflow_id = list(active_workflows.keys())[0]
        progress = await workflow_instance.get_workflow_progress(workflow_id)
        
        assert progress is not None
        assert progress.workflow_id == workflow_id
        assert progress.status in [WorkflowStatus.RUNNING, WorkflowStatus.COMPLETED]
        print(f"  ✅ 進行状況追跡: {progress.current_stage.value}, {progress.progress_percentage}%")
        
        # ワークフロー完了を待機
        workflow_id, result = await task
        
        # 最終状態確認
        final_progress = await workflow_instance.get_workflow_progress(workflow_id)
        assert final_progress.status == WorkflowStatus.COMPLETED
        assert final_progress.progress_percentage == 100.0
        
        print("📊 進行状況追跡テスト完了")
    
    @pytest.mark.asyncio
    async def test_workflow_error_handling(self, workflow_instance):
        """ワークフローエラーハンドリングテスト"""
        print("\n🛡️ エラーハンドリングテスト開始")
        
        # 不正なデータでワークフロー実行
        invalid_company_profile = {}  # 必須フィールドなし
        invalid_project_info = {}     # 必須フィールドなし
        
        workflow_id, result = await workflow_instance.create_application(
            company_profile=invalid_company_profile,
            project_info=invalid_project_info,
            subsidy_type=""  # 空の補助金タイプ
        )
        
        # エラー結果の検証
        assert workflow_id is not None
        assert result is not None
        
        # 進行状況でエラー確認
        progress = await workflow_instance.get_workflow_progress(workflow_id)
        if progress:
            # エラーが記録されているかチェック
            has_errors = len(progress.errors) > 0 or progress.status == WorkflowStatus.FAILED
            print(f"  ✅ エラー検出: {has_errors}")
            if progress.errors:
                print(f"  ✅ エラー内容: {progress.errors[0]}")
        
        print("🛡️ エラーハンドリングテスト完了")
    
    @pytest.mark.asyncio
    async def test_workflow_cancellation(
        self,
        workflow_instance,
        sample_company_profile,
        sample_project_info
    ):
        """ワークフローキャンセルテスト"""
        print("\n🚫 ワークフローキャンセルテスト開始")
        
        # 長時間のワークフローを開始（モック）
        task = asyncio.create_task(
            workflow_instance.create_application(
                company_profile=sample_company_profile,
                project_info=sample_project_info,
                subsidy_type="小規模事業者持続化補助金"
            )
        )
        
        await asyncio.sleep(0.1)  # 少し待機
        
        # アクティブなワークフローIDを取得
        active_workflows = workflow_instance.active_workflows
        if active_workflows:
            workflow_id = list(active_workflows.keys())[0]
            
            # キャンセル実行
            cancel_result = await workflow_instance.cancel_workflow(workflow_id)
            assert cancel_result is True
            
            # キャンセル状態確認
            progress = await workflow_instance.get_workflow_progress(workflow_id)
            if progress:
                assert progress.status == WorkflowStatus.CANCELLED
                print(f"  ✅ ワークフローキャンセル成功: {workflow_id}")
        
        # タスクの処理完了を待機
        try:
            await task
        except:
            pass  # キャンセルされたタスクのエラーは無視
        
        print("🚫 ワークフローキャンセルテスト完了")


class TestApplicationWriter:
    """申請書ライターテスト"""
    
    @pytest.fixture
    def application_writer(self):
        """申請書ライターインスタンス"""
        from src.services.application_writer import ApplicationWriter
        return ApplicationWriter()
    
    @pytest.mark.asyncio
    async def test_section_generation(self, application_writer):
        """セクション生成テスト"""
        print("\n📝 セクション生成テスト開始")
        
        company_profile = {
            "name": "テクノロジー株式会社",
            "industry": "IT",
            "employee_count": 100
        }
        
        project_info = {
            "title": "次世代AIシステム開発",
            "description": "自然言語処理を活用したAIアシスタント開発"
        }
        
        # 企業概要セクション生成
        company_section = await application_writer.generate_section(
            section_type=ApplicationSection.COMPANY_OVERVIEW,
            company_profile=company_profile,
            project_info=project_info,
            subsidy_type="IT導入補助金"
        )
        
        assert company_section is not None
        assert len(company_section.content) > 0
        assert company_section.word_count > 0
        assert company_section.quality_score >= 0
        print(f"  ✅ 企業概要生成: {company_section.word_count}文字, 品質{company_section.quality_score:.1f}")
        
        # プロジェクト概要セクション生成
        project_section = await application_writer.generate_section(
            section_type=ApplicationSection.PROJECT_SUMMARY,
            company_profile=company_profile,
            project_info=project_info,
            subsidy_type="IT導入補助金"
        )
        
        assert project_section is not None
        assert len(project_section.content) > 0
        print(f"  ✅ プロジェクト概要生成: {project_section.word_count}文字")
        
        print("📝 セクション生成テスト完了")
    
    @pytest.mark.asyncio
    async def test_complete_application_generation(self, application_writer):
        """完全申請書生成テスト"""
        print("\n📄 完全申請書生成テスト開始")
        
        company_profile = {
            "name": "イノベーション株式会社",
            "industry": "製造業",
            "employee_count": 150,
            "description": "先端技術を活用した製造業DX企業"
        }
        
        project_info = {
            "title": "スマートファクトリー構築プロジェクト",
            "description": "IoTとAIを活用した次世代製造システム",
            "objectives": ["生産性向上", "品質改善", "コスト削減"]
        }
        
        # 完全申請書生成
        document = await application_writer.generate_complete_application(
            company_profile=company_profile,
            project_info=project_info,
            subsidy_type="ものづくり補助金",
            target_sections=[
                ApplicationSection.COMPANY_OVERVIEW,
                ApplicationSection.PROJECT_SUMMARY,
                ApplicationSection.PROJECT_DESCRIPTION,
                ApplicationSection.EXPECTED_OUTCOMES
            ]
        )
        
        # 生成結果検証
        assert isinstance(document, ApplicationDocument)
        assert len(document.sections) == 4
        assert document.total_word_count > 0
        assert document.overall_quality >= 0
        
        print(f"  ✅ セクション数: {len(document.sections)}")
        print(f"  ✅ 総文字数: {document.total_word_count}")
        print(f"  ✅ 全体品質: {document.overall_quality:.1f}")
        
        # 各セクション詳細確認
        for section, generated_section in document.sections.items():
            print(f"    - {section.value}: {generated_section.word_count}文字")
        
        print("📄 完全申請書生成テスト完了")


class TestDocumentProofreader:
    """文書校正機能テスト"""
    
    @pytest.fixture
    def document_proofreader(self):
        """文書校正インスタンス"""
        return DocumentProofreader()
    
    @pytest.fixture
    def sample_document(self):
        """サンプル文書"""
        from src.services.application_writer import GeneratedSection
        
        sections = {
            ApplicationSection.COMPANY_OVERVIEW: GeneratedSection(
                section=ApplicationSection.COMPANY_OVERVIEW,
                title="企業概要",
                content="弊社は2020年に設立されたIT企業です。AIと機械学習の技術を活用してお客様のビジネス課題を解決しています。",
                word_count=50,
                quality_score=75.0,
                compliance_score=80.0,
                improvement_suggestions=[],
                metadata={},
                generated_at=datetime.now()
            )
        }
        
        return ApplicationDocument(
            document_id="test_doc_001",
            subsidy_type="IT導入補助金",
            company_profile={},
            sections=sections,
            overall_quality=75.0,
            consistency_score=80.0,
            total_word_count=50,
            completion_rate=100.0,
            created_at=datetime.now(),
            updated_at=datetime.now()
        )
    
    @pytest.mark.asyncio
    async def test_text_proofreading(self, document_proofreader):
        """テキスト校正テスト"""
        print("\n✏️ テキスト校正テスト開始")
        
        # 校正対象テキスト（意図的な問題を含む）
        test_text = """
        弊社は2020年に設立されたIT企業です。AIと機械学習の技術を活用して、
        お客様のビジネス課題を解決する事を目指しています。
        弊社の強みは、やばい技術力と、すごい開発チームです。
        """
        
        # 校正実行
        issues = await document_proofreader.proofread_text(
            text=test_text,
            section_type=ApplicationSection.COMPANY_OVERVIEW
        )
        
        # 結果検証
        assert isinstance(issues, list)
        print(f"  ✅ 検出された問題数: {len(issues)}")
        
        # 問題詳細確認
        for issue in issues[:3]:  # 上位3件
            print(f"    - {issue.issue_type.value}: {issue.original_text} → {issue.suggested_text}")
            print(f"      説明: {issue.explanation}")
            assert issue.severity in [Severity.CRITICAL, Severity.HIGH, Severity.MEDIUM, Severity.LOW, Severity.SUGGESTION]
        
        print("✏️ テキスト校正テスト完了")
    
    @pytest.mark.asyncio
    async def test_document_proofreading(self, document_proofreader, sample_document):
        """文書校正テスト"""
        print("\n📋 文書校正テスト開始")
        
        # 文体ガイド設定
        style_guide = StyleGuide(
            tone="formal",
            honorific_level="respectful"
        )
        
        # 文書校正実行
        result = await document_proofreader.proofread_document(
            document=sample_document,
            style_guide=style_guide,
            auto_fix=True
        )
        
        # 結果検証
        assert isinstance(result, ProofreadingResult)
        assert result.document_id == sample_document.document_id
        assert result.total_issues >= 0
        assert 0 <= result.overall_quality_score <= 100
        assert 0 <= result.readability_score <= 100
        
        print(f"  ✅ 総問題数: {result.total_issues}")
        print(f"  ✅ 品質スコア: {result.overall_quality_score:.1f}")
        print(f"  ✅ 可読性スコア: {result.readability_score:.1f}")
        print(f"  ✅ 処理時間: {result.processing_time:.2f}秒")
        
        # 改善提案確認
        if result.suggestions:
            print(f"  ✅ 改善提案数: {len(result.suggestions)}")
            for suggestion in result.suggestions[:2]:
                print(f"    - {suggestion}")
        
        print("📋 文書校正テスト完了")


class TestTemplateManager:
    """テンプレート管理テスト"""
    
    @pytest.fixture
    def template_manager(self):
        """テンプレート管理インスタンス"""
        return ApplicationTemplateManager()
    
    @pytest.mark.asyncio
    async def test_template_recommendation(self, template_manager):
        """テンプレート推奨テスト"""
        print("\n🎯 テンプレート推奨テスト開始")
        
        company_profile = {
            "name": "デジタル株式会社",
            "industry": "IT",
            "employee_count": 80
        }
        
        project_info = {
            "title": "クラウドシステム導入",
            "innovation_level": "medium"
        }
        
        # 推奨テンプレート取得
        recommended_templates = await template_manager.get_recommended_templates(
            subsidy_type="IT導入補助金",
            company_profile=company_profile,
            project_info=project_info,
            limit=3
        )
        
        # 結果検証
        assert isinstance(recommended_templates, list)
        print(f"  ✅ 推奨テンプレート数: {len(recommended_templates)}")
        
        for i, template in enumerate(recommended_templates[:2]):
            assert isinstance(template, ApplicationTemplate)
            print(f"    {i+1}. {template.name} (カテゴリ: {template.category.value})")
            print(f"       成功率: {template.success_rate:.3f}, 使用回数: {template.usage_count}")
        
        print("🎯 テンプレート推奨テスト完了")
    
    @pytest.mark.asyncio
    async def test_template_customization(self, template_manager):
        """テンプレートカスタマイズテスト"""
        print("\n🎨 テンプレートカスタマイズテスト開始")
        
        # まず推奨テンプレートを取得
        company_profile = {
            "name": "カスタム株式会社",
            "industry": "製造業",
            "employee_count": 200
        }
        
        project_info = {
            "title": "自動化システム導入",
            "technical_complexity": "high"
        }
        
        recommended_templates = await template_manager.get_recommended_templates(
            subsidy_type="ものづくり補助金",
            company_profile=company_profile,
            project_info=project_info,
            limit=1
        )
        
        if recommended_templates:
            base_template = recommended_templates[0]
            
            # テンプレートカスタマイズ
            customization = await template_manager.customize_template(
                base_template_id=base_template.template_id,
                company_profile=company_profile,
                project_info=project_info
            )
            
            # 結果検証
            assert customization is not None
            assert customization.base_template_id == base_template.template_id
            assert len(customization.customized_sections) > 0
            
            print(f"  ✅ ベーステンプレート: {base_template.name}")
            print(f"  ✅ カスタマイズID: {customization.customization_id}")
            print(f"  ✅ カスタマイズセクション数: {len(customization.customized_sections)}")
        
        print("🎨 テンプレートカスタマイズテスト完了")


# メイン実行・統合テスト
@pytest.mark.asyncio
async def test_integration_full_workflow():
    """統合テスト：完全ワークフロー"""
    print("\n" + "="*60)
    print("🔄 統合テスト：完全ワークフローテスト開始")
    print("="*60)
    
    try:
        # 1. ワークフローインスタンス作成
        workflow = ApplicationWorkflow()
        
        # 2. 総合的な企業・プロジェクトデータ
        company_profile = {
            "name": "統合テスト株式会社",
            "industry": "IT・ソフトウェア",
            "employee_count": 120,
            "founded_year": 2018,
            "description": "AI・IoT技術を活用したスマートシティソリューション企業",
            "revenue": 800000000,
            "strengths": ["AI技術", "IoTプラットフォーム", "データ分析", "システム統合"],
            "certifications": ["ISO27001", "プライバシーマーク", "ISMS"],
            "achievements": [
                "経済産業省DX認定企業",
                "AI技術特許3件取得",
                "スマートシティ実証実験参加"
            ]
        }
        
        project_info = {
            "title": "AI・IoT統合スマートシティプラットフォーム開発",
            "description": "都市インフラとAI技術を統合した次世代スマートシティ基盤システム開発",
            "objectives": [
                "都市エネルギー効率30%向上",
                "交通渋滞50%削減",
                "住民サービス満足度80%以上達成",
                "運営コスト40%削減"
            ],
            "timeline": "18ヶ月",
            "budget": 15000000,
            "team_size": 15,
            "innovation_level": "high",
            "technical_complexity": "advanced",
            "market_focus": "national",
            "technologies": ["AI", "IoT", "5G", "エッジコンピューティング", "ブロックチェーン"],
            "target_users": ["自治体", "都市計画事業者", "インフラ事業者"]
        }
        
        # 3. 高品質ワークフロー設定
        configuration = WorkflowConfiguration(
            auto_template_selection=True,
            auto_proofreading=True,
            quality_threshold=80.0,
            writing_style=WritingStyle.FORMAL_BUSINESS,
            enable_quality_checks=True,
            enable_consistency_checks=True,
            enable_adoption_prediction=True,
            target_sections=[
                ApplicationSection.COMPANY_OVERVIEW,
                ApplicationSection.PROJECT_SUMMARY,
                ApplicationSection.CURRENT_SITUATION,
                ApplicationSection.PROJECT_DESCRIPTION,
                ApplicationSection.INNOVATION_TECHNOLOGY,
                ApplicationSection.MARKET_ANALYSIS,
                ApplicationSection.IMPLEMENTATION_PLAN,
                ApplicationSection.EXPECTED_OUTCOMES,
                ApplicationSection.RISK_MANAGEMENT
            ],
            max_iterations=3,
            parallel_processing=True,
            save_intermediate_results=True
        )
        
        # 4. 完全ワークフロー実行
        print("🚀 高度なワークフロー実行開始...")
        start_time = datetime.now()
        
        workflow_id, result = await workflow.create_application(
            company_profile=company_profile,
            project_info=project_info,
            subsidy_type="IT導入補助金（デジタル化基盤導入枠）",
            configuration=configuration
        )
        
        execution_time = (datetime.now() - start_time).total_seconds()
        
        # 5. 総合結果検証
        print(f"\n📊 実行結果:")
        print(f"  - ワークフローID: {workflow_id}")
        print(f"  - 実行成功: {result.success}")
        print(f"  - 実行時間: {execution_time:.2f}秒")
        print(f"  - 処理時間: {result.processing_time:.2f}秒")
        
        if result.success and result.final_document:
            doc = result.final_document
            print(f"  - 生成セクション数: {len(doc.sections)}")
            print(f"  - 総文字数: {doc.total_word_count}")
            print(f"  - 全体品質スコア: {doc.overall_quality:.1f}")
            print(f"  - 一貫性スコア: {doc.consistency_score:.1f}")
            print(f"  - 完成度: {doc.completion_rate:.1f}%")
            
            # セクション別詳細
            print(f"\n📄 セクション別結果:")
            for section, generated_section in doc.sections.items():
                print(f"    - {section.value}:")
                print(f"      文字数: {generated_section.word_count}")
                print(f"      品質スコア: {generated_section.quality_score:.1f}")
                print(f"      適合度: {generated_section.compliance_score:.1f}")
        
        # 校正結果
        if result.proofreading_result:
            pr = result.proofreading_result
            print(f"\n✏️ 校正結果:")
            print(f"  - 検出問題数: {pr.total_issues}")
            print(f"  - 品質向上度: {pr.overall_quality_score:.1f}")
            print(f"  - 可読性スコア: {pr.readability_score:.1f}")
            print(f"  - 一貫性スコア: {pr.consistency_score:.1f}")
        
        # 採択可能性
        if result.adoption_probability is not None:
            print(f"\n🎯 採択可能性: {result.adoption_probability:.3f} ({result.adoption_probability*100:.1f}%)")
        
        # コスト分析
        if result.cost_breakdown:
            total_cost = result.cost_breakdown.get("total", 0)
            print(f"\n💰 コスト分析: ${total_cost:.3f}")
            for cost_type, amount in result.cost_breakdown.items():
                if cost_type != "total":
                    print(f"  - {cost_type}: ${amount:.3f}")
        
        # 推奨事項
        if result.recommendations:
            print(f"\n💡 推奨事項 ({len(result.recommendations)}件):")
            for i, rec in enumerate(result.recommendations[:3], 1):
                print(f"  {i}. {rec}")
        
        # 6. 品質アサーション
        assert result.success is True
        assert result.final_document is not None
        assert len(result.final_document.sections) >= 5
        assert result.final_document.total_word_count > 1000
        assert result.final_document.overall_quality >= 70.0
        assert result.processing_time > 0
        
        print(f"\n🎉 統合テスト完了 - 全てのアサーションに合格!")
        
    except Exception as e:
        print(f"\n❌ 統合テストエラー: {str(e)}")
        import traceback
        traceback.print_exc()
        pytest.fail(f"統合テストエラー: {str(e)}")


# pytest実行制御
def run_application_tests():
    """申請書作成機能テストを実行"""
    print("="*60)
    print("🧪 申請書作成機能テスト実行開始")
    print("="*60)
    
    # pytest実行
    result = pytest.main([
        __file__,
        "-v",
        "--tb=short",
        "-s"  # 標準出力表示
    ])
    
    return result


if __name__ == "__main__":
    # 直接実行時のクイックテスト
    async def quick_test():
        """クイックテスト"""
        print("🚀 申請書作成機能クイックテスト実行")
        
        try:
            # 基本的なワークフロー動作確認
            workflow = ApplicationWorkflow()
            print("✅ ワークフロー初期化成功")
            
            # 簡単なデータでテスト
            simple_company = {
                "name": "クイックテスト株式会社",
                "industry": "IT",
                "employee_count": 30,
                "description": "テスト用企業"
            }
            
            simple_project = {
                "title": "テストプロジェクト",
                "description": "クイックテスト用プロジェクト",
                "objectives": ["テスト実行"]
            }
            
            workflow_id, result = await workflow.create_application(
                company_profile=simple_company,
                project_info=simple_project,
                subsidy_type="テスト補助金"
            )
            
            print(f"✅ ワークフロー実行成功: {workflow_id}")
            print(f"✅ 結果取得成功: {result.success}")
            
            if result.final_document:
                print(f"✅ 文書生成成功: {len(result.final_document.sections)}セクション")
            
            print("\n🎉 クイックテスト完了！")
            
        except Exception as e:
            print(f"❌ クイックテストエラー: {str(e)}")
            import traceback
            traceback.print_exc()
    
    asyncio.run(quick_test())
    
    # フルテスト実行
    run_application_tests()