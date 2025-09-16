// Try to load real database, fallback to demo database
let db;
try {
  db = require('../config/database');
} catch (error) {
  db = require('../config/demo-database');
}
const bcrypt = require('bcrypt');

class User {
  constructor(data) {
    this.id = data.id;
    this.username = data.username;
    this.email = data.email;
    this.role = data.role;
    this.firstName = data.first_name;
    this.lastName = data.last_name;
    this.phone = data.phone;
    this.isActive = data.is_active;
    this.createdAt = data.created_at;
    this.updatedAt = data.updated_at;
  }

  // Create a new user
  static async create(userData) {
    const {
      username,
      email,
      password,
      role,
      firstName,
      lastName,
      phone
    } = userData;

    try {
      // Hash password
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      const query = `
        INSERT INTO users (username, email, password_hash, role, first_name, last_name, phone)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;

      const values = [username, email, passwordHash, role, firstName, lastName, phone];
      const result = await db.query(query, values);

      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by ID
  static async findById(id) {
    try {
      const query = 'SELECT * FROM users WHERE id = $1';
      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by username
  static async findByUsername(username) {
    try {
      const query = 'SELECT * FROM users WHERE username = $1';
      const result = await db.query(query, [username]);

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Find user by email
  static async findByEmail(email) {
    try {
      const query = 'SELECT * FROM users WHERE email = $1';
      const result = await db.query(query, [email]);

      if (result.rows.length === 0) {
        return null;
      }

      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Get all users with pagination
  static async findAll(options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        role = null,
        isActive = null,
        search = null
      } = options;

      let query = 'SELECT * FROM users WHERE 1=1';
      const values = [];
      let paramCount = 0;

      if (role) {
        paramCount++;
        query += ` AND role = $${paramCount}`;
        values.push(role);
      }

      if (isActive !== null) {
        paramCount++;
        query += ` AND is_active = $${paramCount}`;
        values.push(isActive);
      }

      if (search) {
        paramCount++;
        query += ` AND (username ILIKE $${paramCount} OR email ILIKE $${paramCount} OR first_name ILIKE $${paramCount} OR last_name ILIKE $${paramCount})`;
        values.push(`%${search}%`);
      }

      // Add pagination
      const offset = (page - 1) * limit;
      paramCount++;
      query += ` ORDER BY created_at DESC LIMIT $${paramCount}`;
      values.push(limit);

      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(offset);

      const result = await db.query(query, values);
      return result.rows.map(row => new User(row));
    } catch (error) {
      throw error;
    }
  }

  // Update user
  async update(updateData) {
    try {
      const allowedFields = ['email', 'first_name', 'last_name', 'phone', 'is_active'];
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
        UPDATE users 
        SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
        WHERE id = $${paramCount}
        RETURNING *
      `;

      const result = await db.query(query, values);
      const updatedUser = new User(result.rows[0]);

      // Update current instance
      Object.assign(this, updatedUser);
      return this;
    } catch (error) {
      throw error;
    }
  }

  // Change password
  async changePassword(newPassword) {
    try {
      const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
      const passwordHash = await bcrypt.hash(newPassword, saltRounds);

      const query = `
        UPDATE users 
        SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;

      const result = await db.query(query, [passwordHash, this.id]);
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Verify password
  async verifyPassword(password) {
    try {
      const query = 'SELECT password_hash FROM users WHERE id = $1';
      const result = await db.query(query, [this.id]);
      
      if (result.rows.length === 0) {
        return false;
      }

      return await bcrypt.compare(password, result.rows[0].password_hash);
    } catch (error) {
      throw error;
    }
  }

  // Soft delete user
  async delete() {
    try {
      const query = `
        UPDATE users 
        SET is_active = false, updated_at = CURRENT_TIMESTAMP
        WHERE id = $1
        RETURNING *
      `;

      const result = await db.query(query, [this.id]);
      return new User(result.rows[0]);
    } catch (error) {
      throw error;
    }
  }

  // Get user with staff information
  static async findByIdWithStaff(id) {
    try {
      const query = `
        SELECT u.*, s.employee_id, s.department, s.specialization, s.license_number, s.hire_date, s.salary
        FROM users u
        LEFT JOIN staff s ON u.id = s.user_id
        WHERE u.id = $1
      `;

      const result = await db.query(query, [id]);

      if (result.rows.length === 0) {
        return null;
      }

      const userData = result.rows[0];
      const user = new User(userData);
      
      // Add staff information if exists
      if (userData.employee_id) {
        user.staff = {
          employeeId: userData.employee_id,
          department: userData.department,
          specialization: userData.specialization,
          licenseNumber: userData.license_number,
          hireDate: userData.hire_date,
          salary: userData.salary
        };
      }

      return user;
    } catch (error) {
      throw error;
    }
  }

  // Convert to JSON (exclude sensitive data)
  toJSON() {
    const user = { ...this };
    delete user.passwordHash;
    return user;
  }
}

module.exports = User;
