"""
モックサービスのテストスクリプト
"""

import asyncio
from datetime import datetime, timedelta
from src.services.jizokuka_subsidy_service_mock import (
    JizokukaSubsidyService,
    JizokukaCompanyInfo,
    JizokukaProjectInfo,
    BusinessType,
    SubsidyPurpose
)


async def test_mock_service():
    """モックサービスをテスト"""
    # テストデータ作成
    company_info = JizokukaCompanyInfo(
        company_name="テスト商店",
        representative_name="山田太郎",
        postal_code="123-4567",
        address="東京都千代田区テスト町1-2-3",
        phone="03-1234-5678",
        email="test@example.com",
        business_type=BusinessType.CORPORATION,
        employee_count=5,
        main_business="小売業",
        last_year_sales=10000000,
        chamber_member=True,
        chamber_name="東京商工会議所"
    )
    
    project_info = JizokukaProjectInfo(
        project_title="Webサイト構築による販路拡大事業",
        purpose=SubsidyPurpose.SALES_EXPANSION,
        start_date=datetime.now() + timedelta(days=60),
        end_date=datetime.now() + timedelta(days=240),
        total_budget=1500000,
        subsidy_amount=1000000,
        current_situation="現在は店頭販売のみ",
        challenges=["新規顧客獲得", "売上向上"],
        target_customers="地域の30-50代",
        sales_strategy="Webサイトを活用した集客",
        expected_effects=["売上20%向上", "新規顧客獲得"],
        expense_breakdown={
            "ウェブサイト関連費": 900000,
            "広報費": 450000,
            "委託費": 150000
        },
        sales_increase_rate=0.2,
        new_customer_count=100,
        productivity_improvement=0.15
    )
    
    # サービス実行
    service = JizokukaSubsidyService()
    application_data = await service.create_complete_application(
        company_info, project_info
    )
    
    print(f"✅ 申請書作成完了")
    print(f"申請ID: {application_data.application_id}")
    print(f"出力先: {application_data.metadata.get('output_directory')}")
    print(f"\n生成された書類:")
    for doc_type, path in application_data.documents.items():
        print(f"  - {doc_type.value}: {path}")


if __name__ == "__main__":
    asyncio.run(test_mock_service())