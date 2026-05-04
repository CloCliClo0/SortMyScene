# SortMyScene - Updated Implementation Guide

## ✅ Nouvelles Fonctionnalités Implémentées

### 1. **Vérification d'Email (Email Verification)**
- **Description**: Les nouveaux utilisateurs reçoivent un code de vérification 6 caractères par email
- **Endpoints**:
  - `POST /api/verification/send-code` - Envoie un code de vérification
  - `POST /api/verification/verify-code` - Vérifie le code fourni
  - `GET /api/verification/status` - Récupère le statut de vérification
  
- **Variables d'environnement requises**:
  ```
  SMTP_HOST=smtp.gmail.com
  SMTP_PORT=587
  SMTP_SECURE=false
  SMTP_USER=your-email@gmail.com
  SMTP_PASSWORD=your-app-password
  SMTP_FROM=noreply@sortmyscene.fr
  ```

### 2. **Récupération des Playlists**
- **Description**: Récupération des playlists depuis Spotify, YouTube et Deezer
- **Endpoints**:
  - `GET /api/playlists/:provider` - Récupère les playlists d'un provider
  - `GET /api/playlists/:provider/:playlistId/tracks` - Récupère les tracks d'une playlist

- **Providers supportés**: `spotify`, `youtube`, `deezer`

### 3. **Tri et Filtrage des Tracks**
- **Description**: Tri avancé des tracks selon plusieurs critères
- **Options de tri**:
  - `popularity` - Par popularité (par défaut)
  - `alphabetical` - Alphabétique (A-Z)
  - `duration_asc` - Durée croissante
  - `duration_desc` - Durée décroissante
  - `artist` - Par artiste
  - `recent` - Récemment ajoutés

- **Filtres disponibles**:
  - `minDuration` - Durée minimale (en ms)
  - `maxDuration` - Durée maximale (en ms)
  - `minPopularity` - Popularité minimale (0-100)
  - `artist` - Recherche par artiste
  - `title` - Recherche par titre
  - `provider` - Filtre par provider (spotify, youtube, deezer)

- **Exemple d'appel**:
  ```bash
  GET /api/tracks?sceneId=1&sortBy=popularity&minDuration=180000&maxDuration=600000
  ```

### 4. **Intégration Complète Deezer**
- Services améliorés avec plus de fonctions
- Support pour récupérer les playlists, favoris, artistes, albums
- Limitation de débit (rate limiting) implémentée

### 5. **Services Spotify et YouTube Améliorés**
- Ajout de nouvelles fonctions pour:
  - Récupérer les playlists utilisateur
  - Récupérer les tracks d'une playlist
  - Récupérer les top tracks
  - Rechercher des tracks
  - Récupérer les saved tracks

### 6. **Modèles Mis à Jour**

#### User
- `email_verified` - Boolean
- `email_verification_code` - VARCHAR(6)
- `email_verification_expires` - DATE
- `theme` - VARCHAR(10)
- `language` - VARCHAR(5)

#### Track
- `provider` - ENUM (spotify, youtube, deezer)
- `duration_ms` - INT
- `popularity` - INT
- `created_at` - DATETIME
- Timestamps

#### Scene
- `sort_criteria` - VARCHAR(50)
- `updated_at` - DATETIME

#### UserPlaylist (nouveau)
- Stocke les playlists en cache
- Unique par user_id, provider, playlist_id

## 🚀 Déploiement

### Mise à jour de la Base de Données

Exécutez le script SQL fourni:
```bash
cat sql/sortmyscene_schema_template.sql | mysql -u user -p database
```

