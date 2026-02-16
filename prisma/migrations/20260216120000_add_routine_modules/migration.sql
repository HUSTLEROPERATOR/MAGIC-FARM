-- Add Routine Modules support to EventNight
ALTER TABLE "event_nights" ADD COLUMN "routinesEnabled" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "event_nights" ADD COLUMN "routinesConfig" JSONB;
