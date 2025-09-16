// Try to load real database, fallback to demo database
let db;
try {
  db = require('../config/database');
} catch (error) {
  db = require('../config/demo-database');
}

class Appointment {
  constructor(data) {
    this.id = data.id;
    this.patientId = data.patient_id;
    this.doctorId = data.doctor_id;
    this.appointmentDate = data.appointment_date;
    this.appointmentTime = data.appointment_time;
    this.durationMinutes = data.duration_minutes;
    this.status = data.status;
    this.reason = data.reason;
    this.notes = data.notes;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new appointment
  static async create(appointmentData) {
    const {
      patientId,
      doctorId,
      appointmentDate,
      appointmentTime,
      durationMinutes = 30,
      reason,
      notes
    } = appointmentData;

    try {
      // Check for conflicts
      const conflict = await this.checkTimeConflict(doctorId, appointmentDate, appointmentTime, durationMinutes);
      if (conflict) {
        throw new Error('Appointment time conflicts with existing appointment');
      }

      const query = `
        INSERT INTO appointments (
          patient_id, doctor_id, appointment_date, appointment_time,
          duration_minutes, reason, notes, status
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, 'scheduled')
        RETURNING *
      `;

      const values = [patientId, doctorId, appointmentDate, appointmentTime, durationMinutes, reason, notes];
      const result = await db.query(query, values);
      return new Appointment(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Check for time conflicts
  static async checkTimeConflict(doctorId, date, time, duration) {
    try {
      const query = `
        SELECT id FROM appointments 
        WHERE doctor_id = $1 
        AND appointment_date = $2 
        AND status NOT IN ('cancelled', 'no_show')
        AND (
          (appointment_time <= $3 AND appointment_time + INTERVAL '1 minute' * duration_minutes > $3) OR
          ($3 < appointment_time + INTERVAL '1 minute' * duration_minutes AND $3 + INTERVAL '1 minute' * $4 > appointment_time)
        )
      `;

      const result = await db.query(query, [doctorId, date, time, duration]);
      return result.rows.length > 0;
    } catch (error) {
      throw error;
    }
  }

  // Find appointment by ID
  static async findById(id) {
    try {
      const query = `
        SELECT a.*, 
               p.first_name as patient_first_name, p.last_name as patient_last_name,
               p.patient_id as patient_number,
               s.first_name as doctor_first_name, s.last_name as doctor_last_name,
               s.specialization
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN staff s ON a.doctor_id = s.id
        WHERE a.id = $1
      `;
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new Appointment(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Get appointments with filters
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        doctorId = null,
        patientId = null,
        status = null,
        date = null,
        dateRange = null
      } = options;

      let query = `
        SELECT a.*, 
               p.first_name as patient_first_name, p.last_name as patient_last_name,
               p.patient_id as patient_number,
               s.first_name as doctor_first_name, s.last_name as doctor_last_name,
               s.specialization
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN staff s ON a.doctor_id = s.id
        WHERE 1=1
      `;
      const values = [];
      let paramCount = 0;

      if (doctorId) {
        paramCount++;
        query += ` AND a.doctor_id = $${paramCount}`;
        values.push(doctorId);
      }

      if (patientId) {
        paramCount++;
        query += ` AND a.patient_id = $${paramCount}`;
        values.push(patientId);
      }

      if (status) {
        paramCount++;
        query += ` AND a.status = $${paramCount}`;
        values.push(status);
      }

      if (date) {
        paramCount++;
        query += ` AND a.appointment_date = $${paramCount}`;
        values.push(date);
      }

      if (dateRange && dateRange.start && dateRange.end) {
        paramCount++;
        query += ` AND a.appointment_date >= $${paramCount}`;
        values.push(dateRange.start);
        paramCount++;
        query += ` AND a.appointment_date <= $${paramCount}`;
        values.push(dateRange.end);
      }

      // Add pagination
      const offset = (page - 1) * limit;
      paramCount++;
      query += ` ORDER BY a.appointment_date DESC, a.appointment_time DESC LIMIT $${paramCount}`;
      values.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(offset);

      const result = await db.query(query, values);
      return result.rows.map(row => new Appointment(row));
    } catch (error) {
      throw error;
    }
  }

  // Get today's appointments
  static async getTodaysAppointments(doctorId = null) {
    try {
      let query = `
        SELECT a.*, 
               p.first_name as patient_first_name, p.last_name as patient_last_name,
               p.patient_id as patient_number,
               s.first_name as doctor_first_name, s.last_name as doctor_last_name,
               s.specialization
        FROM appointments a
        LEFT JOIN patients p ON a.patient_id = p.id
        LEFT JOIN staff s ON a.doctor_id = s.id
        WHERE a.appointment_date = CURRENT_DATE
      `;
      const values = [];

      if (doctorId) {
        query += ` AND a.doctor_id = $1`;
        values.push(doctorId);
      }

      query += ` ORDER BY a.appointment_time ASC`;

      const result = await db.query(query, values);
      return result.rows.map(row => new Appointment(row));
    } catch (error) {
      throw error;
    }
  }

  // Get appointment statistics
  static async getStatistics(options = {}) {
    try {
      const { doctorId = null, dateRange = null } = options;
      
      let whereClause = 'WHERE 1=1';
      const values = [];
      let paramCount = 0;

      if (doctorId) {
        paramCount++;
        whereClause += ` AND doctor_id = $${paramCount}`;
        values.push(doctorId);
      }

      if (dateRange && dateRange.start && dateRange.end) {
        paramCount++;
        whereClause += ` AND appointment_date >= $${paramCount}`;
        values.push(dateRange.start);
        paramCount++;
        whereClause += ` AND appointment_date <= $${paramCount}`;
        values.push(dateRange.end);
      }

      const queries = {
        totalAppointments: `SELECT COUNT(*) as count FROM appointments ${whereClause}`,
        todayAppointments: `SELECT COUNT(*) as count FROM appointments ${whereClause} AND appointment_date = CURRENT_DATE`,
        completedToday: `SELECT COUNT(*) as count FROM appointments ${whereClause} AND appointment_date = CURRENT_DATE AND status = 'completed'`,
        pendingAppointments: `SELECT COUNT(*) as count FROM appointments ${whereClause} AND status IN ('scheduled', 'confirmed')`,
        statusDistribution: `SELECT status, COUNT(*) as count FROM appointments ${whereClause} GROUP BY status`,
        dailyStats: `
          SELECT appointment_date, COUNT(*) as appointments, 
                 COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed
          FROM appointments ${whereClause}
          GROUP BY appointment_date
          ORDER BY appointment_date DESC
          LIMIT 30
        `,
        doctorStats: `
          SELECT s.id as doctor_id, s.first_name, s.last_name, COUNT(*) as appointments
          FROM appointments a
          LEFT JOIN staff s ON a.doctor_id = s.id
          ${whereClause.replace('WHERE 1=1', 'WHERE 1=1 AND a.doctor_id = s.id')}
          GROUP BY s.id, s.first_name, s.last_name
        `
      };

      const results = {};
      for (const [key, query] of Object.entries(queries)) {
        const result = await db.query(query, values);
        results[key] = result.rows;
      }

      return results;
    } catch (error) {
      throw error;
    }
  }

  // Update appointment
  async update(updateData) {
    try {
      const allowedFields = [
        'appointment_date', 'appointment_time', 'duration_minutes',
        'status', 'reason', 'notes'
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

      // Check for conflicts if time is being updated
      if (updateData.appointment_date || updateData.appointment_time || updateData.duration_minutes) {
        const conflict = await Appointment.checkTimeConflict(
          this.doctorId,
          updateData.appointment_date || this.appointmentDate,
          updateData.appointment_time || this.appointmentTime,
          updateData.duration_minutes || this.durationMinutes
        );
        if (conflict) {
          throw new Error('Updated appointment time conflicts with existing appointment');
        }
      }

      paramCount++;
      values.push(this.id);

      const query = `
        UPDATE appointments 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);
      const updatedAppointment = new Appointment(result.rows[0]);

      // Update current instance
      Object.assign(this, updatedAppointment);
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Cancel appointment
  async cancel(reason = null) {
    try {
      const query = `
        UPDATE appointments 
        SET status = 'cancelled', notes = COALESCE($1, notes), updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await db.query(query, [reason, this.id]);
      return new Appointment(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Mark as completed
  async complete(notes = null) {
    try {
      const query = `
        UPDATE appointments 
        SET status = 'completed', notes = COALESCE($1, notes), updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await db.query(query, [notes, this.id]);
      return new Appointment(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Get appointment duration in minutes
  getDurationInMinutes() {
    return this.durationMinutes || 30;
  }

  // Get appointment end time
  getEndTime() {
    if (!this.appointmentTime) return null;
    
    const startTime = new Date(`2000-01-01T${this.appointmentTime}`);
    const endTime = new Date(startTime.getTime() + (this.getDurationInMinutes() * 60000));
    
    return endTime.toTimeString().split(' ')[0];
  }

  // Check if appointment is today
  isToday() {
    if (!this.appointmentDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return this.appointmentDate === today;
  }

  // Check if appointment is in the past
  isPast() {
    if (!this.appointmentDate) return false;
    const today = new Date().toISOString().split('T')[0];
    return this.appointmentDate < today;
  }

  // Convert to JSON
  toJSON() {
    const appointment = { ...this };
    appointment.endTime = this.getEndTime();
    appointment.isToday = this.isToday();
    appointment.isPast = this.isPast();
    return appointment;
  }
}

module.exports = Appointment;
