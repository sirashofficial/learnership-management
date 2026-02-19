# Testing Guide

This guide provides comprehensive information on testing the YEHA Learnership Management System.

## Overview

The project uses **Jest** as the primary testing framework with support for unit, integration, and end-to-end tests. The testing infrastructure is configured to work seamlessly with Next.js, TypeScript, and Prisma.

## Test Structure

Tests are organized in the `tests/` directory with the following structure:

```
tests/
├── api/           # API route tests
├── components/    # Component tests
├── hooks/         # Custom hook tests
├── lib/           # Utility function tests
└── e2e/           # End-to-end tests
```

## Running Tests

### Development Mode (Watch)
Run tests in watch mode during development:
```bash
npm test
```

### Single Run
Run all tests once:
```bash
npm run test:ci
```

### Coverage Report
Generate a coverage report:
```bash
npm run test:coverage
```

## Writing Tests

### API Route Tests

API route tests should verify endpoint behavior, validation, authentication, and error handling.

Example:
```typescript
import { describe, it, expect } from '@jest/globals';

describe('GET /api/students', () => {
  it('should return list of students', async () => {
    // Test implementation
  });

  it('should require authentication', async () => {
    // Test implementation
  });
});
```

### Component Tests

Component tests should verify rendering, user interactions, and state management.

Example:
```typescript
import { render, screen } from '@testing-library/react';
import { StudentCard } from '@/components/StudentCard';

describe('StudentCard', () => {
  it('should render student information', () => {
    render(<StudentCard student={mockStudent} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });
});
```

### Hook Tests

Custom hook tests should verify hook behavior and state updates.

Example:
```typescript
import { renderHook } from '@testing-library/react';
import { useStudents } from '@/hooks/useStudents';

describe('useStudents', () => {
  it('should fetch students on mount', async () => {
    const { result } = renderHook(() => useStudents());
    // Test implementation
  });
});
```

## Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Mock External Dependencies**: Use mocks for API calls, database queries, and external services
3. **Descriptive Names**: Use clear, descriptive test names that explain what is being tested
4. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification phases
5. **Coverage Goals**: Aim for at least 70% code coverage for critical paths

## Continuous Integration

Tests are automatically run on every push and pull request via GitHub Actions. The CI pipeline includes:

- Linting and type checking
- Unit and integration tests
- Build verification
- Coverage reporting

## Troubleshooting

### Common Issues

**Tests fail with module resolution errors:**
- Ensure `@/*` path alias is correctly configured in `jest.config.js`
- Check that `tsconfig.json` paths match Jest configuration

**Database connection errors:**
- Tests use a separate test database (configured in `jest.setup.js`)
- Ensure `DATABASE_URL` environment variable is set for tests

**Timeout errors:**
- Increase Jest timeout for slow tests: `jest.setTimeout(10000)`
- Consider mocking slow operations

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Library](https://testing-library.com/)
- [Next.js Testing Guide](https://nextjs.org/docs/testing)

## Next Steps

1. Implement comprehensive test coverage for all API routes
2. Add component tests for critical UI components
3. Set up E2E tests using Playwright or Cypress
4. Configure automated visual regression testing
