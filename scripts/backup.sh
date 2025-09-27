#!/bin/bash

# HMIS Database Backup Script
# Creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="/backups"
DB_NAME="${POSTGRES_DB:-hmis_db}"
DB_USER="${POSTGRES_USER:-hmis_user}"
DB_HOST="${DB_HOST:-postgres}"
DB_PORT="${DB_PORT:-5432}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/hmis_backup_${TIMESTAMP}.sql"
RETENTION_DAYS="${BACKUP_RETENTION_DAYS:-30}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "Starting database backup..."
echo "Database: $DB_NAME"
echo "Host: $DB_HOST:$DB_PORT"
echo "Backup file: $BACKUP_FILE"

# Create database backup
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
    --verbose --clean --no-owner --no-privileges \
    --format=plain --file="$BACKUP_FILE"

# Compress the backup
gzip "$BACKUP_FILE"
BACKUP_FILE="${BACKUP_FILE}.gz"

echo "Backup completed: $BACKUP_FILE"

# Clean up old backups
echo "Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "hmis_backup_*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "Backup process completed successfully!"

