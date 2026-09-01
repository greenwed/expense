import http from 'http';

function request(path, options = {}) {
  return new Promise((resolve, reject) => {
    const defaultHeaders = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const req = http.request(
      {
        hostname: 'localhost',
        port: 5001,
        path,
        method: options.method || 'GET',
        headers: defaultHeaders
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => { body += chunk; });
        res.on('end', () => {
          try {
            const data = JSON.parse(body);
            resolve({ status: res.statusCode, data });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );

    req.on('error', (e) => reject(e));
    req.end();
  });
}

async function run() {
  console.log('Testing report queries...');
  // Find a user with data
  const fs = await import('fs');
  const users = JSON.parse(fs.readFileSync('server/data/users.json', 'utf8'));
  const karthik = users.find(u => u.username === 'karthik');
  console.log('Found user Karthik:', karthik.id);

  // Generate JWT token for karthik
  const jwt = await import('jsonwebtoken');
  const token = jwt.default.sign(
    { id: karthik.id, _id: karthik.id, username: karthik.username, name: karthik.name },
    'expense-tracker-secure-secret-key-2026',
    { expiresIn: '7d' }
  );

  const authHeaders = { Authorization: `Bearer ${token}` };

  // 1. Query August 2026
  const aug = await request('/api/personal/dashboard?month=2026-08', { headers: authHeaders });
  console.log('August 2026 Response status:', aug.status, aug.data);

  // 2. Query September 2026
  const sep = await request('/api/personal/dashboard?month=2026-09', { headers: authHeaders });
  console.log('September 2026 Data:', {
    period: sep.data.period,
    totalSpent: sep.data.totalSpent,
    totalIncome: sep.data.totalIncome,
    expensesCount: sep.data.expenses.length
  });

  // 3. Query Custom Range in August (2026-08-01 to 2026-08-31)
  const range = await request('/api/personal/dashboard?startDate=2026-08-01&endDate=2026-08-31', { headers: authHeaders });
  console.log('August Custom Range Data:', {
    period: range.data.period,
    totalSpent: range.data.totalSpent,
    expensesCount: range.data.expenses.length,
    activeCategories: range.data.categories.filter(c => c.amount > 0)
  });
}

run().catch(console.error);
