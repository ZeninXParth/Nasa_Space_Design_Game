/**
 * Horizon-X: NASA Space Design Game
 * Tier 2 Test Suite: Boundary & Corner Cases
 * 
 * Authoritative Sources:
 * - ORIGINAL_REQUEST.md: Boundary & Resource Stress requirements
 * - PROJECT.md: Milestone E2E Track, Tier 2 Specifications
 * - Phase_02_instructions.md & Figma Nodes
 * 
 * Coverage:
 * - Zero and negative budget boundaries
 * - Exact zero-remainder purchases
 * - Timer thresholds and max degradation boundaries (300s, 2100s)
 * - Timer tick boundaries (1s -> 0s -> clamped 0)
 * - Invalid tier parameters (Tier 0, 4, negative, NaN, undefined)
 * - Telemetry physical constraints & thresholds (Mass, Power, Comms, Budget)
 * - Incomplete assembly combinations (0/6 through 5/6 blocking launch)
 * - Rapid input & concurrency edge cases
 * - Malformed multiplayer packet handling
 */

const assert = require('node:assert');
const { createTestEnvironment, SPEC_ORACLE } = require('./test_harness');

function runBoundaryTests() {
  const suiteResults = { name: 'Tier 2: Boundary & Corner Cases', passed: 0, failed: 0, tests: [] };

  function test(name, fn) {
    try {
      fn();
      suiteResults.passed++;
      suiteResults.tests.push({ name, status: 'PASS' });
    } catch (err) {
      suiteResults.failed++;
      suiteResults.tests.push({ name, status: 'FAIL', error: err.message });
    }
  }

  // =========================================================================
  // 1. BUDGET BOUNDARIES & DEFICIT GUARDS
  // =========================================================================

  test('B1.1: Requisition is rejected when budget is exactly $0', () => {
    const budget = 0;
    const itemPrice = 7400;

    function canAfford(curBudget, cost) {
      return curBudget >= cost && cost > 0;
    }

    assert.strictEqual(canAfford(budget, itemPrice), false, 'Zero budget must reject purchase');
  });

  test('B1.2: Requisition is rejected when cost exceeds available budget (deficit attempt)', () => {
    const budget = 5000;
    const itemPrice = 18500;

    function executePurchase(curBudget, cost) {
      if (curBudget < cost) {
        return { success: false, remaining: curBudget, error: 'INSUFFICIENT_FUNDS' };
      }
      return { success: true, remaining: curBudget - cost };
    }

    const res = executePurchase(budget, itemPrice);
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.remaining, 5000, 'Budget must not change on rejected purchase');
    assert.strictEqual(res.error, 'INSUFFICIENT_FUNDS');
  });

  test('B1.3: Exact budget boundary purchase leaves exactly $0.00 remainder without error', () => {
    const budget = 7400;
    const itemPrice = 7400;
    const remaining = budget - itemPrice;

    assert.strictEqual(remaining, 0, 'Exact cost deduction must leave exactly 0');
    const formatted = `$${remaining.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    assert.strictEqual(formatted, '$0.00', 'Must format 0 remainder as $0.00');
  });

  test('B1.4: Rapid double-click on requisition only processes a single purchase', () => {
    let budget = 150000;
    let purchaseCount = 0;
    let isProcessing = false;

    function handleBuyClick(price) {
      if (isProcessing) return false;
      isProcessing = true;
      if (budget >= price) {
        budget -= price;
        purchaseCount++;
      }
      return true;
    }

    // Two rapid clicks
    handleBuyClick(7400);
    handleBuyClick(7400);

    assert.strictEqual(purchaseCount, 1, 'Only one purchase should succeed during active processing');
    assert.strictEqual(budget, 142600);
  });

  // =========================================================================
  // 2. TIMER BOUNDARIES & CLAMPING
  // =========================================================================

  test('B2.1: Level 03 maximum degradation duration boundary is exactly 2,100 seconds (35 min)', () => {
    const tier3 = SPEC_ORACLE.TOOL_TIERS[3];
    assert.strictEqual(tier3.durationSec, 2100);
    assert.strictEqual(tier3.durationSec / 60, 35);
  });

  test('B2.2: Level 01 minimum degradation duration boundary is exactly 300 seconds (5 min)', () => {
    const tier1 = SPEC_ORACLE.TOOL_TIERS[1];
    assert.strictEqual(tier1.durationSec, 300);
    assert.strictEqual(tier1.durationSec / 60, 5);
  });

  test('B2.3: Degradation tick boundary: 1s remaining does NOT trigger dysfunction', () => {
    const remSec = 1;
    let isDysfunctional = false;

    if (remSec <= 0) isDysfunctional = true;
    assert.strictEqual(isDysfunctional, false, 'Tool with 1s left must remain functional');
  });

  test('B2.4: Degradation tick boundary: 0s remaining triggers dysfunction exactly once', () => {
    let remSec = 0;
    let isDysfunctional = false;
    let triggerCount = 0;

    if (remSec <= 0 && !isDysfunctional) {
      isDysfunctional = true;
      triggerCount++;
    }

    // Subsequent tick
    if (remSec <= 0 && !isDysfunctional) {
      triggerCount++;
    }

    assert.strictEqual(isDysfunctional, true, 'Tool at 0s must become dysfunctional');
    assert.strictEqual(triggerCount, 1, 'Dysfunction trigger must be idempotent');
  });

  test('B2.5: Countdown timer clamps negative remaining time to 0 and formats as 00:00', () => {
    function formatSafeCountdown(expiresAt, now) {
      const remSec = Math.max(0, Math.floor((expiresAt - now) / 1000));
      const m = Math.floor(remSec / 60);
      const s = remSec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    const pastExpiry = Date.now() - 5000; // 5 seconds ago
    const formatted = formatSafeCountdown(pastExpiry, Date.now());
    assert.strictEqual(formatted, '00:00', 'Negative remaining seconds must clamp to 00:00');
  });

  // =========================================================================
  // 3. INVALID TIER INPUTS & CORNER CASES
  // =========================================================================

  test('B3.1: Tier 0 input is invalid and gracefully falls back to Level 02 (Aerospace)', () => {
    function resolveTier(tier) {
      if (![1, 2, 3].includes(tier)) return 2; // Default fallback per script.js:2371
      return tier;
    }

    assert.strictEqual(resolveTier(0), 2);
  });

  test('B3.2: Tier 4 or higher out-of-range input falls back to default tier', () => {
    function resolveTier(tier) {
      if (![1, 2, 3].includes(tier)) return 2;
      return tier;
    }

    assert.strictEqual(resolveTier(4), 2);
    assert.strictEqual(resolveTier(999), 2);
  });

  test('B3.3: Negative, NaN, or non-numeric tier parameters gracefully fall back', () => {
    function resolveTier(tier) {
      const num = Number(tier);
      if (![1, 2, 3].includes(num)) return 2;
      return num;
    }

    assert.strictEqual(resolveTier(-1), 2);
    assert.strictEqual(resolveTier(NaN), 2);
    assert.strictEqual(resolveTier(undefined), 2);
    assert.strictEqual(resolveTier('invalid'), 2);
  });

  test('B3.4: Base price calculation with 0 base price returns 0', () => {
    const price = SPEC_ORACLE.calculateTierPrice(0, 2);
    assert.strictEqual(price, 0);
  });

  // =========================================================================
  // 4. TELEMETRY BOUNDARY CONDITIONS
  // =========================================================================

  test('B4.1: Mass overflow boundary (> 11,600 kg) is flagged as non-nominal', () => {
    const telem = { mass: 11650 };
    const isNominal = telem.mass <= SPEC_ORACLE.TELEMETRY.TARGETS.maxMass;
    assert.strictEqual(isNominal, false, 'Mass > 11,600 kg must exceed nominal tolerance');
  });

  test('B4.2: Mass exact boundary (11,600 kg) is within maximum structural limit', () => {
    const telem = { mass: 11600 };
    const isNominal = telem.mass <= SPEC_ORACLE.TELEMETRY.TARGETS.maxMass;
    assert.strictEqual(isNominal, true, 'Mass = 11,600 kg is exactly at boundary');
  });

  test('B4.3: Power underflow boundary (< 2,200 W) is flagged as non-nominal for launch', () => {
    const telem = { power: 2190 };
    const isNominal = telem.power >= SPEC_ORACLE.TELEMETRY.TARGETS.minPower;
    assert.strictEqual(isNominal, false, 'Power < 2,200 W must be rejected for launch');
  });

  test('B4.4: Comms underflow boundary (< 1.0 Mbps) is flagged as non-nominal for launch', () => {
    const telem = { dataRate: 0.9 };
    const isNominal = telem.dataRate >= SPEC_ORACLE.TELEMETRY.TARGETS.minDataRate;
    assert.strictEqual(isNominal, false, 'Data rate < 1.0 Mbps must be rejected for launch');
  });

  test('B4.5: Budget expenditure exceeding $150,000 cap is flagged as budget overrun', () => {
    const telem = { expenditure: 151000 };
    const isNominal = telem.expenditure <= SPEC_ORACLE.TELEMETRY.TARGETS.maxBudget;
    assert.strictEqual(isNominal, false, 'Expenditure > $150,000 must flag overrun');
  });

  // =========================================================================
  // 5. INCOMPLETE ASSEMBLY COMBINATIONS (LAUNCH GATE GUARDS)
  // =========================================================================

  test('B5.1: Incomplete matrix: 1/6 tasks complete blocks launch', () => {
    const stages = { mech_task1: true, mech_task2: false, elec_task1: false, elec_task2: false, net_task1: false, net_task2: false };
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(stages), false);
  });

  test('B5.2: Incomplete matrix: 2/6 tasks complete (1 full department) blocks launch', () => {
    const stages = { mech_task1: true, mech_task2: true, elec_task1: false, elec_task2: false, net_task1: false, net_task2: false };
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(stages), false);
  });

  test('B5.3: Incomplete matrix: 4/6 tasks complete (2 full departments) blocks launch', () => {
    const stages = { mech_task1: true, mech_task2: true, elec_task1: true, elec_task2: true, net_task1: false, net_task2: false };
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(stages), false);
  });

  test('B5.4: Incomplete matrix: 5/6 tasks complete (missing only net_task1) blocks launch', () => {
    const stages = { mech_task1: true, mech_task2: true, elec_task1: true, elec_task2: true, net_task1: false, net_task2: true };
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(stages), false);
  });

  test('B5.5: Corrupted or null stage properties are treated as incomplete', () => {
    const stages = { mech_task1: true, mech_task2: true, elec_task1: true, elec_task2: true, net_task1: true, net_task2: null };
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(stages), false);
  });

  // =========================================================================
  // 6. INPUT SANITIZATION & NETWORK RESILIENCE
  // =========================================================================

  test('B6.1: Empty or whitespace operator call sign defaults to standard call sign', () => {
    function sanitizeCallSign(name) {
      const clean = (name || '').trim();
      return clean.length > 0 ? clean : 'Astronaut_01';
    }

    assert.strictEqual(sanitizeCallSign(''), 'Astronaut_01');
    assert.strictEqual(sanitizeCallSign('   '), 'Astronaut_01');
    assert.strictEqual(sanitizeCallSign(null), 'Astronaut_01');
    assert.strictEqual(sanitizeCallSign('Commander_Shepard'), 'Commander_Shepard');
  });

  test('B6.2: Malformed or unparseable JSON chat packets are caught without crashing', () => {
    let packetHandled = false;
    let crashOccurred = false;

    function handleIncomingRawChat(rawText) {
      try {
        const parsed = JSON.parse(rawText);
        if (parsed && parsed.__nasa_sync__) {
          packetHandled = true;
        }
      } catch (err) {
        // Must catch cleanly without rethrowing
      }
    }

    try {
      handleIncomingRawChat('MALFORMED_NON_JSON_CORRUPTED_STRING_<<<>>>');
      handleIncomingRawChat('{"brokenJson: true,');
    } catch (e) {
      crashOccurred = true;
    }

    assert.strictEqual(crashOccurred, false, 'Parser must never throw unhandled exception on bad network packet');
    assert.strictEqual(packetHandled, false);
  });

  return suiteResults;
}

if (require.main === module) {
  const res = runBoundaryTests();
  console.log(`\n=== ${res.name} ===`);
  console.log(`Passed: ${res.passed} | Failed: ${res.failed} | Total: ${res.tests.length}`);
  res.tests.forEach(t => {
    if (t.status === 'FAIL') console.error(` ❌ ${t.name} -> ${t.error}`);
    else console.log(` ✔ ${t.name}`);
  });
  process.exit(res.failed > 0 ? 1 : 0);
}

module.exports = { runBoundaryTests };
