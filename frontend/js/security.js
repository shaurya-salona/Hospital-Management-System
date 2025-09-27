/**
 * Frontend Security Utilities
 * Client-side security measures and validation
 */

class SecurityManager {
  constructor() {
    this.init();
  }

  init() {
    this.setupCSP();
    this.setupXSSProtection();
    this.setupCSRFProtection();
    this.setupInputValidation();
    this.setupSessionManagement();
  }

  // Content Security Policy
  setupCSP() {
    // Add CSP meta tag if not present
    if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
      const csp = document.createElement('meta');
      csp.setAttribute('http-equiv', 'Content-Security-Policy');
      csp.setAttribute('content', [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com",
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com",
        "img-src 'self' data: https:",
        "font-src 'self' https://cdnjs.cloudflare.com",
        "connect-src 'self' ws: wss:",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'"
      ].join('; '));
      document.head.appendChild(csp);
    }
  }

  // XSS Protection
  setupXSSProtection() {
    // Sanitize all user inputs
    const sanitizeInput = (input) => {
      if (typeof input !== 'string') return input;

      return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '')
        .replace(/<[^>]*>/g, '');
    };

    // Override innerHTML to sanitize content
    const originalInnerHTML = Object.getOwnPropertyDescriptor(Element.prototype, 'innerHTML');
    Object.defineProperty(Element.prototype, 'innerHTML', {
      set: function(value) {
        const sanitized = sanitizeInput(value);
        originalInnerHTML.set.call(this, sanitized);
      },
      get: originalInnerHTML.get
    });
  }

  // CSRF Protection
  setupCSRFProtection() {
    // Generate CSRF token
    this.csrfToken = this.generateCSRFToken();

    // Add CSRF token to all forms
    document.addEventListener('DOMContentLoaded', () => {
      const forms = document.querySelectorAll('form');
      forms.forEach(form => {
        if (!form.querySelector('input[name="_csrf"]')) {
          const csrfInput = document.createElement('input');
          csrfInput.type = 'hidden';
          csrfInput.name = '_csrf';
          csrfInput.value = this.csrfToken;
          form.appendChild(csrfInput);
        }
      });
    });

    // Add CSRF token to all AJAX requests
    const originalFetch = window.fetch;
    window.fetch = (url, options = {}) => {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': this.csrfToken
      };
      return originalFetch(url, options);
    };
  }

  // Input Validation
  setupInputValidation() {
    // Real-time input validation
    document.addEventListener('input', (e) => {
      if (e.target.matches('input, textarea, select')) {
        this.validateInput(e.target);
      }
    });

    // Form submission validation
    document.addEventListener('submit', (e) => {
      const form = e.target;
      if (!this.validateForm(form)) {
        e.preventDefault();
        return false;
      }
    });
  }

  // Session Management
  setupSessionManagement() {
    // Check session validity
    this.checkSession();

    // Auto-logout on inactivity
    this.setupInactivityLogout();

    // Secure session storage
    this.secureSessionStorage();
  }

  // Validation Methods
  validateInput(element) {
    const value = element.value;
    const type = element.type;
    const name = element.name;

    let isValid = true;
    let message = '';

    switch (type) {
      case 'email':
        isValid = this.validateEmail(value);
        message = 'Please enter a valid email address';
        break;
      case 'password':
        isValid = this.validatePassword(value);
        message = 'Password must be at least 8 characters with uppercase, lowercase, number, and special character';
        break;
      case 'tel':
        isValid = this.validatePhone(value);
        message = 'Please enter a valid phone number';
        break;
      default:
        if (name === 'username') {
          isValid = this.validateUsername(value);
          message = 'Username must be 3-50 characters and contain only letters, numbers, and underscores';
        }
    }

    this.showValidationFeedback(element, isValid, message);
    return isValid;
  }

  validateForm(form) {
    const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
    let isFormValid = true;

    inputs.forEach(input => {
      if (!this.validateInput(input)) {
        isFormValid = false;
      }
    });

    return isFormValid;
  }

  // Specific validation methods
  validateEmail(email) {
    const pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return pattern.test(email);
  }

  validatePassword(password) {
    if (password.length < 8) return false;
    const pattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;
    return pattern.test(password);
  }

  validatePhone(phone) {
    const pattern = /^\+?[\d\s\-\(\)]+$/;
    return pattern.test(phone);
  }

  validateUsername(username) {
    if (username.length < 3 || username.length > 50) return false;
    const pattern = /^[a-zA-Z0-9_]+$/;
    return pattern.test(username);
  }

  // Utility methods
  showValidationFeedback(element, isValid, message) {
    // Remove existing feedback
    const existingFeedback = element.parentNode.querySelector('.validation-feedback');
    if (existingFeedback) {
      existingFeedback.remove();
    }

    if (!isValid) {
      const feedback = document.createElement('div');
      feedback.className = 'validation-feedback text-danger';
      feedback.textContent = message;
      element.parentNode.appendChild(feedback);
      element.classList.add('is-invalid');
    } else {
      element.classList.remove('is-invalid');
      element.classList.add('is-valid');
    }
  }

  generateCSRFToken() {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  checkSession() {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const now = Math.floor(Date.now() / 1000);

        if (payload.exp < now) {
          this.logout();
        }
      } catch (e) {
        this.logout();
      }
    }
  }

  setupInactivityLogout() {
    let inactivityTimer;
    const timeout = 30 * 60 * 1000; // 30 minutes

    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(() => {
        this.logout();
      }, timeout);
    };

    // Reset timer on user activity
    ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimer, true);
    });

    resetTimer();
  }

  secureSessionStorage() {
    // Encrypt sensitive data in localStorage
    const encrypt = (text) => {
      // Simple encryption for demo purposes
      // In production, use a proper encryption library
      return btoa(text);
    };

    const decrypt = (encryptedText) => {
      try {
        return atob(encryptedText);
      } catch (e) {
        return null;
      }
    };

    // Override localStorage for sensitive data
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = (key, value) => {
      if (key.includes('token') || key.includes('password') || key.includes('secret')) {
        value = encrypt(value);
      }
      originalSetItem.call(localStorage, key, value);
    };

    const originalGetItem = localStorage.getItem;
    localStorage.getItem = (key) => {
      const value = originalGetItem.call(localStorage, key);
      if (key.includes('token') || key.includes('password') || key.includes('secret')) {
        return decrypt(value);
      }
      return value;
    };
  }

  logout() {
    // Clear all sensitive data
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    sessionStorage.clear();

    // Redirect to login page
    window.location.href = '/login.html';
  }

  // Security headers for API requests
  secureRequest(url, options = {}) {
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': this.csrfToken,
        'X-Requested-With': 'XMLHttpRequest'
      }
    };

    return fetch(url, { ...defaultOptions, ...options });
  }
}

// Initialize security manager
const securityManager = new SecurityManager();

// Export for use in other scripts
window.SecurityManager = SecurityManager;
window.securityManager = securityManager;
