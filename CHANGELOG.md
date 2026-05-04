# CHANGELOG - SortMyScene v1.1.0

## 🎉 Nouvelles Fonctionnalités

### 1. Email Verification (Vérification d'Email)
- ✅ Code de vérification 6 caractères générés automatiquement
- ✅ Envoi d'email via SMTP (Gmail, Outlook, etc.)
- ✅ Expiration du code après 24 heures
- ✅ Endpoints API pour gérer la vérification

### 2. Playlist Management (Gestion des Playlists)
- ✅ Récupération des playlists Spotify
- ✅ Récupération des playlists YouTube
- ✅ Récupération des playlists Deezer
- ✅ Récupération des tracks de chaque playlist
- ✅ Mise en cache des playlists utilisateur

### 3. Advanced Track Sorting & Filtering (Tri et Filtrage Avancé)
- ✅ Tri par popularité, alphabétique, durée, artiste, date
- ✅ Filtrage par durée, popularité, artiste, titre, provider
- ✅ Statistiques des tracks (moyenne, total, min/max)
- ✅ Côté serveur pour optimiser les performances

### 4. User Preferences (Préférences Utilisateur)
- ✅ Thème (dark/light) stocké dans la base de données
- ✅ Langue (en, fr, es, etc.) stockée dans la base de données
- ✅ Persistance entre les sessions

### 5. Database Enhancements
- ✅ Table User améliorée (email_verified, theme, language)
- ✅ Table Track améliorée (provider, duration_ms, popularity)
- ✅ Table Scene améliorée (sort_criteria, updated_at)
- ✅ Table OAuthToken améliorée (timestamps)
- ✅ Nouvelle table UserPlaylist pour le cache

### 6. Service Improvements
- ✅ SpotifyService: Ajout de 6 nouvelles fonctions
- ✅ YouTubeService: Nouveau service complètement implémenté
- ✅ DeezerService: Ajout de 10 nouvelles fonctions
- ✅ EmailService: Nouveau service pour l'envoi d'emails
- ✅ TrackSortService: Nouveau service pour le tri et filtrage

## 📋 Fichiers Modifiés

### Backend
- ✅ `controllers/authController.js` - Ajout vérification email
- ✅ `controllers/playlistsController.js` - NOUVEAU
- ✅ `controllers/trackController.js` - Ajout tri/filtrage
- ✅ `controllers/verificationController.js` - NOUVEAU
- ✅ `models/User.js` - Ajout colonnes vérification
- ✅ `models/Scene.js` - Ajout sort_criteria
- ✅ `models/Track.js` - Ajout provider, duration, popularity
- ✅ `models/UserPlaylist.js` - NOUVEAU
- ✅ `models/index.js` - Ajout associations
- ✅ `services/emailService.js` - NOUVEAU
- ✅ `services/trackSortService.js` - NOUVEAU
- ✅ `services/spotifyService.ts` - Améliorations
- ✅ `services/youtubeService.ts` - NOUVEAU
- ✅ `services/deezerService.ts` - Améliorations
- ✅ `routes/playlists.js` - Complètement refondu
- ✅ `routes/verification.js` - NOUVEAU
- ✅ `server.js` - Ajout nouvelles routes
- ✅ `package.json` - Ajout nodemailer
- ✅ `.env` - Ajout variables SMTP

### Database
- ✅ `sql/sortmyscene_schema_template.sql` - Complètement mis à jour

### Documentation
- ✅ `IMPLEMENTATION_GUIDE.md` - NOUVEAU
- ✅ `API_ENDPOINTS.md` - NOUVEAU
- ✅ `CHANGELOG.md` - Ce fichier

## 🚀 Déploiement

### Étapes d'Installation

1. **Mettre à jour la base de données**
   ```bash
   # Option 1: Nouvelle base de données
   mysql -u user -p < sql/sortmyscene_schema_template.sql
   
   # Option 2: Base de données existante (voir IMPLEMENTATION_GUIDE.md)
   ```

