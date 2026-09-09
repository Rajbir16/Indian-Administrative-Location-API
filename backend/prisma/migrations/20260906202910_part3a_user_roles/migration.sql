-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('B2B_USER', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'B2B_USER';

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
