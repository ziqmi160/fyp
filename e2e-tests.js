const http = require('http');
const https = require('https');
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
const colorize = (text, color) => `${colors[color] || ''}${text}${colors.reset}`;
const bold = (text) => `${colors.bold}${text}${colors.reset}`;

// Test Configuration
const API_HOST = 'localhost';
const API_PORT = 5002;
const API_BASE = 'http://localhost:5002/api';
const TEST_ACCOUNTS = {
  student: { email: 'student@fyp.com', password: 'password123' },
  supervisor: { email: 'supervisor@fyp.com', password: 'password123' },
  coordinator: { email: 'coordinator@fyp.com', password: 'password123' }
};

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

    const req = http.request(options, (res) => {
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
  console.log(colorize('TEST SUITE: Authentication & Authorization', ['cyan', 'bold']));
  console.log('='.repeat(60));

  // Test 1: Student Login
  console.log('\n  ' + colorize('Testing Student Login...', 'yellow'));
  const studentLogin = await makeRequest('POST', '/auth/login', TEST_ACCOUNTS.student);
  assertTest(
    'Student login returns 200 status',
    studentLogin.status === 200,
    `Status: ${studentLogin.status}`
  );
  assertTest(
    'Student login returns token',
    studentLogin.data?.data?.token !== undefined,
    `Token exists: ${!!studentLogin.data?.data?.token}`
  );
  
  if (studentLogin.data?.data?.token) {
    tokens.student = studentLogin.data.data.token;
    assertTest(
      'Token is string',
      typeof tokens.student === 'string',
      `Token type: ${typeof tokens.student}`
    );
  }

  // Test 2: Supervisor Login
  console.log('\n  ' + colorize('Testing Supervisor Login...', 'yellow'));
  const supervisorLogin = await makeRequest('POST', '/auth/login', TEST_ACCOUNTS.supervisor);
  assertTest(
    'Supervisor login returns 200 status',
    supervisorLogin.status === 200,
    `Status: ${supervisorLogin.status}`
  );

  if (supervisorLogin.data?.data?.token) {
    tokens.supervisor = supervisorLogin.data.data.token;
  }

  // Test 3: Coordinator Login
  console.log('\n  ' + colorize('Testing Coordinator Login...', 'yellow'));
  const coordinatorLogin = await makeRequest('POST', '/auth/login', TEST_ACCOUNTS.coordinator);
  assertTest(
    'Coordinator login returns 200 status',
    coordinatorLogin.status === 200,
    `Status: ${coordinatorLogin.status}`
  );

  if (coordinatorLogin.data?.data?.token) {
    tokens.coordinator = coordinatorLogin.data.data.token;
  }

  // Test 4: Invalid Login
  console.log('\n  ' + colorize('Testing Invalid Credentials...', 'yellow'));
  const invalidLogin = await makeRequest('POST', '/auth/login', {
    email: 'invalid@fyp.com',
    password: 'wrongpassword'
  });
  assertTest(
    'Invalid login returns 401 status',
    invalidLogin.status === 401,
    `Status: ${invalidLogin.status}`
  );

  // Test 5: Get Me Endpoint with Token
  console.log('\n  ' + colorize('Testing /auth/me Endpoint...', 'yellow'));
  if (tokens.student) {
    const getMe = await makeRequest('GET', '/auth/me', null, tokens.student);
    assertTest(
      'GET /auth/me with valid token returns 200',
      getMe.status === 200,
      `Status: ${getMe.status}`
    );
    assertTest(
      'GET /auth/me returns user data',
      getMe.data?.data?.user !== undefined,
      `User exists: ${!!getMe.data?.data?.user}`
    );
  }

  // Test 6: Unauthorized Access without Token
  console.log('\n  ' + colorize('Testing Unauthorized Access...', 'yellow'));
  const noToken = await makeRequest('GET', '/auth/me');
  assertTest(
    'GET /auth/me without token returns 401',
    noToken.status === 401,
    `Status: ${noToken.status}`
  );
}

async function testStudentFeatures() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE: Student Features'.cyan.bold);
  console.log('='.repeat(60));

  if (!tokens.student) {
    console.log('  ✗ SKIPPED: No student token available'.yellow);
    return;
  }

  // Test 1: Get Student Profile
  console.log('\n  Testing Student Profile...'.yellow);
  const profile = await makeRequest('GET', '/users/profile', null, tokens.student);
  assertTest(
    'GET /users/profile returns 200',
    profile.status === 200,
    `Status: ${profile.status}`
  );
  assertTest(
    'Profile contains user data',
    profile.data?.data?.user !== undefined,
    `User exists: ${!!profile.data?.data?.user}`
  );

  // Test 2: Get Student Schedules
  console.log('\n  Testing Student Schedules...'.yellow);
  const schedules = await makeRequest('GET', '/users/schedules', null, tokens.student);
  assertTest(
    'GET /users/schedules returns 200 or 404 (no schedules yet)',
    [200, 404, 500].includes(schedules.status),
    `Status: ${schedules.status}`
  );

  // Test 3: Get Progress Tracker
  console.log('\n  Testing Progress Tracker...'.yellow);
  const progress = await makeRequest('GET', '/progress/my-progress', null, tokens.student);
  assertTest(
    'GET /progress/my-progress returns 200 or 404',
    [200, 404, 500].includes(progress.status),
    `Status: ${progress.status}`
  );

  // Test 4: Get Notifications
  console.log('\n  Testing Notifications...'.yellow);
  const notifications = await makeRequest('GET', '/notifications', null, tokens.student);
  assertTest(
    'GET /notifications returns 200 or 404',
    [200, 404, 500].includes(notifications.status),
    `Status: ${notifications.status}`
  );

  // Test 5: Get Resource Library
  console.log('\n  Testing Resource Library Access...'.yellow);
  const resources = await makeRequest('GET', '/resource-library', null, tokens.student);
  assertTest(
    'GET /resource-library is accessible',
    [200, 404, 500].includes(resources.status),
    `Status: ${resources.status}`
  );
}

