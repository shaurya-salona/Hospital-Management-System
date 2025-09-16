# 🏥 HMIS - Hospital Management Information System

A comprehensive Hospital Management Information System built with Node.js, Express, and PostgreSQL, featuring role-based access control and real-time notifications.

## 🏗️ Tech Stack

- **Backend**: Node.js + Express.js
- **Frontend**: HTML5 + JavaScript + CSS3
- **Database**: PostgreSQL
- **Authentication**: JWT + bcrypt
- **Notifications**: Nodemailer + Twilio (SMS)
- **Security**: CORS, Rate Limiting, Input Validation

## ✨ Features

### 🔐 Role-Based Authentication
- **Admin**: Full system control and management
- **Doctor**: Patient care, medical records, prescriptions
- **Nurse**: Patient monitoring, vital signs, care plans
- **Receptionist**: Patient registration, appointments, billing support
- **Pharmacist**: Prescription management, inventory control
- **Patient**: Personal health information and appointments

### 📋 Core Modules
- **Patient Management**: Registration, profiles, medical history
- **Appointment Scheduling**: Booking, rescheduling, notifications
- **Medical Records**: Diagnosis, treatment plans, lab results
- **Prescription Management**: Digital prescriptions, drug interactions
- **Billing System**: Invoicing, payments, insurance claims
- **Inventory Management**: Medication stock, reorder alerts
- **Analytics Dashboard**: Real-time metrics and reports
- **Notification System**: Email and SMS alerts

## ⚡️ Quick Start

### Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### 1. Clone and Setup
```bash
git clone <repository-url>
cd hmis-complete
```

### 2. Database Setup
```bash
# Install PostgreSQL and create database
createdb hmis_db

# Run the schema
psql -d hmis_db -f backend/schema.sql
```

### 3. Environment Configuration
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit the .env file with your configuration
# Update database credentials, JWT secrets, etc.
```

### 4. Install Dependencies
```bash
# Backend dependencies
cd backend
npm install

# Frontend dependencies (if any)
cd ../frontend
npm install  # if package.json exists
```

### 5. Run the Application

#### Development Mode
```bash
# Start backend server
cd backend
npm run dev  # or node demo-server.js

# Start frontend server (in another terminal)
cd frontend
node server.js
```

#### Production Mode
```bash
# Start production backend
cd backend
npm start  # or node server.js
```

### 6. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **API Documentation**: http://localhost:5000/api-docs

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Backend server port | 5000 |
| `NODE_ENV` | Environment mode | development |
| `DB_HOST` | Database host | localhost |
| `DB_PORT` | Database port | 5432 |
| `DB_NAME` | Database name | hmis_db |
| `DB_USER` | Database user | postgres |
| `DB_PASSWORD` | Database password | password |
| `JWT_SECRET` | JWT signing secret | (required) |
| `JWT_EXPIRES_IN` | JWT expiration time | 24h |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:3000 |

### Database Schema
The system includes the following main tables:
- `users` - User authentication and profiles
- `staff` - Hospital staff information
- `patients` - Patient records and medical history
- `appointments` - Appointment scheduling
- `medical_records` - Medical documentation
- `prescriptions` - Medication prescriptions
- `billing` - Financial transactions
- `inventory` - Medication and supply inventory
- `notifications` - System notifications
- `audit_logs` - System audit trail

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/profile` - Get user profile

### Patients
- `GET /api/patients` - List patients
- `POST /api/patients` - Create patient
- `GET /api/patients/:id` - Get patient details
- `PUT /api/patients/:id` - Update patient
- `DELETE /api/patients/:id` - Delete patient

### Appointments
- `GET /api/appointments` - List appointments
- `POST /api/appointments` - Create appointment
- `PUT /api/appointments/:id` - Update appointment
- `DELETE /api/appointments/:id` - Cancel appointment

### Medical Records
- `GET /api/medical-records` - List medical records
- `POST /api/medical-records` - Create medical record
- `GET /api/medical-records/:id` - Get medical record
- `PUT /api/medical-records/:id` - Update medical record

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Role-Based Access Control**: Granular permissions per user role
- **Password Hashing**: bcrypt for secure password storage
- **CORS Protection**: Configurable cross-origin resource sharing
- **Rate Limiting**: API request rate limiting
- **Input Validation**: Request data validation and sanitization
- **Audit Logging**: Complete audit trail of system activities

## 📱 Demo Credentials

| Role | Username | Password |
|------|----------|----------|
| Admin | admin | admin123 |
| Doctor | dr.smith | admin123 |
| Nurse | nurse.jones | admin123 |
| Receptionist | reception.mike | admin123 |
| Pharmacist | pharm.wilson | admin123 |

## 🛠️ Development

### Project Structure
```
hmis-complete/
├── backend/
│   ├── config/          # Configuration files
│   ├── controllers/     # Business logic controllers
│   ├── models/          # Database models
│   ├── routes/          # API route definitions
│   ├── middlewares/     # Custom middleware
│   ├── schema.sql       # Database schema
│   ├── server.js        # Main server file
│   └── demo-server.js   # Demo server
├── frontend/
│   ├── index.html       # Landing page
│   ├── dashboard.html   # Main dashboard
│   ├── *-dashboard.html # Role-specific dashboards
│   ├── script.js        # Frontend JavaScript
│   ├── styles.css       # Application styles
│   └── server.js        # Frontend server
└── README.md
```

### Adding New Features
1. Create database migration in `backend/schema.sql`
2. Add API routes in `backend/routes/`
3. Implement business logic in `backend/controllers/`
4. Update frontend in appropriate dashboard files
5. Test with Postman collection

## 🧪 Testing

### API Testing
Use the included Postman collection:
```bash
# Import HMIS-API-Testing.postman_collection.json
# Configure environment variables in Postman
# Run the test suite
```

### Manual Testing
1. Start the application
2. Login with demo credentials
3. Test each role's functionality
4. Verify data persistence
5. Check notification delivery

## 📊 Monitoring & Logging

- **Application Logs**: Stored in `backend/logs/`
- **Audit Trail**: Complete user action logging
- **Error Tracking**: Comprehensive error logging
- **Performance Metrics**: API response time tracking

## 🚀 Deployment

### Production Checklist
- [ ] Update environment variables
- [ ] Set secure JWT secrets
- [ ] Configure production database
- [ ] Enable HTTPS
- [ ] Set up monitoring
- [ ] Configure backup strategy
- [ ] Test all functionality
- [ ] Update documentation

### Docker Deployment (Optional)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the API endpoints
- Test with demo credentials

## 🔄 Version History

- **v1.0.0** - Initial release with core functionality
- **v1.1.0** - Added notification system
- **v1.2.0** - Enhanced security features
- **v1.3.0** - Added analytics dashboard

---

**Built with ❤️ for healthcare professionals**
