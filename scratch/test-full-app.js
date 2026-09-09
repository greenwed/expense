import http from 'http';
import dotenv from 'dotenv';
dotenv.config();

// Ensure test port to avoid conflict
const TEST_PORT = process.env.TEST_PORT || 5099;
process.env.PORT = String(TEST_PORT);

const BASE_URL = `http://localhost:${TEST_PORT}/api`;

let passedCount = 0;
let failedCount = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  ❌ FAILED: ${message}`);
    failedCount++;
    throw new Error(message);
  } else {
    passedCount++;
    console.log(`  ✅ PASSED: ${message}`);
  }
}

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  try {
    const response = await fetch(url, {
      method: options.method || 'GET',
      headers,
      body: options.body ? JSON.stringify(options.body) : undefined
    });

    const data = await response.json().catch(() => null);
    return { status: response.status, data };
  } catch (e) {
    return { status: 500, error: e.message };
  }
}

async function startTestServer() {
  const { default: app } = await import('../server/server.js');
  return new Promise((resolve) => {
    const server = app.listen(TEST_PORT, () => {
      console.log(`🚀 Test server running on port ${TEST_PORT}`);
      resolve(server);
    });
  });
}

async function runAllTests() {
  console.log('================================================================');
  console.log('🧪 RUNNING COMPLETE COMPREHENSIVE RUPEETRACK FULL-APP TEST SUITE');
  console.log('================================================================\n');

  const server = await startTestServer();

  try {
    // -------------------------------------------------------------
    // SECTION 1: Health & Server Basics
    // -------------------------------------------------------------
    console.log('\n--- SECTION 1: Health Check ---');
    const health = await request('/health');
    assert(health.status === 200, 'Health endpoint responds with 200');
    assert(health.data?.status === 'ok', 'Health status is "ok"');

    // -------------------------------------------------------------
    // SECTION 2: Authentication & Edge Cases
    // -------------------------------------------------------------
    console.log('\n--- SECTION 2: Auth & Edge Cases ---');
    const timestamp = Date.now();
    const userCharlie = { name: 'Charlie Day', email: `charlie_${timestamp}@example.com`, username: `charlie_${timestamp}`, password: 'Password123!' };
    const userDave = { name: 'Dave Miller', email: `dave_${timestamp}@example.com`, username: `dave_${timestamp}`, password: 'Password123!' };
    const userEve = { name: 'Eve Johnson', email: `eve_${timestamp}@example.com`, username: `eve_${timestamp}`, password: 'Password123!' };

    // 2.1 Register Charlie
    const regCharlie = await request('/auth/register', { method: 'POST', body: userCharlie });
    assert(regCharlie.status === 201, 'Charlie registration succeeds with 201');

    // 2.2 Reject duplicate username
    const dupReg = await request('/auth/register', { method: 'POST', body: userCharlie });
    assert(dupReg.status === 400, 'Duplicate registration rejected with 400');

    // 2.3 Reject missing fields
    const missingFieldReg = await request('/auth/register', { method: 'POST', body: { username: 'incomplete' } });
    assert(missingFieldReg.status === 400, 'Registration with missing password rejected with 400');

    // 2.4 Login Charlie
    const loginCharlie = await request('/auth/login', {
      method: 'POST',
      body: { username: userCharlie.username, password: userCharlie.password }
    });
    assert(loginCharlie.status === 200, 'Charlie login succeeds with 200');
    assert(!!loginCharlie.data?.token, 'JWT Token issued');
    const charlieToken = loginCharlie.data.token;
    const charlieHeaders = { Authorization: `Bearer ${charlieToken}` };
    const charlieUser = loginCharlie.data.user;

    // 2.5 Login with wrong password
    const wrongPass = await request('/auth/login', {
      method: 'POST',
      body: { username: userCharlie.username, password: 'WrongPassword!' }
    });
    assert(wrongPass.status === 400 || wrongPass.status === 401, 'Login with wrong password rejected');

    // 2.6 Login with non-existent user
    const nonExistent = await request('/auth/login', {
      method: 'POST',
      body: { username: `ghost_${timestamp}`, password: 'Password123!' }
    });
    assert(nonExistent.status === 400 || nonExistent.status === 404, 'Login with non-existent user rejected');

    // 2.7 Register Dave and Eve
    const regDave = await request('/auth/register', { method: 'POST', body: userDave });
    assert(regDave.status === 201, 'Dave registration succeeds');
    const loginDave = await request('/auth/login', { method: 'POST', body: userDave });
    const daveToken = loginDave.data.token;
    const daveHeaders = { Authorization: `Bearer ${daveToken}` };
    const daveUser = loginDave.data.user;

    const regEve = await request('/auth/register', { method: 'POST', body: userEve });
    assert(regEve.status === 201, 'Eve registration succeeds');
    const loginEve = await request('/auth/login', { method: 'POST', body: userEve });
    const eveToken = loginEve.data.token;
    const eveHeaders = { Authorization: `Bearer ${eveToken}` };
    const eveUser = loginEve.data.user;

    // -------------------------------------------------------------
    // SECTION 3: Personal Finance, Budget & 80%/100% Alerts
    // -------------------------------------------------------------
    console.log('\n--- SECTION 3: Personal Finance & Alert Edge Cases ---');
    const currentMonth = new Date().toISOString().slice(0, 7);

    // 3.1 Reject negative amount expense
    const negExpense = await request('/personal/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: { amount: -500, category: 'Food', description: 'Invalid negative expense' }
    });
    assert(negExpense.status === 400, 'Negative expense rejected with 400');

    // 3.2 Reject zero amount expense
    const zeroExpense = await request('/personal/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: { amount: 0, category: 'Food', description: 'Zero expense' }
    });
    assert(zeroExpense.status === 400, 'Zero amount expense rejected with 400');

    // 3.3 Reject invalid income
    const negIncome = await request('/personal/incomes', {
      method: 'POST',
      headers: charlieHeaders,
      body: { amount: -1000, description: 'Negative income' }
    });
    assert(negIncome.status === 400, 'Negative income rejected with 400');

    const emptyDescIncome = await request('/personal/incomes', {
      method: 'POST',
      headers: charlieHeaders,
      body: { amount: 5000, description: '   ' }
    });
    assert(emptyDescIncome.status === 400, 'Empty description income rejected with 400');

    // 3.4 Add Valid Income of ₹20,000
    const addInc = await request('/personal/incomes', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        amount: 20000,
        description: 'Monthly Salary',
        date: new Date().toISOString()
      }
    });
    assert(addInc.status === 201, 'Personal monthly income of ₹20,000 added');

    // 3.4 Add Valid Expense: ₹16,000 (80% of budget)
    const exp80 = await request('/personal/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        amount: 16000,
        category: 'Shopping',
        description: 'New work phone',
        date: new Date().toISOString()
      }
    });
    assert(exp80.status === 201, 'Personal expense of ₹16,000 added');

    // 3.5 Check 80% warning flag
    const dash80 = await request(`/personal/dashboard?month=${currentMonth}`, { headers: charlieHeaders });
    assert(dash80.data?.isExceeding80 === true, '80% budget warning banner triggered');
    assert(dash80.data?.isExceeding100 === false, '100% budget alert not triggered yet');

    // 3.6 Add another expense of ₹5,000 (total = ₹21,000, 105% of budget)
    const exp100 = await request('/personal/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        amount: 5000,
        category: 'Food',
        description: 'Monthly dining out',
        date: new Date().toISOString()
      }
    });
    assert(exp100.status === 201, 'Second expense of ₹5,000 added');

    const dash100 = await request(`/personal/dashboard?month=${currentMonth}`, { headers: charlieHeaders });
    assert(dash100.data?.isExceeding100 === true, '100% budget overshoot alert triggered');

    // -------------------------------------------------------------
    // SECTION 4: Family Groups & Permissions
    // -------------------------------------------------------------
    console.log('\n--- SECTION 4: Family Workspace & Permissions ---');
    // 4.1 Create Family Group
    const famGroup = await request('/family/groups', {
      method: 'POST',
      headers: charlieHeaders,
      body: { name: 'The Day Family' }
    });
    assert(famGroup.status === 201, 'Family group created by Charlie');
    const famGroupId = famGroup.data.group.id || famGroup.data.group._id;
    const famInviteToken = famGroup.data.group.inviteToken;

    // 4.2 Dave joins via invite token
    const daveJoinFam = await request(`/family/join/${famInviteToken}`, {
      method: 'POST',
      headers: daveHeaders
    });
    assert(daveJoinFam.status === 200, 'Dave joined family group');

    // 4.3 Dave (Member) adds family expense
    const famExp = await request(`/family/groups/${famGroupId}/expenses`, {
      method: 'POST',
      headers: daveHeaders,
      body: {
        amount: 2500,
        category: 'Medical',
        description: 'First aid kit & supplies',
        date: new Date().toISOString()
      }
    });
    assert(famExp.status === 201, 'Dave added family expense');
    const famExpId = famExp.data.expense.id || famExp.data.expense._id;

    // 4.4 Dave (Member) attempts to edit expense -> 403 Forbidden
    const daveEditFam = await request(`/family/groups/${famGroupId}/expenses/${famExpId}`, {
      method: 'PUT',
      headers: daveHeaders,
      body: { amount: 3000 }
    });
    assert(daveEditFam.status === 403, 'Member cannot edit family expense (403 Forbidden)');

    // 4.5 Charlie (Admin) edits expense -> 200 OK
    const charlieEditFam = await request(`/family/groups/${famGroupId}/expenses/${famExpId}`, {
      method: 'PUT',
      headers: charlieHeaders,
      body: { amount: 2200, description: 'First aid supplies (discounted)' }
    });
    assert(charlieEditFam.status === 200, 'Admin can edit family expense');

    // -------------------------------------------------------------
    // SECTION 5: Split Feature - Friends Management & Edge Cases
    // -------------------------------------------------------------
    console.log('\n--- SECTION 5: Split Feature - Friends & Edge Cases ---');

    // 5.1 Charlie gets friend invite link
    const friendInvite = await request('/split/friends/invite', {
      method: 'POST',
      headers: charlieHeaders
    });
    assert(friendInvite.status === 200 && !!friendInvite.data.inviteToken, 'Friend invite token generated');
    const charlieFriendToken = friendInvite.data.inviteToken;

    // 5.2 Edge Case: Charlie accepts his own friend invite -> rejected
    const selfFriend = await request(`/split/friends/accept/${charlieFriendToken}`, {
      method: 'POST',
      headers: charlieHeaders
    });
    assert(selfFriend.status === 400, 'Cannot add oneself as a friend (400)');

    // 5.3 Edge Case: Invalid invite token -> 404
    const badToken = await request('/split/friends/accept/invalid_token_xyz_123', {
      method: 'POST',
      headers: daveHeaders
    });
    assert(badToken.status === 404, 'Invalid friend invite token returns 404');

    // 5.4 Dave accepts Charlie\'s friend invite
    const daveAcceptFriend = await request(`/split/friends/accept/${charlieFriendToken}`, {
      method: 'POST',
      headers: daveHeaders
    });
    assert(daveAcceptFriend.status === 200, 'Dave accepts Charlie friend invite');

    // 5.5 Check Charlie\'s friends list contains Dave
    const charlieFriends = await request('/split/friends', { headers: charlieHeaders });
    const daveInCharlie = charlieFriends.data.friends.some(f => f.friendUsername === userDave.username);
    assert(daveInCharlie, 'Dave appears in Charlie friend list');

    // 5.6 Add Eve by username
    const addEveByUsername = await request('/split/friends/add-by-username', {
      method: 'POST',
      headers: charlieHeaders,
      body: { username: userEve.username }
    });
    assert(addEveByUsername.status === 200, 'Eve added as friend by @username');

    // 5.7 Edge Case: Add non-existent username
    const addFake = await request('/split/friends/add-by-username', {
      method: 'POST',
      headers: charlieHeaders,
      body: { username: 'non_existent_ghost_user_999' }
    });
    assert(addFake.status === 404, 'Adding non-existent username returns 404');

    // 5.8 Edge Case: Add self by username
    const addSelf = await request('/split/friends/add-by-username', {
      method: 'POST',
      headers: charlieHeaders,
      body: { username: userCharlie.username }
    });
    assert(addSelf.status === 400, 'Adding self by username returns 400');

    // 5.9 Add friend by Email ID (New Feature)
    const addEveByEmail = await request('/split/friends/add-by-email', {
      method: 'POST',
      headers: daveHeaders,
      body: { email: userEve.email }
    });
    assert(addEveByEmail.status === 200, 'Eve added as friend to Dave by registered Email ID');

    // 5.10 Edge Case: Add friend with missing email -> 400
    const addEmptyEmail = await request('/split/friends/add-by-email', {
      method: 'POST',
      headers: daveHeaders,
      body: { email: '' }
    });
    assert(addEmptyEmail.status === 400, 'Adding with empty email returns 400');

    // 5.11 Edge Case: Add non-existent email -> 404
    const addFakeEmail = await request('/split/friends/add-by-email', {
      method: 'POST',
      headers: daveHeaders,
      body: { email: 'non_existent_ghost_user@domain.com' }
    });
    assert(addFakeEmail.status === 404, 'Adding non-existent email returns 404');

    // 5.12 Edge Case: Add self by email -> 400
    const addSelfEmail = await request('/split/friends/add-by-email', {
      method: 'POST',
      headers: daveHeaders,
      body: { email: userDave.email }
    });
    assert(addSelfEmail.status === 400, 'Adding self by email returns 400');

    // -------------------------------------------------------------
    // SECTION 6: Split Groups & Joining
    // -------------------------------------------------------------
    console.log('\n--- SECTION 6: Split Groups & Joining ---');
    // 6.1 Create Split Group "Goa Trip 2026"
    const splitGroupRes = await request('/split/groups', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        name: 'Goa Trip 2026',
        members: [
          { userId: daveUser.id || daveUser._id, name: daveUser.name, username: daveUser.username }
        ]
      }
    });
    assert(splitGroupRes.status === 201, 'Split Group "Goa Trip 2026" created');
    const splitGroup = splitGroupRes.data.group;
    const splitGroupId = splitGroup.id || splitGroup._id;
    const groupInviteToken = splitGroup.inviteToken;

    // 6.2 Eve joins group via group invite link
    const eveJoinGroup = await request(`/split/groups/join/${groupInviteToken}`, {
      method: 'POST',
      headers: eveHeaders
    });
    assert(eveJoinGroup.status === 200, 'Eve joined split group via invite link');

    // 6.3 Verify group details has all 3 members
    const groupDetails = await request(`/split/groups/${splitGroupId}`, { headers: charlieHeaders });
    assert(groupDetails.status === 200, 'Group details retrieved');
    assert(groupDetails.data.group.members.length === 3, 'Split group has exactly 3 members (Charlie, Dave, Eve)');

    // -------------------------------------------------------------
    // SECTION 7: 3 Split Calculation Methods & Edge Cases
    // -------------------------------------------------------------
    console.log('\n--- SECTION 7: 3 Split Methods & Edge Cases ---');

    const participantsAll = [
      { userId: charlieUser.id || charlieUser._id, name: charlieUser.name },
      { userId: daveUser.id || daveUser._id, name: daveUser.name },
      { userId: eveUser.id || eveUser._id, name: eveUser.name }
    ];

    // 7.1 Method 1: Equal Split (₹1,500 / 3 = ₹500 each)
    const equalExp = await request('/split/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        groupId: splitGroupId,
        payerId: charlieUser.id || charlieUser._id,
        payerName: charlieUser.name,
        amount: 1500,
        description: 'Goa Beach House Stay',
        category: 'Travel',
        splitMethod: 'equal',
        participants: participantsAll
      }
    });
    assert(equalExp.status === 201, 'Equal Split expense of ₹1,500 created');
    assert(equalExp.data.expense.participants.every(p => p.shareAmount === 500), 'Each participant allocated exactly ₹500');

    // 7.2 Equal Split Penny Rounding (₹100 / 3 = ₹33.34 + ₹33.33 + ₹33.33)
    const pennyExp = await request('/split/expenses', {
      method: 'POST',
      headers: daveHeaders,
      body: {
        groupId: splitGroupId,
        payerId: daveUser.id || daveUser._id,
        payerName: daveUser.name,
        amount: 100,
        description: 'Highway Toll Fee',
        category: 'Transport',
        splitMethod: 'equal',
        participants: participantsAll
      }
    });
    assert(pennyExp.status === 201, 'Penny rounding equal split created');
    const pennySum = pennyExp.data.expense.participants.reduce((sum, p) => sum + p.shareAmount, 0);
    assert(Math.abs(pennySum - 100) < 0.01, 'Penny rounding preserves exact total of ₹100.00');

    // 7.3 Method 2: Exact Amounts (₹) - Corner Case: Sum Mismatch Rejection
    const exactMismatch = await request('/split/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        groupId: splitGroupId,
        payerId: charlieUser.id || charlieUser._id,
        payerName: charlieUser.name,
        amount: 1000,
        description: 'Seafood Dinner',
        category: 'Food',
        splitMethod: 'exact',
        participants: [
          { userId: charlieUser.id || charlieUser._id, name: charlieUser.name, shareAmount: 400 },
          { userId: daveUser.id || daveUser._id, name: daveUser.name, shareAmount: 300 }
          // Missing ₹300!
        ]
      }
    });
    assert(exactMismatch.status === 400, 'Exact split rejected when shares (₹700) do not equal total (₹1000)');

    // 7.4 Method 2: Exact Amounts (₹) - Valid
    const exactValid = await request('/split/expenses', {
      method: 'POST',
      headers: eveHeaders,
      body: {
        groupId: splitGroupId,
        payerId: eveUser.id || eveUser._id,
        payerName: eveUser.name,
        amount: 1000,
        description: 'Seafood Buffet',
        category: 'Food',
        splitMethod: 'exact',
        participants: [
          { userId: charlieUser.id || charlieUser._id, name: charlieUser.name, shareAmount: 400 },
          { userId: daveUser.id || daveUser._id, name: daveUser.name, shareAmount: 300 },
          { userId: eveUser.id || eveUser._id, name: eveUser.name, shareAmount: 300 }
        ]
      }
    });
    assert(exactValid.status === 201, 'Exact split succeeded when shares sum to ₹1000');

    // 7.5 Method 3: Percentage (%) - Corner Case: Sum Mismatch Rejection
    const percentMismatch = await request('/split/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        groupId: splitGroupId,
        payerId: charlieUser.id || charlieUser._id,
        payerName: charlieUser.name,
        amount: 2000,
        description: 'Scuba Diving',
        category: 'Entertainment',
        splitMethod: 'percentage',
        participants: [
          { userId: charlieUser.id || charlieUser._id, name: charlieUser.name, percentage: 50 },
          { userId: daveUser.id || daveUser._id, name: daveUser.name, percentage: 30 }
          // Sum is 80%, not 100%!
        ]
      }
    });
    assert(percentMismatch.status === 400, 'Percentage split rejected when total != 100%');

    // 7.6 Method 3: Percentage (%) - Valid (50% + 25% + 25% = 100%)
    const percentValid = await request('/split/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        groupId: splitGroupId,
        payerId: charlieUser.id || charlieUser._id,
        payerName: charlieUser.name,
        amount: 2000,
        description: 'Scuba Diving Gear',
        category: 'Entertainment',
        splitMethod: 'percentage',
        participants: [
          { userId: charlieUser.id || charlieUser._id, name: charlieUser.name, percentage: 50 },
          { userId: daveUser.id || daveUser._id, name: daveUser.name, percentage: 25 },
          { userId: eveUser.id || eveUser._id, name: eveUser.name, percentage: 25 }
        ]
      }
    });
    assert(percentValid.status === 201, 'Percentage split succeeded when total = 100%');
    assert(percentValid.data.expense.participants[0].shareAmount === 1000, 'Charlie share is ₹1,000 (50%)');
    assert(percentValid.data.expense.participants[1].shareAmount === 500, 'Dave share is ₹500 (25%)');
    assert(percentValid.data.expense.participants[2].shareAmount === 500, 'Eve share is ₹500 (25%)');

    // 7.7 Zero or Negative amount edge cases
    const zeroSplit = await request('/split/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        amount: 0,
        payerId: charlieUser.id || charlieUser._id,
        payerName: charlieUser.name,
        description: 'Zero',
        participants: participantsAll
      }
    });
    assert(zeroSplit.status === 400, 'Split expense with 0 amount rejected');

    const negSplit = await request('/split/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        amount: -100,
        payerId: charlieUser.id || charlieUser._id,
        payerName: charlieUser.name,
        description: 'Negative',
        participants: participantsAll
      }
    });
    assert(negSplit.status === 400, 'Split expense with negative amount rejected');

    // -------------------------------------------------------------
    // SECTION 8: Balance Tracking & Conservation of Money
    // -------------------------------------------------------------
    console.log('\n--- SECTION 8: Balance Tracking ---');
    const charlieDash = await request('/split/dashboard', { headers: charlieHeaders });
    const daveDash = await request('/split/dashboard', { headers: daveHeaders });
    const eveDash = await request('/split/dashboard', { headers: eveHeaders });

    assert(charlieDash.status === 200, 'Charlie split dashboard retrieved');
    assert(daveDash.status === 200, 'Dave split dashboard retrieved');
    assert(eveDash.status === 200, 'Eve split dashboard retrieved');

    const netCharlie = charlieDash.data.summary.netBalance;
    const netDave = daveDash.data.summary.netBalance;
    const netEve = eveDash.data.summary.netBalance;

    console.log(`  📊 Net Balances -> Charlie: ₹${netCharlie}, Dave: ₹${netDave}, Eve: ₹${netEve}`);
    const totalNetSum = Math.round((netCharlie + netDave + netEve) * 100) / 100;
    assert(Math.abs(totalNetSum) < 0.05, `Conservation of money: sum of all member net balances is 0 (got ${totalNetSum})`);

    // -------------------------------------------------------------
    // SECTION 9: Settle Up Debts
    // -------------------------------------------------------------
    console.log('\n--- SECTION 9: Settle Up Debts & Edge Cases ---');

    // 9.1 Edge Case: Settle with self rejected
    const selfSettle = await request('/split/settle', {
      method: 'POST',
      headers: daveHeaders,
      body: {
        payerId: daveUser.id || daveUser._id,
        payerName: daveUser.name,
        payeeId: daveUser.id || daveUser._id,
        payeeName: daveUser.name,
        amount: 100
      }
    });
    assert(selfSettle.status === 400, 'Settlement where payer === payee rejected');

    // 9.2 Edge Case: Settle with 0 amount rejected
    const zeroSettle = await request('/split/settle', {
      method: 'POST',
      headers: daveHeaders,
      body: {
        payerId: daveUser.id || daveUser._id,
        payerName: daveUser.name,
        payeeId: charlieUser.id || charlieUser._id,
        payeeName: charlieUser.name,
        amount: 0
      }
    });
    assert(zeroSettle.status === 400, 'Settlement with 0 amount rejected');

    // 9.3 Dave settles ₹200 to Charlie via UPI
    const validSettle = await request('/split/settle', {
      method: 'POST',
      headers: daveHeaders,
      body: {
        groupId: splitGroupId,
        payerId: daveUser.id || daveUser._id,
        payerName: daveUser.name,
        payeeId: charlieUser.id || charlieUser._id,
        payeeName: charlieUser.name,
        amount: 200,
        note: 'GPay payment for Villa'
      }
    });
    assert(validSettle.status === 201, 'Dave settles ₹200 to Charlie successfully');

    // 9.4 Verify Dave\'s balance updated
    const daveDashAfterSettle = await request('/split/dashboard', { headers: daveHeaders });
    const newNetDave = daveDashAfterSettle.data.summary.netBalance;
    assert(newNetDave === Math.round((netDave + 200) * 100) / 100, 'Dave debt reduced by exactly ₹200');

    // -------------------------------------------------------------
    // SECTION 10: Expense Deletion in Split
    // -------------------------------------------------------------
    console.log('\n--- SECTION 10: Split Expense Deletion & Balance Reversion ---');
    // Add temporary expense of ₹300
    const tempExp = await request('/split/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        groupId: splitGroupId,
        payerId: charlieUser.id || charlieUser._id,
        payerName: charlieUser.name,
        amount: 300,
        description: 'Snacks to be deleted',
        splitMethod: 'equal',
        participants: participantsAll
      }
    });
    const tempExpId = tempExp.data.expense.id || tempExp.data.expense._id;

    // Delete temporary expense by creator (Charlie)
    const delExp = await request(`/split/expenses/${tempExpId}`, {
      method: 'DELETE',
      headers: charlieHeaders
    });
    assert(delExp.status === 200, 'Split expense deleted successfully by expense creator');

    // Edge Case: Delete non-existent expense
    const delFake = await request('/split/expenses/fake_expense_id_123', {
      method: 'DELETE',
      headers: charlieHeaders
    });
    assert(delFake.status === 404, 'Deleting non-existent expense returns 404');

    // -------------------------------------------------------------
    // SECTION 10B: Group Creator Permissions & Expense Creator Protection
    // -------------------------------------------------------------
    console.log('\n--- SECTION 10B: Group Creator Permissions & Expense Creator Protection ---');
    
    // Register 4th user Frank for testing
    const userFrank = { name: 'Frank Ocean', email: `frank_${timestamp}@example.com`, username: `frank_${timestamp}`, password: 'Password123!' };
    const regFrank = await request('/auth/register', { method: 'POST', body: userFrank });
    assert(regFrank.status === 201, 'Frank registered successfully');
    const loginFrank = await request('/auth/login', { method: 'POST', body: userFrank });
    const frankHeaders = { Authorization: `Bearer ${loginFrank.data.token}` };
    const frankUser = loginFrank.data.user;

    // 10B.1 Group Creator (Charlie) edits group name
    const editGroupName = await request(`/split/groups/${splitGroupId}`, {
      method: 'PUT',
      headers: charlieHeaders,
      body: { name: 'Goa Summer Retreat 2026' }
    });
    assert(editGroupName.status === 200, 'Group creator (Charlie) can edit group name');
    assert(editGroupName.data?.group?.name === 'Goa Summer Retreat 2026', 'Group name updated');

    // 10B.2 Non-creator (Dave) CANNOT edit group name -> 403
    const daveEditName = await request(`/split/groups/${splitGroupId}`, {
      method: 'PUT',
      headers: daveHeaders,
      body: { name: 'Hacked by Dave' }
    });
    assert(daveEditName.status === 403, 'Non-creator (Dave) cannot edit group name (403 Forbidden)');

    // 10B.3 Group Creator (Charlie) adds Frank to group
    const addFrank = await request(`/split/groups/${splitGroupId}/members`, {
      method: 'POST',
      headers: charlieHeaders,
      body: { userId: frankUser.id || frankUser._id }
    });
    assert(addFrank.status === 200, 'Group creator (Charlie) can add a member');

    // 10B.4 Non-creator (Dave) CANNOT add member -> 403
    const daveAddMember = await request(`/split/groups/${splitGroupId}/members`, {
      method: 'POST',
      headers: daveHeaders,
      body: { userId: frankUser.id || frankUser._id }
    });
    assert(daveAddMember.status === 403, 'Non-creator (Dave) cannot add member (403 Forbidden)');

    // 10B.5 Group Creator (Charlie) removes Frank from group
    const removeFrank = await request(`/split/groups/${splitGroupId}/members/${frankUser.id || frankUser._id}`, {
      method: 'DELETE',
      headers: charlieHeaders
    });
    assert(removeFrank.status === 200, 'Group creator (Charlie) can remove a member');

    // 10B.6 Non-creator (Dave) CANNOT remove Eve -> 403
    const daveRemoveEve = await request(`/split/groups/${splitGroupId}/members/${eveUser.id || eveUser._id}`, {
      method: 'DELETE',
      headers: daveHeaders
    });
    assert(daveRemoveEve.status === 403, 'Non-creator (Dave) cannot remove member (403 Forbidden)');

    // 10B.7 Group Creator cannot remove themselves -> 400
    const charlieRemoveSelf = await request(`/split/groups/${splitGroupId}/members/${charlieUser.id || charlieUser._id}`, {
      method: 'DELETE',
      headers: charlieHeaders
    });
    assert(charlieRemoveSelf.status === 400, 'Group creator cannot remove themselves from group (400)');

    // 10B.8 Dave (Group Member) creates an expense in the group
    const daveNewExp = await request('/split/expenses', {
      method: 'POST',
      headers: daveHeaders,
      body: {
        groupId: splitGroupId,
        payerId: daveUser.id || daveUser._id,
        payerName: daveUser.name,
        amount: 450,
        description: 'Dave Beach Snacks',
        splitMethod: 'equal',
        participants: [
          { userId: charlieUser.id || charlieUser._id, name: charlieUser.name },
          { userId: daveUser.id || daveUser._id, name: daveUser.name }
        ]
      }
    });
    assert(daveNewExp.status === 201, 'Dave (group member) creates an expense');
    const daveExpId = daveNewExp.data.expense.id || daveNewExp.data.expense._id;

    // 10B.9 CRITICAL: Group Creator (Charlie) CANNOT delete Dave\'s expense -> 403
    const charlieTryDelete = await request(`/split/expenses/${daveExpId}`, {
      method: 'DELETE',
      headers: charlieHeaders
    });
    assert(charlieTryDelete.status === 403, 'Group Creator CANNOT delete expense created by another member (403 Forbidden)');

    // 10B.10 CRITICAL: Group Creator (Charlie) CANNOT edit Dave\'s expense -> 403
    const charlieTryEdit = await request(`/split/expenses/${daveExpId}`, {
      method: 'PUT',
      headers: charlieHeaders,
      body: {
        amount: 999,
        description: 'Charlie edited Dave expense',
        splitMethod: 'equal',
        participants: [
          { userId: charlieUser.id || charlieUser._id, name: charlieUser.name },
          { userId: daveUser.id || daveUser._id, name: daveUser.name }
        ]
      }
    });
    assert(charlieTryEdit.status === 403, 'Group Creator CANNOT edit expense created by another member (403 Forbidden)');

    // 10B.11 Dave (Expense Creator) CAN edit his own expense -> 200
    const daveEditOwn = await request(`/split/expenses/${daveExpId}`, {
      method: 'PUT',
      headers: daveHeaders,
      body: {
        amount: 500,
        description: 'Dave Beach Snacks (Updated with juice)',
        splitMethod: 'equal',
        participants: [
          { userId: charlieUser.id || charlieUser._id, name: charlieUser.name },
          { userId: daveUser.id || daveUser._id, name: daveUser.name }
        ]
      }
    });
    assert(daveEditOwn.status === 200, 'Expense creator (Dave) can edit his own expense');
    assert(daveEditOwn.data?.expense?.amount === 500, 'Expense amount updated to 500');

    // 10B.12 Dave (Expense Creator) CAN delete his own expense -> 200
    const daveDeleteOwn = await request(`/split/expenses/${daveExpId}`, {
      method: 'DELETE',
      headers: daveHeaders
    });
    assert(daveDeleteOwn.status === 200, 'Expense creator (Dave) can delete his own expense');

    // 10B.13 Non-creator (Dave) CANNOT delete group -> 403
    const daveDeleteGroup = await request(`/split/groups/${splitGroupId}`, {
      method: 'DELETE',
      headers: daveHeaders
    });
    assert(daveDeleteGroup.status === 403, 'Non-creator (Dave) cannot delete group (403 Forbidden)');

    // 10B.14 Group Creator can delete group
    // Create a temporary group for Charlie to delete
    const tempGroup = await request('/split/groups', {
      method: 'POST',
      headers: charlieHeaders,
      body: { name: 'Temporary Group to Delete' }
    });
    const tempGroupId = tempGroup.data.group.id || tempGroup.data.group._id;
    const charlieDeleteGroup = await request(`/split/groups/${tempGroupId}`, {
      method: 'DELETE',
      headers: charlieHeaders
    });
    assert(charlieDeleteGroup.status === 200, 'Group creator (Charlie) can delete group');

    // 10B.15 GET /split/expenses returns user split expenses
    const getSplitExpenses = await request('/split/expenses', { headers: charlieHeaders });
    assert(getSplitExpenses.status === 200, 'GET /split/expenses returns 200');
    assert(Array.isArray(getSplitExpenses.data?.expenses), 'GET /split/expenses returns expenses array');
    assert(getSplitExpenses.data?.expenses?.length > 0, 'GET /split/expenses contains user expenses');

    // -------------------------------------------------------------
    // SECTION 11: Activity Log Audit Trail
    // -------------------------------------------------------------
    console.log('\n--- SECTION 11: Activity Log Audit Trail ---');
    const activities = await request('/split/activity', { headers: charlieHeaders });
    assert(activities.status === 200, 'Activity log fetched');
    const actTypes = activities.data.activities.map(a => a.type);
    assert(actTypes.includes('group_created'), 'Activity contains group_created');
    assert(actTypes.includes('expense_added'), 'Activity contains expense_added');
    assert(actTypes.includes('settlement_recorded'), 'Activity contains settlement_recorded');
    assert(actTypes.includes('expense_deleted'), 'Activity contains expense_deleted');

    // -------------------------------------------------------------
    // SECTION 12: Split Reports & Analytics
    // -------------------------------------------------------------
    console.log('\n--- SECTION 12: Split Reports & Analytics ---');
    const splitReports = await request('/split/reports', { headers: charlieHeaders });
    assert(splitReports.status === 200, 'Split reports endpoint returned 200');
    assert(splitReports.data?.totalSplitVolume > 0, 'Total split volume calculated');
    assert(splitReports.data?.totalUserPaid > 0, 'Total user paid calculated');
    assert(splitReports.data?.totalUserShare > 0, 'Total user share calculated');
    assert(Array.isArray(splitReports.data?.categoryBreakdown), 'Category breakdown array present');
    assert(Array.isArray(splitReports.data?.groupBreakdown), 'Group breakdown array present');

    // -------------------------------------------------------------
    // SECTION 13: Latest APK Download & Metadata Synchronization
    // -------------------------------------------------------------
    console.log('\n--- SECTION 13: Latest APK Download & Metadata ---');
    const apkInfoRes = await request('/app/apk-info');
    assert(apkInfoRes.status === 200, 'APK metadata endpoint responds with 200');
    assert(apkInfoRes.data?.available === true, 'Latest APK is marked available');
    assert(apkInfoRes.data?.filename === 'rupeetrack.apk', 'APK filename is rupeetrack.apk');
    assert(apkInfoRes.data?.downloadUrl === '/rupeetrack.apk', 'Download URL is /rupeetrack.apk');
    assert(apkInfoRes.data?.sizeBytes > 1000000, `APK size is valid (${apkInfoRes.data?.sizeFormatted})`);

    const rawApkRes = await fetch(`http://localhost:${TEST_PORT}/rupeetrack.apk`);
    assert(rawApkRes.status === 200, 'Direct /rupeetrack.apk route responds with 200');
    assert(rawApkRes.headers.get('content-type') === 'application/vnd.android.package-archive', 'Content-Type is Android package archive');
    assert(rawApkRes.headers.get('content-disposition')?.includes('attachment; filename="rupeetrack.apk"'), 'Content-Disposition attachment header is set');

    const apiDownloadRes = await fetch(`http://localhost:${TEST_PORT}/api/app/download-apk`);
    assert(apiDownloadRes.status === 200, '/api/app/download-apk route responds with 200');

    // -------------------------------------------------------------
    // SECTION 14: Custom Categories & Reports Dynamic Aggregation
    // -------------------------------------------------------------
    console.log('\n--- SECTION 14: Custom Categories & Reports Dynamic Aggregation ---');
    
    // 14.1 Get categories - returns standard list and custom list
    const getCatsRes = await request('/personal/categories', { headers: charlieHeaders });
    assert(getCatsRes.status === 200, 'GET /personal/categories returns 200');
    assert(Array.isArray(getCatsRes.data?.standard) && getCatsRes.data.standard.length > 0, 'Standard categories returned with colors and icons');
    assert(Array.isArray(getCatsRes.data?.custom), 'Custom categories array returned');

    // 14.2 Create a custom category with custom color & icon
    const customCatName = `Gaming_${timestamp}`;
    const createCatRes = await request('/personal/categories', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        name: customCatName,
        color: '#8B5CF6',
        icon: 'Gamepad2'
      }
    });
    assert(createCatRes.status === 201, 'POST /personal/categories creates custom category with 201');
    assert(createCatRes.data?.category?.name === customCatName, 'Created category has correct name');
    assert(createCatRes.data?.category?.color === '#8B5CF6', 'Created category has custom color');
    assert(createCatRes.data?.category?.icon === 'Gamepad2', 'Created category has custom icon');
    const createdCatId = createCatRes.data?.category?.id || createCatRes.data?.category?._id;

    // 14.3 Reject duplicate category name
    const dupCatRes = await request('/personal/categories', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        name: customCatName,
        color: '#EC4899',
        icon: 'Sparkles'
      }
    });
    assert(dupCatRes.status === 400, 'Reject duplicate custom category with 400');

    // 14.4 Reject category name colliding with standard categories
    const stdCollisionRes = await request('/personal/categories', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        name: 'Food',
        color: '#10B981',
        icon: 'ShoppingCart'
      }
    });
    assert(stdCollisionRes.status === 400, 'Reject custom category colliding with standard category');

    // 14.5 Add personal expense tagged with custom category
    const addCustomExpRes = await request('/personal/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        amount: 2500,
        category: customCatName,
        description: 'New mechanical keyboard',
        date: new Date().toISOString()
      }
    });
    assert(addCustomExpRes.status === 201, 'Add expense with custom category succeeds');
    assert(addCustomExpRes.data?.expense?.category === customCatName, 'Expense category matches custom category');

    // 14.6 Check dashboard category breakdown includes custom category with custom color (not Others)
    const dashRes = await request('/personal/dashboard', { headers: charlieHeaders });
    assert(dashRes.status === 200, 'GET /personal/dashboard succeeds');
    const gamingBreakdown = dashRes.data?.categoryBreakdown?.find(c => c.category === customCatName);
    assert(!!gamingBreakdown, 'Custom category is present in dashboard category breakdown');
    assert(gamingBreakdown?.amount >= 2500, 'Custom category breakdown has correct amount');
    assert(gamingBreakdown?.color === '#8B5CF6', 'Custom category preserves custom color in breakdown');
    assert(gamingBreakdown?.isCustom === true, 'Custom category flagged as isCustom in breakdown');

    // 14.7 Edit/Update custom category (rename name, color, and icon)
    const updatedCatName = `Esports_${timestamp}`;
    const updateCatRes = await request(`/personal/categories/${createdCatId}`, {
      method: 'PUT',
      headers: charlieHeaders,
      body: {
        name: updatedCatName,
        color: '#EC4899',
        icon: 'Music'
      }
    });
    assert(updateCatRes.status === 200, 'PUT /personal/categories/:id returns 200');
    assert(updateCatRes.data?.category?.name === updatedCatName, 'Category name updated');
    assert(updateCatRes.data?.category?.color === '#EC4899', 'Category color updated');
    assert(updateCatRes.data?.category?.icon === 'Music', 'Category icon updated');

    // 14.8 Verify existing expenses automatically migrated to new category name
    const dashAfterUpdate = await request('/personal/dashboard', { headers: charlieHeaders });
    const oldBreakdown = dashAfterUpdate.data?.categoryBreakdown?.find(c => c.category === customCatName);
    const newBreakdown = dashAfterUpdate.data?.categoryBreakdown?.find(c => c.category === updatedCatName);
    assert(!oldBreakdown || oldBreakdown.amount === 0, 'Old category name has 0 amount in breakdown');
    assert(!!newBreakdown && newBreakdown.amount >= 2500, 'Expenses successfully migrated to renamed category');
    assert(newBreakdown.color === '#EC4899', 'Renamed category has updated color in dashboard breakdown');

    // 14.9 Reject updating category to empty name or name colliding with standard categories
    const emptyNameUpdate = await request(`/personal/categories/${createdCatId}`, {
      method: 'PUT',
      headers: charlieHeaders,
      body: { name: '   ' }
    });
    assert(emptyNameUpdate.status === 400, 'Reject empty category name with 400');

    const collisionUpdate = await request(`/personal/categories/${createdCatId}`, {
      method: 'PUT',
      headers: charlieHeaders,
      body: { name: 'Food' }
    });
    assert(collisionUpdate.status === 400, 'Reject updating category to standard category name with 400');

    // 14.10 Delete custom category
    const deleteCatRes = await request(`/personal/categories/${createdCatId}`, {
      method: 'DELETE',
      headers: charlieHeaders
    });
    assert(deleteCatRes.status === 200, 'DELETE /personal/categories/:id succeeds');

    // 14.11 Verify custom category no longer in custom list
    const postDeleteCatsRes = await request('/personal/categories', { headers: charlieHeaders });
    const stillExists = postDeleteCatsRes.data?.custom?.some(c => (c.id || c._id) === createdCatId);
    assert(!stillExists, 'Deleted custom category is removed from categories list');

    // 14.12 Verify expenses were safely reassigned to "Others" so metrics remain intact
    const dashAfterDelete = await request('/personal/dashboard', { headers: charlieHeaders });
    const othersBreakdown = dashAfterDelete.data?.categoryBreakdown?.find(c => c.category === 'Others');
    assert(othersBreakdown?.amount >= 2500, 'Expenses from deleted category safely reassigned to Others');

    // -------------------------------------------------------------
    // SECTION 15: Group-Specific Custom Categories & Cross-User Sharing
    // -------------------------------------------------------------
    console.log('\n--- SECTION 15: Group Categories Flow & Scope Isolation ---');

    // 15.1 Charlie fetches categories for famGroupId (should only have standard categories initially)
    const initialFamCats = await request(`/family/groups/${famGroupId}/categories`, { headers: charlieHeaders });
    assert(initialFamCats.status === 200, 'GET /family/groups/:groupId/categories succeeds');
    assert(Array.isArray(initialFamCats.data?.standard), 'Standard categories array present');
    assert(Array.isArray(initialFamCats.data?.custom), 'Custom categories array present');

    // 15.2 Charlie creates group category "Bills"
    const createFamCatRes = await request(`/family/groups/${famGroupId}/categories`, {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        name: 'Bills',
        color: '#3B82F6',
        icon: 'Zap'
      }
    });
    assert(createFamCatRes.status === 201, 'POST /family/groups/:groupId/categories creates group category "Bills"');
    const famCat = createFamCatRes.data?.category;
    const famCatId = famCat?.id || famCat?._id;
    assert(famCat?.name === 'Bills', 'Group category name is Bills');
    assert(famCat?.color === '#3B82F6', 'Group category color is #3B82F6');
    assert(String(famCat?.groupId) === String(famGroupId), 'Group category has correct groupId');

    // 15.3 Dave (member of famGroupId) fetches categories and sees "Bills"
    const daveFamCats = await request(`/family/groups/${famGroupId}/categories`, { headers: daveHeaders });
    assert(daveFamCats.status === 200, 'Dave fetches family group categories');
    const daveFoundBills = daveFamCats.data?.custom?.find(c => c.name === 'Bills');
    assert(!!daveFoundBills, 'Dave can see category "Bills" created by Charlie in the group');
    assert(daveFoundBills?.color === '#3B82F6', 'Category metadata preserved for Dave');

    // 15.4 Non-admin Dave attempts to create category in famGroupId -> Rejected with 403
    const nonAdminAddRes = await request(`/family/groups/${famGroupId}/categories`, {
      method: 'POST',
      headers: daveHeaders,
      body: {
        name: 'bills',
        color: '#10B981',
        icon: 'CreditCard'
      }
    });
    assert(nonAdminAddRes.status === 403, 'Non-admin Dave blocked from directly adding category to family group (403)');

    // 15.4b Admin Charlie attempts duplicate category "Bills" (or "bills") in the same group -> Rejected with 400
    const dupFamCatRes = await request(`/family/groups/${famGroupId}/categories`, {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        name: 'bills',
        color: '#10B981',
        icon: 'CreditCard'
      }
    });
    assert(dupFamCatRes.status === 400, 'Duplicate category "bills" in same group rejected with 400');
    assert(
      dupFamCatRes.data?.error?.includes('already present in this group'),
      'Duplicate error message contains "already present in this group"'
    );

    // 15.5 Non-member Eve cannot view or add categories to famGroupId
    const eveCatAccess = await request(`/family/groups/${famGroupId}/categories`, { headers: eveHeaders });
    assert(eveCatAccess.status === 403, 'Non-member Eve blocked from fetching group categories (403)');

    // 15.6 Independent flow: Create a second family group and verify "Bills" can be created there without conflict
    const famGroup2 = await request('/family/groups', {
      method: 'POST',
      headers: daveHeaders,
      body: { name: 'Dave Vacation Group' }
    });
    assert(famGroup2.status === 201, 'Second family group created by Dave');
    const famGroup2Id = famGroup2.data.group.id || famGroup2.data.group._id;

    const group2BillsRes = await request(`/family/groups/${famGroup2Id}/categories`, {
      method: 'POST',
      headers: daveHeaders,
      body: {
        name: 'Bills',
        color: '#8B5CF6',
        icon: 'Receipt'
      }
    });
    assert(group2BillsRes.status === 201, 'Category "Bills" can be created in a different family group without conflict');

    // 15.7 Personal categories independent from group categories: Charlie creates personal "Bills" without conflict
    const personalBillsRes = await request('/personal/categories', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        name: 'Bills',
        color: '#F59E0B',
        icon: 'FileText'
      }
    });
    assert(personalBillsRes.status === 201, 'Personal category "Bills" can be created independently from group categories');

    // 15.8 Add family expense in famGroupId using group category "Bills"
    const famExpWithBills = await request(`/family/groups/${famGroupId}/expenses`, {
      method: 'POST',
      headers: daveHeaders,
      body: {
        amount: 3200,
        category: 'Bills',
        description: 'Electricity & Internet Bill',
        date: new Date().toISOString()
      }
    });
    assert(famExpWithBills.status === 201, 'Family expense created with group category "Bills"');

    // 15.9 Verify dashboard returns "Bills" with custom color, icon, and isCustom flag
    const famDashWithBills = await request(`/family/groups/${famGroupId}/dashboard`, { headers: charlieHeaders });
    assert(famDashWithBills.status === 200, 'Family dashboard fetched');
    const billsInDash = famDashWithBills.data?.categoryBreakdown?.find(c => c.category === 'Bills');
    assert(!!billsInDash && billsInDash.amount >= 3200, 'Category "Bills" reflected in dashboard breakdown');
    assert(billsInDash?.color === '#3B82F6', 'Category "Bills" preserves custom color in dashboard');
    assert(billsInDash?.isCustom === true, 'Category "Bills" is marked as isCustom');

    // 15.10 Rename group category "Bills" to "Household_Bills" and verify cascading update
    const updateFamCatRes = await request(`/family/groups/${famGroupId}/categories/${famCatId}`, {
      method: 'PUT',
      headers: charlieHeaders,
      body: {
        name: 'Household_Bills',
        color: '#10B981',
        icon: 'Home'
      }
    });
    assert(updateFamCatRes.status === 200, 'PUT /family/groups/:groupId/categories/:id updates category');
    assert(updateFamCatRes.data?.category?.name === 'Household_Bills', 'Category renamed to Household_Bills');

    // 15.11 Verify dashboard breakdown reflects renamed category and migrated expenses
    const famDashAfterRename = await request(`/family/groups/${famGroupId}/dashboard`, { headers: charlieHeaders });
    const oldBillsBreakdown = famDashAfterRename.data?.categoryBreakdown?.find(c => c.category === 'Bills');
    const newBillsBreakdown = famDashAfterRename.data?.categoryBreakdown?.find(c => c.category === 'Household_Bills');
    assert(!oldBillsBreakdown || oldBillsBreakdown.amount === 0, 'Old category "Bills" has 0 amount');
    assert(!!newBillsBreakdown && newBillsBreakdown.amount >= 3200, 'Expenses successfully migrated to "Household_Bills"');
    assert(newBillsBreakdown?.color === '#10B981', 'Renamed category has updated color #10B981 in dashboard');

    // 15.12 Delete group category
    const deleteFamCatRes = await request(`/family/groups/${famGroupId}/categories/${famCatId}`, {
      method: 'DELETE',
      headers: charlieHeaders
    });
    assert(deleteFamCatRes.status === 200, 'DELETE /family/groups/:groupId/categories/:id succeeds');

    // 15.13 Category no longer in group categories list
    const postDelFamCats = await request(`/family/groups/${famGroupId}/categories`, { headers: daveHeaders });
    const billsStillThere = postDelFamCats.data?.custom?.some(c => (c.id || c._id) === famCatId);
    assert(!billsStillThere, 'Deleted group category is removed from group category list');

    // 15.14 Historical family expenses safely reassigned to "Others"
    const famDashAfterDelete = await request(`/family/groups/${famGroupId}/dashboard`, { headers: charlieHeaders });
    const famOthersBreakdown = famDashAfterDelete.data?.categoryBreakdown?.find(c => c.category === 'Others');
    assert(famOthersBreakdown?.amount >= 3200, 'Family expenses safely reassigned to "Others"');

    // -------------------------------------------------------------
    // SECTION 16: Family Group Settings & Management (Email Add, Creator Protection, Cascading Deletion)
    // -------------------------------------------------------------
    console.log('\n--- SECTION 16: Family Group Settings & Management ---');

    // 16.1 Admin adds member by registered Email ID
    const addEveFamByEmail = await request(`/family/groups/${famGroupId}/members/email`, {
      method: 'POST',
      headers: charlieHeaders,
      body: { email: userEve.email, role: 'member' }
    });
    assert(addEveFamByEmail.status === 200, 'Admin successfully added Eve to family group by email');
    assert(addEveFamByEmail.data?.group?.members?.some(m => String(m.userId) === String(eveUser.id || eveUser._id)), 'Eve is in family group members list');

    // 16.2 Adding unregistered / nonexistent email returns 404
    const addNonexistent = await request(`/family/groups/${famGroupId}/members/email`, {
      method: 'POST',
      headers: charlieHeaders,
      body: { email: 'nonexistent_user_xyz@test.com', role: 'member' }
    });
    assert(addNonexistent.status === 404, 'Adding nonexistent email returns 404');

    // 16.3 Adding an already-existing member returns 400
    const addDuplicateMember = await request(`/family/groups/${famGroupId}/members/email`, {
      method: 'POST',
      headers: charlieHeaders,
      body: { email: userEve.email, role: 'member' }
    });
    assert(addDuplicateMember.status === 400, 'Adding already-existing group member returns 400');

    // 16.4 Non-admin calling add by email returns 403
    const nonAdminAddByEmail = await request(`/family/groups/${famGroupId}/members/email`, {
      method: 'POST',
      headers: daveHeaders, // Dave is a member, not admin
      body: { email: userFrank.email, role: 'member' }
    });
    assert(nonAdminAddByEmail.status === 403, 'Non-admin cannot add members by email (403 Forbidden)');

    // 16.5 Group creator cannot be removed from group (returns 400)
    const removeCreatorRes = await request(`/family/groups/${famGroupId}/members/${charlieUser.id || charlieUser._id}`, {
      method: 'DELETE',
      headers: charlieHeaders
    });
    assert(removeCreatorRes.status === 400, 'Attempting to remove group creator returns 400 with helpful message');

    // 16.6 Non-admin deleting group returns 403
    const nonAdminDeleteGroup = await request(`/family/groups/${famGroupId}`, {
      method: 'DELETE',
      headers: daveHeaders
    });
    assert(nonAdminDeleteGroup.status === 403, 'Non-admin deleting group returns 403 Forbidden');

    // 16.7 Admin deleting group succeeds with 200 (cascades group, expenses, incomes, custom categories)
    const adminDeleteGroup = await request(`/family/groups/${famGroup2Id}`, {
      method: 'DELETE',
      headers: daveHeaders // Dave is admin of famGroup2Id
    });
    assert(adminDeleteGroup.status === 200, 'Admin deleted family group with 200 OK');

    // 16.8 Verify deleted group is no longer accessible (returns 404)
    const getDeletedGroup = await request(`/family/groups/${famGroup2Id}/dashboard`, {
      headers: daveHeaders
    });
    assert(getDeletedGroup.status === 404, 'Accessing deleted group returns 404 Not Found');

    // -------------------------------------------------------------
    // SECTION 17: Split Group Categories & Scoped Settlement Flow
    // -------------------------------------------------------------
    console.log('\n--- SECTION 17: Split Group Categories & Scoped Settlement Flow ---');

    // 17.1 Non-creator Dave blocked from creating category in split group (403 Forbidden)
    const nonCreatorSplitAdd = await request(`/split/groups/${splitGroupId}/categories`, {
      method: 'POST',
      headers: daveHeaders,
      body: { name: 'Snacks & Drinks' }
    });
    assert(nonCreatorSplitAdd.status === 403, 'Non-creator member blocked from creating split category directly (403)');

    // 17.1b Creator (Charlie) can add custom category to split group
    const splitAddCatRes = await request(`/split/groups/${splitGroupId}/categories`, {
      method: 'POST',
      headers: charlieHeaders,
      body: { name: 'Snacks & Drinks', color: '#F59E0B', icon: 'Utensils' }
    });
    assert(splitAddCatRes.status === 201, 'Split group creator created custom category in split group (201)');
    const snacksCat = splitAddCatRes.data.category;
    const snacksCatId = snacksCat.id || snacksCat._id;
    assert(snacksCat.name === 'Snacks & Drinks', 'Category name matches');
    assert(String(snacksCat.groupId) === String(splitGroupId), 'Category is scoped to splitGroupId');

    // 17.2 Duplicate custom category in split group returns 400 with helpful message
    const splitDupCatRes = await request(`/split/groups/${splitGroupId}/categories`, {
      method: 'POST',
      headers: charlieHeaders,
      body: { name: 'snacks & drinks' }
    });
    assert(splitDupCatRes.status === 400, 'Duplicate category in split group returns 400');
    assert(splitDupCatRes.data.error.includes('already present in this group'), 'Duplicate error includes "already present in this group"');

    // 17.3 Standard category duplicate returns 400 with helpful message
    const splitStdCatRes = await request(`/split/groups/${splitGroupId}/categories`, {
      method: 'POST',
      headers: charlieHeaders,
      body: { name: 'Food' }
    });
    assert(splitStdCatRes.status === 400, 'Standard category duplicate in split group returns 400');
    assert(splitStdCatRes.data.error.includes('already a standard category'), 'Error mentions "already a standard category"');

    // 17.4 Non-member cannot view or add categories to split group
    const splitNonMemberAddCat = await request(`/split/groups/${splitGroupId}/categories`, {
      method: 'POST',
      headers: frankHeaders, // Frank is not in splitGroupId
      body: { name: 'Hacks' }
    });
    assert(splitNonMemberAddCat.status === 403, 'Non-member cannot add category to split group (403)');

    // 17.5 Different split group does not see this split group's custom categories (Isolation)
    const splitGroup2Res = await request('/split/groups', {
      method: 'POST',
      headers: daveHeaders,
      body: { name: 'Office Lunch', members: [] }
    });
    assert(splitGroup2Res.status === 201, 'Second split group created');
    const splitGroup2Id = splitGroup2Res.data.group.id || splitGroup2Res.data.group._id;

    const group2CatsRes = await request(`/split/groups/${splitGroup2Id}/categories`, {
      headers: daveHeaders
    });
    assert(group2CatsRes.status === 200, 'Second split group categories fetched');
    const group2CustomCats = group2CatsRes.data.custom || [];
    assert(!group2CustomCats.some(c => c.name === 'Snacks & Drinks'), 'Split group 2 cannot see Snacks & Drinks from Split group 1 (Isolation verified)');

    // 17.6 Add split expense tagged with custom category
    const addExpWithCat = await request('/split/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        groupId: splitGroupId,
        payerId: charlieUser.id || charlieUser._id,
        payerName: charlieUser.name,
        amount: 600,
        description: 'Beach Party Snacks',
        category: 'Snacks & Drinks',
        splitMethod: 'equal',
        participants: [
          { userId: charlieUser.id || charlieUser._id, name: charlieUser.name, shareAmount: 300 },
          { userId: daveUser.id || daveUser._id, name: daveUser.name, shareAmount: 300 }
        ]
      }
    });
    assert(addExpWithCat.status === 201, 'Added split expense with custom category "Snacks & Drinks"');
    const expWithCatId = addExpWithCat.data.expense.id || addExpWithCat.data.expense._id;

    // 17.7 Non-creator member (Eve) blocked from renaming category (403)
    const nonCreatorRename = await request(`/split/groups/${splitGroupId}/categories/${snacksCatId}`, {
      method: 'PUT',
      headers: eveHeaders,
      body: { name: 'Gourmet Snacks', color: '#10B981' }
    });
    assert(nonCreatorRename.status === 403, 'Non-creator Eve blocked from renaming split category (403)');

    // Creator Charlie renames category and verify historical split expenses migrate
    const splitRenameCatRes = await request(`/split/groups/${splitGroupId}/categories/${snacksCatId}`, {
      method: 'PUT',
      headers: charlieHeaders,
      body: { name: 'Gourmet Snacks', color: '#10B981' }
    });
    assert(splitRenameCatRes.status === 200, 'Creator Charlie renamed custom category to "Gourmet Snacks"');

    const expAfterRename = await request(`/split/groups/${splitGroupId}`, { headers: charlieHeaders });
    const matchingExp = (expAfterRename.data.expenses || []).find(e => (e.id || e._id) === expWithCatId);
    assert(matchingExp && matchingExp.category === 'Gourmet Snacks', 'Historical split expense migrated to renamed category "Gourmet Snacks"');

    // 17.8 Non-creator member (Dave) blocked from deleting category (403)
    const nonCreatorDelete = await request(`/split/groups/${splitGroupId}/categories/${snacksCatId}`, {
      method: 'DELETE',
      headers: daveHeaders
    });
    assert(nonCreatorDelete.status === 403, 'Non-creator Dave blocked from deleting split category (403)');

    // Creator Charlie deletes category and verify historical split expenses reassign to 'Others'
    const splitDeleteCatRes = await request(`/split/groups/${splitGroupId}/categories/${snacksCatId}`, {
      method: 'DELETE',
      headers: charlieHeaders
    });
    assert(splitDeleteCatRes.status === 200, 'Creator Charlie deleted custom category from split group');

    const expAfterDelete = await request(`/split/groups/${splitGroupId}`, { headers: charlieHeaders });
    const matchingExpAfterDel = (expAfterDelete.data.expenses || []).find(e => (e.id || e._id) === expWithCatId);
    assert(matchingExpAfterDel && matchingExpAfterDel.category === 'Others', 'Historical split expense reassigned to "Others" after category deletion');

    // 17.9 Record settlement with description and category
    const splitSettleRes = await request('/split/settle', {
      method: 'POST',
      headers: daveHeaders,
      body: {
        groupId: splitGroupId,
        payerId: daveUser.id || daveUser._id,
        payerName: daveUser.name,
        payeeId: charlieUser.id || charlieUser._id,
        payeeName: charlieUser.name,
        amount: 300,
        description: 'Settled beach snacks share via UPI',
        category: 'Settlement',
        note: 'Settled via UPI'
      }
    });
    assert(splitSettleRes.status === 201, 'Recorded settlement with description and category');
    assert(splitSettleRes.data.settlement.description === 'Settled beach snacks share via UPI', 'Settlement description matches');
    assert(splitSettleRes.data.settlement.category === 'Settlement', 'Settlement category matches');

    // 17.10 Delete split group 2 cleans up its custom categories
    await request(`/split/groups/${splitGroup2Id}/categories`, {
      method: 'POST',
      headers: daveHeaders,
      body: { name: 'Temp Cat', color: '#123456' }
    });
    const delGrp2Res = await request(`/split/groups/${splitGroup2Id}`, {
      method: 'DELETE',
      headers: daveHeaders
    });
    assert(delGrp2Res.status === 200, 'Deleted split group 2 with cascading cleanup');

    // -------------------------------------------------------------
    // SECTION 18: 3-Layer Category System Architecture & Advanced Capabilities
    // -------------------------------------------------------------
    console.log('\n--- SECTION 18: 3-Layer Category System Architecture & Advanced Capabilities ---');

    // 18.1 Verify 15 Global Default Categories returned in personal categories endpoint
    const pCats = await request('/personal/categories', { headers: charlieHeaders });
    assert(pCats.status === 200, 'Personal categories endpoint returned 200');
    assert(Array.isArray(pCats.data.standard) && pCats.data.standard.length === 15, '15 Global Default Categories returned in personal categories');
    const expectedGlobals = [
      'Food & Dining', 'Transport', 'Rent & Housing', 'Groceries', 'Healthcare',
      'Entertainment', 'Utilities & Bills', 'Travel', 'Education', 'Shopping',
      'Work & Business', 'Gifts', 'Fitness', 'Pet Care', 'Others'
    ];
    for (const gName of expectedGlobals) {
      assert(pCats.data.standard.some(c => c.name === gName), `Global category "${gName}" is present in personal categories`);
    }

    // 18.2 Verify 15 Global Categories returned in Family & Split group endpoints
    const famCats18 = await request(`/family/groups/${famGroupId}/categories`, { headers: charlieHeaders });
    assert(famCats18.data.standard.length === 15, '15 Global Categories returned in family categories');
    const splitCats18 = await request(`/split/groups/${splitGroupId}/categories`, { headers: charlieHeaders });
    assert(splitCats18.data.standard.length === 15, '15 Global Categories returned in split categories');

    // 18.3 Personal custom category isolation (Layer 2)
    // Charlie creates personal custom category "Charlie Private Fund"
    const charliePriv = await request('/personal/categories', {
      method: 'POST',
      headers: charlieHeaders,
      body: { name: 'Charlie Private Fund', color: '#6366F1' }
    });
    assert(charliePriv.status === 201, 'Charlie created personal category "Charlie Private Fund"');
    // Verify it is NOT visible in family group categories or split group categories or to Dave
    const famCheck18 = await request(`/family/groups/${famGroupId}/categories`, { headers: charlieHeaders });
    assert(!famCheck18.data.custom.some(c => c.name === 'Charlie Private Fund'), 'Personal category not present in family group');
    const splitCheck18 = await request(`/split/groups/${splitGroupId}/categories`, { headers: charlieHeaders });
    assert(!splitCheck18.data.custom.some(c => c.name === 'Charlie Private Fund'), 'Personal category not present in split group');
    const davePersonalCheck = await request('/personal/categories', { headers: daveHeaders });
    assert(!davePersonalCheck.data.custom.some(c => c.name === 'Charlie Private Fund'), 'Personal category not visible to Dave');

    // 18.4 Category Suggestions Flow in Family Group (Layer 3)
    // Dave (non-admin) submits category suggestion to famGroupId
    const famSuggRes = await request(`/family/groups/${famGroupId}/category-suggestions`, {
      method: 'POST',
      headers: daveHeaders,
      body: { name: 'Organic Milk', reason: 'Track dairy spending' }
    });
    assert(famSuggRes.status === 201, 'Dave (member) submitted category suggestion in family group');
    const famSuggId = famSuggRes.data.suggestion.id || famSuggRes.data.suggestion._id;
    assert(famSuggRes.data.suggestion.name === 'Organic Milk', 'Suggestion name is Organic Milk');
    assert(famSuggRes.data.suggestion.status === 'pending', 'Suggestion status is pending');

    // Member and admin can view suggestions
    const famSuggsList = await request(`/family/groups/${famGroupId}/category-suggestions`, { headers: daveHeaders });
    assert(famSuggsList.status === 200, 'Member can fetch category suggestions');
    assert(famSuggsList.data.suggestions.some(s => (s.id || s._id) === famSuggId), 'Suggestion is in list');

    // Non-admin Dave cannot approve suggestions (403 Forbidden)
    const daveApproveAttempt = await request(`/family/groups/${famGroupId}/category-suggestions/${famSuggId}/approve`, {
      method: 'POST',
      headers: daveHeaders
    });
    assert(daveApproveAttempt.status === 403, 'Non-admin Dave blocked from approving suggestion (403)');

    // Admin Charlie approves suggestion -> creates category and marks suggestion approved
    const charlieApprove = await request(`/family/groups/${famGroupId}/category-suggestions/${famSuggId}/approve`, {
      method: 'POST',
      headers: charlieHeaders
    });
    assert(charlieApprove.status === 200, 'Admin Charlie approved category suggestion');
    assert(charlieApprove.data.category.name === 'Organic Milk', 'Approved category created with name Organic Milk');
    assert(charlieApprove.data.suggestion.status === 'approved', 'Suggestion status changed to approved');

    // Verify Organic Milk is now an active group category
    const famCatsAfterApprove = await request(`/family/groups/${famGroupId}/categories`, { headers: daveHeaders });
    assert(famCatsAfterApprove.data.custom.some(c => c.name === 'Organic Milk'), 'Organic Milk now in family group custom categories');

    // Dave submits another suggestion to be rejected
    const rejSuggRes = await request(`/family/groups/${famGroupId}/category-suggestions`, {
      method: 'POST',
      headers: daveHeaders,
      body: { name: 'Video Games', reason: 'Gaming budget' }
    });
    const rejSuggId = rejSuggRes.data.suggestion.id || rejSuggRes.data.suggestion._id;
    const charlieReject = await request(`/family/groups/${famGroupId}/category-suggestions/${rejSuggId}/reject`, {
      method: 'POST',
      headers: charlieHeaders
    });
    assert(charlieReject.status === 200, 'Admin Charlie rejected category suggestion');
    assert(charlieReject.data.suggestion.status === 'rejected', 'Suggestion status changed to rejected');

    // 18.5 Category Suggestions Flow in Split Group (Layer 3)
    // Dave submits suggestion in splitGroupId
    const splitSuggRes = await request(`/split/groups/${splitGroupId}/category-suggestions`, {
      method: 'POST',
      headers: daveHeaders,
      body: { name: 'Scuba Gear', reason: 'Water sports expenses' }
    });
    assert(splitSuggRes.status === 201, 'Member submitted category suggestion in split group');
    const splitSuggId = splitSuggRes.data.suggestion.id || splitSuggRes.data.suggestion._id;

    // Creator Charlie approves suggestion
    const charlieSplitApprove = await request(`/split/groups/${splitGroupId}/category-suggestions/${splitSuggId}/approve`, {
      method: 'POST',
      headers: charlieHeaders
    });
    assert(charlieSplitApprove.status === 200, 'Creator Charlie approved split category suggestion');
    assert(charlieSplitApprove.data.category.name === 'Scuba Gear', 'Approved split category created');

    // 18.6 Category Merge Feature (Admin/Creator Merge Tool)
    // Create source category "Snack Packs" and add expense with it
    const createSnackCat = await request(`/split/groups/${splitGroupId}/categories`, {
      method: 'POST',
      headers: charlieHeaders,
      body: { name: 'Snack Packs', color: '#EF4444' }
    });
    assert(createSnackCat.status === 201, 'Created source category Snack Packs in split group');
    const sourceCatId = createSnackCat.data.category.id || createSnackCat.data.category._id;

    const splitExpSnack = await request('/split/expenses', {
      method: 'POST',
      headers: charlieHeaders,
      body: {
        groupId: splitGroupId,
        payerId: charlieUser.id || charlieUser._id,
        payerName: charlieUser.name,
        amount: 450,
        description: 'Snack boxes for diving',
        category: 'Snack Packs',
        splitMethod: 'equal',
        participants: [
          { userId: charlieUser.id || charlieUser._id, name: charlieUser.name, shareAmount: 225 },
          { userId: daveUser.id || daveUser._id, name: daveUser.name, shareAmount: 225 }
        ]
      }
    });
    assert(splitExpSnack.status === 201, 'Added split expense with Snack Packs category');
    const snackExpId = splitExpSnack.data.expense.id || splitExpSnack.data.expense._id;

    // Non-creator Dave cannot merge categories (403 Forbidden)
    const daveMergeAttempt = await request(`/split/groups/${splitGroupId}/categories/merge`, {
      method: 'POST',
      headers: daveHeaders,
      body: { sourceCategory: 'Snack Packs', targetCategory: 'Food & Dining' }
    });
    assert(daveMergeAttempt.status === 403, 'Non-creator Dave blocked from merging categories (403)');

    // Creator Charlie merges "Snack Packs" into "Food & Dining" (Global target category)
    const mergeRes = await request(`/split/groups/${splitGroupId}/categories/merge`, {
      method: 'POST',
      headers: charlieHeaders,
      body: { sourceCategory: 'Snack Packs', targetCategory: 'Food & Dining' }
    });
    assert(mergeRes.status === 200, 'Creator merged Snack Packs into Food & Dining');
    assert(mergeRes.data.updatedCount >= 1, 'At least 1 expense migrated');

    // Verify historical expense is now under "Food & Dining"
    const splitDetailsAfterMerge = await request(`/split/groups/${splitGroupId}`, { headers: charlieHeaders });
    const mergedExp = (splitDetailsAfterMerge.data.expenses || []).find(e => (e.id || e._id) === snackExpId);
    assert(mergedExp && mergedExp.category === 'Food & Dining', 'Historical expense migrated to target category Food & Dining');

    // Verify source category "Snack Packs" is deleted
    const splitCatsAfterMerge = await request(`/split/groups/${splitGroupId}/categories`, { headers: charlieHeaders });
    assert(!splitCatsAfterMerge.data.custom.some(c => c.name === 'Snack Packs'), 'Source category deleted after merge');

    // 18.7 Group 20-Category Cap Enforcement
    // Create new test group for cap test
    const capGroupRes = await request('/family/groups', {
      method: 'POST',
      headers: charlieHeaders,
      body: { name: 'Cap Test Family' }
    });
    const capGroupId = capGroupRes.data.group.id || capGroupRes.data.group._id;
    // Current count is 0. Add 20 custom categories
    for (let i = 1; i <= 20; i++) {
      const addRes = await request(`/family/groups/${capGroupId}/categories`, {
        method: 'POST',
        headers: charlieHeaders,
        body: { name: `Custom Cat ${i}` }
      });
      assert(addRes.status === 201, `Created category ${i}/20 in cap test group`);
    }

    // Attempting to add 21st category fails with 400
    const cat21Res = await request(`/family/groups/${capGroupId}/categories`, {
      method: 'POST',
      headers: charlieHeaders,
      body: { name: 'Custom Cat 21' }
    });
    assert(cat21Res.status === 400, 'Adding 21st category rejected with 400');
    assert(cat21Res.data.error.includes('Maximum limit of 20'), 'Error message specifies 20 category limit');

    // Clean up cap test group
    await request(`/family/groups/${capGroupId}`, { method: 'DELETE', headers: charlieHeaders });

    console.log('\n================================================================');
    console.log(`🎉 FULL-APP COMPREHENSIVE TEST SUITE COMPLETE!`);
    console.log(`   Passed: ${passedCount} tests`);
    console.log(`   Failed: ${failedCount} tests`);
    console.log('================================================================\n');

  } catch (err) {
    console.error('\n💥 FATAL TEST ERROR:', err);
    process.exitCode = 1;
  } finally {
    server.close(() => {
      console.log('🛑 Test server closed.');
      process.exit(failedCount === 0 ? 0 : 1);
    });
  }
}

runAllTests();
