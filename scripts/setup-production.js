#!/usr/bin/env node

/**
 * ZeroCancer Production Setup Script
 * 
 * This script helps set up the production environment by:
 * 1. Validating environment variables
 * 2. Creating secure admin accounts
 * 3. Verifying database connectivity
 * 4. Running security checks
 */

const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const prisma = new PrismaClient();

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

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function questionHidden(prompt) {
  return new Promise((resolve) => {
    process.stdout.write(prompt);
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    
    let password = '';
    process.stdin.on('data', function(char) {
      char = char + '';
      switch (char) {
        case '\n':
        case '\r':
        case '\u0004':
          process.stdin.setRawMode(false);
          process.stdin.pause();
          process.stdout.write('\n');
          resolve(password);
          break;
        case '\u0003':
          process.exit();
          break;
        default:
          password += char;
          process.stdout.write('*');
          break;
      }
    });
  });
}

async function validateEnvironment() {
  log('\n🔍 Validating Environment Variables...', 'blue');
  
  const requiredVars = [
    'DATABASE_URL',
    'JWT_TOKEN_SECRET',
    'FRONTEND_URL',
    'PAYSTACK_SECRET_KEY',
    'PAYSTACK_PUBLIC_KEY',
    'CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET'
  ];
  
  const issues = [];
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    
    if (!value) {
      issues.push(`❌ ${varName} is not set`);
    } else if (value.includes('placeholder') || value.includes('your-') || value.includes('example')) {
      issues.push(`⚠️  ${varName} contains placeholder value: ${value}`);
    } else if (varName === 'JWT_TOKEN_SECRET' && value.length < 32) {
      issues.push(`⚠️  ${varName} is too short (minimum 32 characters)`);
    } else if (varName === 'PAYSTACK_SECRET_KEY' && value.startsWith('sk_test_')) {
      issues.push(`⚠️  ${varName} is using test key (should be live key for production)`);
    } else {
      log(`✅ ${varName} is configured`, 'green');
    }
  }
  
  if (issues.length > 0) {
    log('\n🚨 Environment Issues Found:', 'red');
    issues.forEach(issue => log(issue, 'yellow'));
    
    const proceed = await question('\nDo you want to continue anyway? (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      log('Exiting. Please fix environment issues first.', 'red');
      process.exit(1);
    }
  } else {
    log('✅ All environment variables are properly configured!', 'green');
  }
}

async function testDatabaseConnection() {
  log('\n🔗 Testing Database Connection...', 'blue');
  
  try {
    await prisma.$connect();
    log('✅ Database connection successful!', 'green');
    
    // Check if database is empty (production setup)
    const userCount = await prisma.user.count();
    const centerCount = await prisma.serviceCenter.count();
    const adminCount = await prisma.admins.count();
    
    log(`📊 Current database state:`, 'blue');
    log(`   Users: ${userCount}`);
    log(`   Centers: ${centerCount}`);
    log(`   Admins: ${adminCount}`);
    
    if (userCount > 0 || centerCount > 0) {
      log('\n⚠️  Database contains existing data!', 'yellow');
      const cleanup = await question('Do you want to run the cleanup script to remove test data? (y/N): ');
      
      if (cleanup.toLowerCase() === 'y') {
        log('Please run the cleanup script first: npm run cleanup:production', 'yellow');
        process.exit(1);
      }
    }
    
  } catch (error) {
    log(`❌ Database connection failed: ${error.message}`, 'red');
    process.exit(1);
  }
}

async function checkForTestAccounts() {
  log('\n🔍 Checking for Test Accounts...', 'blue');
  
  const testEmails = [
    'testpatient1@example.com',
    'testdonor1@example.com', 
    'center1@zerocancer.org',
    'admin@zerocancer.com'
  ];
  
  const foundTestAccounts = [];
  
  for (const email of testEmails) {
    const user = await prisma.user.findUnique({ where: { email } });
    const admin = await prisma.admins.findUnique({ where: { email } });
    const center = await prisma.serviceCenter.findUnique({ where: { email } });
    
    if (user || admin || center) {
      foundTestAccounts.push(email);
    }
  }
  
  if (foundTestAccounts.length > 0) {
    log('🚨 CRITICAL: Test accounts found in database!', 'red');
    foundTestAccounts.forEach(email => log(`   - ${email}`, 'red'));
    log('\nThese accounts have weak passwords and MUST be removed before production!', 'red');
    
    const proceed = await question('\nDo you want to continue anyway? (NOT RECOMMENDED) (y/N): ');
    if (proceed.toLowerCase() !== 'y') {
      log('Exiting. Please run cleanup script first: npm run cleanup:production', 'red');
      process.exit(1);
    }
  } else {
    log('✅ No test accounts found!', 'green');
  }
}

