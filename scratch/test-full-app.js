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
