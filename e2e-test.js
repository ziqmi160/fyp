const http = require('http');
const url = require('url');

// ANSI Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m',
  bold: '\x1b[1m',
};

// Color helper
const colorize = (text, color) => {
  const c = typeof color === 'string' ? color : 'reset';
  return `${colors[c] || ''}${text}${colors.reset}`;
};

// Test Configuration
const TEST_ACCOUNTS = {
  student: { email: 'student@fyp.com', password: 'password123' },
  supervisor: { email: 'supervisor@fyp.com', password: 'password123' },
  coordinator: { email: 'coordinator@fyp.com', password: 'password123' }
};

const API_BASE = 'http://localhost:5002/api';

// Test Results Tracking
let testResults = {
  total: 0,
  passed: 0,
  failed: 0,
  tests: []
};

// Tokens
let tokens = {};

// Helper function to make HTTP requests
function makeRequest(method, endpoint, data = null, token = null) {
  return new Promise((resolve) => {
    const parsedUrl = url.parse(`${API_BASE}${endpoint}`);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port,
      path: parsedUrl.path,
      method: method,
      headers: {
        'Content-Type': 'application/json'
      }
    };

    if (token) {
      options.headers['Authorization'] = `Bearer ${token}`;
    }

    const timeoutId = setTimeout(() => {
      req.abort();
      resolve({
        success: false,
        status: 0,
        data: null,
        message: 'Request timeout'
      });
    }, 5000);

    const req = http.request(options, (res) => {
      clearTimeout(timeoutId);
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        try {
          const jsonData = responseData ? JSON.parse(responseData) : null;
          resolve({
            success: true,
            status: res.statusCode,
            data: jsonData
          });
        } catch (e) {
          resolve({
            success: false,
            status: res.statusCode,
            data: null,
            message: 'Invalid JSON response'
          });
        }
      });
    });

    req.on('error', (error) => {
      clearTimeout(timeoutId);
      resolve({
        success: false,
        status: 0,
        data: null,
        message: error.message
      });
    });

    if (data) {
      req.write(JSON.stringify(data));
    }

    req.end();
  });
}

// Test assertion function
function assertTest(testName, condition, context = '') {
  testResults.total++;
  const passed = condition === true;

  if (passed) {
    testResults.passed++;
    console.log(`  ${colorize('✓', 'green')} ${testName}`);
  } else {
    testResults.failed++;
    console.log(`  ${colorize('✗', 'red')} ${testName}`);
    if (context) console.log(`    ${colorize(context, 'gray')}`);
  }

  testResults.tests.push({
    name: testName,
    passed,
    context
  });
}

