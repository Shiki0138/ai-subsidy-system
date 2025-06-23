# 決済システム専用インフラ構成
# Team D: Infrastructure & Monitoring
# Created: 2025-06-20
# Purpose: ハイブリッド課金モデル実装における高可用性・セキュリティ基盤

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  backend "s3" {
    bucket         = "ai-subsidy-terraform-state"
    key            = "payment-system/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "ai-subsidy-system"
      Team        = "team-d"
      Component   = "payment-system"
      Environment = var.environment
      CreatedBy   = "hybrid-billing-implementation"
      ManagedBy   = "terraform"
    }
  }
}

# データソース
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# VPC設定（決済システム専用ネットワーク分離）
resource "aws_vpc" "payment_vpc" {
  cidr_block           = var.vpc_cidr
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "${var.project_name}-payment-vpc"
    Type = "payment-infrastructure"
  }
}

# パブリックサブネット（ALB用）
resource "aws_subnet" "public" {
  count = length(var.public_subnet_cidrs)

  vpc_id                  = aws_vpc.payment_vpc.id
  cidr_block              = var.public_subnet_cidrs[count.index]
  availability_zone       = data.aws_availability_zones.available.names[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "${var.project_name}-public-subnet-${count.index + 1}"
    Type = "public"
  }
}

# プライベートサブネット（アプリケーション用）
resource "aws_subnet" "private" {
  count = length(var.private_subnet_cidrs)

  vpc_id            = aws_vpc.payment_vpc.id
  cidr_block        = var.private_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "application"
  }
}

# データベースサブネット（分離強化）
resource "aws_subnet" "database" {
  count = length(var.database_subnet_cidrs)

  vpc_id            = aws_vpc.payment_vpc.id
  cidr_block        = var.database_subnet_cidrs[count.index]
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "${var.project_name}-database-subnet-${count.index + 1}"
    Type = "database"
  }
}

# インターネットゲートウェイ
resource "aws_internet_gateway" "payment_igw" {
  vpc_id = aws_vpc.payment_vpc.id

  tags = {
    Name = "${var.project_name}-payment-igw"
  }
}

# NAT Gateway（高可用性のため各AZに配置）
resource "aws_eip" "nat" {
  count = length(aws_subnet.public)

  domain = "vpc"
  
  tags = {
    Name = "${var.project_name}-nat-eip-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.payment_igw]
}

resource "aws_nat_gateway" "payment_nat" {
  count = length(aws_subnet.public)

  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name = "${var.project_name}-nat-gateway-${count.index + 1}"
  }

  depends_on = [aws_internet_gateway.payment_igw]
}

# ルートテーブル設定
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.payment_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.payment_igw.id
  }

  tags = {
    Name = "${var.project_name}-public-route-table"
  }
}

resource "aws_route_table" "private" {
  count = length(aws_nat_gateway.payment_nat)

  vpc_id = aws_vpc.payment_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.payment_nat[count.index].id
  }

  tags = {
    Name = "${var.project_name}-private-route-table-${count.index + 1}"
  }
}

