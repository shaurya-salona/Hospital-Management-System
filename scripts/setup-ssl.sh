#!/bin/bash

# SSL Setup Script for HMIS
# This script helps set up SSL certificates for production deployment

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if domain is provided
if [ $# -eq 0 ]; then
    print_error "Please provide a domain name"
    echo "Usage: $0 <domain> [email]"
    echo "Example: $0 hospital.example.com admin@hospital.com"
    exit 1
fi

DOMAIN=$1
EMAIL=${2:-admin@$DOMAIN}

print_status "Setting up SSL for domain: $DOMAIN"
print_status "Email: $EMAIL"

# Create SSL directory
mkdir -p ssl

# Check if running in Docker
if [ -f /.dockerenv ]; then
    print_status "Running in Docker container"
    DOCKER_MODE=true
else
    DOCKER_MODE=false
fi

# Function to generate self-signed certificate for development
generate_self_signed() {
    print_status "Generating self-signed certificate for development..."
    
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout ssl/server.key \
        -out ssl/server.crt \
        -subj "/C=US/ST=State/L=City/O=Hospital/OU=IT/CN=$DOMAIN/emailAddress=$EMAIL"
    
    print_success "Self-signed certificate generated"
    print_warning "This certificate is for development only. Use Let's Encrypt for production."
}

# Function to setup Let's Encrypt certificate
setup_letsencrypt() {
    print_status "Setting up Let's Encrypt certificate..."
    
    if [ "$DOCKER_MODE" = true ]; then
        print_status "Using Docker for Let's Encrypt setup..."
        
        # Create nginx config for ACME challenge
        cat > nginx-acme.conf << EOF
    server {
        listen 80;
        server_name $DOMAIN;
        
        location /.well-known/acme-challenge/ {
        root /var/www/html;
        }
        
        location / {
        return 301 https://\$server_name\$request_uri;
    }
}
EOF

        # Run certbot in Docker
        docker run --rm \
            -v "$(pwd)/ssl:/etc/letsencrypt" \
            -v "$(pwd)/nginx-acme.conf:/etc/nginx/conf.d/default.conf" \
        -p 80:80 \
        certbot/certbot certonly \
        --webroot \
            --webroot-path=/var/www/html \
            --email $EMAIL \
        --agree-tos \
        --no-eff-email \
            -d $DOMAIN
        
        # Copy certificates to ssl directory
        cp ssl/live/$DOMAIN/fullchain.pem ssl/server.crt
        cp ssl/live/$DOMAIN/privkey.pem ssl/server.key
        
    else
        print_status "Using local certbot..."
        
        # Install certbot if not installed
        if ! command -v certbot &> /dev/null; then
            print_status "Installing certbot..."
            sudo apt-get update
            sudo apt-get install -y certbot
        fi
        
        # Generate certificate
        sudo certbot certonly --webroot -w /var/www/html -d $DOMAIN --email $EMAIL --agree-tos --no-eff-email
        
        # Copy certificates
        sudo cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/server.crt
        sudo cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/server.key
        sudo chown $USER:$USER ssl/server.*
    fi
    
    print_success "Let's Encrypt certificate generated"
}

# Function to update nginx configuration
update_nginx_config() {
    print_status "Updating nginx configuration for SSL..."
    
    # Create SSL-enabled nginx config
    cat > nginx-ssl.conf << EOF
# HTTP to HTTPS redirect
server {
    listen 80;
    server_name $DOMAIN;
    return 301 https://\$server_name\$request_uri;
}

# HTTPS server
server {
    listen 443 ssl http2;
    server_name $DOMAIN;
    
    # SSL configuration
    ssl_certificate /etc/nginx/ssl/server.crt;
    ssl_certificate_key /etc/nginx/ssl/server.key;
    
    # SSL security settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    add_header X-XSS-Protection "1; mode=block" always;
    
    # Frontend
    location / {
        root /usr/share/nginx/html;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }
    
    # Backend API
    location /api/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
    
    # WebSocket support
    location /socket.io/ {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF
    
    print_success "Nginx SSL configuration created: nginx-ssl.conf"
}

# Function to create renewal script
create_renewal_script() {
    print_status "Creating certificate renewal script..."
    
    cat > scripts/renew-ssl.sh << 'EOF'
#!/bin/bash

# SSL Certificate Renewal Script
# Run this script as a cron job for automatic renewal

set -e

DOMAIN="your-domain.com"
EMAIL="admin@your-domain.com"

echo "Renewing SSL certificate for $DOMAIN..."

# Renew certificate
certbot renew --quiet

# Copy new certificates
cp /etc/letsencrypt/live/$DOMAIN/fullchain.pem ssl/server.crt
cp /etc/letsencrypt/live/$DOMAIN/privkey.pem ssl/server.key

# Reload nginx
docker-compose exec frontend nginx -s reload

echo "SSL certificate renewed successfully!"
EOF
    
    chmod +x scripts/renew-ssl.sh
    print_success "Renewal script created: scripts/renew-ssl.sh"
}

# Main setup function
main() {
    print_status "Starting SSL setup for HMIS..."
    
    # Check if OpenSSL is available
    if ! command -v openssl &> /dev/null; then
        print_error "OpenSSL is not installed. Please install it first."
        exit 1
    fi
    
    # Ask user for certificate type
    echo "Choose certificate type:"
    echo "1) Self-signed (for development)"
    echo "2) Let's Encrypt (for production)"
    read -p "Enter choice [1-2]: " choice
    
    case $choice in
        1)
            generate_self_signed
            ;;
        2)
            setup_letsencrypt
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
    
    # Update nginx configuration
    update_nginx_config
    
    # Create renewal script for Let's Encrypt
    if [ "$choice" = "2" ]; then
        create_renewal_script
    fi
    
    print_success "SSL setup completed!"
    print_status "Next steps:"
    echo "1. Update your docker-compose.yml to use nginx-ssl.conf"
    echo "2. Restart your containers: docker-compose down && docker-compose up -d"
    echo "3. Test your SSL setup: https://$DOMAIN"
    
    if [ "$choice" = "2" ]; then
        echo "4. Set up automatic renewal: crontab -e"
        echo "   Add: 0 2 * * * /path/to/scripts/renew-ssl.sh"
    fi
}

# Run main function
main "$@"