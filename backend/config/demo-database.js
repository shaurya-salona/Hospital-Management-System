// Demo Database - In-memory storage for demonstration
// This replaces PostgreSQL for demo purposes

const demoData = {
  users: [
    {
      id: '1',
      email: 'admin@hospital.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: admin123
      first_name: 'System',
      last_name: 'Administrator',
      role: 'admin',
      phone: '+1234567890',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: '2',
      email: 'dr.smith@hospital.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: doctor123
      first_name: 'Dr. John',
      last_name: 'Smith',
      role: 'doctor',
      phone: '+1234567891',
      is_active: true,
      created_at: new Date().toISOString()
    },
    {
      id: '3',
      email: 'patient@hospital.com',
      password_hash: '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', // password: patient123
      first_name: 'Jane',
      last_name: 'Doe',
      role: 'patient',
      phone: '+1234567892',
      is_active: true,
      created_at: new Date().toISOString()
    }
  ],
  patients: [
    {
      id: '1',
      user_id: '3',
      patient_id: 'PAT000001',
      emergency_contact_name: 'John Doe',
      emergency_contact_phone: '+1234567893',
      blood_type: 'O+',
      allergies: 'penicillin',
      medical_history: 'No significant history',
      created_at: new Date().toISOString()
    }
  ],
  doctors: [
    {
      id: '1',
      user_id: '2',
      doctor_id: 'DOC000001',
      specialization: 'General Medicine',
      license_number: 'MD123456',
      experience_years: 10,
      consultation_fee: 150.00,
      is_available: true,
      created_at: new Date().toISOString()
    }
  ],
  appointments: [
    {
      id: '1',
      patient_id: '1',
      doctor_id: '1',
      appointment_date: '2024-01-15',
      appointment_time: '10:00:00',
      duration_minutes: 30,
      reason: 'Regular checkup',
      status: 'scheduled',
      priority: 'normal',
      created_at: new Date().toISOString()
    }
  ],
  medical_records: [],
  prescriptions: [],
  billing: [],
  notifications: []
};

// Simulate database operations
const query = async (text, params = []) => {
  console.log('📊 Demo Query:', text.substring(0, 50) + '...');
  
  // Simulate query delay
  await new Promise(resolve => setTimeout(resolve, 10));
  
  // Handle different query types
  if (text.includes('SELECT') && text.includes('users') && text.includes('email')) {
    const email = params[0];
    const user = demoData.users.find(u => u.email === email);
    return { rows: user ? [user] : [] };
  }
  
  if (text.includes('SELECT') && text.includes('users') && text.includes('id')) {
    const id = params[0];
    const user = demoData.users.find(u => u.id === id);
    return { rows: user ? [user] : [] };
  }
  
  if (text.includes('INSERT') && text.includes('users')) {
    const newUser = {
      id: (demoData.users.length + 1).toString(),
      email: params[0],
      password_hash: params[1],
      first_name: params[2],
      last_name: params[3],
      role: params[4],
      phone: params[5],
      is_active: true,
      created_at: new Date().toISOString()
    };
    demoData.users.push(newUser);
    return { rows: [newUser] };
  }
  
  if (text.includes('SELECT') && text.includes('patients')) {
    return { rows: demoData.patients };
  }
  
  if (text.includes('SELECT') && text.includes('doctors')) {
    return { rows: demoData.doctors };
  }
  
  if (text.includes('SELECT') && text.includes('appointments')) {
    return { rows: demoData.appointments };
  }
  
  if (text.includes('SELECT 1')) {
    return { rows: [{ '?column?': 1 }] };
  }
  
  // Default response
  return { rows: [] };
};

const getClient = async () => {
  return {
    query: query,
    release: () => {}
  };
};

const transaction = async (callback) => {
  const client = await getClient();
  try {
    const result = await callback(client);
    return result;
  } catch (error) {
    throw error;
  }
};

module.exports = {
  query,
  getClient,
  transaction,
  demoData
};
