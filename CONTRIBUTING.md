# Contributing to Mini Solana Validator

Thank you for your interest in contributing to the Mini Solana Validator! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js 16.0.0 or higher
- npm or yarn
- Basic understanding of Solana blockchain concepts
- Familiarity with JavaScript/TypeScript

### Development Setup

1. **Fork the Repository**
   ```bash
   # Fork the repository on GitHub, then clone your fork
   git clone https://github.com/your-username/solana-mini-validator.git
   cd solana-mini-validator
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm start
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## 📋 How to Contribute

### Reporting Issues

- **Bug Reports**: Use the GitHub issue tracker with detailed information
  - Include steps to reproduce
  - Provide error messages and logs
  - Specify your environment (OS, Node.js version)

- **Feature Requests**: Open an issue with the "enhancement" label
  - Describe the feature clearly
  - Explain the use case and benefits

### Code Contributions

1. **Create a Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**
   - Follow the existing code style
   - Add comments for complex logic
   - Ensure all tests pass

3. **Test Your Changes**
   ```bash
   npm test
   ```

4. **Commit Changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Use a descriptive title
   - Reference any related issues
   - Include screenshots if applicable

## 🏗️ Project Structure

Understanding the project structure will help you contribute effectively:

```
src/
├── server.js              # Express server entry point
├── rpcRouter.js           # JSON-RPC method routing
├── ledger/               # In-memory state management
│   ├── ledger.js          # Account storage
│   ├── blockhash.js       # Blockhash management
│   ├── signatures.js      # Transaction tracking
│   └── validation.js      # Account validation
├── transaction/           # Transaction processing
│   └── processor.js      # Transaction execution
└── programs/             # Solana programs
    ├── systemProgram.js   # System Program
    ├── tokenProgram.js    # SPL Token Program
    └── ataProgram.js     # ATA Program
```

## 📝 Code Style Guidelines

### JavaScript Standards
- Use ES6+ features
- Follow existing naming conventions
- Add JSDoc comments for functions
- Use meaningful variable and function names

### Example
```javascript
/**
 * Validates account existence and throws error if not found
 * @param {string} pubkey - Account public key
 * @throws {Error} If account doesn't exist
 */
function validateAccountExists(pubkey) {
    const account = getAccount(pubkey);
    if (!account) {
        throw new Error(`Account not found: ${pubkey}`);
    }
    return account;
}
```

## 🧪 Testing

### Running Tests
```bash
npm test
```

### Writing Tests
- Test both success and failure cases
- Use descriptive test names
- Mock external dependencies when appropriate
- Ensure tests are deterministic

### Test Structure
```javascript
// test/your-test.test.js
describe('Feature Name', () => {
    it('should handle valid input correctly', async () => {
        // Test implementation
    });
    
    it('should throw error for invalid input', async () => {
        // Error case test
    });
});
```

## 🔄 Development Workflow

### Before Submitting
1. **Code Review**: Self-review your changes
2. **Test Coverage**: Ensure new code is tested
3. **Documentation**: Update relevant documentation
4. **Compatibility**: Test with `@solana/web3.js`

### Pull Request Process
1. **Create PR**: From your feature branch to main
2. **Title**: Use conventional commit format
   - `feat:` for new features
   - `fix:` for bug fixes
   - `docs:` for documentation
   - `refactor:` for code improvements

3. **Description**: Explain what and why
4. **Screenshots**: Include for UI changes
5. **Testing**: Mention how you tested

## 🐛 Bug Reports

When reporting bugs, please include:

### Required Information
- **Node.js version**: `node --version`
- **npm version**: `npm --version`
- **Operating System**: Windows/macOS/Linux
- **Solana web3.js version**: Check package.json

### Bug Report Template
```markdown
## Bug Description
Brief description of the bug

## Steps to Reproduce
1. Step one
2. Step two
3. Step three

## Expected Behavior
What should happen

## Actual Behavior
What actually happens

## Error Messages
Include any error messages or stack traces

## Additional Context
Any other relevant information
```

## 💡 Feature Requests

When requesting features:

### Feature Request Template
```markdown
## Feature Description
Clear description of the feature

## Problem Statement
What problem does this solve?

## Proposed Solution
How should the feature work?

## Alternatives Considered
Other approaches you thought of

## Additional Context
Links to relevant documentation or examples
```

## 📚 Resources

### Solana Documentation
- [Solana Documentation](https://docs.solana.com/)
- [Solana JSON-RPC API](https://docs.solana.com/developing/clients/jsonrpc-api/)
- [Solana Program Library](https://spl.solana.com/)

### Development Tools
- [Node.js Best Practices](https://nodejs.org/en/docs/guides/)
- [Express.js Documentation](https://expressjs.com/)
- [JSDoc Documentation](https://jsdoc.app/)

## 🤝 Community

### Getting Help
- **GitHub Issues**: For bug reports and feature requests
- **GitHub Discussions**: For general questions and ideas
- **Code Reviews**: Participate in reviewing PRs

### Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](https://www.contributor-covenant.org/). Please read and follow these guidelines in all interactions.

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License, the same license as the project.

## 🙏 Acknowledgments

Thank you for contributing to the Mini Solana Validator! Your contributions help make Solana development more accessible and educational for everyone.

---

For questions not covered here, please open an issue or start a discussion on GitHub.
