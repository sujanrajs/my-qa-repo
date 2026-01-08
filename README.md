# QA Testing Project Structure

## Organizing and Testing a Full-Stack Application

> **Note**: This project structure was built with the assistance of AI and may contain errors or inaccuracies.

## Backend Structure
```
backend/
├── src/
│   ├── index.ts                 # Main server entry point
│   ├── routes/
│   │   ├── auth.routes.ts       # Authentication routes (register, login, logout)
│   │   ├── auth.routes.test.ts  # Unit tests for auth routes
│   │   ├── __snapshots__/       # Snapshot files for route tests
│   │   │   ├── auth.routes.test.ts.snap
│   │   │   └── profile.routes.test.ts.snap
│   │   ├── profile.routes.ts    # Profile routes (get, update)
│   │   └── profile.routes.test.ts # Unit tests for profile routes
│   ├── controllers/
│   │   ├── auth.controller.ts   # Auth logic (register, login, logout, session)
│   │   ├── auth.controller.test.ts # Unit tests for auth controller
│   │   ├── __snapshots__/       # Snapshot files for controller tests
│   │   │   ├── auth.controller.test.ts.snap
│   │   │   └── profile.controller.test.ts.snap
│   │   ├── profile.controller.ts # Profile logic (get, update)
│   │   ├── profile.controller.test.ts # Unit tests for profile controller
│   │   └── validation.test.ts   # Validation tests for controllers
│   ├── middleware/
│   │   ├── auth.middleware.ts   # Authentication middleware
│   │   ├── auth.middleware.test.ts # Unit tests for auth middleware
│   │   ├── __snapshots__/       # Snapshot files for middleware tests
│   │   │   └── auth.middleware.test.ts.snap
│   │   └── error-handling.test.ts # Error handling middleware tests
│   ├── database/
│   │   ├── db.ts                # Database helper functions
│   │   ├── db.test.ts           # Unit tests for database functions
│   │   ├── __snapshots__/       # Snapshot files for database tests
│   │   │   └── db.test.ts.snap
│   │   └── users.json           # JSON file for user storage
│   ├── test/                    # Integration and API tests
│   │   ├── integration-helpers.ts # Test helpers and utilities
│   │   ├── integration.test.ts # Integration tests (API endpoints with database)
│   │   ├── performance.test.ts # Performance tests (response time, load, stress)
│   │   └── security.test.ts     # Security tests (auth bypass, token validation)
│   ├── utils/
│   │   ├── validation.ts        # Validation utility functions
│   │   └── validation.test.ts  # Unit tests for validation utilities
│   └── types/
│       └── user.types.ts        # TypeScript types/interfaces
├── tsconfig.json                # TypeScript configuration
├── vitest.config.ts             # Vitest configuration (with coverage)
├── nodemon.json                 # Nodemon configuration for development
├── package.json
└── package-lock.json
```

