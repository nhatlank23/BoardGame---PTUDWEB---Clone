# OTP Authentication Implementation

## Overview

This document describes the OTP (One-Time Password) authentication flow implemented for user registration and password recovery.

## Features Implemented

### 1. Registration with Email Verification

- **Two-step registration process**:
  1. User fills registration form (username, email, password)
  2. System sends 6-digit OTP to email
  3. User enters OTP to verify email and complete registration

### 2. Password Recovery

- **Three-step recovery process**:
  1. User enters email address
  2. System sends OTP to email
  3. User verifies OTP
  4. User sets new password

### 3. Input Validation

- **Login validation**:

  - Email/username required
  - Password minimum 6 characters

- **Registration validation**:
  - Username minimum 3 characters
  - Email format validation (regex)
  - Password minimum 6 characters
  - Password confirmation match
  - Password strength indicator (weak/medium/strong)

## Backend Implementation

### Routes (`backend/routes/authRoutes.js`)

```javascript
POST / api / auth / send - register - otp; // Send OTP for registration
POST / api / auth / register; // Complete registration with OTP
POST / api / auth / login; // User login
POST / api / auth / forgot - password; // Request password reset
POST / api / auth / verify - otp; // Verify OTP
POST / api / auth / reset - password; // Set new password
GET / api / auth / me; // Get current user (protected)
POST / api / auth / logout; // Logout (protected)
```

### Controllers (`backend/controllers/authController.js`)

#### `sendRegisterOTP(req, res)`

- Validates email format
- Checks if username exists
- Checks if email exists
- Generates 6-digit OTP
- Stores OTP with 5-minute expiry
- Sends email with OTP

#### `register(req, res)`

- Verifies OTP before creating account
- Validates all input fields
- Checks password match
- Creates user account
- Returns JWT token

#### `forgotPassword(req, res)`

- Validates email exists
- Generates OTP
- Sends recovery email

#### `verifyOTP(req, res)`

- Validates OTP without consuming it
- Returns success if valid

#### `resetPassword(req, res)`

- Verifies OTP again and consumes it
- Updates user password
- Returns success message

### Email Service (`backend/configs/email.js`)

```javascript
sendOTPEmail(email, otp, subject);
```

- Sends HTML email with OTP
- Custom subject for different use cases
- Gmail SMTP configuration
- Environment variables: EMAIL_USER, EMAIL_PASSWORD

### OTP Storage (`backend/configs/otpStore.js`)

- In-memory storage with Map
- 5-minute expiry
- Functions:
  - `saveOTP(email, otp)` - Store OTP
  - `checkOTP(email, otp)` - Verify without deleting
  - `verifyOTP(email, otp)` - Verify and delete

## Frontend Implementation

### Components

#### Auth Page (`frontend/src/pages/Auth.jsx`)

- **Login Tab**: Email/username + password with validation
- **Register Tab**: Two-step process with OTP
- **Forgot Password**: Three-step recovery flow

#### State Management

```javascript
// Login
const [emailOrUsername, setEmailOrUsername] = useState("");
const [password, setPassword] = useState("");

// Register
const [username, setUsername] = useState("");
const [regEmail, setRegEmail] = useState("");
const [regPassword, setRegPassword] = useState("");
const [confirmPassword, setConfirmPassword] = useState("");
const [registerStep, setRegisterStep] = useState(1); // 1: form, 2: OTP
const [registerOTP, setRegisterOTP] = useState("");

// Forgot Password
const [forgotStep, setForgotStep] = useState(1); // 1: email, 2: OTP, 3: password
const [forgotEmail, setForgotEmail] = useState("");
const [otp, setOtp] = useState("");
const [newPassword, setNewPassword] = useState("");
const [confirmNewPassword, setConfirmNewPassword] = useState("");
```

### Services (`frontend/src/services/authService.js`)

```javascript
sendRegisterOTP(email, username); // Request OTP for registration
register(username, email, password, confirmPassword, otp);
login(emailOrUsername, password);
forgotPassword(email);
verifyOTP(email, otp);
resetPassword(email, otp, newPassword);
```

### Context (`frontend/src/context/AuthContext.jsx`)

- Manages authentication state
- Handles login/register/logout
- Stores user data and JWT token

## User Flow

### Registration Flow

1. User navigates to Auth page and selects "Register" tab
2. User fills form:
   - Username (min 3 chars)
   - Email (valid format)
   - Password (min 6 chars, shows strength indicator)
   - Confirm password (must match)
3. User clicks "Tiếp tục" (Continue)
4. Backend validates and sends OTP email
5. UI shows OTP input field
6. User enters 6-digit OTP
7. User clicks "Hoàn tất đăng ký" (Complete Registration)
8. Backend verifies OTP and creates account
9. User redirected to home page

### Password Recovery Flow

1. User clicks "Quên mật khẩu?" on login form
2. User enters email address
3. Backend sends OTP to email
4. User enters OTP
5. Backend verifies OTP
6. User enters new password and confirmation
7. Backend updates password
8. User redirected to login

## Security Features

### Backend Security

- Password hashing with bcrypt
- JWT token authentication
- OTP expiry (5 minutes)
- Rate limiting (recommended to add)
- Email verification before account creation
- Username/email uniqueness validation

### Frontend Validation

- Email format regex
- Password strength indicator
- Password confirmation match
- Minimum length requirements
- Trim whitespace from inputs
- Clear error messages

## Email Template

```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
  <h2 style="color: #333;">[Subject]</h2>
  <p>Mã OTP của bạn là:</p>
  <h1 style="color: #007bff; font-size: 32px; letter-spacing: 5px;">[OTP]</h1>
  <p>Mã này sẽ hết hạn sau 5 phút.</p>
  <p style="color: #999;">
    Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.
  </p>
</div>
```

## Environment Variables Required

```env
# Email Configuration
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASSWORD=your-app-specific-password

# JWT Configuration
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=24h
```

## Testing Checklist

### Registration

- [ ] Valid registration with correct OTP
- [ ] Invalid email format rejected
- [ ] Duplicate username rejected
- [ ] Duplicate email rejected
- [ ] Password mismatch rejected
- [ ] Incorrect OTP rejected
- [ ] Expired OTP rejected
- [ ] Password strength indicator works
- [ ] Email received successfully
- [ ] Account created and user logged in

### Login

- [ ] Valid login with email
- [ ] Valid login with username
- [ ] Invalid credentials rejected
- [ ] Validation messages shown
- [ ] Admin redirected to admin dashboard
- [ ] User redirected to home page

### Password Recovery

- [ ] Email sent successfully
- [ ] OTP verification works
- [ ] Password updated successfully
- [ ] Old password no longer works
- [ ] User can login with new password

## Future Enhancements

1. Add rate limiting for OTP requests
2. Add 2FA option for login
3. Add SMS OTP option
4. Add remember me functionality
5. Add password history to prevent reuse
6. Add account lockout after failed attempts
7. Add login activity log
8. Add email notification for suspicious activity

## Dependencies

- **Backend**: express, nodemailer, bcrypt, jsonwebtoken, knex
- **Frontend**: react, react-router-dom, react-hook-form (optional)

## Notes

- OTP is stored in-memory (not persistent)
- Consider Redis for production scaling
- Email service uses Gmail SMTP (may need different provider for production)
- Rate limiting should be added to prevent abuse
- Consider adding CAPTCHA for additional security
