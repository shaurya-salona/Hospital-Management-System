#!/bin/bash

# HMIS Production Deployment Script
# This script automates the deployment process for the HMIS application

set -e  # Exit on any error

# Configuration
APP_NAME="hmis"
DOCKER_COMPOSE_FILE="docker-compose.yml"
BACKUP_DIR="/var/backups/hmis"
LOG_FILE="/var/log/hmis-deploy.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$LOG_FILE"
    exit 1
}

warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$LOG_FILE"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$LOG_FILE"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root for security reasons"
    fi
}

# Check prerequisites
check_prerequisites() {
    log "Checking prerequisites..."
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        error "Docker is not installed. Please install Docker first."
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        error "Docker Compose is not installed. Please install Docker Compose first."
    fi
    
    # Check if .env file exists
    if [[ ! -f .env ]]; then
        error ".env file not found. Please create it from .env.example"
    fi
    
    # Check if Docker daemon is running
    if ! docker info &> /dev/null; then
        error "Docker daemon is not running. Please start Docker."
    fi
    
    success "Prerequisites check passed"
}

# Create backup
create_backup() {
    log "Creating backup..."
    
    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    
    # Backup database if container is running
    if docker-compose ps postgres | grep -q "Up"; then
        log "Backing up database..."
        docker-compose exec -T postgres pg_dump -U hmis_user hmis_db > "$BACKUP_DIR/hmis_db_$(date +%Y%m%d_%H%M%S).sql"
        success "Database backup created"
    fi
    
    # Backup application data
    if [[ -d "uploads" ]]; then
        log "Backing up uploads..."
        tar -czf "$BACKUP_DIR/uploads_$(date +%Y%m%d_%H%M%S).tar.gz" uploads/
        success "Uploads backup created"
    fi
    
    success "Backup completed"
}

# Pull latest code
pull_code() {
    log "Pulling latest code..."
    
    if [[ -d ".git" ]]; then
        git fetch origin
        git pull origin main
        success "Code updated from repository"
    else
        warning "Not a git repository. Skipping code pull."
    fi
}

# Build and deploy
deploy() {
    log "Starting deployment..."
    
    # Pull latest images
    log "Pulling Docker images..."
    docker-compose pull
    
    # Build application
    log "Building application..."
    docker-compose build --no-cache
    
    # Stop existing containers
    log "Stopping existing containers..."
    docker-compose down
    
    # Start services
    log "Starting services..."
    docker-compose up -d
    
    # Wait for services to be ready
    log "Waiting for services to be ready..."
    sleep 30
    
    # Check service health
    check_health
    
    success "Deployment completed"
}

# Check service health
check_health() {
    log "Checking service health..."
    
    # Check backend health
    for i in {1..10}; do
        if curl -f http://localhost:5000/health &> /dev/null; then
            success "Backend service is healthy"
            break
        else
            if [[ $i -eq 10 ]]; then
                error "Backend service health check failed after 10 attempts"
            fi
            log "Waiting for backend service... (attempt $i/10)"
            sleep 10
        fi
    done
    
    # Check frontend
    if curl -f http://localhost &> /dev/null; then
        success "Frontend service is healthy"
    else
        error "Frontend service health check failed"
    fi
    
    # Check database
    if docker-compose exec -T postgres pg_isready -U hmis_user -d hmis_db &> /dev/null; then
        success "Database service is healthy"
    else
        error "Database service health check failed"
    fi
}

# Cleanup old images and containers
cleanup() {
    log "Cleaning up..."
    
    # Remove unused images
    docker image prune -f
    
    # Remove unused containers
    docker container prune -f
    
    # Remove unused networks
    docker network prune -f
    
    # Remove unused volumes (be careful with this)
    # docker volume prune -f
    
    success "Cleanup completed"
}

# Show status
show_status() {
    log "Service Status:"
    docker-compose ps
    
    log "Resource Usage:"
    docker stats --no-stream
    
    log "Recent logs:"
    docker-compose logs --tail=20
}

# Rollback function
rollback() {
    log "Rolling back to previous version..."
    
    # Stop current containers
    docker-compose down
    
    # Restore from backup (this is a simplified example)
    if [[ -f "$BACKUP_DIR/docker-compose.yml.backup" ]]; then
        cp "$BACKUP_DIR/docker-compose.yml.backup" docker-compose.yml
        docker-compose up -d
        success "Rollback completed"
    else
        error "No backup found for rollback"
    fi
}

# Main deployment function
main() {
    log "Starting HMIS deployment process..."
    
    check_root
    check_prerequisites
    
    case "${1:-deploy}" in
        "deploy")
            create_backup
            pull_code
            deploy
            cleanup
            show_status
            ;;
        "backup")
            create_backup
            ;;
        "status")
            show_status
            ;;
        "rollback")
            rollback
            ;;
        "health")
            check_health
            ;;
        "cleanup")
            cleanup
            ;;
        *)
            echo "Usage: $0 {deploy|backup|status|rollback|health|cleanup}"
            echo "  deploy  - Full deployment (default)"
            echo "  backup  - Create backup only"
            echo "  status  - Show service status"
            echo "  rollback - Rollback to previous version"
            echo "  health  - Check service health"
            echo "  cleanup - Clean up unused Docker resources"
            exit 1
            ;;
    esac
    
    success "Operation completed successfully!"
}

# Run main function with all arguments
main "$@"