## Frontend Structure
```
frontend/
├── src/
│   ├── main.tsx                 # React entry point
│   ├── App.tsx                  # Main app component with routing
│   ├── App.css                  # App-level styles
│   ├── index.css                # Global styles
│   ├── pages/
│   │   ├── login/
│   │   │   ├── Login.tsx        # Login page component
│   │   │   ├── Login.css        # Login page styles
│   │   │   ├── login.events.ts  # Login event handlers
│   │   │   ├── login.events.test.ts # Unit tests for login events/logic
│   │   │   ├── Login.test.tsx   # Integration tests (page + services + navigation)
│   │   │   ├── login.stories.tsx # Login Storybook stories
│   │   │   └── __snapshots__/   # Snapshots for login.events.test.ts
│   │   │       └── login.events.test.ts.snap
│   │   ├── signup/
│   │   │   ├── Signup.tsx        # Signup page component
│   │   │   ├── Signup.css        # Signup page styles
│   │   │   ├── signup.events.ts  # Signup event handlers
│   │   │   ├── signup.events.test.ts # Unit tests for signup events/logic
│   │   │   ├── Signup.test.tsx   # Integration tests (page + services + navigation)
│   │   │   ├── signup.stories.tsx # Signup Storybook stories
│   │   │   └── __snapshots__/   # Snapshots for signup.events.test.ts
│   │   │       └── signup.events.test.ts.snap
│   │   └── profile/
│   │       ├── Profile.tsx      # Profile page component
│   │       ├── Profile.css      # Profile page styles
│   │       ├── profile.events.ts # Profile event handlers
│   │       ├── profile.events.test.ts # Unit tests for profile events/logic
│   │       ├── Profile.test.tsx  # Integration tests (page + services + navigation)
│   │       ├── profile.stories.tsx # Profile Storybook stories
│   │       └── __snapshots__/   # Snapshots for profile.events.test.ts
│   │           └── profile.events.test.ts.snap
│   ├── components/
│   │   ├── lib/                 # Reusable component library
│   │   │   ├── Button/
│   │   │   │   ├── Button.tsx   # Button component
│   │   │   │   ├── Button.css
│   │   │   │   ├── Button.test.tsx # Component tests for Button
│   │   │   │   └── Button.stories.tsx # Button Storybook stories
│   │   │   └── Input/
│   │   │       ├── Input.tsx    # Input component
│   │   │       ├── Input.css
│   │   │       ├── Input.test.tsx # Component tests for Input
│   │   │       └── Input.stories.tsx # Input Storybook stories
│   │   ├── Layout/
│   │   │   ├── Layout.tsx       # Layout wrapper (header, nav, footer)
│   │   │   ├── Layout.css
│   │   │   ├── Layout.test.tsx  # Component tests for Layout
│   │   │   └── Layout.stories.tsx # Layout Storybook stories
│   │   └── Footer/
│   │       ├── Footer.tsx       # Footer component
│   │       ├── Footer.css
│   │       ├── Footer.test.tsx  # Component tests for Footer
│   │       └── Footer.stories.tsx # Footer Storybook stories
│   ├── services/
│   │   ├── api.ts               # API service functions
│   │   ├── api.test.ts          # Unit tests for API service
│   │   ├── auth.service.ts      # Authentication service
│   │   └── auth.service.test.ts # Unit tests for auth service
│   ├── utils/
│   │   ├── storage.ts           # Local storage helpers
│   │   └── storage.test.ts      # Unit tests for storage utilities
│   ├── types/
│   │   └── user.types.ts        # TypeScript types/interfaces
│   ├── test/
│   │   └── setup.ts             # Test setup file (Vitest configuration)
│   └── assets/
│       └── react.svg            # React logo asset
├── test/                        # Playwright E2E tests
│   ├── accessibility/
│   │   ├── login.a11y.spec.ts   # Login accessibility E2E tests
│   │   ├── profile.a11y.spec.ts # Profile accessibility E2E tests
│   │   └── signup.a11y.spec.ts  # Signup accessibility E2E tests
│   ├── error-handling/
│   │   ├── auth-errors.spec.ts  # Authentication error handling tests
│   │   ├── edge-cases.spec.ts  # Edge case error scenarios
│   │   ├── http-status-codes.spec.ts # HTTP status code error tests
│   │   └── network-errors.spec.ts # Network error scenarios
│   ├── functional/
│   │   ├── login.spec.ts        # Login functional E2E tests
│   │   ├── profile.spec.ts      # Profile functional E2E tests
│   │   └── signup.spec.ts       # Signup functional E2E tests
│   ├── integration/
│   │   └── user-flow.spec.ts    # Integration tests (full user flows)
│   ├── performance/
│   │   ├── frontend-performance.spec.ts # Frontend-only performance (mocked API)
│   │   └── e2e-performance.spec.ts # Full-stack performance (real API)
│   ├── responsive/
│   │   ├── login.responsive.spec.ts # Responsive tests for Login page
│   │   ├── profile.responsive.spec.ts # Responsive tests for Profile page
│   │   └── signup.responsive.spec.ts # Responsive tests for Signup page
│   ├── smoke/
│   │   └── app.smoke.spec.ts    # Smoke tests (quick health checks)
│   ├── utils/
│   │   └── real-api-helper.ts   # Helper utilities for real API tests
│   └── visual/
│       ├── login.visual.spec.ts # Visual regression tests for Login page
│       ├── login.visual.spec.ts-snapshots/ # Visual snapshot images
│       ├── profile.visual.spec.ts # Visual regression tests for Profile page
│       ├── profile.visual.spec.ts-snapshots/ # Visual snapshot images
│       ├── signup.visual.spec.ts # Visual regression tests for Signup page
│       └── signup.visual.spec.ts-snapshots/ # Visual snapshot images
├── scripts/
│   └── generate-test-report.js  # Script to generate test reports
├── public/
│   └── vite.svg                 # Vite logo
├── coverage/                    # Code coverage reports (generated)
├── playwright-report/           # Playwright test reports (generated)
├── test-results/                # Playwright test results (generated)
├── index.html                   # HTML entry point
├── playwright.config.ts         # Playwright configuration
├── vite.config.ts              # Vite configuration (with Vitest)
├── tsconfig.json                # TypeScript configuration
├── eslint.config.js            # ESLint configuration
├── .lighthouserc.json          # Lighthouse CI configuration
├── package.json
└── package-lock.json
```

