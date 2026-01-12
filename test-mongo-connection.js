const { MongoClient } = require('mongodb');
require('dotenv').config({ path: './backend/.env' });

async function testConnection() {
  const uri = process.env.DATABASE_URL;
  if (!uri) {
    console.log('No DATABASE_URL found');
    return;
  }

  const client = new MongoClient(uri);

  try {
    console.log('Connecting to MongoDB...');
    await client.connect();
    console.log('Connected successfully!');
    await client.db("admin").command({ ping: 1 });
    console.log('Ping successful!');
  } catch (error) {
    console.error('Connection failed:', error.message);
  } finally {
    await client.close();
  }
}

testConnection();