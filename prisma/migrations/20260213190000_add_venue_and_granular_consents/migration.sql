-- AlterTable: add venueName to event_nights
ALTER TABLE "event_nights" ADD COLUMN "venueName" TEXT;

-- AlterTable: add granular GDPR consent fields to consents
ALTER TABLE "consents" ADD COLUMN "consentPlatform" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "consents" ADD COLUMN "consentControllerMarketing" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "consents" ADD COLUMN "consentShareWithHost" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "consents" ADD COLUMN "consentHostMarketing" BOOLEAN NOT NULL DEFAULT false;
