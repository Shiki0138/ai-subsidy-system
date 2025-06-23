"""
小規模事業者持続化補助金専用サービス（モック版）
外部API依存なしで動作するバージョン
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
    """小規模事業者持続化補助金サービス（モック版）"""
    
    def __init__(self, output_dir: str = "output/jizokuka"):
        """初期化"""
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        logger.info("持続化補助金サービス（モック版）初期化完了")
    
    async def create_complete_application(
        self,
        company_info: JizokukaCompanyInfo,
        project_info: JizokukaProjectInfo,
        application_id: Optional[str] = None
    ) -> JizokukaApplicationData:
        """
        完全な申請書類一式を作成（モック版）
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
        company = application_data.company_info
        project = application_data.project_info
        
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
    
    async def _create_form2_business_plan(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ) -> Path:
        """様式2：経営計画書作成（モック版）"""
        company = application_data.company_info
        project = application_data.project_info
        
        # モック生成内容
        content = f"""
経営計画書（様式２）

申請者名：{company.company_name}

１．企業概要

{company.company_name}は、{company.establishment_date.year}年に設立された{company.main_business}を主要事業とする企業です。
従業員{company.employee_count}名の小規模ながら、地域に密着したサービスを提供し、顧客からの信頼を獲得してきました。
前年度売上高は{company.last_year_sales:,}円で、地域経済の活性化に貢献しています。

創業以来、品質とサービスにこだわり、お客様のニーズに応える商品・サービスを提供してまいりました。
地域の皆様に支えられ、着実に事業を拡大してきた実績があります。

２．顧客ニーズと市場の動向

【顧客ニーズ】
・高品質な商品・サービスへの需要増加
・オンラインでの購買行動の拡大
・地域特産品への関心の高まり
・環境に配慮した商品への需要

【市場動向】
近年、デジタル化の進展により、消費者の購買行動は大きく変化しています。
特にコロナ禍以降、オンラインでの商品購入が一般化し、実店舗だけでなくネット販売への対応が不可欠となっています。
また、地域の特色を活かした商品への需要も高まっており、差別化された商品・サービスが求められています。

３．自社や自社の提供する商品・サービスの強み

【自社の強み】
・{company.employee_count}名の少数精鋭による機動的な経営
・地域に根ざした{company.establishment_date.year - 2020}年以上の実績
・顧客との直接的なコミュニケーション
・高品質な商品・サービスの提供能力
・柔軟な対応力と迅速な意思決定

【差別化ポイント】
当社は小規模事業者ならではの強みを活かし、大手企業では対応できないきめ細かなサービスを提供しています。
顧客一人ひとりのニーズに合わせたカスタマイズや、地域特性を活かした独自商品の開発など、
他社にはない価値を提供することで、競争優位性を確保しています。

４．経営方針・目標と今後のプラン

【経営方針】
「地域と共に成長し、顧客満足度No.1を目指す」を経営理念に掲げ、以下の方針で事業を展開します。
・顧客第一主義の徹底
・地域貢献活動の推進
・従業員の能力開発と働きがいのある職場づくり
・持続可能な経営基盤の確立

【今後のプラン】
{project.current_situation}という現状を踏まえ、以下の取り組みを実施します。

1. {project.project_title}の実施
2. 新規顧客層（{project.target_customers}）の開拓
3. 既存顧客のリピート率向上
4. 業務効率化による生産性向上

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
    
    async def _create_form3_subsidy_plan(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ) -> Path:
        """様式3：補助事業計画書作成（モック版）"""
        company = application_data.company_info
        project = application_data.project_info
        
        content = f"""
補助事業計画書（様式３）

申請者名：{company.company_name}

１．補助事業で行う事業名
{project.project_title}

２．補助事業の内容
2-1．補助事業の具体的内容

本事業では、{project.purpose.value}を目的として、以下の取り組みを実施します。

【実施内容】
{project.sales_strategy}

【具体的な取り組み】
1. 現状分析と課題の明確化
   - 現在の顧客層と売上構成の分析
   - 競合他社の動向調査
   - 自社の強み・弱みの整理

2. 実施計画の策定
   - ターゲット顧客（{project.target_customers}）の詳細分析
   - 具体的な販売戦略の立案
   - 実施スケジュールの作成

3. 事業の実施
   - 各種ツール・システムの導入
   - マーケティング活動の展開
   - 効果測定と改善

2-2．販路開拓等（生産性向上）の取組内容

【販路開拓の方法】
1. デジタルマーケティングの活用
   - ホームページの充実とSEO対策
   - SNSを活用した情報発信
   - オンライン広告の実施

2. 新規顧客へのアプローチ
   - ターゲット層に向けた訴求力のあるコンテンツ作成
   - 顧客ニーズに合わせた商品・サービスの提案
   - アフターフォローの充実

3. リピート顧客の獲得
   - 顧客満足度向上施策の実施
   - 会員制度やポイント制度の導入検討
   - 定期的な情報提供

2-3．業務効率化（生産性向上）の取組内容【任意記入】

本事業と併せて、以下の業務効率化を図ります。
・ITツールの活用による業務時間の短縮
・作業プロセスの見直しと標準化
・従業員のスキルアップ研修の実施

これにより、生産性を{project.productivity_improvement*100:.1f}%向上させ、より多くの顧客対応が可能となります。

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
            description = self._get_expense_description(expense_type)
            content += f"""
({i}) {expense_type}
　　内容：{description}
　　金額：{amount:,}円（税込）
"""
            total += amount
        
        content += f"""
補助対象経費合計：{total:,}円
補助金申請額：{project.subsidy_amount:,}円（補助率2/3）

５．実施スケジュール
"""
        # スケジュール生成
        schedule = self._generate_implementation_schedule(project)
        content += schedule
        
        # ファイル保存
        file_path = output_dir / "様式3_補助事業計画書.txt"
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(content)
        
        return file_path
    
    async def _create_estimate_template(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ) -> Path:
        """見積書テンプレート作成"""
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
            description = self._get_expense_description(expense_type)
            content += f"""
{i}. {expense_type}
　　内容：{description}
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
    
    async def _create_document_checklist(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ) -> Path:
        """提出書類チェックリスト作成"""
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
    
    async def _create_application_guide(
        self,
        application_data: JizokukaApplicationData,
        output_dir: Path
    ) -> Path:
        """申請ガイド作成"""
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
    
    def _get_expense_description(self, expense_type: str) -> str:
        """経費説明取得"""
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
    
    def _generate_implementation_schedule(self, project_info: JizokukaProjectInfo) -> str:
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