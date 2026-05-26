# 🏛️ Architecture Cloud Native : Présentation de l'Infrastructure et du Flux DevOps

Ce document présente l'architecture complète du projet Messenger, de l'ordinateur du développeur jusqu'aux serveurs de production sur Azure, en détaillant chaque fichier responsable de la **Haute Disponibilité (HA)**, de l'**Auto-scalabilité**, de la **Tolérance de Panne** et du **Load Balancing**.

---

## 🗺️ 1. L'Architecture et le Workflow DevOps

Voici le schéma détaillé du système, de votre poste jusqu'aux conteneurs sur Azure :

```
┌───────────────────────────────────────────────────────────────────────────────────────┐
│                              VOTRE PC (Développeur)                                   │
│                                                                                       │
│   az login         terraform apply       bootstrap.ps1          git push              │
│       │                  │                    │                     │                 │
│       ▼                  ▼                    ▼                     ▼                 │
│   [Auth Azure]   [Crée AKS/ACR/VNet]  [Injecte Secrets     [Pousse le Code           │
│                                         dans Key Vault]      vers GitHub]             │
└──────┬──────────────────────────────────────────────────────────────┬────────────────┘
       │ Code & Config                                                │ Infrastructure
       ▼                                                              ▼
┌──────────────────────────┐                        ┌────────────────────────────────────┐
│  GitHub + GitHub Actions │                        │           Azure Cloud              │
│  (CI/CD Automatique)     │                        │                                    │
│                          │  -- Push images -----> │  📦 ACR (Azure Container Registry) │
│  • Build Docker          │                        │     messenger-api:v1.2.3            │
│  • Tests unitaires       │                        │     messenger-web:v1.2.3            │
│  • Push image vers ACR   │                        │                                    │
│  • MAJ tag image (Helm)  │                        │  🔐 Key Vault (Secrets)            │
│                          │                        │     POSTGRES_PASSWORD              │
└──────────────────────────┘                        │     REDIS_PASSWORD                 │
                                                    │     JWT_SECRET                     │
                                                    │     CONNECTION_STRINGS             │
                                                    └────────────────────┬───────────────┘
                                                                         │ CSI Secret Driver
                                                                         ▼
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│  Azure Virtual Network (VNet) — Réseau Privé Isolé                                      │
│                                                                                         │
│  ☸  AKS Cluster  [Node Autoscaler: min=2 Nodes, max=5 Nodes selon charge CPU/RAM]       │
│  ┌───────────────────────────────────────────────────────────────────────────────────┐  │
│  │                                                                                   │  │
│  │  ArgoCD (namespace: argocd)                                                       │  │
│  │    Surveille GitHub toutes les 3 min → Synchronise l'etat du cluster K8s         │  │
│  │    Self-healing: toute modification manuelle de K8s est annulee automatiquement   │  │
│  │                                                                                   │  │
│  │  cert-manager + Network Policy (acme-solver-policy.yaml)                          │  │
│  │    Gere les certificats TLS Let's Encrypt automatiquement                         │  │
│  │                                                                                   │  │
│  │  ======= TRAFIC ENTRANT (HTTPS depuis Internet) ===============================   │  │
│  │                               │                                                   │  │
│  │                               ▼                                                   │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │  Ingress NGINX (infra/helm/messenger-api/templates/ingress.yaml)            │  │  │
│  │  │                                                                             │  │  │
│  │  │  • TLS Termination  -> certificat Let's Encrypt (messenger-api-tls)         │  │  │
│  │  │  • Sticky Sessions  -> cookie "messenger-route" (SignalR WebSocket stable)  │  │  │
│  │  │  • CORS headers     -> autoriser frontend messcrypt.com                     │  │  │
│  │  │  • WebSocket Upgrade-> proxy-http-version: 1.1                              │  │  │
│  │  │  • Route api.messcrypt.com  --> Service messenger-api-svc:80                │  │  │
│  │  │  • Route messcrypt.com      --> Service messenger-web-svc:80                │  │  │
│  │  └──────────────────────────┬──────────────────────────┬──────────────────────┘  │  │
│  │                             │  Load Balancing L4        │                         │  │
│  │                             │  (Round-Robin)            │                         │  │
│  │                             ▼                           ▼                         │  │
│  │  ┌──────────────────────────────────┐  ┌───────────────────────────────────────┐  │  │
│  │  │ Service: messenger-api-svc       │  │ Service: messenger-web-svc            │  │  │
│  │  │ (service.yaml, ClusterIP)        │  │ (service.yaml, ClusterIP)             │  │  │
│  │  │ -> distribue sur tous pods API   │  │ -> distribue sur tous pods Web        │  │  │
│  │  └────────────────┬─────────────────┘  └─────────────────┬─────────────────────┘  │  │
│  │                   │                                      │                         │  │
│  │     PodDisruptionBudget (pdb.yaml) minAvailable=2                                  │  │
│  │     Azure interdit la maintenance si pods disponibles < 2                          │  │
│  │                   │                                      │                         │  │
│  │                   ▼                                      ▼                         │  │
│  │  ┌──────────────────────────────────────┐  ┌──────────────────────────────────┐   │  │
│  │  │  AKS NODE 1 (VM Azure Standard_D2s) │  │  AKS NODE 2 (VM Azure Standard)  │   │  │
│  │  │                                      │  │                                  │   │  │
│  │  │  📦 Pod: messenger-api (.NET 9)      │  │  📦 Pod: messenger-api (.NET 9)  │   │  │
│  │  │     /health/live  -> livenessProbe   │  │     Anti-Affinite: K8s interdit  │   │  │
│  │  │     /health/ready -> readinessProbe  │  │     2 pods API sur meme Node     │   │  │
│  │  │     Secrets injectes via CSI Driver  │  │     -> Si NODE 1 crash:          │   │  │
│  │  │     HPA: min=2, max=50 pods          │  │        NODE 2 reste operationnel │   │  │
│  │  │     Si CPU > 70% -> Scale Up auto    │  │                                  │   │  │
│  │  │                                      │  │  📦 Pod: messenger-web (React)   │   │  │
│  │  │  📦 Pod: messenger-web (React/Next)  │  │     HPA: min=2, max=20 pods      │   │  │
│  │  │     HPA: min=2, max=20 pods          │  │     Si CPU > 70% -> Scale Up     │   │  │
│  │  │     Si CPU > 70% -> Scale Up auto    │  │                                  │   │  │
│  │  │                                      │  └──────────────────────────────────┘   │  │
│  │  │  🗄  Pod: postgresql (Standalone)    │                                          │  │
│  │  │     PVC -> Azure Disk (donnees       │  (PostgreSQL ne tourne que sur NODE 1    │  │
│  │  │     persistees si crash)             │   StatefulSet + PVC pour persistance)    │  │
│  │  │     Auto-healing: K8s redecolle      │                                          │  │
│  │  │     le pod si crash                  │                                          │  │
│  │  │                                      │                                          │  │
│  │  │  🔴 redis-node-0 (MASTER)           │  🟡 redis-node-1 (SLAVE / replica)       │  │
│  │  │     <- Ecritures chat (SignalR)      │     Replication depuis Master            │  │
│  │  │                                      │  🟠 redis-node-2 (SLAVE / replica)       │  │
│  │  │     Si MASTER CRASH:                 │     Replication depuis Master            │  │
│  │  │       Sentinel detecte (30s)         │                                          │  │
│  │  │       Quorum (2 Sentinels d'accord)  │  🛡  Sentinel-0, Sentinel-1, Sentinel-2  │  │
│  │  │       Election nouveau MASTER  ---->  │     Watchdogs du cluster Redis          │  │
│  │  │       SLAVE promu MASTER            │     Si Master mort -> Vote + Election     │  │
│  │  │       ✅ FAILOVER AUTO en < 30s     │     -> FAILOVER AUTOMATIQUE              │  │
│  │  └──────────────────────────────────────┘  └──────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────────┘

  LEGENDE DES MECANISMES DE RESILIENCE
  ┌──────────────────────────────────────────────────────────────────────────────────┐
  │  Load Balancing   -> Ingress (L7) + Service K8s (L4): distribue le trafic       │
  │  HPA Scale-Out    -> Nouveaux pods crees si CPU/RAM depasse le seuil cible       │
  │  Node Autoscaler  -> Nouvelles VMs Azure si les Nodes sont satures               │
  │  Anti-Affinite    -> Pods dispatches sur des Nodes physiques differents           │
  │  Failover Redis   -> Sentinel elit un nouveau Master en moins de 30s             │
  │  Auto-Healing     -> K8s redemarre tout pod crashe (livenessProbe)               │
  │  PDB              -> Interdit la maintenance si pods disponibles < minAvailable   │
  │  GitOps ArgoCD    -> Toute derive de configuration est auto-corrigee             │
  │  Zero Downtime    -> RollingUpdate: nouveau pod operationnel avant kill ancien    │
  └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ 2. Infrastructure as Code (Terraform)

### Fichier : `infra/terraform/main.tf`
Ce fichier est le cœur de la création des ressources physiques sur le Cloud Azure.
* **AKS (Azure Kubernetes Service) — `azurerm_kubernetes_cluster` :**
  Définit le cluster Kubernetes lui-même, sa version, le réseau, l'identité managée (SystemAssigned), et l'intégration Azure AD RBAC.
  * **Auto-scalabilité du Cluster (Node Autoscaling) :** `enable_auto_scaling = true`, `min_count = 2`, `max_count = 5`. Si les pods demandent plus de CPU/RAM que disponible, Azure allume automatiquement de nouvelles VMs (Nodes) pour absorber la charge. Elles sont détruites quand le trafic retombe.
  * **Mise à jour automatique :** `automatic_channel_upgrade = "patch"` avec une fenêtre de maintenance le dimanche à 02h00. Les correctifs de sécurité sont appliqués sans intervention humaine.
* **Azure Container Registry — `azurerm_container_registry` :**
  Registre privé pour stocker les images Docker buildées par GitHub Actions. L'AKS a les droits de pull via le Managed Identity.
* **Azure Key Vault — `azurerm_key_vault` :**
  Le coffre-fort numérique avec soft-delete et purge protection activés. Aucun mot de passe ne figure dans le code source ou dans Git.
* **Azure Virtual Network — `azurerm_virtual_network` :**
  Réseau privé isolé avec deux sous-réseaux (`subnet-aks` et `subnet-appgw`) qui cloisonnent le trafic interne et externe.

---

## 📦 3. Configuration Kubernetes & Scalabilité (Helm)

### A. Déploiement : `infra/helm/messenger-api/templates/deployment.yaml`
C'est le fichier maître de l'application API (même structure pour `infra/helm/messenger-web/templates/deployment.yaml`).
* **Zéro Downtime — `strategy.rollingUpdate`:** `maxUnavailable: 0` et `maxSurge: 1`. K8s démarre le nouveau conteneur et attend qu'il soit `Ready` avant d'éteindre l'ancien.
* **Tolérance de Panne — `topologySpreadConstraints` + `podAntiAffinity`:** Force K8s à placer les pods sur des Nodes (machines physiques) différents. Si un serveur Azure tombe en panne, l'application reste accessible sur l'autre serveur.
* **Auto-Healing — `livenessProbe` + `readinessProbe`:** K8s sonde `/health/live` et `/health/ready` en permanence. Si l'API décroche (DB perdue, deadlock...), K8s isole le pod du Load Balancer et le redémarre.
* **Arrêt Gracieux — `preStop` + `terminationGracePeriodSeconds: 90`:** Permet aux connexions WebSocket (SignalR) actives de se terminer proprement avant que le conteneur ne s'éteigne.
* **Correctif GitOps/HPA :** Le champ `replicas` est conditionnel `{{- if not .Values.autoscaling.enabled }}`. Sans ça, ArgoCD annulerait les décisions du HPA à chaque synchronisation.

### B. Auto-scalabilité : `infra/helm/messenger-api/values.yaml`
```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 50        # API peut aller jusqu'à 50 instances !
  targetCPUUtilizationPercentage: 70
  targetMemoryUtilizationPercentage: 80

