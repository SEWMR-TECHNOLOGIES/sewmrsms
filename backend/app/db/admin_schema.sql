-- Admin System Schema
-- Separate admin users table (isolated from regular users)

CREATE TYPE admin_role_enum AS ENUM ('superadmin', 'admin', 'moderator');

-- Admin users (completely separate from regular users)
CREATE TABLE admin_users (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  role admin_role_enum NOT NULL DEFAULT 'admin',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_users_username ON admin_users(username);

-- Admin activity logs (audit trail)
CREATE TABLE admin_activity_logs (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  admin_id INT NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,            -- e.g. 'approve_sender_id', 'reject_sender_id', 'update_propagation'
  entity_type TEXT NOT NULL,       -- e.g. 'sender_id_request', 'user', 'subscription'
  entity_id INT,                   -- ID of the affected entity
  details JSONB,                   -- additional context
  ip_address TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_admin_activity_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_activity_logs_action ON admin_activity_logs(action);
CREATE INDEX idx_admin_activity_logs_entity ON admin_activity_logs(entity_type, entity_id);
CREATE INDEX idx_admin_activity_logs_created ON admin_activity_logs(created_at DESC);

-- System settings (key-value config)
CREATE TABLE system_settings (
  id SERIAL PRIMARY KEY,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  description TEXT,
  updated_by INT REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_system_settings_key ON system_settings(key);

-- Seed a default superadmin (password: Admin@12345 — change immediately!)
-- Password hash generated with PBKDF2 SHA256, 100000 iterations
-- You MUST generate a proper hash in production. This is a placeholder.
-- INSERT INTO admin_users (email, username, password_hash, first_name, last_name, role)
-- VALUES ('admin@sewmrsms.co.tz', 'superadmin', '<generate-hash>', 'Super', 'Admin', 'superadmin');

-- Default system settings
INSERT INTO system_settings (key, value, description) VALUES
('sms_gateway_url', '', 'SMS Gateway API URL'),
('sms_gateway_api_key', '', 'SMS Gateway API Key'),
('max_sms_per_request', '1000', 'Maximum SMS messages per single request'),
('maintenance_mode', 'false', 'Enable/disable maintenance mode'),
('default_sender_id', 'SEWMR', 'Default sender ID for system messages'),
('sms_rate_limit_per_minute', '100', 'Rate limit for SMS sending per user per minute'),
('auto_approve_student_requests', 'false', 'Auto-approve student sender ID requests'),
('password_reset_expiry_minutes', '30', 'Password reset token expiry in minutes');
