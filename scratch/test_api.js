async function testStockApi() {
  try {
    const loginRes = await fetch('http://localhost:3000/api/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'owner@takka.com',
        password: 'password'
      })
    });
    
    const cookie = loginRes.headers.get('set-cookie');
    console.log('Login successful');

    const stockRes = await fetch('http://localhost:3000/api/v1/stock', {
      headers: { Cookie: cookie }
    });
    const data = await stockRes.json();
    if (!stockRes.ok) {
      console.error('API Error:', stockRes.status, data);
    } else {
      console.log('Stock API Response success');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testStockApi();
