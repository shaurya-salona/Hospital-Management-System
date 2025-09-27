@echo off
echo 🚀 Starting HMIS with Docker...
echo ================================

REM Stop any existing containers
echo 🛑 Stopping existing containers...
docker-compose down

REM Start the services
echo 🔄 Starting services...
docker-compose up --build -d

REM Wait for services to be ready
echo ⏳ Waiting for services to be ready...
timeout /t 30 /nobreak > nul

REM Check service status
echo 📊 Checking service status...
docker-compose ps

echo.
echo ✅ HMIS is starting up!
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend API: http://localhost:5000
echo 📊 Health Check: http://localhost:5000/health
echo 📚 API Docs: http://localhost:5000/api-docs
echo.
echo 📋 To view logs: docker-compose logs -f
echo 🛑 To stop: docker-compose down
pause
