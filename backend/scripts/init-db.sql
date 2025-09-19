-- HMIS Database Initialization Script
-- This script creates the database user and sets up the schema

-- Create the database user
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'hmis_user') THEN
        CREATE ROLE hmis_user WITH LOGIN PASSWORD 'hmis_secure_password_2024';
    END IF;
END
$$;

-- Grant privileges on the default database (created by POSTGRES_DB)
GRANT ALL PRIVILEGES ON DATABASE hmis_db TO hmis_user;

-- Connect to the database and set up schema
\c hmis_db;

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO hmis_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hmis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hmis_user;

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO hmis_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO hmis_user;
