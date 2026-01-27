import assert from "assert";

const BASE = "http://localhost:3000";

// Terminal colors and styles
const colors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
};

const symbols = {
  skull: "💀",
  fire: "🔥",
  check: "✓",
  cross: "✗",
  warning: "⚠️",
  rocket: "🚀",
  bomb: "💣",
  lightning: "⚡",
  explosion: "💥",
  hourglass: "⏳",
  target: "🎯",
  shield: "🛡️",
  dagger: "🗡️",
};

function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`  ${symbols.check} ${message}`, colors.green);
}

function logInfo(message) {
  log(`  ${symbols.target} ${message}`, colors.cyan);
}

function logWarning(message) {
  log(`  ${symbols.warning} ${message}`, colors.yellow);
}

function logError(message) {
  log(`  ${symbols.cross} ${message}`, colors.red);
}

function logHeader(level, title) {
  console.log();
  log(`${"═".repeat(60)}`, colors.bright);
  log(
    `${symbols.fire} LEVEL ${level} — ${title.toUpperCase()} ${symbols.fire}`,
    colors.bright + colors.yellow
  );
  log(`${"═".repeat(60)}`, colors.bright);
}

function logSubtest(name) {
  log(`\n  ${symbols.dagger} ${name}`, colors.magenta);
}

function logStats(stats) {
  log(`  ${symbols.lightning} Statistics:`, colors.cyan);
  for (const [key, value] of Object.entries(stats)) {
    log(`    • ${key}: ${colors.bright}${value}${colors.reset}`, colors.dim);
  }
}

async function req(path, options = {}) {
  const start = Date.now();
  const res = await fetch(BASE + path, options);
  const duration = Date.now() - start;
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {}
  return { res, json, text, duration };
}

