#!/bin/bash

# HMIS Database Backup and Recovery Script
# Comprehensive backup and recovery solution for PostgreSQL

set -e

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-hmis_production}"
DB_USER="${DB_USER:-hmis_user}"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/hmis}"
RETENTION_DAYS="${RETENTION_DAYS:-30}"
LOG_FILE="${LOG_FILE:-/var/log/hmis-backup.log}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" | tee -a "$LOG_FILE"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1" | tee -a "$LOG_FILE"
}

# Create backup directory if it doesn't exist
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log "Created backup directory: $BACKUP_DIR"
    fi
}

# Full database backup
full_backup() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/hmis_full_backup_$timestamp.sql"
    local compressed_file="$backup_file.gz"

    log "Starting full database backup..."

    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --no-password --format=plain --no-owner --no-privileges \
        --file="$backup_file" 2>>"$LOG_FILE"; then

        # Compress the backup
        gzip "$backup_file"
        log "Full backup completed: $compressed_file"

        # Verify backup integrity
        if gzip -t "$compressed_file" 2>/dev/null; then
            log "Backup integrity verified"
            echo "$compressed_file"
        else
            error "Backup integrity check failed"
            rm -f "$compressed_file"
            return 1
        fi
    else
        error "Full backup failed"
        return 1
    fi
}

# Schema-only backup
schema_backup() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/hmis_schema_backup_$timestamp.sql"
    local compressed_file="$backup_file.gz"

    log "Starting schema-only backup..."

    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --no-password --format=plain --schema-only --no-owner --no-privileges \
        --file="$backup_file" 2>>"$LOG_FILE"; then

        gzip "$backup_file"
        log "Schema backup completed: $compressed_file"
        echo "$compressed_file"
    else
        error "Schema backup failed"
        return 1
    fi
}

# Data-only backup
data_backup() {
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/hmis_data_backup_$timestamp.sql"
    local compressed_file="$backup_file.gz"

    log "Starting data-only backup..."

    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --no-password --format=plain --data-only --no-owner --no-privileges \
        --file="$backup_file" 2>>"$LOG_FILE"; then

        gzip "$backup_file"
        log "Data backup completed: $compressed_file"
        echo "$compressed_file"
    else
        error "Data backup failed"
        return 1
    fi
}

# Custom backup (specific tables)
custom_backup() {
    local tables="$1"
    local timestamp=$(date '+%Y%m%d_%H%M%S')
    local backup_file="$BACKUP_DIR/hmis_custom_backup_$timestamp.sql"
    local compressed_file="$backup_file.gz"

    log "Starting custom backup for tables: $tables"

    if pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" \
        --verbose --no-password --format=plain --no-owner --no-privileges \
        --table="$tables" --file="$backup_file" 2>>"$LOG_FILE"; then

        gzip "$backup_file"
        log "Custom backup completed: $compressed_file"
        echo "$compressed_file"
    else
        error "Custom backup failed"
        return 1
    fi
}

# Restore from backup
restore_backup() {
    local backup_file="$1"
    local target_db="${2:-$DB_NAME}"

    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi

    log "Starting restore from: $backup_file"

    # Check if backup is compressed
    if [[ "$backup_file" == *.gz ]]; then
        if gunzip -c "$backup_file" | psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" -v ON_ERROR_STOP=1; then
            log "Restore completed successfully"
        else
            error "Restore failed"
            return 1
        fi
    else
        if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$target_db" -v ON_ERROR_STOP=1 < "$backup_file"; then
            log "Restore completed successfully"
        else
            error "Restore failed"
            return 1
        fi
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log "Cleaning up backups older than $RETENTION_DAYS days..."

    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted_count++))
        log "Deleted old backup: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -print0)

    log "Cleaned up $deleted_count old backup files"
}