## Key Features

### Backend:
- **Authentication**: Signup (register), login with email/password, logout, session management
- **Profile**: Get and update user profile (name, email)
- **Database**: Simple JSON file storage (`users.json`)
- **Middleware**: Auth middleware to protect routes
- **Validation**: Utility functions for input validation
  - **Email**: Valid email format required
  - **Password**: Minimum 8 characters, at least one letter and one number
  - **Name**: 
    - Letters, spaces, hyphens, and apostrophes only
    - No numeric digits allowed
    - Must contain at least one letter
    - Maximum 100 characters
    - Detailed error messages for validation failures
- **Testing**:
  - **Unit tests** (`*.test.ts`) - Test controllers, middleware, database, routes, and utilities in isolation
    - **Snapshot testing** - Uses Vitest snapshots for response data validation
    - Snapshot files stored in `__snapshots__/` directories co-located with test files
    - Snapshots capture API response structures, user objects, and data transformations
    - Update snapshots with `vitest -u` when changes are intentional
  - **Integration tests** (`src/test/integration.test.ts`) - Test API endpoints with database
  - **Performance tests** (`src/test/performance.test.ts`) - Test response times, load, and stress testing
  - **Security tests** (`src/test/security.test.ts`) - Test authentication bypass, token validation, input sanitization
  - **Test helpers** (`src/test/integration-helpers.ts`) - Shared utilities for integration tests
  - Vitest config in root, unit tests co-located with source files
  - Integration/performance/security tests in `src/test/` folder

### Frontend:
- **App**: Main App component with routing
- **Pages**: Login, Signup, and Profile pages with co-located event handlers, Storybook stories, and unit tests
- **Components Library**: Reusable Button and Input components
  - **Input Component**: 
    - Password visibility toggle (show/hide password)
    - Blur-based validation with real-time error messages
    - Accessible with proper ARIA labels
- **Layout Components**: Layout and Footer in separate folders
- **Services**: API calls and authentication logic
- **Styling**: CSS files for each component/page
- **Storybook**: Stories co-located with pages and components
- **Form Validation**: 
  - Client-side validation with blur events
  - Real-time error messages matching backend validation rules
  - Submit buttons disabled until all fields are valid
  - Same validation rules as backend (email, password, name)
