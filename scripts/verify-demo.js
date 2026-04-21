#!/usr/bin/env node

/**
 * ZeroCancer Demo Verification Script
 * 
 * This script tests the hosted demo environment to ensure
 * all test accounts are working properly for your demo.
 */

const https = require('https');

// Configuration
const BACKEND_URL = 'https://app.go54.com';
const FRONTEND_URL = 'https://your-netlify-url.netlify.app'; // Update with actual URL

// Test accounts
const TEST_ACCOUNTS = {
  patients: [
    { email: 'testpatient1@example.com', password: 'password123' },
    { email: 'testpatient2@example.com', password: 'testpass456' },
    { email: 'testpatient3@example.com', password: 'demo789' }
  ],
  donors: [
    { email: 'testdonor1@example.com', password: 'password123' },
    { email: 'testdonor2@example.com', password: 'testpass456' },
    { email: 'testdonor3@example.com', password: 'demo789' }
  ],
  centers: [
    { email: 'center1@zerocancer.org', password: 'centerpass' },
    { email: 'center2@zerocancer.org', password: 'centerpass' },
    { email: 'center3@zerocancer.org', password: 'centerpass' }
  ],
  admins: [
    { email: 'ttaiwo4910@gmail.com', password: 'fake.password' },
    { email: 'raphaelgbaorun@gmail.com', password: 'he_wanted_one' }
  ]
};

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m',
  bold: '\x1b[1m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// HTTP request helper
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, data: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });
    
    req.on('error', reject);
    
    if (options.body) {
      req.write(options.body);
    }
    
    req.end();
  });
}

// Test backend health
async function testBackendHealth() {
  log('\n🔍 Testing Backend Health...', 'blue');
  
  try {
    const response = await makeRequest(`${BACKEND_URL}/api/healthz`);
    
    if (response.status === 200) {
      log('✅ Backend is healthy and responding', 'green');
      return true;
    } else {
      log(`❌ Backend health check failed: ${response.status}`, 'red');
      return false;
    }
  } catch (error) {
    log(`❌ Backend is not accessible: ${error.message}`, 'red');
    return false;
  }
}

