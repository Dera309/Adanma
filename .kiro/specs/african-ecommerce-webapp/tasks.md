# Implementation Plan

## Phase 1: Project Setup and Core Infrastructure

- [x] 1. Initialize project structure and development environment








  - Create monorepo structure with frontend and backend directories
  - Set up TypeScript configuration for both frontend and backend
  - Configure ESLint and Prettier for code quality
  - Initialize Git repository with .gitignore
  - Set up package.json with required dependencies
  - _Requirements: All requirements depend on proper project setup_

- [x] 2. Set up database and ORM configuration



  - Install and configure PostgreSQL with PostGIS extension
  - Set up Prisma ORM or TypeORM with TypeScript
  - Create database connection configuration with environment variables
  - Implement database connection pooling
  - _Requirements: 1, 2, 3, 4, 5, 6, 10_

- [x] 3. Implement core data models and migrations





  - [x] 3.1 Create User model with all required fields

    - Define User schema with id, email, phoneNumber, passwordHash, roles, authProvider, verification fields
    - Create database migration for users table
    - Add indexes on email, phoneNumber, and id fields


    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 2.2, 2.3, 2.4, 2.5, 5.1, 10.1_
  

  - [x] 3.2 Create Address model with country-specific fields

    - Define Address schema with userId, country, region, subRegion, city, district, streetAddress, postalCode, isPrimary
    - Create database migration for addresses table

    - Add foreign key constraint to users table

    - Add index on userId field
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10_
  
  - [x] 3.3 Create Session model for authentication persistence

    - Define Session schema with userId, token, deviceInfo, ipAddress, expiresAt, lastActivityAt

    - Create database migration for sessions table
    - Add foreign key constraint to users table
    - Add indexes on userId and token fields
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6, 6.7_

  

  - [x] 3.4 Create VerificationRequest model for vendor verification



    - Define VerificationRequest schema with userId, documentType, documentUrls, status, rejectionReason
    - Create database migration for verification_requests table
    - Add foreign key constraint to users table
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6, 10.7, 10.8_

- [x] 4. Set up authentication infrastructure







  - [x] 4.1 Configure JWT token generation and validation



    - Install jsonwebtoken library
    - Create utility functions for generating access and refresh tokens
    - Implement token verification middleware
    - Configure token expiration (15 minutes for access, 30 days for refresh)




    - _Requirements: 6.1, 6.2, 6.5_
  
  - [x] 4.2 Implement password hashing utilities



    - Install bcrypt library
    - Create password hashing function with salt rounds of 12



    - Create password comparison function

    - Implement password validation regex for requirements
    - _Requirements: 5.1, 5.2, 5.6_
  
  - [x] 4.3 Set up OAuth 2.0 integration for social authentication



    - Install passport.js with Facebook and custom WhatsApp strategies
    - Configure OAuth callback URLs
    - Implement OAuth state parameter validation
    - Create OAuth profile data extraction utilities
    - _Requirements: 1.6, 1.7, 1.8, 7.3_

