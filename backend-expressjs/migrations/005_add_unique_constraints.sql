-- Migration: Add UNIQUE constraints and additional indexes
-- Date: 2025-12-06

-- 1. Add UNIQUE constraint on campaign_recipients to prevent duplicate recipients
-- SQLite doesn't support ALTER TABLE ADD CONSTRAINT, so we create a unique index instead
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaign_recipients_unique
ON campaign_recipients(campaign_id, loyalty_user_id);

-- 2. Add index for faster recipient lookup by user
CREATE INDEX IF NOT EXISTS idx_campaign_recipients_user_status
ON campaign_recipients(loyalty_user_id, status);

-- 3. Add index for trigger logs by user (for checking recent triggers)
CREATE INDEX IF NOT EXISTS idx_trigger_logs_user
ON trigger_logs(loyalty_user_id, created_at);

-- 4. Add index for finding scheduled campaigns efficiently
CREATE INDEX IF NOT EXISTS idx_campaigns_scheduled_status
ON campaigns(scheduled_at, status) WHERE status = 'scheduled';
