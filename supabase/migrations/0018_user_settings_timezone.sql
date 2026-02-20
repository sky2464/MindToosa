-- Migration: 0018_user_settings_timezone.sql
-- Adds timezone column to user_settings for personalized time display.

ALTER TABLE user_settings
  ADD COLUMN IF NOT EXISTS timezone TEXT;
