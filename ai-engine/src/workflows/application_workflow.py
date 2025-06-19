"""
申請書作成ワークフロー統合システム
全コンポーネントを統合した完全な申請書作成フロー
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
import asyncio
import logging
import json
import uuid

# 内部サービスのインポート
from ..services.enhanced_ai_service import EnhancedAIService, AIProvider
from ..services.application_writer import (
    ApplicationWriter, ApplicationDocument, ApplicationSection, 
    WritingStyle, SectionRequirements
)
from ..services.section_generator import SectionGenerator, SectionContext, GenerationOptions
from ..services.document_proofreader import DocumentProofreader, StyleGuide, ProofreadingResult
from ..services.quality_evaluator import QualityEvaluator
from ..services.document_analyzer import DocumentAnalyzer
from ..services.metrics_collector import MetricsCollector
from ..templates.application_template_manager import (
    ApplicationTemplateManager, ApplicationTemplate, TemplateCustomization
)
from ..models.adoption_predictor import AdoptionPredictor
from ..prompts.prompt_manager import PromptManager

logger = logging.getLogger(__name__)


class WorkflowStage(Enum):
    """ワークフロー段階"""
    INITIALIZATION = "initialization"           # 初期化
    TEMPLATE_SELECTION = "template_selection"   # テンプレート選択
    CONTENT_GENERATION = "content_generation"   # コンテンツ生成
    QUALITY_EVALUATION = "quality_evaluation"   # 品質評価
    PROOFREADING = "proofreading"              # 校正
    ADOPTION_PREDICTION = "adoption_prediction" # 採択予測
    FINALIZATION = "finalization"              # 最終化
    COMPLETED = "completed"                    # 完了


class WorkflowStatus(Enum):
    """ワークフロー状態"""
    PENDING = "pending"         # 待機中
    RUNNING = "running"         # 実行中
    PAUSED = "paused"          # 一時停止
    COMPLETED = "completed"     # 完了
    FAILED = "failed"          # 失敗
    CANCELLED = "cancelled"     # キャンセル


@dataclass
class WorkflowConfiguration:
    """ワークフロー設定"""
    # 基本設定
    auto_template_selection: bool = True
    auto_proofreading: bool = True
    quality_threshold: float = 75.0
    
    # 生成設定
    writing_style: WritingStyle = WritingStyle.FORMAL_BUSINESS
    ai_provider: AIProvider = AIProvider.HYBRID
    creativity_level: float = 0.7
    
    # セクション設定
    target_sections: Optional[List[ApplicationSection]] = None
    section_requirements: Optional[Dict[ApplicationSection, SectionRequirements]] = None
    
    # 品質設定
    enable_quality_checks: bool = True
    enable_consistency_checks: bool = True
    enable_adoption_prediction: bool = True
    
    # 詳細設定
    max_iterations: int = 3
    parallel_processing: bool = True
    save_intermediate_results: bool = True


@dataclass
class WorkflowProgress:
    """ワークフロー進行状況"""
    workflow_id: str
    current_stage: WorkflowStage
    status: WorkflowStatus
    progress_percentage: float
    stage_results: Dict[WorkflowStage, Dict[str, Any]] = field(default_factory=dict)
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    started_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    estimated_completion: Optional[datetime] = None


@dataclass
class WorkflowResult:
    """ワークフロー結果"""
    workflow_id: str
    success: bool
    final_document: Optional[ApplicationDocument] = None
    proofreading_result: Optional[ProofreadingResult] = None
    quality_scores: Dict[str, float] = field(default_factory=dict)
    adoption_probability: Optional[float] = None
    template_used: Optional[str] = None
    processing_time: float = 0.0
    cost_breakdown: Dict[str, float] = field(default_factory=dict)
    recommendations: List[str] = field(default_factory=list)
    metadata: Dict[str, Any] = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.now)


class ApplicationWorkflow:
    """申請書作成ワークフロー統合システム"""
    
    def __init__(self):
        """初期化"""
        # コアサービス
        self.ai_service = EnhancedAIService()
        self.application_writer = ApplicationWriter()
        self.section_generator = SectionGenerator()
        self.document_proofreader = DocumentProofreader()
        self.quality_evaluator = QualityEvaluator()
        self.document_analyzer = DocumentAnalyzer()
        self.metrics_collector = MetricsCollector()
        self.template_manager = ApplicationTemplateManager()
        self.adoption_predictor = AdoptionPredictor()
        self.prompt_manager = PromptManager()
        
        # ワークフロー管理
        self.active_workflows: Dict[str, WorkflowProgress] = {}
        self.workflow_results: Dict[str, WorkflowResult] = {}
        
        logger.info("申請書作成ワークフロー初期化完了")

    async def create_application(
        self,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        subsidy_type: str,
        configuration: Optional[WorkflowConfiguration] = None,
        workflow_id: Optional[str] = None
    ) -> Tuple[str, WorkflowResult]:
        """
        申請書作成メインワークフロー
        
        Args:
            company_profile: 企業プロファイル
            project_info: プロジェクト情報
            subsidy_type: 補助金タイプ
            configuration: ワークフロー設定
            workflow_id: ワークフローID（指定可能）
            
        Returns:
            Tuple[str, WorkflowResult]: ワークフローID と結果
        """
        try:
            # ワークフロー初期化
            if workflow_id is None:
                workflow_id = f"workflow_{uuid.uuid4().hex[:8]}"
            
            if configuration is None:
                configuration = WorkflowConfiguration()
            
            progress = WorkflowProgress(
                workflow_id=workflow_id,
                current_stage=WorkflowStage.INITIALIZATION,
                status=WorkflowStatus.RUNNING,
                progress_percentage=0.0
            )
            
            self.active_workflows[workflow_id] = progress
            start_time = datetime.now()
            
            logger.info(f"申請書作成ワークフロー開始: {workflow_id}")
            
            # メトリクス記録開始
            await self.metrics_collector.start_request_tracking(
                request_id=workflow_id,
                request_type="application_creation",
                user_id="system"
            )
            
            # Stage 1: 初期化・バリデーション
            await self._update_progress(workflow_id, WorkflowStage.INITIALIZATION, 10.0)
            initialization_result = await self._stage_initialization(
                company_profile, project_info, subsidy_type, configuration
            )
            progress.stage_results[WorkflowStage.INITIALIZATION] = initialization_result
            
            # Stage 2: テンプレート選択
            await self._update_progress(workflow_id, WorkflowStage.TEMPLATE_SELECTION, 20.0)
            template_result = await self._stage_template_selection(
                company_profile, project_info, subsidy_type, configuration
            )
            progress.stage_results[WorkflowStage.TEMPLATE_SELECTION] = template_result
            
            # Stage 3: コンテンツ生成
            await self._update_progress(workflow_id, WorkflowStage.CONTENT_GENERATION, 50.0)
            content_result = await self._stage_content_generation(
                company_profile, project_info, subsidy_type, 
                template_result.get("selected_template"), configuration
            )
            progress.stage_results[WorkflowStage.CONTENT_GENERATION] = content_result
            
            # Stage 4: 品質評価
            await self._update_progress(workflow_id, WorkflowStage.QUALITY_EVALUATION, 65.0)
            quality_result = await self._stage_quality_evaluation(
                content_result.get("document"), configuration
            )
            progress.stage_results[WorkflowStage.QUALITY_EVALUATION] = quality_result
            
            # Stage 5: 校正（条件付き）
            proofreading_result = None
            if configuration.auto_proofreading:
                await self._update_progress(workflow_id, WorkflowStage.PROOFREADING, 80.0)
                proofreading_result = await self._stage_proofreading(
                    content_result.get("document"), configuration
                )
                progress.stage_results[WorkflowStage.PROOFREADING] = proofreading_result
            
            # Stage 6: 採択可能性予測
            adoption_result = None
            if configuration.enable_adoption_prediction:
                await self._update_progress(workflow_id, WorkflowStage.ADOPTION_PREDICTION, 90.0)
                adoption_result = await self._stage_adoption_prediction(
                    content_result.get("document"), subsidy_type, company_profile
                )
                progress.stage_results[WorkflowStage.ADOPTION_PREDICTION] = adoption_result
            
            # Stage 7: 最終化
            await self._update_progress(workflow_id, WorkflowStage.FINALIZATION, 95.0)
            final_result = await self._stage_finalization(
                content_result.get("document"),
                proofreading_result,
                quality_result,
                adoption_result,
                configuration
            )
            progress.stage_results[WorkflowStage.FINALIZATION] = final_result
            
            # ワークフロー完了
            await self._update_progress(workflow_id, WorkflowStage.COMPLETED, 100.0)
            progress.status = WorkflowStatus.COMPLETED
            
            # 処理時間・コスト計算
            processing_time = (datetime.now() - start_time).total_seconds()
            cost_breakdown = await self._calculate_cost_breakdown(progress.stage_results)
            
            # 結果作成
            workflow_result = WorkflowResult(
                workflow_id=workflow_id,
                success=True,
                final_document=final_result.get("final_document"),
                proofreading_result=proofreading_result.get("proofreading_result") if proofreading_result else None,
                quality_scores=quality_result.get("scores", {}),
                adoption_probability=adoption_result.get("probability") if adoption_result else None,
                template_used=template_result.get("template_id"),
                processing_time=processing_time,
                cost_breakdown=cost_breakdown,
                recommendations=final_result.get("recommendations", [])
            )
            
            self.workflow_results[workflow_id] = workflow_result
            
            # メトリクス記録完了
            await self.metrics_collector.end_request_tracking(
                request_id=workflow_id,
                success=True,
                cost=sum(cost_breakdown.values()),
                quality_score=workflow_result.quality_scores.get("overall", 0)
            )
            
            logger.info(f"申請書作成ワークフロー完了: {workflow_id}, 処理時間: {processing_time:.2f}秒")
            return workflow_id, workflow_result
            
        except Exception as e:
            logger.error(f"申請書作成ワークフローエラー: {str(e)}")
            
            # エラー処理
            if workflow_id in self.active_workflows:
                self.active_workflows[workflow_id].status = WorkflowStatus.FAILED
                self.active_workflows[workflow_id].errors.append(str(e))
            
            # メトリクス記録（失敗）
            try:
                await self.metrics_collector.end_request_tracking(
                    request_id=workflow_id,
                    success=False,
                    error=str(e)
                )
            except:
                pass
            
            # 失敗結果を返す
            error_result = WorkflowResult(
                workflow_id=workflow_id,
                success=False,
                metadata={"error": str(e)}
            )
            
            return workflow_id, error_result

    async def get_workflow_progress(self, workflow_id: str) -> Optional[WorkflowProgress]:
        """ワークフロー進行状況取得"""
        return self.active_workflows.get(workflow_id)

    async def get_workflow_result(self, workflow_id: str) -> Optional[WorkflowResult]:
        """ワークフロー結果取得"""
        return self.workflow_results.get(workflow_id)

    async def cancel_workflow(self, workflow_id: str) -> bool:
        """ワークフローキャンセル"""
        try:
            if workflow_id in self.active_workflows:
                self.active_workflows[workflow_id].status = WorkflowStatus.CANCELLED
                logger.info(f"ワークフローキャンセル: {workflow_id}")
                return True
            return False
        except Exception as e:
            logger.error(f"ワークフローキャンセルエラー: {str(e)}")
            return False

    # ワークフロー段階実装

    async def _stage_initialization(
        self,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        subsidy_type: str,
        configuration: WorkflowConfiguration
    ) -> Dict[str, Any]:
        """初期化段階"""
        try:
            # 入力データバリデーション
            validation_errors = []
            
            # 必須フィールドチェック
            required_company_fields = ["name", "industry", "employee_count"]
            for field in required_company_fields:
                if field not in company_profile:
                    validation_errors.append(f"企業プロファイルに必須フィールド '{field}' がありません")
            
            required_project_fields = ["title", "description", "objectives"]
            for field in required_project_fields:
                if field not in project_info:
                    validation_errors.append(f"プロジェクト情報に必須フィールド '{field}' がありません")
            
            if not subsidy_type:
                validation_errors.append("補助金タイプが指定されていません")
            
            # データ正規化
            normalized_company = await self._normalize_company_profile(company_profile)
            normalized_project = await self._normalize_project_info(project_info)
            
            return {
                "success": len(validation_errors) == 0,
                "validation_errors": validation_errors,
                "normalized_company": normalized_company,
                "normalized_project": normalized_project,
                "configuration": asdict(configuration)
            }
            
        except Exception as e:
            logger.error(f"初期化段階エラー: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _stage_template_selection(
        self,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        subsidy_type: str,
        configuration: WorkflowConfiguration
    ) -> Dict[str, Any]:
        """テンプレート選択段階"""
        try:
            selected_template = None
            customization = None
            
            if configuration.auto_template_selection:
                # 自動テンプレート選択
                recommended_templates = await self.template_manager.get_recommended_templates(
                    subsidy_type=subsidy_type,
                    company_profile=company_profile,
                    project_info=project_info,
                    limit=3
                )
                
                if recommended_templates:
                    selected_template = recommended_templates[0]
                    
                    # テンプレートカスタマイズ
                    customization = await self.template_manager.customize_template(
                        base_template_id=selected_template.template_id,
                        company_profile=company_profile,
                        project_info=project_info
                    )
            
            return {
                "success": True,
                "selected_template": selected_template,
                "customization": customization,
                "template_id": selected_template.template_id if selected_template else None,
                "recommended_count": len(recommended_templates) if 'recommended_templates' in locals() else 0
            }
            
        except Exception as e:
            logger.error(f"テンプレート選択段階エラー: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _stage_content_generation(
        self,
        company_profile: Dict[str, Any],
        project_info: Dict[str, Any],
        subsidy_type: str,
        selected_template: Optional[ApplicationTemplate],
        configuration: WorkflowConfiguration
    ) -> Dict[str, Any]:
        """コンテンツ生成段階"""
        try:
            # 対象セクション決定
            target_sections = configuration.target_sections
            if target_sections is None:
                target_sections = [
                    ApplicationSection.COMPANY_OVERVIEW,
                    ApplicationSection.PROJECT_SUMMARY,
                    ApplicationSection.CURRENT_SITUATION,
                    ApplicationSection.PROJECT_DESCRIPTION,
                    ApplicationSection.IMPLEMENTATION_PLAN,
                    ApplicationSection.EXPECTED_OUTCOMES
                ]
            
            # 申請書生成
            document = await self.application_writer.generate_complete_application(
                company_profile=company_profile,
                project_info=project_info,
                subsidy_type=subsidy_type,
                target_sections=target_sections,
                custom_requirements=configuration.section_requirements
            )
            
            return {
                "success": True,
                "document": document,
                "sections_generated": len(document.sections),
                "total_word_count": document.total_word_count
            }
            
        except Exception as e:
            logger.error(f"コンテンツ生成段階エラー: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _stage_quality_evaluation(
        self,
        document: ApplicationDocument,
        configuration: WorkflowConfiguration
    ) -> Dict[str, Any]:
        """品質評価段階"""
        try:
            if not configuration.enable_quality_checks:
                return {"success": True, "skipped": True}
            
            scores = {}
            evaluations = {}
            
            # 各セクションの品質評価
            for section, generated_section in document.sections.items():
                evaluation = await self.quality_evaluator.evaluate_content_quality(
                    content=generated_section.content,
                    content_type=section.value,
                    context={"section": section.value}
                )
                
                scores[section.value] = evaluation.overall_score
                evaluations[section.value] = evaluation
            
            # 全体品質スコア
            overall_score = sum(scores.values()) / len(scores) if scores else 0
            
            # 品質閾値チェック
            meets_threshold = overall_score >= configuration.quality_threshold
            
            return {
                "success": True,
                "scores": scores,
                "overall_score": overall_score,
                "meets_threshold": meets_threshold,
                "evaluations": evaluations
            }
            
        except Exception as e:
            logger.error(f"品質評価段階エラー: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _stage_proofreading(
        self,
        document: ApplicationDocument,
        configuration: WorkflowConfiguration
    ) -> Dict[str, Any]:
        """校正段階"""
        try:
            # 文体ガイド設定
            style_guide = StyleGuide(
                tone="formal",
                honorific_level="respectful"
            )
            
            # 校正実行
            proofreading_result = await self.document_proofreader.proofread_document(
                document=document,
                style_guide=style_guide,
                auto_fix=True
            )
            
            return {
                "success": True,
                "proofreading_result": proofreading_result,
                "total_issues": proofreading_result.total_issues,
                "quality_improvement": proofreading_result.overall_quality_score
            }
            
        except Exception as e:
            logger.error(f"校正段階エラー: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _stage_adoption_prediction(
        self,
        document: ApplicationDocument,
        subsidy_type: str,
        company_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """採択可能性予測段階"""
        try:
            # 申請データ準備
            application_data = {
                "content": "\n".join([section.content for section in document.sections.values()]),
                "word_count": document.total_word_count,
                "quality_score": document.overall_quality,
                "sections": list(document.sections.keys())
            }
            
            subsidy_program = {
                "type": subsidy_type,
                "target_industries": [],  # 実際のデータベースから取得
                "evaluation_criteria": []
            }
            
            # 採択可能性予測
            prediction = self.adoption_predictor.predict_adoption_probability(
                application_data=application_data,
                subsidy_program=subsidy_program,
                company_profile=company_profile
            )
            
            return {
                "success": True,
                "probability": prediction.adoption_probability,
                "confidence": prediction.confidence_score,
                "prediction_details": prediction,
                "recommendations": prediction.improvement_suggestions
            }
            
        except Exception as e:
            logger.error(f"採択可能性予測段階エラー: {str(e)}")
            return {"success": False, "error": str(e)}

    async def _stage_finalization(
        self,
        document: ApplicationDocument,
        proofreading_result: Optional[Dict[str, Any]],
        quality_result: Dict[str, Any],
        adoption_result: Optional[Dict[str, Any]],
        configuration: WorkflowConfiguration
    ) -> Dict[str, Any]:
        """最終化段階"""
        try:
            final_document = document
            recommendations = []
            
            # 校正結果の適用
            if proofreading_result and proofreading_result.get("success"):
                proofread_data = proofreading_result.get("proofreading_result")
                if proofread_data and proofread_data.improved_content:
                    # 改善されたコンテンツで文書を更新
                    for section, improved_content in proofread_data.improved_content.items():
                        if section in final_document.sections:
                            final_document.sections[section].content = improved_content
                
                recommendations.extend(proofread_data.suggestions if proofread_data else [])
            
            # 品質スコアの更新
            if quality_result.get("success"):
                final_document.overall_quality = quality_result.get("overall_score", 0)
            
            # 採択可能性の統合
            if adoption_result and adoption_result.get("success"):
                recommendations.extend(adoption_result.get("recommendations", []))
            
            # 最終メタデータの更新
            final_document.updated_at = datetime.now()
            
            # 全体的な推奨事項生成
            overall_recommendations = await self._generate_final_recommendations(
                final_document, quality_result, adoption_result, proofreading_result
            )
            recommendations.extend(overall_recommendations)
            
            return {
                "success": True,
                "final_document": final_document,
                "recommendations": recommendations[:10]  # 上位10件
            }
            
        except Exception as e:
            logger.error(f"最終化段階エラー: {str(e)}")
            return {"success": False, "error": str(e)}

    # ヘルパーメソッド

    async def _update_progress(
        self,
        workflow_id: str,
        stage: WorkflowStage,
        percentage: float
    ):
        """進行状況更新"""
        if workflow_id in self.active_workflows:
            progress = self.active_workflows[workflow_id]
            progress.current_stage = stage
            progress.progress_percentage = percentage
            progress.updated_at = datetime.now()

    async def _normalize_company_profile(
        self,
        company_profile: Dict[str, Any]
    ) -> Dict[str, Any]:
        """企業プロファイル正規化"""
        normalized = company_profile.copy()
        
        # データ型の正規化
        if "employee_count" in normalized:
            try:
                normalized["employee_count"] = int(normalized["employee_count"])
            except (ValueError, TypeError):
                normalized["employee_count"] = 0
        
        # 業界名の正規化
        if "industry" in normalized:
            industry_mapping = {
                "IT": "情報技術",
                "製造": "製造業",
                "サービス": "サービス業"
            }
            industry = normalized["industry"]
            normalized["industry"] = industry_mapping.get(industry, industry)
        
        return normalized

    async def _normalize_project_info(
        self,
        project_info: Dict[str, Any]
    ) -> Dict[str, Any]:
        """プロジェクト情報正規化"""
        normalized = project_info.copy()
        
        # 必須フィールドのデフォルト値設定
        defaults = {
            "timeline": "12ヶ月",
            "budget": 0,
            "team_size": 1
        }
        
        for key, default_value in defaults.items():
            if key not in normalized:
                normalized[key] = default_value
        
        return normalized

    async def _calculate_cost_breakdown(
        self,
        stage_results: Dict[WorkflowStage, Dict[str, Any]]
    ) -> Dict[str, float]:
        """コスト内訳計算"""
        cost_breakdown = {
            "ai_generation": 0.0,
            "quality_evaluation": 0.0,
            "proofreading": 0.0,
            "prediction": 0.0,
            "total": 0.0
        }
        
        # 各段階のコストを集計（簡易版）
        # 実際の実装では、各サービスから詳細なコスト情報を取得
        
        if WorkflowStage.CONTENT_GENERATION in stage_results:
            cost_breakdown["ai_generation"] = 0.05  # 推定コスト
        
        if WorkflowStage.QUALITY_EVALUATION in stage_results:
            cost_breakdown["quality_evaluation"] = 0.01
        
        if WorkflowStage.PROOFREADING in stage_results:
            cost_breakdown["proofreading"] = 0.02
        
        if WorkflowStage.ADOPTION_PREDICTION in stage_results:
            cost_breakdown["prediction"] = 0.01
        
        cost_breakdown["total"] = sum(
            cost for key, cost in cost_breakdown.items() if key != "total"
        )
        
        return cost_breakdown

    async def _generate_final_recommendations(
        self,
        document: ApplicationDocument,
        quality_result: Dict[str, Any],
        adoption_result: Optional[Dict[str, Any]],
        proofreading_result: Optional[Dict[str, Any]]
    ) -> List[str]:
        """最終推奨事項生成"""
        recommendations = []
        
        # 品質ベースの推奨事項
        overall_quality = quality_result.get("overall_score", 0)
        if overall_quality < 80:
            recommendations.append("全体的な品質向上のため、内容の見直しを推奨します")
        
        # 採択可能性ベースの推奨事項
        if adoption_result:
            probability = adoption_result.get("probability", 0)
            if probability < 0.7:
                recommendations.append("採択可能性向上のため、競合優位性の強調を推奨します")
        
        # 校正ベースの推奨事項
        if proofreading_result:
            total_issues = proofreading_result.get("total_issues", 0)
            if total_issues > 10:
                recommendations.append("多数の校正問題があるため、文章の見直しを推奨します")
        
        # 文書構成の推奨事項
        if len(document.sections) < 5:
            recommendations.append("申請書の説得力向上のため、追加セクションの検討を推奨します")
        
        return recommendations