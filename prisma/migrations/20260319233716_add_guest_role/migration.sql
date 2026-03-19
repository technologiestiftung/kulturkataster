-- AlterTable
ALTER TABLE "role" ADD COLUMN     "is_guest" BOOLEAN NOT NULL DEFAULT false;

-- Ensure at most one role can be marked as guest
CREATE UNIQUE INDEX "role_single_guest_idx"
ON "role" ("is_guest")
WHERE "is_guest" = true;
