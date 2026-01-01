# Deployment Guide

This guide covers the deployment process for the African E-commerce Platform.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [SSL/TLS Configuration](#ssltls-configuration)
4. [Database Setup](#database-setup)
5. [Deployment Methods](#deployment-methods)
6. [Post-Deployment](#post-deployment)
7. [Monitoring](#monitoring)
8. [Backup and Restore](#backup-and-restore)
9. [Troubleshooting](#troubleshooting)

## Prerequisites

### Server Requirements

- **Operating System**: Ubuntu 20.04 LTS or later (recommended)
- **CPU**: Minimum 2 cores (4 cores recommended for production)
- **RAM**: Minimum 4GB (8GB recommended for production)
- **Storage**: Minimum 50GB SSD
- **Network**: Static IP address with open ports 80 (HTTP) and 443 (HTTPS)

### Software Requirements

- Docker Engine 24.0 or later
- Docker Compose 2.20 or later
- Git 2.30 or later
- PostgreSQL client tools (for backup/restore)

### Installation

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install PostgreSQL client
sudo apt install postgresql-client -y

# Verify installations
docker --version
docker-compose --version
psql --version
```

## Environment Setup

### 1. Clone Repository

```bash
cd /opt
sudo git clone https://github.com/your-org/african-ecommerce.git
cd african-ecommerce
```

### 2. Configure Environment Variables

```bash
# Copy example environment file
cp .env.production.example .env.production

# Edit environment file
nano .env.production
```

### Required Environment Variables

#### Application Settings
```bash
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://your-domain.com
```

#### Database Configuration
```bash
DATABASE_URL=postgresql://username:password@database:5432/african_ecommerce
DB_USER=your_db_user
DB_PASSWORD=your_secure_password
DB_NAME=african_ecommerce
```

#### JWT Secrets
Generate strong secrets using:
```bash
openssl rand -base64 32
```

```bash
JWT_ACCESS_SECRET=<generated-secret>
JWT_REFRESH_SECRET=<generated-secret>
SESSION_SECRET=<generated-secret>
```

#### Email Service (SendGrid)
```bash
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@your-domain.com
SENDGRID_FROM_NAME=African E-commerce
```

#### SMS Service (Twilio)
```bash
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890
```

#### OAuth Providers
```bash
FACEBOOK_APP_ID=your-facebook-app-id
FACEBOOK_APP_SECRET=your-facebook-app-secret
FACEBOOK_CALLBACK_URL=https://your-domain.com/api/auth/facebook/callback
```

#### Redis
```bash
REDIS_PASSWORD=your-redis-password
```

#### Monitoring
```bash
SENTRY_DSN=your-sentry-dsn
LOG_LEVEL=info
```

## SSL/TLS Configuration

### Option 1: Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo apt install certbot -y

# Obtain certificate
sudo certbot certonly --standalone -d your-domain.com -d www.your-domain.com

# Copy certificates
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem

# Set up auto-renewal
sudo crontab -e
# Add: 0 0 * * * certbot renew --quiet && cp /etc/letsencrypt/live/your-domain.com/*.pem /opt/african-ecommerce/nginx/ssl/
```

### Option 2: Self-Signed Certificate (Development Only)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/key.pem \
  -out nginx/ssl/cert.pem \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=your-domain.com"
```

## Database Setup

### Initialize Database

```bash
# Start database service
docker-compose -f docker-compose.prod.yml up -d database

# Wait for database to be ready
sleep 10

# Run migrations
docker-compose -f docker-compose.prod.yml run --rm backend npx prisma migrate deploy

# (Optional) Seed initial data
docker-compose -f docker-compose.prod.yml run --rm backend npm run db:seed
```

## Deployment Methods

### Method 1: Automated Deployment Script (Recommended)

```bash
# Make script executable
chmod +x scripts/deploy.sh

# Run deployment
./scripts/deploy.sh production
```

The script will:
- Validate environment configuration
- Pull latest code
- Build Docker images
- Run database migrations
- Start all services
- Perform health checks
- Clean up old images

### Method 2: Manual Deployment

```bash
# Pull latest code
git pull origin main

# Build images
docker-compose -f docker-compose.prod.yml build --no-cache

# Stop existing containers
docker-compose -f docker-compose.prod.yml down

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Check status
docker-compose -f docker-compose.prod.yml ps
```

### Method 3: CI/CD Pipeline (GitHub Actions)

The repository includes a GitHub Actions workflow that automatically:
- Runs tests on push/PR
- Builds Docker images
- Pushes to container registry
- Deploys to production server

#### Setup GitHub Secrets

In your GitHub repository settings, add these secrets:

```
PRODUCTION_HOST=your-server-ip
PRODUCTION_USER=deploy-user
PRODUCTION_SSH_KEY=<your-ssh-private-key>
SLACK_WEBHOOK=<optional-slack-webhook>
```

## Post-Deployment

### 1. Verify Services

```bash
# Check running containers
docker-compose -f docker-compose.prod.yml ps

# Check logs
docker-compose -f docker-compose.prod.yml logs -f

# Test health endpoints
curl https://your-domain.com/health
curl https://your-domain.com/api/health
```

### 2. Configure DNS

Point your domain to the server IP:
```
A Record: your-domain.com → your-server-ip
A Record: www.your-domain.com → your-server-ip
```

### 3. Configure Firewall

```bash
# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH
sudo ufw enable
```

### 4. Set Up Monitoring

Configure monitoring tools:
- Application monitoring: Sentry
- Server monitoring: Prometheus + Grafana
- Uptime monitoring: UptimeRobot or Pingdom

## Monitoring

### View Logs

```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend

# Last 100 lines
docker-compose -f docker-compose.prod.yml logs --tail=100 backend
```

### Access Metrics

```bash
# Application metrics
curl http://localhost/metrics

# Container stats
docker stats
```

### Health Checks

```bash
# Application health
curl https://your-domain.com/health

# Database health
docker-compose -f docker-compose.prod.yml exec database pg_isready

# Redis health
docker-compose -f docker-compose.prod.yml exec redis redis-cli ping
```

## Backup and Restore

### Automated Backups

```bash
# Make backup script executable
chmod +x scripts/backup-database.sh

# Run manual backup
./scripts/backup-database.sh

# Set up automated daily backups
crontab -e
# Add: 0 2 * * * /opt/african-ecommerce/scripts/backup-database.sh
```

### Manual Backup

```bash
# Create backup
docker-compose -f docker-compose.prod.yml exec database pg_dump \
  -U $DB_USER -d $DB_NAME -F c > backup.sql

# Compress backup
gzip backup.sql
```

### Restore from Backup

```bash
# Make restore script executable
chmod +x scripts/restore-database.sh

# List available backups
ls -lh backups/

# Restore from backup
./scripts/restore-database.sh backups/backup-20240101-120000.sql.gz
```

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs <service-name>

# Check container status
docker-compose -f docker-compose.prod.yml ps

# Restart service
docker-compose -f docker-compose.prod.yml restart <service-name>
```

### Database Connection Issues

```bash
# Check database is running
docker-compose -f docker-compose.prod.yml ps database

# Test database connection
docker-compose -f docker-compose.prod.yml exec database psql -U $DB_USER -d $DB_NAME -c "SELECT 1"

# Check DATABASE_URL format
echo $DATABASE_URL
```

### SSL Certificate Issues

```bash
# Check certificate validity
openssl x509 -in nginx/ssl/cert.pem -text -noout

# Renew Let's Encrypt certificate
sudo certbot renew --force-renewal

# Copy renewed certificates
sudo cp /etc/letsencrypt/live/your-domain.com/*.pem nginx/ssl/
docker-compose -f docker-compose.prod.yml restart nginx
```

### High Memory Usage

```bash
# Check container memory usage
docker stats

# Restart services to free memory
docker-compose -f docker-compose.prod.yml restart

# Clean up unused resources
docker system prune -af
```

### Application Errors

```bash
# Check application logs
docker-compose -f docker-compose.prod.yml logs backend | tail -100

# Check error tracking (Sentry)
# Visit your Sentry dashboard

# Restart backend
docker-compose -f docker-compose.prod.yml restart backend
```

## Scaling

### Horizontal Scaling

To scale backend instances:

```bash
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

Update nginx configuration to load balance across instances.

### Vertical Scaling

Update resource limits in `docker-compose.prod.yml`:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

## Security Checklist

- [ ] Strong passwords for all services
- [ ] SSL/TLS certificates configured
- [ ] Firewall rules configured
- [ ] Environment variables secured
- [ ] Database backups automated
- [ ] Monitoring and alerting set up
- [ ] Rate limiting enabled
- [ ] CORS properly configured
- [ ] Security headers enabled
- [ ] Regular security updates scheduled

## Maintenance

### Regular Tasks

**Daily:**
- Monitor application logs
- Check error rates
- Verify backups completed

**Weekly:**
- Review security alerts
- Check disk space
- Update dependencies

**Monthly:**
- Security patches
- Performance optimization
- Backup testing

### Updates

```bash
# Pull latest code
git pull origin main

# Rebuild and restart
./scripts/deploy.sh production
```

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/african-ecommerce/issues
- Documentation: https://docs.your-domain.com
- Email: support@your-domain.com
