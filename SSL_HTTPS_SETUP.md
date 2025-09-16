# 🔒 SSL/HTTPS Setup Guide

## 🎯 **Overview**

This guide covers setting up SSL/HTTPS for your HMIS application to ensure secure communication between clients and servers.

## 🚀 **Quick Start**

### **1. Automatic Setup (Recommended)**

```bash
# Make the script executable
chmod +x scripts/setup-ssl.sh

# Run SSL setup with your domain
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com
```

### **2. Manual Setup**

Follow the detailed steps below for manual configuration.

---

## 🔧 **SSL Certificate Options**

### **Option 1: Let's Encrypt (Production Recommended)**

**Pros:**
- ✅ Free SSL certificates
- ✅ Automatically trusted by browsers
- ✅ Automatic renewal
- ✅ Industry standard

**Cons:**
- ❌ Requires domain ownership
- ❌ 90-day expiration (auto-renewed)
- ❌ Rate limits

**Setup:**
```bash
# Install Certbot
sudo apt-get update
sudo apt-get install certbot

# Generate certificate
sudo certbot certonly --webroot -w /var/www/html -d your-domain.com

# Or use Docker
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/html:/var/www/html \
  certbot/certbot certonly --webroot -w /var/www/html -d your-domain.com
```

### **Option 2: Self-Signed Certificate (Development)**

**Pros:**
- ✅ No external dependencies
- ✅ Good for development/testing
- ✅ No rate limits

**Cons:**
- ❌ Browser security warnings
- ❌ Not trusted by default
- ❌ Manual renewal

**Setup:**
```bash
# Generate private key
openssl genrsa -out ssl/key.pem 2048

# Generate certificate
openssl req -new -x509 -key ssl/key.pem -out ssl/cert.pem -days 365 \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost"
```

### **Option 3: Commercial Certificate**

**Pros:**
- ✅ Extended validation options
- ✅ Longer validity periods
- ✅ Support included

**Cons:**
- ❌ Cost involved
- ❌ Manual renewal
- ❌ Vendor dependency

---

## 🐳 **Docker SSL Setup**

### **1. Update Docker Compose**

```yaml
# docker-compose.production.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: hmis-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
      - ./nginx/logs:/var/log/nginx
    depends_on:
      - frontend
      - backend
    restart: unless-stopped

  # Certbot for Let's Encrypt
  certbot:
    image: certbot/certbot
    container_name: hmis-certbot
    volumes:
      - ./nginx/certbot:/etc/letsencrypt
      - ./nginx/certbot:/var/www/certbot
    command: certonly --webroot --webroot-path=/var/www/certbot --email admin@your-domain.com --agree-tos --no-eff-email -d your-domain.com
```

### **2. SSL Directory Structure**

```
nginx/
├── nginx.conf          # Main nginx configuration
├── ssl/                # SSL certificates
│   ├── cert.pem        # Certificate file
│   └── key.pem         # Private key file
├── certbot/            # Let's Encrypt certificates
│   └── live/
│       └── your-domain.com/
│           ├── fullchain.pem
│           └── privkey.pem
└── logs/               # Nginx logs
    ├── access.log
    └── error.log
```

---

## 🔧 **Nginx SSL Configuration**

### **Basic HTTPS Configuration**

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL Configuration
    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    
    # SSL Security
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Your application configuration
    location / {
        proxy_pass http://frontend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### **HTTP to HTTPS Redirect**

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    # Let's Encrypt challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    # Redirect all other traffic to HTTPS
    location / {
        return 301 https://$host$request_uri;
    }
}
```

---

## 🔄 **Certificate Renewal**

### **Automatic Renewal with Cron**

```bash
# Add to crontab
0 12 * * * /path/to/renew-ssl.sh >> /var/log/ssl-renewal.log 2>&1
```

### **Manual Renewal**

```bash
# Let's Encrypt renewal
certbot renew

# Docker renewal
docker run --rm \
  -v /etc/letsencrypt:/etc/letsencrypt \
  -v /var/www/html:/var/www/html \
  certbot/certbot renew

# Reload nginx
nginx -s reload
```

### **Renewal Script**

```bash
#!/bin/bash
# renew-ssl.sh

echo "🔄 Renewing SSL certificate..."

# Renew certificate
certbot renew --quiet

# Reload nginx
systemctl reload nginx

echo "✅ SSL certificate renewed successfully!"
```

---

## 🛡️ **Security Best Practices**

### **1. SSL/TLS Configuration**

```nginx
# Strong SSL configuration
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384;
ssl_prefer_server_ciphers off;
ssl_session_cache shared:SSL:10m;
ssl_session_timeout 10m;
ssl_session_tickets off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
ssl_trusted_certificate /etc/nginx/ssl/ca.pem;
```

### **2. Security Headers**

```nginx
# Security headers
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-XSS-Protection "1; mode=block" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';" always;
```

### **3. Rate Limiting**

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

location /api/ {
    limit_req zone=api burst=20 nodelay;
    # ... proxy configuration
}

location /api/auth/login {
    limit_req zone=login burst=5 nodelay;
    # ... proxy configuration
}
```

