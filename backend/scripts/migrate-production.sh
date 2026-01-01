#!/bin/bash
# Production Database Migration Script
# This script safely runs database migrations in production

set -e

echo "=========================================="
echo "Production Database Migration"
echo "=========================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
    echo "Error: DATABASE_URL environment variable is not set"
    exit 1
fi

# Backup database before migration
echo "Creating database backup..."
BACKUP_FILE="backups/backup-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p backups

# Extract database connection details from DATABASE_URL
DB_HOST=$(echo $DATABASE_URL | sed -n 's/.*@\(.*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/.*\/\(.*\)?.*/\1/p' | cut -d'?' -f1)
DB_USER=$(echo $DATABASE_URL | sed -n 's/.*:\/\/\(.*\):.*/\1/p')

echo "Backing up database: $DB_NAME"
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -f $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "Backup created successfully: $BACKUP_FILE"
else
    echo "Error: Backup failed"
    exit 1
fi

# Generate Prisma client
echo "Generating Prisma client..."
npx prisma generate

# Run migrations
echo "Running database migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo "Migrations completed successfully"
else
    echo "Error: Migration failed"
    echo "To restore from backup, run:"
    echo "pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME $BACKUP_FILE"
    exit 1
fi

# Verify migration
echo "Verifying database schema..."
npx prisma db pull --force

echo "=========================================="
echo "Migration completed successfully!"
echo "=========================================="
