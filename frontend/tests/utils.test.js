/**
 * Unit Tests for Utils Module
 * Tests utility functions for correctness and edge cases
 */

// Mock DOM environment for testing
if (typeof document === 'undefined') {
    global.document = {
        createElement: () => ({
            textContent: '',
            innerHTML: ''
        })
    };
}

// Simple test framework
class TestFramework {
    constructor() {
        this.tests = [];
        this.passed = 0;
        this.failed = 0;
    }

    test(name, fn) {
        this.tests.push({ name, fn });
    }

    assert(condition, message) {
        if (!condition) {
            throw new Error(message || 'Assertion failed');
        }
    }

    assertEqual(actual, expected, message) {
        if (actual !== expected) {
            throw new Error(message || `Expected ${expected}, but got ${actual}`);
        }
    }

    assertTrue(condition, message) {
        if (!condition) {
            throw new Error(message || 'Expected true, but got false');
        }
    }

    assertFalse(condition, message) {
        if (condition) {
            throw new Error(message || 'Expected false, but got true');
        }
    }

    async run() {
        console.log('Running Utils Tests...\n');

        for (const test of this.tests) {
            try {
                await test.fn();
                console.log(`✅ ${test.name}`);
                this.passed++;
            } catch (error) {
                console.log(`❌ ${test.name}: ${error.message}`);
                this.failed++;
            }
        }

        console.log(`\nTest Results: ${this.passed} passed, ${this.failed} failed`);
        return this.failed === 0;
    }
}

// Load Utils module (assuming it's available)
if (typeof Utils === 'undefined') {
    // If running in Node.js, load the module
    if (typeof require !== 'undefined') {
        require('../modules/utils.js');
    }
}

const test = new TestFramework();

// Date formatting tests
test.test('formatDate should format valid date correctly', () => {
    const date = '2024-01-15';
    const formatted = Utils.formatDate(date);
    test.assertTrue(formatted.includes('Jan'), 'Should contain month abbreviation');
    test.assertTrue(formatted.includes('15'), 'Should contain day');
    test.assertTrue(formatted.includes('2024'), 'Should contain year');
});

test.test('formatDate should return empty string for invalid date', () => {
    test.assertEqual(Utils.formatDate(null), '', 'Should return empty string for null');
    test.assertEqual(Utils.formatDate(undefined), '', 'Should return empty string for undefined');
    test.assertEqual(Utils.formatDate(''), '', 'Should return empty string for empty string');
});

test.test('formatDate should handle invalid date gracefully', () => {
    const result = Utils.formatDate('invalid-date');
    test.assertTrue(typeof result === 'string', 'Should return string even for invalid date');
});

// Time formatting tests
test.test('formatTime should format valid time correctly', () => {
    const time = '14:30';
    const formatted = Utils.formatTime(time);
    test.assertTrue(formatted.includes('2:30'), 'Should format 24-hour to 12-hour');
    test.assertTrue(formatted.includes('PM'), 'Should include AM/PM indicator');
});

test.test('formatTime should return empty string for invalid time', () => {
    test.assertEqual(Utils.formatTime(null), '', 'Should return empty string for null');
    test.assertEqual(Utils.formatTime(undefined), '', 'Should return empty string for undefined');
});

// Currency formatting tests
test.test('formatCurrency should format numbers correctly', () => {
    test.assertEqual(Utils.formatCurrency(1234.56), '$1,234.56', 'Should format positive number');
    test.assertEqual(Utils.formatCurrency(0), '$0.00', 'Should format zero');
    test.assertEqual(Utils.formatCurrency(-100), '-$100.00', 'Should format negative number');
});

test.test('formatCurrency should handle null and undefined', () => {
    test.assertEqual(Utils.formatCurrency(null), '$0.00', 'Should handle null');
    test.assertEqual(Utils.formatCurrency(undefined), '$0.00', 'Should handle undefined');
});

// ID generation tests
test.test('generateId should generate unique IDs', () => {
    const id1 = Utils.generateId();
    const id2 = Utils.generateId();

    test.assertTrue(typeof id1 === 'string', 'Should return string');
    test.assertTrue(id1.length > 0, 'Should not be empty');
    test.assertTrue(id1 !== id2, 'Should generate unique IDs');
});

// Email validation tests
test.test('isValidEmail should validate correct emails', () => {
    test.assertTrue(Utils.isValidEmail('test@example.com'), 'Should validate correct email');
    test.assertTrue(Utils.isValidEmail('user.name@domain.co.uk'), 'Should validate complex email');
    test.assertTrue(Utils.isValidEmail('test+tag@example.org'), 'Should validate email with plus');
});

test.test('isValidEmail should reject invalid emails', () => {
    test.assertFalse(Utils.isValidEmail('invalid-email'), 'Should reject invalid email');
    test.assertFalse(Utils.isValidEmail('test@'), 'Should reject incomplete email');
    test.assertFalse(Utils.isValidEmail('@example.com'), 'Should reject email without local part');
    test.assertFalse(Utils.isValidEmail(''), 'Should reject empty string');
    test.assertFalse(Utils.isValidEmail(null), 'Should reject null');
});