async function createAdminAccount() {
  log('\n👤 Creating Production Admin Account...', 'blue');
  
  const existingAdmins = await prisma.admins.count();
  if (existingAdmins > 0) {
    log(`Found ${existingAdmins} existing admin(s)`, 'yellow');
    const create = await question('Do you want to create another admin account? (y/N): ');
    if (create.toLowerCase() !== 'y') {
      return;
    }
  }
  
  const fullName = await question('Admin Full Name: ');
  const email = await question('Admin Email: ');
  
  // Validate email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    log('❌ Invalid email format', 'red');
    return;
  }
  
  // Check if email already exists
  const existing = await prisma.admins.findUnique({ where: { email } });
  if (existing) {
    log('❌ Admin with this email already exists', 'red');
    return;
  }
  
  let password;
  let confirmPassword;
  
  do {
    password = await questionHidden('Admin Password (min 12 characters): ');
    
    if (password.length < 12) {
      log('\n❌ Password must be at least 12 characters long', 'red');
      continue;
    }
    
    confirmPassword = await questionHidden('Confirm Password: ');
    
    if (password !== confirmPassword) {
      log('\n❌ Passwords do not match', 'red');
    }
  } while (password !== confirmPassword || password.length < 12);
  
  try {
    const passwordHash = await bcrypt.hash(password, 12);
    
    const admin = await prisma.admins.create({
      data: {
        fullName,
        email,
        passwordHash
      }
    });
    
    log(`\n✅ Admin account created successfully!`, 'green');
    log(`   ID: ${admin.id}`, 'blue');
    log(`   Name: ${admin.fullName}`, 'blue');
    log(`   Email: ${admin.email}`, 'blue');
    
  } catch (error) {
    log(`❌ Failed to create admin account: ${error.message}`, 'red');
  }
}

async function generateSecureJWT() {
  log('\n🔐 JWT Security Check...', 'blue');
  
  const currentSecret = process.env.JWT_TOKEN_SECRET;
  
  if (!currentSecret || currentSecret.length < 64) {
    log('⚠️  JWT secret is not secure enough for production', 'yellow');
    
    const generate = await question('Generate a new secure JWT secret? (y/N): ');
    if (generate.toLowerCase() === 'y') {
      const newSecret = crypto.randomBytes(64).toString('hex');
      log('\n🔑 New JWT Secret (add this to your .env file):', 'green');
      log(`JWT_TOKEN_SECRET="${newSecret}"`, 'bold');
      log('\n⚠️  Remember to restart your application after updating the secret!', 'yellow');
    }
  } else {
    log('✅ JWT secret is sufficiently secure', 'green');
  }
}

async function securityChecklist() {
  log('\n🛡️  Production Security Checklist:', 'blue');
  
  const checks = [
    'HTTPS is enabled for all communications',
    'Database connections are encrypted',
    'CORS is configured for production domains only',
    'Rate limiting is enabled on authentication endpoints',
    'Error logging is configured (Sentry, etc.)',
    'Database backups are scheduled',
    'Monitoring and alerting is set up',
    'All test accounts have been removed',
    'Environment variables are secured',
    'File upload limits are configured'
  ];
  
  log('\nPlease verify the following items:', 'yellow');
  checks.forEach((check, index) => {
    log(`   ${index + 1}. ${check}`);
  });
  
  const confirmed = await question('\nHave you verified all items above? (y/N): ');
  if (confirmed.toLowerCase() !== 'y') {
    log('⚠️  Please complete the security checklist before going live', 'yellow');
  } else {
    log('✅ Security checklist confirmed!', 'green');
  }
}

async function main() {
  try {
    log('🚀 ZeroCancer Production Setup', 'bold');
    log('=====================================', 'blue');
    
    await validateEnvironment();
    await testDatabaseConnection();
    await checkForTestAccounts();
    await createAdminAccount();
    await generateSecureJWT();
    await securityChecklist();
    
    log('\n🎉 Production setup completed!', 'green');
    log('\nNext steps:', 'blue');
    log('1. Update your environment variables if needed');
    log('2. Restart your application');
    log('3. Test admin login functionality');
    log('4. Set up monitoring and backups');
    log('5. Go live! 🚀');
    
  } catch (error) {
    log(`\n❌ Setup failed: ${error.message}`, 'red');
    console.error(error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

// Handle Ctrl+C gracefully
process.on('SIGINT', async () => {
  log('\n\nSetup cancelled by user', 'yellow');
  await prisma.$disconnect();
  rl.close();
  process.exit(0);
});

main();