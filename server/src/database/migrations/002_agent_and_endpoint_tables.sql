-- ============================================================================
-- MIGRATION 002: AGENT, ENDPOINT INVENTORY, SESSIONS & WINDOWS EVENT TABLES
-- Additive migration preserving all existing SOC entities
-- ============================================================================

-- Extend alert_status_enum with 'resolved'
DO $$ BEGIN
  ALTER TYPE alert_status_enum ADD VALUE IF NOT EXISTS 'resolved';
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Agent lifecycle statuses
DO $$ BEGIN
  CREATE TYPE agent_status_enum AS ENUM (
    'Online',
    'Offline',
    'Pending Enrollment',
    'Unhealthy',
    'Disabled'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 1. USER SESSIONS (Backend session-based authentication)
CREATE TABLE IF NOT EXISTS user_sessions (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  ip_address VARCHAR(64),
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions (expires_at);

-- 2. ENDPOINT AGENTS
CREATE TABLE IF NOT EXISTS endpoint_agents (
  id VARCHAR(64) PRIMARY KEY,
  hostname VARCHAR(255) NOT NULL,
  status agent_status_enum NOT NULL DEFAULT 'Pending Enrollment',
  agent_version VARCHAR(64) NOT NULL DEFAULT '1.0.0',
  ip_address INET,
  mac_address VARCHAR(32),
  os VARCHAR(255) NOT NULL DEFAULT 'Windows',
  os_version VARCHAR(128),
  os_build VARCHAR(64),
  domain_name VARCHAR(255),
  asset_id VARCHAR(36) REFERENCES assets(id) ON DELETE SET NULL,
  log_source_id VARCHAR(36) REFERENCES log_sources(id) ON DELETE SET NULL,
  last_heartbeat_at TIMESTAMPTZ,
  last_event_at TIMESTAMPTZ,
  total_events_collected BIGINT NOT NULL DEFAULT 0,
  last_error TEXT,
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deactivated_at TIMESTAMPTZ,
  deactivated_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_endpoint_agents_hostname_active
  ON endpoint_agents (LOWER(hostname))
  WHERE status <> 'Disabled';
CREATE INDEX IF NOT EXISTS idx_endpoint_agents_status ON endpoint_agents (status);
CREATE INDEX IF NOT EXISTS idx_endpoint_agents_last_hb ON endpoint_agents (last_heartbeat_at);

-- 3. ENROLLMENT TOKENS (One-time hashed enrollment tokens)
CREATE TABLE IF NOT EXISTS enrollment_tokens (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  token_hash VARCHAR(64) UNIQUE NOT NULL,
  token_prefix VARCHAR(32) NOT NULL,
  label VARCHAR(255) NOT NULL,
  created_by VARCHAR(36) REFERENCES users(id) ON DELETE SET NULL,
  created_by_name VARCHAR(255) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  max_uses INTEGER NOT NULL DEFAULT 1,
  use_count INTEGER NOT NULL DEFAULT 0,
  used_at TIMESTAMPTZ,
  used_by_agent_id VARCHAR(64) REFERENCES endpoint_agents(id) ON DELETE SET NULL,
  revoked_at TIMESTAMPTZ,
  revoked_by VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_enrollment_tokens_expires ON enrollment_tokens (expires_at);

-- 4. AGENT CREDENTIALS (Hashed per-agent API keys)
CREATE TABLE IF NOT EXISTS agent_credentials (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id VARCHAR(64) NOT NULL REFERENCES endpoint_agents(id) ON DELETE CASCADE,
  api_key_hash VARCHAR(64) UNIQUE NOT NULL,
  key_prefix VARCHAR(32) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  created_by_token_id VARCHAR(64) REFERENCES enrollment_tokens(id) ON DELETE SET NULL,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_agent_credentials_agent ON agent_credentials (agent_id);

-- 5. AGENT CONFIGURATIONS
CREATE TABLE IF NOT EXISTS agent_configurations (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id VARCHAR(64) UNIQUE NOT NULL REFERENCES endpoint_agents(id) ON DELETE CASCADE,
  heartbeat_interval_sec INTEGER NOT NULL DEFAULT 30,
  offline_threshold_sec INTEGER NOT NULL DEFAULT 120,
  batch_size INTEGER NOT NULL DEFAULT 50,
  flush_interval_sec INTEGER NOT NULL DEFAULT 10,
  enabled_channels TEXT[] NOT NULL DEFAULT ARRAY['Security', 'System', 'Application', 'Microsoft-Windows-PowerShell/Operational'],
  monitored_event_ids INTEGER[] NOT NULL DEFAULT ARRAY[
    4624, 4625, 4634, 4648, 4672, 4688, 4697, 4698, 4702, 4719, 4720,
    4722, 4724, 4728, 4732, 4740, 4768, 4769, 4771, 4776, 1102, 7045
  ],
  config_version INTEGER NOT NULL DEFAULT 1,
  updated_by VARCHAR(255),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. AGENT HEARTBEATS
CREATE TABLE IF NOT EXISTS agent_heartbeats (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id VARCHAR(64) NOT NULL REFERENCES endpoint_agents(id) ON DELETE CASCADE,
  status agent_status_enum NOT NULL,
  agent_version VARCHAR(64) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  ip_address INET,
  cpu_usage_pct NUMERIC(5,2),
  memory_usage_pct NUMERIC(5,2),
  disk_free_mb BIGINT,
  queue_depth INTEGER NOT NULL DEFAULT 0,
  buffer_overflow BOOLEAN NOT NULL DEFAULT FALSE,
  ingestion_errors INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_agent_heartbeats_agent_time
  ON agent_heartbeats (agent_id, received_at DESC);

-- 7. ENDPOINT INVENTORY
CREATE TABLE IF NOT EXISTS endpoint_inventory (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id VARCHAR(64) UNIQUE NOT NULL REFERENCES endpoint_agents(id) ON DELETE CASCADE,
  hostname VARCHAR(255) NOT NULL,
  fqdn VARCHAR(255),
  domain_membership VARCHAR(255),
  workgroup VARCHAR(255),
  os_name VARCHAR(255) NOT NULL,
  os_version VARCHAR(128),
  os_build VARCHAR(64),
  architecture VARCHAR(32),
  cpu_model VARCHAR(255),
  cpu_cores INTEGER,
  total_memory_mb BIGINT,
  disk_total_gb NUMERIC(10,2),
  ip_addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
  mac_addresses JSONB NOT NULL DEFAULT '[]'::jsonb,
  hardware_vendor VARCHAR(255),
  hardware_model VARCHAR(255),
  serial_number VARCHAR(128),
  last_boot_time TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_endpoint_inventory_hostname ON endpoint_inventory (hostname);

-- 8. ADDITIVE COLUMNS ON EXISTING TABLES
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS agent_id VARCHAR(64) REFERENCES endpoint_agents(id) ON DELETE SET NULL;
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS dedup_hash VARCHAR(64);
ALTER TABLE security_events ADD COLUMN IF NOT EXISTS windows_event_id INTEGER;

CREATE UNIQUE INDEX IF NOT EXISTS idx_security_events_dedup_hash
  ON security_events (dedup_hash)
  WHERE dedup_hash IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_security_events_agent_time
  ON security_events (agent_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_win_id
  ON security_events (windows_event_id);

ALTER TABLE detection_rules ADD COLUMN IF NOT EXISTS rule_key VARCHAR(64);
ALTER TABLE detection_rules ADD COLUMN IF NOT EXISTS threshold_count INTEGER NOT NULL DEFAULT 1;
ALTER TABLE detection_rules ADD COLUMN IF NOT EXISTS config JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE UNIQUE INDEX IF NOT EXISTS idx_detection_rules_key
  ON detection_rules (rule_key)
  WHERE rule_key IS NOT NULL;

ALTER TABLE alerts ADD COLUMN IF NOT EXISTS agent_id VARCHAR(64) REFERENCES endpoint_agents(id) ON DELETE SET NULL;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS dedup_key VARCHAR(255);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS source_ip INET;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolved_by VARCHAR(255);
ALTER TABLE alerts ADD COLUMN IF NOT EXISTS resolution_note TEXT;
CREATE INDEX IF NOT EXISTS idx_alerts_dedup_key ON alerts (dedup_key);
CREATE INDEX IF NOT EXISTS idx_alerts_agent_id ON alerts (agent_id);

ALTER TABLE incidents ADD COLUMN IF NOT EXISTS agent_id VARCHAR(64) REFERENCES endpoint_agents(id) ON DELETE SET NULL;

-- 9. WINDOWS EVENT DETAILS
CREATE TABLE IF NOT EXISTS windows_event_details (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  security_event_id VARCHAR(64) UNIQUE NOT NULL REFERENCES security_events(id) ON DELETE CASCADE,
  agent_id VARCHAR(64) REFERENCES endpoint_agents(id) ON DELETE SET NULL,
  windows_event_id INTEGER NOT NULL,
  record_id BIGINT,
  dedup_hash VARCHAR(64) UNIQUE NOT NULL,
  channel VARCHAR(128) NOT NULL DEFAULT 'Security',
  provider_name VARCHAR(255) NOT NULL DEFAULT 'Microsoft-Windows-Security-Auditing',
  computer_name VARCHAR(255) NOT NULL,
  domain_name VARCHAR(255),
  target_username VARCHAR(255),
  subject_username VARCHAR(255),
  logon_type INTEGER,
  process_name TEXT,
  process_id INTEGER,
  parent_process_name TEXT,
  parent_process_id INTEGER,
  command_line TEXT,
  service_name VARCHAR(255),
  task_name VARCHAR(255),
  target_group VARCHAR(255),
  status_code VARCHAR(64),
  sub_status VARCHAR(64),
  raw_xml TEXT,
  structured_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  event_timestamp TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_win_events_event_id ON windows_event_details (windows_event_id);
CREATE INDEX IF NOT EXISTS idx_win_events_agent_time ON windows_event_details (agent_id, event_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_win_events_computer ON windows_event_details (computer_name);
CREATE INDEX IF NOT EXISTS idx_win_events_target_user ON windows_event_details (target_username);
CREATE INDEX IF NOT EXISTS idx_win_events_channel ON windows_event_details (channel);
CREATE INDEX IF NOT EXISTS idx_win_events_timestamp ON windows_event_details (event_timestamp DESC);

-- 10. INGESTION STATS (Hourly rolled-up agent ingestion telemetry)
CREATE TABLE IF NOT EXISTS ingestion_stats (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  agent_id VARCHAR(64) NOT NULL REFERENCES endpoint_agents(id) ON DELETE CASCADE,
  bucket_hour TIMESTAMPTZ NOT NULL,
  events_received INTEGER NOT NULL DEFAULT 0,
  events_inserted INTEGER NOT NULL DEFAULT 0,
  events_deduplicated INTEGER NOT NULL DEFAULT 0,
  events_failed INTEGER NOT NULL DEFAULT 0,
  alerts_triggered INTEGER NOT NULL DEFAULT 0,
  last_event_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (agent_id, bucket_hour)
);

CREATE INDEX IF NOT EXISTS idx_ingestion_stats_bucket ON ingestion_stats (bucket_hour DESC);
