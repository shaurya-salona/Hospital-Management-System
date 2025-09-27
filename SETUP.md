# 🚀 Quick Setup Guide

## For GitHub Upload

This project has been cleaned and is ready for GitHub upload. Here's what was done:

### ✅ Cleanup Completed
- ✅ Removed `node_modules/` directories
- ✅ Removed `package-lock.json` files
- ✅ Removed sensitive `.env` files
- ✅ Created `.env.example` files
- ✅ Updated `.gitignore` file
- ✅ Verified no unnecessary files remain

### 📁 Files to Upload
All files in the `hmis-complete/` directory are ready for GitHub upload.

### 🔧 After Cloning from GitHub

1. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install
   ```

2. **Setup environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start the application:**
   ```bash
   # Using Docker (recommended)
   docker-compose up --build

   # Or development mode
   node start-hmis.js
   ```

### 🔐 Important Security Notes
- Change all default passwords in production
- Use strong, unique secrets for JWT and encryption
- Configure proper database credentials
- Enable SSL in production
- Review and update CORS settings

### 📋 Default Credentials (Change in Production!)
- Admin: admin / admin123
- Doctor: doctor / doctor123
- Nurse: nurse / nurse123
- Receptionist: receptionist / receptionist123
- Pharmacist: pharmacist / pharmacist123
- Patient: patient / patient123

### 🐳 Docker Services
- Frontend: http://localhost:80
- Backend API: http://localhost:5000
- API Docs: http://localhost:5000/api-docs
- Database: PostgreSQL on port 5432
- Redis: Port 6379

### 📞 Support
- Check README.md for detailed documentation
- Review API documentation at /api-docs
- Check logs in backend/logs/ directory
