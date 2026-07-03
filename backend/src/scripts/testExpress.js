import express from 'express';
import prisma from '../lib/prisma.js';

const app = express();

app.get('/health', (req, res) => {
  console.log('[ExpressTest] Hitting health');
  res.json({ status: 'ok' });
});

app.get('/products-count', async (req, res) => {
  console.log('[ExpressTest] Querying database...');
  try {
    const count = await prisma.product.count();
    console.log(`[ExpressTest] DB returned count: ${count}`);
    res.json({ count });
  } catch (err) {
    console.error('[ExpressTest] DB Error:', err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(5001, () => {
  console.log('[ExpressTest] Server listening on port 5001');
});
