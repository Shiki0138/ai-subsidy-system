"""
小規模事業者持続化補助金専用サービス
申請書類一式の自動生成・実践対応
"""

from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from enum import Enum
import asyncio
import logging
import json
import os
from pathlib import Path

from .enhanced_ai_service import EnhancedAIService, AIProvider
from .application_writer import ApplicationWriter, ApplicationSection
from .document_proofreader import DocumentProofreader, StyleGuide
from .quality_evaluator import QualityEvaluator
from ..templates.application_template_manager import ApplicationTemplateManager

logger = logging.getLogger(__name__)


class JizokukaDocumentType(Enum):
    """持続化補助金書類タイプ"""
    FORM1_APPLICATION = "form1_application"          # 様式1：申請書
    FORM2_BUSINESS_PLAN = "form2_business_plan"      # 様式2：経営計画書
    FORM3_SUBSIDY_PLAN = "form3_subsidy_plan"        # 様式3：補助事業計画書
    SUPPORT_PLAN = "support_plan"                    # 事業支援計画書（商工会議所作成）
    ESTIMATE = "estimate"                            # 見積書
    FINANCIAL_STATEMENT = "financial_statement"      # 決算書
    TAX_CERTIFICATE = "tax_certificate"              # 納税証明書
    COMPANY_REGISTRY = "company_registry"            # 履歴事項全部証明書
    OTHER_ATTACHMENTS = "other_attachments"          # その他添付書類


class BusinessType(Enum):
    """事業形態"""
    CORPORATION = "corporation"          # 法人
    INDIVIDUAL = "individual"            # 個人事業主
    PARTNERSHIP = "partnership"          # 組合
    NPO = "npo"                         # NPO法人


class SubsidyPurpose(Enum):
    """補助事業の目的"""
    SALES_EXPANSION = "sales_expansion"              # 販路開拓
    PRODUCTIVITY = "productivity"                    # 生産性向上
    NEW_PRODUCT = "new_product"                      # 新商品・サービス開発
    DIGITALIZATION = "digitalization"                # デジタル化
    REGIONAL_CONTRIBUTION = "regional_contribution"  # 地域貢献


@dataclass
class JizokukaCompanyInfo:
    """持続化補助金用企業情報"""
    # 基本情報
    company_name: str
    representative_name: str
    postal_code: str
    address: str
    phone: str
    fax: Optional[str] = None
    email: str = ""
    website: Optional[str] = None
    
    # 事業情報
    business_type: BusinessType = BusinessType.CORPORATION
    establishment_date: datetime = field(default_factory=datetime.now)
    capital: Optional[int] = None  # 個人事業主の場合はNone
    employee_count: int = 5
    main_business: str = ""
    industry_code: str = ""  # 日本標準産業分類
    
    # 財務情報
    last_year_sales: int = 0
    last_year_profit: int = 0
    current_year_sales_forecast: int = 0
    
    # 商工会議所情報
    chamber_member: bool = True
    chamber_name: str = ""
    membership_number: str = ""


@dataclass
class JizokukaProjectInfo:
    """持続化補助金用プロジェクト情報"""
    # プロジェクト基本情報
    project_title: str
    purpose: SubsidyPurpose
    start_date: datetime
    end_date: datetime
    total_budget: int
    subsidy_amount: int  # 希望補助金額
    
    # 事業内容
    current_situation: str  # 現状
    challenges: List[str]  # 課題
    target_customers: str  # ターゲット顧客
    sales_strategy: str  # 販路開拓戦略
    expected_effects: List[str]  # 期待効果
    
    # 経費内訳
    expense_breakdown: Dict[str, int] = field(default_factory=dict)
    # 例: {"広報費": 500000, "ウェブサイト関連費": 300000}
    
    # 数値目標
    sales_increase_rate: float = 0.1  # 売上増加率目標
    new_customer_count: int = 0  # 新規顧客獲得目標
    productivity_improvement: float = 0.0  # 生産性向上率


