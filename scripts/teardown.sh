#!/bin/bash
# scripts/teardown.sh — Destruction complète de l'infrastructure Azure
set -euo pipefail

echo ""
echo "============================================"
echo "    DESTRUCTION COMPLETE DE L'INFRASTRUCTURE"
echo "============================================"
echo ""
echo "Cette action va SUPPRIMER DEFINITIVEMENT :"
echo "  - Le cluster AKS et tous ses pods/services"
echo "  - Le registre ACR et toutes les images Docker"
echo "  - Le Key Vault et tous les secrets"
echo "  - Le réseau virtuel (VNet/Subnets)"
echo "  - Log Analytics Workspace"
echo "  - Le Resource Group complet (rg-myapp-prod)"
echo ""
echo "LA FACTURATION AZURE SERA ARRETEE."
echo ""
read -p "Êtes-vous sûr ? Tapez 'DESTROY' pour confirmer : " confirmation

if [ "$confirmation" != "DESTROY" ]; then
  echo " Annulé."
  exit 1
fi

RESOURCE_GROUP="rg-myapp-prod"
CLUSTER_NAME="aks-myapp-prod"

# --- Etape 1 : Se connecter au cluster pour nettoyer proprement ---
echo ""
echo "[1/5] Connexion au cluster AKS..."
if az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME --admin --overwrite-existing 2>/dev/null; then

  # --- Etape 2 : Désinstaller toutes les releases Helm ---
  echo ""
  echo "[2/5] Suppression des releases Helm..."
  helm uninstall messenger-web -n production 2>/dev/null || true
  helm uninstall messenger-api -n production 2>/dev/null || true
  helm uninstall redis -n production 2>/dev/null || true
  helm uninstall postgresql-ha -n production 2>/dev/null || true
  helm uninstall kube-prometheus-stack -n monitoring 2>/dev/null || true
  helm uninstall cert-manager -n cert-manager 2>/dev/null || true
  helm uninstall ingress-nginx -n ingress-nginx 2>/dev/null || true

  # --- Etape 3 : Supprimer les PVC (disques Azure) ---
  echo ""
  echo "[3/5] Suppression des PersistentVolumeClaims (disques Azure)..."
  kubectl delete pvc --all -n production 2>/dev/null || true
  kubectl delete pvc --all -n monitoring 2>/dev/null || true

  # --- Etape 4 : Supprimer ArgoCD ---
  echo ""
  echo "[4/5] Suppression ArgoCD..."
  kubectl delete -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml 2>/dev/null || true

else
  echo "  Cluster inaccessible, passage direct à la destruction Terraform..."
fi

# --- Etape 5 : Destruction Terraform ---
echo ""
echo "[5/5] Destruction de l'infrastructure Terraform..."

cd infra/terraform

# Désactiver la protection contre la purge du Key Vault
echo "  Désactivation de la protection anti-purge du Key Vault..."
az keyvault update --name kv-sedra5-mess-2 --resource-group $RESOURCE_GROUP --enable-purge-protection false 2>/dev/null || true

terraform init -input=false 2>/dev/null
terraform destroy -auto-approve

cd ../..

# --- Bonus : Suppression forcée du Resource Group ---
echo ""
echo "[Bonus] Vérification et suppression forcée du Resource Group..."
if [ "$(az group exists --name $RESOURCE_GROUP 2>/dev/null)" = "true" ]; then
  echo "  Le Resource Group existe encore, suppression forcée..."
  az group delete --name $RESOURCE_GROUP --yes --no-wait
else
  echo "  Resource Group déjà supprimé"
fi

# --- Purger le Key Vault (soft-delete) ---
echo ""
echo "Purge du Key Vault (soft-delete)..."
az keyvault purge --name kv-sedra5-mess-2 2>/dev/null || true

# --- Nettoyage local ---
echo ""
echo "Nettoyage du kubeconfig local..."
kubectl config delete-context "${CLUSTER_NAME}-admin" 2>/dev/null || true
kubectl config delete-cluster $CLUSTER_NAME 2>/dev/null || true

echo ""
echo "============================================"
echo "   Infrastructure DETRUITE"
echo "   Facturation Azure ARRETEE"
echo "============================================"
echo ""
echo "Vérifiez sur https://portal.azure.com que le Resource Group '$RESOURCE_GROUP' n'existe plus."
echo ""
