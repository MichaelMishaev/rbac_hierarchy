-- ============================================
-- INSTALL REQUIRED POSTGRESQL EXTENSIONS
-- ============================================
-- This script runs automatically when the container is first created

\echo 'Installing PostgreSQL extensions...'

-- Full-text search enhancements
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS btree_gin;

-- Geospatial support
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

-- Performance monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Case-insensitive text
CREATE EXTENSION IF NOT EXISTS citext;

-- UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Cryptographic functions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

\echo 'Extensions installed successfully!'

-- Verify extensions
SELECT extname, extversion 
FROM pg_extension 
WHERE extname NOT IN ('plpgsql')
ORDER BY extname;
