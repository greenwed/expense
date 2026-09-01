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
  console.log('🧪 Starting Verification of User Behavior & Total Balance Regardless of Months...\n');

  // 1. Register test user
  const email = `behavior_${Date.now()}@example.com`;
  const username = `behavior_${Date.now()}`;

  const otpRes = await request('/api/auth/send-register-otp', { method: 'POST' }, {
    email,
    username,
    name: 'Behavior Tester'
  });
  const otp = otpRes.data.previewOtp;

  const regRes = await request('/api/auth/register', { method: 'POST' }, {
    name: 'Behavior Tester',
    email,
    username,
    password: 'password123',
    otp
  });

  const token = regRes.data.token;
  const authHeaders = { Authorization: `Bearer ${token}` };

  console.log('Test 1: User explicitly adds Income and Expense in August (2026-08)...');
  const inc1 = await request('/api/personal/incomes', { method: 'POST', headers: authHeaders }, {
    amount: 50000,
    description: 'August Salary',
    date: '2026-08-01T10:00:00.000Z'
  });
  console.log('Added Income status:', inc1.status, inc1.data.income.description);

  const exp1 = await request('/api/personal/expenses', { method: 'POST', headers: authHeaders }, {
    amount: 15000,
    category: 'Others',
    description: 'House Rent August',
    date: '2026-08-05T10:00:00.000Z'
  });
  console.log('Added Expense status:', exp1.status, exp1.data.expense.description);

  // Check August
  const augDash = await request('/api/personal/dashboard?month=2026-08', { headers: authHeaders });
  console.log('August Dashboard:', {
    totalBalance: augDash.data.totalBalance,
    monthlyIncome: augDash.data.monthlyIncome,
    monthlySpent: augDash.data.monthlySpent,
    expensesCount: augDash.data.expenses.length
  });

  if (augDash.data.totalBalance !== 35000) {
    throw new Error(`Expected August totalBalance 35000, got ${augDash.data.totalBalance}`);
  }
  if (augDash.data.monthlyIncome !== 50000) {
    throw new Error(`Expected August monthlyIncome 50000, got ${augDash.data.monthlyIncome}`);
  }
  if (augDash.data.monthlySpent !== 15000) {
    throw new Error(`Expected August monthlySpent 15000, got ${augDash.data.monthlySpent}`);
  }

  console.log('\nTest 2: Switching to New Month (September 2026)...');
  const sepDash = await request('/api/personal/dashboard?month=2026-09', { headers: authHeaders });
  console.log('September Dashboard (Before user adds anything):', {
    totalBalance: sepDash.data.totalBalance,
    monthlyIncome: sepDash.data.monthlyIncome,
    monthlySpent: sepDash.data.monthlySpent,
    expensesCount: sepDash.data.expenses.length,
    incomesCount: sepDash.data.incomes.length
  });

  // VERIFY: September has 0 incomes because user did not add any!
  if (sepDash.data.monthlyIncome !== 0) {
    throw new Error(`Expected September monthlyIncome 0, but got ${sepDash.data.monthlyIncome} (phantom income detected!)`);
  }
  if (sepDash.data.incomes.length !== 0) {
    throw new Error(`Expected 0 incomes in September, got ${sepDash.data.incomes.length}`);
  }

  // VERIFY: September has 0 expenses because user did not add any! (No duplicate from last month)
  if (sepDash.data.monthlySpent !== 0) {
    throw new Error(`Expected September monthlySpent 0, but got ${sepDash.data.monthlySpent} (duplicate expense detected!)`);
  }
  if (sepDash.data.expenses.length !== 0) {
    throw new Error(`Expected 0 expenses in September, got ${sepDash.data.expenses.length}`);
  }

  // VERIFY: Running total balance is STILL 35000 regardless of months!
  if (sepDash.data.totalBalance !== 35000) {
    throw new Error(`Expected totalBalance to stay 35000 regardless of month, got ${sepDash.data.totalBalance}`);
  }

  console.log('\nTest 3: User explicitly adds a September expense (₹5,000)...');
  const sepExp = await request('/api/personal/expenses', { method: 'POST', headers: authHeaders }, {
    amount: 5000,
    category: 'Food',
    description: 'Groceries September',
    date: '2026-09-01T12:00:00.000Z'
  });
  console.log('Added September Expense:', sepExp.status, sepExp.data.expense.description);

  const sepDashAfterExp = await request('/api/personal/dashboard?month=2026-09', { headers: authHeaders });
  console.log('September Dashboard After Expense:', {
    totalBalance: sepDashAfterExp.data.totalBalance,
    monthlySpent: sepDashAfterExp.data.monthlySpent,
    monthlyIncome: sepDashAfterExp.data.monthlyIncome
  });

  if (sepDashAfterExp.data.monthlySpent !== 5000) {
    throw new Error(`Expected September monthlySpent 5000, got ${sepDashAfterExp.data.monthlySpent}`);
  }
  if (sepDashAfterExp.data.totalBalance !== 30000) {
    throw new Error(`Expected totalBalance to be 30000 (35000 - 5000), got ${sepDashAfterExp.data.totalBalance}`);
  }

  console.log('\nTest 4: User explicitly adds a September income (₹20,000)...');
  const sepInc = await request('/api/personal/incomes', { method: 'POST', headers: authHeaders }, {
    amount: 20000,
    description: 'Freelance Design',
    date: '2026-09-01T14:00:00.000Z'
  });
  console.log('Added September Income:', sepInc.status, sepInc.data.income.description);

  const sepDashAfterInc = await request('/api/personal/dashboard?month=2026-09', { headers: authHeaders });
  console.log('September Dashboard After Income:', {
    totalBalance: sepDashAfterInc.data.totalBalance,
    monthlyIncome: sepDashAfterInc.data.monthlyIncome,
    monthlySpent: sepDashAfterInc.data.monthlySpent
  });

  if (sepDashAfterInc.data.monthlyIncome !== 20000) {
    throw new Error(`Expected September monthlyIncome 20000, got ${sepDashAfterInc.data.monthlyIncome}`);
  }
  if (sepDashAfterInc.data.totalBalance !== 50000) {
    throw new Error(`Expected totalBalance 50000, got ${sepDashAfterInc.data.totalBalance}`);
  }

  console.log('\nTest 5: User explicitly deletes the September expense...');
  const delExp = await request(`/api/personal/expenses/${sepExp.data.expense.id}`, { method: 'DELETE', headers: authHeaders });
  console.log('Deleted expense status:', delExp.status);

  const sepDashAfterDel = await request('/api/personal/dashboard?month=2026-09', { headers: authHeaders });
  if (sepDashAfterDel.data.monthlySpent !== 0) {
    throw new Error(`Expected monthlySpent 0 after deletion, got ${sepDashAfterDel.data.monthlySpent}`);
  }
  if (sepDashAfterDel.data.totalBalance !== 55000) {
    throw new Error(`Expected totalBalance 55000 after deleting 5000 expense, got ${sepDashAfterDel.data.totalBalance}`);
  }

  console.log('\nTest 6: User explicitly deletes the September income...');
  const delInc = await request(`/api/personal/incomes/${sepInc.data.income.id}`, { method: 'DELETE', headers: authHeaders });
  console.log('Deleted income status:', delInc.status);

  const sepDashFinal = await request('/api/personal/dashboard?month=2026-09', { headers: authHeaders });
  if (sepDashFinal.data.monthlyIncome !== 0) {
    throw new Error(`Expected monthlyIncome 0 after deletion, got ${sepDashFinal.data.monthlyIncome}`);
  }
  if (sepDashFinal.data.totalBalance !== 35000) {
    throw new Error(`Expected totalBalance back to 35000, got ${sepDashFinal.data.totalBalance}`);
  }

  console.log('\n✨ ALL USER BEHAVIOR TESTS PASSED 100% SUCCESSFULLY! NO PHANTOM/DUPLICATE DATA! ✨');
}

run().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
