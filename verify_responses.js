require('dotenv').config();
const { MongoClient } = require('mongodb');

async function verifyResponses() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set in .env');
    process.exit(1);
  }
  
  const client = new MongoClient(uri);
  
  try {
    await client.connect();
    const db = client.db('nysc_survey');
    const collection = db.collection('survey_responses');
    
    // Get count
    const count = await collection.countDocuments();
    console.log(`\n✓ Total responses stored: ${count}`);
    
    // Retrieve only non-sensitive metadata from the latest response.
    const latest = await collection.findOne(
      {},
      {
        sort: { createdAt: -1 },
        projection: { _id: 0, createdAt: 1, schema_version: 1 }
      }
    );
    
    if (latest) {
      console.log(`✓ Stored at: ${latest.createdAt}`);
      
      // Check schema version without retrieving or printing participant answers.
      const schemaVersion = latest.schema_version || 'v1';
      console.log(`✓ Schema version: ${schemaVersion}`);
      
      console.log('\n✓ Database connection successful and responses are being stored!');
    } else {
      console.log('⚠ No responses found in collection');
    }
  } catch (error) {
    console.error('✗ Error:', error.message);
    process.exit(1);
  } finally {
    await client.close();
  }
}

verifyResponses();