Ou si vous avez une base de données existante:
```sql
-- Ajouter les colonnes de vérification d'email
ALTER TABLE `User` ADD COLUMN `email_verified` BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE `User` ADD COLUMN `email_verification_code` VARCHAR(6) NULL;
ALTER TABLE `User` ADD COLUMN `email_verification_expires` DATETIME NULL;
ALTER TABLE `User` ADD COLUMN `theme` VARCHAR(10) DEFAULT 'dark';
ALTER TABLE `User` ADD COLUMN `language` VARCHAR(5) DEFAULT 'en';

-- Ajouter les colonnes au Track
ALTER TABLE `Track` ADD COLUMN `provider` ENUM('spotify', 'youtube', 'deezer') NOT NULL DEFAULT 'spotify' AFTER `scene_id`;
ALTER TABLE `Track` ADD COLUMN `duration_ms` INT NULL;
ALTER TABLE `Track` ADD COLUMN `popularity` INT NULL;
ALTER TABLE `Track` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- Ajouter les colonnes au Scene
ALTER TABLE `Scene` ADD COLUMN `sort_criteria` VARCHAR(50) DEFAULT 'popularity';
ALTER TABLE `Scene` ADD COLUMN `updated_at` DATETIME(3) NULL ON UPDATE CURRENT_TIMESTAMP(3);

-- Ajouter les colonnes à OAuthToken
ALTER TABLE `OAuthToken` MODIFY `provider` ENUM('google', 'spotify', 'youtube', 'deezer') NOT NULL;
ALTER TABLE `OAuthToken` MODIFY `access_token` LONGTEXT NOT NULL;
ALTER TABLE `OAuthToken` MODIFY `refresh_token` LONGTEXT NULL;
ALTER TABLE `OAuthToken` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `OAuthToken` ADD COLUMN `updated_at` DATETIME(3) NULL ON UPDATE CURRENT_TIMESTAMP(3);

-- Créer la table UserPlaylist
CREATE TABLE IF NOT EXISTS `UserPlaylist` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `provider` ENUM('spotify', 'youtube', 'deezer') NOT NULL,
  `playlist_id` VARCHAR(191) NOT NULL,
  `playlist_name` VARCHAR(191) NOT NULL,
  `platform_url` LONGTEXT NULL,
  `track_count` INT DEFAULT 0,
  `cached_at` DATETIME(3) NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserPlaylist_user_provider_id_key` (`user_id`, `provider`, `playlist_id`),
  KEY `UserPlaylist_user_id_idx` (`user_id`),
  CONSTRAINT `UserPlaylist_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

### Installation des dépendances

```bash
npm install
# Cela installe nodemailer et les autres dépendances
```

### Configuration

Mettez à jour `.env` avec vos variables SMTP:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

### Lancement

```bash
npm start          # Production
npm run dev        # Développement
```

## 📱 Utilisation des APIs

### Exemple 1: Inscription avec Vérification

```javascript
// 1. Inscription
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "password123"
}

// 2. Utilisateur reçoit un email avec un code 6 caractères

// 3. Vérifier le code
POST /api/verification/verify-code
{
  "code": "ABC123"
}

// 4. Vérifier le statut
GET /api/verification/status
```

### Exemple 2: Récupérer et Trier les Playlists

```javascript
// 1. Récupérer les playlists Spotify
GET /api/playlists/spotify

// 2. Récupérer les tracks de la playlist
GET /api/playlists/spotify/:playlistId/tracks

// 3. Récupérer les tracks avec tri et filtrage
GET /api/tracks?sceneId=1&sortBy=popularity&minDuration=180000
```

### Exemple 3: Gérer les Préférences Utilisateur

```javascript
// Chaque utilisateur peut avoir des préférences
// theme: 'dark' ou 'light'
// language: 'en', 'fr', 'es', etc.

// Ces champs sont stockés dans le modèle User
```

## 🔧 Architecture

```
SortMyScene/
├── controllers/
│   ├── authController.js (mise à jour: vérification email)
│   ├── playlistsController.js (nouveau)
│   ├── trackController.js (mise à jour: tri/filtrage)
│   ├── verificationController.js (nouveau)
│   └── ...
├── models/
│   ├── User.js (mise à jour)
│   ├── Track.js (mise à jour)
│   ├── Scene.js (mise à jour)
│   ├── UserPlaylist.js (nouveau)
│   └── ...
├── services/
│   ├── emailService.js (nouveau)
│   ├── trackSortService.js (nouveau)
│   ├── spotifyService.ts (mise à jour)
│   ├── youtubeService.ts (nouveau)
│   ├── deezerService.ts (mise à jour)
│   └── ...
├── routes/
│   ├── playlists.js (mis à jour)
│   ├── verification.js (nouveau)
│   └── ...
└── sql/
    └── sortmyscene_schema_template.sql (nouvelle version)
```

## 🎯 Prochaines Étapes (Frontend)

1. **Créer des pages pour:**
   - Vérification d'email
   - Paramètres utilisateur (thème, langue)
   - Sélection des playlists
   - Tri et filtrage des tracks
   - Affichage des statistiques

2. **Mettre à jour les composants React:**
   - Enlever les éléments par défaut
   - Intégrer les appels API
   - Mettre à jour l'authentification pour gérer la vérification

3. **Ajouter la gestion des erreurs et des chargements**

## 📝 Notes

- Les codes de vérification expirent après 24 heures
- Les tokens OAuth sont stockés en base de données de manière sécurisée
- Le tri et le filtrage se font côté serveur pour optimiser les performances
- Les emails utilisent Nodemailer (compatible avec Gmail, Outlook, etc.)

## ❓ Support

Pour toute question ou problème:
1. Vérifiez les logs du serveur
2. Vérifiez que tous les variables d'environnement sont configurées
3. Assurez-vous que la base de données est correctement mise à jour
