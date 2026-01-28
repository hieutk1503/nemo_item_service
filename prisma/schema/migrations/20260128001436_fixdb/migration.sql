/*
  Warnings:

  - You are about to alter the column `user_id` on the `leaderboard_snapshot` table. The data in that column could be lost. The data in that column will be cast from `VarChar(64)` to `VarChar(20)`.
  - You are about to alter the column `user_id` on the `reward_history` table. The data in that column could be lost. The data in that column will be cast from `VarChar(64)` to `VarChar(20)`.
  - You are about to alter the column `user_id` on the `score_history` table. The data in that column could be lost. The data in that column will be cast from `VarChar(64)` to `VarChar(20)`.
  - A unique constraint covering the columns `[refId]` on the table `transactions` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `leaderboard_prize_config` MODIFY `game_id` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `leaderboard_snapshot` MODIFY `game_id` VARCHAR(50) NOT NULL,
    MODIFY `user_id` VARCHAR(20) NOT NULL;

-- AlterTable
ALTER TABLE `luckybox_prize_config` MODIFY `game_id` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `reward_history` MODIFY `user_id` VARCHAR(20) NOT NULL,
    MODIFY `game_id` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `score_history` MODIFY `user_id` VARCHAR(20) NOT NULL,
    MODIFY `game_id` VARCHAR(50) NOT NULL;

-- AlterTable
ALTER TABLE `transactions` ADD COLUMN `amount` DECIMAL(10, 2) NULL,
    ADD COLUMN `refId` VARCHAR(100) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `transactions_refId_key` ON `transactions`(`refId`);

-- CreateIndex
CREATE INDEX `transactions_gameCode_createdAt_idx` ON `transactions`(`gameCode`, `createdAt`);

-- AddForeignKey
ALTER TABLE `leaderboard_prize_config` ADD CONSTRAINT `leaderboard_prize_config_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leaderboard_snapshot` ADD CONSTRAINT `leaderboard_snapshot_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `leaderboard_snapshot` ADD CONSTRAINT `leaderboard_snapshot_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`msisdn`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_history` ADD CONSTRAINT `score_history_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `score_history` ADD CONSTRAINT `score_history_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`msisdn`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `luckybox_prize_config` ADD CONSTRAINT `luckybox_prize_config_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_history` ADD CONSTRAINT `reward_history_game_id_fkey` FOREIGN KEY (`game_id`) REFERENCES `games`(`code`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `reward_history` ADD CONSTRAINT `reward_history_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `users`(`msisdn`) ON DELETE RESTRICT ON UPDATE CASCADE;
