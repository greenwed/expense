import http from 'http';

const BASE_URL = 'http://localhost:5001/api';

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined
  });

  const data = await response.json().catch(() => null);
  return { status: response.status, data };
}

async function runTests() {
  console.log('🧪 Starting Expense Tracker Backend Automated Tests...\n');

  // Test 1: Register User Alice
  console.log('Test 1: Registering User Alice...');
  const aliceReg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Alice Smith', username: 'alice', password: 'password123' }
  });
  console.log('Alice register status:', aliceReg.status, aliceReg.data?.user);
  if (aliceReg.status !== 201 && aliceReg.status !== 400) throw new Error('Alice register failed');

  // Test 2: Login Alice
  console.log('\nTest 2: Logging in as Alice...');
  const aliceLogin = await request('/auth/login', {
    method: 'POST',
    body: { username: 'alice', password: 'password123' }
  });
  console.log('Alice login status:', aliceLogin.status);
  const aliceToken = aliceLogin.data.token;
  const aliceHeaders = { Authorization: `Bearer ${aliceToken}` };

  // Test 3: Register duplicate username
  console.log('\nTest 3: Testing duplicate username rejection...');
  const dupReg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Alice Duplicate', username: 'alice', password: 'differentpass' }
  });
  console.log('Duplicate register status:', dupReg.status, dupReg.data?.error);
  if (dupReg.status !== 400) throw new Error('Duplicate username should fail with 400');

  // Test 4: Set Personal Budget for 2026-08
  console.log('\nTest 4: Setting personal budget to ₹10,000 for 2026-08...');
  const setBudget = await request('/personal/budget', {
    method: 'POST',
    headers: aliceHeaders,
    body: { month: '2026-08', amount: 10000 }
  });
  console.log('Set budget response:', setBudget.status, setBudget.data);

  // Test 5: Add Personal Expenses
  console.log('\nTest 5: Adding personal expenses...');
  const exp1 = await request('/personal/expenses', {
    method: 'POST',
    headers: aliceHeaders,
    body: {
      amount: 1500,
      category: 'Food',
      description: 'Grocery shopping',
      date: '2026-08-10T12:00:00Z'
    }
  });
  console.log('Exp 1 added:', exp1.status, exp1.data?.expense);

  const exp2 = await request('/personal/expenses', {
    method: 'POST',
    headers: aliceHeaders,
    body: {
      amount: 7000,
      category: 'Shopping',
      description: 'New shoes & clothes',
      date: '2026-08-15T15:30:00Z'
    }
  });
  console.log('Exp 2 added:', exp2.status, exp2.data?.expense);

  // Test 6: Check Dashboard & 80% Warning (1500 + 7000 = 8500 >= 80% of 10000)
  console.log('\nTest 6: Checking personal dashboard & 80% warning...');
  const dash = await request('/personal/dashboard?month=2026-08', {
    headers: aliceHeaders
  });
  console.log('Dashboard summary:', {
    budget: dash.data.budget,
    totalSpent: dash.data.totalSpent,
    remainingBalance: dash.data.remainingBalance,
    percentSpent: dash.data.percentSpent,
    isExceeding80: dash.data.isExceeding80,
    isExceeding100: dash.data.isExceeding100,
    categories: dash.data.categoryBreakdown
  });
  if (!dash.data.isExceeding80) throw new Error('Expected isExceeding80 to be true at 85% spent');

  // Test 7: Edit Expense 1
  console.log('\nTest 7: Editing expense 1 amount from 1500 to 500...');
  const editExp = await request(`/personal/expenses/${exp1.data.expense._id || exp1.data.expense.id}`, {
    method: 'PUT',
    headers: aliceHeaders,
    body: { amount: 500, description: 'Quick grocery snack' }
  });
  console.log('Edit expense response:', editExp.status, editExp.data);

  // Test 8: Register User Bob
  console.log('\nTest 8: Registering Bob...');
  const bobReg = await request('/auth/register', {
    method: 'POST',
    body: { name: 'Bob Smith', username: 'bob', password: 'password123' }
  });
  const bobLogin = await request('/auth/login', {
    method: 'POST',
    body: { username: 'bob', password: 'password123' }
  });
  const bobToken = bobLogin.data.token;
  const bobHeaders = { Authorization: `Bearer ${bobToken}` };

  // Test 9: Alice creates Family Group "Smith Family"
  console.log('\nTest 9: Alice creates Family Group...');
  const createGroup = await request('/family/groups', {
    method: 'POST',
    headers: aliceHeaders,
    body: { name: 'Smith Family' }
  });
  const group = createGroup.data.group;
  const groupId = group._id || group.id;
  const inviteToken = group.inviteToken;
  console.log('Group created:', { groupId, name: group.name, inviteToken, role: group.currentUserRole });

  // Test 10: Bob joins group via invite link
  console.log('\nTest 10: Bob joins group via invite token...');
  const joinGroup = await request(`/family/join/${inviteToken}`, {
    method: 'POST',
    headers: bobHeaders
  });
  console.log('Bob joined status:', joinGroup.status, joinGroup.data?.message);

  // Test 11: Alice sets Group Budget to ₹30,000
  console.log('\nTest 11: Setting family budget to ₹30,000...');
  const setFamBudget = await request(`/family/groups/${groupId}/budget`, {
    method: 'POST',
    headers: aliceHeaders,
    body: { month: '2026-08', amount: 30000 }
  });
  console.log('Family budget status:', setFamBudget.status, setFamBudget.data);

  // Test 12: Bob (Member) adds an expense to family group
  console.log('\nTest 12: Bob (Member) adds family expense...');
  const bobFamExp = await request(`/family/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: bobHeaders,
    body: {
      amount: 4500,
      category: 'Medical',
      description: 'Pharmacy medicines',
      date: '2026-08-18T10:00:00Z'
    }
  });
  console.log('Bob family expense status:', bobFamExp.status, bobFamExp.data);
  const bobExpId = bobFamExp.data.expense._id || bobFamExp.data.expense.id;

  // Test 13: Bob (Member) tries to edit expense (Should be 403 Forbidden!)
  console.log('\nTest 13: Bob (Member) attempts to edit expense (Must be 403)...');
  const bobEditAttempt = await request(`/family/groups/${groupId}/expenses/${bobExpId}`, {
    method: 'PUT',
    headers: bobHeaders,
    body: { amount: 5000 }
  });
  console.log('Bob edit attempt status:', bobEditAttempt.status, bobEditAttempt.data?.error);
  if (bobEditAttempt.status !== 403) throw new Error('Bob as Member should not be allowed to edit expense');

  // Test 14: Alice (Admin) edits Bob's expense
  console.log('\nTest 14: Alice (Admin) edits Bob expense...');
  const aliceEdit = await request(`/family/groups/${groupId}/expenses/${bobExpId}`, {
    method: 'PUT',
    headers: aliceHeaders,
    body: { amount: 4200, description: 'Pharmacy medicines (discounted)' }
  });
  console.log('Alice edit status:', aliceEdit.status, aliceEdit.data);
  if (aliceEdit.status !== 200) throw new Error('Alice (Admin) should be able to edit expense');

  // Test 15: Alice promotes Bob to Moderator
  console.log('\nTest 15: Alice promotes Bob to Moderator...');
  const bobUserId = bobLogin.data.user.id;
  const promoteBob = await request(`/family/groups/${groupId}/members/${bobUserId}`, {
    method: 'PUT',
    headers: aliceHeaders,
    body: { role: 'moderator' }
  });
  console.log('Promote Bob status:', promoteBob.status);

  // Test 16: Bob (now Moderator) edits expense
  console.log('\nTest 16: Bob (Moderator) edits expense now...');
  const bobModEdit = await request(`/family/groups/${groupId}/expenses/${bobExpId}`, {
    method: 'PUT',
    headers: bobHeaders,
    body: { amount: 4300 }
  });
  console.log('Bob (Mod) edit status:', bobModEdit.status);
  if (bobModEdit.status !== 200) throw new Error('Bob (Moderator) should be able to edit expense');

  // Test 17: Family Dashboard
  console.log('\nTest 17: Checking Family Dashboard...');
  const famDash = await request(`/family/groups/${groupId}/dashboard?month=2026-08`, {
    headers: aliceHeaders
  });
  console.log('Family Dashboard summary:', {
    budget: famDash.data.budget,
    totalSpent: famDash.data.totalSpent,
    remainingBalance: famDash.data.remainingBalance,
    breakdown: famDash.data.categoryBreakdown,
    expensesCount: famDash.data.expenses.length
  });

  console.log('\n✨ ALL AUTOMATED TESTS PASSED SUCCESSFULLY! ✨');
}

runTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
