# 🗄️ PostgreSQL Database Setup Guide

## 📋 **Prerequisites**

### **Windows Installation:**

1. **Download PostgreSQL:**
   - Visit: https://www.postgresql.org/download/windows/
   - Download PostgreSQL 15+ installer
   - Or use the installer already in your project: `postgresql-installer.exe`

2. **Install PostgreSQL:**
   ```bash
   # Run the installer as Administrator
   # Default settings are fine, but note:
   # - Port: 5432 (default)
   # - Username: postgres
   # - Password: [choose a strong password]
   ```

3. **Verify Installation:**
   ```bash
   # Add PostgreSQL to PATH or use full path
   psql --version
   ```

### **Alternative: Docker PostgreSQL (Recommended for Development)**

```bash
# Run PostgreSQL in Docker
docker run --name hmis-postgres \
  -e POSTGRES_DB=hmis_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -p 5432:5432 \
  -d postgres:15

# Verify it's running
docker ps
```

## 🚀 **Database Setup**

### **1. Create Production Environment File:**

```bash
# Copy the example environment file
cp env.example .env.production
```

### **2. Configure Environment Variables:**

Edit `.env.production`:
```env
# Database Configuration
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hmis_db
DB_USER=postgres
DB_PASSWORD=your_secure_password
DB_SSL=false

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here

# Server Configuration
PORT=5000
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=info

# Features
ENABLE_API_DOCS=true
ENABLE_METRICS_ENDPOINT=true
```

### **3. Setup Database:**

```bash
# Install dependencies
npm install

# Setup production database
node scripts/setup-production-db.js

# Start production server
NODE_ENV=production npm start
```

## 🔧 **Database Management Commands**

### **Connect to Database:**
```bash
# Using psql
psql -h localhost -U postgres -d hmis_db

# Using Docker
docker exec -it hmis-postgres psql -U postgres -d hmis_db
```

### **Backup Database:**
```bash
# Create backup
pg_dump -h localhost -U postgres hmis_db > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
psql -h localhost -U postgres hmis_db < backup_file.sql
```

### **Reset Database:**
```bash
# Drop and recreate database
node scripts/reset-database.js
```

## 🐳 **Docker Compose Setup**

Create `docker-compose.production.yml`:

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15
    container_name: hmis-postgres
    environment:
      POSTGRES_DB: hmis_db
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./schema.sql:/docker-entrypoint-initdb.d/schema.sql
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    container_name: hmis-redis
    ports:
      - "6379:6379"
    restart: unless-stopped

  backend:
    build: 
      context: ./backend
      target: production
    container_name: hmis-backend
    environment:
      NODE_ENV: production
      DB_HOST: postgres
      DB_PORT: 5432
      DB_NAME: hmis_db
      DB_USER: postgres
      DB_PASSWORD: ${DB_PASSWORD}
      REDIS_HOST: redis
      REDIS_PORT: 6379
    ports:
      - "5000:5000"
    depends_on:
      - postgres
      - redis
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend
    container_name: hmis-frontend
    ports:
      - "3000:3000"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  postgres_data:
```

## 🔒 **Security Best Practices**

### **1. Database Security:**
- Use strong passwords
- Enable SSL in production
- Restrict database access by IP
- Regular security updates

### **2. Environment Security:**
- Never commit `.env` files
- Use different secrets for each environment
- Rotate JWT secrets regularly
- Use environment-specific configurations

### **3. Production Checklist:**
- [ ] Strong database passwords
- [ ] SSL certificates configured
- [ ] Firewall rules in place
- [ ] Regular backups scheduled
- [ ] Monitoring and alerting setup
- [ ] Database connection pooling
- [ ] Query optimization
- [ ] Index optimization

## 📊 **Performance Optimization**

### **1. Database Indexes:**
```sql
-- Add indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
```

### **2. Connection Pooling:**
- Already configured in `database.js`
- Max 20 connections
- 30-second idle timeout
- 2-second connection timeout

### **3. Query Optimization:**
- Use prepared statements
- Implement pagination
- Add proper indexes
- Monitor slow queries

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Connection Refused:**
   ```bash
   # Check if PostgreSQL is running
   pg_ctl status
   # Or for Docker
   docker ps | grep postgres
   ```

2. **Authentication Failed:**
   ```bash
   # Check pg_hba.conf
   # Ensure password authentication is enabled
   ```

3. **Database Not Found:**
   ```bash
   # Create database manually
   createdb -U postgres hmis_db
   ```

4. **Permission Denied:**
   ```bash
   # Grant permissions
   GRANT ALL PRIVILEGES ON DATABASE hmis_db TO postgres;
   ```

## 📈 **Monitoring**

### **Database Monitoring:**
```sql
-- Check active connections
SELECT count(*) FROM pg_stat_activity;

-- Check database size
SELECT pg_size_pretty(pg_database_size('hmis_db'));

-- Check slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

### **Application Monitoring:**
- Health check endpoint: `/health`
- Metrics endpoint: `/metrics` (if enabled)
- Log files in `logs/` directory
- Winston logging configured

---

## 🎯 **Next Steps**

1. **Install PostgreSQL** using the installer
2. **Configure environment** variables
3. **Run database setup** script
4. **Test connection** with health check
5. **Deploy to production** using Docker

Your HMIS is now ready for production database usage! 🚀


