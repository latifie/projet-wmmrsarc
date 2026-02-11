# Guide de Déploiement VPS

Ce guide explique comment déployer l'application sur un serveur VPS Linux (Ubuntu/Debian recommandé).

## Prérequis

- Un VPS avec accès SSH/Terminal.
- Git installé.
- Docker et Docker Compose installés (pour les modèles IA).
- Node.js (v18+) et npm.

## Installation Automatisée

Vous pouvez utiliser le script `setup_vps.sh` fourni pour installer les dépendances nécessaires (Node.js, Docker, PM2) :

```bash
chmod +x setup_vps.sh
./setup_vps.sh
```

## Installation Manuelle

### 1. Récupérer le code

Clonez votre dépôt sur le VPS :

```bash
git clone <votre-url-repo-gitlab>
cd <nom-du-dossier>
git checkout feat/production-build
```

### 2. Installation des dépendances

Installez les dépendances du backend (cela installera aussi celles du frontend via le script de build) :

```bash
cd backend
npm install
```

### 3. Configuration de l'environnement

Créez le fichier `.env` dans le dossier `backend` :

```bash
cp .env.example .env 
# OU créez-le manuellement
nano .env
```

Assurez-vous d'avoir les variables suivantes (adaptez selon vos besoins) :

```env
PORT=3000
DB=bd.sqlite
ACCESS_TOKEN_SECRET=votre_secret_super_securise
REFRESH_TOKEN_SECRET=votre_autre_secret_super_securise
```

### 4. Build et Obfuscation

Lancez la compilation et l'obfuscation du projet complet (Frontend + Backend) :

```bash
npm run build:backend
```

Cela va :
1. Installer les dépendances frontend.
2. Compiler le frontend avec Vite.
3. Obfusquer le code frontend.
4. Bundler et obfusquer le backend avec esbuild.
5. Créer un dossier `dist` contenant le serveur prêt à l'emploi.

### 5. Initialisation de la Base de Données (Premier lancement)

Avant de démarrer le serveur pour la première fois, vous devez initialiser la base de données et créer l'utilisateur administrateur :

```bash
npm run updatedb
```

### 6. Démarrage de l'application

Pour la production, il est recommandé d'utiliser **PM2** pour gérer le processus (redémarrage automatique, logs, etc.).

Installez PM2 globalement :
```bash
sudo npm install -g pm2
```

Démarrez l'application :
```bash
pm2 start dist/server.js --name "mon-app-ia"
pm2 save
pm2 startup
```

L'application sera accessible sur `http://<IP-DU-VPS>:3000`.

### 6. (Optionnel) Docker

Assurez-vous que l'utilisateur qui lance l'application a les droits Docker :

```bash
sudo usermod -aG docker $USER
newgrp docker
```

Vérifiez que Docker tourne :
```bash
docker ps
```

## Maintenance

- **Voir les logs** : `pm2 logs mon-app-ia`
- **Redémarrer** : `pm2 restart mon-app-ia`
- **Mettre à jour** :
  ```bash
  git pull origin feat/production-build
  cd backend
  npm install
  npm run build:backend
  pm2 restart mon-app-ia
  ```

## Configuration HTTPS (Domaine & SSL)

Pour sécuriser votre site (HTTPS) et le rendre accessible via un nom de domaine sur le port standard (443), nous allons utiliser **Nginx** comme reverse proxy.

### 1. Prérequis
- Un nom de domaine (ex: `mon-super-site.com`) pointant vers l'IP de votre VPS (Enregistrement A / DNS).
- Nginx et Certbot installés (le script `setup_vps.sh` le fait automatiquement).

### 2. Configuration Nginx

**Pour Ubuntu/Debian :**
```bash
sudo nano /etc/nginx/sites-available/mon-app
```

**Pour Alpine Linux (votre cas) :**
```bash
sudo vi /etc/nginx/http.d/mon-app.conf
```

Collez-y la configuration suivante (adaptée pour `elza.testing02.statzitz.ovh`) :

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name elza.testing02.statzitz.ovh;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Pour Ubuntu/Debian uniquement (activer le site) :**
```bash
sudo ln -s /etc/nginx/sites-available/mon-app /etc/nginx/sites-enabled/
```

**Pour tous :**
Vérifiez la configuration et redémarrez Nginx :
```bash
# Vérifier la syntaxe
sudo nginx -t

# Redémarrer Nginx (Alpine)
sudo service nginx restart
# OU
sudo rc-service nginx restart

# Redémarrer Nginx (Ubuntu)
sudo systemctl restart nginx
```

### 3. Activer HTTPS (Certificat SSL Gratuit)

Utilisez Certbot pour générer le certificat :

```bash
sudo certbot --nginx -d elza.testing02.statzitz.ovh
```

Suivez les instructions à l'écran. Certbot va automatiquement configurer la redirection HTTP -> HTTPS.

### 4. Renouvellement automatique

Le certificat est valable 90 jours. Certbot configure généralement une tâche automatique pour le renouveler. Vous pouvez tester le renouvellement avec :

```bash
sudo certbot renew --dry-run
```

## Dépannage

### Erreur : "The requested nginx plugin does not appear to be installed"

Si vous avez cette erreur sur Alpine Linux, c'est que le plugin n'est pas installé. Lancez :

```bash
apk add certbot-nginx
```

Puis réessayez la commande `certbot`.
