import http from 'http';

function request(path, options = {}, postData = null) {
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
    if (postData) {
      req.write(typeof postData === 'string' ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function run() {
  console.log('🧪 Starting Income Feature Automated Tests...\n');

  // 1. Register test user
  const email = `incometester_${Date.now()}@example.com`;
  const username = `incometester_${Date.now()}`;
  
  const otpRes = await request('/api/auth/send-register-otp', { method: 'POST' }, {
    email,
    username,
    name: 'Income Master'
  });
  const otp = otpRes.data.previewOtp;

  const regRes = await request('/api/auth/register', { method: 'POST' }, {
    name: 'Income Master',
    email,
    username,
    password: 'password123',
    otp
  });

  const token = regRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  console.log('Test 1: Adding Multiple Incomes (Salary, Share, Gift)...');
  const inc1 = await request('/api/personal/incomes', { method: 'POST', headers: authHeaders }, {
    amount: 50000,
    description: 'Monthly Salary',
    date: '2026-08-01T09:00:00.000Z'
  });
  console.log('Income 1 (Salary ₹50k):', inc1.status, inc1.data.income?.description);

  const inc2 = await request('/api/personal/incomes', { method: 'POST', headers: authHeaders }, {
    amount: 15000,
    description: 'Share Market Dividend',
    date: '2026-08-05T12:00:00.000Z'
  });
  console.log('Income 2 (Share Dividend ₹15k):', inc2.status, inc2.data.income?.description);

  const inc3 = await request('/api/personal/incomes', { method: 'POST', headers: authHeaders }, {
    amount: 5000,
    description: 'Birthday Gift from Uncle',
    date: '2026-08-10T15:00:00.000Z'
  });
  console.log('Income 3 (Gift ₹5k):', inc3.status, inc3.data.income?.description);

  console.log('\nTest 2: Adding Personal Expenses...');
  await request('/api/personal/expenses', { method: 'POST', headers: authHeaders }, {
    amount: 14000,
    category: 'Food',
    description: 'Monthly Groceries & Dining',
    date: '2026-08-12T10:00:00.000Z'
  });

  await request('/api/personal/expenses', { method: 'POST', headers: authHeaders }, {
    amount: 6000,
    category: 'Shopping',
    description: 'Clothing & Gadgets',
    date: '2026-08-15T16:00:00.000Z'
  });

  console.log('\nTest 3: Checking Personal Dashboard Incomes & Balance...');
  const dashRes = await request('/api/personal/dashboard?month=2026-08', { headers: authHeaders });
  console.log('Dashboard Metrics:', {
    totalIncome: dashRes.data.totalIncome,
    totalSpent: dashRes.data.totalSpent,
    remainingBalance: dashRes.data.remainingBalance,
    percentSpent: dashRes.data.percentSpent,
    incomesCount: dashRes.data.incomes.length,
    expensesCount: dashRes.data.expenses.length
  });

  if (dashRes.data.totalIncome !== 70000) {
    throw new Error(`Expected totalIncome 70000, got ${dashRes.data.totalIncome}`);
  }
  if (dashRes.data.totalSpent !== 20000) {
    throw new Error(`Expected totalSpent 20000, got ${dashRes.data.totalSpent}`);
  }
  if (dashRes.data.remainingBalance !== 50000) {
    throw new Error(`Expected remainingBalance 50000, got ${dashRes.data.remainingBalance}`);
  }

  console.log('\nTest 4: Editing and Deleting Incomes...');
  const editRes = await request(`/api/personal/incomes/${inc3.data.income.id}`, { method: 'PUT', headers: authHeaders }, {
    amount: 8000,
    description: 'Birthday Gift & Cash from Uncle'
  });
  console.log('Edit Income status:', editRes.status, editRes.data.income.amount);

  const delRes = await request(`/api/personal/incomes/${inc2.data.income.id}`, { method: 'DELETE', headers: authHeaders });
  console.log('Delete Income status:', delRes.status, delRes.data.message);

  const dashRes2 = await request('/api/personal/dashboard?month=2026-08', { headers: authHeaders });
  console.log('\nTest 5: Checking Custom Date Range Report filtering...');
  const rangeRes = await request('/api/personal/dashboard?startDate=2026-08-01&endDate=2026-08-11', { headers: authHeaders });
  console.log('Date Range (Aug 1 - Aug 11) Metrics:', {
    period: rangeRes.data.period,
    totalIncome: rangeRes.data.totalIncome,
    totalSpent: rangeRes.data.totalSpent,
    expensesCount: rangeRes.data.expenses.length
  });

  if (rangeRes.data.totalIncome !== 58000) {
    throw new Error(`Expected range totalIncome 58000, got ${rangeRes.data.totalIncome}`);
  }
  // On Aug 12, expense was 14000. So within Aug 1 - Aug 11, expenses should be 0.
  if (rangeRes.data.totalSpent !== 0) {
    throw new Error(`Expected range totalSpent 0, got ${rangeRes.data.totalSpent}`);
  }

  console.log('\n✨ ALL INCOME & DATE RANGE AUTOMATED TESTS PASSED SUCCESSFULLY! ✨');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