- [x] 5. Configure external service integrations




  - [x] 5.1 Set up SMS service integration

    - Choose and configure SMS provider (Twilio or Africa's Talking)
    - Create SMS sending utility function
    - Implement verification code generation (6-digit random)
    - Add error handling for SMS delivery failures
    - _Requirements: 1.2, 1.3, 4.4, 5.4_
  

  - [x] 5.2 Set up email service integration

    - Choose and configure email provider (SendGrid or AWS SES)
    - Create email template system
    - Implement email sending utility function
    - Create verification email template
    - Create password reset email template

    - Create notification email template
    - _Requirements: 1.4, 1.5, 4.3, 5.4, 5.7_

## Phase 2: Authentication and User Management Backend

- [x] 6. Implement email registration endpoint


  - Create POST /api/auth/register/email route
  - Validate email format and password requirements
  - Check for existing email in database
  - Hash password using bcrypt
  - Create user record with emailVerified=false
  - Generate and store email verification token
  - Send verification email
  - Return success response with userId
  - _Requirements: 1.1, 1.4, 1.5, 1.9, 5.1, 5.2, 7.1, 7.2, 9.1, 9.5_

- [x] 7. Implement phone registration endpoint



  - Create POST /api/auth/register/phone route
  - Validate phone number format for supported countries
  - Check for existing phone number in database
  - Hash password using bcrypt
  - Create user record with phoneVerified=false
  - Generate 6-digit verification code
  - Store verification code with 10-minute expiration
  - Send SMS with verification code
  - Return success response with userId
  - _Requirements: 1.1, 1.2, 1.3, 1.9, 5.1, 5.2, 7.1, 7.2, 9.1, 9.5_

- [x] 8. Implement social authentication endpoints




  - [x] 8.1 Create Facebook OAuth flow

    - Create GET /api/auth/facebook route for OAuth initiation
    - Create GET /api/auth/facebook/callback route
    - Extract user profile data (email, name, id)
    - Check if user exists by Facebook ID or email
    - Create new user or link existing user
    - Generate JWT tokens
    - Set authentication cookies
    - _Requirements: 1.1, 1.7, 1.8, 7.3, 9.1_
  

  - [x] 8.2 Create WhatsApp OAuth flow



    - Create GET /api/auth/whatsapp route for OAuth initiation
    - Create GET /api/auth/whatsapp/callback route
    - Extract user profile data (phone, name, id)
    - Check if user exists by WhatsApp ID or phone
    - Create new user or link existing user
    - Generate JWT tokens
    - Set authentication cookies
    - _Requirements: 1.1, 1.6, 1.8, 7.3, 9.1_

- [x] 9. Implement verification endpoints



  - [x] 9.1 Create email verification endpoint


    - Create POST /api/auth/verify/email route
    - Validate verification token
    - Check token expiration (24 hours)
    - Update user emailVerified to true
    - Generate JWT tokens
    - Set authentication cookies
    - Return success response
    - _Requirements: 1.5, 9.1, 9.5_
  

  - [x] 9.2 Create phone verification endpoint



    - Create POST /api/auth/verify/phone route
    - Validate verification code
    - Check code expiration (10 minutes)
    - Update user phoneVerified to true
    - Generate JWT tokens
    - Set authentication cookies
    - Return success response
    - _Requirements: 1.3, 9.1, 9.5_

- [x] 10. Implement login endpoint











  - Create POST /api/auth/login route
  - Accept email/phone and password
  - Find user by email or phone
  - Verify password using bcrypt
  - Check if email/phone is verified
  - Generate JWT tokens
  - Create session record
  - Set HTTP-only, secure, SameSite cookies
  - Update lastLoginAt timestamp
  - Return success response with user data
  - _Requirements: 6.1, 6.2, 6.3, 9.1, 9.3_

- [x] 11. Implement logout and session management endpoints

  - [x] 11.1 Create logout endpoint







    - Create POST /api/auth/logout route
    - Invalidate current session token
    - Clear authentication cookies
    - Return success response
    - _Requirements: 6.4, 9.5_
  
  - [x] 11.2 Create session listing endpoint



    - Create GET /api/auth/sessions route
    - Require authentication
    - Fetch all active sessions for current user
    - Return sessions with deviceInfo, ipAddress, lastActivityAt
    - _Requirements: 6.6_
  
  - [x] 11.3 Create session termination endpoint



    - Create DELETE /api/auth/sessions/:sessionId route
    - Require authentication
    - Verify session belongs to current user
    - Invalidate specified session
    - Return success response
    - _Requirements: 6.7_

- [x] 12. Implement password reset flow

  - [x] 12.1 Create password reset request endpoint



    - Create POST /api/auth/password/reset-request route
    - Accept email or phone number
    - Find user by email or phone
    - Generate reset token or verification code
    - Store token/code with 15-minute expiration
    - Send reset link via email or code via SMS
    - Return success response
    - _Requirements: 5.3, 5.4, 9.1_
  
  - [x] 12.2 Create password reset endpoint



    - Create POST /api/auth/password/reset route
    - Validate reset token or verification code
    - Check token/code expiration
    - Validate new password requirements
    - Check against last 5 passwords
    - Hash and update password
    - Invalidate all existing sessions
    - Send notification email and SMS
    - Return success response
    - _Requirements: 5.5, 5.6, 5.7, 9.1, 9.5_

- [x] 13. Implement role management endpoints



  - Create PATCH /api/users/role route
  - Require authentication
  - Validate role values (buyer, vendor)
  - Update user roles in database
  - Return updated user data
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 4.1, 9.5_

## Phase 3: Address Management Backend

- [x] 14. Create country-specific address configuration



  - Define address field configurations for all 6 countries
  - Create configuration object with fields for Nigeria (State, LGA, City, Street, Postal Code)
  - Create configuration object with fields for Ghana (Region, District, City, Street, Postal Code)
  - Create configuration object with fields for Kenya (County, Sub-County, City, Street, Postal Code)
  - Create configuration object with fields for South Africa (Province, Municipality, City, Street, Postal Code)
  - Create configuration object with fields for Cameroon (Region, Division, City, Street, Postal Code)
  - Create configuration object with fields for Egypt (Governorate, City, District, Street, Postal Code)
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

- [x] 15. Implement address CRUD endpoints

  - [x] 15.1 Create address listing endpoint



    - Create GET /api/addresses route
    - Require authentication
    - Fetch all addresses for current user
    - Order by isPrimary DESC, createdAt DESC
    - Return addresses array
    - _Requirements: 4.1, 4.5_
  
  - [x] 15.2 Create address creation endpoint



    - Create POST /api/addresses route
    - Require authentication
    - Validate country is in supported list
    - Validate required fields based on country configuration
    - If isPrimary is true, set other addresses to isPrimary=false
    - Create address record
    - Return created address
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.9, 3.10, 9.1_
  
  - [x] 15.3 Create address update endpoint



    - Create PUT /api/addresses/:id route
    - Require authentication
    - Verify address belongs to current user
    - Validate country and required fields
    - Update address record
    - Return updated address
    - _Requirements: 4.2, 4.5, 9.1_
  
  - [x] 15.4 Create address deletion endpoint



    - Create DELETE /api/addresses/:id route
    - Require authentication
    - Verify address belongs to current user
    - Check if address is primary and other addresses exist
    - If primary and others exist, return error requiring new primary designation
    - Delete address record
    - Return success response
    - _Requirements: 4.5, 4.6, 9.1_
  
  - [x] 15.5 Create set primary address endpoint



    - Create PATCH /api/addresses/:id/set-primary route
    - Require authentication
    - Verify address belongs to current user
    - Set all user addresses to isPrimary=false
    - Set specified address to isPrimary=true
    - Return updated address
    - _Requirements: 3.10, 4.6_

- [x] 16. Implement address regions lookup endpoint



  - Create GET /api/addresses/regions/:country route
  - Return list of regions/states for specified country
  - Include sub-regions (LGAs, districts, etc.) if applicable
  - Cache region data for performance
  - _Requirements: 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_

## Phase 4: User Profile Management Backend

- [x] 17. Implement profile endpoints

  - [x] 17.1 Create profile retrieval endpoint





    - Create GET /api/users/profile route
    - Require authentication
    - Fetch user data with addresses
    - Exclude sensitive fields (passwordHash)
    - Return user profile data
    - _Requirements: 4.1_
  
  - [x] 17.2 Create profile update endpoint



    - Create PUT /api/users/profile route
    - Require authentication
    - Validate updated fields
    - If email changed, set emailVerified=false and send verification email
    - If phone changed, set phoneVerified=false and send verification SMS
    - Update user record
    - Return updated profile data
    - _Requirements: 4.2, 4.3, 4.4, 9.1, 9.5_

- [x] 18. Implement vendor verification endpoints


  - [x] 18.1 Create verification status endpoint



    - Create GET /api/users/verification-status route
    - Require authentication
    - Fetch user verification status
    - Return status and badge information
    - _Requirements: 10.1, 10.2_
  
  - [x] 18.2 Create verification request submission endpoint



    - Create POST /api/users/verification-request route
    - Require authentication and vendor role
    - Accept document uploads (multipart/form-data)
    - Upload documents to cloud storage (S3 or similar)
    - Create verification request record with status='pending'
    - Update user verificationStatus to 'pending'
    - Return success response
    - _Requirements: 10.3, 10.4_

- [x] 19. Implement account deletion endpoint



  - Create DELETE /api/users/account route
  - Require authentication
  - Display data retention policy information
  - Require confirmation token
  - Soft delete user account (set isActive=false)
  - Invalidate all sessions
  - Return success response
  - _Requirements: 7.6, 9.5_

## Phase 5: Frontend Core Setup

- [x] 20. Initialize React application with TypeScript




  - Create React app with TypeScript template
  - Configure React Router for navigation
  - Set up Axios for API calls with interceptors
  - Configure environment variables for API base URL
  - Set up global styles and theme
  - _Requirements: All frontend requirements_

- [x] 21. Implement authentication context and state management



  - Create AuthContext with React Context API
  - Implement authentication state (user, isAuthenticated, loading)
  - Create login, logout, and refresh token functions
  - Implement automatic token refresh logic
  - Create PrivateRoute component for protected routes
  - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

- [x] 22. Create reusable form components



  - Create Input component with validation feedback
  - Create Select component for dropdowns
  - Create Button component with loading states
  - Create FormError component for error display
  - Create FormSuccess component for success messages
  - _Requirements: 9.1, 9.2, 9.5, 9.6_

- [x] 23. Implement responsive layout components



  - Create Header component with navigation
  - Create Footer component
  - Create Layout wrapper component
  - Implement mobile-responsive navigation menu
  - Add role-based navigation items
  - _Requirements: 8.1, 8.3_

## Phase 6: Authentication Frontend

- [x] 24. Implement registration flow




  - [x] 24.1 Create registration page with authentication method selection

    - Create RegistrationPage component
    - Display buttons for Email, Phone, WhatsApp, Facebook
    - Implement navigation to specific registration forms
    - Display terms of service and privacy policy links with checkboxes
    - _Requirements: 1.1, 7.1, 7.2_
  

  - [x] 24.2 Create email registration form

    - Create EmailRegistrationForm component
    - Add email and password input fields
    - Implement real-time password validation feedback
    - Display password requirements
    - Handle form submission to POST /api/auth/register/email
    - Display success message and redirect to verification page
    - _Requirements: 1.4, 1.5, 5.1, 5.2, 9.1, 9.6_
  
  - [x] 24.3 Create phone registration form


    - Create PhoneRegistrationForm component
    - Add phone number input with country code selector
    - Add password input field
    - Implement phone number format validation
    - Handle form submission to POST /api/auth/register/phone
    - Display success message and redirect to verification page
    - _Requirements: 1.2, 1.3, 5.1, 5.2, 9.1, 9.6_
  
  - [x] 24.4 Create social authentication buttons


    - Create SocialAuthButtons component
    - Implement WhatsApp OAuth button with redirect
    - Implement Facebook OAuth button with redirect
    - Handle OAuth callback and token storage
    - Display consent information for data collection
    - _Requirements: 1.6, 1.7, 1.8, 7.3_

- [x] 25. Implement verification pages



  - [x] 25.1 Create email verification page


    - Create EmailVerificationPage component
    - Extract token from URL query parameter
    - Auto-submit verification request to POST /api/auth/verify/email
    - Display success or error message
    - Redirect to dashboard on success
    - _Requirements: 1.5, 9.5_
  

  - [x] 25.2 Create phone verification page

    - Create PhoneVerificationPage component
    - Display 6-digit code input field
    - Handle code submission to POST /api/auth/verify/phone
    - Display resend code button with cooldown timer
    - Display success or error message
    - Redirect to dashboard on success
    - _Requirements: 1.3, 9.5_

- [x] 26. Implement role selection page



  - Create RoleSelectionPage component
  - Display Buyer and Vendor role options with descriptions
  - Allow multiple role selection
  - Handle role submission to PATCH /api/users/role
  - Redirect to dashboard after role selection
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 27. Implement login page



  - Create LoginPage component
  - Add email/phone and password input fields
  - Handle form submission to POST /api/auth/login
  - Store JWT tokens in cookies
  - Update AuthContext with user data
  - Redirect to dashboard on success
  - Display "Forgot Password" link
  - Display social login buttons
  - _Requirements: 6.1, 6.2, 6.3, 9.1, 9.3_

- [x] 28. Implement password reset flow




  - [x] 28.1 Create password reset request page

    - Create PasswordResetRequestPage component
    - Add email/phone input field
    - Handle form submission to POST /api/auth/password/reset-request
    - Display success message with instructions
    - _Requirements: 5.3, 5.4, 9.1_
  

  - [x] 28.2 Create password reset page

    - Create PasswordResetPage component
    - Extract token from URL or display code input
    - Add new password input with validation
    - Handle form submission to POST /api/auth/password/reset
    - Display success message
    - Redirect to login page
    - _Requirements: 5.5, 5.6, 9.1, 9.5_

## Phase 7: User Profile Frontend

- [x] 29. Implement profile dashboard



  - Create ProfileDashboard component
  - Fetch user data from GET /api/users/profile
  - Display user information (name, email, phone, roles)
  - Display verification status badge for vendors
  - Add edit profile button
  - Display saved addresses list
  - Add navigation to security settings
  - _Requirements: 4.1, 10.2_

- [x] 30. Implement profile edit form



  - Create ProfileEditForm component
  - Pre-populate form with current user data
  - Add input fields for editable information
  - Implement validation for email and phone changes
  - Handle form submission to PUT /api/users/profile
  - Display verification required message for email/phone changes
  - Display success message on update
  - _Requirements: 4.2, 4.3, 4.4, 9.1, 9.5_

- [x] 31. Implement security settings page



  - Create SecuritySettingsPage component
  - Add password change form
  - Display active sessions list from GET /api/auth/sessions
  - Add terminate session buttons for each session
  - Add "Logout all other sessions" button
  - Handle session termination via DELETE /api/auth/sessions/:sessionId
  - _Requirements: 6.6, 6.7_

## Phase 8: Address Management Frontend

- [x] 32. Implement address management interface



  - [x] 32.1 Create address list component



    - Create AddressList component
    - Fetch addresses from GET /api/addresses
    - Display addresses with primary badge
    - Add edit and delete buttons for each address
    - Add "Add New Address" button
    - _Requirements: 4.1, 4.5_
  
  - [x] 32.2 Create dynamic address form



    - Create DynamicAddressForm component
    - Add country selector dropdown
    - Dynamically render fields based on selected country
    - Implement field validation based on country requirements
    - Add isPrimary checkbox
    - Handle country change to clear and update form fields
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 9.1, 9.6_
  
  - [x] 32.3 Create address creation modal



    - Create AddressCreateModal component
    - Embed DynamicAddressForm
    - Handle form submission to POST /api/addresses
    - Display success message
    - Refresh address list on success
    - _Requirements: 3.9, 3.10, 9.5_
  
  - [x] 32.4 Create address edit modal



    - Create AddressEditModal component
    - Pre-populate DynamicAddressForm with address data
    - Handle form submission to PUT /api/addresses/:id
    - Display success message
    - Refresh address list on success
    - _Requirements: 4.2, 4.5, 9.5_
  
  - [x] 32.5 Implement address deletion


    - Add delete confirmation dialog
    - Handle primary address deletion validation
    - Submit deletion request to DELETE /api/addresses/:id
    - Display error if primary address with other addresses
    - Refresh address list on success
    - _Requirements: 4.5, 4.6, 9.1_

## Phase 9: Vendor Verification Frontend

- [x] 33. Implement vendor verification interface




  - [x] 33.1 Create verification status display


    - Create VerificationStatusBadge component
    - Display current verification status (Unverified, Pending, Verified)
    - Show verification badge on vendor profiles
    - _Requirements: 10.1, 10.2, 10.6_
  
  - [x] 33.2 Create verification request form


    - Create VerificationRequestForm component
    - Add document type selector
    - Add file upload inputs for documents
    - Validate file types and sizes
    - Handle form submission to POST /api/users/verification-request
    - Display upload progress
    - Display success message on submission
    - _Requirements: 10.3, 10.4_

## Phase 10: Error Handling and User Feedback

- [x] 34. Implement global error handling




  - Create error boundary component for React
  - Implement Axios interceptor for API errors
  - Create error toast notification system
  - Map API error codes to user-friendly messages
  - Implement retry logic for network errors
  - _Requirements: 1.8, 9.1, 9.2, 9.3, 9.4_

- [x] 35. Implement loading states and feedback





  - Create loading spinner component
  - Add loading states to all async operations
  - Implement skeleton screens for data loading
  - Add success toast notifications
  - Implement form submission loading states
  - _Requirements: 9.5_

- [x] 36. Implement accessibility features



  - Add ARIA labels to all interactive elements
  - Implement keyboard navigation for forms
  - Ensure color contrast ratios meet WCAG standards
  - Add focus indicators for keyboard navigation
  - Test with screen readers
  - _Requirements: 8.6, 8.7_

## Phase 11: Performance Optimization and Testing

- [x] 37. Implement performance optimizations





  - Add React.memo to prevent unnecessary re-renders
  - Implement code splitting with React.lazy
  - Optimize bundle size with tree shaking
  - Add image optimization and lazy loading
  - Implement caching strategies for API responses
  - _Requirements: 8.5_

- [x] 38. Write unit tests for backend services



  - Write tests for authentication service functions
  - Write tests for user service functions
  - Write tests for address service functions
  - Write tests for password hashing and validation
  - Write tests for JWT token generation and validation
  - Achieve 80% code coverage
  - _Requirements: All backend requirements_

- [ ] 39. Write integration tests for API endpoints


  - Write tests for registration endpoints
  - Write tests for login and logout endpoints
  - Write tests for profile management endpoints
  - Write tests for address CRUD endpoints
  - Write tests for password reset flow
  - Write tests for session management endpoints
  - _Requirements: All backend requirements_

- [ ] 40. Write frontend component tests
  - Write tests for authentication components
  - Write tests for profile components
  - Write tests for address management components
  - Write tests for form validation logic
  - Write tests for error handling
  - _Requirements: All frontend requirements_

- [ ] 41. Implement end-to-end tests
  - Write E2E test for email registration flow
  - Write E2E test for phone registration flow
  - Write E2E test for social authentication flow
  - Write E2E test for profile management flow
  - Write E2E test for address management flow
  - Write E2E test for password reset flow
  - _Requirements: All requirements_

## Phase 12: Security Hardening and Deployment Preparation

- [x] 42. Implement security measures



  - Add rate limiting middleware to all endpoints
  - Implement CSRF protection
  - Add Content Security Policy headers
  - Implement SQL injection prevention validation
  - Add XSS protection headers
  - Configure CORS properly
  - _Requirements: All requirements (security is cross-cutting)_

- [x] 43. Set up monitoring and logging



  - Integrate error tracking service (Sentry)
  - Implement structured logging
  - Add correlation IDs to requests
  - Set up health check endpoint
  - Configure application metrics collection
  - Set up alerting for critical errors
  - _Requirements: All requirements (observability is cross-cutting)_

- [x] 44. Prepare deployment configuration






  - Create Docker configuration for frontend and backend
  - Set up environment variable management
  - Configure database migrations for production
  - Set up CI/CD pipeline configuration
  - Create deployment documentation
  - Configure SSL/TLS certificates
  - _Requirements: All requirements (deployment is cross-cutting)_
