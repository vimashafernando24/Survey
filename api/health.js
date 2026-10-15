const { getDatabase } = require('./_database');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(200).end('ok');
  } catch (error) {
    console.error('Health check failed:', error);
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    return res.status(503).end('unavailable');
  }
};
