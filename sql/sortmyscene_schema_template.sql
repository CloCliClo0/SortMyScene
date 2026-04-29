-- SortMyScene MySQL schema template
-- Compatible with phpMyAdmin import
-- Charset: utf8mb4

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- Optional (use only if your MySQL user can create databases)
-- CREATE DATABASE IF NOT EXISTS `u555371370_db_sortmyscene`
--   CHARACTER SET utf8mb4
--   COLLATE utf8mb4_unicode_ci;
-- USE `u555371370_db_sortmyscene`;

CREATE TABLE IF NOT EXISTS `User` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `email` VARCHAR(191) NOT NULL,
  `password_hash` VARCHAR(191) NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `User_email_key` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `OAuthToken` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `provider` ENUM('deezer', 'spotify', 'youtube') NOT NULL,
  `access_token` TEXT NOT NULL,
  `refresh_token` TEXT NULL,
  `expires_in` INT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `OAuthToken_user_id_provider_key` (`user_id`, `provider`),
  KEY `OAuthToken_user_id_idx` (`user_id`),
  CONSTRAINT `OAuthToken_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Scene` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `user_id` INT NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `description` TEXT NOT NULL,
  `seed_tracks` JSON NOT NULL,
  `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  KEY `Scene_user_id_idx` (`user_id`),
  CONSTRAINT `Scene_user_id_fkey`
    FOREIGN KEY (`user_id`) REFERENCES `User` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `Track` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `scene_id` INT NOT NULL,
  `platform_id` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `artist` VARCHAR(191) NOT NULL,
  `album_art` TEXT NULL,
  `metadata` JSON NULL,
  PRIMARY KEY (`id`),
  KEY `Track_scene_id_idx` (`scene_id`),
  CONSTRAINT `Track_scene_id_fkey`
    FOREIGN KEY (`scene_id`) REFERENCES `Scene` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;
