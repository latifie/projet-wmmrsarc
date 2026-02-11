#!/bin/bash

# setup_vps.sh
# Script d'installation des prérequis pour le déploiement sur VPS (Ubuntu/Debian)

echo "🚀 Démarrage de l'installation..."

# Détection du gestionnaire de paquets
if command -v apt-get &> /dev/null; then
    PKG_MANAGER="apt-get"
    sudo $PKG_MANAGER update && sudo $PKG_MANAGER upgrade -y
    sudo $PKG_MANAGER install -y git curl build-essential
    
    # Node.js (Ubuntu/Debian)
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo $PKG_MANAGER install -y nodejs
    
    # Nginx & Certbot (Ubuntu/Debian)
    echo "🌐 Installation de Nginx et Certbot..."
    sudo $PKG_MANAGER install -y nginx certbot python3-certbot-nginx

    # Docker (Ubuntu/Debian)
    if ! command -v docker &> /dev/null; then
        sudo $PKG_MANAGER install -y ca-certificates gnupg
        sudo install -m 0755 -d /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
        sudo chmod a+r /etc/apt/keyrings/docker.gpg
        echo \
          "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
          sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
        sudo $PKG_MANAGER update
        sudo $PKG_MANAGER install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    fi

elif command -v apk &> /dev/null; then
    PKG_MANAGER="apk"
    sudo $PKG_MANAGER update
    sudo $PKG_MANAGER add git curl nodejs npm build-base docker docker-cli-compose
    
    # Nginx & Certbot (Alpine)
    echo "🌐 Installation de Nginx et Certbot..."
    sudo $PKG_MANAGER add nginx certbot certbot-nginx
    
    # Démarrer Docker sur Alpine
    sudo service docker start || sudo rc-service docker start
    sudo rc-update add docker boot
    
    # Démarrer Nginx sur Alpine
    sudo service nginx start || sudo rc-service nginx start
    sudo rc-update add nginx boot
else
    echo "❌ Gestionnaire de paquets non supporté (ni apt, ni apk)."
    exit 1
fi

# Configuration des droits Docker (évite sudo pour docker)
echo "🐳 Configuration des droits Docker..."
sudo usermod -aG docker $USER || true

# 5. Installation de PM2 (Commun à tous via npm)
echo "⚙️ Installation de PM2..."
sudo npm install -g pm2

echo "✅ Installation terminée !"
echo "⚠️  Veuillez vous déconnecter et reconnecter pour que les droits Docker soient pris en compte (ou lancez 'newgrp docker')."
echo "👉 Ensuite, suivez les instructions du fichier DEPLOY.md pour lancer l'application."
