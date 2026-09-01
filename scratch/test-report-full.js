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
  console.log('🧪 Starting Full Report & Analytics Verification...\n');

  const fs = await import('fs');
  const users = JSON.parse(fs.readFileSync('server/data/users.json', 'utf8'));
  const karthik = users.find(u => u.username === 'karthik');

  const jwt = await import('jsonwebtoken');
  const token = jwt.default.sign(
    { id: karthik.id, _id: karthik.id, username: karthik.username, name: karthik.name },
    'expense-tracker-secure-secret-key-2026',
    { expiresIn: '7d' }
  );

  const authHeaders = { Authorization: `Bearer ${token}` };

  // Case 1: Report for August 2026
  console.log('Case 1: Report for August 2026 (Monthly)...');
  const augRes = await request('/api/personal/dashboard?month=2026-08', { headers: authHeaders });
  console.log('August Status:', augRes.status);
  console.log('August Period:', augRes.data.period);
  console.log('August Total Spent:', augRes.data.totalSpent);
  console.log('August Expenses Count:', augRes.data.expenses.length);
  console.log('August Active Categories:', augRes.data.categories.filter(c => c.amount > 0));

  if (augRes.data.totalSpent !== 17300) {
    throw new Error(`Expected August totalSpent 17300, got ${augRes.data.totalSpent}`);
  }
  if (augRes.data.expenses.length !== 7) {
    throw new Error(`Expected 7 expenses in August, got ${augRes.data.expenses.length}`);
  }

  // Case 2: Report for September 2026
  console.log('\nCase 2: Report for September 2026 (Monthly)...');
  const sepRes = await request('/api/personal/dashboard?month=2026-09', { headers: authHeaders });
  console.log('September Status:', sepRes.status);
  console.log('September Period:', sepRes.data.period);
  console.log('September Total Spent:', sepRes.data.totalSpent);
  console.log('September Expenses Count:', sepRes.data.expenses.length);

  if (sepRes.data.totalSpent !== 0) {
    throw new Error(`Expected September totalSpent 0, got ${sepRes.data.totalSpent}`);
  }
  if (sepRes.data.expenses.length !== 0) {
    throw new Error(`Expected 0 expenses in September, got ${sepRes.data.expenses.length}`);
  }

  // Case 3: Report for Custom Date Range (August 1 to August 15)
  console.log('\nCase 3: Report for Custom Date Range (2026-08-01 to 2026-08-15)...');
  const rangeRes = await request('/api/personal/dashboard?startDate=2026-08-01&endDate=2026-08-15', { headers: authHeaders });
  console.log('Range Status:', rangeRes.status);
  console.log('Range Period:', rangeRes.data.period);
  console.log('Range Total Spent:', rangeRes.data.totalSpent);
  console.log('Range Expenses Count:', rangeRes.data.expenses.length);
  console.log('Range Active Categories:', rangeRes.data.categories.filter(c => c.amount > 0));

  if (rangeRes.data.expenses.length !== 3) {
    throw new Error(`Expected 3 expenses between Aug 1-15, got ${rangeRes.data.expenses.length}`);
  }

  // Case 4: Category Breakdown Math Consistency
  console.log('\nCase 4: Category Percentages & Sum Consistency...');
  const catSum = augRes.data.categories.reduce((acc, c) => acc + c.amount, 0);
  if (catSum !== augRes.data.totalSpent) {
    throw new Error(`Category sum (${catSum}) does not match totalSpent (${augRes.data.totalSpent})`);
  }
  console.log('Category amounts sum perfectly matches totalSpent:', catSum);

  // Case 5: Family Group Reports
  console.log('\nCase 5: Family Group Reports...');
  const groupRes = await request('/api/family/groups', { headers: authHeaders });
  if (groupRes.data.groups && groupRes.data.groups.length > 0) {
    const groupId = groupRes.data.groups[0]._id || groupRes.data.groups[0].id;
    const famReport = await request(`/api/family/groups/${groupId}/dashboard?month=2026-08`, { headers: authHeaders });
    console.log('Family August Report Status:', famReport.status, 'Total Spent:', famReport.data.totalSpent);
  } else {
    console.log('No family groups currently for Karthik, skipping group query.');
  }

  console.log('\n✨ ALL REPORT VERIFICATION CASES PASSED WITH 100% SUCCESS! ✨');
}

run().catch(err => {
  console.error('❌ Report verification failed:', err);
  process.exit(1);
});
