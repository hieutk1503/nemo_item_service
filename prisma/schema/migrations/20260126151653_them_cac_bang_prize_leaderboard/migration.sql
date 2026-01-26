-- CreateTable
CREATE TABLE `leaderboard_prize_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `game_id` VARCHAR(30) NOT NULL,
    `rank_from` INTEGER NOT NULL,
    `rank_to` INTEGER NOT NULL,
    `reward_type` ENUM('Items', 'Wallet') NOT NULL,
    `reward_id` VARCHAR(30) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `leaderboard_prize_config_game_id_is_active_idx`(`game_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `leaderboard_snapshot` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `game_id` VARCHAR(30) NOT NULL,
    `season_id` INTEGER NOT NULL,
    `user_id` VARCHAR(64) NOT NULL,
    `user_name` VARCHAR(50) NOT NULL,
    `total_score` BIGINT NOT NULL,
    `rank_score` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `leaderboard_snapshot_game_id_season_id_rank_score_idx`(`game_id`, `season_id`, `rank_score`),
    UNIQUE INDEX `leaderboard_snapshot_game_id_season_id_user_id_key`(`game_id`, `season_id`, `user_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `score_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(64) NOT NULL,
    `game_id` VARCHAR(30) NOT NULL,
    `season_id` INTEGER NOT NULL,
    `score_plus` INTEGER NOT NULL,
    `total_score` BIGINT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `score_history_user_id_game_id_idx`(`user_id`, `game_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `luckybox_prize_config` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `game_id` VARCHAR(30) NOT NULL,
    `reward_type` ENUM('Items', 'Wallet') NOT NULL,
    `reward_id` VARCHAR(30) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `weight` DOUBLE NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT true,

    INDEX `luckybox_prize_config_game_id_is_active_idx`(`game_id`, `is_active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `reward_history` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` VARCHAR(64) NOT NULL,
    `game_id` VARCHAR(30) NOT NULL,
    `source_type` ENUM('luckybox', 'leaderboard') NOT NULL,
    `source_id` VARCHAR(30) NULL,
    `reward_type` ENUM('Items', 'Wallet') NOT NULL,
    `reward_id` VARCHAR(30) NOT NULL,
    `quantity` INTEGER NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `reward_history_user_id_game_id_idx`(`user_id`, `game_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
