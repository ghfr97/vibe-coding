const email = `test_${Date.now()}@example.com`;
const password = 'password123';
const name = 'Test User';

async function test() {
  console.log(`Testing with email: ${email}`);

  // 1. Register
  const registerResponse = await fetch('http://localhost:3000/api/users/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password })
  });

  const registerData = await registerResponse.json();
  console.log('Register status:', registerResponse.status);
  console.log('Register response:', registerData);

  if (registerResponse.status !== 200) {
    console.error('Registration failed');
    return;
  }

  // 2. Login
  const loginResponse = await fetch('http://localhost:3000/api/users/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });

  const loginData = await loginResponse.json();
  console.log('Login status:', loginResponse.status);
  console.log('Login response:', loginData);

  if (loginResponse.status === 200) {
    console.log('✅ Test Passed: Login successful');
  } else {
    console.error('❌ Test Failed: Login failed');
  }
}

test().catch(console.error);
