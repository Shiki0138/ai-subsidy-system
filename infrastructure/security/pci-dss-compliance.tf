# PCI DSS準拠・セキュリティ・コンプライアンス実装
# Team D: Infrastructure & Monitoring
# Created: 2025-06-20
# Purpose: PCI DSS準拠とセキュリティ強化（Week 4-5）

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# =================================
# PCI DSS Requirement 1: ファイアウォール設定
# =================================

# WAF v2 with comprehensive rules
resource "aws_wafv2_web_acl" "payment_pci_waf" {
  name  = "${var.project_name}-payment-pci-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # Rule 1: AWS Managed Common Rule Set
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"

        # カスタム除外ルール
        excluded_rule {
          name = "SizeRestrictions_BODY"
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: OWASP Top 10
  rule {
    name     = "AWSManagedRulesOWASPTop10RuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesOWASPTop10RuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "OWASPTop10Metric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: SQL インジェクション対策
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 3

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "SQLiRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4: レート制限（決済API保護）
  rule {
    name     = "PaymentRateLimitRule"
    priority = 4

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 100  # 100 requests per 5 minutes
        aggregate_key_type = "IP"

        scope_down_statement {
          byte_match_statement {
            search_string = "/api/payment"
            field_to_match {
              uri_path {}
            }
            text_transformation {
              priority = 0
              type     = "LOWERCASE"
            }
            positional_constraint = "STARTS_WITH"
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "PaymentRateLimitMetric"
      sampled_requests_enabled   = true
    }
  }

  # Rule 5: 地理的制限（必要に応じて）
  rule {
    name     = "GeoRestrictionRule"
    priority = 5

    action {
      block {}
    }

    statement {
      geo_match_statement {
        # 高リスク国からのアクセスを制限
        country_codes = ["CN", "RU", "KP", "IR"]
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "GeoRestrictionMetric"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    Name        = "${var.project_name}-payment-pci-waf"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-1"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "PaymentPCIWAF"
    sampled_requests_enabled   = true
  }
}

# =================================
# PCI DSS Requirement 2: デフォルトパスワード変更
# =================================

# Secrets Manager for secure credential management
resource "aws_secretsmanager_secret" "pci_compliant_secrets" {
  for_each = {
    stripe_keys = {
      name        = "stripe-api-keys"
      description = "Stripe API keys for payment processing"
    }
    database_master = {
      name        = "rds-master-credentials"
      description = "RDS master user credentials"
    }
    redis_auth = {
      name        = "redis-auth-token"
      description = "Redis authentication token"
    }
    jwt_signing = {
      name        = "jwt-signing-secrets"
      description = "JWT signing keys"
    }
    api_gateway = {
      name        = "api-gateway-keys"
      description = "API Gateway authentication keys"
    }
  }

  name                    = "${var.project_name}-${each.value.name}"
  description            = each.value.description
  kms_key_id             = aws_kms_key.pci_encryption_key.arn
  recovery_window_in_days = 7

  replica {
    region = var.backup_region
    kms_key_id = aws_kms_key.pci_encryption_key_replica.arn
  }

  tags = {
    Name        = "${var.project_name}-${each.value.name}"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-2"
    DataClass   = "Sensitive"
  }
}

# 自動パスワード生成
resource "aws_secretsmanager_secret_version" "auto_generated_passwords" {
  for_each = aws_secretsmanager_secret.pci_compliant_secrets

  secret_id = each.value.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.secure_passwords[each.key].result
  })
}

resource "random_password" "secure_passwords" {
  for_each = aws_secretsmanager_secret.pci_compliant_secrets

  length  = 32
  special = true
  upper   = true
  lower   = true
  numeric = true

  # 特殊文字の制限（一部システムで問題を起こす文字を除外）
  override_special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
}

# =================================
# PCI DSS Requirement 3: カードホルダーデータ保護
# =================================

# KMS キー（暗号化用）
resource "aws_kms_key" "pci_encryption_key" {
  description             = "PCI DSS compliant encryption key for payment data"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow use of the key for payment services"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.payment_service_role.arn,
            aws_iam_role.ecs_task.arn
          ]
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-pci-encryption-key"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-3"
  }
}

resource "aws_kms_alias" "pci_encryption_key" {
  name          = "alias/${var.project_name}-pci-encryption"
  target_key_id = aws_kms_key.pci_encryption_key.key_id
}

# バックアップリージョン用のKMSキー
resource "aws_kms_key" "pci_encryption_key_replica" {
  provider = aws.backup_region

  description             = "PCI DSS compliant encryption key (replica)"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-pci-encryption-key-replica"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-3"
  }
}