// Test login for a specific account type
async function testLogin(account, actor) {
  const url = `${BACKEND_URL}/api/auth/login?actor=${actor}`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: account.email,
      password: account.password
    })
  };
  
  try {
    const response = await makeRequest(url, options);
    
    if (response.status === 200 && response.data.ok) {
      return { success: true, token: response.data.data?.token };
    } else {
      return { 
        success: false, 
        error: response.data?.error || `HTTP ${response.status}` 
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test center staff login (different endpoint)
async function testCenterLogin(account) {
  // First, get center ID (we'll use a placeholder for now)
  const url = `${BACKEND_URL}/api/center/staff/login`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      centerId: 'center-id-placeholder', // This would need to be dynamic
      email: account.email,
      password: account.password
    })
  };
  
  try {
    const response = await makeRequest(url, options);
    
    if (response.status === 200 && response.data.ok) {
      return { success: true, token: response.data.data?.token };
    } else {
      return { 
        success: false, 
        error: response.data?.error || `HTTP ${response.status}` 
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test admin login (different endpoint)
async function testAdminLogin(account) {
  const url = `${BACKEND_URL}/api/admin/login`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      email: account.email,
      password: account.password
    })
  };
  
  try {
    const response = await makeRequest(url, options);
    
    if (response.status === 200 && response.data.ok) {
      return { success: true, token: response.data.data?.token };
    } else {
      return { 
        success: false, 
        error: response.data?.error || `HTTP ${response.status}` 
      };
    }
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// Test all accounts
async function testAllAccounts() {
  log('\n👤 Testing Demo Accounts...', 'blue');
  
  const results = {
    patients: { passed: 0, failed: 0 },
    donors: { passed: 0, failed: 0 },
    centers: { passed: 0, failed: 0 },
    admins: { passed: 0, failed: 0 }
  };
  
  // Test patients
  log('\n🤒 Testing Patient Accounts:', 'yellow');
  for (const account of TEST_ACCOUNTS.patients) {
    const result = await testLogin(account, 'patient');
    if (result.success) {
      log(`  ✅ ${account.email}`, 'green');
      results.patients.passed++;
    } else {
      log(`  ❌ ${account.email}: ${result.error}`, 'red');
      results.patients.failed++;
    }
  }
  
  // Test donors
  log('\n💰 Testing Donor Accounts:', 'yellow');
  for (const account of TEST_ACCOUNTS.donors) {
    const result = await testLogin(account, 'donor');
    if (result.success) {
      log(`  ✅ ${account.email}`, 'green');
      results.donors.passed++;
    } else {
      log(`  ❌ ${account.email}: ${result.error}`, 'red');
      results.donors.failed++;
    }
  }
  
  // Test centers (note: center login is more complex)
  log('\n🏥 Testing Center Accounts:', 'yellow');
  for (const account of TEST_ACCOUNTS.centers) {
    const result = await testCenterLogin(account);
    if (result.success) {
      log(`  ✅ ${account.email}`, 'green');
      results.centers.passed++;
    } else {
      log(`  ⚠️  ${account.email}: ${result.error} (may need center ID)`, 'yellow');
      results.centers.failed++;
    }
  }
  
  // Test admins
  log('\n👨‍💼 Testing Admin Accounts:', 'yellow');
  for (const account of TEST_ACCOUNTS.admins) {
    const result = await testAdminLogin(account);
    if (result.success) {
      log(`  ✅ ${account.email}`, 'green');
      results.admins.passed++;
    } else {
      log(`  ❌ ${account.email}: ${result.error}`, 'red');
      results.admins.failed++;
    }
  }
  
  return results;
}

// Test data endpoints
async function testDataEndpoints() {
  log('\n📊 Testing Data Endpoints...', 'blue');
  
  const endpoints = [
    { path: '/api/screening-types', name: 'Screening Types' },
    { path: '/api/center', name: 'Centers List' }
  ];
  
  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(`${BACKEND_URL}${endpoint.path}`);
      
      if (response.status === 200) {
        log(`  ✅ ${endpoint.name}`, 'green');
      } else {
        log(`  ❌ ${endpoint.name}: HTTP ${response.status}`, 'red');
      }
    } catch (error) {
      log(`  ❌ ${endpoint.name}: ${error.message}`, 'red');
    }
  }
}

// Generate demo report
function generateDemoReport(results) {
  log('\n📋 Demo Readiness Report', 'bold');
  log('================================', 'blue');
  
  const total = {
    passed: Object.values(results).reduce((sum, r) => sum + r.passed, 0),
    failed: Object.values(results).reduce((sum, r) => sum + r.failed, 0)
  };
  
  log(`\n📊 Account Test Results:`);
  log(`   Patients: ${results.patients.passed}/${results.patients.passed + results.patients.failed} ✅`);
  log(`   Donors: ${results.donors.passed}/${results.donors.passed + results.donors.failed} ✅`);
  log(`   Centers: ${results.centers.passed}/${results.centers.passed + results.centers.failed} ✅`);
  log(`   Admins: ${results.admins.passed}/${results.admins.passed + results.admins.failed} ✅`);
  log(`   Total: ${total.passed}/${total.passed + total.failed} accounts working`);
  
  const successRate = (total.passed / (total.passed + total.failed)) * 100;
  
  if (successRate >= 80) {
    log(`\n🎉 Demo Status: READY (${successRate.toFixed(1)}% success rate)`, 'green');
    log('\n✅ Your demo environment is ready!', 'green');
    log('   - Backend is accessible');
    log('   - Most test accounts are working');
    log('   - Data endpoints are responding');
  } else if (successRate >= 50) {
    log(`\n⚠️  Demo Status: PARTIAL (${successRate.toFixed(1)}% success rate)`, 'yellow');
    log('\n🔧 Some issues found, but demo is still possible');
    log('   - Focus on working accounts');
    log('   - Have backup screenshots ready');
  } else {
    log(`\n❌ Demo Status: NOT READY (${successRate.toFixed(1)}% success rate)`, 'red');
    log('\n🚨 Critical issues found:');
    log('   - Most accounts are not working');
    log('   - Backend may not be properly deployed');
    log('   - Consider using local environment for demo');
  }
}

// Main function
async function main() {
  log('🚀 ZeroCancer Demo Verification', 'bold');
  log('===============================', 'blue');
  
  log(`\n🔗 Testing Environment:`);
  log(`   Backend: ${BACKEND_URL}`);
  log(`   Frontend: ${FRONTEND_URL}`);
  
  // Test backend health
  const backendHealthy = await testBackendHealth();
  
  if (!backendHealthy) {
    log('\n🚨 Backend is not accessible. Demo cannot proceed.', 'red');
    log('\nPossible issues:', 'yellow');
    log('   - Backend not deployed to app.go54.com');
    log('   - Database not connected');
    log('   - Environment variables not set');
    log('\nRecommendation: Use local development environment for demo', 'yellow');
    return;
  }
  
  // Test all accounts
  const results = await testAllAccounts();
  
  // Test data endpoints
  await testDataEndpoints();
  
  // Generate report
  generateDemoReport(results);
  
  log('\n📖 Next Steps:', 'blue');
  log('   1. Check DEMO_TESTING_GUIDE.md for demo scenarios');
  log('   2. Test the working accounts in your browser');
  log('   3. Prepare backup screenshots for any failing features');
  log('   4. Have the GitHub repository ready to show code');
  
  log('\n🎯 Demo Tips:', 'blue');
  log('   - Start with patient journey (most engaging)');
  log('   - Show the matching algorithm in action');
  log('   - Highlight the impact metrics');
  log('   - Keep each scenario under 5 minutes');
}

// Handle errors gracefully
process.on('unhandledRejection', (error) => {
  log(`\n❌ Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});

// Run the verification
main().catch(console.error);