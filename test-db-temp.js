const { MongoClient } = require('mongodb');

const MONGODB_URI = 'mongodb+srv://tasreehamnee_db_user:MpsCchTricSMFf7F@cluster0.4etd8ml.mongodb.net/?appName=Cluster0';

async function testConnection() {
  console.log('Testing connection to MongoDB Atlas...');
  const client = new MongoClient(MONGODB_URI, { connectTimeoutMS: 5000, serverSelectionTimeoutMS: 5000 });
  try {
    await client.connect();
    console.log('✅ Connection successful!');
    const db = client.db('AttendanceDB');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
  } finally {
    await client.close();
  }
}

testConnection();
