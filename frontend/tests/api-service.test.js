/**
 * Unit Tests for API Service Module
 * Tests API communication and error handling
 */

// Mock fetch for testing
const mockFetch = (response, ok = true, status = 200) => {
    return jest.fn().mockResolvedValue({
        ok,
        status,
        json: () => Promise.resolve(response)
    });
};

// Mock localStorage
const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn()
};

// Mock window.location
const mockLocation = {
    href: ''
};

// Setup mocks
global.fetch = mockFetch;
global.localStorage = mockLocalStorage;
global.window = { location: mockLocation };

// Simple test framework for API tests
class APITestFramework {
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

    async run() {
        console.log('Running API Service Tests...\n');

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

// Load APIService (assuming it's available)
if (typeof APIService === 'undefined') {
    // If running in Node.js, load the module
    if (typeof require !== 'undefined') {
        require('../api-service.js');
    }
}

const test = new APITestFramework();

// Test APIService initialization
test.test('APIService should initialize with correct base URL', () => {
    const api = new APIService();
    test.assertEqual(api.baseURL, 'http://localhost:5000/api', 'Should have correct base URL');
});

test.test('APIService should load token from localStorage on init', () => {
    mockLocalStorage.getItem.mockReturnValue('test-token');
    const api = new APIService();
    test.assertEqual(api.token, 'test-token', 'Should load token from localStorage');
});

// Test token management
test.test('setToken should store token in localStorage', () => {
    const api = new APIService();
    api.setToken('new-token');

    test.assertEqual(api.token, 'new-token', 'Should set token in instance');
    test.assertEqual(mockLocalStorage.setItem.mock.calls.length, 1, 'Should call localStorage.setItem');
    test.assertEqual(mockLocalStorage.setItem.mock.calls[0][0], 'token', 'Should store with correct key');
    test.assertEqual(mockLocalStorage.setItem.mock.calls[0][1], 'new-token', 'Should store correct value');
});

test.test('clearToken should remove token from localStorage', () => {
    const api = new APIService();
    api.clearToken();

    test.assertEqual(api.token, null, 'Should clear token from instance');
    test.assertEqual(mockLocalStorage.removeItem.mock.calls.length, 2, 'Should call removeItem twice');
    test.assertEqual(mockLocalStorage.removeItem.mock.calls[0][0], 'token', 'Should remove token');
    test.assertEqual(mockLocalStorage.removeItem.mock.calls[1][0], 'userData', 'Should remove userData');
});

// Test API request method
test.test('request should make successful API call', async () => {
    const mockResponse = { success: true, data: { id: 1, name: 'Test' } };
    global.fetch = mockFetch(mockResponse);

    const api = new APIService();
    const result = await api.request('/test');

    test.assertEqual(result.success, true, 'Should return successful response');
    test.assertEqual(result.data.id, 1, 'Should return correct data');
});

test.test('request should include Authorization header when token exists', async () => {
    const mockResponse = { success: true };
    global.fetch = mockFetch(mockResponse);

    const api = new APIService();
    api.setToken('test-token');

    await api.request('/test');

    const fetchCall = global.fetch.mock.calls[0];
    const options = fetchCall[1];
    test.assertEqual(options.headers.Authorization, 'Bearer test-token', 'Should include Authorization header');
});

test.test('request should handle 401 errors by redirecting to login', async () => {
    const mockResponse = { message: 'Unauthorized' };
    global.fetch = mockFetch(mockResponse, false, 401);

    const api = new APIService();

    try {
        await api.request('/test');
        test.assert(false, 'Should throw error for 401');
    } catch (error) {
        test.assertEqual(error.message, 'Authentication required', 'Should throw authentication error');
        test.assertEqual(mockLocation.href, '/login.html', 'Should redirect to login');
    }
});

test.test('request should handle other HTTP errors', async () => {
    const mockResponse = { message: 'Server Error' };
    global.fetch = mockFetch(mockResponse, false, 500);

    const api = new APIService();

    try {
        await api.request('/test');
        test.assert(false, 'Should throw error for 500');
    } catch (error) {
        test.assertEqual(error.message, 'Server Error', 'Should throw server error message');
    }
});

// Test login method
test.test('login should make POST request with credentials', async () => {
    const mockResponse = {
        success: true,
        data: {
            token: 'auth-token',
            user: { id: 1, username: 'test' }
        }
    };
    global.fetch = mockFetch(mockResponse);

    const api = new APIService();
    const result = await api.login('testuser', 'testpass');

    test.assertEqual(result.success, true, 'Should return successful login');
    test.assertEqual(api.token, 'auth-token', 'Should set token after login');

    const fetchCall = global.fetch.mock.calls[0];
    test.assertEqual(fetchCall[0], 'http://localhost:5000/api/auth/login', 'Should call correct endpoint');
    test.assertEqual(fetchCall[1].method, 'POST', 'Should use POST method');

    const body = JSON.parse(fetchCall[1].body);
    test.assertEqual(body.username, 'testuser', 'Should include username');
    test.assertEqual(body.password, 'testpass', 'Should include password');
});

test.test('login should store user data in localStorage', async () => {
    const mockResponse = {
        success: true,
        data: {
            token: 'auth-token',
            user: { id: 1, username: 'test' }
        }
    };
    global.fetch = mockFetch(mockResponse);

    const api = new APIService();
    await api.login('testuser', 'testpass');

    const setItemCalls = mockLocalStorage.setItem.mock.calls;
    test.assertEqual(setItemCalls.length, 2, 'Should call setItem twice');
    test.assertEqual(setItemCalls[0][0], 'token', 'Should store token');
    test.assertEqual(setItemCalls[1][0], 'userData', 'Should store userData');
});

// Test logout method
test.test('logout should clear token even if API call fails', async () => {
    global.fetch = mockFetch({}, false, 500);

    const api = new APIService();
    api.setToken('test-token');

    await api.logout();

    test.assertEqual(api.token, null, 'Should clear token even on API failure');
    test.assertEqual(mockLocalStorage.removeItem.mock.calls.length, 2, 'Should remove from localStorage');
});

// Test getProfile method
test.test('getProfile should make GET request to profile endpoint', async () => {
    const mockResponse = { success: true, data: { id: 1, username: 'test' } };
    global.fetch = mockFetch(mockResponse);

    const api = new APIService();
    const result = await api.getProfile();

    test.assertEqual(result.success, true, 'Should return successful profile');

    const fetchCall = global.fetch.mock.calls[0];
    test.assertEqual(fetchCall[0], 'http://localhost:5000/api/auth/profile', 'Should call correct endpoint');
    test.assertEqual(fetchCall[1].method, 'GET', 'Should use GET method');
});

// Test getPatients method
test.test('getPatients should include pagination parameters', async () => {
    const mockResponse = { success: true, data: [] };
    global.fetch = mockFetch(mockResponse);

    const api = new APIService();
    await api.getPatients(2, 20, { search: 'test' });

    const fetchCall = global.fetch.mock.calls[0];
    const url = fetchCall[0];

    test.assertTrue(url.includes('page=2'), 'Should include page parameter');
    test.assertTrue(url.includes('limit=20'), 'Should include limit parameter');
    test.assertTrue(url.includes('search=test'), 'Should include search parameter');
});

// Test error handling
test.test('should handle network errors gracefully', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

    const api = new APIService();

    try {
        await api.request('/test');
        test.assert(false, 'Should throw error for network failure');
    } catch (error) {
        test.assertEqual(error.message, 'Network error', 'Should throw network error');
    }
});

test.test('should handle JSON parsing errors', async () => {
    global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: () => Promise.reject(new Error('Invalid JSON'))
    });

    const api = new APIService();

    try {
        await api.request('/test');
        test.assert(false, 'Should throw error for JSON parsing failure');
    } catch (error) {
        test.assertEqual(error.message, 'Invalid JSON', 'Should throw JSON parsing error');
    }
});

// Run tests
if (typeof window === 'undefined') {
    // Running in Node.js
    test.run().then(success => {
        process.exit(success ? 0 : 1);
    });
} else {
    // Running in browser
    window.runAPITests = () => test.run();
}
