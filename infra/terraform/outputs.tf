output "resource_group_name" {
  description = "Nom du groupe de ressources"
  value       = azurerm_resource_group.main.name
}

output "kubernetes_cluster_name" {
  description = "Nom du cluster AKS"
  value       = azurerm_kubernetes_cluster.main.name
}

output "acr_login_server" {
  description = "URL de connexion à l'ACR"
  value       = azurerm_container_registry.main.login_server
}

output "key_vault_uri" {
  description = "URI du Key Vault"
  value       = azurerm_key_vault.main.vault_uri
}

output "acr_name" {
  description = "Nom de l'ACR"
  value       = azurerm_container_registry.main.name
}
