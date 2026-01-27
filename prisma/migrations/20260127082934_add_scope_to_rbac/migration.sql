-- CreateEnum
CREATE TYPE "PermissionScope" AS ENUM ('own', 'all');

-- AlterTable
ALTER TABLE "role_table_permission" ADD COLUMN     "scope" "PermissionScope" NOT NULL DEFAULT 'own';