async function createPaste(body) {
  const r = await req("/api/pastes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return r.json;
}

async function fetchPaste(id, headers = {}) {
  return fetch(BASE + `/api/pastes/${id}`, { headers });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

// -----------------------------------------------------
// LEVEL 1 — BASIC SANITY + STRESS
// -----------------------------------------------------
async function level1() {
  logHeader(1, "Basic Sanity + Rapid Fire Creation");

  logSubtest("Single paste creation and retrieval");
  const { id } = await createPaste({ content: "L1-basic" });
  logInfo(`Created paste: ${id}`);
  const r = await fetchPaste(id);
  assert.equal(r.status, 200);
  logSuccess("Basic paste created and retrieved successfully");

  logSubtest("Rapid-fire paste creation (100 pastes)");
  const startTime = Date.now();
  const promises = Array.from({ length: 100 }).map((_, i) =>
    createPaste({ content: `L1-rapid-${i}` })
  );
  const results = await Promise.all(promises);
  const duration = Date.now() - startTime;

  const successCount = results.filter((r) => r && r.id).length;
  logStats({
    "Total requests": 100,
    "Successful": successCount,
    "Failed": 100 - successCount,
    "Duration": `${duration}ms`,
    "Avg per request": `${(duration / 100).toFixed(2)}ms`,
  });

  assert.equal(successCount, 100, "All rapid-fire pastes should succeed");
  logSuccess("Survived rapid-fire creation stress test");

  logSubtest("Concurrent retrieval hammer (50 parallel reads)");
  const testId = results[0].id;
  const readStart = Date.now();
  const reads = await Promise.all(
    Array.from({ length: 50 }).map(() => fetchPaste(testId))
  );
  const readDuration = Date.now() - readStart;

  const okReads = reads.filter((r) => r.status === 200).length;
  logStats({
    "Parallel reads": 50,
    "Successful": okReads,
    "Duration": `${readDuration}ms`,
  });

  assert.equal(okReads, 50, "All parallel reads should succeed");
  logSuccess("Level 1 completed — System warmed up");
}

// -----------------------------------------------------
// LEVEL 2 — INVALID INPUT ABUSE + FUZZING
// -----------------------------------------------------
async function level2() {
  logHeader(2, "Invalid Input Abuse + Fuzzing");

  const cases = [
    { desc: "Empty object", body: {} },
    { desc: "Empty content", body: { content: "" } },
    { desc: "Zero TTL", body: { content: "ok", ttl_seconds: 0 } },
    { desc: "Negative TTL", body: { content: "ok", ttl_seconds: -5 } },
    { desc: "Zero max_views", body: { content: "ok", max_views: 0 } },
    { desc: "Negative max_views", body: { content: "ok", max_views: -1 } },
    { desc: "Non-string content", body: { content: 123 } },
    { desc: "Null content", body: { content: null } },
    { desc: "Array content", body: { content: ["array"] } },
    { desc: "Object content", body: { content: { nested: "object" } } },
    { desc: "Huge TTL", body: { content: "ok", ttl_seconds: 999999999 } },
    { desc: "Huge max_views", body: { content: "ok", max_views: 999999999 } },
    { desc: "Float TTL", body: { content: "ok", ttl_seconds: 1.5 } },
    { desc: "Float max_views", body: { content: "ok", max_views: 2.7 } },
    { desc: "String TTL", body: { content: "ok", ttl_seconds: "10" } },
    { desc: "String max_views", body: { content: "ok", max_views: "5" } },
  ];

  logInfo(`Testing ${cases.length} malicious input cases...`);

  let passCount = 0;
  for (const { desc, body } of cases) {
    const r = await req("/api/pastes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (r.res.status >= 400) {
      logSuccess(`${desc} → rejected (${r.res.status})`);
      passCount++;
    } else {
      logError(`${desc} → ACCEPTED (${r.res.status}) — SECURITY ISSUE!`);
    }
  }

  logStats({
    "Total tests": cases.length,
    "Properly rejected": passCount,
    "Improperly accepted": cases.length - passCount,
  });

  assert.equal(
    passCount,
    cases.length,
    "All invalid inputs should be rejected"
  );

  logSubtest("Malformed JSON attack");
  const malformed = await fetch(BASE + "/api/pastes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{this is not json}",
  });
  assert(malformed.status >= 400, "Malformed JSON should be rejected");
  logSuccess("Malformed JSON properly rejected");

  logSuccess("Level 2 completed — Input validation is solid");
}

// -----------------------------------------------------
// LEVEL 3 — VIEW LIMIT RACE CARNAGE
// -----------------------------------------------------
async function level3() {
  logHeader(3, "View Limit Race Carnage");

  logSubtest("Moderate race: 20 concurrent hits on max_views=3");
  const { id: id1 } = await createPaste({ content: "L3-moderate", max_views: 3 });
  logInfo(`Created paste ${id1} with max_views=3`);

  const results1 = await Promise.all(
    Array.from({ length: 20 }).map(() => fetchPaste(id1))
  );

  const ok1 = results1.filter((r) => r.status === 200).length;
  const fail1 = results1.filter((r) => r.status === 404).length;

  logStats({
    "Total requests": 20,
    "Successful (200)": ok1,
    "Failed (404)": fail1,
    "Max allowed": 3,
  });

  assert(ok1 <= 3, `Race condition leak: ${ok1} views allowed, max was 3!`);
  assert.equal(ok1 + fail1, 20, "All requests should complete");
  logSuccess(`Race condition handled: only ${ok1} views allowed`);

  logSubtest("EXTREME race: 200 concurrent hits on max_views=1");
  const { id: id2 } = await createPaste({ content: "L3-extreme", max_views: 1 });
  logInfo(`Created paste ${id2} with max_views=1`);

  const raceStart = Date.now();
  const results2 = await Promise.all(
    Array.from({ length: 200 }).map(() => fetchPaste(id2))
  );
  const raceDuration = Date.now() - raceStart;

  const ok2 = results2.filter((r) => r.status === 200).length;
  const fail2 = results2.filter((r) => r.status === 404).length;

  logStats({
    "Total requests": 200,
    "Successful (200)": ok2,
    "Failed (404)": fail2,
    "Max allowed": 1,
    "Duration": `${raceDuration}ms`,
    "Requests per second": Math.round(200 / (raceDuration / 1000)),
  });

  assert(ok2 <= 1, `CRITICAL: ${ok2} views allowed, max was 1!`);
  logSuccess(`EXTREME race survived: only ${ok2} view(s) allowed`);

  logSubtest("Sequential verification after race");
  const { id: id3 } = await createPaste({ content: "L3-seq", max_views: 5 });
  
  for (let i = 0; i < 5; i++) {
    const r = await fetchPaste(id3);
    assert.equal(r.status, 200, `View ${i + 1} should succeed`);
  }
  
  const r = await fetchPaste(id3);
  assert.equal(r.status, 404, "View 6 should fail");
  logSuccess("Sequential view counting is accurate");

  logSuccess("Level 3 completed — Race conditions conquered");
}

// -----------------------------------------------------
// LEVEL 4 — TTL PRECISION TORTURE
// -----------------------------------------------------
async function level4() {
  logHeader(4, "TTL Precision Torture");

  const now = Date.now();

  logSubtest("Exact boundary testing (±1ms precision)");
  const { id: id1 } = await createPaste({ content: "L4-boundary", ttl_seconds: 1 });
  logInfo(`Created paste ${id1} with 1 second TTL at t=0`);

  // At creation time
  let r1 = await fetchPaste(id1, { "x-test-now-ms": now.toString() });
  assert.equal(r1.status, 200, "Should succeed at t=0ms");
  logSuccess("t=0ms: Available ✓");

  // Just before expiry
  let r2 = await fetchPaste(id1, { "x-test-now-ms": (now + 999).toString() });
  assert.equal(r2.status, 200, "Should succeed at t=999ms");
  logSuccess("t=999ms: Available ✓");

  // Exactly at expiry
  let r3 = await fetchPaste(id1, { "x-test-now-ms": (now + 1000).toString() });
  assert.equal(r3.status, 404, "Should fail at t=1000ms");
  logSuccess("t=1000ms: Expired ✓");

  // After expiry
  let r4 = await fetchPaste(id1, { "x-test-now-ms": (now + 1001).toString() });
  assert.equal(r4.status, 404, "Should fail at t=1001ms");
  logSuccess("t=1001ms: Expired ✓");

  logSubtest("Multiple TTL values stress test");
  const ttlTests = [
    { ttl: 1, testAt: [0, 500, 999, 1000, 1500] },
    { ttl: 5, testAt: [0, 2500, 4999, 5000, 6000] },
    { ttl: 10, testAt: [0, 5000, 9999, 10000, 15000] },
  ];

  for (const { ttl, testAt } of ttlTests) {
    const { id } = await createPaste({ content: `L4-ttl${ttl}`, ttl_seconds: ttl });
    const baseTime = Date.now();
    
    logInfo(`Testing TTL=${ttl}s at various time offsets...`);
    
    for (const offset of testAt) {
      const r = await fetchPaste(id, {
        "x-test-now-ms": (baseTime + offset).toString(),
      });
      
      const expected = offset < ttl * 1000 ? 200 : 404;
      const emoji = r.status === expected ? "✓" : "✗";
      const color = r.status === expected ? colors.green : colors.red;
      
      log(
        `    ${emoji} t=${offset}ms: ${r.status} (expected ${expected})`,
        color
      );
      
      assert.equal(r.status, expected, `TTL=${ttl}s at t=${offset}ms`);
    }
  }

  logSubtest("Concurrent access across TTL boundary");
  const { id: id2 } = await createPaste({ content: "L4-concurrent", ttl_seconds: 2 });
  const baseTime2 = Date.now();

  // 50 requests: 25 before expiry, 25 after
  const concurrentTests = Array.from({ length: 50 }).map((_, i) => {
    const offset = i < 25 ? 1500 : 2500; // Half before, half after
    return fetchPaste(id2, {
      "x-test-now-ms": (baseTime2 + offset).toString(),
    });
  });

  const results = await Promise.all(concurrentTests);
  const beforeExpiry = results.slice(0, 25).filter((r) => r.status === 200).length;
  const afterExpiry = results.slice(25).filter((r) => r.status === 404).length;

  logStats({
    "Before expiry (should be 200)": beforeExpiry,
    "After expiry (should be 404)": afterExpiry,
  });

  assert.equal(beforeExpiry, 25, "All requests before expiry should succeed");
  assert.equal(afterExpiry, 25, "All requests after expiry should fail");

  logSuccess("Level 4 completed — TTL precision is microsurgical");
}

// -----------------------------------------------------
// LEVEL 5 — COMBINED CONSTRAINT APOCALYPSE
// -----------------------------------------------------
async function level5() {
  logHeader(5, "Combined Constraint Apocalypse");

  const now = Date.now();

  logSubtest("Sequential then race with both constraints");
  const { id: id1 } = await createPaste({
    content: "L5-combined",
    ttl_seconds: 2,
    max_views: 2,
  });
  logInfo(`Created paste with TTL=2s AND max_views=2`);

  // Use 2 views immediately
  let r1 = await fetchPaste(id1, { "x-test-now-ms": now.toString() });
  let r2 = await fetchPaste(id1, { "x-test-now-ms": now.toString() });
  assert.equal(r1.status, 200, "First view should succeed");
  assert.equal(r2.status, 200, "Second view should succeed");
  logSuccess("Views 1-2 consumed successfully");

  // Race condition: 10 parallel hits before expiry (should all fail - no views left)
  logInfo("Launching 10 concurrent requests before TTL expires...");
  const burst1 = await Promise.all(
    Array.from({ length: 10 }).map(() =>
      fetchPaste(id1, { "x-test-now-ms": (now + 1500).toString() })
    )
  );

  const ok1 = burst1.filter((r) => r.status === 200).length;
  logStats({
    "Successful (should be 0)": ok1,
    "Failed": burst1.filter((r) => r.status === 404).length,
  });
  assert.equal(ok1, 0, "No views should succeed - view limit exhausted");
  logSuccess("View limit properly enforced before TTL expiry");

  // After expiry - must stay dead
  let r3 = await fetchPaste(id1, { "x-test-now-ms": (now + 3000).toString() });
  assert.equal(r3.status, 404, "Must remain dead after TTL expiry");
  logSuccess("Paste remains dead after TTL expiry");

  logSubtest("CHAOS: 100 concurrent hits with dual constraints");
  const { id: id2 } = await createPaste({
    content: "L5-chaos",
    ttl_seconds: 3,
    max_views: 5,
  });
  const baseTime = Date.now();
  logInfo(`Created paste with TTL=3s AND max_views=5`);

  // Massive concurrent assault: 100 requests
  const chaosStart = Date.now();
  const chaos = await Promise.all(
    Array.from({ length: 100 }).map((_, i) => {
      // Spread requests across time: 0-4000ms
      const offset = (i * 40) % 4000;
      return fetchPaste(id2, {
        "x-test-now-ms": (baseTime + offset).toString(),
      });
    })
  );
  const chaosDuration = Date.now() - chaosStart;

  const successInTime = chaos.filter((r) => r.status === 200).length;
  const failedTotal = chaos.filter((r) => r.status === 404).length;

  logStats({
    "Total requests": 100,
    "Successful (max should be 5)": successInTime,
    "Failed": failedTotal,
    "Duration": `${chaosDuration}ms`,
    "Constraint violation": successInTime > 5 ? "YES - CRITICAL!" : "NO - GOOD",
  });

  assert(successInTime <= 5, `CRITICAL: ${successInTime} views, max was 5!`);
  logSuccess(`Chaos survived: only ${successInTime}/5 views leaked`);

  logSubtest("Edge case: Expire during view limit countdown");
  const { id: id3 } = await createPaste({
    content: "L5-edge",
    ttl_seconds: 1,
    max_views: 10,
  });
  const edgeBase = Date.now();

  // Consume 3 views quickly
  for (let i = 0; i < 3; i++) {
    await fetchPaste(id3, { "x-test-now-ms": edgeBase.toString() });
  }
  logInfo("Consumed 3/10 views before expiry");

  // Try to use remaining 7 views after expiry
  const afterExpiry = await Promise.all(
    Array.from({ length: 7 }).map(() =>
      fetchPaste(id3, { "x-test-now-ms": (edgeBase + 1500).toString() })
    )
  );

  const leaks = afterExpiry.filter((r) => r.status === 200).length;
  logStats({
    "Remaining views attempted": 7,
    "Successful (should be 0)": leaks,
  });

  assert.equal(leaks, 0, "TTL expiry should override view limit");
  logSuccess("TTL properly overrides remaining view count");

  logSuccess("Level 5 completed — Dual constraints mastered");
}

// -----------------------------------------------------
// LEVEL 6 — RESURRECTION PREVENTION
// -----------------------------------------------------
async function level6() {
  logHeader(6, "Resurrection Prevention");

  logSubtest("Verify deleted pastes stay dead");
  const { id } = await createPaste({ content: "L6-zombie", max_views: 1 });
  
  // Use the single view
  let r1 = await fetchPaste(id);
  assert.equal(r1.status, 200);
  logSuccess("Initial view succeeded");

  // Try 50 times to resurrect
  logInfo("Attempting resurrection 50 times...");
  const attempts = await Promise.all(
    Array.from({ length: 50 }).map(() => fetchPaste(id))
  );

  const zombies = attempts.filter((r) => r.status === 200).length;
  logStats({
    "Resurrection attempts": 50,
    "Successful resurrections": zombies,
  });

  assert.equal(zombies, 0, "Dead pastes must stay dead");
  logSuccess("No resurrections detected - paste is truly dead");

  logSubtest("Expired pastes cannot be revived");
  const now = Date.now();
  const { id: id2 } = await createPaste({ content: "L6-expired", ttl_seconds: 1 });

  // Access after expiry multiple times
  const revival = await Promise.all(
    Array.from({ length: 20 }).map(() =>
      fetchPaste(id2, { "x-test-now-ms": (now + 2000).toString() })
    )
  );

  const revived = revival.filter((r) => r.status === 200).length;
  assert.equal(revived, 0, "Expired pastes cannot be revived");
  logSuccess("Expired pastes remain expired");

  logSuccess("Level 6 completed — Death is permanent");
}

// -----------------------------------------------------
// LEVEL 7 — STRESS TEST FINALE
// -----------------------------------------------------
async function level7() {
  logHeader(7, "Stress Test Finale - Full System Assault");

  logSubtest("Creating 500 pastes under heavy load");
  const creationStart = Date.now();
  const created = await Promise.all(
    Array.from({ length: 500 }).map((_, i) =>
      createPaste({
        content: `L7-${i}`,
        ttl_seconds: 10,
        max_views: 3,
      })
    )
  );
  const creationDuration = Date.now() - creationStart;

  const successfulCreations = created.filter((p) => p && p.id).length;
  logStats({
    "Total attempts": 500,
    "Successful": successfulCreations,
    "Duration": `${creationDuration}ms`,
    "Average": `${(creationDuration / 500).toFixed(2)}ms per paste`,
  });

  assert(successfulCreations >= 480, "At least 96% should succeed");
  logSuccess(`${successfulCreations}/500 pastes created successfully`);

  logSubtest("Hammering reads: 1000 concurrent requests");
  const targetIds = created.slice(0, 10).map((p) => p.id);
  
  const hammerStart = Date.now();
  const hammer = await Promise.all(
    Array.from({ length: 1000 }).map((_, i) => {
      const targetId = targetIds[i % targetIds.length];
      return fetchPaste(targetId);
    })
  );
  const hammerDuration = Date.now() - hammerStart;

  const successful = hammer.filter((r) => r.status === 200).length;
  logStats({
    "Total requests": 1000,
    "Successful reads": successful,
    "Duration": `${hammerDuration}ms`,
    "Requests per second": Math.round(1000 / (hammerDuration / 1000)),
  });

  logSuccess(`System handled ${successful} reads without crashing`);

  logSubtest("Mixed workload chaos: 100 creates + 500 reads concurrently");
  const chaosStart = Date.now();
  
  const mixedOps = [
    ...Array.from({ length: 100 }).map((_, i) =>
      createPaste({ content: `chaos-${i}`, max_views: 2 })
    ),
    ...Array.from({ length: 500 }).map((_, i) =>
      fetchPaste(targetIds[i % targetIds.length])
    ),
  ];

  const shuffled = mixedOps.sort(() => Math.random() - 0.5);
  await Promise.all(shuffled);
  
  const chaosDuration = Date.now() - chaosStart;
  logStats({
    "Total operations": 600,
    "Duration": `${chaosDuration}ms`,
    "Ops per second": Math.round(600 / (chaosDuration / 1000)),
  });

  logSuccess("Survived mixed workload assault");
  logSuccess("Level 7 completed — System is battle-hardened");
}

// -----------------------------------------------------

async function run() {
  console.log();
  log("╔════════════════════════════════════════════════════════════╗", colors.bright);
  log("║                                                            ║", colors.bright);
  log("║        🔥 BRUTAL TORTURE TEST SUITE v2.0 🔥               ║", colors.bright + colors.red);
  log("║                                                            ║", colors.bright);
  log("║     Testing pastebin API for race conditions,             ║", colors.bright);
  log("║     edge cases, and catastrophic failure modes            ║", colors.bright);
  log("║                                                            ║", colors.bright);
  log("╚════════════════════════════════════════════════════════════╝", colors.bright);
  console.log();

  const startTime = Date.now();

  try {
    await level1();
    await level2();
    await level3();
    await level4();
    await level5();
    await level6();
    await level7();

    const totalDuration = Date.now() - startTime;

    console.log();
    log("╔════════════════════════════════════════════════════════════╗", colors.bright + colors.green);
    log("║                                                            ║", colors.bright + colors.green);
    log("║   💀 ALL TORTURE TESTS PASSED — SYSTEM SURVIVED 💀        ║", colors.bright + colors.green);
    log("║                                                            ║", colors.bright + colors.green);
    log(`║   Total Duration: ${totalDuration}ms`.padEnd(59) + "║", colors.bright + colors.green);
    log("║                                                            ║", colors.bright + colors.green);
    log("╚════════════════════════════════════════════════════════════╝", colors.bright + colors.green);
    console.log();

  } catch (err) {
    console.log();
    log("╔════════════════════════════════════════════════════════════╗", colors.bright + colors.red);
    log("║                                                            ║", colors.bright + colors.red);
    log("║        ❌ TORTURE TEST FAILED — SYSTEM DESTROYED ❌        ║", colors.bright + colors.red);
    log("║                                                            ║", colors.bright + colors.red);
    log("╚════════════════════════════════════════════════════════════╝", colors.bright + colors.red);
    console.log();
    
    logError(`Test failed: ${err.message}`);
    console.log();
    console.error(err.stack);
    process.exit(1);
  }
}

run();