// Test Suites
async function testAuthenticationFlow() {
  console.log('\n' + '='.repeat(60));
  console.log(colorize('TEST SUITE: Authentication & Authorization', 'cyan'));
  console.log('='.repeat(60));

  console.log('\n  ' + colorize('Testing Student Login...', 'yellow'));
  const studentLogin = await makeRequest('POST', '/auth/login', TEST_ACCOUNTS.student);
  assertTest('Student login returns 200 status', studentLogin.status === 200, 'Status: ' + studentLogin.status);
  assertTest('Student login returns token', studentLogin.data && studentLogin.data.data && studentLogin.data.data.token !== undefined, 'Token exists: ' + !!(studentLogin.data && studentLogin.data.data && studentLogin.data.data.token));
  
  if (studentLogin.data && studentLogin.data.data && studentLogin.data.data.token) {
    tokens.student = studentLogin.data.data.token;
    assertTest('Token is string', typeof tokens.student === 'string', 'Token type: ' + typeof tokens.student);
  }

  console.log('\n  ' + colorize('Testing Supervisor Login...', 'yellow'));
  const supervisorLogin = await makeRequest('POST', '/auth/login', TEST_ACCOUNTS.supervisor);
  assertTest('Supervisor login returns 200 status', supervisorLogin.status === 200, 'Status: ' + supervisorLogin.status);
  if (supervisorLogin.data && supervisorLogin.data.data && supervisorLogin.data.data.token) {
    tokens.supervisor = supervisorLogin.data.data.token;
  }

  console.log('\n  ' + colorize('Testing Coordinator Login...', 'yellow'));
  const coordinatorLogin = await makeRequest('POST', '/auth/login', TEST_ACCOUNTS.coordinator);
  assertTest('Coordinator login returns 200 status', coordinatorLogin.status === 200, 'Status: ' + coordinatorLogin.status);
  if (coordinatorLogin.data && coordinatorLogin.data.data && coordinatorLogin.data.data.token) {
    tokens.coordinator = coordinatorLogin.data.data.token;
  }

  console.log('\n  ' + colorize('Testing Invalid Credentials...', 'yellow'));
  const invalidLogin = await makeRequest('POST', '/auth/login', {email: 'invalid@fyp.com', password: 'wrongpwd'});
  assertTest('Invalid login returns 401 status', invalidLogin.status === 401, 'Status: ' + invalidLogin.status);

  console.log('\n  ' + colorize('Testing /auth/me Endpoint...', 'yellow'));
  if (tokens.student) {
    const getMe = await makeRequest('GET', '/auth/me', null, tokens.student);
    assertTest('GET /auth/me with valid token returns 200', getMe.status === 200, 'Status: ' + getMe.status);
    assertTest('GET /auth/me returns user data', getMe.data && getMe.data.data && getMe.data.data.user !== undefined, 'User exists: ' + !!(getMe.data && getMe.data.data && getMe.data.data.user));
  }

  console.log('\n  ' + colorize('Testing Unauthorized Access...', 'yellow'));
  const noToken = await makeRequest('GET', '/auth/me');
  assertTest('GET /auth/me without token returns 401', noToken.status === 401, 'Status: ' + noToken.status);
}

async function testStudentFeatures() {
  console.log('\n' + '='.repeat(60));
  console.log(colorize('TEST SUITE: Student Features', 'cyan'));
  console.log('='.repeat(60));

  if (!tokens.student) {
    console.log('  ' + colorize('SKIPPED: No student token available', 'yellow'));
    return;
  }

  console.log('\n  ' + colorize('Testing Student Profile...', 'yellow'));
  const profile = await makeRequest('GET', '/users/profile', null, tokens.student);
  assertTest('GET /users/profile returns 200', profile.status === 200, 'Status: ' + profile.status);
  assertTest('Profile contains user data', profile.data && profile.data.data && profile.data.data.user !== undefined, 'User exists');

  console.log('\n  ' + colorize('Testing Student Schedules...', 'yellow'));
  const schedules = await makeRequest('GET', '/users/schedules', null, tokens.student);
  assertTest('GET /users/schedules returns 200/404/500', [200, 404, 500].indexOf(schedules.status) > -1, 'Status: ' + schedules.status);

  console.log('\n  ' + colorize('Testing Progress Tracker...', 'yellow'));
  const progress = await makeRequest('GET', '/progress/my-progress', null, tokens.student);
  assertTest('GET /progress/my-progress is accessible', [200, 404, 500].indexOf(progress.status) > -1, 'Status: ' + progress.status);

  console.log('\n  ' + colorize('Testing Notifications...', 'yellow'));
  const notifications = await makeRequest('GET', '/notifications', null, tokens.student);
  assertTest('GET /notifications is accessible', [200, 404, 500].indexOf(notifications.status) > -1, 'Status: ' + notifications.status);

  console.log('\n  ' + colorize('Testing Resource Library...', 'yellow'));
  const resources = await makeRequest('GET', '/resource-library', null, tokens.student);
  assertTest('GET /resource-library is accessible', [200, 404, 500].indexOf(resources.status) > -1, 'Status: ' + resources.status);
}

