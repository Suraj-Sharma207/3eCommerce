import axios from 'axios';

async function testAPIs() {
  const tests = [];
  const addTest = (name, p) => tests.push(p.then(() => ({ name, status: 'pass' })).catch(e => ({ name, status: 'fail', error: e.response?.data || e.message })));

  addTest('GET /products', axios.get('http://localhost:5000/api/products?limit=1'));
  addTest('GET /products/home', axios.get('http://localhost:5000/api/products/home'));
  addTest('GET /products/search/suggestions', axios.get('http://localhost:5000/api/products/search/suggestions?q=sofa'));
  addTest('GET /products/:slug', axios.get('http://localhost:5000/api/products/modern-fabric-sofa'));
  
  // Need to get an ID for related products
  const pRes = await axios.get('http://localhost:5000/api/products?limit=1');
  const id = pRes.data.data.products[0].id;
  addTest('GET /products/:id/related', axios.get(`http://localhost:5000/api/products/${id}/related`));

  const results = await Promise.all(tests);
  console.log(JSON.stringify(results, null, 2));
}

testAPIs();
