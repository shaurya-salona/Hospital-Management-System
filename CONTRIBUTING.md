# Contributing to HMIS

Thank you for your interest in contributing to the Hospital Management Information System (HMIS)! This document provides guidelines and information for contributors.

## 🤝 How to Contribute

### 1. Fork the Repository
- Click the "Fork" button on the GitHub repository page
- Clone your forked repository to your local machine

### 2. Create a Feature Branch
```bash
git checkout -b feature/your-feature-name
```

### 3. Make Your Changes
- Write clean, readable code
- Follow the existing code style
- Add comments for complex logic
- Update documentation if needed

### 4. Test Your Changes
```bash
# Backend tests
cd backend
npm test

# Frontend testing
# Test manually in different browsers
```

### 5. Commit Your Changes
```bash
git add .
git commit -m "Add: Brief description of your changes"
```

### 6. Push to Your Fork
```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request
- Go to the original repository on GitHub
- Click "New Pull Request"
- Select your feature branch
- Provide a detailed description of your changes

## 📋 Code Style Guidelines

### JavaScript/Node.js
- Use ES6+ features
- Follow camelCase for variables and functions
- Use PascalCase for classes
- Use meaningful variable names
- Add JSDoc comments for functions

### HTML/CSS
- Use semantic HTML
- Follow BEM methodology for CSS
- Use consistent indentation (2 spaces)
- Validate HTML and CSS

### Database
- Use descriptive table and column names
- Follow snake_case for database identifiers
- Add proper indexes
- Include foreign key constraints

## 🧪 Testing Guidelines

### Backend Testing
- Write unit tests for new functions
- Test API endpoints
- Test database operations
- Test authentication and authorization

### Frontend Testing
- Test in multiple browsers
- Test responsive design
- Test user interactions
- Test form validations

## 📝 Documentation

### Code Documentation
- Add JSDoc comments for functions
- Document complex algorithms
- Explain business logic
- Update README if needed

### API Documentation
- Update Swagger annotations
- Document new endpoints
- Provide example requests/responses
- Document error codes

## 🐛 Bug Reports

When reporting bugs, please include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Screenshots if applicable
- Browser/OS information
- Error messages

## ✨ Feature Requests

When requesting features, please include:
- Clear description of the feature
- Use case and benefits
- Mockups or examples if applicable
- Priority level

## 🔒 Security

- Never commit sensitive information (passwords, API keys)
- Report security vulnerabilities privately
- Follow secure coding practices
- Validate all inputs

## 📋 Pull Request Guidelines

### Before Submitting
- [ ] Code follows style guidelines
- [ ] Tests pass
- [ ] Documentation updated
- [ ] No sensitive information included
- [ ] Commit messages are clear

### PR Description Template
```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots here

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No breaking changes
```

## 🏷️ Issue Labels

- `bug`: Something isn't working
- `enhancement`: New feature or request
- `documentation`: Improvements to documentation
- `good first issue`: Good for newcomers
- `help wanted`: Extra attention is needed
- `question`: Further information is requested

## 📞 Getting Help

- Check existing issues and discussions
- Join our community discussions
- Contact maintainers for urgent issues

## 🎉 Recognition

Contributors will be recognized in:
- README.md contributors section
- Release notes
- Project documentation

Thank you for contributing to HMIS! 🏥
