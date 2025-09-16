/**
 * @swagger
 * components:
 *   schemas:
 *     MedicalRecord:
 *       type: object
 *       required:
 *         - patientId
 *         - doctorId
 *         - diagnosis
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Medical record unique identifier
 *         patientId:
 *           type: string
 *           format: uuid
 *           description: Patient ID
 *         doctorId:
 *           type: string
 *           format: uuid
 *           description: Doctor ID
 *         appointmentId:
 *           type: string
 *           format: uuid
 *           description: Related appointment ID
 *         diagnosis:
 *           type: string
 *           description: Medical diagnosis
 *         symptoms:
 *           type: string
 *           description: Patient symptoms
 *         treatmentPlan:
 *           type: string
 *           description: Treatment plan
 *         prescription:
 *           type: string
 *           description: Prescribed medications
 *         vitalSigns:
 *           type: object
 *           properties:
 *             bloodPressure:
 *               type: string
 *               example: "120/80"
 *             heartRate:
 *               type: integer
 *               example: 72
 *             temperature:
 *               type: number
 *               example: 98.6
 *             weight:
 *               type: number
 *               example: 70.5
 *             height:
 *               type: number
 *               example: 175.0
 *         labResults:
 *           type: object
 *           description: Laboratory test results
 *         notes:
 *           type: string
 *           description: Additional notes
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Record creation timestamp
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           description: Record last update timestamp
 *     
 *     Prescription:
 *       type: object
 *       required:
 *         - patientId
 *         - doctorId
 *         - medicationName
 *         - dosage
 *         - frequency
 *         - duration
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Prescription unique identifier
 *         patientId:
 *           type: string
 *           format: uuid
 *           description: Patient ID
 *         doctorId:
 *           type: string
 *           format: uuid
 *           description: Doctor ID
 *         medicationName:
 *           type: string
 *           description: Name of the medication
 *         dosage:
 *           type: string
 *           description: Medication dosage (e.g., "10mg")
 *         frequency:
 *           type: string
 *           description: How often to take (e.g., "Twice daily")
 *         duration:
 *           type: string
 *           description: How long to take (e.g., "7 days")
 *         instructions:
 *           type: string
 *           description: Special instructions
 *         status:
 *           type: string
 *           enum: [pending, filled, dispensed, cancelled]
 *           description: Prescription status
 *         refillsRemaining:
 *           type: integer
 *           description: Number of refills remaining
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     
 *     Billing:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         patientId:
 *           type: string
 *           format: uuid
 *         appointmentId:
 *           type: string
 *           format: uuid
 *         invoiceNumber:
 *           type: string
 *           description: Invoice number
 *         totalAmount:
 *           type: number
 *           format: decimal
 *           description: Total bill amount
 *         paidAmount:
 *           type: number
 *           format: decimal
 *           description: Amount paid
 *         balanceAmount:
 *           type: number
 *           format: decimal
 *           description: Outstanding balance
 *         status:
 *           type: string
 *           enum: [pending, partial, paid, overdue, cancelled]
 *         paymentMethod:
 *           type: string
 *           enum: [cash, card, insurance, bank_transfer]
 *         insuranceClaim:
 *           type: object
 *           properties:
 *             provider:
 *               type: string
 *             policyNumber:
 *               type: string
 *             claimAmount:
 *               type: number
 *             status:
 *               type: string
 *               enum: [submitted, approved, denied, pending]
 *         items:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               description:
 *                 type: string
 *               quantity:
 *                 type: integer
 *               unitPrice:
 *                 type: number
 *               totalPrice:
 *                 type: number
 *         dueDate:
 *           type: string
 *           format: date
 *         createdAt:
 *           type: string
 *           format: date-time
 *     
 *     Staff:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         employeeId:
 *           type: string
 *           description: Employee ID
 *         department:
 *           type: string
 *           description: Department name
 *         specialization:
 *           type: string
 *           description: Medical specialization (for doctors)
 *         licenseNumber:
 *           type: string
 *           description: Medical license number
 *         qualifications:
 *           type: array
 *           items:
 *             type: string
 *           description: Educational qualifications
 *         experience:
 *           type: integer
 *           description: Years of experience
 *         schedule:
 *           type: object
 *           properties:
 *             monday:
 *               type: object
 *               properties:
 *                 start:
 *                   type: string
 *                   format: time
 *                 end:
 *                   type: string
 *                   format: time
 *         isActive:
 *           type: boolean
 *         createdAt:
 *           type: string
 *           format: date-time
 *     
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message
 *         type:
 *           type: string
 *           enum: [appointment, prescription, billing, system, emergency]
 *         priority:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         isRead:
 *           type: boolean
 *           default: false
 *         data:
 *           type: object
 *           description: Additional notification data
 *         createdAt:
 *           type: string
 *           format: date-time
 *     
 *     Analytics:
 *       type: object
 *       properties:
 *         overview:
 *           type: object
 *           properties:
 *             totalPatients:
 *               type: integer
 *             totalAppointments:
 *               type: integer
 *             totalRevenue:
 *               type: number
 *             activeStaff:
 *               type: integer
 *         dailyStats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               appointments:
 *                 type: integer
 *               revenue:
 *                 type: number
 *               newPatients:
 *                 type: integer
 *         departmentStats:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               department:
 *                 type: string
 *               patients:
 *                 type: integer
 *               revenue:
 *                 type: number
 *               utilization:
 *                 type: number
 *     
 *     HealthCheck:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           enum: [healthy, unhealthy, degraded]
 *         timestamp:
 *           type: string
 *           format: date-time
 *         uptime:
 *           type: number
 *           description: Uptime in seconds
 *         version:
 *           type: string
 *           description: Application version
 *         services:
 *           type: object
 *           properties:
 *             database:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [connected, disconnected, error]
 *                 responseTime:
 *                   type: number
 *                   description: Response time in milliseconds
 *             redis:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [connected, disconnected, error]
 *                 responseTime:
 *                   type: number
 *             email:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   enum: [available, unavailable, error]
 *         metrics:
 *           type: object
 *           properties:
 *             memoryUsage:
 *               type: object
 *               properties:
 *                 used:
 *                   type: number
 *                 free:
 *                   type: number
 *                 percentage:
 *                   type: number
 *             cpuUsage:
 *               type: number
 *               description: CPU usage percentage
 *             activeConnections:
 *               type: integer
 *               description: Number of active database connections
 */

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     tags: [Authentication]
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: doctor@hospital.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: admin123
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                       description: JWT access token
 *                     refreshToken:
 *                       type: string
 *                       description: JWT refresh token
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/auth/profile:
 *   get:
 *     tags: [Authentication]
 *     summary: Get user profile
 *     description: Get current user's profile information
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */

/**
 * @swagger
 * /api/patients:
 *   get:
 *     tags: [Patients]
 *     summary: Get all patients
 *     description: Retrieve a list of all patients with optional filtering and pagination
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for patient name or ID
 *       - in: query
 *         name: bloodType
 *         schema:
 *           type: string
 *           enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *         description: Filter by blood type
 *       - in: query
 *         name: gender
 *         schema:
 *           type: string
 *           enum: [male, female, other]
 *         description: Filter by gender
 *     responses:
 *       200:
 *         description: Patients retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Patient'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Insufficient permissions
 *   post:
 *     tags: [Patients]
 *     summary: Create new patient
 *     description: Register a new patient in the system
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - phone
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               firstName:
 *                 type: string
 *                 example: John
 *               lastName:
 *                 type: string
 *                 example: Doe
 *               email:
 *                 type: string
 *                 format: email
 *                 example: john.doe@email.com
 *               phone:
 *                 type: string
 *                 example: +1-555-0123
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *                 example: 1990-01-15
 *               gender:
 *                 type: string
 *                 enum: [male, female, other]
 *                 example: male
 *               bloodType:
 *                 type: string
 *                 enum: [A+, A-, B+, B-, AB+, AB-, O+, O-]
 *                 example: O+
 *               address:
 *                 type: string
 *                 example: 123 Main St, City, State 12345
 *               allergies:
 *                 type: string
 *                 example: Penicillin, Peanuts
 *               medicalHistory:
 *                 type: string
 *                 example: Hypertension, Diabetes Type 2
 *               emergencyContactName:
 *                 type: string
 *                 example: Jane Doe
 *               emergencyContactPhone:
 *                 type: string
 *                 example: +1-555-0124
 *     responses:
 *       201:
 *         description: Patient created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Patient created successfully
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       400:
 *         description: Validation error
 *       409:
 *         description: Patient with email already exists
 */

/**
 * @swagger
 * /api/patients/{id}:
 *   get:
 *     tags: [Patients]
 *     summary: Get patient by ID
 *     description: Retrieve a specific patient's information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/Patient'
 *       404:
 *         description: Patient not found
 *       401:
 *         description: Unauthorized
 *   put:
 *     tags: [Patients]
 *     summary: Update patient
 *     description: Update patient information
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *                 format: email
 *               phone:
 *                 type: string
 *               address:
 *                 type: string
 *               allergies:
 *                 type: string
 *               medicalHistory:
 *                 type: string
 *     responses:
 *       200:
 *         description: Patient updated successfully
 *       404:
 *         description: Patient not found
 *       400:
 *         description: Validation error
 *   delete:
 *     tags: [Patients]
 *     summary: Delete patient
 *     description: Soft delete a patient (deactivate)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Patient ID
 *     responses:
 *       200:
 *         description: Patient deleted successfully
 *       404:
 *         description: Patient not found
 *       403:
 *         description: Insufficient permissions
 */

/**
 * @swagger
 * /api/appointments:
 *   get:
 *     tags: [Appointments]
 *     summary: Get all appointments
 *     description: Retrieve appointments with optional filtering
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by appointment date
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [scheduled, confirmed, in_progress, completed, cancelled, no_show]
 *         description: Filter by appointment status
 *       - in: query
 *         name: doctorId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by doctor ID
 *       - in: query
 *         name: patientId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by patient ID
 *     responses:
 *       200:
 *         description: Appointments retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appointment'
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *   post:
 *     tags: [Appointments]
 *     summary: Create new appointment
 *     description: Schedule a new appointment
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - patientId
 *               - doctorId
 *               - appointmentDate
 *               - appointmentTime
 *               - reason
 *             properties:
 *               patientId:
 *                 type: string
 *                 format: uuid
 *               doctorId:
 *                 type: string
 *                 format: uuid
 *               appointmentDate:
 *                 type: string
 *                 format: date
 *                 example: 2024-01-15
 *               appointmentTime:
 *                 type: string
 *                 format: time
 *                 example: 14:30:00
 *               durationMinutes:
 *                 type: integer
 *                 example: 30
 *               reason:
 *                 type: string
 *                 example: Regular checkup
 *               notes:
 *                 type: string
 *                 example: Patient reports mild headaches
 *     responses:
 *       201:
 *         description: Appointment created successfully
 *       400:
 *         description: Validation error or scheduling conflict
 *       409:
 *         description: Time slot already booked
 */

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health Check]
 *     summary: Health check endpoint
 *     description: Check the health status of the API and its dependencies
 *     responses:
 *       200:
 *         description: System is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: System is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 */