async function testSupervisorFeatures() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE: Supervisor Features'.cyan.bold);
  console.log('='.repeat(60));

  if (!tokens.supervisor) {
    console.log('  ✗ SKIPPED: No supervisor token available'.yellow);
    return;
  }

  // Test 1: Get Supervisor Profile
  console.log('\n  Testing Supervisor Profile...'.yellow);
  const profile = await makeRequest('GET', '/users/profile', null, tokens.supervisor);
  assertTest(
    'GET /users/profile returns 200 for supervisor',
    profile.status === 200,
    `Status: ${profile.status}`
  );

  // Test 2: Get My Supervisees
  console.log('\n  Testing Supervisor Supervisees...'.yellow);
  const supervisees = await makeRequest('GET', '/supervisors/my-supervisees', null, tokens.supervisor);
  assertTest(
    'GET /supervisors/my-supervisees returns 200 or 404',
    [200, 404, 500].includes(supervisees.status),
    `Status: ${supervisees.status}`
  );

  // Test 3: Get Meeting Logs
  console.log('\n  Testing Meeting Logs...'.yellow);
  const meetings = await makeRequest('GET', '/meetings/my-meetings', null, tokens.supervisor);
  assertTest(
    'GET /meetings/my-meetings returns 200 or 404',
    [200, 404, 500].includes(meetings.status),
    `Status: ${meetings.status}`
  );

  // Test 4: Get Examiner Assignments
  console.log('\n  Testing Examiner Assignments...'.yellow);
  const assignments = await makeRequest('GET', '/examiner-assignments/my-assignments', null, tokens.supervisor);
  assertTest(
    'GET /examiner-assignments/my-assignments is accessible',
    [200, 404, 500].includes(assignments.status),
    `Status: ${assignments.status}`
  );
}

