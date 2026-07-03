import fetch from 'node-fetch';

async function run() {
  console.log('Login to get admin token...');
  const res = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@example.com', password: 'password123' })
  });
  const data = await res.json();
  const token = data.data.token;

  console.log('Benchmarking Uncached Request...');
  const startUncached = Date.now();
  const resUncached = await fetch('http://localhost:5000/api/admin/orders?page=1&limit=100', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const textUncached = await resUncached.text();
  const timeUncached = Date.now() - startUncached;
  const payloadSize = textUncached.length;

  console.log(`Uncached Time: ${timeUncached}ms`);
  console.log(`Payload Size: ${(payloadSize / 1024).toFixed(2)} KB`);

  console.log('Benchmarking Cached Request...');
  const startCached = Date.now();
  const resCached = await fetch('http://localhost:5000/api/admin/orders?page=1&limit=100', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  await resCached.text();
  const timeCached = Date.now() - startCached;

  console.log(`Cached Time: ${timeCached}ms`);
}

run();