// Phone validation tests
test.test('isValidPhone should validate correct phone numbers', () => {
    test.assertTrue(Utils.isValidPhone('1234567890'), 'Should validate 10-digit number');
    test.assertTrue(Utils.isValidPhone('+1234567890'), 'Should validate with country code');
    test.assertTrue(Utils.isValidPhone('(123) 456-7890'), 'Should validate with formatting');
});

test.test('isValidPhone should reject invalid phone numbers', () => {
    test.assertFalse(Utils.isValidPhone('123'), 'Should reject too short number');
    test.assertFalse(Utils.isValidPhone('abc123'), 'Should reject non-numeric');
    test.assertFalse(Utils.isValidPhone(''), 'Should reject empty string');
    test.assertFalse(Utils.isValidPhone(null), 'Should reject null');
});

// HTML sanitization tests
test.test('sanitizeHtml should escape HTML characters', () => {
    const malicious = '<script>alert("xss")</script>';
    const sanitized = Utils.sanitizeHtml(malicious);
    test.assertFalse(sanitized.includes('<script>'), 'Should remove script tags');
    test.assertTrue(sanitized.includes('&lt;'), 'Should escape HTML characters');
});

test.test('sanitizeHtml should handle normal text', () => {
    const text = 'Hello World';
    const sanitized = Utils.sanitizeHtml(text);
    test.assertEqual(sanitized, 'Hello World', 'Should not modify normal text');
});

// File size formatting tests
test.test('formatFileSize should format bytes correctly', () => {
    test.assertEqual(Utils.formatFileSize(0), '0 Bytes', 'Should format zero bytes');
    test.assertEqual(Utils.formatFileSize(1024), '1 KB', 'Should format kilobytes');
    test.assertEqual(Utils.formatFileSize(1048576), '1 MB', 'Should format megabytes');
    test.assertEqual(Utils.formatFileSize(1073741824), '1 GB', 'Should format gigabytes');
});

test.test('formatFileSize should handle decimal places', () => {
    const result = Utils.formatFileSize(1536); // 1.5 KB
    test.assertTrue(result.includes('1.5'), 'Should show decimal places');
    test.assertTrue(result.includes('KB'), 'Should include unit');
});

// Permission tests
test.test('hasPermission should check role hierarchy correctly', () => {
    test.assertTrue(Utils.hasPermission('admin', 'doctor'), 'Admin should have doctor permissions');
    test.assertTrue(Utils.hasPermission('doctor', 'nurse'), 'Doctor should have nurse permissions');
    test.assertFalse(Utils.hasPermission('nurse', 'doctor'), 'Nurse should not have doctor permissions');
    test.assertFalse(Utils.hasPermission('patient', 'admin'), 'Patient should not have admin permissions');
});

test.test('hasPermission should handle same role', () => {
    test.assertTrue(Utils.hasPermission('doctor', 'doctor'), 'Same role should have permission');
    test.assertTrue(Utils.hasPermission('admin', 'admin'), 'Same role should have permission');
});

// Status color tests
test.test('getStatusColor should return correct colors', () => {
    test.assertEqual(Utils.getStatusColor('active'), '#10b981', 'Should return green for active');
    test.assertEqual(Utils.getStatusColor('error'), '#ef4444', 'Should return red for error');
    test.assertEqual(Utils.getStatusColor('pending'), '#f59e0b', 'Should return yellow for pending');
});

test.test('getStatusColor should return default for unknown status', () => {
    test.assertEqual(Utils.getStatusColor('unknown'), '#6b7280', 'Should return default color');
    test.assertEqual(Utils.getStatusColor(null), '#6b7280', 'Should return default for null');
});

// Priority color tests
test.test('getPriorityColor should return correct colors', () => {
    test.assertEqual(Utils.getPriorityColor('low'), '#10b981', 'Should return green for low');
    test.assertEqual(Utils.getPriorityColor('high'), '#ef4444', 'Should return red for high');
    test.assertEqual(Utils.getPriorityColor('critical'), '#991b1b', 'Should return dark red for critical');
});

// Debounce tests
test.test('debounce should delay function execution', async () => {
    let callCount = 0;
    const debouncedFn = Utils.debounce(() => {
        callCount++;
    }, 100);

    // Call multiple times quickly
    debouncedFn();
    debouncedFn();
    debouncedFn();

    // Should not have been called yet
    test.assertEqual(callCount, 0, 'Function should not be called immediately');

    // Wait for debounce delay
    await new Promise(resolve => setTimeout(resolve, 150));

    // Should have been called only once
    test.assertEqual(callCount, 1, 'Function should be called only once after delay');
});

// Run tests
if (typeof window === 'undefined') {
    // Running in Node.js
    test.run().then(success => {
        process.exit(success ? 0 : 1);
    });
} else {
    // Running in browser
    window.runUtilsTests = () => test.run();
}
