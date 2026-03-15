/**
 * Stress Test Script for TutorHub
 * 
 * This script simulates multiple users accessing the website simultaneously.
 * 
 * Usage:
 *   1. Start your dev server: npm run dev
 *   2. Run this script: node scripts/stress-test.js
 * 
 * For more advanced load testing, consider using:
 *   - k6 (https://k6.io) - Recommended for production load testing
 *   - Artillery (https://artillery.io)
 *   - Apache JMeter
 */

const BASE_URL = process.env.TEST_URL || "http://localhost:3000";

// Configuration
const CONFIG = {
  concurrentUsers: 50,        // Number of simultaneous users
  requestsPerUser: 10,        // Requests each user makes
  delayBetweenRequests: 100,  // ms between requests per user
  testDurationMs: 30000,      // Total test duration (30 seconds)
};

// Endpoints to test (public pages and API routes)
const ENDPOINTS = [
  { path: "/", method: "GET", name: "Homepage" },
  { path: "/tutors", method: "GET", name: "Tutors List" },
  { path: "/login", method: "GET", name: "Login Page" },
  { path: "/register", method: "GET", name: "Register Page" },
  { path: "/api/tutors", method: "GET", name: "Tutors API" },
  { path: "/api/auth/session", method: "GET", name: "Session Check" },
];

// Results tracking
const results = {
  totalRequests: 0,
  successfulRequests: 0,
  failedRequests: 0,
  responseTimes: [],
  errors: [],
  byEndpoint: {},
};

// Initialize endpoint tracking
ENDPOINTS.forEach(ep => {
  results.byEndpoint[ep.name] = {
    requests: 0,
    successes: 0,
    failures: 0,
    avgResponseTime: 0,
    responseTimes: [],
  };
});

async function makeRequest(endpoint) {
  const startTime = Date.now();
  const url = `${BASE_URL}${endpoint.path}`;
  
  try {
    const response = await fetch(url, {
      method: endpoint.method,
      headers: {
        "Accept": "application/json,text/html",
        "User-Agent": "StressTest/1.0",
      },
    });
    
    const responseTime = Date.now() - startTime;
    results.totalRequests++;
    results.responseTimes.push(responseTime);
    results.byEndpoint[endpoint.name].requests++;
    results.byEndpoint[endpoint.name].responseTimes.push(responseTime);
    
    if (response.ok) {
      results.successfulRequests++;
      results.byEndpoint[endpoint.name].successes++;
    } else {
      results.failedRequests++;
      results.byEndpoint[endpoint.name].failures++;
      results.errors.push({
        endpoint: endpoint.name,
        status: response.status,
        statusText: response.statusText,
      });
    }
    
    return { success: response.ok, responseTime, status: response.status };
  } catch (error) {
    const responseTime = Date.now() - startTime;
    results.totalRequests++;
    results.failedRequests++;
    results.responseTimes.push(responseTime);
    results.byEndpoint[endpoint.name].requests++;
    results.byEndpoint[endpoint.name].failures++;
    results.errors.push({
      endpoint: endpoint.name,
      error: error.message,
    });
    
    return { success: false, responseTime, error: error.message };
  }
}

async function simulateUser(userId) {
  const userResults = [];
  
  for (let i = 0; i < CONFIG.requestsPerUser; i++) {
    // Pick a random endpoint
    const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
    const result = await makeRequest(endpoint);
    userResults.push(result);
    
    // Random delay between requests (50-150ms)
    await new Promise(resolve => 
      setTimeout(resolve, CONFIG.delayBetweenRequests + Math.random() * 100)
    );
  }
  
  return userResults;
}

function calculateStats(times) {
  if (times.length === 0) return { avg: 0, min: 0, max: 0, p50: 0, p95: 0, p99: 0 };
  
  const sorted = [...times].sort((a, b) => a - b);
  const sum = sorted.reduce((a, b) => a + b, 0);
  
  return {
    avg: Math.round(sum / sorted.length),
    min: sorted[0],
    max: sorted[sorted.length - 1],
    p50: sorted[Math.floor(sorted.length * 0.5)],
    p95: sorted[Math.floor(sorted.length * 0.95)],
    p99: sorted[Math.floor(sorted.length * 0.99)],
  };
}

