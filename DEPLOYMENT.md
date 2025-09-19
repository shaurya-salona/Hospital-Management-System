# Deployment Guide

This guide provides detailed instructions for deploying the Hospital Management Information System (HMIS) in different environments.

## 🚀 Quick Deployment

### Using Docker (Recommended)

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/hmis-complete.git
   cd hmis-complete
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your production values
   ```

3. **Start the system**
   ```bash
   docker-compose up -d
   ```

4. **Access the application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs

## 🐳 Docker Deployment

### Production Deployment

1. **Use production Docker Compose**
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

2. **Monitor the deployment**
   ```bash
   docker-compose logs -f
   ```

3. **Check health status**
   ```bash
   curl http://localhost:5000/health
   ```

### Docker Services

- **PostgreSQL**: Database server (Port 5432)
- **Redis**: Caching and sessions (Port 6379)
- **Backend**: Node.js API server (Port 5000)
- **Frontend**: Nginx static file server (Port 80)
- **Backup**: Automated backup service

## 🖥️ Manual Deployment

### Prerequisites
- Node.js 16+
- PostgreSQL 12+
- Redis (optional)
- Nginx (for production)

### Backend Setup

1. **Install dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your database credentials
   ```

3. **Setup database**
   ```bash
   npm run setup:db
   ```

4. **Start the server**
   ```bash
   npm start
   ```

### Frontend Setup

1. **Serve static files**
   ```bash
   # Using Python
   python -m http.server 3000

   # Using Node.js
   npx serve -s . -l 3000

   # Using Nginx (production)
   # Configure nginx.conf
   ```

## ☁️ Cloud Deployment

### AWS Deployment

1. **EC2 Instance**
   ```bash
   # Launch EC2 instance
   # Install Docker
   sudo yum update -y
   sudo yum install -y docker
   sudo service docker start
   sudo usermod -a -G docker ec2-user

   # Clone and deploy
   git clone https://github.com/your-username/hmis-complete.git
   cd hmis-complete
   docker-compose up -d
   ```

2. **RDS Database**
   - Create PostgreSQL RDS instance
   - Update .env with RDS endpoint
   - Configure security groups

3. **Load Balancer**
   - Create Application Load Balancer
   - Configure target groups
   - Set up SSL certificates

### DigitalOcean Deployment

1. **Droplet Setup**
   ```bash
   # Create droplet with Docker pre-installed
   # Clone repository
   git clone https://github.com/your-username/hmis-complete.git
   cd hmis-complete

   # Configure environment
   cp env.example .env
   # Edit .env

   # Deploy
   docker-compose up -d
   ```

2. **Managed Database**
   - Create managed PostgreSQL database
   - Update connection string in .env
   - Configure firewall rules

### Heroku Deployment

1. **Prepare for Heroku**
   ```bash
   # Add Procfile
   echo "web: cd backend && npm start" > Procfile

   # Add buildpacks
   heroku buildpacks:add heroku/nodejs
   ```

2. **Deploy**
   ```bash
   # Create Heroku app
   heroku create your-hmis-app

   # Add PostgreSQL addon
   heroku addons:create heroku-postgresql:hobby-dev

   # Deploy
   git push heroku main
   ```

## 🔧 Environment Configuration

### Production Environment Variables

```env
# Application
NODE_ENV=production
PORT=5000

# Database
DB_HOST=your-db-host
DB_PORT=5432
DB_NAME=hmis_db
DB_USER=hmis_user
DB_PASSWORD=your-secure-password
DB_SSL=true

# Security
JWT_SECRET=your-super-secure-jwt-secret-minimum-32-characters
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX_REQUESTS=100

# Features
API_DOCS=false
BACKUP_ENABLED=true
```

### SSL Configuration

1. **Obtain SSL certificates**
   ```bash
   # Using Let's Encrypt
   certbot certonly --standalone -d your-domain.com
   ```

2. **Configure Nginx**
   ```nginx
   server {
       listen 443 ssl;
       server_name your-domain.com;

       ssl_certificate /path/to/certificate.crt;
       ssl_certificate_key /path/to/private.key;

       location / {
           proxy_pass http://localhost:5000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
       }
   }
   ```

## 📊 Monitoring and Logging

### Health Checks

1. **Application Health**
   ```bash
   curl http://localhost:5000/health
   ```

2. **Database Health**
   ```bash
   curl http://localhost:5000/health/database
   ```

### Logging

1. **View logs**
   ```bash
   # Docker logs
   docker-compose logs -f

   # Application logs
   tail -f backend/logs/app.log
   ```

2. **Log rotation**
   ```bash
   # Configure logrotate
   sudo nano /etc/logrotate.d/hmis
   ```

### Monitoring

1. **Prometheus (Optional)**
   ```bash
   docker-compose -f docker-compose.yml -f docker-compose.monitoring.yml up -d
   ```

2. **Grafana Dashboard**
   - Access: http://localhost:3001
   - Default credentials: admin/admin

## 🔄 Backup and Recovery

### Database Backup

1. **Automated backup**
   ```bash
   # Using Docker
   docker-compose exec postgres pg_dump -U hmis_user hmis_db > backup.sql

   # Manual backup
   pg_dump -h localhost -U hmis_user hmis_db > backup.sql
   ```

2. **Restore database**
   ```bash
   psql -h localhost -U hmis_user hmis_db < backup.sql
   ```

### File Backup

1. **Backup uploads**
   ```bash
   tar -czf uploads-backup.tar.gz backend/uploads/
   ```

2. **Backup configuration**
   ```bash
   cp .env .env.backup
   ```

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   ```bash
   # Check database status
   docker-compose ps

   # Check logs
   docker-compose logs postgres
   ```

2. **Port Conflicts**
   ```bash
   # Check port usage
   netstat -tulpn | grep :5000

   # Change ports in docker-compose.yml
   ```

3. **Permission Issues**
   ```bash
   # Fix file permissions
   sudo chown -R $USER:$USER .
   chmod -R 755 .
   ```

### Performance Optimization

1. **Database Optimization**
   ```sql
   -- Add indexes
   CREATE INDEX idx_patients_name ON patients(first_name, last_name);
   CREATE INDEX idx_appointments_date ON appointments(appointment_date);
   ```

2. **Application Optimization**
   ```bash
   # Enable compression
   # Configure Redis caching
   # Optimize Docker images
   ```

## 📋 Deployment Checklist

### Pre-deployment
- [ ] Environment variables configured
- [ ] Database credentials updated
- [ ] SSL certificates obtained
- [ ] Domain configured
- [ ] Backup strategy in place

### Deployment
- [ ] Code deployed
- [ ] Database migrated
- [ ] Services started
- [ ] Health checks passing
- [ ] SSL configured

### Post-deployment
- [ ] Monitoring configured
- [ ] Logs being collected
- [ ] Backup tested
- [ ] Performance monitored
- [ ] Security scan completed

## 🆘 Support

For deployment issues:
- Check the troubleshooting section
- Review logs for errors
- Create an issue in the repository
- Contact support team

---

**Happy Deploying! 🚀**
