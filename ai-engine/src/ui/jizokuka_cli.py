"""
持続化補助金申請CLI
コマンドラインから最小限の入力で申請書作成
"""

import asyncio
import json
from datetime import datetime, timedelta
from pathlib import Path
import click
from typing import Dict, Any

import sys
import os
from pathlib import Path

# 親ディレクトリをパスに追加
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.services.jizokuka_subsidy_service_mock import (
    JizokukaSubsidyService,
    JizokukaCompanyInfo,
    JizokukaProjectInfo,
    BusinessType,
    SubsidyPurpose
)


@click.command()
@click.option('--quick', is_flag=True, help='最小限の入力で申請書を生成')
@click.option('--config', type=click.Path(exists=True), help='設定ファイルから読み込み')
@click.option('--output', default='output/jizokuka', help='出力ディレクトリ')
def main(quick: bool, config: str, output: str):
    """小規模事業者持続化補助金 申請書作成CLI"""
    
    click.echo("=" * 60)
    click.echo("小規模事業者持続化補助金 申請書作成システム")
    click.echo("=" * 60)
    
    if config:
        # 設定ファイルから読み込み
        data = load_from_config(config)
    elif quick:
        # クイックモード（最小限の入力）
        data = quick_input_mode()
    else:
        # 通常モード（詳細入力）
        data = detailed_input_mode()
    
    # 申請書生成
    click.echo("\n申請書類を生成中...")
    
    try:
        # 非同期関数を実行
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
        service = JizokukaSubsidyService(output_dir=output)
        application_data = loop.run_until_complete(
            service.create_complete_application(
                data['company_info'],
                data['project_info']
            )
        )
        
        click.echo("\n✅ 申請書類の生成が完了しました！")
        click.echo(f"申請ID: {application_data.application_id}")
        click.echo(f"出力先: {application_data.metadata.get('output_directory', '')}")
        
        click.echo("\n生成された書類:")
        for doc_type, file_path in application_data.documents.items():
            click.echo(f"  - {Path(file_path).name}")
        
        click.echo("\n次のステップ:")
        click.echo("1. 商工会議所に相談予約を入れてください")
        click.echo("2. 生成された書類を確認・修正してください")
        click.echo("3. 必要な添付書類を準備してください")
        click.echo("4. 期限内に申請書を提出してください")
        
    except Exception as e:
        click.echo(f"\n❌ エラーが発生しました: {str(e)}", err=True)
        raise


def quick_input_mode() -> Dict[str, Any]:
    """クイック入力モード（最小限の情報）"""
    click.echo("\n【クイック入力モード】最小限の情報で申請書を生成します")
    
    # 企業基本情報
    click.echo("\n■ 企業基本情報")
    company_name = click.prompt("企業名", default="サンプル商店")
    representative_name = click.prompt("代表者名", default="山田太郎")
    employee_count = click.prompt("従業員数", type=int, default=3)
    main_business = click.prompt("主な事業内容", default="小売業")
    
    # 事業計画
    click.echo("\n■ 事業計画")
    project_title = click.prompt(
        "事業名",
        default="ホームページ作成による販路拡大事業"
    )
    total_budget = click.prompt("総事業費（円）", type=int, default=1500000)
    
    # デフォルト値で企業情報作成
    company_info = JizokukaCompanyInfo(
        company_name=company_name,
        representative_name=representative_name,
        postal_code="123-4567",
        address="東京都千代田区サンプル町1-2-3",
        phone="03-1234-5678",
        email="info@sample.com",
        business_type=BusinessType.CORPORATION,
        employee_count=employee_count,
        main_business=main_business,
        last_year_sales=10000000,
        chamber_member=True,
        chamber_name="東京商工会議所"
    )
    
    # デフォルト値でプロジェクト情報作成
    project_info = JizokukaProjectInfo(
        project_title=project_title,
        purpose=SubsidyPurpose.SALES_EXPANSION,
        start_date=datetime.now() + timedelta(days=60),
        end_date=datetime.now() + timedelta(days=240),
        total_budget=total_budget,
        subsidy_amount=int(total_budget * 0.67),
        current_situation="現在は店頭販売のみで、新規顧客の獲得に課題がある",
        challenges=["新規顧客の獲得", "売上の伸び悩み", "認知度不足"],
        target_customers="地域の30-50代のファミリー層",
        sales_strategy="ホームページとSNSを活用した情報発信により認知度向上と新規顧客獲得を図る",
        expected_effects=["売上20%向上", "新規顧客月10件獲得", "リピート率向上"],
        expense_breakdown={
            "ウェブサイト関連費": int(total_budget * 0.6),
            "広報費": int(total_budget * 0.3),
            "委託費": int(total_budget * 0.1)
        },
        sales_increase_rate=0.2,
        new_customer_count=120,
        productivity_improvement=0.15
    )
    
    return {
        'company_info': company_info,
        'project_info': project_info
    }


