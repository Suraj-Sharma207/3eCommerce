import fetch from 'node-fetch';

async function verify() {
  try {
    const res = await fetch('http://localhost:5000/api/products/categories');
    const data = await res.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

verify();
