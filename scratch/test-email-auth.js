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

async function runEmailAuthTests() {
  console.log('🧪 Starting Email OTP Verification & Recovery Automated Tests...\n');

  const testEmail = `user_${Date.now()}@example.com`;
  const testUsername = `user_${Date.now()}`;
  const testPassword = 'InitialPassword123';
  const newPassword = 'BrandNewPassword456';

  // Test 1: Request OTP for Registration
  console.log(`Test 1: Requesting Registration OTP for ${testEmail}...`);
  const otpRes = await req('/auth/send-register-otp', {
    method: 'POST',
    body: {
      name: 'Test Explorer',
      email: testEmail,
      username: testUsername
    }
  });
  console.log('OTP Request Status:', otpRes.status, otpRes.data?.message);
  if (otpRes.status !== 200) throw new Error('Failed to request registration OTP');
  const previewOtp = otpRes.data?.previewOtp;
  console.log('Received OTP:', previewOtp);

  // Test 2: Attempt Registration with wrong OTP
  console.log('\nTest 2: Attempting Registration with INVALID OTP (999999)...');
  const invalidReg = await req('/auth/register', {
    method: 'POST',
    body: {
      name: 'Test Explorer',
      email: testEmail,
      username: testUsername,
      password: testPassword,
      otp: '999999'
    }
  });
  console.log('Invalid OTP Status (Expected 400):', invalidReg.status, invalidReg.data?.error);
  if (invalidReg.status !== 400) throw new Error('Expected 400 for invalid OTP');

  // Test 3: Complete Registration with VALID OTP
  console.log(`\nTest 3: Completing Registration with VALID OTP (${previewOtp})...`);
  const validReg = await req('/auth/register', {
    method: 'POST',
    body: {
      name: 'Test Explorer',
      email: testEmail,
      username: testUsername,
      password: testPassword,
      otp: previewOtp
    }
  });
  console.log('Registration Status:', validReg.status, validReg.data?.user);
  if (validReg.status !== 201) throw new Error('Registration with valid OTP failed');

  // Test 4: Attempt duplicate registration with same email
  console.log('\nTest 4: Testing duplicate email rejection...');
  const dupEmailRes = await req('/auth/send-register-otp', {
    method: 'POST',
    body: {
      name: 'Duplicate User',
      email: testEmail,
      username: `another_${Date.now()}`
    }
  });
  console.log('Duplicate Email Status (Expected 400):', dupEmailRes.status, dupEmailRes.data?.error);
  if (dupEmailRes.status !== 400) throw new Error('Duplicate email should be rejected with 400');

  // Test 5: Login with Username
  console.log('\nTest 5: Logging in using USERNAME...');
  const loginUser = await req('/auth/login', {
    method: 'POST',
    body: { username: testUsername, password: testPassword }
  });
  console.log('Login with Username Status:', loginUser.status, loginUser.data?.user?.username);
  if (loginUser.status !== 200) throw new Error('Login with username failed');

  // Test 6: Login with EMAIL
  console.log('\nTest 6: Logging in using EMAIL address...');
  const loginEmail = await req('/auth/login', {
    method: 'POST',
    body: { username: testEmail, password: testPassword }
  });
  console.log('Login with Email Status:', loginEmail.status, loginEmail.data?.user?.email);
  if (loginEmail.status !== 200) throw new Error('Login with email failed');

  // Test 7: Forgot Username Request
  console.log('\nTest 7: Requesting Forgot Username recovery...');
  const forgotUserRes = await req('/auth/forgot-username', {
    method: 'POST',
    body: { email: testEmail }
  });
  console.log('Forgot Username Status:', forgotUserRes.status, forgotUserRes.data?.message);
  if (forgotUserRes.status !== 200) throw new Error('Forgot username failed');

  // Test 8: Forgot Password - Request Reset OTP
  console.log('\nTest 8: Requesting Password Reset OTP...');
  const resetOtpRes = await req('/auth/send-reset-otp', {
    method: 'POST',
    body: { identifier: testEmail }
  });
  console.log('Reset OTP Status:', resetOtpRes.status, resetOtpRes.data?.message);
  if (resetOtpRes.status !== 200) throw new Error('Failed to request reset OTP');
  const resetOtp = resetOtpRes.data?.previewOtp;
  console.log('Password Reset OTP:', resetOtp);

  // Test 9: Reset Password with OTP
  console.log(`\nTest 9: Resetting password using OTP (${resetOtp})...`);
  const resetPassRes = await req('/auth/reset-password', {
    method: 'POST',
    body: {
      email: testEmail,
      otp: resetOtp,
      newPassword: newPassword
    }
  });
  console.log('Reset Password Status:', resetPassRes.status, resetPassRes.data?.message);
  if (resetPassRes.status !== 200) throw new Error('Reset password failed');

  // Test 10: Verify Login with Old Password Fails
  console.log('\nTest 10: Verifying Old Password fails...');
  const oldPassLogin = await req('/auth/login', {
    method: 'POST',
    body: { username: testUsername, password: testPassword }
  });
  console.log('Old Password Login Status (Expected 400):', oldPassLogin.status, oldPassLogin.data?.error);
  if (oldPassLogin.status !== 400) throw new Error('Old password should not work after reset');

  // Test 11: Verify Login with New Password Succeeds
  console.log('\nTest 11: Verifying New Password succeeds...');
  const newPassLogin = await req('/auth/login', {
    method: 'POST',
    body: { username: testUsername, password: newPassword }
  });
  console.log('New Password Login Status:', newPassLogin.status, newPassLogin.data?.user?.username);
  if (newPassLogin.status !== 200) throw new Error('New password login failed');

  console.log('\n✨ ALL 11 EMAIL OTP & ACCOUNT RECOVERY TESTS PASSED! ✨\n');
}

runEmailAuthTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