---

## 🧪 **Testing SSL Configuration**

### **1. SSL Labs Test**

Visit: https://www.ssllabs.com/ssltest/

### **2. Command Line Tests**

```bash
# Test SSL certificate
openssl s_client -connect your-domain.com:443 -servername your-domain.com

# Check certificate expiration
echo | openssl s_client -servername your-domain.com -connect your-domain.com:443 2>/dev/null | openssl x509 -noout -dates

# Test SSL configuration
nmap --script ssl-enum-ciphers -p 443 your-domain.com
```

### **3. Browser Tests**

- Check for security warnings
- Verify certificate details
- Test mixed content issues
- Validate security headers

---

## 🚨 **Troubleshooting**

### **Common Issues:**

1. **Certificate Not Found:**
   ```bash
   # Check certificate files
   ls -la nginx/ssl/
   
   # Verify nginx configuration
   nginx -t
   ```

2. **SSL Handshake Failed:**
   ```bash
   # Check SSL protocols
   openssl s_client -connect your-domain.com:443 -tls1_2
   
   # Verify cipher suites
   openssl ciphers -v
   ```

3. **Mixed Content Warnings:**
   - Ensure all resources use HTTPS
   - Update hardcoded HTTP URLs
   - Check Content Security Policy

4. **Certificate Expired:**
   ```bash
   # Check expiration date
   openssl x509 -in nginx/ssl/cert.pem -text -noout | grep "Not After"
   
   # Renew certificate
   certbot renew
   ```

### **Debug Commands:**

```bash
# Test nginx configuration
nginx -t

# Check nginx error logs
tail -f nginx/logs/error.log

# Test SSL connection
curl -I https://your-domain.com

# Check certificate chain
openssl s_client -connect your-domain.com:443 -showcerts
```

---

## 📊 **SSL Monitoring**

### **Certificate Monitoring:**

```bash
#!/bin/bash
# ssl-monitor.sh

DOMAIN="your-domain.com"
DAYS_THRESHOLD=30

# Get certificate expiration date
EXPIRY_DATE=$(echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates | grep "notAfter" | cut -d= -f2)

# Convert to timestamp
EXPIRY_TIMESTAMP=$(date -d "$EXPIRY_DATE" +%s)
CURRENT_TIMESTAMP=$(date +%s)

# Calculate days until expiration
DAYS_UNTIL_EXPIRY=$(( (EXPIRY_TIMESTAMP - CURRENT_TIMESTAMP) / 86400 ))

if [ $DAYS_UNTIL_EXPIRY -lt $DAYS_THRESHOLD ]; then
    echo "⚠️ SSL certificate for $DOMAIN expires in $DAYS_UNTIL_EXPIRY days!"
    # Send alert (email, Slack, etc.)
else
    echo "✅ SSL certificate for $DOMAIN is valid for $DAYS_UNTIL_EXPIRY days"
fi
```

### **Automated Monitoring:**

```yaml
# monitoring/ssl-alerts.yml
version: '3.8'
services:
  ssl-monitor:
    image: alpine:latest
    command: |
      sh -c "
        apk add --no-cache openssl curl &&
        while true; do
          ./ssl-monitor.sh
          sleep 86400
        done
      "
    volumes:
      - ./ssl-monitor.sh:/ssl-monitor.sh
    restart: unless-stopped
```

---

## 🎯 **Production Checklist**

- [ ] **SSL Certificate**
  - [ ] Valid certificate installed
  - [ ] Certificate chain complete
  - [ ] Private key secured
  - [ ] Automatic renewal configured

- [ ] **Nginx Configuration**
  - [ ] HTTPS redirect configured
  - [ ] Security headers enabled
  - [ ] Rate limiting configured
  - [ ] SSL protocols updated

- [ ] **Security**
  - [ ] HSTS enabled
  - [ ] Mixed content resolved
  - [ ] CSP configured
  - [ ] Certificate monitoring setup

- [ ] **Testing**
  - [ ] SSL Labs test passed
  - [ ] Browser compatibility verified
  - [ ] Mobile device testing
  - [ ] Performance impact assessed

---

## 🚀 **Deployment Commands**

```bash
# 1. Setup SSL
./scripts/setup-ssl.sh your-domain.com admin@your-domain.com

# 2. Start services
docker-compose -f docker-compose.production.yml up -d

# 3. Test HTTPS
curl -I https://your-domain.com

# 4. Monitor logs
docker-compose -f docker-compose.production.yml logs -f nginx
```

---

## 📚 **Additional Resources**

- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [SSL Labs SSL Test](https://www.ssllabs.com/ssltest/)
- [Mozilla SSL Configuration Generator](https://ssl-config.mozilla.org/)
- [Nginx SSL Configuration](https://nginx.org/en/docs/http/configuring_https_servers.html)

---

Your HMIS application is now secured with SSL/HTTPS! 🔒✨


