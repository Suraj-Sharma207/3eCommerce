import axios from 'axios';

const BASE_URL = 'http://localhost:5000';

const endpoints = [
  { name: 'Branding', url: '/api/branding' },
  { name: 'Settings Public', url: '/api/settings/public' },
  { name: 'Shop Banner', url: '/api/shop-banner' },
  { name: 'Categories', url: '/api/products/categories' },
  { name: 'Products Page 1', url: '/api/products?page=1&limit=15&includeInventoryCounts=false' }
];

async function measureEndpoint(name, url) {
  console.log(`\n--- Measuring ${name} (${url}) ---`);
  
  // 1. First Run (Cache Miss / Fresh)
  // We pass a cache buster parameter to ensure it hits the DB/Fresh path if needed,
  // or we know the first request is a miss because the server just started.
  const start1 = performance.now();
  try {
    const res1 = await axios.get(`${BASE_URL}${url}`, {
      headers: { 'X-Bypass-Cache': 'true' } // Force bypass cache to measure fresh DB time
    });
    const duration1 = performance.now() - start1;
    console.log(`Fresh DB Query / Cache Miss: ${duration1.toFixed(2)}ms | Status: ${res1.status}`);
  } catch (err) {
    console.error(`Fresh DB Query failed: ${err.message}`);
  }

  // 2. Second Run (Cache Hit)
  // Now we do a normal request which should hit the cache (if cached).
  const start2 = performance.now();
  try {
    const res2 = await axios.get(`${BASE_URL}${url}`);
    const duration2 = performance.now() - start2;
    console.log(`Cache Hit / Cached Response: ${duration2.toFixed(2)}ms | Status: ${res2.status}`);
  } catch (err) {
    console.error(`Cached Query failed: ${err.message}`);
  }
}

async function runMeasurements() {
  console.log('🚀 Running Endpoint Latency Measurements...\n');
  for (const ep of endpoints) {
    await measureEndpoint(ep.name, ep.url);
  }
  console.log('\nMeasurements completed.');
}

runMeasurements();
