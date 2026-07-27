const { MongoClient } = require('mongodb');

let clientPromise;

function getClient() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }

  if (!clientPromise) {
    const client = new MongoClient(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000
    });
    clientPromise = client.connect().catch(error => {
      clientPromise = undefined;
      throw error;
    });
  }

  return clientPromise;
}

async function getDatabase() {
  const client = await getClient();
  return client.db('nysc_survey');
}

module.exports = { getDatabase };