# ルートテーブル関連付け
resource "aws_route_table_association" "public" {
  count = length(aws_subnet.public)

  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count = length(aws_subnet.private)

  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# セキュリティグループ
resource "aws_security_group" "alb" {
  name_prefix = "${var.project_name}-alb-"
  vpc_id      = aws_vpc.payment_vpc.id

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTP (redirect to HTTPS)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-alb-security-group"
    Type = "load-balancer"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "payment_app" {
  name_prefix = "${var.project_name}-payment-app-"
  vpc_id      = aws_vpc.payment_vpc.id

  ingress {
    description     = "HTTP from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb.id]
  }

  ingress {
    description     = "Metrics from Prometheus"
    from_port       = 9090
    to_port         = 9090
    protocol        = "tcp"
    security_groups = [aws_security_group.monitoring.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-payment-app-security-group"
    Type = "application"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "database" {
  name_prefix = "${var.project_name}-database-"
  vpc_id      = aws_vpc.payment_vpc.id

  ingress {
    description     = "PostgreSQL"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.payment_app.id]
  }

  tags = {
    Name = "${var.project_name}-database-security-group"
    Type = "database"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "${var.project_name}-redis-"
  vpc_id      = aws_vpc.payment_vpc.id

  ingress {
    description     = "Redis"
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.payment_app.id]
  }

  tags = {
    Name = "${var.project_name}-redis-security-group"
    Type = "cache"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_security_group" "monitoring" {
  name_prefix = "${var.project_name}-monitoring-"
  vpc_id      = aws_vpc.payment_vpc.id

  ingress {
    description = "Prometheus"
    from_port   = 9090
    to_port     = 9090
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  ingress {
    description = "Grafana"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = [var.vpc_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-monitoring-security-group"
    Type = "monitoring"
  }

  lifecycle {
    create_before_destroy = true
  }
}

# RDS サブネットグループ
resource "aws_db_subnet_group" "payment_db" {
  name       = "${var.project_name}-payment-db-subnet-group"
  subnet_ids = aws_subnet.database[*].id

  tags = {
    Name = "${var.project_name}-payment-db-subnet-group"
    Type = "database"
  }
}

# RDS インスタンス（Multi-AZ、暗号化有効）
resource "aws_db_instance" "payment_db" {
  identifier     = "${var.project_name}-payment-db"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.db_instance_class

  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.payment_key.arn

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password

  vpc_security_group_ids = [aws_security_group.database.id]
  db_subnet_group_name   = aws_db_subnet_group.payment_db.name

  # 高可用性設定
  multi_az               = true
  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  # セキュリティ設定
  deletion_protection      = true
  delete_automated_backups = false
  skip_final_snapshot     = false
  final_snapshot_identifier = "${var.project_name}-payment-db-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  # パフォーマンス監視
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn

  # 拡張ログ
  enabled_cloudwatch_logs_exports = ["postgresql"]

  tags = {
    Name = "${var.project_name}-payment-database"
    Type = "primary-database"
  }
}

# RDS読み取り専用レプリカ（災害復旧用）
resource "aws_db_instance" "payment_db_replica" {
  identifier = "${var.project_name}-payment-db-replica"
  
  replicate_source_db = aws_db_instance.payment_db.identifier
  instance_class      = var.db_replica_instance_class
  
  # レプリカは別リージョンに配置（災害復旧）
  availability_zone = data.aws_availability_zones.available.names[1]
  
  # 監視設定
  performance_insights_enabled = true
  monitoring_interval          = 60
  monitoring_role_arn         = aws_iam_role.rds_monitoring.arn

  tags = {
    Name = "${var.project_name}-payment-database-replica"
    Type = "read-replica"
  }
}

# ElastiCache サブネットグループ
resource "aws_elasticache_subnet_group" "payment_cache" {
  name       = "${var.project_name}-payment-cache-subnet-group"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name = "${var.project_name}-payment-cache-subnet-group"
    Type = "cache"
  }
}

# ElastiCache Redis クラスター（セッション管理・キャッシュ）
resource "aws_elasticache_replication_group" "payment_redis" {
  replication_group_id       = "${var.project_name}-payment-redis"
  description                = "Redis cluster for payment system session and cache"

  node_type          = var.redis_node_type
  port               = 6379
  parameter_group_name = "default.redis7"

  num_cache_clusters = var.redis_num_cache_nodes
  
  # 高可用性設定
  automatic_failover_enabled = true
  multi_az_enabled          = true
  
  # セキュリティ設定
  subnet_group_name  = aws_elasticache_subnet_group.payment_cache.name
  security_group_ids = [aws_security_group.redis.id]
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token

  # バックアップ設定
  snapshot_retention_limit = 5
  snapshot_window         = "03:00-05:00"

  # ログ設定
  log_delivery_configuration {
    destination      = aws_cloudwatch_log_group.redis.name
    destination_type = "cloudwatch-logs"
    log_format      = "text"
    log_type        = "slow-log"
  }

  tags = {
    Name = "${var.project_name}-payment-redis-cluster"
    Type = "cache-cluster"
  }
}

# Application Load Balancer
resource "aws_lb" "payment_alb" {
  name               = "${var.project_name}-payment-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id

  enable_deletion_protection = true
  enable_http2              = true
  idle_timeout              = 60

  access_logs {
    bucket  = aws_s3_bucket.alb_logs.bucket
    prefix  = "payment-alb"
    enabled = true
  }

  tags = {
    Name = "${var.project_name}-payment-alb"
    Type = "load-balancer"
  }
}

# ALB Target Group
resource "aws_lb_target_group" "payment_app" {
  name     = "${var.project_name}-payment-app-tg"
  port     = 8080
  protocol = "HTTP"
  vpc_id   = aws_vpc.payment_vpc.id

  health_check {
    enabled             = true
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
    path                = "/health"
    matcher             = "200"
    port                = "traffic-port"
    protocol            = "HTTP"
  }

  # Connection draining
  deregistration_delay = 30

  tags = {
    Name = "${var.project_name}-payment-app-target-group"
    Type = "target-group"
  }
}

# ALB Listener（HTTPS）
resource "aws_lb_listener" "payment_https" {
  load_balancer_arn = aws_lb.payment_alb.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = aws_acm_certificate_validation.payment_cert.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.payment_app.arn
  }

  tags = {
    Name = "${var.project_name}-payment-https-listener"
  }
}

# ALB Listener（HTTP → HTTPS リダイレクト）
resource "aws_lb_listener" "payment_http" {
  load_balancer_arn = aws_lb.payment_alb.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }

  tags = {
    Name = "${var.project_name}-payment-http-listener"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "payment_cluster" {
  name = "${var.project_name}-payment-cluster"

  configuration {
    execute_command_configuration {
      kms_key_id = aws_kms_key.payment_key.arn
      logging    = "OVERRIDE"

      log_configuration {
        cloud_watch_encryption_enabled = true
        cloud_watch_log_group_name     = aws_cloudwatch_log_group.ecs.name
      }
    }
  }

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "${var.project_name}-payment-ecs-cluster"
    Type = "container-cluster"
  }
}

# ECS Task Definition
resource "aws_ecs_task_definition" "payment_app" {
  family                   = "${var.project_name}-payment-app"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = "1024"
  memory                   = "2048"
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn           = aws_iam_role.ecs_task.arn

  container_definitions = jsonencode([
    {
      name  = "payment-app"
      image = "${var.ecr_repository_url}:${var.app_version}"

      portMappings = [
        {
          containerPort = 8080
          protocol      = "tcp"
        }
      ]

      environment = [
        {
          name  = "DATABASE_URL"
          value = "postgres://${var.db_username}:${var.db_password}@${aws_db_instance.payment_db.endpoint}:5432/${var.db_name}"
        },
        {
          name  = "REDIS_URL"
          value = "redis://${aws_elasticache_replication_group.payment_redis.configuration_endpoint_address}:6379"
        },
        {
          name  = "ENVIRONMENT"
          value = var.environment
        }
      ]

      secrets = [
        {
          name      = "STRIPE_SECRET_KEY"
          valueFrom = aws_secretsmanager_secret.stripe_keys.arn
        },
        {
          name      = "JWT_SECRET"
          valueFrom = aws_secretsmanager_secret.jwt_secret.arn
        }
      ]

      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.payment_app.name
          awslogs-region        = var.aws_region
          awslogs-stream-prefix = "ecs"
        }
      }

      healthCheck = {
        command     = ["CMD-SHELL", "curl -f http://localhost:8080/health || exit 1"]
        interval    = 30
        timeout     = 5
        retries     = 3
        startPeriod = 60
      }

      essential = true
    }
  ])

  tags = {
    Name = "${var.project_name}-payment-app-task-definition"
    Type = "ecs-task"
  }
}

# ECS Service
resource "aws_ecs_service" "payment_app" {
  name            = "${var.project_name}-payment-app-service"
  cluster         = aws_ecs_cluster.payment_cluster.id
  task_definition = aws_ecs_task_definition.payment_app.arn
  desired_count   = var.ecs_desired_count
  launch_type     = "FARGATE"

  network_configuration {
    subnets         = aws_subnet.private[*].id
    security_groups = [aws_security_group.payment_app.id]
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.payment_app.arn
    container_name   = "payment-app"
    container_port   = 8080
  }

  deployment_configuration {
    maximum_percent         = 200
    minimum_healthy_percent = 100
  }

  # サービス発見
  service_registries {
    registry_arn = aws_service_discovery_service.payment_app.arn
  }

  tags = {
    Name = "${var.project_name}-payment-app-service"
    Type = "ecs-service"
  }

  depends_on = [
    aws_lb_listener.payment_https,
    aws_iam_role_policy_attachment.ecs_execution
  ]
}

# Auto Scaling設定
resource "aws_appautoscaling_target" "payment_app" {
  max_capacity       = var.ecs_max_capacity
  min_capacity       = var.ecs_min_capacity
  resource_id        = "service/${aws_ecs_cluster.payment_cluster.name}/${aws_ecs_service.payment_app.name}"
  scalable_dimension = "ecs:service:DesiredCount"
  service_namespace  = "ecs"

  tags = {
    Name = "${var.project_name}-payment-app-autoscaling-target"
  }
}

# CPU使用率によるスケーリング
resource "aws_appautoscaling_policy" "payment_app_cpu" {
  name               = "${var.project_name}-payment-app-cpu-scaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.payment_app.resource_id
  scalable_dimension = aws_appautoscaling_target.payment_app.scalable_dimension
  service_namespace  = aws_appautoscaling_target.payment_app.service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "ECSServiceAverageCPUUtilization"
    }
    target_value = 60.0
  }
}

# KMS Key（暗号化用）
resource "aws_kms_key" "payment_key" {
  description             = "${var.project_name} Payment System Encryption Key"
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
      }
    ]
  })

  tags = {
    Name = "${var.project_name}-payment-encryption-key"
    Type = "encryption-key"
  }
}

