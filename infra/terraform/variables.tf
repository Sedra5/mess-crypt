variable "subscription_id" {
  type = string
}
variable "client_id" {
  type = string
}
variable "client_secret" {
  type      = string
  sensitive = true
}
variable "tenant_id" {
  type = string
}

variable "resource_group_name" {
  default = "rg-myapp-prod"
}
variable "location" {
  default = "westeurope"
}
variable "cluster_name" {
  default = "aks-myapp-prod"
}
variable "acr_name" {
  default = "acrmyappprod"
}
variable "kubernetes_version" {
  default = "1.33"
}

# Node pools
variable "system_node_count"     { default = 3 }
variable "app_node_min_count"    { default = 3 }
variable "app_node_max_count"    { default = 10 }
variable "db_node_count"         { default = 3 }

variable "system_node_vm_size"   { default = "Standard_D2s_v3" }
variable "app_node_vm_size"      { default = "Standard_D4s_v3" }
variable "db_node_vm_size"       { default = "Standard_E4s_v3" }
