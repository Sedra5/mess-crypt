$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "============================================" -ForegroundColor Red
Write-Host "    DESTRUCTION COMPLETE DE L'INFRASTRUCTURE" -ForegroundColor Red
Write-Host "============================================" -ForegroundColor Red
Write-Host ""
Write-Host "Cette action va SUPPRIMER DEFINITIVEMENT :" -ForegroundColor Yellow
Write-Host "  - Le cluster AKS et tous ses pods/services"
Write-Host "  - Le registre ACR et toutes les images Docker"
Write-Host "  - Le Key Vault et tous les secrets"
Write-Host "  - Le reseau virtuel (VNet/Subnets)"
Write-Host "  - Log Analytics Workspace"
Write-Host "  - Le Resource Group complet (rg-myapp-prod)"
Write-Host ""
Write-Host "LA FACTURATION AZURE SERA ARRETEE." -ForegroundColor Green
Write-Host ""

$confirmation = Read-Host "Etes-vous sur ? Tapez 'DESTROY' pour confirmer"

if ($confirmation -ne "DESTROY") {
    Write-Host "`nAnnule." -ForegroundColor Yellow
    exit 1
}

$RESOURCE_GROUP = "rg-myapp-prod"
$CLUSTER_NAME   = "aks-myapp-prod"

# --- Etape 1 : Se connecter au cluster pour nettoyer proprement ---
Write-Host "`n[1/5] Connexion au cluster AKS..." -ForegroundColor Yellow
try {
    az aks get-credentials --resource-group $RESOURCE_GROUP --name $CLUSTER_NAME --admin --overwrite-existing 2>$null

    # --- Etape 2 : Desinstaller toutes les releases Helm ---
    Write-Host "`n[2/5] Suppression des releases Helm..." -ForegroundColor Yellow
    $helmReleases = @(
        @{ Name = "messenger-web";        Namespace = "production" },
        @{ Name = "messenger-api";        Namespace = "production" },
        @{ Name = "redis";                Namespace = "production" },
        @{ Name = "postgresql-ha";        Namespace = "production" },
        @{ Name = "kube-prometheus-stack"; Namespace = "monitoring" },
        @{ Name = "cert-manager";         Namespace = "cert-manager" },
        @{ Name = "ingress-nginx";        Namespace = "ingress-nginx" }
    )

    foreach ($release in $helmReleases) {
        Write-Host "  Suppression $($release.Name)..." -NoNewline
        helm uninstall $release.Name -n $release.Namespace 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Host " OK" -ForegroundColor Green
        } else {
            Write-Host " (non trouve, ignore)" -ForegroundColor DarkGray
        }
    }

    # --- Etape 3 : Supprimer les PVC (disques Azure) pour arreter la facturation stockage ---
    Write-Host "`n[3/5] Suppression des PersistentVolumeClaims (disques Azure)..." -ForegroundColor Yellow
    kubectl delete pvc --all -n production 2>$null
    kubectl delete pvc --all -n monitoring 2>$null
    Write-Host "  PVC supprimes" -ForegroundColor Green

    # --- Etape 4 : Supprimer ArgoCD et les CRDs ---
    Write-Host "`n[4/5] Suppression ArgoCD..." -ForegroundColor Yellow
    kubectl delete -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml 2>$null
    Write-Host "  ArgoCD supprime" -ForegroundColor Green

} catch {
    Write-Host "  Cluster inaccessible, passage direct a la destruction Terraform..." -ForegroundColor DarkYellow
}

# --- Etape 5 : Destruction Terraform (SUPPRIME TOUTE L'INFRA AZURE) ---
Write-Host "`n[5/5] Destruction de l'infrastructure Terraform..." -ForegroundColor Red
Write-Host "  Cela va supprimer le Resource Group '$RESOURCE_GROUP' et TOUTES ses ressources." -ForegroundColor Red
Write-Host ""

Push-Location infra/terraform

# Desactiver la protection contre la purge du Key Vault pour permettre la destruction
Write-Host "  Desactivation de la protection anti-purge du Key Vault..." -ForegroundColor Yellow
az keyvault update --name kv-sedra5-mess-2 --resource-group $RESOURCE_GROUP --enable-purge-protection false 2>$null

# Terraform destroy
terraform init -input=false 2>$null
terraform destroy -auto-approve

Pop-Location

# --- Etape 6 : Nettoyage supplementaire (au cas ou Terraform n'a pas tout supprime) ---
Write-Host "`n[Bonus] Verification et suppression forcee du Resource Group..." -ForegroundColor Yellow
$rgExists = az group exists --name $RESOURCE_GROUP 2>$null
if ($rgExists -eq "true") {
    Write-Host "  Le Resource Group existe encore, suppression forcee..." -ForegroundColor Red
    az group delete --name $RESOURCE_GROUP --yes --no-wait
    Write-Host "  Suppression lancee en arriere-plan" -ForegroundColor Green
} else {
    Write-Host "  Resource Group deja supprime" -ForegroundColor Green
}

# --- Etape 7 : Purger le Key Vault (soft-delete) ---
Write-Host "`nPurge du Key Vault (soft-delete)..." -ForegroundColor Yellow
az keyvault purge --name kv-sedra5-mess-2 2>$null
Write-Host "  Key Vault purge" -ForegroundColor Green

# --- Nettoyage local ---
Write-Host "`nNettoyage du kubeconfig local..." -ForegroundColor Yellow
kubectl config delete-context "${CLUSTER_NAME}-admin" 2>$null
kubectl config delete-cluster $CLUSTER_NAME 2>$null

Write-Host ""
Write-Host "============================================" -ForegroundColor Green
Write-Host "   Infrastructure DETRUITE"                   -ForegroundColor Green
Write-Host "   Facturation Azure ARRETEE"                 -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Verifiez sur https://portal.azure.com que le Resource Group '$RESOURCE_GROUP' n'existe plus." -ForegroundColor Cyan
Write-Host ""