# List available backups
list_backups() {
    log "Available backups in $BACKUP_DIR:"
    ls -la "$BACKUP_DIR"/*.sql.gz 2>/dev/null | while read -r line; do
        echo "  $line"
    done
}

# Backup verification
verify_backup() {
    local backup_file="$1"

    if [ ! -f "$backup_file" ]; then
        error "Backup file not found: $backup_file"
        return 1
    fi

    log "Verifying backup: $backup_file"

    if [[ "$backup_file" == *.gz ]]; then
        if gzip -t "$backup_file" 2>/dev/null; then
            log "Backup file is valid and not corrupted"

            # Check if it's a valid SQL dump
            if gunzip -c "$backup_file" | head -n 10 | grep -q "PostgreSQL database dump"; then
                log "Backup contains valid PostgreSQL dump"
                return 0
            else
                error "Backup does not contain valid PostgreSQL dump"
                return 1
            fi
        else
            error "Backup file is corrupted"
            return 1
        fi
    else
        if head -n 10 "$backup_file" | grep -q "PostgreSQL database dump"; then
            log "Backup contains valid PostgreSQL dump"
            return 0
        else
            error "Backup does not contain valid PostgreSQL dump"
            return 1
        fi
    fi
}

# Database health check
health_check() {
    log "Performing database health check..."

    if psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" >/dev/null 2>&1; then
        log "Database connection successful"

        # Check database size
        local db_size=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT pg_size_pretty(pg_database_size('$DB_NAME'));" | xargs)
        log "Database size: $db_size"

        # Check table counts
        local table_count=$(psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public';" | xargs)
        log "Number of tables: $table_count"

        return 0
    else
        error "Database connection failed"
        return 1
    fi
}

# Automated backup with rotation
automated_backup() {
    log "Starting automated backup process..."

    # Create backup directory
    create_backup_dir

    # Perform health check
    if ! health_check; then
        error "Health check failed, aborting backup"
        return 1
    fi

    # Create full backup
    if full_backup; then
        log "Automated backup completed successfully"

        # Cleanup old backups
        cleanup_old_backups

        return 0
    else
        error "Automated backup failed"
        return 1
    fi
}

# Show usage
usage() {
    echo "HMIS Database Backup and Recovery Script"
    echo ""
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  full                    Create full database backup"
    echo "  schema                  Create schema-only backup"
    echo "  data                    Create data-only backup"
    echo "  custom <tables>         Create custom backup for specific tables"
    echo "  restore <backup_file>   Restore from backup file"
    echo "  list                    List available backups"
    echo "  verify <backup_file>    Verify backup file integrity"
    echo "  cleanup                 Clean up old backups"
    echo "  health                  Perform database health check"
    echo "  auto                    Run automated backup with cleanup"
    echo "  help                    Show this help message"
    echo ""
    echo "Environment Variables:"
    echo "  DB_HOST                 Database host (default: localhost)"
    echo "  DB_PORT                 Database port (default: 5432)"
    echo "  DB_NAME                 Database name (default: hmis_production)"
    echo "  DB_USER                 Database user (default: hmis_user)"
    echo "  BACKUP_DIR              Backup directory (default: /var/backups/hmis)"
    echo "  RETENTION_DAYS          Backup retention days (default: 30)"
    echo "  LOG_FILE                Log file path (default: /var/log/hmis-backup.log)"
    echo ""
    echo "Examples:"
    echo "  $0 full                                    # Create full backup"
    echo "  $0 custom 'users,patients,appointments'    # Backup specific tables"
    echo "  $0 restore /path/to/backup.sql.gz          # Restore from backup"
    echo "  $0 auto                                    # Automated backup"
}

# Main script logic
main() {
    case "${1:-help}" in
        "full")
            create_backup_dir
            full_backup
            ;;
        "schema")
            create_backup_dir
            schema_backup
            ;;
        "data")
            create_backup_dir
            data_backup
            ;;
        "custom")
            if [ -z "$2" ]; then
                error "Please specify tables for custom backup"
                exit 1
            fi
            create_backup_dir
            custom_backup "$2"
            ;;
        "restore")
            if [ -z "$2" ]; then
                error "Please specify backup file to restore"
                exit 1
            fi
            restore_backup "$2" "$3"
            ;;
        "list")
            list_backups
            ;;
        "verify")
            if [ -z "$2" ]; then
                error "Please specify backup file to verify"
                exit 1
            fi
            verify_backup "$2"
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        "health")
            health_check
            ;;
        "auto")
            automated_backup
            ;;
        "help"|*)
            usage
            ;;
    esac
}

# Run main function with all arguments
main "$@"
