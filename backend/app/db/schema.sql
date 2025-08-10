-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enums
CREATE TYPE payment_method_enum AS ENUM ('bank', 'mobile', 'card', 'cash', 'other');

CREATE TYPE payment_status_enum AS ENUM ('pending', 'completed', 'failed', 'cancelled');

CREATE TYPE sender_status_enum AS ENUM ('active', 'inactive', 'pending');

CREATE TYPE sender_id_request_status_enum AS ENUM ('pending', 'approved', 'rejected');

CREATE TYPE propagation_status_enum AS ENUM ('pending', 'propagated', 'failed');

CREATE TYPE subscription_status_enum AS ENUM ('active', 'inactive', 'cancelled', 'expired');

CREATE TYPE schedule_status_enum AS ENUM ('pending', 'sent', 'failed', 'cancelled');

CREATE TYPE message_status_enum AS ENUM ('pending', 'sent', 'failed');

-- Users
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  email TEXT NOT NULL UNIQUE,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT,
  phone VARCHAR(20),
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- access tokens
CREATE TABLE api_access_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash CHAR(64) NOT NULL UNIQUE,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT NOW() NOT NULL,
    expires_at TIMESTAMP WITHOUT TIME ZONE,
    revoked BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_api_access_tokens_user_id ON api_access_tokens(user_id);
CREATE INDEX idx_api_access_tokens_token_hash ON api_access_tokens(token_hash);


-- Contact groups
CREATE TABLE contact_groups (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Contacts
CREATE TABLE contacts (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT,
  phone VARCHAR(15) NOT NULL,
  email TEXT,
  group_id INT REFERENCES contact_groups(id) ON DELETE SET NULL,
  is_blacklisted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Networks
CREATE TABLE networks (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  name TEXT NOT NULL,
  color_code VARCHAR(7) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Benefits
CREATE TABLE benefits (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  description TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SMS packages
CREATE TABLE sms_packages (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  name TEXT NOT NULL,
  price_per_sms NUMERIC(10,2) NOT NULL,
  start_sms_count INT NOT NULL,
  best_for TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Package benefits (many-to-many between packages and benefits)
CREATE TABLE package_benefits (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  package_id INT NOT NULL REFERENCES sms_packages(id) ON DELETE CASCADE,
  benefit_id INT NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sender IDs
CREATE TABLE sender_ids (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  is_third_party BOOLEAN NOT NULL DEFAULT FALSE,
  status sender_status_enum DEFAULT 'active',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Subscription orders
CREATE TABLE subscription_orders (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  package_id INT NOT NULL REFERENCES sms_packages(id) ON DELETE CASCADE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  total_sms INT NOT NULL,
  payment_status payment_status_enum DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Order payments
CREATE TABLE order_payments (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  order_id INT NOT NULL REFERENCES subscription_orders(id) ON DELETE CASCADE,
  amount NUMERIC(15,2) NOT NULL,
  method payment_method_enum NOT NULL,
  status payment_status_enum DEFAULT 'pending',
  remarks TEXT DEFAULT NULL,
  paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Bank payments
CREATE TABLE bank_payments (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  order_payment_id INT NOT NULL REFERENCES order_payments(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  transaction_reference TEXT,
  slip_path TEXT NOT NULL,
  paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Mobile payments
CREATE TABLE mobile_payments (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  order_payment_id INT NOT NULL REFERENCES order_payments(id) ON DELETE CASCADE,
  gateway TEXT,
  merchant_request_id TEXT,
  checkout_request_id TEXT,
  transaction_reference TEXT,
  amount NUMERIC(15,2),
  reason TEXT,
  paid_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Sender ID requests
CREATE TABLE sender_id_requests (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_alias VARCHAR(11) NOT NULL,
  document_path TEXT,
  status sender_id_request_status_enum DEFAULT 'pending',
  sample_message TEXT,
  company_name TEXT,
  remarks TEXT DEFAULT NULL,
  is_student_request BOOLEAN NOT NULL DEFAULT FALSE,
  student_id_path TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);


-- Sender ID propagations
CREATE TABLE sender_id_propagations (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  request_id INT NOT NULL REFERENCES sender_id_requests(id) ON DELETE CASCADE,
  network_id INT NOT NULL REFERENCES networks(id) ON DELETE CASCADE,
  status propagation_status_enum DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- User subscriptions
CREATE TABLE user_subscriptions (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  total_sms INT NOT NULL,
  used_sms INT DEFAULT 0,
  remaining_sms INT GENERATED ALWAYS AS (total_sms - used_sms) STORED,
  status subscription_status_enum DEFAULT 'active',
  subscribed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SMS templates
CREATE TABLE sms_templates (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  sample_message TEXT NOT NULL,
  column_count INT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Template columns
CREATE TABLE template_columns (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  template_id INT NOT NULL REFERENCES sms_templates(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INT NOT NULL,
  is_phone_column BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SMS messages (logs)
CREATE TABLE sms_messages (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  sender_alias VARCHAR(11) NOT NULL,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sent_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SMS callbacks
CREATE TABLE sms_callbacks (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  message_id TEXT NOT NULL,
  phone VARCHAR(15) NOT NULL,
  status TEXT,
  uid TEXT,
  remarks TEXT,
  payload JSONB,
  received_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  sender_alias TEXT
);

-- SMS schedules metadata
CREATE TABLE sms_schedules (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT uuid_generate_v4() UNIQUE,
  user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id INT NOT NULL REFERENCES sender_ids(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  scheduled_for TIMESTAMP NOT NULL,
  status schedule_status_enum DEFAULT 'pending',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SMS scheduled messages (actual messages to send)
CREATE TABLE scheduled_messages (
  id SERIAL PRIMARY KEY,
  schedule_id INT NOT NULL REFERENCES sms_schedules(id) ON DELETE CASCADE,
  phone_number VARCHAR(15) NOT NULL,
  message TEXT NOT NULL,
  status message_status_enum DEFAULT 'pending',
  sent_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Insert benefits
INSERT INTO benefits (id, description) VALUES
(1, '1 or more SMS'),
(2, 'API Access'),
(3, '24/7 Support'),
(4, '99.9% Service Uptime'),
(5, '6,000 or more SMS'),
(6, '55,000 or more SMS'),
(7, '410,000 or more SMS'),
(8, '500,001 or more SMS');

-- Insert SMS packages (ordered by price ascending)
INSERT INTO sms_packages (id, name, price_per_sms, start_sms_count, best_for) VALUES
(1, 'Tembo', 14.00, 500001, 'For enterprises and high-volume SMS users'),
(2, 'Twiga', 16.00, 410000, 'For large-scale businesses'),
(3, 'Simba', 18.00, 55000, 'For medium-sized businesses'),
(4, 'Kifaru', 20.00, 6000, 'For growing businesses'),
(5, 'Nyati', 22.00, 1, 'For small businesses and startups');

-- Insert package benefits
INSERT INTO package_benefits (id, package_id, benefit_id) VALUES
(1, 5, 1),
(2, 5, 2),
(3, 5, 3),
(4, 5, 4),
(5, 4, 5),
(6, 4, 2),
(7, 4, 3),
(8, 4, 4),
(9, 3, 6),
(10, 3, 2),
(11, 3, 3),
(12, 3, 4),
(13, 2, 7),
(14, 2, 2),
(15, 2, 3),
(16, 2, 4),
(17, 1, 8),
(18, 1, 2),
(19, 1, 3),
(20, 1, 4);