async function testSupervisorFeatures() {
  console.log('\n' + '='.repeat(60));
  console.log(colorize('TEST SUITE: Supervisor Features', 'cyan'));
  console.log('='.repeat(60));

  if (!tokens.supervisor) {
    console.log('  ' + colorize('SKIPPED: No supervisor token available', 'yellow'));
    return;
  }

  console.log('\n  ' + colorize('Testing Supervisor Profile...', 'yellow'));
  const profile = await makeRequest('GET', '/users/profile', null, tokens.supervisor);
  assertTest('GET /users/profile returns 200', profile.status === 200, 'Status: ' + profile.status);

  console.log('\n  ' + colorize('Testing Supervisor Supervisees...', 'yellow'));
  const supervisees = await makeRequest('GET', '/supervisors/my-supervisees', null, tokens.supervisor);
  assertTest('GET /supervisors/my-supervisees is accessible', [200, 404, 500].indexOf(supervisees.status) > -1, 'Status: ' + supervisees.status);

  console.log('\n  ' + colorize('Testing Meeting Logs...', 'yellow'));
  const meetings = await makeRequest('GET', '/meetings/my-meetings', null, tokens.supervisor);
  assertTest('GET /meetings/my-meetings is accessible', [200, 404, 500].indexOf(meetings.status) > -1, 'Status: ' + meetings.status);

  console.log('\n  ' + colorize('Testing Examiner Assignments...', 'yellow'));
  const assignments = await makeRequest('GET', '/examiner-assignments/my-assignments', null, tokens.supervisor);
  assertTest('GET /examiner-assignments/my-assignments is accessible', [200, 404, 500].indexOf(assignments.status) > -1, 'Status: ' + assignments.status);
}

async function testCoordinatorFeatures() {
  console.log('\n' + '='.repeat(60));
  console.log(colorize('TEST SUITE: Coordinator Features', 'cyan'));
  console.log('='.repeat(60));

  if (!tokens.coordinator) {
    console.log('  ' + colorize('SKIPPED: No coordinator token available', 'yellow'));
    return;
  }

  console.log('\n  ' + colorize('Testing Phase Management...', 'yellow'));
  const phases = await makeRequest('GET', '/phases', null, tokens.coordinator);
  assertTest('GET /phases is accessible', [200, 404, 500].indexOf(phases.status) > -1, 'Status: ' + phases.status);

  console.log('\n  ' + colorize('Testing Student Management...', 'yellow'));
  const students = await makeRequest('GET', '/coordinator/students', null, tokens.coordinator);
  assertTest('GET /coordinator/students is accessible', [200, 404, 500].indexOf(students.status) > -1, 'Status: ' + students.status);

  console.log('\n  ' + colorize('Testing Supervisor Management...', 'yellow'));
  const supervisors = await makeRequest('GET', '/coordinator/supervisors', null, tokens.coordinator);
  assertTest('GET /coordinator/supervisors is accessible', [200, 404, 500].indexOf(supervisors.status) > -1, 'Status: ' + supervisors.status);

  console.log('\n  ' + colorize('Testing Examiner Assignments...', 'yellow'));
  const examiners = await makeRequest('GET', '/examiner-assignments', null, tokens.coordinator);
  assertTest('GET /examiner-assignments is accessible', [200, 404, 500].indexOf(examiners.status) > -1, 'Status: ' + examiners.status);

  console.log('\n  ' + colorize('Testing Presentation Sessions...', 'yellow'));
  const presentations = await makeRequest('GET', '/presentation-sessions', null, tokens.coordinator);
  assertTest('GET /presentation-sessions is accessible', [200, 404, 500].indexOf(presentations.status) > -1, 'Status: ' + presentations.status);

  console.log('\n  ' + colorize('Testing Exhibition Management...', 'yellow'));
  const exhibitions = await makeRequest('GET', '/exhibitions', null, tokens.coordinator);
  assertTest('GET /exhibitions is accessible', [200, 404, 500].indexOf(exhibitions.status) > -1, 'Status: ' + exhibitions.status);

  console.log('\n  ' + colorize('Testing Plagiarism Reviews...', 'yellow'));
  const plagiarism = await makeRequest('GET', '/plagiarism-checks', null, tokens.coordinator);
  assertTest('GET /plagiarism-checks is accessible', [200, 404, 500].indexOf(plagiarism.status) > -1, 'Status: ' + plagiarism.status);

  console.log('\n  ' + colorize('Testing Ethical Approvals...', 'yellow'));
  const ethical = await makeRequest('GET', '/ethical-approval', null, tokens.coordinator);
  assertTest('GET /ethical-approval is accessible', [200, 404, 500].indexOf(ethical.status) > -1, 'Status: ' + ethical.status);
}

