# 🏥 HMIS Production Setup Guide

This guide walks you through setting up the Hospital Management Information System (HMIS) in a production environment.

## 📋 Prerequisites

### System Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / RHEL 8+
- **RAM**: Minimum 4GB (8GB+ recommended)
- **CPU**: 2+ cores
- **Storage**: 50GB+ free space
- **Network**: Static IP address, ports 80, 443, 5432 open

### Required Software
- Docker 20.10+
- Docker Compose 2.0+
- Git
- SSL certificates (for HTTPS)

## 🚀 Quick Start

### 1. Clone Repository
```bash
git clone https://github.com/your-org/hmis-complete.git
cd hmis-complete
```

### 2. Environment Configuration
```bash
# Copy production environment template
cp env.production .env

# Edit configuration
nano .env
```

**Critical settings to update:**
```bash
# Database
DB_PASSWORD=your_secure_database_password_here

# JWT Secrets (minimum 32 characters)
JWT_SECRET=your_super_secure_jwt_secret_key_here_minimum_32_characters
JWT_REFRESH_SECRET=your_super_secure_refresh_token_secret_here

# CORS Origins (your domain)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Email Configuration
SMTP_HOST=smtp.yourmailprovider.com
SMTP_USER=noreply@yourdomain.com
SMTP_PASS=your_email_password

# Redis Password
REDIS_PASSWORD=your_redis_password_here
```

### 3. SSL Certificate Setup
```bash
# Create SSL directory
mkdir -p ssl

# Copy your SSL certificates
cp your-domain.crt ssl/
cp your-domain.key ssl/

# Update nginx.conf with your domain
sed -i 's/yourdomain.com/your-actual-domain.com/g' nginx.conf
```

### 4. Deploy Application
```bash
# Make deployment script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh deploy
```

## 🔧 Detailed Configuration

### Database Configuration
The system uses PostgreSQL with the following recommended settings:

```bash
# In .env file
DB_HOST=postgres
DB_PORT=5432
DB_NAME=hmis_production
DB_USER=hmis_user
DB_PASSWORD=your_secure_password
DB_SSL=true
DB_MAX_CONNECTIONS=20
```

### Security Configuration
```bash
# Strong password hashing
BCRYPT_SALT_ROUNDS=12

# Rate limiting
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100

# Session security
SESSION_SECRET=your_session_secret_here
SESSION_TIMEOUT=86400000     # 24 hours
```

### Logging Configuration
```bash
# Production logging
LOG_LEVEL=info
LOG_MAX_SIZE=10485760        # 10MB
LOG_MAX_FILES=10
LOG_COMPRESS=true
```

### Backup Configuration
```bash
# Automated backups
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *     # Daily at 2 AM
BACKUP_RETENTION_DAYS=30
BACKUP_PATH=/var/backups/hmis
```

## 🐳 Docker Deployment

### Production Deployment
```bash
# Build and start all services
docker-compose up -d

# Check service status
docker-compose ps

# View logs
docker-compose logs -f backend
```

### Service Management
```bash
# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update services
docker-compose pull && docker-compose up -d
```

### Scaling Services
```bash
# Scale backend instances
docker-compose up -d --scale backend=3

# Scale with load balancer
docker-compose -f docker-compose.yml -f docker-compose.scale.yml up -d
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoints
- **Basic Health**: `GET /health`
- **Readiness**: `GET /health/ready`
- **Liveness**: `GET /health/live`
- **Detailed**: `GET /health/detailed`
- **Metrics**: `GET /health/metrics`

### Log Monitoring
```bash
# View real-time logs
docker-compose logs -f

# View specific service logs
docker-compose logs backend
docker-compose logs postgres
docker-compose logs nginx
```

### Performance Monitoring
Enable Prometheus and Grafana:
```bash
# Start monitoring stack
docker-compose --profile monitoring up -d

# Access Grafana: http://your-domain:3001
# Default login: admin/admin
```

## 🔒 Security Hardening

### 1. Firewall Configuration
```bash
# Ubuntu/Debian
sudo ufw allow 22/tcp      # SSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw enable

# CentOS/RHEL
sudo firewall-cmd --permanent --add-service=ssh
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 2. SSL/TLS Configuration
Update `nginx.conf` for production:
```nginx
# Uncomment SSL server block
server {
    listen 443 ssl http2;
    server_name yourdomain.com;
    
    ssl_certificate /etc/nginx/ssl/yourdomain.crt;
    ssl_certificate_key /etc/nginx/ssl/yourdomain.key;
    
    # Strong SSL configuration
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
}
```

### 3. Database Security
```bash
# Secure PostgreSQL
docker-compose exec postgres psql -U hmis_user -d hmis_db -c "
ALTER USER hmis_user WITH PASSWORD 'your_new_secure_password';
REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO hmis_user;
"
```

### 4. Container Security
```bash
# Run security scan
docker scan hmis-backend:latest

# Update base images regularly
docker-compose pull
docker-compose up -d
```

