-- Add the new flag and its timestamp first, so the backfill below can read the
-- old column before it is dropped.
ALTER TABLE "User"
  ADD COLUMN "isOnboarded" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "onboardedAt" TIMESTAMP(3);

-- Anyone who had already completed the profile form carries straight over.
UPDATE "User"
SET "isOnboarded" = true,
    "onboardedAt" = "onboardingCompletedAt"
WHERE "onboardingCompletedAt" IS NOT NULL;

-- Accounts that predate this flag were created under the old flow, where
-- belonging to an organization was the end of onboarding. Without this they
-- would all be dragged back through the wizard on their next page load.
UPDATE "User"
SET "isOnboarded" = true,
    "onboardedAt" = COALESCE("onboardedAt", "createdAt")
WHERE "organizationId" IS NOT NULL
  AND "isOnboarded" = false;

ALTER TABLE "User" DROP COLUMN "onboardingCompletedAt";
