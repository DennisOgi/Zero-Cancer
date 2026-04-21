#!/usr/bin/env node

/**
 * ZeroCancer Local Demo Startup Script
 * 
 * This script helps you start the demo environment locally
 * with all the test accounts ready to use.
 */

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

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

function runCommand(command, args, cwd, name) {
  return new Promise((resolve, reject) => {
    log(`\n🚀 Starting ${name}...`, 'blue');
    log(`Command: ${command} ${args.join(' ')}`, 'yellow');
    log(`Directory: ${cwd}`, 'yellow');
    
    const process = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: true
    });
    
    process.on('close', (code) => {
      if (code === 0) {
        log(`✅ ${name} started successfully`, 'green');
        resolve();
      } else {
        log(`❌ ${name} failed with code ${code}`, 'red');
        reject(new Error(`${name} failed`));
      }
    });
    
    process.on('error', (error) => {
      log(`❌ ${name} error: ${error.message}`, 'red');
      reject(error);
    });
  });
}

async function checkPrerequisites() {
  log('🔍 Checking Prerequisites...', 'blue');
  
  // Check if node_modules exist
  try {
    const fs = await import('fs');
    const backendNodeModules = join(rootDir, 'apps/backend/node_modules');
    const frontendNodeModules = join(rootDir, 'apps/frontend/node_modules');
    
    if (!fs.existsSync(backendNodeModules)) {
      log('❌ Backend dependencies not installed', 'red');
      log('Run: cd apps/backend && npm install', 'yellow');
      return false;
    }
    
    if (!fs.existsSync(frontendNodeModules)) {
      log('❌ Frontend dependencies not installed', 'red');
      log('Run: cd apps/frontend && npm install', 'yellow');
      return false;
    }
    
    log('✅ Dependencies are installed', 'green');
    return true;
  } catch (error) {
    log(`❌ Error checking prerequisites: ${error.message}`, 'red');
    return false;
  }
}

function displayDemoInfo() {
  log('\n🎯 ZeroCancer Demo Environment', 'bold');
  log('================================', 'blue');
  
  log('\n🔗 URLs:', 'blue');
  log('   Frontend: http://localhost:3000');
  log('   Backend:  http://localhost:8787');
  
  log('\n👤 Test Accounts:', 'blue');
  
  log('\n🏥 Centers:', 'yellow');
  log('   Email: center1@zerocancer.org');
  log('   Password: centerpass');
  log('   Login: http://localhost:3000/staff/login');
  
  log('\n🤒 Patients:', 'yellow');
  log('   Email: testpatient1@example.com');
  log('   Password: password123');
  log('   Login: http://localhost:3000/login');
  
  log('\n💰 Donors:', 'yellow');
  log('   Email: testdonor1@example.com');
  log('   Password: password123');
  log('   Login: http://localhost:3000/login');
  
  log('\n👨‍💼 Admins:', 'yellow');
  log('   Email: ttaiwo4910@gmail.com');
  log('   Password: fake.password');
  log('   Login: http://localhost:3000/admin/login');
  
  log('\n🎬 Demo Scenarios:', 'blue');
  log('   1. Patient Journey: Login → Waitlists → Matched Funding');
  log('   2. Donor Impact: Login → Campaigns → Patients Helped');
  log('   3. Center Operations: Login → Appointments → Staff Management');
  log('   4. Admin Overview: Login → Analytics → Matching Algorithm');
  
  log('\n📖 Guides:', 'blue');
  log('   - DEMO_TESTING_GUIDE.md - Detailed demo scenarios');
  log('   - QUICK_START_TESTING.md - Quick reference');
  log('   - DEMO_READY_SUMMARY.md - Demo day checklist');
}

async function main() {
  log('🚀 ZeroCancer Local Demo Setup', 'bold');
  log('===============================', 'blue');
  
  // Check prerequisites
  const prereqsOk = await checkPrerequisites();
  if (!prereqsOk) {
    log('\n❌ Prerequisites not met. Please install dependencies first.', 'red');
    process.exit(1);
  }
  
  displayDemoInfo();
  
  log('\n🔧 Starting Services...', 'blue');
  log('This will start both backend and frontend servers.', 'yellow');
  log('Press Ctrl+C to stop all services.', 'yellow');
  
  // Start backend
  const backendDir = join(rootDir, 'apps/backend');
  const backendProcess = spawn('npm', ['run', 'dev'], {
    cwd: backendDir,
    stdio: 'inherit',
    shell: true
  });
  
  // Wait a bit for backend to start
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Start frontend
  const frontendDir = join(rootDir, 'apps/frontend');
  const frontendProcess = spawn('npm', ['run', 'dev'], {
    cwd: frontendDir,
    stdio: 'inherit',
    shell: true
  });
  
  // Handle cleanup
  process.on('SIGINT', () => {
    log('\n🛑 Shutting down demo environment...', 'yellow');
    backendProcess.kill();
    frontendProcess.kill();
    process.exit(0);
  });
  
  // Keep the script running
  await new Promise(() => {});
}

main().catch(console.error);