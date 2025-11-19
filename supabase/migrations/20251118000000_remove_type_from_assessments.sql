-- Remove the 'type' column from assessments table
-- This column was originally created with CHECK constraint for MARKET_SCAN/POSITION_REVIEW
-- but was never actually used in the codebase

ALTER TABLE assessments DROP COLUMN IF EXISTS type;
