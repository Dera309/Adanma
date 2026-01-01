// Simple test to check database connection
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    
    // Create Prisma client with SQLite
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'file:./backend/dev.db'
        }
      }
    });
    
    // Test connection
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    
    // Test a simple query
    const userCount = await prisma.user.count();
    console.log(`✅ Database query successful! User count: ${userCount}`);
    
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully!');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Full error:', error);
  }
}

testConnection();