- **Testing**:
  - **Unit tests** (`*.events.test.ts`) - Test event handlers and business logic in isolation
  - **Component tests** (`components/**/*.test.tsx`) - Test isolated components (Button, Input, Footer, Layout)
  - **Integration tests** (`pages/**/*.test.tsx`) - Test page components with services, navigation, and user flows
  - **Accessibility tests** (`test/accessibility/*.a11y.spec.ts`) - Test WCAG compliance using Playwright accessibility API
  - **E2E tests** (`test/**/*.spec.ts`) - Playwright tests organized by test type (functional, integration, etc.)
  - **Integration tests** (`test/integration/*.spec.ts`) - Full user flow tests (e.g., signup → login → profile → logout)
  - **Smoke tests** (`test/smoke/*.spec.ts`) - Quick health checks and critical path validation
  - **Visual regression tests** (`test/visual/*.visual.spec.ts`) - Screenshot comparison tests using Playwright (full pages)
  - **Performance tests** (`test/performance/*.spec.ts`) - Lighthouse CI audits, Web Vitals, and load time tests
  - **Coverage**: v8 coverage provider (via @vitest/coverage-v8)
  - **Responsive tests** (`test/responsive/*.responsive.spec.ts`) - Test different viewports and mobile layouts
  - **Error handling tests** (`test/error-handling/*.spec.ts`) - Test API error scenarios, network failures, error states
  - **Service/API tests** (`services/*.test.ts`) - Unit tests for API service functions and auth service
  - **Utils tests** (`utils/*.test.ts`) - Unit tests for utility functions (storage, helpers)
  - **Test setup** (`src/test/setup.ts`) - Vitest test configuration and global setup
  - **Test utilities** (`test/utils/real-api-helper.ts`) - Helper utilities for real API integration tests
  - Vitest config in `vite.config.ts`, test files and snapshots co-located with source files
  - Playwright config in root, E2E tests organized by test type folders
  - Simple presentational components (Button, Input, Layout, Footer) rely on Storybook for visual testing

### Data Flow:
1. User signs up (register) → Backend creates user → Returns session token
2. OR User logs in → Backend validates → Returns session token
3. Token stored in localStorage
4. Profile page fetches user data using token
5. User can edit profile → Backend updates JSON file
6. Logout clears session and token

## Testing Strategy

### Backend Testing

#### Unit Tests (`*.test.ts`)
- **Purpose**: Test individual functions, controllers, middleware, database helpers, routes, and utilities in isolation
- **Location**: Co-located with source files (e.g., `auth.controller.test.ts` next to `auth.controller.ts`)
- **What they test**: 
  - Controller logic (register, login, logout, profile updates)
  - Middleware functions (authentication, authorization)
  - Database helper functions (CRUD operations)
  - Route definitions and route-level logic
  - Validation utility functions
- **Snapshot Testing**: 
  - Uses Vitest's `toMatchSnapshot()` for response data validation
  - Snapshot files stored in `__snapshots__/` directories (e.g., `controllers/__snapshots__/auth.controller.test.ts.snap`)
  - Captures API response structures, error responses, user objects, and data arrays
  - First run creates baseline snapshots from actual output
  - Subsequent runs compare against snapshots to detect unexpected changes
  - Update snapshots with `vitest -u` or `vitest --update` when changes are intentional
  - Functional assertions (function calls, status codes) remain explicit
- **Benefits**: Fast execution, easy to debug, test edge cases, catch unexpected response structure changes

#### Integration Tests (`src/test/integration.test.ts`)
- **Purpose**: Test API endpoints with real database operations
- **Location**: `src/test/integration.test.ts`
- **What they test**:
  - Full request/response cycle
  - API endpoints with database interactions
  - End-to-end API functionality within backend
- **Test Helpers**: `src/test/integration-helpers.ts` provides shared utilities
- **Benefits**: Verify API works correctly with database, catch integration issues

#### Performance Tests (`src/test/performance.test.ts`)
- **Purpose**: Test API performance under various conditions
- **Location**: `src/test/performance.test.ts`
- **What they test**:
  - Response times
  - Throughput (requests per second)
  - Load testing (multiple concurrent requests)
  - Stress testing (system limits)
- **Benefits**: Ensure API meets performance requirements, identify bottlenecks

