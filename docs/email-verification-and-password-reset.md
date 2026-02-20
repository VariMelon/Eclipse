# Email Verification & Password Reset Implementation

## Changes Made

### 1. **Database Schema Updates** (`prisma/schema.prisma`)
Added to User model:
- `emailVerified`: DateTime (null until verified)
- `emailVerificationToken`: String (generates on signup)
- `emailVerificationExpires`: DateTime (2 days from signup)

New model: `PasswordReset`
- Stores password reset tokens with 24-hour expiration
- Links to User via userId with cascade delete

### 2. **Authentication Flow**

#### Sign Up (`pages/api/signup.ts`)
- Generates verification token on registration
- Sets 2-day expiration for verification
- Note: Email sending not yet implemented (TODO)

#### Sign In (`app/auth/signin/page.tsx`)
- Added "Forgot password?" link
- Shows verification status messages
- Handles email_not_verified error specifically
- Password reset form collects email

#### Auth Verification (`lib/auth.ts`)
- Checks `emailVerified` field before allowing login
- Logs auth failures with safe username prefix
- Throws EmailNotVerified error for unverified accounts

### 3. **Email Verification Endpoint** (`app/api/auth/verify-email/route.ts`)
- GET endpoint: `/api/auth/verify-email?token=...&email=...`
- Validates token and expiration
- Auto-deletes user if token expired (2 days)
- Redirects to signin with success message

### 4. **Password Reset Flow**

#### Request Password Reset (`app/api/auth/password-reset/route.ts`)
- POST endpoint: `/api/auth/password-reset`
- Accepts email address
- Generates 24-hour reset token
- Returns same message for security (doesn't reveal if user exists)
- Note: Email sending not yet implemented (TODO)

#### Confirm Password Reset (`app/api/auth/reset-password/route.ts`)
- POST endpoint: `/api/auth/reset-password`
- Accepts token and new password
- Validates token expiration
- Hashes password and updates user
- Deletes used reset token

#### Password Reset Page (`app/auth/reset-password/page.tsx`)
- GET endpoint: `/auth/reset-password?token=...`
- Form to set new password with confirmation
- Shows success message on completion

### 5. **Cleanup Job** (`scripts/cleanup-unverified-users.mjs`)
- Deletes users with expired verification tokens
- Run periodically (e.g., every hour via cron)
- Command: `node scripts/cleanup-unverified-users.mjs`

### 6. **Key Features**
✅ **Email verification required** - Can't sign in until verified
✅ **2-day verification window** - Auto-delete unverified accounts after 2 days
✅ **Unique email enforcement** - Already enforced in schema
✅ **Case-insensitive usernames** - Already working from previous fix
✅ **Password reset** - Full flow implemented
✅ **Safe error messages** - Don't leak if email exists
✅ **Masked logging** - Username prefixes in logs (st***)

## Deployment Steps

### Before Deploy
1. Run Prisma migration to add new schema fields:
   ```bash
   npx prisma migrate deploy
   ```

2. Regenerate Prisma client:
   ```bash
   npm run postinstall
   ```

### After Deploy
1. Set up periodic cleanup job to run hourly:
   ```bash
   # Linux/macOS cron:
   0 * * * * cd /path/to/app && node scripts/cleanup-unverified-users.mjs
   
   # Or use scheduler on hosting platform (Vercel, etc.)
   ```

2. **IMPORTANT: Configure Email Service**
   - Update email sending in signup and password-reset handlers
   - Currently marked with `// TODO: Send verification email`
   - Recommended: Use SendGrid, Resend, or similar

### Environment Variables Needed
- `NEXTAUTH_SECRET` - Already configured
- Email service credentials (once implemented)

## TODO: Email Integration

The following need email service implementation:

1. **Signup Verification Email**
   - File: `pages/api/signup.ts` (line 101)
   - Content: Link to `/api/auth/verify-email?token=...&email=...`
   - Subject: "Verify your Eclipse account"

2. **Password Reset Email**
   - File: `app/api/auth/password-reset/route.ts` (line 43)
   - Content: Link to `/auth/reset-password?token=...`
   - Subject: "Reset your Eclipse password"

## Testing

All auth tests pass:
```bash
npm run test -- tests/pages/signin.test.ts tests/pages/signup.test.ts
# Result: 15/15 tests passing ✅
```

## Security Notes

- Passwords hashed with bcryptjs (10 rounds)
- Reset tokens: random 32-byte hex strings
- Verification tokens: random 32-byte hex strings
- Token expiry: 24 hours for password reset, 2 days for email verification
- Error messages don't leak whether user exists
- Unverified accounts auto-delete after 2 days
