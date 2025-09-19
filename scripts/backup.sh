#!/bin/bash

# HMIS Automated Backup Script
# This script creates automated backups of the HMIS database and files

set -e

# Configuration
BACKUP_DIR="/var/backups/hmis"
DB_NAME="hmis_db"
DB_USER="hmis_user"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/var/log/hmis-backup.log"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Logging
log() {
    echo -e "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/files"
mkdir -p "$BACKUP_DIR/logs"

log "Starting HMIS backup process..."

# Database backup
log "Creating database backup..."
if docker-compose exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$BACKUP_DIR/database/hmis_db_$DATE.sql"; then
    # Compress the backup
    gzip "$BACKUP_DIR/database/hmis_db_$DATE.sql"
    success "Database backup created: hmis_db_$DATE.sql.gz"
else
    error "Database backup failed"
fi

# Files backup
log "Creating files backup..."
if [[ -d "uploads" ]]; then
    tar -czf "$BACKUP_DIR/files/uploads_$DATE.tar.gz" uploads/
    success "Files backup created: uploads_$DATE.tar.gz"
fi

# Logs backup
log "Creating logs backup..."
if docker-compose exec -T backend tar -czf - /app/logs 2>/dev/null > "$BACKUP_DIR/logs/logs_$DATE.tar.gz"; then
    success "Logs backup created: logs_$DATE.tar.gz"
fi

# Configuration backup
log "Creating configuration backup..."
tar -czf "$BACKUP_DIR/config_$DATE.tar.gz" \
    docker-compose.yml \
    nginx.conf \
    .env \
    2>/dev/null || true

# Cleanup old backups
log "Cleaning up old backups (older than $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -type f -mtime +$RETENTION_DAYS -delete
success "Old backups cleaned up"

# Create backup manifest
cat > "$BACKUP_DIR/backup_manifest_$DATE.txt" << EOF
HMIS Backup Manifest
Date: $(date)
Database: hmis_db_$DATE.sql.gz
Files: uploads_$DATE.tar.gz
Logs: logs_$DATE.tar.gz
Config: config_$DATE.tar.gz
EOF

log "Backup process completed successfully"
log "Backup location: $BACKUP_DIR"

# Optional: Upload to cloud storage
if [[ -n "${AWS_S3_BUCKET}" ]]; then
    log "Uploading backups to AWS S3..."
    aws s3 sync "$BACKUP_DIR" "s3://${AWS_S3_BUCKET}/hmis-backups/" --delete
    success "Backups uploaded to S3"
fi



