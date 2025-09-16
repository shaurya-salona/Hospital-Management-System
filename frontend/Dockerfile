# Frontend Dockerfile for HMIS
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build frontend (if needed)
# RUN npm run build

# Production stage
FROM nginx:alpine

# Install Node.js for server.js
RUN apk add --no-cache nodejs npm

# Copy built files to nginx
COPY --from=builder /app /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy Node.js server
COPY server.js /usr/share/nginx/html/

# Install Node.js dependencies
WORKDIR /usr/share/nginx/html
RUN npm install express

# Create startup script
RUN echo '#!/bin/sh' > /start.sh && \
    echo 'nginx &' >> /start.sh && \
    echo 'node server.js' >> /start.sh && \
    chmod +x /start.sh

# Expose ports
EXPOSE 3000 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/ || exit 1

# Start both nginx and Node.js server
CMD ["/start.sh"]