@dataclass
class JizokukaApplicationData:
    """持続化補助金申請データ"""
    application_id: str
    company_info: JizokukaCompanyInfo
    project_info: JizokukaProjectInfo
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    status: str = "draft"
    documents: Dict[JizokukaDocumentType, str] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)


class JizokukaSubsidyService:
    """小規模事業者持続化補助金サービス"""
    
    def __init__(self, output_dir: str = "output/jizokuka"):
        """初期化"""
        self.ai_service = EnhancedAIService()
        self.application_writer = ApplicationWriter()
        self.document_proofreader = DocumentProofreader()
        self.quality_evaluator = QualityEvaluator()
        self.template_manager = ApplicationTemplateManager()
        
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # 文書テンプレート
        self.document_templates = self._load_document_templates()
        
        logger.info("持続化補助金サービス初期化完了")
    
    async def create_complete_application(
        self,
        company_info: JizokukaCompanyInfo,
        project_info: JizokukaProjectInfo,
        application_id: Optional[str] = None
    ) -> JizokukaApplicationData:
        """
        完全な申請書類一式を作成
        
        Args:
            company_info: 企業情報
            project_info: プロジェクト情報
            application_id: 申請ID（省略時は自動生成）
            
        Returns:
            JizokukaApplicationData: 申請データ（全書類含む）
        """
        try:
            if application_id is None:
                application_id = f"jizokuka_{datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            logger.info(f"持続化補助金申請書作成開始: {application_id}")
            
            # 申請データ作成
            application_data = JizokukaApplicationData(
                application_id=application_id,
                company_info=company_info,
                project_info=project_info
            )
            
            # 出力ディレクトリ作成
            app_dir = self.output_dir / application_id
            app_dir.mkdir(exist_ok=True)
            
            # 1. 様式1：申請書作成
            form1_path = await self._create_form1_application(
                application_data, app_dir
            )
            application_data.documents[JizokukaDocumentType.FORM1_APPLICATION] = str(form1_path)
            
            # 2. 様式2：経営計画書作成
            form2_path = await self._create_form2_business_plan(
                application_data, app_dir
            )
            application_data.documents[JizokukaDocumentType.FORM2_BUSINESS_PLAN] = str(form2_path)
            
            # 3. 様式3：補助事業計画書作成
            form3_path = await self._create_form3_subsidy_plan(
                application_data, app_dir
            )
            application_data.documents[JizokukaDocumentType.FORM3_SUBSIDY_PLAN] = str(form3_path)
            
            # 4. 見積書テンプレート作成
            estimate_path = await self._create_estimate_template(
                application_data, app_dir
            )
            application_data.documents[JizokukaDocumentType.ESTIMATE] = str(estimate_path)
            
            # 5. チェックリスト作成
            checklist_path = await self._create_document_checklist(
                application_data, app_dir
            )
            
            # 6. 申請ガイド作成
            guide_path = await self._create_application_guide(
                application_data, app_dir
            )
            
            # メタデータ更新
            application_data.updated_at = datetime.now()
            application_data.status = "ready"
            application_data.metadata.update({
                "total_documents": len(application_data.documents),
                "checklist_path": str(checklist_path),
                "guide_path": str(guide_path),
                "output_directory": str(app_dir)
            })
            
            # 申請データ保存
            await self._save_application_data(application_data, app_dir)
            
            logger.info(f"持続化補助金申請書作成完了: {application_id}")
            return application_data
            
        except Exception as e:
            logger.error(f"申請書作成エラー: {str(e)}")
            raise
    
    async def _create_form1_application(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ) -> Path:
        """様式1：申請書作成"""
        try:
            company = application_data.company_info
            project = application_data.project_info
            
            # 申請書内容生成
            content = f"""
令和６年度 小規模事業者持続化補助金（第１５回）申請書

                                                    令和６年　月　日

日本商工会議所 会頭 殿
（{company.chamber_name} 経由）

                                    申請者
                                    住所：〒{company.postal_code}
                                          {company.address}
                                    名称：{company.company_name}
                                    代表者：{company.representative_name}　印

                        記

１．補助事業の名称
　　{project.project_title}

２．補助事業の実施期間
　　交付決定日 ～ {project.end_date.strftime('%Y年%m月%d日')}

３．補助金申請額
　　{project.subsidy_amount:,}円
　　（補助対象経費合計{project.total_budget:,}円の2/3以内）

４．補助事業に要する経費の内訳
"""
            # 経費内訳追加
            for expense_type, amount in project.expense_breakdown.items():
                content += f"　　{expense_type}：{amount:,}円\n"
            
            content += f"""
　　合計：{project.total_budget:,}円

５．事業実施場所
　　{company.address}

６．連絡先
　　担当者名：{company.representative_name}
　　電話番号：{company.phone}
　　FAX番号：{company.fax or '－'}
　　E-mail：{company.email}

７．添付書類
　　□ 経営計画書（様式２）
　　□ 補助事業計画書（様式３）
　　□ 事業支援計画書（商工会議所作成）
　　□ 補助金交付申請書
　　□ 見積書（税込10万円以上の経費）
　　□ 決算書（直近２期分）
　　□ 確定申告書（個人事業主の場合）
　　□ その他必要書類

【宣誓・同意事項】
私は、下記の事項について宣誓・同意します。
・補助金等に係る予算の執行の適正化に関する法律を遵守します
・反社会的勢力に該当しません
・申請内容に虚偽はありません
・採択後は事業実施状況を報告します

                                        申請者署名：＿＿＿＿＿＿＿＿＿＿
"""
            
            # ファイル保存
            file_path = output_dir / "様式1_申請書.txt"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return file_path
            
        except Exception as e:
            logger.error(f"様式1作成エラー: {str(e)}")
            raise
    
    async def _create_form2_business_plan(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ) -> Path:
        """様式2：経営計画書作成"""
        try:
            company = application_data.company_info
            project = application_data.project_info
            
            # AI生成用コンテキスト準備
            context = {
                "company_name": company.company_name,
                "industry": company.main_business,
                "employee_count": company.employee_count,
                "establishment_year": company.establishment_date.year,
                "last_year_sales": company.last_year_sales,
                "current_situation": project.current_situation,
                "challenges": project.challenges,
                "target_customers": project.target_customers
            }
            
            # セクション別生成
            sections = {}
            
            # 1. 企業概要
            sections["company_overview"] = await self._generate_company_overview(context)
            
            # 2. 顧客ニーズと市場動向
            sections["market_analysis"] = await self._generate_market_analysis(context)
            
            # 3. 自社の強み
            sections["strengths"] = await self._generate_strengths_analysis(context)
            
            # 4. 経営方針・目標と今後のプラン
            sections["business_strategy"] = await self._generate_business_strategy(context)
            
            # 文書組み立て
            content = f"""
経営計画書（様式２）

申請者名：{company.company_name}

１．企業概要
{sections['company_overview']}

２．顧客ニーズと市場の動向
{sections['market_analysis']}

３．自社や自社の提供する商品・サービスの強み
{sections['strengths']}

４．経営方針・目標と今後のプラン
{sections['business_strategy']}

【数値目標】
・売上高目標：
　現在：{company.last_year_sales:,}円
　1年後：{int(company.last_year_sales * (1 + project.sales_increase_rate)):,}円（{project.sales_increase_rate*100:.1f}%増）
　3年後：{int(company.last_year_sales * (1 + project.sales_increase_rate * 3)):,}円

・新規顧客獲得目標：年間{project.new_customer_count}件

・その他の目標：
　- 生産性{project.productivity_improvement*100:.1f}%向上
　- リピート率向上
　- 地域シェア拡大

※経営計画書の作成にあたっては、必ず、「商工会議所の経営指導員」と相談し、助言・指導を受けてください。
"""
            
            # ファイル保存
            file_path = output_dir / "様式2_経営計画書.txt"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return file_path
            
        except Exception as e:
            logger.error(f"様式2作成エラー: {str(e)}")
            raise
    
    async def _create_form3_subsidy_plan(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ) -> Path:
        """様式3：補助事業計画書作成"""
        try:
            company = application_data.company_info
            project = application_data.project_info
            
            # AI生成用コンテキスト準備
            context = {
                "project_title": project.project_title,
                "purpose": project.purpose.value,
                "sales_strategy": project.sales_strategy,
                "expected_effects": project.expected_effects,
                "total_budget": project.total_budget,
                "expense_breakdown": project.expense_breakdown
            }
            
            # セクション別生成
            sections = {}
            
            # 1. 補助事業の内容
            sections["project_content"] = await self._generate_project_content(context)
            
            # 2. 販路開拓等の取組内容
            sections["sales_expansion"] = await self._generate_sales_expansion_plan(context)
            
            # 3. 業務効率化の取組内容
            sections["efficiency"] = await self._generate_efficiency_plan(context)
            
            # 文書組み立て
            content = f"""
補助事業計画書（様式３）

申請者名：{company.company_name}

１．補助事業で行う事業名
{project.project_title}

２．補助事業の内容
2-1．補助事業の具体的内容
{sections['project_content']}

2-2．販路開拓等（生産性向上）の取組内容
{sections['sales_expansion']}

2-3．業務効率化（生産性向上）の取組内容【任意記入】
{sections['efficiency']}

３．補助事業の効果
【売上・利益への効果】
"""
            # 期待効果を箇条書きで追加
            for i, effect in enumerate(project.expected_effects, 1):
                content += f"（{i}）{effect}\n"
            
            content += f"""

【数値目標】
・売上高：{project.sales_increase_rate*100:.1f}%増加（前年比）
・新規顧客：{project.new_customer_count}件獲得
・生産性：{project.productivity_improvement*100:.1f}%向上

４．経費明細表
"""
            # 経費明細追加
            total = 0
            for i, (expense_type, amount) in enumerate(project.expense_breakdown.items(), 1):
                content += f"""
({i}) {expense_type}
　　内容：{await self._generate_expense_description(expense_type)}
　　金額：{amount:,}円（税込）
"""
                total += amount
            
            content += f"""
補助対象経費合計：{total:,}円
補助金申請額：{project.subsidy_amount:,}円（補助率2/3）

５．実施スケジュール
"""
            # スケジュール生成
            schedule = await self._generate_implementation_schedule(project)
            content += schedule
            
            # ファイル保存
            file_path = output_dir / "様式3_補助事業計画書.txt"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return file_path
            
        except Exception as e:
            logger.error(f"様式3作成エラー: {str(e)}")
            raise
    
    async def _create_estimate_template(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ) -> Path:
        """見積書テンプレート作成"""
        try:
            company = application_data.company_info
            project = application_data.project_info
            
            content = f"""
見　積　書

                                                    見積日：令和６年　月　日
                                                    見積番号：

{company.company_name} 御中

下記の通りお見積り申し上げます。

御見積金額：￥{project.total_budget:,}－（税込）

【見積内容】
"""
            # 経費項目別見積
            for i, (expense_type, amount) in enumerate(project.expense_breakdown.items(), 1):
                tax_excluded = int(amount / 1.1)
                tax = amount - tax_excluded
                content += f"""
{i}. {expense_type}
　　内容：{await self._generate_expense_description(expense_type)}
　　単価：{tax_excluded:,}円
　　数量：1式
　　金額：{tax_excluded:,}円
　　消費税：{tax:,}円
　　合計：{amount:,}円
"""
            
            content += f"""

小計：{int(project.total_budget/1.1):,}円
消費税（10%）：{project.total_budget - int(project.total_budget/1.1):,}円
合計金額：{project.total_budget:,}円

【納期】交付決定後〜{project.end_date.strftime('%Y年%m月%d日')}
【支払条件】納品後翌月末
【見積有効期限】見積日より3ヶ月

※本見積書は持続化補助金申請用の参考見積書です。
　実際の発注時は正式な見積書を取得してください。

                                        見積作成者：＿＿＿＿＿＿＿＿＿＿
                                        会社名：＿＿＿＿＿＿＿＿＿＿＿＿
                                        住所：＿＿＿＿＿＿＿＿＿＿＿＿＿
                                        電話：＿＿＿＿＿＿＿＿＿＿＿＿＿
"""
            
            # ファイル保存
            file_path = output_dir / "見積書テンプレート.txt"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return file_path
            
        except Exception as e:
            logger.error(f"見積書作成エラー: {str(e)}")
            raise
    
    async def _create_document_checklist(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ) -> Path:
        """提出書類チェックリスト作成"""
        try:
            company = application_data.company_info
            
            content = f"""
小規模事業者持続化補助金 提出書類チェックリスト

申請者名：{company.company_name}
申請日：令和６年　月　日

【必須提出書類】
□ 様式１　小規模事業者持続化補助金申請書
　 ※代表者印の押印必須

□ 様式２　経営計画書
　 ※商工会議所の確認印必須

□ 様式３　補助事業計画書
　 ※経費明細表を含む

□ 事業支援計画書（様式４）
　 ※商工会議所が作成・発行
　 ※発行まで1週間程度必要

□ 補助金交付申請書
　 ※採択後に提出

□ 見積書
　 ※税込10万円以上の経費は必須
　 ※複数社見積もり推奨

□ 決算書（直近2期分）
　 - 貸借対照表
　 - 損益計算書
　 - 製造原価報告書（製造業の場合）
　 - 販売管理費明細（ある場合）

□ 確定申告書の写し
　 ※法人：法人税申告書別表一の写し
　 ※個人：所得税確定申告書第一表・第二表の写し

【該当する場合のみ提出】
□ 登記簿謄本（履歴事項全部証明書）
　 ※法人の場合、3ヶ月以内のもの

□ 開業届の写し
　 ※個人事業主で創業1年未満の場合

□ 納税証明書
　 ※税金の未納がある場合

□ 労働保険料の納付証明書
　 ※従業員を雇用している場合

【加点項目関連書類】
□ 事業継続力強化計画認定書
□ 経営革新計画承認書
□ 各種認定・表彰状
□ 地域貢献活動の証明書

【提出前の最終確認】
□ 全ての書類に記載漏れがないか
□ 押印箇所に押印されているか
□ 書類の日付に矛盾がないか
□ 経費の計算に誤りがないか
□ 提出期限に間に合うか

【提出方法】
・電子申請：Jグランツから申請
・郵送：簡易書留等の配達記録が残る方法で送付

【問い合わせ先】
{company.chamber_name}
担当者：＿＿＿＿＿＿
電話：＿＿＿＿＿＿＿
"""
            
            # ファイル保存
            file_path = output_dir / "提出書類チェックリスト.txt"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return file_path
            
        except Exception as e:
            logger.error(f"チェックリスト作成エラー: {str(e)}")
            raise
    
    async def _create_application_guide(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ) -> Path:
        """申請ガイド作成"""
        try:
            content = f"""
小規模事業者持続化補助金 申請ガイド

【申請の流れ】

1. 事前準備（申請2週間前まで）
   ↓
   ・商工会議所への相談予約
   ・必要書類の収集開始
   ・事業計画の検討

2. 商工会議所での相談（申請1週間前まで）
   ↓
   ・経営指導員との面談
   ・計画書の添削・アドバイス
   ・事業支援計画書の発行依頼

3. 申請書類の作成
   ↓
   ・様式1〜3の作成
   ・見積書の取得
   ・添付書類の準備

4. 事業支援計画書の受領
   ↓
   ・商工会議所から発行（通常1週間程度）
   ・内容の確認

5. 申請書の提出
   ↓
   ・Jグランツまたは郵送で提出
   ・提出期限厳守

6. 審査（2〜3ヶ月）
   ↓
   ・書類審査
   ・必要に応じて追加資料提出

7. 採択発表
   ↓
   ・採択通知の受領
   ・交付申請書の提出

8. 交付決定
   ↓
   ・交付決定通知の受領
   ・事業開始

【重要なポイント】

■ 商工会議所との連携
・必ず事前に相談すること
・複数回の相談を推奨
・事業支援計画書は必須

■ 計画書作成のコツ
・具体的な数値目標を設定
・地域への貢献を明記
・写真や図表を活用
・専門用語は避ける

■ 経費計上の注意点
・補助対象経費を正確に理解
・相見積もりの取得
・按分計算の根拠明示
・消費税の取り扱い注意

■ 採択のポイント
・新規性・独自性のアピール
・実現可能性の説明
・地域経済への波及効果
・数値目標の妥当性

【よくある不採択理由】
× 計画の具体性不足
× 数値目標が不明確
× 経費の妥当性説明不足
× 実現可能性の疑問
× 書類不備・記載ミス

【お問い合わせ】
ご不明な点は、お近くの商工会議所までお問い合わせください。

※本ガイドは参考情報です。
　最新の公募要領を必ずご確認ください。
"""
            
            # ファイル保存
            file_path = output_dir / "申請ガイド.txt"
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            return file_path
            
        except Exception as e:
            logger.error(f"申請ガイド作成エラー: {str(e)}")
            raise
    
    # AI生成メソッド群
    
    async def _generate_company_overview(self, context: Dict[str, Any]) -> str:
        """企業概要生成"""
        prompt = f"""
以下の情報を基に、小規模事業者持続化補助金の経営計画書用の企業概要を作成してください。

企業名：{context['company_name']}
業種：{context['industry']}
従業員数：{context['employee_count']}人
設立年：{context['establishment_year']}年
前年度売上：{context['last_year_sales']:,}円

要件：
- 200-300文字程度
- 事業内容、特徴、実績を含める
- 地域との関わりに言及
- 小規模事業者としての強みを強調
"""
        
        response = await self.ai_service.generate_text(
            prompt=prompt,
            provider=AIProvider.ANTHROPIC,
            options={"temperature": 0.7}
        )
        
        return response.content if response.success else "企業概要の生成に失敗しました。"
    
    async def _generate_market_analysis(self, context: Dict[str, Any]) -> str:
        """市場分析生成"""
        prompt = f"""
以下の情報を基に、顧客ニーズと市場動向の分析を作成してください。

業種：{context['industry']}
ターゲット顧客：{context['target_customers']}
現状：{context['current_situation']}

要件：
- 300-400文字程度
- 具体的な顧客ニーズを3つ以上
- 市場の変化・トレンドに言及
- 地域特性を考慮
- データや統計があれば活用
"""
        
        response = await self.ai_service.generate_text(
            prompt=prompt,
            provider=AIProvider.ANTHROPIC,
            options={"temperature": 0.7}
        )
        
        return response.content if response.success else "市場分析の生成に失敗しました。"
    
    async def _generate_strengths_analysis(self, context: Dict[str, Any]) -> str:
        """自社の強み分析生成"""
        prompt = f"""
以下の情報を基に、自社の強みを分析してください。

企業名：{context['company_name']}
業種：{context['industry']}
従業員数：{context['employee_count']}人

要件：
- 250-350文字程度
- 具体的な強みを3つ以上
- 競合との差別化ポイント
- 顧客からの評価
- 小規模ならではの機動力に言及
"""
        
        response = await self.ai_service.generate_text(
            prompt=prompt,
            provider=AIProvider.ANTHROPIC,
            options={"temperature": 0.7}
        )
        
        return response.content if response.success else "強み分析の生成に失敗しました。"
    
    async def _generate_business_strategy(self, context: Dict[str, Any]) -> str:
        """経営方針・戦略生成"""
        prompt = f"""
以下の情報を基に、経営方針と今後の事業戦略を作成してください。

現在の課題：{context['challenges']}
ターゲット顧客：{context['target_customers']}

要件：
- 300-400文字程度
- 3年後のビジョンを明確に
- 具体的な取り組み方針
- 地域貢献の視点
- 持続可能な成長戦略
"""
        
        response = await self.ai_service.generate_text(
            prompt=prompt,
            provider=AIProvider.ANTHROPIC,
            options={"temperature": 0.7}
        )
        
        return response.content if response.success else "経営戦略の生成に失敗しました。"
    
    async def _generate_project_content(self, context: Dict[str, Any]) -> str:
        """補助事業内容生成"""
        prompt = f"""
以下の情報を基に、補助事業の具体的内容を作成してください。

事業名：{context['project_title']}
目的：{context['purpose']}
予算：{context['total_budget']:,}円

要件：
- 400-500文字程度
- 具体的な実施内容
- 新規性・独自性を強調
- 実施方法の詳細
- 期待される成果
"""
        
        response = await self.ai_service.generate_text(
            prompt=prompt,
            provider=AIProvider.ANTHROPIC,
            options={"temperature": 0.7}
        )
        
        return response.content if response.success else "事業内容の生成に失敗しました。"
    
    async def _generate_sales_expansion_plan(self, context: Dict[str, Any]) -> str:
        """販路開拓計画生成"""
        prompt = f"""
以下の情報を基に、販路開拓の具体的な取り組み内容を作成してください。

販路開拓戦略：{context['sales_strategy']}
期待効果：{context['expected_effects']}

要件：
- 350-450文字程度
- 具体的な手法を3つ以上
- ターゲット顧客へのアプローチ方法
- 差別化ポイント
- 実施スケジュール
"""
        
        response = await self.ai_service.generate_text(
            prompt=prompt,
            provider=AIProvider.ANTHROPIC,
            options={"temperature": 0.7}
        )
        
        return response.content if response.success else "販路開拓計画の生成に失敗しました。"
    
    async def _generate_efficiency_plan(self, context: Dict[str, Any]) -> str:
        """業務効率化計画生成"""
        prompt = f"""
補助事業に関連する業務効率化の取り組みを作成してください。

要件：
- 200-300文字程度
- ITツール活用
- 業務プロセス改善
- 時間短縮効果
- コスト削減効果
"""
        
        response = await self.ai_service.generate_text(
            prompt=prompt,
            provider=AIProvider.ANTHROPIC,
            options={"temperature": 0.7}
        )
        
        return response.content if response.success else "効率化計画の生成に失敗しました。"
    
    async def _generate_expense_description(self, expense_type: str) -> str:
        """経費説明生成"""
        descriptions = {
            "広報費": "チラシ・パンフレット作成、新聞広告掲載等",
            "ウェブサイト関連費": "ホームページ制作・改修、SEO対策等",
            "展示会等出展費": "展示会出展料、ブース装飾費等",
            "旅費": "展示会等への出張旅費（交通費・宿泊費）",
            "開発費": "新商品・サービスの試作開発費用",
            "資料購入費": "事業実施に必要な図書・資料等",
            "雑役務費": "臨時アルバイト代、業務委託費等",
            "借料": "機器・設備等のレンタル・リース料",
            "機械装置等費": "事業に必要な機械装置の購入費",
            "設備処分費": "既存設備の撤去・処分費用",
            "委託費": "専門家への業務委託費用",
            "外注費": "業務の一部を外部に委託する費用"
        }
        
        return descriptions.get(expense_type, "補助事業実施に必要な経費")
    
    async def _generate_implementation_schedule(self, project_info: JizokukaProjectInfo) -> str:
        """実施スケジュール生成"""
        start = project_info.start_date
        end = project_info.end_date
        duration_months = (end.year - start.year) * 12 + end.month - start.month
        
        schedule = f"""交付決定日〜{end.strftime('%Y年%m月')}（約{duration_months}ヶ月間）

【月別実施計画】
"""
        
        # 月別計画を生成
        for i in range(duration_months):
            month = start.month + i
            year = start.year + (month - 1) // 12
            month = ((month - 1) % 12) + 1
            
            if i == 0:
                schedule += f"{year}年{month}月：事業準備、発注手続き\n"
            elif i < duration_months - 1:
                schedule += f"{year}年{month}月：事業実施、進捗管理\n"
            else:
                schedule += f"{year}年{month}月：事業完了、実績報告書作成\n"
        
        return schedule
    
    async def _save_application_data(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ):
        """申請データ保存"""
        try:
            # データをJSON形式で保存
            data_dict = {
                "application_id": application_data.application_id,
                "created_at": application_data.created_at.isoformat(),
                "updated_at": application_data.updated_at.isoformat(),
                "status": application_data.status,
                "company_info": {
                    "company_name": application_data.company_info.company_name,
                    "representative_name": application_data.company_info.representative_name,
                    "postal_code": application_data.company_info.postal_code,
                    "address": application_data.company_info.address,
                    "phone": application_data.company_info.phone,
                    "email": application_data.company_info.email,
                    "business_type": application_data.company_info.business_type.value,
                    "employee_count": application_data.company_info.employee_count,
                    "main_business": application_data.company_info.main_business,
                    "last_year_sales": application_data.company_info.last_year_sales
                },
                "project_info": {
                    "project_title": application_data.project_info.project_title,
                    "purpose": application_data.project_info.purpose.value,
                    "total_budget": application_data.project_info.total_budget,
                    "subsidy_amount": application_data.project_info.subsidy_amount,
                    "expense_breakdown": application_data.project_info.expense_breakdown,
                    "sales_increase_rate": application_data.project_info.sales_increase_rate,
                    "new_customer_count": application_data.project_info.new_customer_count
                },
                "documents": {k.value: v for k, v in application_data.documents.items()},
                "metadata": application_data.metadata
            }
            
            file_path = output_dir / "application_data.json"
            with open(file_path, 'w', encoding='utf-8') as f:
                json.dump(data_dict, f, ensure_ascii=False, indent=2)
            
            logger.info(f"申請データ保存完了: {file_path}")
            
        except Exception as e:
            logger.error(f"申請データ保存エラー: {str(e)}")
            raise
    
    def _load_document_templates(self) -> Dict[str, str]:
        """文書テンプレート読み込み"""
        # 実際の実装では外部ファイルから読み込む
        return {}
    
    async def validate_application(
        self,
        application_data: JizokukaApplicationData
    ) -> Dict[str, Any]:
        """申請内容検証"""
        validation_results = {
            "is_valid": True,
            "errors": [],
            "warnings": [],
            "suggestions": []
        }
        
        # 企業情報検証
        if application_data.company_info.employee_count > 20:
            if application_data.company_info.main_business not in ["製造業", "建設業", "運輸業"]:
                validation_results["errors"].append("従業員数が小規模事業者の定義を超えています（商業・サービス業は5人以下）")
                validation_results["is_valid"] = False
        
        # 補助金額検証
        if application_data.project_info.subsidy_amount > application_data.project_info.total_budget * 0.75:
            validation_results["errors"].append("補助金額が補助率上限（3/4）を超えています")
            validation_results["is_valid"] = False
        
        # 経費検証
        if not application_data.project_info.expense_breakdown:
            validation_results["errors"].append("経費内訳が入力されていません")
            validation_results["is_valid"] = False
        
        # 警告・提案
        if application_data.project_info.sales_increase_rate < 0.05:
            validation_results["warnings"].append("売上増加率目標が低い可能性があります（5%未満）")
        
        if not application_data.company_info.chamber_member:
            validation_results["suggestions"].append("商工会議所の会員になることで、より充実したサポートを受けられます")
        
        return validation_results