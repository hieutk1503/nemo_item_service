-- CreateTable
CREATE TABLE `items` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `category_id` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `inventories` (
    `inventory_id` INTEGER NOT NULL AUTO_INCREMENT,
    `user_id` INTEGER NOT NULL,
    `game_type` VARCHAR(191) NOT NULL,
    `item_reference_id` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `item_type` VARCHAR(191) NOT NULL,
    `current_level` INTEGER NOT NULL DEFAULT 1,
    `is_equipped` BOOLEAN NOT NULL DEFAULT false,
    `custom_data` JSON NULL,

    UNIQUE INDEX `inventories_user_id_game_type_item_reference_id_key`(`user_id`, `game_type`, `item_reference_id`),
    PRIMARY KEY (`inventory_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `items` ADD CONSTRAINT `items_category_id_fkey` FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `inventories` ADD CONSTRAINT `inventories_item_reference_id_fkey` FOREIGN KEY (`item_reference_id`) REFERENCES `items`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
