-- HMIS Database Optimization Script
-- Performance improvements, indexes, and production-ready configurations

-- ==============================================
-- PERFORMANCE INDEXES
-- ==============================================

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- Staff table indexes
CREATE INDEX IF NOT EXISTS idx_staff_user_id ON staff(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_employee_id ON staff(employee_id);
CREATE INDEX IF NOT EXISTS idx_staff_department ON staff(department);
CREATE INDEX IF NOT EXISTS idx_staff_specialization ON staff(specialization);

-- Patients table indexes
CREATE INDEX IF NOT EXISTS idx_patients_user_id ON patients(user_id);
CREATE INDEX IF NOT EXISTS idx_patients_patient_id ON patients(patient_id);
CREATE INDEX IF NOT EXISTS idx_patients_date_of_birth ON patients(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_patients_gender ON patients(gender);
CREATE INDEX IF NOT EXISTS idx_patients_created_at ON patients(created_at);

-- Appointments table indexes
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON appointments(appointment_date, appointment_time);
CREATE INDEX IF NOT EXISTS idx_appointments_created_at ON appointments(created_at);

-- Medical records table indexes
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_id ON medical_records(patient_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_doctor_id ON medical_records(doctor_id);
CREATE INDEX IF NOT EXISTS idx_medical_records_visit_date ON medical_records(visit_date);
CREATE INDEX IF NOT EXISTS idx_medical_records_created_at ON medical_records(created_at);

-- Billing table indexes
CREATE INDEX IF NOT EXISTS idx_billing_patient_id ON billing(patient_id);
CREATE INDEX IF NOT EXISTS idx_billing_status ON billing(status);
CREATE INDEX IF NOT EXISTS idx_billing_bill_type ON billing(bill_type);
CREATE INDEX IF NOT EXISTS idx_billing_due_date ON billing(due_date);
CREATE INDEX IF NOT EXISTS idx_billing_created_at ON billing(created_at);

-- Payments table indexes
CREATE INDEX IF NOT EXISTS idx_payments_bill_id ON payments(bill_id);
CREATE INDEX IF NOT EXISTS idx_payments_payment_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_payment_method ON payments(payment_method);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);

-- Inventory table indexes
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category);
CREATE INDEX IF NOT EXISTS idx_inventory_quantity ON inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_inventory_minimum_stock ON inventory(minimum_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_expiry_date ON inventory(expiry_date);
CREATE INDEX IF NOT EXISTS idx_inventory_supplier ON inventory(supplier);

-- Stock movements table indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_inventory_id ON stock_movements(inventory_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_operation ON stock_movements(operation);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_at ON stock_movements(created_at);
CREATE INDEX IF NOT EXISTS idx_stock_movements_created_by ON stock_movements(created_by);

-- Prescriptions table indexes
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_doctor_id ON prescriptions(doctor_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_created_at ON prescriptions(created_at);

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Audit logs table indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);

-- ==============================================
-- COMPOSITE INDEXES FOR COMMON QUERIES
-- ==============================================

-- User role and active status
CREATE INDEX IF NOT EXISTS idx_users_role_active ON users(role, is_active);

-- Patient appointments by date and status
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date_status ON appointments(patient_id, appointment_date, status);

-- Doctor appointments by date and status
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date_status ON appointments(doctor_id, appointment_date, status);

-- Medical records by patient and visit date
CREATE INDEX IF NOT EXISTS idx_medical_records_patient_visit ON medical_records(patient_id, visit_date);

-- Billing by patient and status
CREATE INDEX IF NOT EXISTS idx_billing_patient_status ON billing(patient_id, status);

-- Inventory low stock alerts
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock ON inventory(category, quantity, minimum_stock);

-- ==============================================
-- PARTIAL INDEXES FOR SPECIFIC CONDITIONS
-- ==============================================

-- Active users only
CREATE INDEX IF NOT EXISTS idx_users_active_only ON users(email) WHERE is_active = true;

-- Pending appointments only
CREATE INDEX IF NOT EXISTS idx_appointments_pending ON appointments(appointment_date, appointment_time)
WHERE status IN ('scheduled', 'confirmed');

-- Unpaid bills only
CREATE INDEX IF NOT EXISTS idx_billing_unpaid ON billing(due_date, amount)
WHERE status IN ('pending', 'overdue');

-- Low stock items only
CREATE INDEX IF NOT EXISTS idx_inventory_low_stock_only ON inventory(name, category)
WHERE quantity <= minimum_stock;

-- Unread notifications only
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, created_at)
WHERE is_read = false;

-- ==============================================
-- DATABASE CONFIGURATION OPTIMIZATIONS
-- ==============================================

-- Update table statistics for better query planning
ANALYZE users;
ANALYZE staff;
ANALYZE patients;
ANALYZE appointments;
ANALYZE medical_records;
ANALYZE billing;
ANALYZE payments;
ANALYZE inventory;
ANALYZE stock_movements;
ANALYZE prescriptions;
ANALYZE notifications;
ANALYZE audit_logs;

-- ==============================================
-- VIEWS FOR COMMON QUERIES
-- ==============================================

-- Active staff with user details
CREATE OR REPLACE VIEW active_staff AS
SELECT
    s.id,
    s.employee_id,
    s.department,
    s.specialization,
    s.hire_date,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    u.role
FROM staff s
JOIN users u ON s.user_id = u.id
WHERE u.is_active = true;

-- Patient summary with latest visit
CREATE OR REPLACE VIEW patient_summary AS
SELECT
    p.id,
    p.patient_id,
    p.date_of_birth,
    p.gender,
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    p.created_at,
    (SELECT MAX(visit_date) FROM medical_records WHERE patient_id = p.id) as last_visit,
    (SELECT COUNT(*) FROM appointments WHERE patient_id = p.id AND status = 'scheduled') as pending_appointments
FROM patients p
JOIN users u ON p.user_id = u.id
WHERE u.is_active = true;

-- Appointment details with patient and doctor info
CREATE OR REPLACE VIEW appointment_details AS
SELECT
    a.id,
    a.appointment_date,
    a.appointment_time,
    a.status,
    a.reason,
    p.patient_id,
    CONCAT(pu.first_name, ' ', pu.last_name) as patient_name,
    s.employee_id,
    CONCAT(su.first_name, ' ', su.last_name) as doctor_name,
    s.specialization
FROM appointments a
JOIN patients p ON a.patient_id = p.id
JOIN users pu ON p.user_id = pu.id
JOIN staff s ON a.doctor_id = s.id
JOIN users su ON s.user_id = su.id;

-- Financial summary by patient
CREATE OR REPLACE VIEW patient_financial_summary AS
SELECT
    p.id as patient_id,
    p.patient_id as patient_number,
    CONCAT(u.first_name, ' ', u.last_name) as patient_name,
    COALESCE(SUM(b.amount), 0) as total_billed,
    COALESCE(SUM(CASE WHEN b.status = 'paid' THEN b.amount ELSE 0 END), 0) as total_paid,
    COALESCE(SUM(CASE WHEN b.status IN ('pending', 'overdue') THEN b.amount ELSE 0 END), 0) as outstanding_amount,
    COUNT(b.id) as total_bills
FROM patients p
JOIN users u ON p.user_id = u.id
LEFT JOIN billing b ON p.id = b.patient_id
GROUP BY p.id, p.patient_id, u.first_name, u.last_name;

-- Inventory alerts
CREATE OR REPLACE VIEW inventory_alerts AS
SELECT
    id,
    name,
    category,
    quantity,
    minimum_stock,
    (quantity - minimum_stock) as stock_difference,
    CASE
        WHEN quantity = 0 THEN 'out_of_stock'
        WHEN quantity <= minimum_stock THEN 'low_stock'
        ELSE 'normal'
    END as alert_level,
    expiry_date,
    CASE
        WHEN expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days' THEN true
        ELSE false
    END as expiring_soon
FROM inventory
WHERE quantity <= minimum_stock OR (expiry_date IS NOT NULL AND expiry_date <= CURRENT_DATE + INTERVAL '30 days');

-- ==============================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- ==============================================

-- Function to get patient age
CREATE OR REPLACE FUNCTION get_patient_age(birth_date DATE)
RETURNS INTEGER AS $$
BEGIN
    RETURN EXTRACT(YEAR FROM AGE(birth_date));
END;
$$ LANGUAGE plpgsql;

-- Function to check if appointment time is available
CREATE OR REPLACE FUNCTION is_appointment_available(
    doctor_id_param UUID,
    appointment_date_param DATE,
    appointment_time_param TIME
)
RETURNS BOOLEAN AS $$
DECLARE
    conflict_count INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO conflict_count
    FROM appointments
    WHERE doctor_id = doctor_id_param
    AND appointment_date = appointment_date_param
    AND appointment_time = appointment_time_param
    AND status NOT IN ('cancelled', 'completed');

    RETURN conflict_count = 0;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate bill total with payments
CREATE OR REPLACE FUNCTION get_bill_balance(bill_id_param UUID)
RETURNS DECIMAL AS $$
DECLARE
    bill_amount DECIMAL;
    total_paid DECIMAL;
BEGIN
    SELECT amount INTO bill_amount FROM billing WHERE id = bill_id_param;
    SELECT COALESCE(SUM(amount), 0) INTO total_paid FROM payments WHERE bill_id = bill_id_param;

    RETURN bill_amount - total_paid;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_medical_records_updated_at BEFORE UPDATE ON medical_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_billing_updated_at BEFORE UPDATE ON billing
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ==============================================
-- SECURITY AND PERFORMANCE SETTINGS
-- ==============================================

-- Set connection limits and timeouts
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_buffers = '256MB';
ALTER SYSTEM SET effective_cache_size = '1GB';
ALTER SYSTEM SET maintenance_work_mem = '64MB';
ALTER SYSTEM SET checkpoint_completion_target = 0.9;
ALTER SYSTEM SET wal_buffers = '16MB';
ALTER SYSTEM SET default_statistics_target = 100;

-- Enable query logging for slow queries (uncomment for debugging)
-- ALTER SYSTEM SET log_min_duration_statement = 1000;
-- ALTER SYSTEM SET log_statement = 'mod';

-- ==============================================
-- CLEANUP AND MAINTENANCE
-- ==============================================

-- Create a function to clean up old audit logs
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audit_logs
    WHERE created_at < CURRENT_DATE - INTERVAL '1 year';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a function to clean up old notifications
CREATE OR REPLACE FUNCTION cleanup_old_notifications()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM notifications
    WHERE is_read = true AND created_at < CURRENT_DATE - INTERVAL '30 days';

    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ==============================================
-- GRANT PERMISSIONS
-- ==============================================

-- Grant necessary permissions to application user
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO hmis_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO hmis_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO hmis_user;

COMMIT;