#### Security Tests (`src/test/security.test.ts`)
- **Purpose**: Ensure API is secure against common attacks
- **Location**: `src/test/security.test.ts`
- **What they test**:
  - Authentication bypass attempts
  - Token validation and session hijacking
  - Input sanitization
  - XSS (Cross-Site Scripting) prevention
- **Benefits**: Protect against security vulnerabilities, ensure data safety

#### Coverage (v8)
- **Purpose**: Track code coverage for all backend tests (unit, controller, route, integration)
- **Location**: Configured in `vitest.config.ts`
- **What it tracks**:
  - Statement coverage
  - Branch coverage
  - Function coverage
  - Line coverage
- **Tool**: v8 (via @vitest/coverage-v8)
- **Reporters**: Text (console), JSON, HTML (in `coverage/` directory)
- **Command**: `npm run test:coverage`
- **Benefits**: Identify untested code, ensure comprehensive test coverage, track coverage across all test types
- **Exclusions**: Test files, node_modules, dist folder are automatically excluded

### Frontend Testing

#### Unit Tests (`*.events.test.ts`)
- **Purpose**: Test event handlers and business logic in isolation
- **Location**: Co-located with event files (e.g., `login.events.test.ts` next to `login.events.ts`)
- **What they test**:
  - Pure functions and event handlers
  - Business logic (validation, API calls)
  - Data transformations
- **Benefits**: Fast execution, test logic without React rendering

#### Component Tests (`*.test.tsx`)
- **Purpose**: Test component rendering and user interactions
- **Location**: Co-located with components (e.g., `Login.test.tsx` next to `Login.tsx`)
- **What they test**:
  - Component rendering
  - User interactions (clicks, form inputs)
  - Event handler calls (mocked)
  - Conditional rendering
  - Form validation (blur events, error messages, button states)
- **DOM Simulation**: JSDOM (used by Vitest by default)
- **Validation System**: 
  - Blur-based validation triggers on field blur
  - Submit buttons disabled until all fields are valid
  - Real-time error messages displayed inline
- **Benefits**: Verify UI works correctly, test user interactions, validate form behavior

#### Accessibility Tests (`test/accessibility/*.a11y.spec.ts`)
- **Purpose**: Test WCAG compliance and accessibility
- **Location**: `test/accessibility/` folder
- **What they test**:
  - WCAG compliance (ARIA attributes, semantic HTML)
  - Keyboard navigation
  - Screen reader compatibility
  - Color contrast
- **Tool**: Playwright accessibility API with @axe-core/playwright
- **Benefits**: Ensure app is accessible to all users, legal compliance

#### Functional E2E Tests (`test/functional/*.spec.ts`)
- **Purpose**: Test full browser interactions for individual features
- **Location**: `test/functional/` folder organized by feature (login, profile, signup)
- **What they test**:
  - Complete user workflows in real browser
  - Feature functionality end-to-end
  - Browser compatibility
  - Form validation (blur events required to enable submit buttons)
  - Error message display
- **Tool**: Playwright
- **Validation Testing**: 
  - Tests must trigger blur events after filling form fields
  - Submit buttons remain disabled until validation passes
  - Error messages verified for invalid inputs
- **Benefits**: Verify features work in real browser, catch browser-specific issues, validate form behavior

#### Integration Tests (`test/integration/*.spec.ts`)
- **Purpose**: Test complete user journeys across multiple features
- **Location**: `test/integration/` folder
- **What they test**:
  - Full user flows (e.g., signup → login → edit profile → logout)
  - Cross-feature interactions
  - Complete application workflows
- **Real API Support**: `test/utils/real-api-helper.ts` provides utilities for testing with real API
- **Benefits**: Verify complete user journeys, catch integration issues

#### Visual Regression Tests (`test/visual/*.visual.spec.ts`)
- **Purpose**: Catch unintended visual changes using screenshot comparison
- **Location**: `test/visual/` folder
- **What they test**:
  - Visual appearance of pages/components
  - Layout consistency
  - CSS changes
  - Responsive design
