-- Add isActive column to users table
ALTER TABLE users ADD COLUMN isActive BOOLEAN DEFAULT 1;

-- Update all existing users to be active
UPDATE users SET isActive = 1 WHERE isActive IS NULL;