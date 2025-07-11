terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC構成
resource "aws_vpc" "ai_subsidy_vpc" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = {
    Name        = "ai-subsidy-vpc"
    Environment = var.environment
    Project     = "ai-subsidy-system"
  }
}

# Internet Gateway
resource "aws_internet_gateway" "ai_subsidy_igw" {
  vpc_id = aws_vpc.ai_subsidy_vpc.id

  tags = {
    Name        = "ai-subsidy-igw"
    Environment = var.environment
  }
}

# Public Subnets
resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.ai_subsidy_vpc.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  map_public_ip_on_launch = true

  tags = {
    Name        = "ai-subsidy-public-${count.index + 1}"
    Environment = var.environment
    Type        = "public"
  }
}

# Private Subnets
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.ai_subsidy_vpc.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name        = "ai-subsidy-private-${count.index + 1}"
    Environment = var.environment
    Type        = "private"
  }
}

# NAT Gateway
resource "aws_eip" "nat" {
  count  = 2
  domain = "vpc"

  tags = {
    Name        = "ai-subsidy-nat-eip-${count.index + 1}"
    Environment = var.environment
  }
}

resource "aws_nat_gateway" "ai_subsidy_nat" {
  count         = 2
  allocation_id = aws_eip.nat[count.index].id
  subnet_id     = aws_subnet.public[count.index].id

  tags = {
    Name        = "ai-subsidy-nat-${count.index + 1}"
    Environment = var.environment
  }

  depends_on = [aws_internet_gateway.ai_subsidy_igw]
}

# Route Tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.ai_subsidy_vpc.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.ai_subsidy_igw.id
  }

  tags = {
    Name        = "ai-subsidy-public-rt"
    Environment = var.environment
  }
}

resource "aws_route_table" "private" {
  count  = 2
  vpc_id = aws_vpc.ai_subsidy_vpc.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.ai_subsidy_nat[count.index].id
  }

  tags = {
    Name        = "ai-subsidy-private-rt-${count.index + 1}"
    Environment = var.environment
  }
}

# Route Table Associations
resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "private" {
  count          = 2
  subnet_id      = aws_subnet.private[count.index].id
  route_table_id = aws_route_table.private[count.index].id
}