resource "aws_kms_alias" "payment_key" {
  name          = "alias/${var.project_name}-payment-key"
  target_key_id = aws_kms_key.payment_key.key_id
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "payment_app" {
  name              = "/aws/ecs/${var.project_name}-payment-app"
  retention_in_days = 30
  kms_key_id       = aws_kms_key.payment_key.arn

  tags = {
    Name = "${var.project_name}-payment-app-logs"
    Type = "application-logs"
  }
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/aws/ecs/${var.project_name}-cluster"
  retention_in_days = 7
  kms_key_id       = aws_kms_key.payment_key.arn

  tags = {
    Name = "${var.project_name}-ecs-logs"
    Type = "infrastructure-logs"
  }
}

resource "aws_cloudwatch_log_group" "redis" {
  name              = "/aws/elasticache/${var.project_name}-redis"
  retention_in_days = 14
  kms_key_id       = aws_kms_key.payment_key.arn

  tags = {
    Name = "${var.project_name}-redis-logs"
    Type = "cache-logs"
  }
}

# S3 Bucket（ALBログ用）
resource "aws_s3_bucket" "alb_logs" {
  bucket = "${var.project_name}-payment-alb-logs-${random_string.bucket_suffix.result}"

  tags = {
    Name = "${var.project_name}-alb-logs-bucket"
    Type = "log-storage"
  }
}

resource "aws_s3_bucket_versioning" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_encryption" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        kms_master_key_id = aws_kms_key.payment_key.arn
        sse_algorithm     = "aws:kms"
      }
    }
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "alb_logs" {
  bucket = aws_s3_bucket.alb_logs.id

  rule {
    id     = "delete_old_logs"
    status = "Enabled"

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

# WAF設定
resource "aws_wafv2_web_acl" "payment_waf" {
  name  = "${var.project_name}-payment-waf"
  scope = "REGIONAL"

  default_action {
    allow {}
  }

  # 基本的なセキュリティルール
  rule {
    name     = "CommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "CommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # OWASP Top 10対策
  rule {
    name     = "OWASPRuleSet"
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
      metric_name                = "OWASPRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  # レート制限
  rule {
    name     = "RateLimitRule"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  tags = {
    Name = "${var.project_name}-payment-waf"
    Type = "security"
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "PaymentWAFMetric"
    sampled_requests_enabled   = true
  }
}

# WAFとALBの関連付け
resource "aws_wafv2_web_acl_association" "payment_waf_association" {
  resource_arn = aws_lb.payment_alb.arn
  web_acl_arn  = aws_wafv2_web_acl.payment_waf.arn
}

# 出力値
output "payment_alb_dns_name" {
  description = "Payment system ALB DNS name"
  value       = aws_lb.payment_alb.dns_name
}

output "payment_alb_zone_id" {
  description = "Payment system ALB zone ID"
  value       = aws_lb.payment_alb.zone_id
}

output "payment_db_endpoint" {
  description = "Payment database endpoint"
  value       = aws_db_instance.payment_db.endpoint
  sensitive   = true
}

output "redis_endpoint" {
  description = "Redis cluster endpoint"
  value       = aws_elasticache_replication_group.payment_redis.configuration_endpoint_address
  sensitive   = true
}

output "vpc_id" {
  description = "Payment system VPC ID"
  value       = aws_vpc.payment_vpc.id
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}