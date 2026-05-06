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
    
    // Get latest response
    const latest = await collection.findOne({}, { sort: { createdAt: -1 } });
    
    if (latest) {
      console.log(`✓ Most recent response ID: ${latest._id}`);
      console.log(`✓ Stored at: ${latest.createdAt}`);
      
      // Check if it has survey data
      if (latest.age_group) {
        console.log(`✓ Survey data detected: age_group = ${latest.age_group}`);
      }
      if (latest.test_data) {
        console.log(`✓ Test data detected: ${latest.test_data}`);
      }
      
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
