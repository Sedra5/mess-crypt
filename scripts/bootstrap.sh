#!/bin/bash
# scripts/bootstrap.sh — Setup initial du cluster AKS après terraform apply
set -euo pipefail

echo "============================================"
echo "   Bootstrap AKS Cluster — MessengerApp"
echo "============================================"

# --- Variables ---
RESOURCE_GROUP="rg-myapp-prod"
CLUSTER_NAME="aks-myapp-prod"
ACR_NAME="acrsedra5messcrypt"

# --- 1. Récupérer les credentials AKS ---
echo ""
echo "[1/13] Récupération du kubeconfig..."
az aks get-credentials \
  --resource-group $RESOURCE_GROUP \
  --name $CLUSTER_NAME \
  --admin \
  --overwrite-existing

echo "  Connecté au cluster $(kubectl config current-context)"

# --- 2. Activer l'addon Azure Key Vault Secrets Provider ---
echo ""
echo "[2/13] Activation Azure Key Vault Secrets Provider sur AKS..."
az aks enable-addons \
  --addons azure-keyvault-secrets-provider \
  --name $CLUSTER_NAME \
  --resource-group $RESOURCE_GROUP 2>/dev/null || echo "  (déjà activé)"

# --- 3. Créer les namespaces ---
echo ""
echo "[3/13] Création des namespaces..."
kubectl apply -f k8s/namespaces/namespaces.yaml

# --- 4. Créer la StorageClass Azure Premium ---
echo ""
echo "[4/13] Configuration StorageClass Premium..."
kubectl apply -f k8s/storage-classes/premium.yaml

# --- 5. RBAC ---
echo ""
echo "[5/13] Application des règles RBAC..."
kubectl apply -f k8s/rbac/rbac.yaml

# --- 6. Installer NGINX Ingress Controller (HA) ---
echo ""
echo "[6/13] Installation NGINX Ingress Controller..."
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
helm repo update

helm upgrade --install ingress-nginx ingress-nginx/ingress-nginx \
  --namespace ingress-nginx \
  --create-namespace \
  --set controller.replicaCount=2 \
  --set controller.service.type=LoadBalancer \
  --set controller.service.annotations."service\.beta\.kubernetes\.io/azure-load-balancer-health-probe-request-path"="/healthz" \
  --set controller.metrics.enabled=true \
  --set controller.metrics.serviceMonitor.enabled=true \
  --wait --timeout 5m

# --- 7. Installer Cert-Manager (SSL Let's Encrypt) ---
echo ""
echo "[7/13] Installation Cert-Manager..."
helm repo add jetstack https://charts.jetstack.io
helm repo update

helm upgrade --install cert-manager jetstack/cert-manager \
  --namespace cert-manager \
  --create-namespace \
  --set installCRDs=true \
  --set replicaCount=2 \
  --wait --timeout 5m

echo "  Configuration du ClusterIssuer Let's Encrypt..."
kubectl apply -f k8s/cert-manager/cluster-issuer.yaml

# --- 8. (Supprimé pour libérer de l'espace sur Azure) ---

# --- 9. Installer ArgoCD (avec force-conflicts pour éviter les erreurs CRD) ---
echo ""
echo "[9/13] Installation ArgoCD..."
kubectl create namespace argocd --dry-run=client -o yaml | kubectl apply -f -
kubectl apply -n argocd \
  -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml \
  --server-side --force-conflicts

echo "  Attente ArgoCD ready..."
kubectl wait --for=condition=available deployment/argocd-server -n argocd --timeout=300s

# --- 10. Network Policies (Zero-Trust) ---
echo ""
echo "[10/13] Application des Network Policies..."
kubectl apply -f k8s/network-policies/network-policies.yaml

# --- 11. Azure Key Vault SecretProviderClass ---
echo ""
echo "[11/13] Configuration Azure Key Vault CSI SecretProviderClass..."
kubectl apply -f k8s/secrets/secret-provider.yaml

# --- 12. Déployer PostgreSQL et Redis en HA ---
echo ""
echo "[12/13] Déploiement des bases de données (PostgreSQL HA & Redis Sentinel)..."

echo "  Déploiement de PostgreSQL HA..."
helm repo add bitnami https://charts.bitnami.com/bitnami
helm upgrade --install postgresql-ha oci://registry-1.docker.io/bitnamicharts/postgresql-ha --version 14.2.5 \
  --namespace production \
  -f infra/helm/postgresql-ha-values.yaml \
  --wait --timeout 10m

echo "  Déploiement de Redis Sentinel..."
helm upgrade --install redis oci://registry-1.docker.io/bitnamicharts/redis \
  --namespace production \
  -f infra/helm/redis-ha-values.yaml \
  --wait --timeout 5m

# --- 13. (Alertes Prometheus supprimées) ---

# --- Enregistrer les applications ArgoCD ---
echo ""
echo "Enregistrement des applications ArgoCD..."
kubectl apply -f argocd/applications/messenger-api.yaml
kubectl apply -f argocd/applications/messenger-web.yaml

# --- Résumé ---
echo ""
echo "============================================"
echo "   Bootstrap terminé avec succès !"
echo "============================================"
echo ""
echo "  IP du Load Balancer :"
kubectl get svc -n ingress-nginx ingress-nginx-controller -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
echo ""
echo ""
echo "  Mot de passe ArgoCD :"
kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath='{.data.password}' 2>/dev/null | base64 -d || echo "  (non disponible)"
echo ""
