/*
  Warnings:

  - Made the column `challenge` on table `User` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `User` MODIFY `challenge` VARCHAR(191) NOT NULL;
