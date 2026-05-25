$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "   Bootstrap AKS Cluster — MessengerApp"     -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan

# --- Variables ---
$RESOURCE_GROUP = "rg-myapp-prod"
$CLUSTER_NAME   = "aks-myapp-prod"
$ACR_NAME       = "acrsedra5messcrypt"

# --- 1. Recuperer les credentials AKS ---
Write-Host "`n[1/13] Recuperation du kubeconfig..." -ForegroundColor Yellow
az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME --admin --overwrite-existing
Write-Host "  Connecte au cluster $(kubectl config current-context)" -ForegroundColor Green

# --- 2. Activer l'addon Azure Key Vault Secrets Provider ---
Write-Host "`n[2/13] Activation Azure Key Vault Secrets Provider sur AKS..." -ForegroundColor Yellow
az aks enable-addons `
  --addons azure-keyvault-secrets-provider `
  --name $CLUSTER_NAME `
  --resource-group $RESOURCE_GROUP 2>$null
Write-Host "  Key Vault CSI addon active" -ForegroundColor Green

# --- 3. Creer les namespaces ---
Write-Host "`n[3/13] Creation des namespaces..." -ForegroundColor Yellow
kubectl apply -f k8s/namespaces/namespaces.yaml

# --- 4. Creer la StorageClass Azure Premium ---
Write-Host "`n[4/13] Configuration StorageClass Premium..." -ForegroundColor Yellow
kubectl apply -f k8s/storage-classes/premium.yaml

# --- 5. RBAC ---
Write-Host "`n[5/13] Application des regles RBAC..." -ForegroundColor Yellow
kubectl apply -f k8s/rbac/rbac.yaml

# --- 6. Installer NGINX Ingress Controller (HA) ---
Write-Host "`n[6/13] Installation NGINX Ingress Controller..." -ForegroundColor Yellow
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update
helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx `
  --namespace ingress-nginx `
  --create-namespace `
  --set controller.replicaCount=2 `
  --set controller.service.type=LoadBalancer `
  --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"="/healthz" `
  --set controller.metrics.enabled=true `
  --set controller.metrics.serviceMonitor.enabled=true `
  --wait --timeout 5m

# --- 7. Installer Cert-Manager (SSL Let's Encrypt) ---
Write-Host "`n[7/13] Installation Cert-Manager..." -ForegroundColor Yellow
helm repo add jetstack https://charts.jetstack.io
helm repo update
helm upgrade --install cert-manager jetstack/cert-manager `
  --namespace cert-manager `
  --create-namespace `
  --set installCRDs=true `
  --set replicaCount=2 `
  --wait --timeout 5m

Write-Host "  Configuration du ClusterIssuer Let's Encrypt..." -ForegroundColor Yellow
kubectl apply -f k8s/cert-manager/cluster-issuer.yaml

# --- 8. (Supprimé pour libérer de l'espace sur Azure) ---

# --- 9. Installer ArgoCD (avec force-conflicts pour eviter les erreurs CRD) ---
Write-Host "`n[9/13] Installation ArgoCD..." -ForegroundColor Yellow
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd `
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml `
  --server-side --force-conflicts

Write-Host "  Attente ArgoCD ready..." -ForegroundColor Yellow
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

# --- 10. Network Policies (Zero-Trust) ---
Write-Host "`n[10/13] Application des Network Policies..." -ForegroundColor Yellow
kubectl apply -f k8s/network-policies/network-policies.yaml

# --- 11. Azure Key Vault SecretProviderClass ---
Write-Host "`n[11/13] Configuration Azure Key Vault CSI SecretProviderClass..." -ForegroundColor Yellow
kubectl apply -f k8s/secrets/secret-provider.yaml

# --- 12. Deployer PostgreSQL et Redis en HA ---
Write-Host "`n[12/13] Deploiement des bases de donnees (PostgreSQL HA & Redis Sentinel)..." -ForegroundColor Yellow

Write-Host "  Deploiement de PostgreSQL HA..." -ForegroundColor Yellow
helm repo add bitnami https://charts.bitnami.com/bitnami
helm upgrade --install postgresql-ha oci://registry-1.docker.io/bitnamicharts/postgresql-ha --version 14.2.5 `
  --namespace production `
  -f infra/helm/postgresql-ha-values.yaml `
  --wait --timeout 10m

Write-Host "  Deploiement de Redis Sentinel..." -ForegroundColor Yellow
helm upgrade --install redis oci://registry-1.docker.io/bitnamicharts/redis `
  --namespace production `
  -f infra/helm/redis-ha-values.yaml `
  --wait --timeout 5m

# --- 13. (Alertes Prometheus supprimées) ---

# --- Enregistrer les applications ArgoCD ---
Write-Host "`nEnregistrement des applications ArgoCD..." -ForegroundColor Yellow
kubectl apply -f argocd/applications/messenger-api.yaml
kubectl apply -f argocd/applications/messenger-web.yaml

# --- Resume ---
Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Bootstrap termine avec succes !"          -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "  IP du Load Balancer :" -ForegroundColor Cyan
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
Write-Host ""
Write-Host ""
Write-Host "  Mot de passe ArgoCD :" -ForegroundColor Cyan
$argoPass = kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' 2>$null
if ($argoPass) {
  Write-Host "  $([System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($argoPass)))"
} else {
  Write-Host "  (non disponible - ArgoCD peut ne pas etre pret)"
}
Write-Host ""
