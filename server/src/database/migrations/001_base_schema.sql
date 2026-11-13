-- ============================================================================
-- MIGRATION 001: BASE SOC SCHEMA (Compatible with existing schema.sql)
-- Engine: PostgreSQL 14+
-- ============================================================================

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS "pgcrypto";
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 1. USERS & ROLES
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM (
    'Security Administrator',
    'SOC Analyst',
    'Incident Responder',
    'Auditor',
    'Management / Read-only Viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(36) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role_enum NOT NULL DEFAULT 'SOC Analyst',
  department VARCHAR(255) NOT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'Active',
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. MONITORED ASSETS
DO $$ BEGIN
  CREATE TYPE asset_criticality_enum AS ENUM ('mission_critical', 'high', 'medium', 'low');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE asset_type_enum AS ENUM (
    'Workstation',
    'Windows Server',
    'Linux Server',
    'Domain Controller',
    'Network Switch',
    'Firewall',
    'Web Server',
    'Database Server'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS assets (
  id VARCHAR(36) PRIMARY KEY,
  hostname VARCHAR(255) UNIQUE NOT NULL,
  type asset_type_enum NOT NULL,
  os VARCHAR(255) NOT NULL,
  ip_address INET NOT NULL,
  mac_address MACADDR,
  criticality asset_criticality_enum NOT NULL DEFAULT 'medium',
  status VARCHAR(32) NOT NULL DEFAULT 'Online',
  last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  department VARCHAR(255) NOT NULL,
  agent_version VARCHAR(64),
  assigned_admin VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assets_ip ON assets (ip_address);
CREATE INDEX IF NOT EXISTS idx_assets_criticality ON assets (criticality);

-- 3. LOG SOURCES
DO $$ BEGIN
  CREATE TYPE source_status_enum AS ENUM ('healthy', 'delayed', 'offline', 'parsing_error');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE collection_method_enum AS ENUM (
    'Syslog',
    'WinRM',
    'WEF',
    'Endpoint Agent',
    'API',
    'SNMP',
    'Database JDBC'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS log_sources (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(128) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  collection_method collection_method_enum NOT NULL,
  ip_address INET NOT NULL,
  last_event_received TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  events_per_minute INTEGER NOT NULL DEFAULT 0,
  parsing_success_rate NUMERIC(5,2) NOT NULL DEFAULT 100.00,
  status source_status_enum NOT NULL DEFAULT 'healthy',
  data_freshness VARCHAR(64) NOT NULL DEFAULT '< 5 sec',
  retention_days INTEGER NOT NULL DEFAULT 180,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  error_log TEXT,
  total_events_processed BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. SECURITY EVENTS
DO $$ BEGIN
  CREATE TYPE severity_enum AS ENUM ('critical', 'high', 'medium', 'low', 'info');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE event_category_enum AS ENUM (
    'Authentication',
    'Network',
    'Malware',
    'Web Application',
    'System',
    'Endpoint',
    'DNS and DHCP',
    'Other'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS security_events (
  id VARCHAR(64) PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL,
  source_id VARCHAR(36) REFERENCES log_sources(id) ON DELETE SET NULL,
  source_name VARCHAR(255) NOT NULL,
  source_type VARCHAR(128) NOT NULL,
  hostname VARCHAR(255) NOT NULL,
  username VARCHAR(128),
  src_ip INET,
  dest_ip INET,
  category event_category_enum NOT NULL,
  severity severity_enum NOT NULL,
  original_message TEXT NOT NULL,
  normalized_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  related_alert_id VARCHAR(64),
  related_incident_id VARCHAR(64),
  collection_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  parsing_status VARCHAR(32) NOT NULL DEFAULT 'parsed'
);

CREATE INDEX IF NOT EXISTS idx_events_timestamp ON security_events (timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_events_severity ON security_events (severity);
CREATE INDEX IF NOT EXISTS idx_events_category ON security_events (category);
CREATE INDEX IF NOT EXISTS idx_events_src_ip ON security_events (src_ip);
CREATE INDEX IF NOT EXISTS idx_events_dest_ip ON security_events (dest_ip);
CREATE INDEX IF NOT EXISTS idx_events_hostname ON security_events (hostname);
CREATE INDEX IF NOT EXISTS idx_events_normalized_gin ON security_events USING GIN (normalized_fields);

-- 5. DETECTION RULES
CREATE TABLE IF NOT EXISTS detection_rules (
  id VARCHAR(64) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  severity severity_enum NOT NULL,
  category event_category_enum NOT NULL,
  detection_logic TEXT NOT NULL,
  required_sources TEXT[] NOT NULL DEFAULT '{}',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  last_triggered TIMESTAMPTZ,
  time_window_minutes INTEGER NOT NULL DEFAULT 5,
  investigation_guidance TEXT NOT NULL,
  sample_test_payload TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. SECURITY ALERTS
DO $$ BEGIN
  CREATE TYPE alert_status_enum AS ENUM (
    'new',
    'acknowledged',
    'assigned',
    'investigating',
    'linked',
    'false_positive'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS alerts (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  detection_rule_id VARCHAR(64) REFERENCES detection_rules(id) ON DELETE SET NULL,
  detection_rule_name VARCHAR(255) NOT NULL,
  severity severity_enum NOT NULL,
  first_detected TIMESTAMPTZ NOT NULL,
  last_detected TIMESTAMPTZ NOT NULL,
  source_system VARCHAR(255) NOT NULL,
  affected_asset VARCHAR(255) NOT NULL,
  related_incident_id VARCHAR(64),
  status alert_status_enum NOT NULL DEFAULT 'new',
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  false_positive_reason TEXT,
  false_positive_by VARCHAR(255),
  assigned_to VARCHAR(255),
  event_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_alerts_status ON alerts (status);
CREATE INDEX IF NOT EXISTS idx_alerts_severity ON alerts (severity);

-- 7. SECURITY INCIDENTS
DO $$ BEGIN
  CREATE TYPE incident_status_enum AS ENUM (
    'new',
    'investigating',
    'contained',
    'resolved',
    'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS incidents (
  id VARCHAR(64) PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  severity severity_enum NOT NULL,
  status incident_status_enum NOT NULL DEFAULT 'new',
  detection_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  affected_assets TEXT[] NOT NULL DEFAULT '{}',
  assigned_analyst VARCHAR(255) NOT NULL,
  source VARCHAR(255) NOT NULL,
  summary TEXT NOT NULL,
  description TEXT NOT NULL,
  related_event_ids TEXT[] NOT NULL DEFAULT '{}',
  related_alert_ids TEXT[] NOT NULL DEFAULT '{}',
  closed_resolution JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents (status);
CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents (severity);

-- 8. INCIDENT TIMELINE, NOTES, RESPONSE ACTIONS
CREATE TABLE IF NOT EXISTS incident_timeline (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_name VARCHAR(255) NOT NULL,
  action VARCHAR(255) NOT NULL,
  note TEXT,
  type VARCHAR(64) NOT NULL
);

CREATE TABLE IF NOT EXISTS investigation_notes (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  role VARCHAR(128) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  text TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS response_actions (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  incident_id VARCHAR(64) NOT NULL REFERENCES incidents(id) ON DELETE CASCADE,
  action_name VARCHAR(255) NOT NULL,
  target_asset VARCHAR(255) NOT NULL,
  initiated_by VARCHAR(255) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status VARCHAR(32) NOT NULL DEFAULT 'completed',
  result_details TEXT NOT NULL
);

-- 9. THREAT INDICATORS
CREATE TABLE IF NOT EXISTS threat_indicators (
  id VARCHAR(64) PRIMARY KEY,
  type VARCHAR(32) NOT NULL,
  value VARCHAR(512) NOT NULL,
  source VARCHAR(255) NOT NULL,
  first_observed TIMESTAMPTZ NOT NULL,
  last_observed TIMESTAMPTZ NOT NULL,
  confidence INTEGER NOT NULL CHECK (confidence >= 0 AND confidence <= 100),
  risk_rating severity_enum NOT NULL,
  related_events_count INTEGER NOT NULL DEFAULT 0,
  expiration_date DATE NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_threat_value ON threat_indicators (value);

-- 10. IMMUTABLE AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(64) PRIMARY KEY DEFAULT gen_random_uuid()::text,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_name VARCHAR(255) NOT NULL,
  role VARCHAR(128) NOT NULL,
  action VARCHAR(255) NOT NULL,
  target VARCHAR(255) NOT NULL,
  result VARCHAR(32) NOT NULL,
  details TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_logs (timestamp DESC);
