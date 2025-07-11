"""
持続化補助金申請Web インターフェース
Streamlitを使用した簡易申請画面
"""

import streamlit as st
import asyncio
from datetime import datetime, timedelta
import json
import os
import sys
from pathlib import Path

# パス設定
sys.path.append(str(Path(__file__).parent.parent.parent))

from src.services.jizokuka_subsidy_service_mock import (
    JizokukaSubsidyService,
    JizokukaCompanyInfo,
    JizokukaProjectInfo,
    BusinessType,
    SubsidyPurpose
)


def main():
    st.set_page_config(
        page_title="小規模事業者持続化補助金 申請書作成システム",
        page_icon="📋",
        layout="wide"
    )
    
    st.title("📋 小規模事業者持続化補助金 申請書作成システム")
    st.markdown("### 最低限の情報入力で申請書類一式を自動作成")
    
    # セッション状態初期化
    if 'generated' not in st.session_state:
        st.session_state.generated = False
    if 'application_data' not in st.session_state:
        st.session_state.application_data = None
    
    # タブ作成
    tab1, tab2, tab3, tab4 = st.tabs(["📝 基本情報入力", "💰 事業計画入力", "✅ 確認・生成", "📄 生成結果"])
    
    with tab1:
        st.header("企業基本情報")
        
        col1, col2 = st.columns(2)
        
        with col1:
            company_name = st.text_input("企業名 *", placeholder="株式会社サンプル")
            representative_name = st.text_input("代表者名 *", placeholder="山田太郎")
            postal_code = st.text_input("郵便番号 *", placeholder="123-4567")
            address = st.text_area("住所 *", placeholder="東京都千代田区○○1-2-3")
            
        with col2:
            phone = st.text_input("電話番号 *", placeholder="03-1234-5678")
            email = st.text_input("メールアドレス *", placeholder="info@example.com")
            business_type = st.selectbox(
                "事業形態 *",
                options=[
                    ("法人", BusinessType.CORPORATION),
                    ("個人事業主", BusinessType.INDIVIDUAL)
                ],
                format_func=lambda x: x[0]
            )
            employee_count = st.number_input("従業員数 *", min_value=0, max_value=20, value=5)
        
        st.subheader("事業情報")
        
        col3, col4 = st.columns(2)
        
        with col3:
            main_business = st.text_area("主な事業内容 *", placeholder="飲食店経営、地域特産品の製造販売など")
            establishment_year = st.number_input("設立年", min_value=1900, max_value=2024, value=2020)
            
        with col4:
            last_year_sales = st.number_input("前年度売上高（円）", min_value=0, value=10000000, step=1000000)
            chamber_member = st.checkbox("商工会議所会員", value=True)
            if chamber_member:
                chamber_name = st.text_input("所属商工会議所名", placeholder="○○商工会議所")
            else:
                chamber_name = ""
    
    with tab2:
        st.header("補助事業計画")
        
        project_title = st.text_input(
            "事業名 *",
            placeholder="例：地域特産品のオンライン販売強化による販路拡大事業"
        )
        
        purpose = st.selectbox(
            "事業の主な目的 *",
            options=[
                ("販路開拓", SubsidyPurpose.SALES_EXPANSION),
                ("生産性向上", SubsidyPurpose.PRODUCTIVITY),
                ("新商品・サービス開発", SubsidyPurpose.NEW_PRODUCT),
                ("デジタル化推進", SubsidyPurpose.DIGITALIZATION),
                ("地域貢献", SubsidyPurpose.REGIONAL_CONTRIBUTION)
            ],
            format_func=lambda x: x[0]
        )
        
        col5, col6 = st.columns(2)
        
        with col5:
            st.subheader("実施期間")
            start_date = st.date_input("開始予定日", value=datetime.now() + timedelta(days=60))
            end_date = st.date_input("終了予定日", value=datetime.now() + timedelta(days=240))
        
        with col6:
            st.subheader("予算")
            total_budget = st.number_input("総事業費（円）*", min_value=100000, value=1500000, step=100000)
            subsidy_amount = st.number_input(
                "希望補助金額（円）*",
                min_value=0,
                max_value=min(int(total_budget * 0.75), 2000000),
                value=min(int(total_budget * 0.67), 1000000),
                step=100000
            )
        
        st.subheader("事業内容")
        
        current_situation = st.text_area(
            "現状 *",
            placeholder="現在の事業状況、売上状況、顧客層などを記入"
        )
        
        challenges = st.text_area(
            "課題 *",
            placeholder="現在抱えている課題を箇条書きで記入（改行で区切る）"
        )
        
        target_customers = st.text_input(
            "ターゲット顧客 *",
            placeholder="例：30-40代の子育て世代、地域の高齢者など"
        )
        
        sales_strategy = st.text_area(
            "販路開拓戦略 *",
            placeholder="どのような方法で新規顧客を獲得するか具体的に記入"
        )
        
        st.subheader("経費内訳")
        
        expense_types = [
            "広報費",
            "ウェブサイト関連費",
            "展示会等出展費",
            "旅費",
            "開発費",
            "資料購入費",
            "雑役務費",
            "借料",
            "機械装置等費",
            "委託費",
            "外注費"
        ]
        
        expense_breakdown = {}
        
        col7, col8 = st.columns(2)
        
        total_expense = 0
        for i, expense_type in enumerate(expense_types):
            if i % 2 == 0:
                with col7:
                    amount = st.number_input(f"{expense_type}（円）", min_value=0, value=0, step=10000, key=f"expense_{i}")
            else:
                with col8:
                    amount = st.number_input(f"{expense_type}（円）", min_value=0, value=0, step=10000, key=f"expense_{i}")
            
            if amount > 0:
                expense_breakdown[expense_type] = amount
                total_expense += amount
        
        if total_expense > 0:
            st.info(f"経費合計: {total_expense:,}円 / 総事業費: {total_budget:,}円")
            if total_expense != total_budget:
                st.error("経費合計と総事業費が一致していません")
        
        st.subheader("期待効果（数値目標）")
        
        col9, col10 = st.columns(2)
        
        with col9:
            sales_increase_rate = st.slider("売上増加率目標（%）", min_value=0, max_value=100, value=20) / 100
            new_customer_count = st.number_input("新規顧客獲得目標（件/年）", min_value=0, value=50)
        
        with col10:
            productivity_improvement = st.slider("生産性向上率目標（%）", min_value=0, max_value=50, value=10) / 100
            expected_effects = st.text_area(
                "その他の期待効果",
                placeholder="箇条書きで記入（改行で区切る）"
            )
    
    with tab3:
        st.header("入力内容確認")
        
        # 入力検証
        is_valid = True
        errors = []
        
        # 必須項目チェック
        if not all([company_name, representative_name, postal_code, address, phone, email]):
            errors.append("企業基本情報に未入力項目があります")
            is_valid = False
        
        if not all([project_title, current_situation, challenges, target_customers, sales_strategy]):
            errors.append("事業計画に未入力項目があります")
            is_valid = False
        
        if not expense_breakdown:
            errors.append("経費内訳が入力されていません")
            is_valid = False
        
        if total_expense != total_budget:
            errors.append("経費合計と総事業費が一致していません")
            is_valid = False
        
        # エラー表示
        if errors:
            for error in errors:
                st.error(error)
        else:
            st.success("入力内容に問題はありません")
        
        # 入力内容サマリー
        st.subheader("入力内容サマリー")
        
        col11, col12 = st.columns(2)
        
        with col11:
            st.write("**企業情報**")
            st.write(f"- 企業名: {company_name}")
            st.write(f"- 代表者: {representative_name}")
            st.write(f"- 従業員数: {employee_count}人")
            st.write(f"- 前年度売上: {last_year_sales:,}円")
        
        with col12:
            st.write("**事業計画**")
            st.write(f"- 事業名: {project_title}")
            st.write(f"- 総事業費: {total_budget:,}円")
            st.write(f"- 希望補助金額: {subsidy_amount:,}円")
            st.write(f"- 売上増加目標: {sales_increase_rate*100:.0f}%")
        
        # 生成ボタン
        st.markdown("---")
        
        if st.button("📄 申請書類を生成", type="primary", disabled=not is_valid):
            with st.spinner("申請書類を生成中です...（1-2分かかります）"):
                # 企業情報作成
                company_info = JizokukaCompanyInfo(
                    company_name=company_name,
                    representative_name=representative_name,
                    postal_code=postal_code,
                    address=address,
                    phone=phone,
                    email=email,
                    business_type=business_type[1],
                    establishment_date=datetime(establishment_year, 1, 1),
                    employee_count=employee_count,
                    main_business=main_business,
                    last_year_sales=last_year_sales,
                    chamber_member=chamber_member,
                    chamber_name=chamber_name
                )
                
                # プロジェクト情報作成
                project_info = JizokukaProjectInfo(
                    project_title=project_title,
                    purpose=purpose[1],
                    start_date=datetime.combine(start_date, datetime.min.time()),
                    end_date=datetime.combine(end_date, datetime.min.time()),
                    total_budget=total_budget,
                    subsidy_amount=subsidy_amount,
                    current_situation=current_situation,
                    challenges=challenges.split('\n') if challenges else [],
                    target_customers=target_customers,
                    sales_strategy=sales_strategy,
                    expected_effects=expected_effects.split('\n') if expected_effects else [],
                    expense_breakdown=expense_breakdown,
                    sales_increase_rate=sales_increase_rate,
                    new_customer_count=new_customer_count,
                    productivity_improvement=productivity_improvement
                )
                
                # サービス実行
                service = JizokukaSubsidyService()
                
                try:
                    # 非同期関数を同期的に実行
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    application_data = loop.run_until_complete(
                        service.create_complete_application(company_info, project_info)
                    )
                    
                    st.session_state.generated = True
                    st.session_state.application_data = application_data
                    st.success("申請書類の生成が完了しました！")
                    st.balloons()
                    
                except Exception as e:
                    st.error(f"エラーが発生しました: {str(e)}")
    
    with tab4:
        st.header("生成結果")
        
        if st.session_state.generated and st.session_state.application_data:
            application_data = st.session_state.application_data
            
            st.success(f"申請ID: {application_data.application_id}")
            st.info(f"出力先: {application_data.metadata.get('output_directory', '')}")
            
            # 生成された書類一覧
            st.subheader("生成された書類")
            
            for doc_type, file_path in application_data.documents.items():
                file_name = Path(file_path).name
                st.write(f"✅ {file_name}")
            
            # 追加ファイル
            st.write(f"✅ 提出書類チェックリスト")
            st.write(f"✅ 申請ガイド")
            
            # ダウンロードセクション
            st.subheader("ダウンロード")
            
            # 各ファイルのダウンロードボタン
            for doc_type, file_path in application_data.documents.items():
                if os.path.exists(file_path):
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    file_name = Path(file_path).name
                    st.download_button(
                        label=f"📥 {file_name}をダウンロード",
                        data=content,
                        file_name=file_name,
                        mime="text/plain"
                    )
            
            # 次のステップ
            st.subheader("次のステップ")
            
            st.markdown("""
            1. **商工会議所への相談予約**
               - 生成された書類を持参して相談
               - 事業支援計画書の発行を依頼
            
            2. **書類の最終確認**
               - 生成された内容を確認・修正
               - 必要に応じて詳細を追加
            
            3. **添付書類の準備**
               - 決算書（直近2期分）
               - 見積書（10万円以上の経費）
               - その他必要書類
            
            4. **申請書の提出**
               - Jグランツまたは郵送で提出
               - 提出期限を厳守
            """)
            
            # 再生成ボタン
            if st.button("🔄 新しい申請書を作成"):
                st.session_state.generated = False
                st.session_state.application_data = None
                st.experimental_rerun()
        
        else:
            st.info("申請書類を生成するには、「確認・生成」タブで生成ボタンをクリックしてください。")


if __name__ == "__main__":
    main()