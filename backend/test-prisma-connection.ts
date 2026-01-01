import { PrismaClient } from '@prisma/client';

async function testPrismaConnection() {
  console.log('🔍 Testing Prisma MongoDB connection...');
  console.log('📍 Database URL from .env file');
  console.log('');

  const prisma = new PrismaClient({
    log: ['query', 'info', 'warn', 'error'],
  });

  try {
    console.log('⏳ Attempting to connect with Prisma...');
    
    // Test basic connection
    await prisma.$connect();
    console.log('✅ Prisma connected successfully!');
    
    // Test database ping
    console.log('🏓 Testing database ping...');
    const result = await prisma.$runCommandRaw({ ping: 1 });
    console.log('✅ Ping successful:', result);
    
  } catch (error: any) {
    console.error('❌ Prisma connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error code:', error.code);
    console.error('Error message:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 AUTHENTICATION ISSUE:');
      console.log('   - Check MongoDB Atlas password for user: chideraobia7_db_user');
      console.log('   - Go to Database Access in MongoDB Atlas dashboard');
    }
    
    if (error.message.includes('Server selection timeout')) {
      console.log('\n💡 CONNECTION TIMEOUT ISSUE:');
      console.log('   1. Check IP whitelist in MongoDB Atlas Network Access');
      console.log('   2. Add your current IP address: https://whatismyipaddress.com/');
      console.log('   3. Or temporarily add 0.0.0.0/0 for testing');
      console.log('   4. Make sure cluster is not paused');
    }
    
    if (error.message.includes('InternalError')) {
      console.log('\n💡 INTERNAL ERROR ISSUE:');
      console.log('   1. MongoDB Atlas cluster might be experiencing issues');
      console.log('   2. Try restarting the cluster in Atlas dashboard');
      console.log('   3. Check MongoDB Atlas status page');
    }
    
  } finally {
    await prisma.$disconnect();
  }
}

testPrismaConnection().catch(console.error);