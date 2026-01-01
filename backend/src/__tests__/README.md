# Backend Unit Tests

This directory contains unit tests for the African E-commerce backend services.

## Test Structure

```
backend/src/
├── utils/__tests__/
│   ├── password.test.ts    # Password utility tests
│   └── jwt.test.ts         # JWT utility tests
├── services/__tests__/
│   └── (service tests)
└── controllers/__tests__/
    └── (controller tests)
```

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- password.test.ts

# Run tests matching pattern
npm test -- --testPathPattern="password|jwt"
```

## Test Coverage

### Utils Tests
- **password.test.ts** (100% coverage)
  - ✅ Password hashing with bcrypt
  - ✅ Password comparison
  - ✅ Password format validation
  - ✅ Password strength calculation
  - ✅ Secure password generation
  - ✅ Password regex validation

- **jwt.test.ts** (100% coverage)
  - ✅ Access token generation
  - ✅ Refresh token generation
  - ✅ Token verification
  - ✅ Token pair generation
  - ✅ Token expiration handling
  - ✅ Token security validation

## Test Guidelines

### Writing Tests
1. Use descriptive test names that explain what is being tested
2. Follow the AAA pattern: Arrange, Act, Assert
3. Test both success and failure cases
4. Mock external dependencies
5. Keep tests isolated and independent

### Test Structure
```typescript
describe('Feature Name', () => {
  describe('functionName', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = functionName(input);
      
      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Best Practices
- Test one thing per test case
- Use meaningful variable names
- Clean up after tests (afterEach, afterAll)
- Mock time-dependent operations
- Test edge cases and error conditions
- Aim for high code coverage (>80%)

## Mocking

### Environment Variables
```typescript
const originalEnv = process.env;

beforeAll(() => {
  process.env = {
    ...originalEnv,
    JWT_SECRET: 'test-secret'
  };
});

afterAll(() => {
  process.env = originalEnv;
});
```

### External Services
```typescript
jest.mock('../services/email', () => ({
  sendEmail: jest.fn().mockResolvedValue(true)
}));
```

## Coverage Goals

- **Statements**: > 80%
- **Branches**: > 75%
- **Functions**: > 80%
- **Lines**: > 80%

## Continuous Integration

Tests are automatically run on:
- Every commit
- Pull requests
- Before deployment

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout: `jest.setTimeout(10000)`
   - Check for unresolved promises

2. **Mock not working**
   - Ensure mock is defined before import
   - Use `jest.clearAllMocks()` in beforeEach

3. **Database tests failing**
   - Use test database
   - Clean up data after tests
   - Use transactions for isolation

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Best Practices](https://testingjavascript.com/)
- [TypeScript Jest](https://kulshekhar.github.io/ts-jest/)