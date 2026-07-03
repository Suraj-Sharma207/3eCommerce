import { cacheGet, cacheSet, initRedis } from '../services/cacheService.js';

async function testCache() {
  console.log('Testing backend cache Service...');
  await initRedis(); // Init cache

  const key = 'test:products:list';
  const val = { products: [{ id: 1, name: 'Chair' }] };

  console.log('[Test] Writing to cache...');
  await cacheSet(key, val, 300);

  console.log('[Test] Reading from cache (1)...');
  const read1 = await cacheGet(key);
  console.log('Result 1:', read1);

  console.log('[Test] Reading from cache (2)...');
  const read2 = await cacheGet(key);
  console.log('Result 2:', read2);
}

testCache();
