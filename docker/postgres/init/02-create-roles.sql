-- ============================================
-- CREATE DATABASE ROLES
-- ============================================

\echo 'Creating database roles...'

-- Application role for runtime queries
CREATE ROLE app_user WITH LOGIN PASSWORD 'app_user_dev_password';

-- Read-only role for analytics/reports
CREATE ROLE app_readonly WITH LOGIN PASSWORD 'readonly_dev_password';

-- Migration role for schema changes
CREATE ROLE migration_user WITH LOGIN PASSWORD 'migration_dev_password';

-- Grant permissions
GRANT CONNECT ON DATABASE hierarchy_platform TO app_user;
GRANT CONNECT ON DATABASE hierarchy_platform TO app_readonly;
GRANT CONNECT ON DATABASE hierarchy_platform TO migration_user;

\echo 'Database roles created successfully!'
