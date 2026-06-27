-- Multi-Tenant SaaS Database Initialization

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create schemas (optional - for complete multi-tenancy)
-- CREATE SCHEMA IF NOT EXISTS public;
-- CREATE SCHEMA IF NOT EXISTS auth;

-- Tables will be created by Prisma migrations
-- This file is a placeholder for custom initialization if needed

-- Example: Create initial audit tables or seed data
-- CREATE TABLE IF NOT EXISTS audit_logs (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   table_name VARCHAR(255) NOT NULL,
--   action VARCHAR(50) NOT NULL,
--   record_id UUID NOT NULL,
--   user_id UUID,
--   changes JSONB,
--   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
-- );

-- CREATE INDEX IF NOT EXISTS idx_audit_logs_tenant_created ON audit_logs(created_at);
