# Security Implementation Guide

This document outlines the security measures implemented in the African E-commerce backend API.

## 🔒 Security Features

### 1. Rate Limiting

Protects against brute force attacks and API abuse.

**Configuration:**
- **General API**: 100 requests per 15 minutes
- **Authentication**: 5 requests per 15 minutes
- **Password Reset**: 3 requests per hour
- **Registration**: 3 requests per hour

**Implementation:**
```typescript
import { apiLimiter, authLimiter } from './middleware/security';

app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
```

### 2. CSRF Protection

Validates that requests come from trusted origins.

**Features:**
- Origin header validation
- Referer header validation
- Automatic protection for state-changing requests (POST, PUT, DELETE, PATCH)

**Bypassed for:**
- GET, HEAD, OPTIONS requests
- Health check endpoints

### 3. SQL Injection Prevention

Detects and blocks common SQL injection patterns.

**Blocked Patterns:**
- SQL keywords (SELECT, INSERT, UPDATE, DELETE, etc.)
- SQL comments (--,  /*, */)
- SQL operators (OR, =, 1=1)
- Stored procedure calls (xp_, sp_)

### 4. XSS Prevention

Prevents cross-site scripting attacks.

**Blocked Content:**
- `<script>` tags
- `javascript:` protocol
- Event handlers (onclick, onload, etc.)
- `<iframe>`, `<object>`, `<embed>` tags

### 5. Security Headers

Comprehensive HTTP security headers using Helmet.js.

**Headers Configured:**
- **Content-Security-Policy**: Restricts resource loading
- **Strict-Transport-Security**: Forces HTTPS
- **X-Frame-Options**: Prevents clickjacking
- **X-Content-Type-Options**: Prevents MIME sniffing
- **X-XSS-Protection**: Enables browser XSS filter
- **Referrer-Policy**: Controls referrer information

### 6. CORS Configuration

Strict Cross-Origin Resource Sharing policy.

**Settings:**
- Allowed origins from environment variables
- Credentials enabled for authenticated requests
- Specific HTTP methods allowed
- Controlled headers

### 7. Input Validation

Comprehensive input validation and sanitization.

**Validation Functions:**
- Email format validation
- Phone number format validation
- Password strength validation
- Input sanitization (removes dangerous characters)

### 8. IP Filtering

Block requests from blacklisted IPs.

**Configuration:**
```env
BLACKLISTED_IPS=192.168.1.1,10.0.0.1
WHITELISTED_IPS=trusted.ip.address
```

### 9. Request Size Limiting

Prevents large payload attacks.

**Limits:**
- Maximum body size: 10MB
- Maximum URL length: 2048 characters
- Maximum header size: 8KB

### 10. Session Security

Secure session management.

**Features:**
- HTTP-only cookies
- Secure flag in production
- SameSite attribute
- Session timeout (30 minutes)
- Maximum concurrent sessions (5)

## 🛡️ Password Security

### Password Policy

- **Minimum length**: 8 characters
- **Required characters**:
  - At least one uppercase letter
  - At least one lowercase letter
  - At least one number
  - At least one special character (@$!%*?&)
- **Maximum length**: 128 characters
- **Password history**: Prevents reusing last 5 passwords
- **Password expiry**: 90 days

### Password Hashing

- **Algorithm**: bcrypt
- **Salt rounds**: 12
- **Automatic salting**: Each password gets unique salt

## 🔐 Authentication Security

### JWT Tokens

**Access Token:**
- Expiration: 15 minutes
- Used for API authentication
- Stored in HTTP-only cookies

**Refresh Token:**
- Expiration: 30 days
- Used to obtain new access tokens
- Stored in HTTP-only cookies

**Token Security:**
- Signed with secret keys
- Includes issuer and audience claims
- Type validation (access vs refresh)

### Account Lockout

Protects against brute force attacks.

**Policy:**
- Maximum failed attempts: 5
- Lockout duration: 30 minutes
- Counter reset: 24 hours

## 📝 Audit Logging

Comprehensive logging of security events.

**Logged Events:**
- Failed login attempts
- Password changes
- Account modifications
- Sensitive operations
- Security violations

## 🚨 Security Best Practices

### Environment Variables

**Required in Production:**
```env
# JWT Secrets (use strong random strings)
JWT_ACCESS_SECRET=your-strong-secret-here
JWT_REFRESH_SECRET=your-strong-secret-here

# Session Secret
SESSION_SECRET=your-session-secret-here

# Frontend URL
FRONTEND_URL=https://your-domain.com

# Database URL
DATABASE_URL=postgresql://...

# Email Service
SENDGRID_API_KEY=your-api-key

# SMS Service
TWILIO_ACCOUNT_SID=your-sid
TWILIO_AUTH_TOKEN=your-token
```

### HTTPS Configuration

**Production Requirements:**
- Always use HTTPS
- Enable HSTS headers
- Use valid SSL/TLS certificates
- Disable insecure protocols (TLS 1.0, 1.1)

### Database Security

**Best Practices:**
- Use parameterized queries (Prisma ORM)
- Principle of least privilege for database users
- Regular backups
- Encrypted connections
- No sensitive data in logs

### API Security

**Best Practices:**
- Always validate input
- Sanitize output
- Use authentication for sensitive endpoints
- Implement proper authorization
- Rate limit all endpoints
- Log security events

## 🔍 Security Testing

### Manual Testing

```bash
# Test rate limiting
for i in {1..10}; do curl http://localhost:5000/api/auth/login; done

# Test CSRF protection
curl -X POST http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'

# Test SQL injection
curl "http://localhost:5000/api/users?id=1' OR '1'='1"

# Test XSS
curl -X POST http://localhost:5000/api/users/profile \
  -H "Content-Type: application/json" \
  -d '{"name":"<script>alert(1)</script>"}'
```

### Automated Testing

```bash
# Run security tests
npm run test:security

# Check for vulnerabilities
npm audit

# Update dependencies
npm audit fix
```

## 🚀 Deployment Security

### Pre-Deployment Checklist

- [ ] All environment variables configured
- [ ] HTTPS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Database connections encrypted
- [ ] Secrets rotated
- [ ] Audit logging enabled
- [ ] Monitoring configured
- [ ] Backup strategy in place

### Monitoring

**Monitor for:**
- Failed authentication attempts
- Rate limit violations
- SQL injection attempts
- XSS attempts
- Unusual traffic patterns
- Error rates
- Response times

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

## 🆘 Security Incident Response

### If a Security Breach is Detected:

1. **Immediate Actions:**
   - Isolate affected systems
   - Preserve evidence
   - Notify security team

2. **Investigation:**
   - Review audit logs
   - Identify attack vector
   - Assess damage

3. **Remediation:**
   - Patch vulnerabilities
   - Rotate compromised credentials
   - Update security measures

4. **Communication:**
   - Notify affected users
   - Report to authorities if required
   - Document incident

## 📞 Security Contacts

- **Security Team**: security@african-ecommerce.com
- **Emergency**: +XXX-XXX-XXXX
- **Bug Bounty**: bugbounty@african-ecommerce.com

## 🔄 Regular Security Tasks

### Daily
- Monitor security logs
- Check for failed login attempts
- Review rate limit violations

### Weekly
- Review audit logs
- Check for dependency vulnerabilities
- Update blacklisted IPs

### Monthly
- Security audit
- Penetration testing
- Update security policies
- Review access controls

### Quarterly
- Comprehensive security review
- Update security documentation
- Security training for team
- Disaster recovery drill