# Security Groups
resource "aws_security_group" "eks_cluster" {
  name_prefix = "ai-subsidy-eks-cluster"
  vpc_id      = aws_vpc.ai_subsidy_vpc.id

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ai-subsidy-eks-cluster-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "eks_nodes" {
  name_prefix = "ai-subsidy-eks-nodes"
  vpc_id      = aws_vpc.ai_subsidy_vpc.id

  ingress {
    from_port = 0
    to_port   = 65535
    protocol  = "tcp"
    self      = true
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name        = "ai-subsidy-eks-nodes-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "rds" {
  name_prefix = "ai-subsidy-rds"
  vpc_id      = aws_vpc.ai_subsidy_vpc.id

  ingress {
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  tags = {
    Name        = "ai-subsidy-rds-sg"
    Environment = var.environment
  }
}

resource "aws_security_group" "redis" {
  name_prefix = "ai-subsidy-redis"
  vpc_id      = aws_vpc.ai_subsidy_vpc.id

  ingress {
    from_port       = 6379
    to_port         = 6379
    protocol        = "tcp"
    security_groups = [aws_security_group.eks_nodes.id]
  }

  tags = {
    Name        = "ai-subsidy-redis-sg"
    Environment = var.environment
  }
}

# EKS Cluster
resource "aws_eks_cluster" "ai_subsidy_cluster" {
  name     = "ai-subsidy-${var.environment}"
  role_arn = aws_iam_role.eks_cluster_role.arn
  version  = "1.28"

  vpc_config {
    subnet_ids              = aws_subnet.private[*].id
    endpoint_private_access = true
    endpoint_public_access  = true
    public_access_cidrs     = ["0.0.0.0/0"]
    security_group_ids      = [aws_security_group.eks_cluster.id]
  }

  encryption_config {
    provider {
      key_arn = aws_kms_key.eks_encryption.arn
    }
    resources = ["secrets"]
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_cluster_policy,
    aws_iam_role_policy_attachment.eks_vpc_resource_controller,
  ]

  tags = {
    Name        = "ai-subsidy-cluster-${var.environment}"
    Environment = var.environment
  }
}

# EKS Node Group
resource "aws_eks_node_group" "ai_subsidy_nodes" {
  cluster_name    = aws_eks_cluster.ai_subsidy_cluster.name
  node_group_name = "ai-subsidy-nodes"
  node_role_arn   = aws_iam_role.eks_node_role.arn
  subnet_ids      = aws_subnet.private[*].id

  capacity_type  = "ON_DEMAND"
  instance_types = ["t3.medium"]

  scaling_config {
    desired_size = var.environment == "production" ? 3 : 2
    max_size     = var.environment == "production" ? 10 : 5
    min_size     = var.environment == "production" ? 2 : 1
  }

  update_config {
    max_unavailable = 1
  }

  depends_on = [
    aws_iam_role_policy_attachment.eks_worker_node_policy,
    aws_iam_role_policy_attachment.eks_cni_policy,
    aws_iam_role_policy_attachment.eks_container_registry_policy,
  ]

  tags = {
    Name        = "ai-subsidy-nodes-${var.environment}"
    Environment = var.environment
  }
}

# RDS Subnet Group
resource "aws_db_subnet_group" "main" {
  name       = "ai-subsidy-${var.environment}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "ai-subsidy-db-subnet-group-${var.environment}"
    Environment = var.environment
  }
}

# RDS PostgreSQL
resource "aws_rds_instance" "ai_subsidy_db" {
  identifier     = "ai-subsidy-${var.environment}"
  engine         = "postgres"
  engine_version = "15.4"
  instance_class = var.environment == "production" ? "db.t3.medium" : "db.t3.micro"
  
  allocated_storage     = var.environment == "production" ? 100 : 20
  max_allocated_storage = var.environment == "production" ? 1000 : 100
  storage_type          = "gp3"
  storage_encrypted     = true
  kms_key_id           = aws_kms_key.rds_encryption.arn
  
  db_name  = "ai_subsidy_${replace(var.environment, "-", "_")}"
  username = var.db_username
  password = var.db_password
  
  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"
  
  multi_az               = var.environment == "production"
  publicly_accessible    = false
  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name
  
  skip_final_snapshot = var.environment != "production"
  
  tags = {
    Name        = "ai-subsidy-db-${var.environment}"
    Environment = var.environment
  }
}

# ElastiCache Subnet Group
resource "aws_elasticache_subnet_group" "main" {
  name       = "ai-subsidy-${var.environment}"
  subnet_ids = aws_subnet.private[*].id

  tags = {
    Name        = "ai-subsidy-cache-subnet-group-${var.environment}"
    Environment = var.environment
  }
}

# ElastiCache Redis
resource "aws_elasticache_replication_group" "ai_subsidy_redis" {
  replication_group_id       = "ai-subsidy-${var.environment}"
  description                = "Redis cluster for AI Subsidy System"
  
  port                       = 6379
  parameter_group_name       = "default.redis7"
  node_type                  = var.environment == "production" ? "cache.t3.micro" : "cache.t3.micro"
  num_cache_clusters         = var.environment == "production" ? 3 : 1
  
  at_rest_encryption_enabled = true
  transit_encryption_enabled = true
  auth_token                 = var.redis_auth_token
  
  subnet_group_name = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]
  
  tags = {
    Name        = "ai-subsidy-redis-${var.environment}"
    Environment = var.environment
  }
}

# KMS Keys
resource "aws_kms_key" "eks_encryption" {
  description             = "KMS key for EKS encryption"
  deletion_window_in_days = 7

  tags = {
    Name        = "ai-subsidy-eks-key-${var.environment}"
    Environment = var.environment
  }
}

resource "aws_kms_key" "rds_encryption" {
  description             = "KMS key for RDS encryption"
  deletion_window_in_days = 7

  tags = {
    Name        = "ai-subsidy-rds-key-${var.environment}"
    Environment = var.environment
  }
}

# IAM Roles
resource "aws_iam_role" "eks_cluster_role" {
  name = "ai-subsidy-eks-cluster-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "eks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_cluster_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy"
  role       = aws_iam_role.eks_cluster_role.name
}

resource "aws_iam_role_policy_attachment" "eks_vpc_resource_controller" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSVPCResourceController"
  role       = aws_iam_role.eks_cluster_role.name
}

resource "aws_iam_role" "eks_node_role" {
  name = "ai-subsidy-eks-node-role-${var.environment}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eks_worker_node_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKSWorkerNodePolicy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "eks_cni_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEKS_CNI_Policy"
  role       = aws_iam_role.eks_node_role.name
}

resource "aws_iam_role_policy_attachment" "eks_container_registry_policy" {
  policy_arn = "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryReadOnly"
  role       = aws_iam_role.eks_node_role.name
}

# Data Sources
data "aws_availability_zones" "available" {
  state = "available"
}