def detailed_input_mode() -> Dict[str, Any]:
    """詳細入力モード"""
    click.echo("\n【詳細入力モード】")
    
    # 企業基本情報
    click.echo("\n■ 企業基本情報")
    company_name = click.prompt("企業名")
    representative_name = click.prompt("代表者名")
    postal_code = click.prompt("郵便番号")
    address = click.prompt("住所")
    phone = click.prompt("電話番号")
    email = click.prompt("メールアドレス")
    
    business_type_str = click.prompt(
        "事業形態",
        type=click.Choice(['法人', '個人']),
        default='法人'
    )
    business_type = BusinessType.CORPORATION if business_type_str == '法人' else BusinessType.INDIVIDUAL
    
    employee_count = click.prompt("従業員数", type=int)
    main_business = click.prompt("主な事業内容")
    last_year_sales = click.prompt("前年度売上高（円）", type=int)
    
    chamber_member = click.confirm("商工会議所会員ですか？", default=True)
    chamber_name = ""
    if chamber_member:
        chamber_name = click.prompt("所属商工会議所名")
    
    # 事業計画
    click.echo("\n■ 事業計画")
    project_title = click.prompt("事業名")
    
    purpose_str = click.prompt(
        "事業の主な目的",
        type=click.Choice(['販路開拓', '生産性向上', '新商品開発', 'デジタル化', '地域貢献']),
        default='販路開拓'
    )
    purpose_map = {
        '販路開拓': SubsidyPurpose.SALES_EXPANSION,
        '生産性向上': SubsidyPurpose.PRODUCTIVITY,
        '新商品開発': SubsidyPurpose.NEW_PRODUCT,
        'デジタル化': SubsidyPurpose.DIGITALIZATION,
        '地域貢献': SubsidyPurpose.REGIONAL_CONTRIBUTION
    }
    purpose = purpose_map[purpose_str]
    
    total_budget = click.prompt("総事業費（円）", type=int)
    subsidy_amount = click.prompt(
        "希望補助金額（円）",
        type=int,
        default=int(total_budget * 0.67)
    )
    
    current_situation = click.prompt("現状を簡潔に説明してください")
    
    click.echo("課題を入力してください（空行で終了）:")
    challenges = []
    while True:
        challenge = click.prompt("", default="", show_default=False)
        if not challenge:
            break
        challenges.append(challenge)
    
    target_customers = click.prompt("ターゲット顧客")
    sales_strategy = click.prompt("販路開拓戦略")
    
    # 経費内訳
    click.echo("\n■ 経費内訳（使用する項目のみ入力、0円は入力不要）")
    expense_types = [
        "広報費", "ウェブサイト関連費", "展示会等出展費",
        "旅費", "開発費", "資料購入費", "雑役務費",
        "借料", "機械装置等費", "委託費", "外注費"
    ]
    
    expense_breakdown = {}
    for expense_type in expense_types:
        amount = click.prompt(f"{expense_type}（円）", type=int, default=0)
        if amount > 0:
            expense_breakdown[expense_type] = amount
    
    # 数値目標
    click.echo("\n■ 数値目標")
    sales_increase_rate = click.prompt("売上増加率目標（%）", type=int, default=20) / 100
    new_customer_count = click.prompt("新規顧客獲得目標（件/年）", type=int, default=50)
    productivity_improvement = click.prompt("生産性向上率目標（%）", type=int, default=10) / 100
    
    # オブジェクト作成
    company_info = JizokukaCompanyInfo(
        company_name=company_name,
        representative_name=representative_name,
        postal_code=postal_code,
        address=address,
        phone=phone,
        email=email,
        business_type=business_type,
        employee_count=employee_count,
        main_business=main_business,
        last_year_sales=last_year_sales,
        chamber_member=chamber_member,
        chamber_name=chamber_name
    )
    
    project_info = JizokukaProjectInfo(
        project_title=project_title,
        purpose=purpose,
        start_date=datetime.now() + timedelta(days=60),
        end_date=datetime.now() + timedelta(days=240),
        total_budget=total_budget,
        subsidy_amount=subsidy_amount,
        current_situation=current_situation,
        challenges=challenges,
        target_customers=target_customers,
        sales_strategy=sales_strategy,
        expected_effects=["売上向上", "新規顧客獲得", "業務効率化"],
        expense_breakdown=expense_breakdown,
        sales_increase_rate=sales_increase_rate,
        new_customer_count=new_customer_count,
        productivity_improvement=productivity_improvement
    )
    
    return {
        'company_info': company_info,
        'project_info': project_info
    }


def load_from_config(config_path: str) -> Dict[str, Any]:
    """設定ファイルから読み込み"""
    with open(config_path, 'r', encoding='utf-8') as f:
        config_data = json.load(f)
    
    # 企業情報
    company_data = config_data['company_info']
    company_info = JizokukaCompanyInfo(
        company_name=company_data['company_name'],
        representative_name=company_data['representative_name'],
        postal_code=company_data['postal_code'],
        address=company_data['address'],
        phone=company_data['phone'],
        email=company_data.get('email', ''),
        business_type=BusinessType[company_data.get('business_type', 'CORPORATION')],
        employee_count=company_data.get('employee_count', 5),
        main_business=company_data.get('main_business', ''),
        last_year_sales=company_data.get('last_year_sales', 0),
        chamber_member=company_data.get('chamber_member', True),
        chamber_name=company_data.get('chamber_name', '')
    )
    
    # プロジェクト情報
    project_data = config_data['project_info']
    project_info = JizokukaProjectInfo(
        project_title=project_data['project_title'],
        purpose=SubsidyPurpose[project_data['purpose']],
        start_date=datetime.fromisoformat(project_data['start_date']),
        end_date=datetime.fromisoformat(project_data['end_date']),
        total_budget=project_data['total_budget'],
        subsidy_amount=project_data['subsidy_amount'],
        current_situation=project_data['current_situation'],
        challenges=project_data['challenges'],
        target_customers=project_data['target_customers'],
        sales_strategy=project_data['sales_strategy'],
        expected_effects=project_data.get('expected_effects', []),
        expense_breakdown=project_data['expense_breakdown'],
        sales_increase_rate=project_data.get('sales_increase_rate', 0.2),
        new_customer_count=project_data.get('new_customer_count', 50),
        productivity_improvement=project_data.get('productivity_improvement', 0.1)
    )
    
    return {
        'company_info': company_info,
        'project_info': project_info
    }


if __name__ == '__main__':
    main()