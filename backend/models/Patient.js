// Use centralized database manager
const db = require('../config/database-manager');

class Patient {
  constructor(data) {
    this.id = data.id;
    this.userId = data.user_id;
    this.patientId = data.patient_id;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.email = data.email;
    this.phone = data.phone;
    this.dateOfBirth = data.date_of_birth;
    this.gender = data.gender;
    this.address = data.address;
    this.bloodType = data.blood_type;
    this.allergies = data.allergies;
    this.medicalHistory = data.medical_history;
    this.insuranceProvider = data.insurance_provider;
    this.insuranceNumber = data.insurance_number;
    this.emergencyContactName = data.emergency_contact_name;
    this.emergencyContactPhone = data.emergency_contact_phone;
    this.isActive = data.is_active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new patient
  static async create(patientData) {
    const {
      userId,
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      bloodType,
      allergies,
      medicalHistory,
      insuranceProvider,
      insuranceNumber,
      emergencyContactName,
      emergencyContactPhone
    } = patientData;

    try {
      // Generate patient ID
      const patientId = await this.generatePatientId();

      const query = `
        INSERT INTO patients (
          user_id, patient_id, first_name, last_name, email, phone,
          date_of_birth, gender, address, blood_type, allergies,
          medical_history, insurance_provider, insurance_number,
          emergency_contact_name, emergency_contact_phone
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
        RETURNING *
      `;

      const values = [
        userId, patientId, firstName, lastName, email, phone,
        dateOfBirth, gender, address, bloodType, allergies,
        medicalHistory, insuranceProvider, insuranceNumber,
        emergencyContactName, emergencyContactPhone
      ];

      const result = await db.query(query, values);
      return new Patient(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Generate unique patient ID
  static async generatePatientId() {
    try {
      const query = 'SELECT COUNT(*) as count FROM patients';
      const result = await db.query(query);
      const count = parseInt(result.rows[0].count) + 1;
      return `PAT${count.toString().padStart(6, '0')}`;
    } catch (error) {
      throw error;
    }
  }

  // Find patient by ID
  static async findById(id) {
    try {
      const query = `
        SELECT p.*, u.username, u.role
        FROM patients p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.id = $1
      `;
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Patient(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find patient by patient ID
  static async findByPatientId(patientId) {
    try {
      const query = `
        SELECT p.*, u.username, u.role
        FROM patients p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE p.patient_id = $1
      `;
      const result = await db.query(query, [patientId]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Patient(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Get all patients with pagination and filters
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        search = null,
        bloodType = null,
        gender = null,
        isActive = true
      } = options;

      let query = `
        SELECT p.*, u.username, u.role
        FROM patients p
        LEFT JOIN users u ON p.user_id = u.id
        WHERE 1=1
      `;
      const values = [];
      let paramCount = 0;

      if (isActive !== null) {
        paramCount++;
        query += ` AND p.is_active = $${paramCount}`;
        values.push(isActive);
      }

      if (bloodType) {
        paramCount++;
        query += ` AND p.blood_type = $${paramCount}`;
        values.push(bloodType);
      }

      if (gender) {
        paramCount++;
        query += ` AND p.gender = $${paramCount}`;
        values.push(gender);
      }

      if (search) {
        paramCount++;
        query += ` AND (
          p.first_name ILIKE $${paramCount} OR 
          p.last_name ILIKE $${paramCount} OR 
          p.patient_id ILIKE $${paramCount} OR 
          p.email ILIKE $${paramCount}
        )`;
        values.push(`%${search}%`);
      }

      // Add pagination
      const offset = (page - 1) * limit;
      paramCount++;
      query += ` ORDER BY p.created_at DESC LIMIT $${paramCount}`;
      values.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(offset);

      const result = await db.query(query, values);
      return result.rows.map(row => new Patient(row));
    } catch (error) {
      throw error;
    }
  }

  // Get patient statistics
  static async getStatistics() {
    try {
      const queries = {
        totalPatients: 'SELECT COUNT(*) as count FROM patients WHERE is_active = true',
        newPatientsToday: `
          SELECT COUNT(*) as count FROM patients 
          WHERE DATE(created_at) = CURRENT_DATE AND is_active = true
        `,
        bloodTypeDistribution: `
          SELECT blood_type, COUNT(*) as count 
          FROM patients 
          WHERE is_active = true AND blood_type IS NOT NULL
          GROUP BY blood_type
        `,
        genderDistribution: `
          SELECT gender, COUNT(*) as count 
          FROM patients 
          WHERE is_active = true AND gender IS NOT NULL
          GROUP BY gender
        `,
        ageGroupDistribution: `
          SELECT 
            CASE 
              WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) < 18 THEN '0-17'
              WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 18 AND 35 THEN '18-35'
              WHEN EXTRACT(YEAR FROM AGE(date_of_birth)) BETWEEN 36 AND 55 THEN '36-55'
              ELSE '55+'
            END as age_group,
            COUNT(*) as count
          FROM patients 
          WHERE is_active = true AND date_of_birth IS NOT NULL
          GROUP BY age_group
        `
      };

      const results = {};
      for (const [key, query] of Object.entries(queries)) {
        const result = await db.query(query);
        results[key] = result.rows;
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  // Update patient
  async update(updateData) {
    try {
      const allowedFields = [
        'first_name', 'last_name', 'email', 'phone', 'date_of_birth',
        'gender', 'address', 'blood_type', 'allergies', 'medical_history',
        'insurance_provider', 'insurance_number', 'emergency_contact_name',
        'emergency_contact_phone', 'is_active'
      ];

      const updates = [];
      const values = [];
      let paramCount = 0;

      for (const [key, value] of Object.entries(updateData)) {
        if (allowedFields.includes(key) && value !== undefined) {
          paramCount++;
          updates.push(`${key} = $${paramCount}`);
          values.push(value);
        }
      }

      if (updates.length === 0) {
        throw new Error('No valid fields to update');
      }

      paramCount++;
      values.push(this.id);

      const query = `
        UPDATE patients 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);
      const updatedPatient = new Patient(result.rows[0]);

      // Update current instance
      Object.assign(this, updatedPatient);
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Soft delete patient
  async delete() {
    try {
      const query = `
        UPDATE patients 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(query, [this.id]);
      return new Patient(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Get patient's appointments
  async getAppointments() {
    try {
      const query = `
        SELECT a.*, s.first_name as doctor_first_name, s.last_name as doctor_last_name
        FROM appointments a
        LEFT JOIN staff s ON a.doctor_id = s.id
        WHERE a.patient_id = $1
        ORDER BY a.appointment_date DESC, a.appointment_time DESC
      `;

      const result = await db.query(query, [this.id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get patient's medical records
  async getMedicalRecords() {
    try {
      const query = `
        SELECT mr.*, s.first_name as doctor_first_name, s.last_name as doctor_last_name
        FROM medical_records mr
        LEFT JOIN staff s ON mr.doctor_id = s.id
        WHERE mr.patient_id = $1
        ORDER BY mr.created_at DESC
      `;

      const result = await db.query(query, [this.id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get patient's prescriptions
  async getPrescriptions() {
    try {
      const query = `
        SELECT p.*, s.first_name as doctor_first_name, s.last_name as doctor_last_name
        FROM prescriptions p
        LEFT JOIN staff s ON p.doctor_id = s.id
        WHERE p.patient_id = $1
        ORDER BY p.created_at DESC
      `;

      const result = await db.query(query, [this.id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Get patient's billing records
  async getBillingRecords() {
    try {
      const query = `
        SELECT b.*, a.appointment_date
        FROM billing b
        LEFT JOIN appointments a ON b.appointment_id = a.id
        WHERE b.patient_id = $1
        ORDER BY b.created_at DESC
      `;

      const result = await db.query(query, [this.id]);
      return result.rows;
    } catch (error) {
      throw error;
    }
  }

  // Calculate patient age
  getAge() {
    if (!this.dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(this.dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    const patient = { ...this };
    patient.age = this.getAge();
    return patient;
  }
}

module.exports = Patient;
