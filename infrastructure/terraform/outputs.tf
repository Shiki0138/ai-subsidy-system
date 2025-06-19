output "vpc_id" {
  description = "VPC ID"
  value       = aws_vpc.ai_subsidy_vpc.id
}

output "public_subnets" {
  description = "Public subnet IDs"
  value       = aws_subnet.public[*].id
}

output "private_subnets" {
  description = "Private subnet IDs"
  value       = aws_subnet.private[*].id
}

output "eks_cluster_id" {
  description = "EKS cluster ID"
  value       = aws_eks_cluster.ai_subsidy_cluster.id
}

output "eks_cluster_arn" {
  description = "EKS cluster ARN"
  value       = aws_eks_cluster.ai_subsidy_cluster.arn
}

output "eks_cluster_endpoint" {
  description = "EKS cluster endpoint"
  value       = aws_eks_cluster.ai_subsidy_cluster.endpoint
}

output "eks_cluster_version" {
  description = "EKS cluster version"
  value       = aws_eks_cluster.ai_subsidy_cluster.version
}

output "rds_endpoint" {
  description = "RDS endpoint"
  value       = aws_rds_instance.ai_subsidy_db.endpoint
  sensitive   = true
}

output "rds_port" {
  description = "RDS port"
  value       = aws_rds_instance.ai_subsidy_db.port
}

output "redis_endpoint" {
  description = "Redis endpoint"
  value       = aws_elasticache_replication_group.ai_subsidy_redis.primary_endpoint_address
  sensitive   = true
}

output "redis_port" {
  description = "Redis port"
  value       = aws_elasticache_replication_group.ai_subsidy_redis.port
}

output "eks_cluster_security_group_id" {
  description = "EKS cluster security group ID"
  value       = aws_security_group.eks_cluster.id
}

output "eks_node_security_group_id" {
  description = "EKS node security group ID"
  value       = aws_security_group.eks_nodes.id
}