## 🔄 Backup & Recovery

### Automated Backups
```bash
# Set up cron job for automated backups
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /path/to/hmis-complete/scripts/backup.sh
```

### Manual Backup
```bash
# Create backup
./scripts/backup.sh

# Backup location
ls -la /var/backups/hmis/
```

### Recovery Process
```bash
# Stop services
docker-compose down

# Restore database
gunzip -c /var/backups/hmis/database/hmis_db_20240115_020000.sql.gz | \
docker-compose exec -T postgres psql -U hmis_user -d hmis_db

# Restore files
tar -xzf /var/backups/hmis/files/uploads_20240115_020000.tar.gz

# Start services
docker-compose up -d
```

## 📊 Performance Optimization

### Database Optimization
```sql
-- Connect to database
docker-compose exec postgres psql -U hmis_user -d hmis_db

-- Create indexes for better performance
CREATE INDEX CONCURRENTLY idx_patients_email ON patients(email);
CREATE INDEX CONCURRENTLY idx_appointments_date ON appointments(appointment_date);
CREATE INDEX CONCURRENTLY idx_medical_records_patient ON medical_records(patient_id);

-- Update statistics
ANALYZE;
```

### Application Optimization
```bash
# In .env file
# Enable caching
CACHE_ENABLED=true
CACHE_TTL=300

# Redis configuration
REDIS_HOST=redis
REDIS_TTL=3600

# Connection pooling
DB_MAX_CONNECTIONS=20
DB_IDLE_TIMEOUT=30000
```

### Nginx Optimization
```nginx
# In nginx.conf
worker_processes auto;
worker_connections 2048;

# Enable gzip compression
gzip on;
gzip_comp_level 6;

# Enable caching
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Database Connection Failed
```bash
# Check database status
docker-compose logs postgres

# Restart database
docker-compose restart postgres

# Check connection
docker-compose exec backend npm run test:db
```

#### 2. High Memory Usage
```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart

# Scale down if necessary
docker-compose up -d --scale backend=1
```

#### 3. SSL Certificate Issues
```bash
# Check certificate validity
openssl x509 -in ssl/yourdomain.crt -text -noout

# Verify certificate chain
openssl verify -CAfile ca-bundle.crt ssl/yourdomain.crt
```

#### 4. Application Not Starting
```bash
# Check logs
docker-compose logs backend

# Check environment variables
docker-compose exec backend env | grep -E "(DB_|JWT_|NODE_)"

# Restart with fresh containers
docker-compose down
docker-compose up -d --force-recreate
```

### Log Analysis
```bash
# View error logs
docker-compose exec backend tail -f /app/logs/error.log

# View access logs
docker-compose exec nginx tail -f /var/log/nginx/access.log

# Search for specific errors
docker-compose logs backend | grep ERROR
```

## 📈 Maintenance

### Regular Tasks
```bash
# Weekly: Update system packages
sudo apt update && sudo apt upgrade -y

# Monthly: Clean Docker system
docker system prune -a -f

# Monthly: Rotate logs
docker-compose exec backend find /app/logs -name "*.log" -mtime +30 -delete

# Quarterly: Update Docker images
docker-compose pull
docker-compose up -d
```

### Health Monitoring
```bash
# Check service health
curl -f http://localhost:5000/health

# Monitor resource usage
docker stats --no-stream

# Check disk usage
df -h
du -sh /var/lib/docker/
```

## 🔧 Advanced Configuration

### Load Balancing
For high-traffic scenarios, set up multiple backend instances:

```yaml
# docker-compose.scale.yml
version: '3.8'
services:
  backend:
    deploy:
      replicas: 3
  
  nginx:
    depends_on:
      - backend
```

### External Database
For production, consider using managed PostgreSQL:

```bash
# In .env
DB_HOST=your-managed-db-host.amazonaws.com
DB_PORT=5432
DB_SSL=true
```

### CDN Integration
Configure CDN for static assets:

```nginx
# In nginx.conf
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    add_header Cache-Control "public, max-age=31536000";
    # Optionally proxy to CDN
}
```

## 📞 Support

### Getting Help
- **Documentation**: Check the `/docs` folder
- **Issues**: Create GitHub issues
- **Logs**: Always include relevant logs when reporting issues
- **Health Check**: Use `/health/detailed` endpoint for diagnostics

### Emergency Contacts
- **System Admin**: admin@yourdomain.com
- **Database Admin**: dba@yourdomain.com
- **Security Team**: security@yourdomain.com

---

## ✅ Production Checklist

Before going live, ensure:

- [ ] SSL certificates installed and configured
- [ ] Environment variables properly set
- [ ] Database credentials changed from defaults
- [ ] Firewall configured
- [ ] Backup system tested
- [ ] Health checks responding
- [ ] Logs being generated
- [ ] Monitoring configured
- [ ] Performance tested
- [ ] Security scan completed

---

*For additional support, please refer to the main README.md or contact the development team.*


