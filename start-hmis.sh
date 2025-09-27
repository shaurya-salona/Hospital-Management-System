#!/bin/bash

echo "🚀 Starting HMIS with Docker..."
echo "================================"

# Stop any existing containers
echo "🛑 Stopping existing containers..."
docker-compose down

# Remove old volumes (optional - uncomment if you want fresh data)
# echo "🗑️  Removing old volumes..."
# docker-compose down -v

# Start the services
echo "🔄 Starting services..."
docker-compose up --build -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Check service status
echo "📊 Checking service status..."
docker-compose ps

echo ""
echo "✅ HMIS is starting up!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:5000"
echo "📊 Health Check: http://localhost:5000/health"
echo "📚 API Docs: http://localhost:5000/api-docs"
echo ""
echo "📋 To view logs: docker-compose logs -f"
echo "🛑 To stop: docker-compose down"
