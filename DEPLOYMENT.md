# Deployment Guide

## Quick Production Deployment

### Prerequisites
- Ubuntu 20.04+ server
- Docker & Docker Compose installed
- Domain with DNS configured
- Ports 80 and 443 open

### 1. Server Setup

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### 2. Clone and Configure

```bash
cd /opt
git clone <your-repo-url> african-ecommerce
cd african-ecommerce

# Create production environment file
cp .env.production.example .env.production
nano .env.production  # Edit with your values
```

### 3. SSL Certificates

```bash
# Install Certbot
sudo apt install certbot -y

# Get certificate
sudo certbot certonly --standalone -d your-domain.com

# Copy certificates
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/key.pem
```

### 4. Deploy

```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run deployment
./scripts/deploy.sh
```

### 5. Verify

```bash
# Check services
docker-compose -f docker-compose.prod.yml ps

# Test endpoints
curl https://your-domain.com/health
```

## Environment Variables

Key variables to configure in `.env.production`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@database:5432/dbname
DB_PASSWORD=<strong-password>

# JWT Secrets (generate with: openssl rand -base64 32)
JWT_ACCESS_SECRET=<secret>
JWT_REFRESH_SECRET=<secret>
SESSION_SECRET=<secret>

# Services
SENDGRID_API_KEY=<your-key>
TWILIO_ACCOUNT_SID=<your-sid>
TWILIO_AUTH_TOKEN=<your-token>

# Redis
REDIS_PASSWORD=<strong-password>

# Domain
FRONTEND_URL=https://your-domain.com
VITE_API_URL=https://your-domain.com/api
```

## Database Migrations

```bash
# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy

# Seed data (optional)
docker-compose -f docker-compose.prod.yml exec backend npm run db:seed
```

## Backup & Restore

```bash
# Backup
./scripts/backup-database.sh

# Restore
./scripts/restore-database.sh backups/backup-YYYYMMDD-HHMMSS.sql.gz
```

## Monitoring

```bash
# View logs
docker-compose -f docker-compose.prod.yml logs -f

# Check resource usage
docker stats

# Health checks
curl https://your-domain.com/health
curl https://your-domain.com/api/health
```

## Updates

```bash
git pull origin main
./scripts/deploy.sh
```

## Troubleshooting

**Container won't start:**
```bash
docker-compose -f docker-compose.prod.yml logs <service-name>
docker-compose -f docker-compose.prod.yml restart <service-name>
```

**Database connection issues:**
```bash
docker-compose -f docker-compose.prod.yml exec database psql -U $DB_USER -d $DB_NAME
```

**SSL certificate renewal:**
```bash
sudo certbot renew
sudo cp /etc/letsencrypt/live/your-domain.com/*.pem nginx/ssl/
docker-compose -f docker-compose.prod.yml restart nginx
```

## CI/CD with GitHub Actions

The repository includes automated CI/CD. Configure these secrets in GitHub:

- `PRODUCTION_HOST` - Server IP
- `PRODUCTION_USER` - SSH user
- `PRODUCTION_SSH_KEY` - SSH private key
- `SLACK_WEBHOOK` - (Optional) Slack notifications

Push to `main` branch triggers automatic deployment.
