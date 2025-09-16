# Multi-stage Docker build for HMIS Backend
# Stage 1: Build stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package files
COPY backend/package*.json ./

# Install dependencies (including dev dependencies for building)
RUN npm ci --only=production --silent

# Stage 2: Production stage
FROM node:18-alpine AS production

# Install security updates and required packages
RUN apk update && apk upgrade && \
    apk add --no-cache \
    dumb-init \
    postgresql-client \
    curl \
    && rm -rf /var/cache/apk/*

# Create app user (don't run as root)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S hmis -u 1001

# Set working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY backend/package*.json ./
RUN npm ci --only=production --silent && \
    npm cache clean --force

# Copy application code
COPY backend/ ./

# Create necessary directories and set permissions
RUN mkdir -p logs uploads backups && \
    chown -R hmis:nodejs /app

# Switch to non-root user
USER hmis

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:5000/health || exit 1

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["node", "server.js"]

