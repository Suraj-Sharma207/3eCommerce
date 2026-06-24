import axios from 'axios';
import fs from 'fs';

async function testAdmin() {
  try {
    // 1. Login to get token
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    const token = loginRes.data.data.token;
    console.log('Login successful. Token:', token.substring(0, 20) + '...');
    
    // 2. Access test endpoint
    const adminRes = await axios.get('http://localhost:5000/api/admin/test-admin', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    
    console.log('Admin Endpoint Result:', adminRes.data);
    
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data);
  }
}

testAdmin();