2. **Installer les dépendances**
   ```bash
   npm install
   ```

3. **Configurer les variables d'environnement**
   ```bash
   # Ajouter dans .env:
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your-email@gmail.com
   SMTP_PASSWORD=your-app-password
   SMTP_FROM=noreply@sortmyscene.fr
   ```

4. **Démarrer le serveur**
   ```bash
   npm start
   ```

## 🔄 Migration depuis v1.0.0

Si vous avez une base de données existante:

```sql
-- 1. Ajouter les colonnes à User
ALTER TABLE `User` ADD COLUMN `email_verified` BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE `User` ADD COLUMN `email_verification_code` VARCHAR(6) NULL;
ALTER TABLE `User` ADD COLUMN `email_verification_expires` DATETIME NULL;
ALTER TABLE `User` ADD COLUMN `theme` VARCHAR(10) DEFAULT 'dark';
ALTER TABLE `User` ADD COLUMN `language` VARCHAR(5) DEFAULT 'en';

-- 2. Ajouter les colonnes à Track
ALTER TABLE `Track` ADD COLUMN `provider` ENUM('spotify', 'youtube', 'deezer') NOT NULL DEFAULT 'spotify' AFTER `scene_id`;
ALTER TABLE `Track` ADD COLUMN `duration_ms` INT NULL;
ALTER TABLE `Track` ADD COLUMN `popularity` INT NULL;
ALTER TABLE `Track` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- 3. Ajouter les colonnes à Scene
ALTER TABLE `Scene` ADD COLUMN `sort_criteria` VARCHAR(50) DEFAULT 'popularity';
ALTER TABLE `Scene` ADD COLUMN `updated_at` DATETIME(3) NULL ON UPDATE CURRENT_TIMESTAMP(3);

-- 4. Mettre à jour OAuthToken
ALTER TABLE `OAuthToken` MODIFY `provider` ENUM('google', 'spotify', 'youtube', 'deezer') NOT NULL;
ALTER TABLE `OAuthToken` MODIFY `access_token` LONGTEXT NOT NULL;
ALTER TABLE `OAuthToken` MODIFY `refresh_token` LONGTEXT NULL;
ALTER TABLE `OAuthToken` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
ALTER TABLE `OAuthToken` ADD COLUMN `updated_at` DATETIME(3) NULL ON UPDATE CURRENT_TIMESTAMP(3);

-- 5. Créer la table UserPlaylist
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

## ⚠️ Breaking Changes

Aucun breaking change pour les clients existants. Les nouveaux champs sont optionnels ou ont des valeurs par défaut.

## 🔧 Améliorations Techniques

- **Performance**: Tri et filtrage côté serveur
- **Sécurité**: Code de vérification email à usage unique
- **Scalabilité**: Support pour plusieurs providers de musique
- **Maintenabilité**: Code modulaire et bien documenté

## 📚 Documentation

Consultez les fichiers suivants:
- `IMPLEMENTATION_GUIDE.md` - Guide complet d'implémentation
- `API_ENDPOINTS.md` - Documentation détaillée des endpoints API
- `README.md` - Vue d'ensemble du projet

## 🎯 Prochaines Étapes

### Frontend (À faire)
1. Créer une page de vérification d'email
2. Créer une page de paramètres utilisateur
3. Ajouter une interface pour sélectionner les playlists
4. Ajouter une interface de tri/filtrage
5. Enlever les éléments par défaut des pages
6. Afficher les statistiques des tracks

### Backend (Optionnel)
1. Ajouter un système de cache Redis pour les playlists
2. Ajouter des webhooks pour les mises à jour en temps réel
3. Ajouter une API pour les recommandations personnalisées
4. Ajouter un système de partage de scènes

## 📞 Support

Pour toute question ou problème:
1. Vérifiez la configuration des variables d'environnement
2. Consultez les logs du serveur
3. Vérifiez que la base de données est correctement mise à jour

## 📅 Version

- **Version**: 1.1.0
- **Date**: Mai 2024
- **Status**: Production Ready
