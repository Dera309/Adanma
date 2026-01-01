const { MongoClient } = require('mongodb');

// Test MongoDB connection without Prisma
async function testConnection() {
  const uri = "mongodb+srv://chideraobia7_db_user:EMENIKE3aDD@cluster0.qye6pxs.mongodb.net/adanma_db?retryWrites=true&w=majority";
  
  console.log('🔍 Testing MongoDB Atlas connection...');
  console.log('📍 Cluster: cluster0.qye6pxs.mongodb.net');
  console.log('👤 User: chideraobia7_db_user');
  console.log('🗄️ Database: adanma_db');
  console.log('');

  const client = new MongoClient(uri, {
    serverSelectionTimeoutMS: 10000, // 10 second timeout
    connectTimeoutMS: 10000,
  });

  try {
    console.log('⏳ Attempting to connect...');
    await client.connect();
    
    console.log('✅ Connected successfully!');
    
    // Test database access
    const db = client.db('adanma_db');
    const result = await db.admin().ping();
    console.log('🏓 Ping successful:', result);
    
    // List collections
    const collections = await db.listCollections().toArray();
    console.log('📋 Collections found:', collections.length);
    
  } catch (error) {
    console.error('❌ Connection failed:');
    console.error('Error type:', error.constructor.name);
    console.error('Error message:', error.message);
    
    if (error.message.includes('authentication failed')) {
      console.log('\n💡 SOLUTION: Check your MongoDB Atlas password');
      console.log('   - Go to Database Access in MongoDB Atlas');
      console.log('   - Verify the password for user: chideraobia7_db_user');
    }
    
    if (error.message.includes('Server selection timeout')) {
      console.log('\n💡 POSSIBLE SOLUTIONS:');
      console.log('   1. Check IP whitelist in MongoDB Atlas Network Access');
      console.log('   2. Make sure cluster is not paused');
      console.log('   3. Check your internet connection');
      console.log('   4. Try adding 0.0.0.0/0 to whitelist temporarily');
    }
    
  } finally {
    await client.close();
  }
}

testConnection().catch(console.error);