- **How it works**: 
  1. First run creates baseline screenshots (stored in `*-snapshots/` folders)
  2. Subsequent runs compare current screenshots with baseline
  3. Fails if differences detected (with visual diff)
- **Configuration**: Playwright config sets threshold (0.01) and maxDiffPixels (5) for visual comparison
- **Tool**: Playwright screenshot comparison
- **Benefits**: Catch visual bugs, ensure UI consistency

#### Performance Tests (`test/performance/*.spec.ts`)
- **Purpose**: Test frontend and full-stack performance metrics
- **Location**: `test/performance/` folder
- **Test Files**:
  - `frontend-performance.spec.ts` - Frontend-only performance (mocked API)
    - Page load times, JavaScript execution, Web Vitals (LCP, CLS)
    - Form validation, navigation, resource loading, memory usage
    - Fast execution, no backend required
  - `e2e-performance.spec.ts` - Full-stack performance (real API)
    - Complete user flow times (login, signup, profile operations)
    - Real API response times, concurrent request handling
    - Requires backend server running
- **What they test**:
  - Web Vitals (LCP, FID, CLS)
  - Page load times
  - API response times
  - Resource loading
  - Memory usage
  - Complete user journey performance
- **Tool**: Playwright with performance metrics
- **Lighthouse CI**: `.lighthouserc.json` configures Lighthouse CI for automated performance audits
- **Benefits**: 
  - Ensure fast user experience
  - Meet performance budgets
  - CI/CD integration (frontend tests)
  - Real-world performance validation (E2E tests)

#### Coverage (v8)
- **Purpose**: Track code coverage for unit and component tests
- **Location**: Configured in `vite.config.ts`
- **What it tracks**:
  - Statement coverage
  - Branch coverage
  - Function coverage
  - Line coverage
- **Tool**: v8 (via @vitest/coverage-v8)
- **Benefits**: Identify untested code, ensure comprehensive test coverage

#### Responsive Tests (`test/responsive/*.responsive.spec.ts`)
- **Purpose**: Test different viewports and mobile layouts
- **Location**: `test/responsive/` folder
- **What they test**:
  - Mobile viewports (320px, 375px, 414px)
  - Tablet viewports (768px, 1024px)
  - Desktop viewports (1280px, 1920px)
  - Layout responsiveness
  - Touch interactions
- **Tool**: Playwright with different viewport sizes
- **Benefits**: Ensure app works correctly on all device sizes, responsive design validation

#### Error Handling Tests (`test/error-handling/*.spec.ts`)
- **Purpose**: Test error scenarios in the browser
- **Location**: `test/error-handling/` folder
- **What they test**:
  - API error responses (400, 401, 404, 500)
  - Network failures
  - Error state UI
  - Error message display
  - Error recovery
  - Edge cases and boundary conditions
- **Tool**: Playwright with network interception
- **Benefits**: Ensure proper error handling in UI, good user experience during errors

#### Service/API Tests (`services/*.test.ts`)
- **Purpose**: Test API service functions and authentication service
- **Location**: Co-located with service files (e.g., `api.test.ts` next to `api.ts`)
- **What they test**:
  - API call functions
  - Request/response handling
  - Error handling in services
  - Authentication service logic
- **Benefits**: Test service layer in isolation, verify API integration logic

#### Utils Tests (`utils/*.test.ts`)
- **Purpose**: Test utility functions
- **Location**: Co-located with util files (e.g., `storage.test.ts` next to `storage.ts`)
- **What they test**:
  - LocalStorage helpers
  - Data transformation utilities
  - Helper functions
- **Benefits**: Test utility functions in isolation, ensure they work correctly

#### Smoke Tests (`test/smoke/*.spec.ts`)
- **Purpose**: Quick health checks and basic functionality verification
- **Location**: `test/smoke/` folder
- **What they test**:
  - App health and basic connectivity
  - Critical paths
  - Quick regression checks
