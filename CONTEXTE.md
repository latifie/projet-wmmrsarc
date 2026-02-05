# Contexte du Projet

## Description Générale

Application web de gestion et déploiement d'instances de chat IA avec système d'authentification et de tickets.

## Fonctionnalités

### Utilisateurs (Clients)

1. **Authentification**
   - Inscription avec email et mot de passe
   - Connexion avec génération de token JWT
   - Gestion de session avec refresh tokens

2. **Sélection d'IA**
   - Consultation de la liste des modèles IA disponibles
   - Choix d'un modèle pour déploiement

3. **Gestion des Demandes (Tickets)**
   - Création d'une demande de déploiement pour un modèle IA
   - Consultation de ses propres demandes
   - Suivi de l'état des demandes (en attente, validée, rejetée, déployée)

### Administrateurs

1. **Gestion des Demandes**
   - Consultation de toutes les demandes (tous les utilisateurs)
   - Validation/Rejet des demandes
   - Lors de la validation : déploiement automatique d'une instance Docker Compose (chat)

2. **Gestion des Instances**
   - Consultation de la liste de toutes les instances déployées
   - Actions sur les instances :
     - Démarrer (start)
     - Arrêter (stop)
     - Redémarrer (restart)
     - Voir les logs
     - Supprimer

## Architecture Technique

### Backend
- **Framework** : Node.js avec Express
- **Base de données** : SQLite (développement) / MariaDB (production)
- **ORM** : Sequelize
- **Authentification** : JWT (JSON Web Tokens)
- **Documentation API** : Swagger

### Frontend
- **Framework** : React avec Vite
- **Communication** : Proxy configuré pour `/api` vers Backend (port 3000)
- **État** : En développement (template de base)

### Déploiement
- **Conteneurisation** : Docker Compose pour les instances de chat
- **Gestion** : Les instances sont déployées dynamiquement par l'admin

## Modèles de Données

### User
- Informations utilisateur (nom, email, mot de passe hashé)
- Rôle (client/admin)

### AIModel
- Liste des modèles IA disponibles
- Informations sur chaque modèle (nom, description, configuration)

### Request (Ticket)
- Demande de déploiement
- État (pending, approved, rejected, deployed)
- Lien vers l'utilisateur demandeur et le modèle IA

### Instance
- Instance Docker déployée
- État (running, stopped, error)
- Informations de connexion
- Lien vers la demande associée

## Flux de Travail

1. **Client crée une demande** → État: `pending`
2. **Admin valide la demande** → État: `approved` → Déploiement Docker Compose automatique
3. **Instance créée** → État: `deployed` → Instance disponible
4. **Admin gère l'instance** → Actions (start/stop/logs/etc.)

## Sécurité

- Authentification JWT obligatoire pour les routes protégées
- Vérification des rôles (admin/client)
- Validation des droits d'accès (owner/admin)
- Hashage des mots de passe avec bcrypt
