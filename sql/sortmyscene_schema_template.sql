-- SortMyScene MySQL schema template (Updated 2025-05-21)
-- Compatible with phpMyAdmin import
-- Charset: utf8mb4
-- Features:
--   - Email verification (6-char code)
--   - Multi-provider OAuth (Spotify, YouTube, Deezer)
--   - User preferences (theme, language)
--   - Scene cover image (image_url)
--   - AI-powered track sorting (Gemini)
--   - Playlist cache (UserPlaylist)

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Optional: only if your MySQL user can create databases
-- CREATE DATABASE IF NOT EXISTS `u555371370_db_sortmyscene`
--   CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;
-- USE `u555371370_db_sortmyscene`;

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: User
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `User` (
  `id`                          INT           NOT NULL AUTO_INCREMENT,
  `email`                       VARCHAR(191)  NOT NULL,
  `password_hash`               VARCHAR(191)  NULL,
  `is_admin`                    BOOLEAN       NOT NULL DEFAULT FALSE,
  `email_verified`              BOOLEAN       NOT NULL DEFAULT FALSE,
  `email_verification_code`     VARCHAR(6)    NULL,
  `email_verification_expires`  DATETIME      NULL,
  `theme`                       VARCHAR(10)   DEFAULT 'dark',
  `language`                    VARCHAR(5)    DEFAULT 'en',
  `created_at`                  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`),
  KEY `User_email_verified_idx` (`email_verified`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: OAuthToken  (music providers only: spotify, youtube, deezer)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `OAuthToken` (
  `id`            INT           NOT NULL AUTO_INCREMENT,
  `user_id`       INT           NOT NULL,
  `provider`      VARCHAR(20)   NOT NULL COMMENT 'spotify | youtube | deezer',
  `access_token`  LONGTEXT      NOT NULL,
  `refresh_token` LONGTEXT      NULL,
  `expires_in`    INT           NULL,
  `created_at`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)   NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `OAuthToken_user_id_provider_key` (`user_id`, `provider`),
  KEY `OAuthToken_user_id_idx` (`user_id`),
  CONSTRAINT `OAuthToken_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: Scene
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `Scene` (
  `id`            INT           NOT NULL AUTO_INCREMENT,
  `user_id`       INT           NOT NULL,
  `name`          VARCHAR(191)  NOT NULL,
  `description`   LONGTEXT      NOT NULL,
  `seed_tracks`   JSON          NOT NULL,
  `sort_criteria` VARCHAR(50)   DEFAULT 'popularity',
  `image_url`     LONGTEXT      NULL COMMENT 'Cover image URL (from playlist or manual)',
  `created_at`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updated_at`    DATETIME(3)   NULL ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Scene_user_id_idx` (`user_id`),
  CONSTRAINT `Scene_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: Track
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `Track` (
  `id`          INT           NOT NULL AUTO_INCREMENT,
  `scene_id`    INT           NOT NULL,
  `provider`    ENUM('spotify', 'youtube', 'deezer') NOT NULL DEFAULT 'spotify',
  `platform_id` VARCHAR(191)  NOT NULL,
  `title`       VARCHAR(191)  NOT NULL,
  `artist`      VARCHAR(191)  NOT NULL,
  `album_art`   LONGTEXT      NULL,
  `duration_ms` INT           NULL,
  `popularity`  INT           NULL,
  `metadata`    JSON          NULL,
  `created_at`  DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Track_scene_id_idx` (`scene_id`),
  KEY `Track_platform_id_idx` (`platform_id`),
  CONSTRAINT `Track_scene_id_fkey`
    FOREIGN KEY (`scene_id`) REFERENCES `Scene` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─────────────────────────────────────────────────────────────────────────────
-- Table: UserPlaylist  (playlist cache per provider)
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS `UserPlaylist` (
  `id`            INT           NOT NULL AUTO_INCREMENT,
  `user_id`       INT           NOT NULL,
  `provider`      ENUM('spotify', 'youtube', 'deezer') NOT NULL,
  `playlist_id`   VARCHAR(191)  NOT NULL,
  `playlist_name` VARCHAR(191)  NOT NULL,
  `platform_url`  LONGTEXT      NULL,
  `track_count`   INT           DEFAULT 0,
  `cached_at`     DATETIME(3)   NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `UserPlaylist_user_provider_id_key` (`user_id`, `provider`, `playlist_id`),
  KEY `UserPlaylist_user_id_idx` (`user_id`),
  CONSTRAINT `UserPlaylist_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- =============================================================================
-- MIGRATIONS — run these on existing production databases
-- =============================================================================

-- User table additions
-- ALTER TABLE `User` ADD COLUMN `email_verified`             BOOLEAN   NOT NULL DEFAULT FALSE;
-- ALTER TABLE `User` ADD COLUMN `email_verification_code`    VARCHAR(6) NULL;
-- ALTER TABLE `User` ADD COLUMN `email_verification_expires` DATETIME  NULL;
-- ALTER TABLE `User` ADD COLUMN `theme`                      VARCHAR(10) DEFAULT 'dark';
-- ALTER TABLE `User` ADD COLUMN `language`                   VARCHAR(5)  DEFAULT 'en';

-- OAuthToken — switch from ENUM to VARCHAR(20) for provider
-- ALTER TABLE `OAuthToken` MODIFY `provider` VARCHAR(20) NOT NULL;
-- ALTER TABLE `OAuthToken` MODIFY `access_token`  LONGTEXT NOT NULL;
-- ALTER TABLE `OAuthToken` MODIFY `refresh_token` LONGTEXT NULL;
-- ALTER TABLE `OAuthToken` ADD COLUMN `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
-- ALTER TABLE `OAuthToken` ADD COLUMN `updated_at` DATETIME(3) NULL ON UPDATE CURRENT_TIMESTAMP(3);

-- Scene additions
-- ALTER TABLE `Scene` MODIFY `description` LONGTEXT NOT NULL;
-- ALTER TABLE `Scene` ADD COLUMN `sort_criteria` VARCHAR(50) DEFAULT 'popularity';
-- ALTER TABLE `Scene` ADD COLUMN `updated_at`   DATETIME(3) NULL ON UPDATE CURRENT_TIMESTAMP(3);
-- ALTER TABLE `Scene` ADD COLUMN `image_url`    LONGTEXT NULL;

-- Track additions
-- ALTER TABLE `Track` ADD COLUMN `provider`    ENUM('spotify','youtube','deezer') NOT NULL DEFAULT 'spotify' AFTER `scene_id`;
-- ALTER TABLE `Track` MODIFY `album_art`       LONGTEXT NULL;
-- ALTER TABLE `Track` ADD COLUMN `duration_ms` INT NULL;
-- ALTER TABLE `Track` ADD COLUMN `popularity`  INT NULL;
-- ALTER TABLE `Track` ADD COLUMN `metadata`    JSON NULL;
-- ALTER TABLE `Track` ADD COLUMN `created_at`  DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);
