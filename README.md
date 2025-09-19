# 🏥 Hospital Management Information System (HMIS)

A comprehensive, modern Hospital Management Information System built with Node.js, PostgreSQL, and vanilla JavaScript. This system provides complete hospital management functionality with role-based access control, real-time notifications, and a responsive web interface.

## 🌟 Features

### Core Functionality
- **Patient Management**: Complete patient registration, medical history, and records
- **Appointment Scheduling**: Advanced appointment booking and management system
- **Doctor Dashboard**: Comprehensive doctor portal with patient management
- **Medical Records**: Digital medical records with history tracking
- **Prescription Management**: Electronic prescription system
- **Lab Test Management**: Laboratory test ordering and results tracking
- **Billing System**: Automated billing and payment tracking
- **Inventory Management**: Pharmacy and medical equipment inventory
- **User Management**: Role-based access control for all staff types
- **Analytics Dashboard**: Comprehensive reporting and analytics

### User Roles
- **Administrator**: Full system access and management
- **Doctor**: Patient care, prescriptions, medical records
- **Nurse**: Patient care assistance, vital signs, medication administration
- **Receptionist**: Patient registration, appointment scheduling
- **Pharmacist**: Prescription fulfillment, inventory management
- **Patient**: Personal health records, appointment viewing

### Technical Features
- **RESTful API**: Comprehensive backend API with Swagger documentation
- **Real-time Updates**: WebSocket support for live notifications
- **Responsive Design**: Mobile-friendly interface
- **Security**: JWT authentication, role-based authorization
- **Database**: PostgreSQL with comprehensive schema
- **Docker Support**: Complete containerization
- **Monitoring**: Health checks and logging
- **Backup System**: Automated database backups

## 🚀 Quick Start

### Prerequisites
- Node.js 16+
- npm or yarn
- Docker and Docker Compose (optional)
- PostgreSQL 12+ (if not using Docker)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/hmis-complete.git
   cd hmis-complete
   ```

2. **Install dependencies**
   ```bash
   npm install
   cd backend && npm install
   ```

3. **Configure environment**
   ```bash
   cp env.example .env
   # Edit .env with your configuration
   ```

4. **Start the system**

   **Option A: Using Docker (Recommended)**
   ```bash
   docker-compose up --build
   ```

   **Option B: Development Mode**
   ```bash
   node start-hmis.js
   ```

5. **Access the application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:5000
   - API Documentation: http://localhost:5000/api-docs
   - Health Check: http://localhost:5000/health

## 🔐 Default Login Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Doctor | doctor | doctor123 |
| Nurse | nurse | nurse123 |
| Receptionist | receptionist | receptionist123 |
| Pharmacist | pharmacist | pharmacist123 |
| Patient | patient | patient123 |

## 📁 Project Structure

```
hmis-complete/
├── backend/                 # Backend API server
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middlewares/        # Express middlewares
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── scripts/           # Database scripts
│   ├── tests/             # Test files
│   └── server.js          # Main server file
├── frontend/              # Frontend application
│   ├── *.html            # Dashboard pages
│   ├── *.js              # JavaScript files
│   ├── *.css             # Stylesheets
│   └── api-service.js    # API service
├── scripts/              # Utility scripts
├── docker-compose.yml    # Docker configuration
├── Dockerfile           # Backend Docker image
├── nginx.conf           # Nginx configuration
└── README.md           # This file
```

## 🛠️ Development

### Backend Development

1. **Start the backend server**
   ```bash
   cd backend
   npm run dev
   ```

2. **Run tests**
   ```bash
   npm test
   ```

3. **Database setup**
   ```bash
   npm run setup:db
   ```

### Frontend Development

The frontend is built with vanilla HTML, CSS, and JavaScript. Each dashboard is a separate HTML file with embedded JavaScript.

### API Documentation

API documentation is available at `/api-docs` when the server is running. It includes:
- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests

## 🐳 Docker Deployment

### Production Deployment

1. **Configure environment**
   ```bash
   cp env.example .env
   # Update production values
   ```

2. **Start with Docker Compose**
   ```bash
   docker-compose -f docker-compose.production.yml up -d
   ```

3. **Monitor logs**
   ```bash
   docker-compose logs -f
   ```

### Docker Services

- **PostgreSQL**: Database server
- **Redis**: Caching and sessions
- **Backend**: Node.js API server
- **Frontend**: Nginx static file server
- **Backup**: Automated backup service
- **Monitoring**: Prometheus and Grafana (optional)

## 🔧 Configuration

### Environment Variables

Key configuration options in `.env`:

```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=hmis_db
DB_USER=hmis_user
DB_PASSWORD=your_password

# JWT
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=24h

# Security
CORS_ORIGIN=http://localhost:3000
RATE_LIMIT_MAX_REQUESTS=100

# Features
API_DOCS=true
BACKUP_ENABLED=true
```

### Database Schema

The system uses PostgreSQL with the following main tables:
- `users` - User accounts and authentication
- `staff` - Staff information and roles
- `patients` - Patient records
- `appointments` - Appointment scheduling
- `medical_records` - Medical history
- `prescriptions` - Medication prescriptions
- `billing` - Financial records
- `inventory` - Medical inventory

## 📊 Monitoring and Logging

### Health Checks
- Backend health: `GET /health`
- Database connectivity
- Redis connectivity
- System resources

### Logging
- Structured logging with Winston
- Request/response logging
- Error tracking
- Audit trails

### Metrics (Optional)
- Prometheus metrics
- Grafana dashboards
- Performance monitoring

## 🔒 Security

### Authentication
- JWT-based authentication
- Role-based authorization
- Password hashing with bcrypt
- Session management

### Security Headers
- CORS configuration
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection

## 🧪 Testing

### Backend Tests
```bash
cd backend
npm test
npm run test:coverage
```

### API Testing
Use the Swagger documentation at `/api-docs` to test API endpoints.

## 📈 Performance

### Optimization Features
- Database indexing
- Query optimization
- Caching with Redis
- Gzip compression
- Static file caching
- Connection pooling

### Scalability
- Horizontal scaling support
- Load balancer ready
- Database replication support
- Microservices architecture ready

## 🚨 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Check PostgreSQL is running
   - Verify connection credentials
   - Check firewall settings

2. **Authentication Issues**
   - Verify JWT secret is set
   - Check token expiration
   - Clear browser cache

3. **Docker Issues**
   - Check Docker is running
   - Verify Docker Compose version
   - Check port conflicts

### Logs
- Backend logs: `backend/logs/`
- Docker logs: `docker-compose logs`
- Nginx logs: Available in container

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API documentation at `/api-docs`

## 🔄 Updates

### Version 1.0.0
- Initial release
- Complete HMIS functionality
- Docker support
- API documentation
- Role-based access control

---

**Built with ❤️ for healthcare professionals**

## 🏆 Key Highlights

- **Production Ready**: Complete hospital management system
- **Scalable Architecture**: Microservices-ready design
- **Modern Tech Stack**: Node.js, PostgreSQL, Docker
- **Comprehensive Features**: All hospital operations covered
- **Security First**: JWT authentication, role-based access
- **Developer Friendly**: Well-documented API, easy setup
- **Docker Support**: One-command deployment
- **Real-time Updates**: WebSocket notifications
- **Responsive Design**: Works on all devices
- **Open Source**: MIT License, community-driven
