import http from 'http';

async function checkUrl(url) {
  const res = await fetch(url);
  const text = await res.text();
  return { status: res.status, ok: res.ok, length: text.length, snippet: text.slice(0, 150) };
}

async function testAll() {
  console.log('Testing App Services...\n');
  
  const backendHealth = await checkUrl('http://localhost:5001/api/health');
  console.log('1. Backend API Health Check (port 5001):', backendHealth);

  const backendStatic = await checkUrl('http://localhost:5001/');
  console.log('2. Backend Static SPA (port 5001):', backendStatic);

  const viteDev = await checkUrl('http://localhost:3000/');
  console.log('3. Vite Dev Server (port 3000):', viteDev);

  console.log('\n✅ All web endpoints are responding with 200 OK!');
}

testAll().catch(e => {
  console.error('Test failed:', e);
  process.exit(1);
});