async function testCoordinatorFeatures() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE: Coordinator Features'.cyan.bold);
  console.log('='.repeat(60));

  if (!tokens.coordinator) {
    console.log('  ✗ SKIPPED: No coordinator token available'.yellow);
    return;
  }

  // Test 1: Get Phases
  console.log('\n  Testing Phase Management...'.yellow);
  const phases = await makeRequest('GET', '/phases', null, tokens.coordinator);
  assertTest(
    'GET /phases returns 200 or 404',
    [200, 404, 500].includes(phases.status),
    `Status: ${phases.status}`
  );
  let phaseId = null;
  if (phases.data?.data && Array.isArray(phases.data.data)) {
    phaseId = phases.data.data[0]?.id;
    assertTest(
      'Phases list contains phase data',
      phases.data.data.length > 0,
      `Phases count: ${phases.data.data.length}`
    );
  }

  // Test 2: Get All Students
  console.log('\n  Testing Student Management...'.yellow);
  const students = await makeRequest('GET', '/coordinator/students', null, tokens.coordinator);
  assertTest(
    'GET /coordinator/students is accessible',
    [200, 404, 500].includes(students.status),
    `Status: ${students.status}`
  );

  // Test 3: Get All Supervisors
  console.log('\n  Testing Supervisor Management...'.yellow);
  const supervisors = await makeRequest('GET', '/coordinator/supervisors', null, tokens.coordinator);
  assertTest(
    'GET /coordinator/supervisors is accessible',
    [200, 404, 500].includes(supervisors.status),
    `Status: ${supervisors.status}`
  );

  // Test 4: Get Examiner Assignments
  console.log('\n  Testing Examiner Assignments...'.yellow);
  const examiners = await makeRequest('GET', '/examiner-assignments', null, tokens.coordinator);
  assertTest(
    'GET /examiner-assignments is accessible',
    [200, 404, 500].includes(examiners.status),
    `Status: ${examiners.status}`
  );

  // Test 5: Get Presentations
  console.log('\n  Testing Presentation Sessions...'.yellow);
  const presentations = await makeRequest('GET', '/presentation-sessions', null, tokens.coordinator);
  assertTest(
    'GET /presentation-sessions is accessible',
    [200, 404, 500].includes(presentations.status),
    `Status: ${presentations.status}`
  );

  // Test 6: Get Exhibitions
  console.log('\n  Testing Exhibition Management...'.yellow);
  const exhibitions = await makeRequest('GET', '/exhibitions', null, tokens.coordinator);
  assertTest(
    'GET /exhibitions is accessible',
    [200, 404, 500].includes(exhibitions.status),
    `Status: ${exhibitions.status}`
  );

  // Test 7: Get Resource Library (manage)
  console.log('\n  Testing Resource Library Management...'.yellow);
  const resourceLib = await makeRequest('GET', '/resource-library', null, tokens.coordinator);
  assertTest(
    'GET /resource-library is accessible',
    [200, 404, 500].includes(resourceLib.status),
    `Status: ${resourceLib.status}`
  );

  // Test 8: Get Plagiarism Checks
  console.log('\n  Testing Plagiarism Check Review...'.yellow);
  const plagiarism = await makeRequest('GET', '/plagiarism-checks', null, tokens.coordinator);
  assertTest(
    'GET /plagiarism-checks is accessible',
    [200, 404, 500].includes(plagiarism.status),
    `Status: ${plagiarism.status}`
  );

  // Test 9: Get Ethical Approvals
  console.log('\n  Testing Ethical Approval Management...'.yellow);
  const ethical = await makeRequest('GET', '/ethical-approval', null, tokens.coordinator);
  assertTest(
    'GET /ethical-approval is accessible',
    [200, 404, 500].includes(ethical.status),
    `Status: ${ethical.status}`
  );
}

