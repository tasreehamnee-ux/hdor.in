async function testEnv() {
  console.log('Fetching test-env from Vercel...');
  try {
    const response = await fetch('https://hdor-in.vercel.app/api/test-env');
    const status = response.status;
    const text = await response.text();
    console.log(`Status: ${status}`);
    console.log('Response:', text);
  } catch (err) {
    console.error('Error:', err.message);
  }
}

testEnv();
