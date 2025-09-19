# Security Policy

## Supported Versions

We release patches for security vulnerabilities in the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0   | :x:                |

## Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security vulnerability within HMIS, please follow these steps:

### 1. Do NOT create a public GitHub issue
Security vulnerabilities should be reported privately to prevent exploitation.

### 2. Email us directly
Send an email to: security@hmis-project.com

### 3. Include the following information:
- Description of the vulnerability
- Steps to reproduce the issue
- Potential impact
- Suggested fix (if any)
- Your contact information

### 4. Response timeline
- We will acknowledge receipt within 48 hours
- We will provide a detailed response within 7 days
- We will keep you updated on our progress

## Security Best Practices

### For Users
- Always use strong passwords
- Keep your system updated
- Use HTTPS in production
- Regularly backup your data
- Monitor access logs
- Use environment variables for sensitive configuration

### For Developers
- Never commit sensitive information (passwords, API keys, tokens)
- Use parameterized queries to prevent SQL injection
- Validate and sanitize all inputs
- Implement proper authentication and authorization
- Use HTTPS in production
- Keep dependencies updated
- Follow secure coding practices

## Security Features

HMIS includes the following security features:

### Authentication & Authorization
- JWT-based authentication
- Role-based access control
- Password hashing with bcrypt
- Session management

### Input Validation
- Request validation middleware
- SQL injection prevention
- XSS protection
- Input sanitization

### Network Security
- CORS configuration
- Rate limiting
- Security headers
- HTTPS support

### Data Protection
- Encrypted password storage
- Secure database connections
- Audit logging
- Data backup and recovery

## Security Updates

We regularly update HMIS to address security vulnerabilities:

- Monitor security advisories for dependencies
- Apply security patches promptly
- Update documentation with security best practices
- Conduct security reviews

## Responsible Disclosure

We follow responsible disclosure practices:

1. **Report privately** - Don't disclose publicly until we've had a chance to fix it
2. **Give us time** - We need time to investigate and fix the issue
3. **Work together** - We'll work with you to understand and resolve the issue
4. **Credit where due** - We'll credit you in our security advisories (if you want)

## Security Contact

For security-related questions or to report vulnerabilities:

- Email: security@hmis-project.com
- Response time: Within 48 hours
- PGP Key: Available upon request

## Security Changelog

### Version 1.0.0
- Initial security implementation
- JWT authentication
- Role-based access control
- Input validation
- SQL injection prevention
- XSS protection
- Rate limiting
- CORS configuration
- Security headers
- Audit logging

---

Thank you for helping keep HMIS and its users safe!
