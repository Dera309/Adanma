#!/bin/bash
# Deployment Script for African E-commerce Platform
# This script handles the complete deployment process

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
COMPOSE_FILE="docker-compose.prod.yml"

echo -e "${GREEN}=========================================="
echo "African E-commerce Platform Deployment"
echo "Environment: $ENVIRONMENT"
echo -e "==========================================${NC}"

# Check if .env.production exists
if [ ! -f ".env.production" ]; then
    echo -e "${RED}Error: .env.production file not found${NC}"
    echo "Please create .env.production from .env.production.example"
    exit 1
fi

# Load environment variables
export $(cat .env.production | grep -v '^#' | xargs)

# Pre-deployment checks
echo -e "${YELLOW}Running pre-deployment checks...${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Error: Docker is not installed${NC}"
    exit 1
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Error: Docker Compose is not installed${NC}"
    exit 1
fi

# Check required environment variables
REQUIRED_VARS=(
    "DATABASE_URL"
    "JWT_ACCESS_SECRET"
    "JWT_REFRESH_SECRET"
    "SESSION_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: Required environment variable $var is not set${NC}"
        exit 1
    fi
done

echo -e "${GREEN}✓ Pre-deployment checks passed${NC}"

# Pull latest code
echo -e "${YELLOW}Pulling latest code...${NC}"
git pull origin main

# Build Docker images
echo -e "${YELLOW}Building Docker images...${NC}"
docker-compose -f $COMPOSE_FILE build --no-cache

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f $COMPOSE_FILE down

# Start database first
echo -e "${YELLOW}Starting database...${NC}"
docker-compose -f $COMPOSE_FILE up -d database redis

# Wait for database to be ready
echo -e "${YELLOW}Waiting for database to be ready...${NC}"
sleep 10

# Run database migrations
echo -e "${YELLOW}Running database migrations...${NC}"
docker-compose -f $COMPOSE_FILE run --rm backend sh -c "npx prisma generate && npx prisma migrate deploy"

# Start all services
echo -e "${YELLOW}Starting all services...${NC}"
docker-compose -f $COMPOSE_FILE up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 15

# Health checks
echo -e "${YELLOW}Running health checks...${NC}"

# Check backend health
BACKEND_HEALTH=$(docker-compose -f $COMPOSE_FILE exec -T backend wget -qO- http://localhost:5000/health || echo "failed")
if [ "$BACKEND_HEALTH" != "failed" ]; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    docker-compose -f $COMPOSE_FILE logs backend
    exit 1
fi

# Check frontend health
FRONTEND_HEALTH=$(docker-compose -f $COMPOSE_FILE exec -T frontend wget -qO- http://localhost:80/health || echo "failed")
if [ "$FRONTEND_HEALTH" != "failed" ]; then
    echo -e "${GREEN}✓ Frontend is healthy${NC}"
else
    echo -e "${RED}✗ Frontend health check failed${NC}"
    docker-compose -f $COMPOSE_FILE logs frontend
    exit 1
fi

# Cleanup old images
echo -e "${YELLOW}Cleaning up old Docker images...${NC}"
docker system prune -af --volumes

# Display running containers
echo -e "${YELLOW}Running containers:${NC}"
docker-compose -f $COMPOSE_FILE ps

echo -e "${GREEN}=========================================="
echo "Deployment completed successfully!"
echo -e "==========================================${NC}"

# Display access information
echo -e "${GREEN}Application is now running:${NC}"
echo "Frontend: https://your-domain.com"
echo "Backend API: https://your-domain.com/api"
echo "Health Check: https://your-domain.com/health"
echo ""
echo -e "${YELLOW}To view logs:${NC}"
echo "docker-compose -f $COMPOSE_FILE logs -f"
echo ""
echo -e "${YELLOW}To stop services:${NC}"
echo "docker-compose -f $COMPOSE_FILE down"