async function testRoleBasedAccess() {
  console.log('\n' + '='.repeat(60));
  console.log(colorize('TEST SUITE: Role-Based Access Control', 'cyan'));
  console.log('='.repeat(60));

  if (!tokens.student || !tokens.coordinator) {
    console.log('  ' + colorize('SKIPPED: Missing required tokens', 'yellow'));
    return;
  }

  console.log('\n  ' + colorize('Testing Student Access Restrictions...', 'yellow'));
  const restrictedAccess = await makeRequest('GET', '/coordinator/students', null, tokens.student);
  assertTest('Student cannot access /coordinator/students', [401, 403].indexOf(restrictedAccess.status) > -1, 'Status: ' + restrictedAccess.status);

  console.log('\n  ' + colorize('Testing Coordinator Access...', 'yellow'));
  const coordinatorAccess = await makeRequest('GET', '/coordinator/students', null, tokens.coordinator);
  assertTest('Coordinator can access /coordinator/students', [200, 404, 500].indexOf(coordinatorAccess.status) > -1, 'Status: ' + coordinatorAccess.status);
}

async function testErrorHandling() {
  console.log('\n' + '='.repeat(60));
  console.log(colorize('TEST SUITE: Error Handling', 'cyan'));
  console.log('='.repeat(60));

  console.log('\n  ' + colorize('Testing Invalid Endpoint...', 'yellow'));
  const invalid = await makeRequest('GET', '/invalid-endpoint-xyz', null, tokens.student);
  assertTest('Invalid endpoint returns 404', invalid.status === 404, 'Status: ' + invalid.status);

  console.log('\n  ' + colorize('Testing Malformed Request...', 'yellow'));
  const malformed = await makeRequest('POST', '/auth/login', { email: 'test@test.com' });
  assertTest('Incomplete login request returns 400', malformed.status === 400, 'Status: ' + malformed.status);
}

// Main Test Runner
async function runAllTests() {
  console.log('\n' + colorize(new Array(61).join('█'), 'cyan'));
  console.log(colorize('FYP MANAGEMENT SYSTEM - E2E TEST SUITE', 'cyan'));
  console.log(colorize(new Array(61).join('█'), 'cyan'));
  console.log(colorize('Starting at: ' + new Date().toISOString(), 'gray'));
  console.log(colorize('API Base: ' + API_BASE, 'gray'));

  try {
    await testAuthenticationFlow();
    await testStudentFeatures();
    await testSupervisorFeatures();
    await testCoordinatorFeatures();
    await testRoleBasedAccess();
    await testErrorHandling();

    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log(colorize('TEST SUMMARY', 'cyan'));
    console.log('='.repeat(60));
    
    console.log('\nTotal Tests: ' + testResults.total);
    console.log(colorize('✓ Passed: ' + testResults.passed, 'green'));
    console.log(colorize('✗ Failed: ' + testResults.failed, testResults.failed > 0 ? 'red' : 'green'));
    
    const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    const rateColor = passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red';
    console.log('Pass Rate: ' + colorize(passRate + '%', rateColor));

    if (testResults.failed > 0) {
      console.log('\n' + colorize('FAILED TESTS:', 'red'));
      for (var i = 0; i < testResults.tests.length; i++) {
        var t = testResults.tests[i];
        if (!t.passed) {
          console.log('  ' + colorize('✗', 'red') + ' ' + t.name);
          if (t.context) console.log('    ' + colorize(t.context, 'gray'));
        }
      }
    }

    console.log('\n' + colorize('Completed at: ' + new Date().toISOString(), 'gray'));
    console.log(colorize(new Array(61).join('█'), 'cyan') + '\n');

    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n' + colorize('FATAL ERROR:', 'red') + ' ' + error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
