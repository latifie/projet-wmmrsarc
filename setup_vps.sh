#!/bin/bash

# setup_vps.sh
# Script d'installation des prérequis pour le déploiement sur VPS (Ubuntu/Debian)

echo "🚀 Démarrage de l'installation..."

# 1. Mise à jour du système
echo "📦 Mise à jour des paquets..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Installation de Git et Curl
echo "TOOLS Installation de Git et Curl..."
sudo apt-get install -y git curl build-essential

# 3. Installation de Node.js (v20)
echo "🟢 Installation de Node.js..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# 4. Installation de Docker
echo "🐳 Installation de Docker..."
if ! command -v docker &> /dev/null; then
    sudo apt-get install -y ca-certificates gnupg
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch="$(dpkg --print-architecture)" signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      "$(. /etc/os-release && echo "$VERSION_CODENAME")" stable" | \
      sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
fi

# Configuration des droits Docker (évite sudo pour docker)
echo "🐳 Configuration des droits Docker..."
sudo usermod -aG docker $USER || true

# 5. Installation de PM2
echo "⚙️ Installation de PM2..."
sudo npm install -g pm2

echo "✅ Installation terminée !"
echo "⚠️  Veuillez vous déconnecter et reconnecter pour que les droits Docker soient pris en compte (ou lancez 'newgrp docker')."
echo "👉 Ensuite, suivez les instructions du fichier DEPLOY.md pour lancer l'application."
