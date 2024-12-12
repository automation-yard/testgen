// Add React Testing Library matchers
require('@testing-library/jest-dom');

// Mock file for assets
jest.mock('fileMock.js', () => 'test-file-stub', { virtual: true });

// Mock CSS modules
jest.mock('identity-obj-proxy', () => ({}), { virtual: true });

// Set default timeout
jest.setTimeout(10000);

// Suppress console errors during tests
console.error = (...args) => {
  if (
    typeof args[0] === 'string' &&
    args[0].includes('Warning: ReactDOM.render is no longer supported')
  ) {
    return;
  }
  console.error(...args);
};
