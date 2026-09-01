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
  console.log('🧪 Starting Expense Carry Forward Automated Tests...\n');

  // 1. Register test user
  const email = `carry_${Date.now()}@example.com`;
  const username = `carry_${Date.now()}`;

  const otpRes = await request('/api/auth/send-register-otp', { method: 'POST' }, {
    email,
    username,
    name: 'Carry Forward Tester'
  });
  const otp = otpRes.data.previewOtp;

  const regRes = await request('/api/auth/register', { method: 'POST' }, {
    name: 'Carry Forward Tester',
    email,
    username,
    password: 'password123',
    otp
  });

  const token = regRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  console.log('Test 1: Adding Incomes and Expenses in August 2026 (2026-08)...');
  await request('/api/personal/incomes', { method: 'POST', headers: authHeaders }, {
    amount: 60000,
    description: 'August Primary Salary',
    date: '2026-08-01T10:00:00.000Z'
  });

  await request('/api/personal/expenses', { method: 'POST', headers: authHeaders }, {
    amount: 15000,
    category: 'Others',
    description: 'House Rent',
    date: '2026-08-05T10:00:00.000Z'
  });

  await request('/api/personal/expenses', { method: 'POST', headers: authHeaders }, {
    amount: 5000,
    category: 'Food',
    description: 'Monthly Groceries',
    date: '2026-08-10T12:00:00.000Z'
  });

  await request('/api/personal/expenses', { method: 'POST', headers: authHeaders }, {
    amount: 1200,
    category: 'Others',
    description: 'High-speed Broadband WiFi',
    date: '2026-08-12T14:00:00.000Z'
  });

  // Verify August dashboard
  const augDash = await request('/api/personal/dashboard?month=2026-08', { headers: authHeaders });
  console.log('August 2026 Dashboard:', {
    totalIncome: augDash.data.totalIncome,
    totalSpent: augDash.data.totalSpent,
    remainingBalance: augDash.data.remainingBalance,
    expensesCount: augDash.data.expenses.length
  });

  if (augDash.data.totalSpent !== 21200) {
    throw new Error(`Expected August totalSpent 21200, got ${augDash.data.totalSpent}`);
  }
  if (augDash.data.remainingBalance !== 38800) {
    throw new Error(`Expected August remainingBalance 38800, got ${augDash.data.remainingBalance}`);
  }

  console.log('\nTest 2: Switching to New Month (September 2026 - 2026-09)...');
  const sepDash = await request('/api/personal/dashboard?month=2026-09', { headers: authHeaders });
  console.log('September 2026 Auto-Carried Dashboard:', {
    isAutoCarriedForward: sepDash.data.isAutoCarriedForward,
    carriedFromMonth: sepDash.data.carriedFromMonth,
    openingBalance: sepDash.data.openingBalance,
    totalIncome: sepDash.data.totalIncome,
    totalSpent: sepDash.data.totalSpent,
    remainingBalance: sepDash.data.remainingBalance,
    expensesCount: sepDash.data.expenses.length,
    expenses: sepDash.data.expenses.map(e => ({ desc: e.description, amt: e.amount }))
  });

  if (!sepDash.data.isAutoCarriedForward) {
    throw new Error('Expected isAutoCarriedForward to be true in September!');
  }
  if (sepDash.data.carriedFromMonth !== '2026-08') {
    throw new Error(`Expected carriedFromMonth '2026-08', got ${sepDash.data.carriedFromMonth}`);
  }
  if (sepDash.data.expenses.length !== 3) {
    throw new Error(`Expected 3 carried expenses, got ${sepDash.data.expenses.length}`);
  }
  if (sepDash.data.totalSpent !== 21200) {
    throw new Error(`Expected September totalSpent 21200, got ${sepDash.data.totalSpent}`);
  }
  if (sepDash.data.openingBalance !== 38800) {
    throw new Error(`Expected openingBalance 38800 carried from August, got ${sepDash.data.openingBalance}`);
  }

  console.log('\nTest 3: Querying All Time (Cumulative across all months)...');
  const allTimeDash = await request('/api/personal/dashboard?allTime=true', { headers: authHeaders });
  console.log('All Time Dashboard:', {
    period: allTimeDash.data.period,
    totalIncome: allTimeDash.data.totalIncome,
    totalSpent: allTimeDash.data.totalSpent,
    expensesCount: allTimeDash.data.expenses.length
  });

  // August (3 exps) + September carried (3 exps) = 6 exps total
  if (allTimeDash.data.expenses.length !== 6) {
    throw new Error(`Expected 6 total expenses across all time, got ${allTimeDash.data.expenses.length}`);
  }

  console.log('\nTest 4: Testing Explicit Carry Forward POST endpoint...');
  const explicitCarry = await request('/api/personal/carry-forward', { method: 'POST', headers: authHeaders }, {
    fromMonth: '2026-08',
    toMonth: '2026-10'
  });
  console.log('October Carry Forward Response:', explicitCarry.status, explicitCarry.data.message);

  const octDash = await request('/api/personal/dashboard?month=2026-10', { headers: authHeaders });
  if (octDash.data.expenses.length !== 3) {
    throw new Error(`Expected 3 expenses in October, got ${octDash.data.expenses.length}`);
  }

  console.log('\n✨ ALL CARRY FORWARD AUTOMATED TESTS PASSED WITH 100% SUCCESS! ✨');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
