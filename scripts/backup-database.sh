#!/bin/bash
# Database Backup Script
# Creates automated backups of the PostgreSQL database

set -e

# Configuration
BACKUP_DIR="./backups"
RETENTION_DAYS=30
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup-$TIMESTAMP.sql"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=========================================="
echo "Database Backup Script"
echo -e "==========================================${NC}"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env.production file not found${NC}"
    exit 1
fi

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo -e "${RED}Error: DATABASE_URL environment variable is not set${NC}"
    exit 1
fi

# Extract database connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)?.*/\1/p' | cut -d'?' -f1)
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\(.*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/.*:\/\/.*:\(.*\)@.*/\1/p')

echo -e "${YELLOW}Creating backup of database: $DB_NAME${NC}"

# Create backup using Docker
docker-compose -f docker-compose.prod.yml exec -T database pg_dump \
    -U $DB_USER \
    -d $DB_NAME \
    -F c \
    > $BACKUP_FILE

if [ $? -eq 0 ]; then
    # Compress backup
    gzip $BACKUP_FILE
    BACKUP_FILE="$BACKUP_FILE.gz"
    
    # Get file size
    SIZE=$(du -h $BACKUP_FILE | cut -f1)
    
    echo -e "${GREEN}✓ Backup created successfully${NC}"
    echo "File: $BACKUP_FILE"
    echo "Size: $SIZE"
else
    echo -e "${RED}✗ Backup failed${NC}"
    exit 1
fi

# Remove old backups
echo -e "${YELLOW}Removing backups older than $RETENTION_DAYS days...${NC}"
find $BACKUP_DIR -name "backup-*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete

# List recent backups
echo -e "${YELLOW}Recent backups:${NC}"
ls -lh $BACKUP_DIR/backup-*.sql.gz | tail -5

echo -e "${GREEN}=========================================="
echo "Backup completed successfully!"
echo -e "==========================================${NC}"
