const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'HMIS API - Hospital Management Information System',
      version: '1.0.0',
      description: `
        # Hospital Management Information System API

        This API provides comprehensive endpoints for managing hospital operations including:
        - **Patient Management**: Registration, records, and patient information
        - **Appointment Scheduling**: Booking, rescheduling, and appointment management
        - **Medical Records**: Diagnoses, treatments, and medical history
        - **Prescription Management**: Medication orders and pharmacy integration
        - **Billing & Insurance**: Financial transactions and insurance processing
        - **User Management**: Staff accounts and role-based access control
        - **Real-time Notifications**: WebSocket-based updates
        - **Analytics & Reporting**: Hospital statistics and insights

        ## Authentication
        This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <your-jwt-token>\`

        ## Rate Limiting
        API requests are limited to 100 requests per 15-minute window per IP address.

        ## Error Handling
        The API returns standardized error responses with appropriate HTTP status codes and detailed error messages.
      `,
      contact: {
        name: 'HMIS Development Team',
        email: 'dev@hmis.com',
        url: 'https://hmis.com/support'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: 'http://localhost:5000',
        description: 'Development server'
      },
      {
        url: 'https://api.hmis.com',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'User unique identifier'
            },
            username: {
              type: 'string',
              description: 'Username for login'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address'
            },
            role: {
              type: 'string',
              enum: ['admin', 'doctor', 'nurse', 'receptionist', 'pharmacist', 'patient'],
              description: 'User role in the system'
            },
            firstName: {
              type: 'string',
              description: 'User first name'
            },
            lastName: {
              type: 'string',
              description: 'User last name'
            },
            phone: {
              type: 'string',
              description: 'User phone number'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the user account is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp'
            }
          }
        },
        Patient: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Patient unique identifier'
            },
            patientId: {
              type: 'string',
              description: 'Patient ID (e.g., PAT000001)'
            },
            firstName: {
              type: 'string',
              description: 'Patient first name'
            },
            lastName: {
              type: 'string',
              description: 'Patient last name'
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Patient email address'
            },
            phone: {
              type: 'string',
              description: 'Patient phone number'
            },
            dateOfBirth: {
              type: 'string',
              format: 'date',
              description: 'Patient date of birth'
            },
            gender: {
              type: 'string',
              enum: ['male', 'female', 'other'],
              description: 'Patient gender'
            },
            bloodType: {
              type: 'string',
              enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
              description: 'Patient blood type'
            },
            address: {
              type: 'string',
              description: 'Patient address'
            },
            allergies: {
              type: 'string',
              description: 'Patient allergies'
            },
            medicalHistory: {
              type: 'string',
              description: 'Patient medical history'
            },
            insuranceProvider: {
              type: 'string',
              description: 'Insurance provider name'
            },
            insuranceNumber: {
              type: 'string',
              description: 'Insurance policy number'
            },
            emergencyContactName: {
              type: 'string',
              description: 'Emergency contact name'
            },
            emergencyContactPhone: {
              type: 'string',
              description: 'Emergency contact phone'
            },
            isActive: {
              type: 'boolean',
              description: 'Whether the patient record is active'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Record creation timestamp'
            }
          }
        },
        Appointment: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              description: 'Appointment unique identifier'
            },
            patientId: {
              type: 'string',
              format: 'uuid',
              description: 'Patient ID'
            },
            doctorId: {
              type: 'string',
              format: 'uuid',
              description: 'Doctor ID'
            },
            appointmentDate: {
              type: 'string',
              format: 'date',
              description: 'Appointment date'
            },
            appointmentTime: {
              type: 'string',
              format: 'time',
              description: 'Appointment time'
            },
            durationMinutes: {
              type: 'integer',
              description: 'Appointment duration in minutes'
            },
            status: {
              type: 'string',
              enum: ['scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show'],
              description: 'Appointment status'
            },
            reason: {
              type: 'string',
              description: 'Reason for appointment'
            },
            notes: {
              type: 'string',
              description: 'Additional notes'
            },
            createdAt: {
              type: 'string',
              format: 'date-time',
              description: 'Appointment creation timestamp'
            }
          }
        },
        ApiResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              description: 'Whether the request was successful'
            },
            message: {
              type: 'string',
              description: 'Response message'
            },
            data: {
              type: 'object',
              description: 'Response data'
            },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'integer' },
                limit: { type: 'integer' },
                total: { type: 'integer' },
                pages: { type: 'integer' }
              }
            }
          }
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            message: {
              type: 'string',
              description: 'Error message'
            },
            code: {
              type: 'string',
              description: 'Error code'
            },
            errors: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  field: { type: 'string' },
                  message: { type: 'string' },
                  value: { type: 'string' }
                }
              }
            }
          }
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ]
  },
  apis: [
    './routes/*.js',
    './controllers/*.js',
    './models/*.js'
  ]
};

const specs = swaggerJsdoc(options);

module.exports = {
  specs,
  swaggerUi
};