resources:
  requests:
    cpu: "100m"          # Ressource garantie (base HPA)
    memory: "256Mi"
  limits:
    cpu: "500m"
    memory: "512Mi"
```
* **HPA (Horizontal Pod Autoscaler) :** Surveille le CPU et la RAM. Au-delà de 70% CPU ou 80% RAM, crée de nouveaux pods. Politique de scale-down conservative (300s) pour éviter les oscillations.
* **VPA (Vertical Pod Autoscaler) :** Architecture recommandée : utiliser le VPA en mode "Off" (recommandation uniquement) pour analyser les besoins réels sur la durée, sans modifier les pods automatiquement (conflit avec HPA si activé ensemble).

### C. Load Balancing : `infra/helm/messenger-api/templates/ingress.yaml`
```yaml
nginx.ingress.kubernetes.io/affinity: "cookie"
nginx.ingress.kubernetes.io/session-cookie-name: "messenger-route"
nginx.ingress.kubernetes.io/proxy-http-version: "1.1"    # WebSocket upgrade
nginx.ingress.kubernetes.io/enable-cors: "true"
```
* **Couche L7 (Ingress NGINX) :** Déchiffre le HTTPS, inspecte l'URL, route vers le bon Service, et gère les Sticky Sessions pour maintenir les connexions SignalR stables.
* **Couche L4 (Service K8s) — `infra/helm/messenger-api/templates/service.yaml` :** Distribue le trafic en Round-Robin entre tous les pods sains (ceux dont la `readinessProbe` répond OK).

### D. Protection Anti-Maintenance : `infra/helm/messenger-api/templates/pdb.yaml`
Le **PodDisruptionBudget** garantit formellement à Azure que lors d'une opération de maintenance (drainage de Nodes, mise à jour OS), le nombre de pods disponibles ne peut pas tomber en dessous de 2. Garant de la HA pendant les opérations de maintenance.

### E. Politiques Réseau : `k8s/network-policies/network-policies.yaml` + `acme-solver-policy.yaml`
Implémentent un modèle "Default Deny All" : par défaut, tout trafic est bloqué. On ouvre uniquement ce qui est explicitement autorisé (ex: API → PostgreSQL, Ingress → ACME Solver pour les certificats TLS).

---

## 🗄️ 4. Bases de Données (Tolérance de Panne Stateful)

### A. Cache Temps-Réel : `infra/helm/redis-ha-values.yaml`
Redis est le Backplane SignalR : il synchronise les messages de chat entre tous les pods de l'API.
* **Architecture Sentinel HA :** 3 pods Redis (1 Master + 2 Slaves) + 3 Sentinels.
* **Failover automatique :** Si le Master s'éteint, les 3 Sentinels détectent l'absence, obtiennent un quorum (majorité), et élisent un Slave en nouveau Master en moins de 30 secondes. Le chat peut subir une micro-coupure mais ne s'effondre pas.

### B. Base Relationnelle : `infra/helm/postgresql-values.yaml`
* **État actuel :** Architecture Standalone (1 pod) avec `PersistentVolumeClaim` sur Azure Managed Disk. Si le pod crash, K8s le recrée et monte le même disque (données préservées).
* **En production stricte :** Un opérateur comme *Zalando Postgres Operator* ou *Patroni* assurerait un Failover automatique identique à Redis (réplication + élection de nouveau Primary).

# Plan Scrum — Application de messagerie chiffrée E2E

> **Stack :** Frontend Next.js 14 · Backend .NET 8 · PostgreSQL · Redis · SignalR
>
> **Durée estimée :** 6 sprints × 2 semaines = **~3 mois**
>
> **Méthode :** Scrum Agile — sprints de 2 semaines, démo à chaque fin de sprint

---

## Sommaire

1. [Vision du produit](https://claude.ai/chat/e38cbb16-9923-4673-82c4-86ad2957530a#1-vision-du-produit)
2. [Architecture technique](https://claude.ai/chat/e38cbb16-9923-4673-82c4-86ad2957530a#2-architecture-technique)
3. [Schéma de base de données](https://claude.ai/chat/e38cbb16-9923-4673-82c4-86ad2957530a#3-sch%C3%A9ma-de-base-de-donn%C3%A9es)
4. [Chiffrement E2E — Fonctionnement détaillé](https://claude.ai/chat/e38cbb16-9923-4673-82c4-86ad2957530a#4-chiffrement-e2e--fonctionnement-d%C3%A9taill%C3%A9)
5. [Product Backlog](https://claude.ai/chat/e38cbb16-9923-4673-82c4-86ad2957530a#5-product-backlog)
6. [Planification des Sprints](https://claude.ai/chat/e38cbb16-9923-4673-82c4-86ad2957530a#6-planification-des-sprints)
7. [Définition of Done (DoD)](https://claude.ai/chat/e38cbb16-9923-4673-82c4-86ad2957530a#7-d%C3%A9finition-of-done-dod)

---

## 1. Vision du produit

### Objectif

Créer une application de messagerie **chiffrée de bout en bout (E2E)** où :

* Le serveur ne voit jamais le contenu des messages en clair
* Les clés privées ne quittent jamais le navigateur de l'utilisateur
* Le chat est automatiquement nettoyé côté front toutes les 24h
* Les messages sont restaurables à tout moment via un **PIN** ou une **clé de récupération**
* La frappe clavier est visible en temps réel par l'interlocuteur

### Fonctionnalités principales

| Fonctionnalité        | Description                                                     |
| ---------------------- | --------------------------------------------------------------- |
| Création de compte    | Nom, prénom, pseudo, email, date de naissance                  |
| Authentification       | Login email + mot de passe, JWT                                 |
| Recherche              | Trouver un utilisateur par email ou pseudo                      |
| Messagerie temps réel | WebSocket (SignalR), frappe visible en direct                   |
| Chiffrement E2E        | RSA-OAEP + AES-256-GCM, zéro connaissance serveur              |
| Nettoyage automatique  | Chat UI nettoyé toutes les 24h côté front                    |
| Backup & Restauration  | Messages stockés chiffrés en DB, restauration par PIN ou clé |

---

## 2. Architecture technique

### Frontend — Next.js 14

```
src/
├── app/                    # App Router (RSC + Client Components)
│   ├── (auth)/
│   │   ├── login/
│   │   └── register/
│   ├── (app)/
│   │   ├── dashboard/
│   │   ├── chat/[id]/
│   │   ├── search/
│   │   └── profile/
│   └── layout.tsx
├── components/
├── lib/
│   ├── crypto.ts           # Web Crypto API (RSA + AES)
│   ├── keystore.ts         # IndexedDB via Dexie.js
│   └── signalr.ts          # Client SignalR
└── store/                  # Zustand (state global)
```

**Dépendances clés :**

* `@microsoft/signalr` — client temps réel
* `dexie` — IndexedDB (stockage clé privée chiffrée)
* `zustand` — gestion d'état
* `tailwindcss` + `shadcn/ui` — UI
* Web Crypto API (natif navigateur) — chiffrement

### Backend — .NET 8

```
src/
├── Domain/                 # Entités, interfaces, valeurs
├── Application/            # CQRS (MediatR), DTOs, use cases
├── Infrastructure/         # EF Core, SignalR Hub, JWT, Redis
└── API/                    # Controllers, Middlewares, Program.cs
```

**Dépendances clés :**

* `ASP.NET Core Web API`
* `SignalR` — WebSocket temps réel
* `Entity Framework Core` + `Npgsql` — ORM PostgreSQL
* `MediatR` — pattern CQRS
* `FluentValidation` — validation des entrées
* `Microsoft.AspNetCore.Identity` — gestion comptes

### Infrastructure

| Composant                   | Technologie                    |
| --------------------------- | ------------------------------ |
| Base de données principale | PostgreSQL                     |
| Cache / présence / typing  | Redis                          |
| Temps réel                 | SignalR (WebSocket)            |
| Déploiement frontend       | Vercel                         |
| Déploiement backend        | Railway ou Fly.io (Docker)     |
| Base de données hébergée | Supabase ou Railway PostgreSQL |
| CI/CD                       | GitHub Actions                 |

---

## 3. Schéma de base de données

### Table `users`

```sql
CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name          VARCHAR(100) NOT NULL,
    last_name           VARCHAR(100) NOT NULL,
    pseudo              VARCHAR(50) UNIQUE NOT NULL,
    email               VARCHAR(255) UNIQUE NOT NULL,
    birth_date          DATE NOT NULL,
    password_hash       TEXT NOT NULL,
    public_key          TEXT NOT NULL,          -- Clé publique RSA (envoyée par le client)
    recovery_key_hash   TEXT,                   -- Hash de la clé de récupération
    created_at          TIMESTAMPTZ DEFAULT NOW()
);
```

### Table `conversations`

```sql
CREATE TABLE conversations (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    last_message_at     TIMESTAMPTZ
);

