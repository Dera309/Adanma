import { execSync } from 'child_process';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function setupDatabase() {
  console.log('🔧 Setting up database...\n');

  try {
    // Check if DATABASE_URL is configured
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('username:password')) {
      console.error('❌ DATABASE_URL is not properly configured in .env file');
      console.log('\nPlease update your .env file with your MongoDB Atlas connection string:');
      console.log(' DATABASE_URL = "mongodb+srv://chideraobia7_db_user:EMENIKE3aDD_PASSWORD@cluster0.qye6pxs.mongodb.net/adanma_db?retryWrites=true&w=majority"');
      process.exit(1);
    }

    console.log('✓ Environment variables loaded');

    // Generate Prisma Client
    console.log('\n📦 Generating Prisma Client...');
    execSync('npx prisma generate', { stdio: 'inherit' });
    console.log('✓ Prisma Client generated');

    // Push schema to MongoDB
    console.log('\n🔄 Pushing schema to MongoDB...');
    execSync('npx prisma db push', { stdio: 'inherit' });
    console.log('✓ Schema pushed to MongoDB');

    console.log('\n✅ Database setup completed successfully!');
    console.log('\nYou can now:');
    console.log('  - Run "npm run dev" to start the development server');
    console.log('  - Run "npx prisma studio" to view your database\n');
  } catch (error) {
    console.error('\n❌ Database setup failed:', error);
    process.exit(1);
  }
}

setupDatabase();