function printResults() {
  console.log("\n" + "=".repeat(60));
  console.log("STRESS TEST RESULTS");
  console.log("=".repeat(60));
  
  const stats = calculateStats(results.responseTimes);
  const duration = (Date.now() - testStartTime) / 1000;
  const rps = results.totalRequests / duration;
  
  console.log("\n📊 OVERVIEW");
  console.log("-".repeat(40));
  console.log(`Total Requests:      ${results.totalRequests}`);
  console.log(`Successful:          ${results.successfulRequests} (${((results.successfulRequests/results.totalRequests)*100).toFixed(1)}%)`);
  console.log(`Failed:              ${results.failedRequests} (${((results.failedRequests/results.totalRequests)*100).toFixed(1)}%)`);
  console.log(`Test Duration:       ${duration.toFixed(2)}s`);
  console.log(`Requests/Second:     ${rps.toFixed(2)}`);
  
  console.log("\n⏱️  RESPONSE TIMES");
  console.log("-".repeat(40));
  console.log(`Average:             ${stats.avg}ms`);
  console.log(`Min:                 ${stats.min}ms`);
  console.log(`Max:                 ${stats.max}ms`);
  console.log(`Median (p50):        ${stats.p50}ms`);
  console.log(`95th percentile:     ${stats.p95}ms`);
  console.log(`99th percentile:     ${stats.p99}ms`);
  
  console.log("\n📍 BY ENDPOINT");
  console.log("-".repeat(40));
  
  for (const [name, data] of Object.entries(results.byEndpoint)) {
    if (data.requests > 0) {
      const epStats = calculateStats(data.responseTimes);
      const successRate = ((data.successes / data.requests) * 100).toFixed(1);
      console.log(`\n${name}:`);
      console.log(`  Requests: ${data.requests} | Success: ${successRate}% | Avg: ${epStats.avg}ms | p95: ${epStats.p95}ms`);
    }
  }
  
  if (results.errors.length > 0) {
    console.log("\n❌ ERRORS (first 10)");
    console.log("-".repeat(40));
    results.errors.slice(0, 10).forEach((err, i) => {
      if (err.status) {
        console.log(`  ${i + 1}. ${err.endpoint}: HTTP ${err.status} ${err.statusText}`);
      } else {
        console.log(`  ${i + 1}. ${err.endpoint}: ${err.error}`);
      }
    });
  }
  
  console.log("\n" + "=".repeat(60));
  
  // Performance assessment
  console.log("\n🎯 ASSESSMENT");
  console.log("-".repeat(40));
  
  if (stats.p95 < 200 && results.failedRequests === 0) {
    console.log("✅ EXCELLENT - Your app handles load very well!");
  } else if (stats.p95 < 500 && results.failedRequests / results.totalRequests < 0.01) {
    console.log("✅ GOOD - Performance is acceptable for most use cases.");
  } else if (stats.p95 < 1000 && results.failedRequests / results.totalRequests < 0.05) {
    console.log("⚠️  FAIR - Consider optimizing slow endpoints.");
  } else {
    console.log("❌ NEEDS IMPROVEMENT - Significant performance issues detected.");
  }
  
  console.log("\n💡 RECOMMENDATIONS:");
  if (stats.p95 > 500) {
    console.log("  - Consider adding caching (Redis, Vercel Edge Cache)");
    console.log("  - Optimize database queries with indexes");
    console.log("  - Use connection pooling for database");
  }
  if (results.failedRequests > 0) {
    console.log("  - Investigate failed requests for errors");
    console.log("  - Add retry logic for transient failures");
  }
  console.log("  - For production: Use k6 or Artillery for more comprehensive testing");
  console.log("");
}

// Main execution
let testStartTime;

async function runStressTest() {
  console.log("\n🚀 TUTORHUB STRESS TEST");
  console.log("=".repeat(60));
  console.log(`Target:              ${BASE_URL}`);
  console.log(`Concurrent Users:    ${CONFIG.concurrentUsers}`);
  console.log(`Requests per User:   ${CONFIG.requestsPerUser}`);
  console.log(`Expected Requests:   ${CONFIG.concurrentUsers * CONFIG.requestsPerUser}`);
  console.log("=".repeat(60));
  
  // Check if server is running
  console.log("\n⏳ Checking server availability...");
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      console.error(`❌ Server returned ${response.status}. Make sure your dev server is running.`);
      process.exit(1);
    }
    console.log("✅ Server is running!\n");
  } catch (error) {
    console.error(`❌ Cannot connect to ${BASE_URL}`);
    console.error("   Make sure your dev server is running: npm run dev");
    process.exit(1);
  }
  
  console.log("🔄 Starting stress test...\n");
  testStartTime = Date.now();
  
  // Create user promises
  const userPromises = [];
  for (let i = 0; i < CONFIG.concurrentUsers; i++) {
    userPromises.push(simulateUser(i));
    
    // Stagger user starts slightly to avoid thundering herd
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  
  // Wait for all users to complete
  await Promise.all(userPromises);
  
  // Print results
  printResults();
}

// Run the test
runStressTest().catch(console.error);