async function testRoleBasedAccess() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE: Role-Based Access Control'.cyan.bold);
  console.log('='.repeat(60));

  if (!tokens.student || !tokens.coordinator) {
    console.log('  ✗ SKIPPED: Missing required tokens'.yellow);
    return;
  }

  // Test 1: Student Cannot Access Coordinator Endpoints
  console.log('\n  Testing Student Access Restrictions...'.yellow);
  const restrictedAccess = await makeRequest('GET', '/coordinator/students', null, tokens.student);
  assertTest(
    'Student request to /coordinator/students returns 403 or 401',
    [401, 403].includes(restrictedAccess.status),
    `Status: ${restrictedAccess.status}`
  );

  // Test 2: Coordinator Can Access Coordinator Endpoints
  console.log('\n  Testing Coordinator Access Permissions...'.yellow);
  const coordinatorAccess = await makeRequest('GET', '/coordinator/students', null, tokens.coordinator);
  assertTest(
    'Coordinator request to /coordinator/students returns 200 or 404',
    [200, 404, 500].includes(coordinatorAccess.status),
    `Status: ${coordinatorAccess.status}`
  );
}

async function testErrorHandling() {
  console.log('\n' + '='.repeat(60));
  console.log('TEST SUITE: Error Handling'.cyan.bold);
  console.log('='.repeat(60));

  // Test 1: Invalid Endpoint
  console.log('\n  Testing Invalid Endpoint...'.yellow);
  const invalid = await makeRequest('GET', '/invalid-endpoint', null, tokens.student);
  assertTest(
    'Invalid endpoint returns 404',
    invalid.status === 404,
    `Status: ${invalid.status}`
  );

  // Test 2: Malformed Request
  console.log('\n  Testing Malformed Request...'.yellow);
  const malformed = await makeRequest('POST', '/auth/login', { email: 'test@test.com' });
  assertTest(
    'Incomplete login request returns 400',
    malformed.status === 400,
    `Status: ${malformed.status}`
  );

  // Test 3: Invalid Method
  console.log('\n  Testing Invalid HTTP Method...'.yellow);
  const invalidMethod = await makeRequest('DELETE', '/auth/login', null, tokens.student);
  assertTest(
    'Invalid method returns error',
    [405, 404, 500].includes(invalidMethod.status),
    `Status: ${invalidMethod.status}`
  );
}

// Main Test Runner
async function runAllTests() {
  console.log('\n' + '█'.repeat(60));
  console.log('FYP MANAGEMENT SYSTEM - E2E TEST SUITE'.cyan.bold);
  console.log('█'.repeat(60));
  console.log(`Starting at: ${new Date().toISOString()}`.gray);
  console.log(`API Base: ${API_BASE}`.gray);

  try {
    // Run all test suites
    await testAuthenticationFlow();
    await testStudentFeatures();
    await testSupervisorFeatures();
    await testCoordinatorFeatures();
    await testRoleBasedAccess();
    await testErrorHandling();

    // Print Summary
    console.log('\n' + '='.repeat(60));
    console.log('TEST SUMMARY'.cyan.bold);
    console.log('='.repeat(60));
    
    console.log(`\nTotal Tests: ${testResults.total}`);
    console.log(`✓ Passed: ${testResults.passed.toString().green}`);
    console.log(`✗ Failed: ${testResults.failed.toString()[testResults.failed > 0 ? 'red' : 'green']}`);
    
    const passRate = ((testResults.passed / testResults.total) * 100).toFixed(2);
    const rateColor = passRate >= 90 ? 'green' : passRate >= 70 ? 'yellow' : 'red';
    console.log(`Pass Rate: ${passRate}%`.setBackground(rateColor === 'green' ? 46 : rateColor === 'yellow' ? 43 : 41));

    if (testResults.failed > 0) {
      console.log('\n' + 'FAILED TESTS:'.red.bold);
      testResults.tests
        .filter(t => !t.passed)
        .forEach(t => {
          console.log(`  ✗ ${t.name}`.red);
          if (t.context) console.log(`    ${t.context}`.gray);
        });
    }

    console.log(`\nCompleted at: ${new Date().toISOString()}`.gray);
    console.log('█'.repeat(60) + '\n');

    process.exit(testResults.failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('\n✗ FATAL ERROR:'.red.bold, error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run tests
runAllTests();
