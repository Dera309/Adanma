require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

async function testConnection() {
  console.log('🔄 Testing MongoDB Atlas connection for Adanma...\n');
  
  // Check if password is set
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in .env file');
    return;
  }
  
  if (dbUrl.includes('your_password_here')) {
    console.error('❌ Password not set in .env file!');
    console.log('💡 SOLUTION: Replace "your_password_here" with your actual MongoDB Atlas password');
    console.log('   File: backend/.env');
    console.log('   Line: DATABASE_URL="mongodb+srv://chideraobia7_db_user:YOUR_ACTUAL_PASSWORD@..."');
    return;
  }
  
  console.log('✅ Password appears to be set');
  console.log('🔗 Connection URL (masked):', dbUrl.replace(/:[^:@]*@/, ':***@'));
  console.log('');
  
  const prisma = new PrismaClient();
  
  try {
    console.log('🔄 Step 1: Connecting to MongoDB Atlas...');
    await prisma.$connect();
    console.log('✅ Step 1: Connected successfully!');
    
    console.log('🔄 Step 2: Testing database ping...');
    await prisma.$runCommandRaw({ ping: 1 });
    console.log('✅ Step 2: Ping successful!');
    
    console.log('🔄 Step 3: Testing database operations...');
    // Try to access the database (this will create it if it doesn't exist)
    const result = await prisma.$runCommandRaw({ 
      listCollections: 1, 
      nameOnly: true 
    });
    console.log('✅ Step 3: Database operations working!');
    
    console.log('\n🎉 SUCCESS: MongoDB Atlas connection is working perfectly!');
    console.log('✅ Database: adanma_db');
    console.log('✅ User: chideraobia7_db_user');
    console.log('✅ Cluster: cluster0.qye6pxs.mongodb.net');
    console.log('\n🚀 You can now start the Adanma backend server with: npm run dev');
    
  } catch (error) {
    console.error('\n❌ Connection failed:', error.message);
    
    if (error.message.includes('authentication failed') || error.message.includes('bad auth')) {
      console.log('\n💡 SOLUTION: Authentication failed - check your password');
      console.log('   1. Go to MongoDB Atlas → Database Access');
      console.log('   2. Find user: chideraobia7_db_user');
      console.log('   3. Reset password or copy correct password');
      console.log('   4. Update backend/.env file');
      
    } else if (error.message.includes('Server selection timeout') || error.message.includes('No available servers')) {
      console.log('\n💡 SOLUTION: Network/Access issue');
      console.log('   1. Check MongoDB Atlas → Network Access');
      console.log('   2. Add your current IP address');
      console.log('   3. Or use 0.0.0.0/0 for testing');
      console.log('   4. Make sure cluster is not paused');
      
    } else if (error.message.includes('InternalError')) {
      console.log('\n💡 SOLUTION: SSL/TLS or authentication issue');
      console.log('   1. Double-check your password');
      console.log('   2. Check Network Access settings');
      console.log('   3. Try whitelisting all IPs (0.0.0.0/0) for testing');
      
    } else {
      console.log('\n💡 GENERAL SOLUTIONS:');
      console.log('   1. Check internet connection');
      console.log('   2. Verify MongoDB Atlas cluster is active');
      console.log('   3. Check all credentials in .env file');
    }
    
    console.log('\n📚 For detailed help, see: MONGODB-ATLAS-SETUP.md');
    
  } finally {
    await prisma.$disconnect();
  }
}

testConnection().catch(console.error);