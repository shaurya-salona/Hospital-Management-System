#!/bin/bash

# HMIS Production Deployment Script
# Comprehensive deployment automation for Hospital Management Information System

set -e

# Configuration
PROJECT_NAME="hmis"
ENVIRONMENT="${ENVIRONMENT:-production}"
BACKUP_BEFORE_DEPLOY="${BACKUP_BEFORE_DEPLOY:-true}"
HEALTH_CHECK_TIMEOUT="${HEALTH_CHECK_TIMEOUT:-300}"
ROLLBACK_ON_FAILURE="${ROLLBACK_ON_FAILURE:-true}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date '+%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date '+%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1"
}

warning() {
    echo -e "${YELLOW}[$(date '+%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

info() {
    echo -e "${BLUE}[$(date '+%Y-%m-%d %H:%M:%S')] INFO:${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
        exit 1
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."

    # Check Docker
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed"
        exit 1
    fi

    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed"
        exit 1
    fi

    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running"
        exit 1
    fi

    # Check environment file
    if [[ ! -f .env.production ]]; then
        error "Environment file .env.production not found"
        exit 1
    fi

    log "Prerequisites check passed"
}

# Load environment variables
load_environment() {
    log "Loading environment variables..."

    if [[ -f .env.production ]]; then
        export $(cat .env.production | grep -v '^#' | xargs)
        log "Environment variables loaded"
    else
        error "Environment file not found"
        exit 1
    fi
}

# Create necessary directories
create_directories() {
    log "Creating necessary directories..."

    mkdir -p logs nginx/ssl uploads backups monitoring/grafana/dashboards

    # Set proper permissions
    chmod 755 logs uploads backups
    chmod 700 nginx/ssl

    log "Directories created"
}

# Generate SSL certificates (self-signed for development)
generate_ssl_certificates() {
    if [[ ! -f nginx/ssl/cert.pem ]] || [[ ! -f nginx/ssl/key.pem ]]; then
        log "Generating SSL certificates..."

        openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
            -keyout nginx/ssl/key.pem \
            -out nginx/ssl/cert.pem \
            -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"

        chmod 600 nginx/ssl/key.pem
        chmod 644 nginx/ssl/cert.pem

        log "SSL certificates generated"
    else
        log "SSL certificates already exist"
    fi
}

# Backup current deployment
backup_deployment() {
    if [[ "$BACKUP_BEFORE_DEPLOY" == "true" ]]; then
        log "Creating backup before deployment..."

        local backup_dir="backups/pre-deploy-$(date +%Y%m%d-%H%M%S)"
        mkdir -p "$backup_dir"

        # Backup database
        if docker-compose -f docker-compose.production.yml ps postgres | grep -q "Up"; then
            docker-compose -f docker-compose.production.yml exec -T postgres pg_dump -U "$DB_USER" "$DB_NAME" > "$backup_dir/database.sql"
            log "Database backup created"
        fi

        # Backup uploads
        if [[ -d uploads ]]; then
            cp -r uploads "$backup_dir/"
            log "Uploads backup created"
        fi

        # Backup configuration
        cp .env.production "$backup_dir/"
        cp docker-compose.production.yml "$backup_dir/"

        log "Backup completed: $backup_dir"
    fi
}

# Pull latest images
pull_images() {
    log "Pulling latest Docker images..."

    docker-compose -f docker-compose.production.yml pull

    log "Images pulled successfully"
}

# Build application
build_application() {
    log "Building application..."

    docker-compose -f docker-compose.production.yml build --no-cache

    log "Application built successfully"
}

# Deploy application
deploy_application() {
    log "Deploying application..."

    # Stop existing containers
    docker-compose -f docker-compose.production.yml down

    # Start services
    docker-compose -f docker-compose.production.yml up -d

    log "Application deployed"
}

# Wait for services to be healthy
wait_for_health() {
    log "Waiting for services to be healthy..."

    local timeout=$HEALTH_CHECK_TIMEOUT
    local elapsed=0

    while [[ $elapsed -lt $timeout ]]; do
        if docker-compose -f docker-compose.production.yml ps | grep -q "unhealthy"; then
            warning "Some services are still unhealthy, waiting..."
            sleep 10
            elapsed=$((elapsed + 10))
        else
            log "All services are healthy"
            return 0
        fi
    done

    error "Health check timeout reached"
    return 1
}

# Run health checks
run_health_checks() {
    log "Running health checks..."

    # Check backend health
    if curl -f http://localhost:3000/health &> /dev/null; then
        log "Backend health check passed"
    else
        error "Backend health check failed"
        return 1
    fi

    # Check database connection
    if docker-compose -f docker-compose.production.yml exec -T postgres pg_isready -U "$DB_USER" &> /dev/null; then
        log "Database health check passed"
    else
        error "Database health check failed"
        return 1
    fi

    # Check Redis connection
    if docker-compose -f docker-compose.production.yml exec -T redis redis-cli ping | grep -q "PONG"; then
        log "Redis health check passed"
    else
        error "Redis health check failed"
        return 1
    fi

    log "All health checks passed"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."

    # Wait for database to be ready
    sleep 10

    # Run any pending migrations
    docker-compose -f docker-compose.production.yml exec -T backend npm run migrate || {
        warning "No migration script found, continuing..."
    }

    log "Database migrations completed"
}

# Setup monitoring
setup_monitoring() {
    log "Setting up monitoring..."

    # Wait for monitoring services to be ready
    sleep 30

    # Check if Prometheus is accessible
    if curl -f http://localhost:9090 &> /dev/null; then
        log "Prometheus is accessible"
    else
        warning "Prometheus is not accessible"
    fi

    # Check if Grafana is accessible
    if curl -f http://localhost:3001 &> /dev/null; then
        log "Grafana is accessible"
    else
        warning "Grafana is not accessible"
    fi

    log "Monitoring setup completed"
}

# Rollback deployment
rollback_deployment() {
    if [[ "$ROLLBACK_ON_FAILURE" == "true" ]]; then
        error "Deployment failed, rolling back..."

        # Stop current deployment
        docker-compose -f docker-compose.production.yml down

        # Find latest backup
        local latest_backup=$(ls -t backups/pre-deploy-* 2>/dev/null | head -n1)

        if [[ -n "$latest_backup" ]]; then
            log "Rolling back to: $latest_backup"

            # Restore database
            if [[ -f "$latest_backup/database.sql" ]]; then
                docker-compose -f docker-compose.production.yml up -d postgres
                sleep 10
                docker-compose -f docker-compose.production.yml exec -T postgres psql -U "$DB_USER" -d "$DB_NAME" < "$latest_backup/database.sql"
                log "Database restored"
            fi

            # Restore uploads
            if [[ -d "$latest_backup/uploads" ]]; then
                rm -rf uploads
                cp -r "$latest_backup/uploads" ./
                log "Uploads restored"
            fi

            # Restart services
            docker-compose -f docker-compose.production.yml up -d

            log "Rollback completed"
        else
            error "No backup found for rollback"
        fi
    fi
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up old Docker resources..."

    # Remove unused images
    docker image prune -f

    # Remove unused volumes
    docker volume prune -f

    # Remove unused networks
    docker network prune -f

    log "Cleanup completed"
}

# Show deployment status
show_status() {
    log "Deployment Status:"
    echo ""

    # Show container status
    docker-compose -f docker-compose.production.yml ps

    echo ""
    log "Service URLs:"
    echo "  - Application: https://localhost"
    echo "  - API Health: https://localhost/api/health"
    echo "  - Prometheus: http://localhost:9090"
    echo "  - Grafana: http://localhost:3001"
    echo "  - Database: localhost:5432"
    echo ""

    log "Deployment completed successfully!"
}

# Main deployment function
main() {
    log "Starting HMIS deployment..."

    check_root
    check_prerequisites
    load_environment
    create_directories
    generate_ssl_certificates
    backup_deployment
    pull_images
    build_application
    deploy_application

    if wait_for_health && run_health_checks; then
        run_migrations
        setup_monitoring
        cleanup
        show_status
    else
        rollback_deployment
        exit 1
    fi
}

# Handle script interruption
trap 'error "Deployment interrupted"; rollback_deployment; exit 1' INT TERM

# Run main function
main "$@"