CREATE TABLE conversation_participants (
    conversation_id     UUID REFERENCES conversations(id) ON DELETE CASCADE,
    user_id             UUID REFERENCES users(id) ON DELETE CASCADE,
    joined_at           TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (conversation_id, user_id)
);
```

### Table `messages`

```sql
CREATE TABLE messages (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id     UUID REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id           UUID REFERENCES users(id),
    ciphertext          TEXT NOT NULL,          -- Message chiffré AES-GCM (base64)
    encrypted_key       TEXT NOT NULL,          -- Clé AES chiffrée RSA (base64)
    iv                  TEXT NOT NULL,          -- Vecteur d'initialisation AES (base64)
    sent_at             TIMESTAMPTZ DEFAULT NOW(),
    read_at             TIMESTAMPTZ
);
```

> **Important :** Les messages ne sont jamais supprimés de la base de données.
>
> Le nettoyage 24h est uniquement côté front (vidage du state).

### Table `encrypted_key_store`

```sql
-- Backup de la clé privée chiffrée par le PIN/clé de récupération
CREATE TABLE encrypted_key_store (
    user_id             UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    encrypted_private_key TEXT NOT NULL,        -- Clé privée RSA chiffrée (AES-GCM)
    salt                TEXT NOT NULL,          -- Sel PBKDF2
    kdf_iterations      INT DEFAULT 100000,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Chiffrement E2E — Fonctionnement détaillé

### Principes fondamentaux

* **RSA-OAEP 2048 bits** — pour l'échange de clé de session
* **AES-256-GCM** — pour le chiffrement du contenu des messages
* **La clé privée RSA ne quitte jamais le navigateur**
* **Le serveur est "zero-knowledge"** — il stocke uniquement des données chiffrées

---

### Étape 1 — Inscription : génération des clés

```
Navigateur (Web Crypto API)
│
├── Génère paire RSA-OAEP 2048 bits
│   ├── Clé publique  → envoyée et stockée en DB (en clair)
│   └── Clé privée    → NE QUITTE PAS le navigateur
│
├── Chiffre la clé privée avec la passphrase/PIN (AES-256-GCM + PBKDF2)
│   → Stockée dans IndexedDB (Dexie.js)
│
└── Génère une clé de récupération (12 mots BIP39 ou 32 chars)
    → Affichée UNE SEULE FOIS à l'utilisateur (à noter offline)
    → Dérive une seconde version chiffrée de la clé privée → stockée en DB
```

---

### Étape 2 — Envoi d'un message

```
Expéditeur (navigateur)
│
├── 1. Génère une clé AES-256-GCM éphémère (par message)
├── 2. Chiffre le texte : texte_clair + clé_AES → ciphertext + iv
├── 3. Récupère la clé publique RSA du destinataire (depuis l'API)
├── 4. Chiffre la clé AES avec RSA-OAEP → encryptedKey
│
└── Envoie via SignalR : { ciphertext, encryptedKey, iv }
    → Stocké tel quel en DB (serveur ne peut pas déchiffrer)
```

---

### Étape 3 — Réception & déchiffrement

```
Destinataire (navigateur)
│
├── Reçoit : { ciphertext, encryptedKey, iv }
├── Déverrouille sa clé privée RSA (passphrase → IndexedDB)
├── Déchiffre encryptedKey avec clé privée RSA → clé AES
└── Déchiffre ciphertext avec clé AES + iv → texte_clair ✓
```

---

### Étape 4 — Restauration après nettoyage 24h

#### Option A — PIN (recommandé pour l'usage quotidien)

1. L'utilisateur saisit son PIN (4-6 chiffres)
2. PBKDF2 (100 000 itérations + sel) dérive une clé de déchiffrement
3. La clé privée RSA chiffrée (stockée en DB) est déchiffrée localement
4. Tous les messages du backup sont re-déchiffrés dans le navigateur

#### Option B — Clé de récupération (phrase de 12 mots)

* Même mécanisme que le PIN, mais avec la phrase sauvegardée offline
* Recommandé en cas de perte ou oubli du PIN

> **Recommandation :** Proposer les **deux** options.
>
> Le PIN est pratique. La clé de récupération est le filet de sécurité ultime.

---

### Indicateur "est en train d'écrire"

```
Expéditeur → onKeyDown → événement SignalR "Typing" → Redis TTL 3s
                                                      → Hub diffuse à l'interlocuteur
Interlocuteur → affiche "… est en train d'écrire"
              → disparaît si aucun événement pendant 3s (debounce)
```

---

## 5. Product Backlog

### Légende

| Tag         | Description              |
| ----------- | ------------------------ |
| `[FRONT]` | Next.js                  |
| `[BACK]`  | .NET 8                   |
| `[FULL]`  | Full stack               |
| `[SECU]`  | Sécurité / chiffrement |

---

### EPIC 1 — Authentification & Compte

| ID    | User Story                                                                                                 | Tag        | Points |
| ----- | ---------------------------------------------------------------------------------------------------------- | ---------- | ------ |
| US-01 | En tant qu'utilisateur, je veux créer un compte avec nom, prénom, pseudo, email et date de naissance     | `[FULL]` | 8      |
| US-02 | En tant que système, je valide que l'email et le pseudo sont uniques                                      | `[BACK]` | 3      |
| US-03 | En tant qu'utilisateur, je veux me connecter avec mon email et mot de passe                                | `[FULL]` | 5      |
| US-04 | En tant que système, je génère un JWT access token + refresh token                                      | `[BACK]` | 5      |
| US-05 | En tant que système, je génère une paire RSA-OAEP à l'inscription côté navigateur                    | `[SECU]` | 8      |
| US-06 | En tant qu'utilisateur, ma clé privée est chiffrée par ma passphrase et stockée localement (IndexedDB) | `[SECU]` | 8      |
| US-07 | En tant qu'utilisateur, je reçois une clé de récupération de 12 mots à l'inscription                  | `[FULL]` | 5      |

### EPIC 2 — Recherche & Contacts

| ID    | User Story                                                                                  | Tag         | Points |
| ----- | ------------------------------------------------------------------------------------------- | ----------- | ------ |
| US-08 | En tant qu'utilisateur, je veux chercher un compte par email ou pseudo                      | `[FULL]`  | 5      |
| US-09 | En tant qu'utilisateur, je vois les résultats avec avatar, pseudo et nom                   | `[FRONT]` | 3      |
| US-10 | En tant que système, j'expose GET /users/search?q= (recherche LIKE insensible à la casse) | `[BACK]`  | 3      |
| US-11 | En tant qu'utilisateur, je peux initier une conversation depuis la fiche d'un utilisateur   | `[FULL]`  | 5      |

### EPIC 3 — Messagerie temps réel

| ID    | User Story                                                                                | Tag         | Points |
| ----- | ----------------------------------------------------------------------------------------- | ----------- | ------ |
| US-12 | En tant qu'utilisateur, je vois la liste de mes conversations actives                     | `[FULL]`  | 5      |
| US-13 | En tant qu'utilisateur, je peux envoyer et recevoir des messages en temps réel (SignalR) | `[FULL]`  | 8      |
| US-14 | En tant qu'utilisateur, je vois "… est en train d'écrire" quand l'autre tape            | `[FRONT]` | 5      |
| US-15 | En tant qu'utilisateur, je vois les accusés de réception (envoyé / lu)                 | `[FRONT]` | 3      |
| US-16 | En tant que système, le chat UI est automatiquement nettoyé toutes les 24h              | `[FRONT]` | 5      |

### EPIC 4 — Chiffrement E2E & Backup

| ID    | User Story                                                                                            | Tag         | Points |
| ----- | ----------------------------------------------------------------------------------------------------- | ----------- | ------ |
| US-17 | En tant que système, chaque message est chiffré avec AES-256-GCM avant envoi                        | `[SECU]`  | 8      |
| US-18 | En tant que système, la clé AES est chiffrée par la clé publique RSA du destinataire              | `[SECU]`  | 8      |
| US-19 | En tant que système, les messages chiffrés sont stockés en DB indéfiniment (backup)               | `[BACK]`  | 5      |
| US-20 | En tant qu'utilisateur, je peux restaurer mes messages avec mon PIN                                   | `[FULL]`  | 8      |
| US-21 | En tant qu'utilisateur, je peux restaurer mes messages avec ma clé de récupération                 | `[FULL]`  | 8      |
| US-22 | En tant qu'utilisateur, je vois et note ma clé de récupération à l'inscription (affichage unique) | `[FRONT]` | 5      |

### EPIC 5 — Profil & Paramètres

| ID    | User Story                                                                     | Tag         | Points |
| ----- | ------------------------------------------------------------------------------ | ----------- | ------ |
| US-23 | En tant qu'utilisateur, je peux voir et modifier mon profil (photo, bio)       | `[FULL]`  | 5      |
| US-24 | En tant qu'utilisateur, je peux changer mon mot de passe / passphrase          | `[FRONT]` | 5      |
| US-25 | En tant qu'utilisateur, je peux me déconnecter (révocation du refresh token) | `[FULL]`  | 3      |

---

## 6. Planification des Sprints

### Sprint 1 — Setup & Authentification *(Semaines 1-2)*

**Objectif de sprint :** Un utilisateur peut créer un compte et se connecter.

| User Story    | Tâches                                                                                     |
| ------------- | ------------------------------------------------------------------------------------------- |
| US-01, US-02  | Init projet .NET (Clean Archi, EF Core, PostgreSQL) + endpoint POST /auth/register          |
| US-03, US-04  | Endpoint POST /auth/login + génération JWT access/refresh                                 |
| US-01 (front) | Init Next.js 14 App Router + pages Register et Login                                        |
| US-05, US-06  | Génération paire RSA (Web Crypto API) + stockage clé privée chiffrée (IndexedDB/Dexie) |
| US-07         | Génération et affichage de la clé de récupération (12 mots)                            |

**Démo sprint :** Création de compte + login fonctionnels, paire de clés générée.

---

### Sprint 2 — Recherche & Conversations *(Semaines 3-4)*

**Objectif de sprint :** Un utilisateur peut trouver quelqu'un et démarrer une conversation.

| User Story   | Tâches                                                              |
| ------------ | -------------------------------------------------------------------- |
| US-10        | Endpoint GET /users/search?q= (recherche par email/pseudo)           |
| US-08, US-09 | UI de recherche avec résultats (avatar, pseudo, nom)                |
| US-11        | Endpoint POST /conversations + logique "créer ou retrouver"         |
| US-12        | Dashboard avec liste des conversations et aperçu du dernier message |

**Démo sprint :** Recherche d'utilisateur + ouverture d'une conversation.

---

### Sprint 3 — Messagerie temps réel *(Semaines 5-6)*

**Objectif de sprint :** Messages instantanés et indicateur de frappe visible.

| User Story    | Tâches                                                                  |
| ------------- | ------------------------------------------------------------------------ |
| US-13         | Hub SignalR : méthodes JoinConversation, SendMessage, LeaveConversation |
| US-13 (front) | Client SignalR (@microsoft/signalr) + affichage messages en temps réel  |
| US-14         | Événement Typing via SignalR + debounce 1-2s + TTL Redis 3s            |
| US-15         | Statuts delivered / read (mise à jour en temps réel)                   |

**Démo sprint :** Chat bidirectionnel temps réel + frappe visible entre deux comptes.

---

### Sprint 4 — Chiffrement E2E *(Semaines 7-8)*

**Objectif de sprint :** Zéro message lisible côté serveur.

| User Story      | Tâches                                                                         |
| --------------- | ------------------------------------------------------------------------------- |
| US-17           | Chiffrement AES-256-GCM du message avant envoi (Web Crypto API)                 |
| US-18           | Chiffrement de la clé AES par RSA-OAEP (clé publique du destinataire)         |
| US-19           | Stockage {ciphertext, encryptedKey, iv} en base de données                     |
| US-13 (refacto) | Déchiffrement local à la réception (clé privée → clé AES → texte clair) |

**Démo sprint :** Messages chiffrés E2E — vérification dans la DB que le ciphertext est illisible.

---

### Sprint 5 — Backup, PIN & Restauration *(Semaines 9-10)*

**Objectif de sprint :** Chat nettoyé automatiquement et restaurable via PIN ou clé.

| User Story   | Tâches                                                                                                  |
| ------------ | -------------------------------------------------------------------------------------------------------- |
| US-16        | Cron côté front (setInterval ou service worker) — nettoyage UI à 24h                                 |
| US-21        | Endpoint GET /messages/{conversationId} pour récupérer le backup chiffré                              |
| US-20, US-21 | UI restauration : saisie PIN/clé → PBKDF2 → déchiffrement clé privée → re-déchiffrement messages |
| US-22        | Stockage sécurisé du backup clé privée en DB (table encrypted_key_store)                             |

**Démo sprint :** Nettoyage 24h + restauration complète des messages via PIN.

---

### Sprint 6 — Profil, Tests & Déploiement *(Semaines 11-12)*

**Objectif de sprint :** Application stable, testée, déployée en production.

| User Story          | Tâches                                                      |
| ------------------- | ------------------------------------------------------------ |
| US-23, US-24, US-25 | Page profil + modification + déconnexion                    |
| —                  | Tests unitaires et intégration (.NET xUnit + Moq)           |
| —                  | Tests E2E Playwright : auth, search, messaging, restauration |
| —                  | Dockerisation du backend (Dockerfile + docker-compose)       |
| —                  | Déploiement : Vercel (front) + Railway (back + DB)          |
| —                  | GitHub Actions CI/CD (lint → test → build → deploy)       |

**Démo sprint :** Application complète en production, tous les flux validés.

---

## 7. Définition of Done (DoD)

Une User Story est considérée comme **Done** quand :

* [ ] Le code est mergé sur `main` via Pull Request (review approuvée)
* [ ] Les tests unitaires passent (couverture > 80% sur les services critiques)
* [ ] Aucune régression sur les tests existants
* [ ] La fonctionnalité est testée manuellement sur Chrome et Firefox
* [ ] Les données sensibles ne sont jamais loguées (clés, tokens, messages en clair)
* [ ] Le endpoint (si back) est documenté (Swagger/OpenAPI)
* [ ] La PR inclut un court descriptif de ce qui a changé

---

## Notes de sécurité importantes

> ⚠️ **Règles non négociables**

1. **La clé privée RSA ne transite jamais sur le réseau.** Elle est générée et reste dans IndexedDB, chiffrée par la passphrase de l'utilisateur.
2. **Le serveur est zero-knowledge.** Il ne stocke que des blobs chiffrés. En cas de fuite de la base de données, les messages restent illisibles.
3. **PBKDF2 avec 100 000 itérations minimum** pour dériver les clés à partir du PIN ou de la passphrase.
4. **HTTPS partout** (TLS 1.3). Interdire HTTP en production.
5. **Rate limiting** sur tous les endpoints d'authentification pour prévenir le brute-force.
6. **Refresh token rotation** : chaque usage invalide l'ancien token.