- **Benefits**: Fast feedback, catch critical issues early, CI/CD pipeline validation

#### Test Setup (`src/test/setup.ts`)
- **Purpose**: Global test configuration and setup
- **Location**: `src/test/setup.ts`
- **What it provides**:
  - Global test utilities
  - Mock configurations
  - Test environment setup
- **Configuration**: Referenced in `vite.config.ts` via `setupFiles`

#### Test Utilities (`test/utils/real-api-helper.ts`)
- **Purpose**: Helper utilities for real API integration tests
- **Location**: `test/utils/real-api-helper.ts`
- **What it provides**:
  - Utilities for testing with real backend API
  - Test user creation/cleanup
  - API interaction helpers
- **Usage**: Used by integration and E2E performance tests that require real API

### Testing Tools

- **Unit/Component Tests**: Vitest with React Testing Library
- **E2E Browser Tests**: Playwright
- **Accessibility Tests**: @axe-core/playwright + Playwright accessibility API
- **DOM Simulation**: JSDOM (used by Vitest by default for component tests)
- **Coverage**: v8 (via @vitest/coverage-v8)
- **Performance Audits**: Lighthouse CI (configured via `.lighthouserc.json`)
- **Visual Testing (Pages)**: Playwright screenshot comparison
- **Storybook**: Component documentation and visual testing
- **Test Reports**: Custom script (`scripts/generate-test-report.js`) for generating test reports

## Configuration Files

### Backend Configuration
- **`tsconfig.json`**: TypeScript configuration with strict mode, ES2020 target
- **`vitest.config.ts`**: Vitest test configuration with v8 coverage provider
- **`nodemon.json`**: Development server configuration with TypeScript support
- **`package.json`**: Dependencies and npm scripts

### Frontend Configuration
- **`tsconfig.json`**: TypeScript configuration with React and DOM types
- **`vite.config.ts`**: Vite build tool configuration with Vitest integration
- **`playwright.config.ts`**: Playwright E2E test configuration with visual comparison settings
- **`eslint.config.js`**: ESLint configuration for code quality
- **`.lighthouserc.json`**: Lighthouse CI configuration for performance audits
- **`package.json`**: Dependencies and npm scripts

## NPM Scripts

### Backend Scripts
- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm run start` - Start production server
- `npm run test` - Run all tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:unit` - Run unit tests only
- `npm run test:integration` - Run integration tests
- `npm run test:performance` - Run performance tests
- `npm run test:security` - Run security tests

### Frontend Scripts
- `npm run dev` - Start Vite development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run test` - Run all Vitest tests (unit, component, integration)
- `npm run test:all` - Run all tests (Vitest + E2E tests)
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage report
- `npm run test:unit` - Run unit tests (services, utils, events)
- `npm run test:component` - Run component tests
- `npm run test:integration` - Run integration tests (page tests)
- `npm run storybook` - Start Storybook dev server
- `npm run build-storybook` - Build Storybook for production
- `npm run test:e2e` - Run all Playwright E2E tests
- `npm run test:e2e:ui` - Run Playwright tests with UI mode
- `npm run test:e2e:headed` - Run Playwright tests in headed mode
- `npm run test:e2e:debug` - Run Playwright tests in debug mode
- `npm run test:a11y` - Run accessibility tests
- `npm run test:e2e:functional` - Run functional E2E tests
- `npm run test:e2e:integration` - Run integration E2E tests
- `npm run test:e2e:integration:real` - Run integration tests with real API
- `npm run test:e2e:error-handling` - Run error handling tests
- `npm run test:e2e:smoke` - Run smoke tests
- `npm run test:e2e:responsive` - Run responsive tests
- `npm run test:e2e:visual` - Run visual regression tests
- `npm run test:visual:update` - Update visual regression snapshots
- `npm run test:e2e:performance` - Run performance tests
- `npm run lighthouse:ci` - Run Lighthouse CI audits
