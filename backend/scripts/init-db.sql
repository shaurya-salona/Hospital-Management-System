-- Database initialization script
-- Creates the database user and sets up permissions

-- Create the database user (if it doesn't exist)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'hmis_user') THEN
        CREATE USER hmis_user WITH PASSWORD 'secure_password_change_me';
    END IF;
END
$$;

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON DATABASE hmis_db TO hmis_user;
GRANT ALL PRIVILEGES ON SCHEMA public TO hmis_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO hmis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO hmis_user;

-- Allow the user to create tables and databases
ALTER USER hmis_user CREATEDB;
ALTER USER hmis_user CREATEROLE;
