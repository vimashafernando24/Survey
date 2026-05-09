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
      
      // Check schema version and survey data
      const schemaVersion = latest.schema_version || 'v1';
      console.log(`✓ Schema version: ${schemaVersion}`);
      if (schemaVersion === 'v2') {
        const firstAnswer = latest.answers && Object.values(latest.answers)[0];
        if (firstAnswer) {
          console.log(`✓ Survey data detected: ${firstAnswer.variable} = ${firstAnswer.value}`);
        }
      } else {
        if (latest.age_group) {
          console.log(`✓ Survey data detected (v1): age_group = ${latest.age_group}`);
        }
        if (latest.test_data) {
          console.log(`✓ Test data detected: ${latest.test_data}`);
        }
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
