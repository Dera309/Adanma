#!/bin/bash
# Database Restore Script
# Restores database from a backup file

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo "Usage: $0 <backup-file>"
    echo ""
    echo "Available backups:"
    ls -lh ./backups/backup-*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

echo -e "${GREEN}=========================================="
echo "Database Restore Script"
echo -e "==========================================${NC}"

# Load environment variables
if [ -f ".env.production" ]; then
    export $(cat .env.production | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env.production file not found${NC}"
    exit 1
fi

# Extract database connection details
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)?.*/\1/p' | cut -d'?' -f1)
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\(.*\):.*/\1/p')

echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo -e "${YELLOW}Target database: $DB_NAME${NC}"
echo ""
echo -e "${RED}WARNING: This will overwrite the current database!${NC}"
read -p "Are you sure you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo "Restore cancelled"
    exit 0
fi

# Create a safety backup before restore
echo -e "${YELLOW}Creating safety backup of current database...${NC}"
SAFETY_BACKUP="./backups/pre-restore-$(date +%Y%m%d-%H%M%S).sql"
docker-compose -f docker-compose.prod.yml exec -T database pg_dump \
    -U $DB_USER \
    -d $DB_NAME \
    -F c \
    > $SAFETY_BACKUP

if [ $? -eq 0 ]; then
    gzip $SAFETY_BACKUP
    echo -e "${GREEN}✓ Safety backup created: $SAFETY_BACKUP.gz${NC}"
else
    echo -e "${RED}✗ Safety backup failed${NC}"
    exit 1
fi

# Decompress backup if needed
RESTORE_FILE=$BACKUP_FILE
if [[ $BACKUP_FILE == *.gz ]]; then
    echo -e "${YELLOW}Decompressing backup...${NC}"
    RESTORE_FILE="${BACKUP_FILE%.gz}"
    gunzip -c $BACKUP_FILE > $RESTORE_FILE
fi

# Stop backend to prevent connections
echo -e "${YELLOW}Stopping backend service...${NC}"
docker-compose -f docker-compose.prod.yml stop backend

# Restore database
echo -e "${YELLOW}Restoring database...${NC}"
docker-compose -f docker-compose.prod.yml exec -T database pg_restore \
    -U $DB_USER \
    -d $DB_NAME \
    --clean \
    --if-exists \
    < $RESTORE_FILE

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Database restored successfully${NC}"
    
    # Clean up decompressed file if we created it
    if [[ $BACKUP_FILE == *.gz ]]; then
        rm $RESTORE_FILE
    fi
else
    echo -e "${RED}✗ Database restore failed${NC}"
    echo "You can restore from the safety backup: $SAFETY_BACKUP.gz"
    exit 1
fi

# Start backend
echo -e "${YELLOW}Starting backend service...${NC}"
docker-compose -f docker-compose.prod.yml start backend

# Wait for backend to be ready
sleep 10

# Health check
echo -e "${YELLOW}Running health check...${NC}"
HEALTH=$(docker-compose -f docker-compose.prod.yml exec -T backend wget -qO- http://localhost:5000/health || echo "failed")

if [ "$HEALTH" != "failed" ]; then
    echo -e "${GREEN}✓ Backend is healthy${NC}"
else
    echo -e "${RED}✗ Backend health check failed${NC}"
    docker-compose -f docker-compose.prod.yml logs backend
fi

echo -e "${GREEN}=========================================="
echo "Restore completed successfully!"
echo -e "==========================================${NC}"
