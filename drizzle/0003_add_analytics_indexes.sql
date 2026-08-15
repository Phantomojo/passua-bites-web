-- Add indexes for analytics queries performance
-- The analyticsEvents table grows with every pageview; indexes speed up the aggregate queries used by the dashboard.

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at
  ON "analyticsEvents" ("createdAt");

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type
  ON "analyticsEvents" ("eventType");

CREATE INDEX IF NOT EXISTS idx_analytics_events_event_type_created_at
  ON "analyticsEvents" ("eventType", "createdAt");

CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id
  ON "analyticsEvents" ("sessionId");

CREATE INDEX IF NOT EXISTS idx_analytics_events_ip
  ON "analyticsEvents" ("ip");

CREATE INDEX IF NOT EXISTS idx_analytics_events_page
  ON "analyticsEvents" ("page");

CREATE INDEX IF NOT EXISTS idx_analytics_events_referer
  ON "analyticsEvents" ("referer");
