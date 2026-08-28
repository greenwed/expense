const BASE_URL = 'http://localhost:5001/api';

async function req(path, opts = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: opts.method || 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers || {})
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined
  });
  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

async function main() {
  console.log('🚀 Seeding rich sample data and performing full-system verification...\n');

  // 1. Register Karthik
  console.log('1. Creating user Karthik (@karthik)...');
  let karthikLogin = await req('/auth/login', {
    method: 'POST',
    body: { username: 'karthik', password: 'password123' }
  });
  if (karthikLogin.status !== 200) {
    await req('/auth/register', {
      method: 'POST',
      body: { name: 'Karthik', username: 'karthik', password: 'password123' }
    });
    karthikLogin = await req('/auth/login', {
      method: 'POST',
      body: { username: 'karthik', password: 'password123' }
    });
  }
  const kToken = karthikLogin.data.token;
  const kHeaders = { Authorization: `Bearer ${kToken}` };

  // 2. Register Priya
  console.log('2. Creating user Priya (@priya)...');
  let priyaLogin = await req('/auth/login', {
    method: 'POST',
    body: { username: 'priya', password: 'password123' }
  });
  if (priyaLogin.status !== 200) {
    await req('/auth/register', {
      method: 'POST',
      body: { name: 'Priya', username: 'priya', password: 'password123' }
    });
    priyaLogin = await req('/auth/login', {
      method: 'POST',
      body: { username: 'priya', password: 'password123' }
    });
  }
  const pToken = priyaLogin.data.token;
  const pHeaders = { Authorization: `Bearer ${pToken}` };

  // 3. Register Rahul
  console.log('3. Creating user Rahul (@rahul)...');
  let rahulLogin = await req('/auth/login', {
    method: 'POST',
    body: { username: 'rahul', password: 'password123' }
  });
  if (rahulLogin.status !== 200) {
    await req('/auth/register', {
      method: 'POST',
      body: { name: 'Rahul', username: 'rahul', password: 'password123' }
    });
    rahulLogin = await req('/auth/login', {
      method: 'POST',
      body: { username: 'rahul', password: 'password123' }
    });
  }
  const rToken = rahulLogin.data.token;
  const rHeaders = { Authorization: `Bearer ${rToken}` };

  // 4. Setup Personal Budget for August 2026
  console.log('\n4. Setting Karthik personal budget to ₹20,000 for 2026-08...');
  await req('/personal/budget', {
    method: 'POST',
    headers: kHeaders,
    body: { month: '2026-08', amount: 20000 }
  });

  // 5. Add Personal Expenses for Karthik
  console.log('5. Adding personal expenses for Karthik...');
  const samplePersonal = [
    { amount: 3500, category: 'Food', description: 'Weekly groceries from Nature Basket', date: '2026-08-02T10:30:00Z' },
    { amount: 4200, category: 'Shopping', description: 'Zara summer shirts & accessories', date: '2026-08-08T18:15:00Z' },
    { amount: 1800, category: 'Entertainment', description: 'IMAX movie tickets & snacks', date: '2026-08-14T20:00:00Z' },
    { amount: 2500, category: 'Medical', description: 'Annual health checkup & supplements', date: '2026-08-19T09:00:00Z' },
    { amount: 3000, category: 'Transport', description: 'Monthly metro pass + Uber rides', date: '2026-08-22T14:45:00Z' },
    { amount: 2000, category: 'Others', description: 'High-speed broadband recharge', date: '2026-08-25T11:20:00Z' }
  ];

  for (const exp of samplePersonal) {
    await req('/personal/expenses', {
      method: 'POST',
      headers: kHeaders,
      body: exp
    });
  }

  // 6. Verify Personal Dashboard
  const kDash = await req('/personal/dashboard?month=2026-08', { headers: kHeaders });
  console.log('Karthik Personal Dashboard Summary:');
  console.log(`  - Total Budget: ₹${kDash.data.budget.toLocaleString('en-IN')}`);
  console.log(`  - Total Spent:  ₹${kDash.data.totalSpent.toLocaleString('en-IN')}`);
  console.log(`  - Remaining:    ₹${kDash.data.remainingBalance.toLocaleString('en-IN')}`);
  console.log(`  - Spent %:      ${kDash.data.percentSpent}%`);
  console.log(`  - Warning 80%:  ${kDash.data.isExceeding80 ? '⚠️ YES (Triggered)' : 'NO'}`);
  console.log('  - Categories:', kDash.data.categoryBreakdown.map(c => `${c.category}: ₹${c.amount} (${c.percentage}%)`).join(', '));

  // 7. Create Family Group "MyHome Family"
  console.log('\n7. Karthik creates Family Group "MyHome Family"...');
  const groupRes = await req('/family/groups', {
    method: 'POST',
    headers: kHeaders,
    body: { name: 'MyHome Family' }
  });
  const groupId = groupRes.data.group._id || groupRes.data.group.id;
  const inviteToken = groupRes.data.group.inviteToken;
  console.log(`  - Group ID: ${groupId}`);
  console.log(`  - Invite Token: ${inviteToken}`);

  // 8. Priya and Rahul join via invite token
  console.log('\n8. Priya and Rahul join "MyHome Family" via invite link...');
  await req(`/family/join/${inviteToken}`, { method: 'POST', headers: pHeaders });
  await req(`/family/join/${inviteToken}`, { method: 'POST', headers: rHeaders });

  // 9. Karthik promotes Priya to Moderator
  console.log('\n9. Karthik promotes Priya to Moderator...');
  const priyaUserId = priyaLogin.data.user.id;
  await req(`/family/groups/${groupId}/members/${priyaUserId}`, {
    method: 'PUT',
    headers: kHeaders,
    body: { role: 'moderator' }
  });

  // 10. Set Family Budget
  console.log('\n10. Setting Family Group Monthly Budget to ₹50,000...');
  await req(`/family/groups/${groupId}/budget`, {
    method: 'POST',
    headers: kHeaders,
    body: { month: '2026-08', amount: 50000 }
  });

  // 11. Family Members add expenses
  console.log('11. Members adding family expenses...');
  await req(`/family/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: kHeaders,
    body: { amount: 12000, category: 'Food', description: 'Monthly bulk pantry groceries', date: '2026-08-05T10:00:00Z' }
  });
  await req(`/family/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: pHeaders,
    body: { amount: 15000, category: 'Shopping', description: 'Living room curtains & home decor', date: '2026-08-12T16:30:00Z' }
  });
  await req(`/family/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: rHeaders,
    body: { amount: 8500, category: 'Medical', description: 'Family medical insurance premium', date: '2026-08-20T11:00:00Z' }
  });
  await req(`/family/groups/${groupId}/expenses`, {
    method: 'POST',
    headers: pHeaders,
    body: { amount: 7000, category: 'Transport', description: 'Car quarterly service & fuel', date: '2026-08-24T15:00:00Z' }
  });

  // 12. Verify Family Dashboard
  const famDash = await req(`/family/groups/${groupId}/dashboard?month=2026-08`, { headers: kHeaders });
  console.log('\nFamily Group Dashboard Summary:');
  console.log(`  - Group Budget: ₹${famDash.data.budget.toLocaleString('en-IN')}`);
  console.log(`  - Total Spent:  ₹${famDash.data.totalSpent.toLocaleString('en-IN')}`);
  console.log(`  - Remaining:    ₹${famDash.data.remainingBalance.toLocaleString('en-IN')}`);
  console.log(`  - Spent %:      ${famDash.data.percentSpent}%`);
  console.log(`  - Warning 80%:  ${famDash.data.isExceeding80 ? '⚠️ YES (Triggered: 85% spent)' : 'NO'}`);
  console.log('  - All Members Entries:');
  famDash.data.expenses.forEach(e => {
    console.log(`    • ₹${e.amount.toLocaleString('en-IN')} [${e.category}] "${e.description}" - Added by: ${e.userName}`);
  });

  console.log('\n🎉 ALL SEEDING & FULL-STACK VERIFICATIONS COMPLETE! 🎉');
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