# =================================
# PCI DSS Requirement 4: 転送時暗号化
# =================================

# ACM 証明書
resource "aws_acm_certificate" "payment_cert" {
  domain_name       = var.domain_name
  validation_method = "DNS"

  subject_alternative_names = [
    "*.${var.domain_name}",
    "api.${var.domain_name}",
    "payments.${var.domain_name}"
  ]

  lifecycle {
    create_before_destroy = true
  }

  tags = {
    Name        = "${var.project_name}-payment-certificate"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-4"
  }
}

# TLS 1.3 強制設定
resource "aws_lb_listener" "payment_https_pci" {
  load_balancer_arn = aws_lb.payment_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS13-1-2-2021-06"  # TLS 1.3
  certificate_arn   = aws_acm_certificate_validation.payment_cert.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.payment_app.arn
  }

  tags = {
    Name        = "${var.project_name}-payment-https-pci-listener"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-4"
  }
}

# =================================
# PCI DSS Requirement 6: セキュアシステム開発
# =================================

# セキュリティグループ（最小権限原則）
resource "aws_security_group" "payment_app_pci" {
  name_prefix = "${var.project_name}-payment-app-pci-"
  vpc_id      = aws_vpc.payment_vpc.id

  # インバウンド: ALBからのHTTPSのみ
  ingress {
    description     = "HTTPS from ALB only"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  # 管理用SSH（踏み台経由のみ）
  ingress {
    description     = "SSH from bastion only"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  # アウトバウンド: 必要最小限
  egress {
    description = "HTTPS to internet (Stripe API)"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description     = "Database access"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.database.id]
  }

  egress {
    description     = "Redis access"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.redis.id]
  }

  tags = {
    Name        = "${var.project_name}-payment-app-pci-sg"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-6"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# 踏み台サーバー（管理用）
resource "aws_security_group" "bastion" {
  name_prefix = "${var.project_name}-bastion-pci-"
  vpc_id      = aws_vpc.payment_vpc.id

  # 管理者IPからのSSHのみ
  ingress {
    description = "SSH from admin IPs"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = var.admin_cidr_blocks
  }

  egress {
    description = "SSH to payment instances"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name        = "${var.project_name}-bastion-pci-sg"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-6"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# =================================
# PCI DSS Requirement 10: ログとアクセス追跡
# =================================

# CloudTrail（API呼び出し記録）
resource "aws_cloudtrail" "payment_audit_trail" {
  name           = "${var.project_name}-payment-audit-trail"
  s3_bucket_name = aws_s3_bucket.audit_logs.bucket

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = ["kms.amazonaws.com", "rdsdata.amazonaws.com"]

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.audit_logs.arn}/*"]
    }
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  depends_on = [aws_s3_bucket_policy.audit_logs]

  tags = {
    Name        = "${var.project_name}-payment-audit-trail"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-10"
  }
}

# 監査ログ用S3バケット
resource "aws_s3_bucket" "audit_logs" {
  bucket = "${var.project_name}-payment-audit-logs-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "${var.project_name}-audit-logs"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-10"
    DataClass   = "AuditLogs"
  }
}

resource "aws_s3_bucket_encryption" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.pci_encryption_key.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
}

resource "aws_s3_bucket_versioning" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  rule {
    id     = "audit_log_lifecycle"
    status = "Enabled"

    expiration {
      days = 2557  # 7年間保存（PCI DSS要件）
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
  }
}

# CloudTrail用S3バケットポリシー
resource "aws_s3_bucket_policy" "audit_logs" {
  bucket = aws_s3_bucket.audit_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# =================================
# PCI DSS Requirement 11: 定期的なセキュリティテスト
# =================================

# AWS Config for compliance monitoring
resource "aws_config_configuration_recorder" "payment_compliance" {
  name     = "${var.project_name}-payment-compliance-recorder"
  role_arn = aws_iam_role.config_role.arn

  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }

  depends_on = [aws_config_delivery_channel.payment_compliance]
}

resource "aws_config_delivery_channel" "payment_compliance" {
  name           = "${var.project_name}-payment-compliance-channel"
  s3_bucket_name = aws_s3_bucket.compliance_reports.bucket
}

# Config Rules for PCI DSS compliance
resource "aws_config_config_rule" "payment_compliance_rules" {
  for_each = {
    encrypted_volumes = {
      name        = "encrypted-volumes"
      source_identifier = "ENCRYPTED_VOLUMES"
    }
    rds_encrypted = {
      name        = "rds-storage-encrypted"
      source_identifier = "RDS_STORAGE_ENCRYPTED"
    }
    s3_encrypted = {
      name        = "s3-bucket-server-side-encryption-enabled"
      source_identifier = "S3_BUCKET_SERVER_SIDE_ENCRYPTION_ENABLED"
    }
    security_groups_restricted = {
      name        = "incoming-ssh-disabled"
      source_identifier = "INCOMING_SSH_DISABLED"
    }
  }

  name = "${var.project_name}-${each.value.name}"

  source {
    owner             = "AWS"
    source_identifier = each.value.source_identifier
  }

  depends_on = [aws_config_configuration_recorder.payment_compliance]

  tags = {
    Name        = "${var.project_name}-${each.value.name}"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-11"
  }
}

# =================================
# PCI DSS Requirement 12: セキュリティポリシー
# =================================

# IAM ポリシー（最小権限原則）
resource "aws_iam_role" "payment_service_role" {
  name = "${var.project_name}-payment-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["ecs-tasks.amazonaws.com", "lambda.amazonaws.com"]
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-payment-service-role"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-12"
  }
}

resource "aws_iam_role_policy" "payment_service_policy" {
  name = "${var.project_name}-payment-service-policy"
  role = aws_iam_role.payment_service_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          for secret in aws_secretsmanager_secret.pci_compliant_secrets : secret.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = [aws_kms_key.pci_encryption_key.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# コンプライアンス報告用S3バケット
resource "aws_s3_bucket" "compliance_reports" {
  bucket = "${var.project_name}-compliance-reports-${random_string.bucket_suffix.result}"

  tags = {
    Name        = "${var.project_name}-compliance-reports"
    Compliance  = "PCI-DSS"
    Requirement = "Requirement-12"
  }
}

# セキュリティハブ有効化
resource "aws_securityhub_account" "payment_security_hub" {
  enable_default_standards = true

  tags = {
    Name        = "${var.project_name}-security-hub"
    Compliance  = "PCI-DSS"
  }
}

# PCI DSS標準の有効化
resource "aws_securityhub_standards_subscription" "pci_dss" {
  standards_arn = "arn:aws:securityhub:::standard/pci-dss/v/3.2.1"
  depends_on    = [aws_securityhub_account.payment_security_hub]
}

# GuardDuty有効化（脅威検出）
resource "aws_guardduty_detector" "payment_guard_duty" {
  enable = true

  datasources {
    s3_logs {
      enable = true
    }
    kubernetes {
      audit_logs {
        enable = true
      }
    }
    malware_protection {
      scan_ec2_instance_with_findings {
        ebs_volumes {
          enable = true
        }
      }
    }
  }

  tags = {
    Name        = "${var.project_name}-guard-duty"
    Compliance  = "PCI-DSS"
  }
}

# 出力値
output "pci_compliance_resources" {
  description = "PCI DSS compliance resources"
  value = {
    waf_arn           = aws_wafv2_web_acl.payment_pci_waf.arn
    kms_key_id        = aws_kms_key.pci_encryption_key.key_id
    secrets_arns      = { for k, v in aws_secretsmanager_secret.pci_compliant_secrets : k => v.arn }
    audit_bucket      = aws_s3_bucket.audit_logs.bucket
    compliance_bucket = aws_s3_bucket.compliance_reports.bucket
    security_hub_arn  = aws_securityhub_account.payment_security_hub.arn
  }
}

output "security_monitoring" {
  description = "Security monitoring endpoints"
  value = {
    cloudtrail_arn = aws_cloudtrail.payment_audit_trail.arn
    guardduty_id   = aws_guardduty_detector.payment_guard_duty.id
    config_recorder = aws_config_configuration_recorder.payment_compliance.name
  }
}