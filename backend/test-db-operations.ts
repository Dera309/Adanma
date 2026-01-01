import prisma from './src/config/database';

async function testDatabaseOperations() {
  console.log('🧪 Testing Database Operations...');
  
  try {
    // Test 1: Try to connect
    console.log('1. Testing connection...');
    await prisma.$connect();
    console.log('✅ Connection successful');
    
    // Test 2: Try to count users (should work even if empty)
    console.log('2. Testing user count...');
    const userCount = await prisma.user.count();
    console.log(`✅ User count: ${userCount}`);
    
    // Test 3: Try to create a test user
    console.log('3. Testing user creation...');
    const testUser = await prisma.user.create({
      data: {
        email: 'test-db@example.com',
        passwordHash: 'test-hash',
        authProvider: 'EMAIL',
        emailVerified: false,
        roles: ['BUYER']
      }
    });
    console.log('✅ Test user created:', testUser.id);
    
    // Test 4: Clean up test user
    console.log('4. Cleaning up test user...');
    await prisma.user.delete({
      where: { id: testUser.id }
    });
    console.log('✅ Test user deleted');
    
    console.log('🎉 All database operations successful!');
    
  } catch (error) {
    console.error('❌ Database operation failed:', error);
    
    if (error.message.includes('Server selection timeout')) {
      console.log('💡 This is a MongoDB Atlas connectivity issue');
      console.log('   - Check your IP whitelist in MongoDB Atlas');
      console.log('   - Ensure cluster is not paused');
      console.log('   - Verify internet connection');
    }
  } finally {
    await prisma.$disconnect();
  }
}

testDatabaseOperations().catch(console.error);