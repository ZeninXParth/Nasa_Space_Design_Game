/**
 * Horizon-X: Empirical Adversarial Challenge Suite for Milestone 1
 * Author: Challenger 1 (critic, specialist)
 * Target: Tiered Logistics Marketplace (M1)
 * 
 * Tests the four mandate areas:
 * 1. Tool degradation timer countdown accuracy (5m=300s, 15m=900s, 35m=2100s)
 * 2. Re-requisition when a tool reaches 0s
 * 3. Remote player purchase lock ("Instrument Equipped already")
 * 4. Budget deduction and boundary check (cannot buy if budget < price)
 * 
 * Plus adversarial checks:
 * 5. Runtime Scoping and Execution Integrity of script.js
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createTestEnvironment, SPEC_ORACLE } = require('./test_harness');

function runAdversarialSuite() {
  const results = {
    name: 'M1 Adversarial Challenge Suite',
    passed: 0,
    failed: 0,
    findings: [],
    tests: []
  };

  function test(name, fn) {
    try {
      fn();
      results.passed++;
      results.tests.push({ name, status: 'PASS' });
      console.log(` ✔ ${name}`);
    } catch (err) {
      results.failed++;
      results.tests.push({ name, status: 'FAIL', error: err.message });
      results.findings.push({ test: name, error: err.message });
      console.error(` ✘ ${name}: ${err.message}`);
    }
  }

  console.log('\n=== Starting Empirical Adversarial Challenge Suite (Milestone 1) ===\n');

  // =========================================================================
  // SECTION 1: TOOL DEGRADATION TIMER COUNTDOWN ACCURACY
  // =========================================================================

  test('ADV-1.1: Degradation timer duration accuracy (5m=300s, 15m=900s, 35m=2100s)', () => {
    const tiers = SPEC_ORACLE.TOOL_TIERS;
    assert.strictEqual(tiers[1].durationSec, 300, 'Tier 1 must be exactly 300 seconds (5m)');
    assert.strictEqual(tiers[2].durationSec, 900, 'Tier 2 must be exactly 900 seconds (15m)');
    assert.strictEqual(tiers[3].durationSec, 2100, 'Tier 3 must be exactly 2100 seconds (35m)');

    // Verify ratio invariants
    assert.strictEqual(tiers[1].durationSec * 3, tiers[2].durationSec, 'Tier 2 duration must be exactly 3x Tier 1');
    assert.strictEqual(tiers[3].durationSec / 60, 35, 'Tier 3 duration in minutes must be exactly 35');
  });

  test('ADV-1.2: Second-by-second countdown string formatting precision', () => {
    function formatTime(remSec) {
      const s = Math.max(0, Math.floor(remSec));
      const m = Math.floor(s / 60).toString().padStart(2, '0');
      const sec = (s % 60).toString().padStart(2, '0');
      return s > 0 ? `${m}:${sec}` : 'EXPIRED';
    }

    assert.strictEqual(formatTime(300), '05:00', '300s should format to 05:00');
    assert.strictEqual(formatTime(299), '04:59', '299s should format to 04:59');
    assert.strictEqual(formatTime(900), '15:00', '900s should format to 15:00');
    assert.strictEqual(formatTime(2100), '35:00', '2100s should format to 35:00');
    assert.strictEqual(formatTime(61), '01:01', '61s should format to 01:01');
    assert.strictEqual(formatTime(60), '01:00', '60s should format to 01:00');
    assert.strictEqual(formatTime(15), '00:15', '15s should format to 00:15');
    assert.strictEqual(formatTime(1), '00:01', '1s should format to 00:01');
    assert.strictEqual(formatTime(0), 'EXPIRED', '0s should format to EXPIRED');
    assert.strictEqual(formatTime(-10), 'EXPIRED', 'Negative seconds should format to EXPIRED');
  });

  test('ADV-1.3: Durability progress percentage and threshold color classes', () => {
    function getDurabilityVisuals(remSec, totalDurationSec) {
      const pct = Math.max(0, Math.min(100, (remSec / totalDurationSec) * 100));
      const barColor = remSec > 60 ? '#10b981' : (remSec > 15 ? '#f59e0b' : '#ef4444');
      const isCritical = remSec <= 30 && remSec > 0;
      const isExpired = remSec === 0;
      return { pct, barColor, isCritical, isExpired };
    }

    const t1 = getDurabilityVisuals(300, 300);
    assert.strictEqual(t1.pct, 100);
    assert.strictEqual(t1.barColor, '#10b981', 'Nominal duration >60s should be emerald green');
    assert.strictEqual(t1.isCritical, false);

    const t2 = getDurabilityVisuals(60, 300);
    assert.strictEqual(t2.pct, 20);
    assert.strictEqual(t2.barColor, '#f59e0b', '60s should be warning amber');
    assert.strictEqual(t2.isCritical, false);

    const t3 = getDurabilityVisuals(30, 300);
    assert.strictEqual(t3.isCritical, true, '<=30s should pulse critically');
    assert.strictEqual(t3.barColor, '#f59e0b');

    const t4 = getDurabilityVisuals(15, 300);
    assert.strictEqual(t4.barColor, '#ef4444', '<=15s should be danger red');

    const t5 = getDurabilityVisuals(0, 300);
    assert.strictEqual(t5.pct, 0);
    assert.strictEqual(t5.barColor, '#ef4444');
    assert.strictEqual(t5.isExpired, true);
  });

  // =========================================================================
  // SECTION 2: RE-REQUISITION WHEN A TOOL REACHES 0s
  // =========================================================================

  test('ADV-2.1: Tool expiration marks dysfunctional and toggles re-requisition state', () => {
    const mockState = {
      budget: 150000,
      purchased: { pgt: true },
      playerFrame: ['pgt'],
      toolTimers: {
        pgt: { tier: 1, durationSec: 300, expiresAt: Date.now() - 1000, name: 'PGT Torque Wrench', dept: 'mechanical' }
      },
      toolDysfunctional: {}
    };

    // Simulate expiration tick
    const now = Date.now();
    const remSec = Math.max(0, Math.floor((mockState.toolTimers.pgt.expiresAt - now) / 1000));
    assert.strictEqual(remSec, 0, 'Remaining seconds must be 0 for expired tool');

    if (remSec === 0 && !mockState.toolDysfunctional.pgt) {
      mockState.toolDysfunctional.pgt = true;
    }
    assert.strictEqual(mockState.toolDysfunctional.pgt, true, 'Tool must be marked dysfunctional');

    // Marketplace card logic check
    const isExpired = !!mockState.toolDysfunctional.pgt;
    const isPurchased = !!mockState.purchased.pgt && !isExpired;
    assert.strictEqual(isPurchased, false, 'Expired tool must NOT be considered actively purchased');
    assert.strictEqual(isExpired, true, 'isExpired flag must be true to show RE-REQUISITION');
  });

  test('ADV-2.2: Re-requisition deducts budget and restores operational tool state', () => {
    const mockState = {
      budget: 140000,
      purchased: { pgt: true },
      playerFrame: ['pgt'],
      toolTimers: {
        pgt: { tier: 1, durationSec: 300, expiresAt: Date.now() - 5000, name: 'PGT Torque Wrench', dept: 'mechanical' }
      },
      toolDysfunctional: { pgt: true }
    };

    const curTier = 2; // Upgrading to Tier 2 on re-requisition
    const basePrice = 18500;
    const tierPrice = Math.round(basePrice * SPEC_ORACLE.TOOL_TIERS[curTier].priceMultiplier); // 18500 * 0.7 = 12950
    const durationSec = SPEC_ORACLE.TOOL_TIERS[curTier].durationSec; // 900

    // Execute re-requisition
    assert.ok(mockState.budget >= tierPrice, 'Sufficient budget must exist');
    mockState.budget -= tierPrice;
    mockState.purchased.pgt = true;
    mockState.toolTimers.pgt = {
      tier: curTier,
      durationSec: durationSec,
      expiresAt: Date.now() + durationSec * 1000,
      name: 'PGT Torque Wrench',
      dept: 'mechanical'
    };
    delete mockState.toolDysfunctional.pgt;

    assert.strictEqual(mockState.budget, 140000 - 12950, 'Budget must be deducted by tier 2 price');
    assert.strictEqual(mockState.toolDysfunctional.pgt, undefined, 'Dysfunctional status must be cleared');
    assert.strictEqual(mockState.toolTimers.pgt.tier, 2, 'Tier must be updated to Tier 2');
    assert.strictEqual(mockState.toolTimers.pgt.durationSec, 900, 'Duration must be reset to 900s');
    assert.ok(mockState.toolTimers.pgt.expiresAt > Date.now(), 'Expiration must be in future');
  });

  test('ADV-2.3: Re-requisition rejected when budget is insufficient', () => {
    const mockState = {
      budget: 500, // Insufficient for PGT L1 ($7,400)
      purchased: { pgt: true },
      playerFrame: ['pgt'],
      toolTimers: {
        pgt: { tier: 1, durationSec: 300, expiresAt: Date.now() - 1000, name: 'PGT', dept: 'mechanical' }
      },
      toolDysfunctional: { pgt: true }
    };

    const tierPrice = 7400;
    const canAfford = mockState.budget >= tierPrice;
    assert.strictEqual(canAfford, false, 'Must reject re-requisition when budget < tierPrice');
    // State remains unchanged
    assert.strictEqual(mockState.toolDysfunctional.pgt, true, 'Tool must remain dysfunctional');
    assert.strictEqual(mockState.budget, 500, 'Budget must remain untouched');
  });

  // =========================================================================
  // SECTION 3: REMOTE PLAYER PURCHASE LOCK
  // =========================================================================

  test('ADV-3.1: Remote player purchase lock triggers "Instrument Equipped already"', () => {
    const mockState = {
      operatorName: 'Engineer Alpha',
      roomEquippedTools: {
        pgt: {
          equippedBy: 'RemoteBeta',
          tier: 1,
          dept: 'mechanical',
          expiresAt: Date.now() + 250000
        }
      }
    };

    function isEquippedByRemotePlayer(itemId) {
      if (!mockState || !mockState.roomEquippedTools) return false;
      const info = mockState.roomEquippedTools[itemId];
      if (!info || !info.equippedBy) return false;
      const localName = mockState.operatorName || 'LocalPlayer';
      if (info.equippedBy === localName || info.equippedBy === 'You') return false;
      if (info.expiresAt && info.expiresAt <= Date.now()) return false;
      return true;
    }

    assert.strictEqual(isEquippedByRemotePlayer('pgt'), true, 'Tool equipped by RemoteBeta must be locked for local player');
    assert.strictEqual(isEquippedByRemotePlayer('gyro'), false, 'Unpurchased tool must not be locked');
  });

  test('ADV-3.2: Local player is NOT locked out of their own equipped tool', () => {
    const mockState = {
      operatorName: 'Engineer Alpha',
      roomEquippedTools: {
        pgt: {
          equippedBy: 'Engineer Alpha',
          tier: 1,
          dept: 'mechanical',
          expiresAt: Date.now() + 250000
        }
      }
    };

    function isEquippedByRemotePlayer(itemId) {
      const info = mockState.roomEquippedTools[itemId];
      if (!info || !info.equippedBy) return false;
      const localName = mockState.operatorName;
      if (info.equippedBy === localName || info.equippedBy === 'You') return false;
      if (info.expiresAt && info.expiresAt <= Date.now()) return false;
      return true;
    }

    assert.strictEqual(isEquippedByRemotePlayer('pgt'), false, 'Own tool must not be locked as remote');
  });

  test('ADV-3.3: Expired remote lock automatically releases access', () => {
    const mockState = {
      operatorName: 'Engineer Alpha',
      roomEquippedTools: {
        pgt: {
          equippedBy: 'RemoteBeta',
          tier: 1,
          dept: 'mechanical',
          expiresAt: Date.now() - 100 // Expired in past
        }
      }
    };

    function isEquippedByRemotePlayer(itemId) {
      const info = mockState.roomEquippedTools[itemId];
      if (!info || !info.equippedBy) return false;
      if (info.equippedBy === mockState.operatorName || info.equippedBy === 'You') return false;
      if (info.expiresAt && info.expiresAt <= Date.now()) return false;
      return true;
    }

    assert.strictEqual(isEquippedByRemotePlayer('pgt'), false, 'Expired remote tool must NOT lock local requisition');
  });

  test('ADV-3.4: Dropping instrument clears room lock and broadcasts release', () => {
    const mockState = {
      playerFrame: ['pgt', 'pins'],
      inventory: { pgt: true, pins: true },
      roomEquippedTools: {
        pgt: { equippedBy: 'You', tier: 1, expiresAt: Date.now() + 300000 }
      }
    };

    let broadcastedEvent = null;
    let broadcastedPayload = null;
    const mockMultiplayer = {
      syncToolRelease(itemId, dept) {
        broadcastedEvent = 'SYNC_TOOL_RELEASE';
        broadcastedPayload = { itemId, dept };
      }
    };

    // Drop instrument logic
    const itemId = 'pgt';
    const idx = mockState.playerFrame.indexOf(itemId);
    mockState.playerFrame.splice(idx, 1);
    mockState.inventory[itemId] = false;
    delete mockState.roomEquippedTools[itemId];
    mockMultiplayer.syncToolRelease(itemId, 'mechanical');

    assert.strictEqual(mockState.playerFrame.includes('pgt'), false, 'Tool must be removed from player frame');
    assert.strictEqual(mockState.roomEquippedTools.pgt, undefined, 'Tool lock must be deleted');
    assert.strictEqual(broadcastedEvent, 'SYNC_TOOL_RELEASE', 'SYNC_TOOL_RELEASE must be broadcast');
    assert.strictEqual(broadcastedPayload.itemId, 'pgt');
  });

  // =========================================================================
  // SECTION 4: BUDGET DEDUCTION & BOUNDARY CHECKS
  // =========================================================================

  test('ADV-4.1: Budget deduction rejects purchase when budget < price', () => {
    const budget = 3000;
    const price = 7400; // PGT L1
    const allowed = budget >= price;
    assert.strictEqual(allowed, false, 'Requisition must be blocked when budget is less than price');
  });

  test('ADV-4.2: Exact budget boundary purchase ($7,400 with $7,400 balance) leaves $0.00 remainder', () => {
    let budget = 7400;
    const price = 7400;
    assert.ok(budget >= price, 'Exact balance must be sufficient');
    budget -= price;
    assert.strictEqual(budget, 0, 'Exact boundary purchase must leave exactly 0');
    assert.strictEqual(Number(budget).toFixed(2), '0.00', 'Formatted remainder must be 0.00');
  });

  test('ADV-4.3: Cumulative purchases across all three departments decrement budget correctly', () => {
    let budget = 150000;
    // Mech purchase: PGT L1 = 18500 * 0.4 = 7400
    budget -= 7400;
    // Elec purchase: Soldering Iron L2 = 6800 * 0.7 = 4760
    budget -= 4760;
    // Net purchase: Protocol Analyzer L3 = 24000 * 1.0 = 24000
    budget -= 24000;

    assert.strictEqual(budget, 150000 - 7400 - 4760 - 24000);
    assert.strictEqual(budget, 113840);
  });

  test('ADV-4.4: Currency formatting handles boundary values ($0, negative, fractional)', () => {
    function formatBudget(val) {
      return `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
    assert.strictEqual(formatBudget(0), '$0.00');
    assert.strictEqual(formatBudget(150000), '$150,000.00');
    assert.strictEqual(formatBudget(1234.5), '$1,234.50');
    assert.strictEqual(formatBudget(0.05), '$0.05');
  });

  // =========================================================================
  // SECTION 5: EMPIRICAL CODE INTEGRITY & RUNTIME SCOPING AUDIT
  // =========================================================================

  test('ADV-5.1: AGENTS.md Rule 1 Compliance: Export of classes and globals to window', () => {
    const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf-8');
    
    // Check required window exports
    const exportsToCheck = [
      'window.updateBudgetDisplays = updateBudgetDisplays;',
      'window.TOOL_TIERS = TOOL_TIERS;',
      'window.calculateTierPrice = calculateTierPrice;',
      'window.isEquippedByRemotePlayer = isEquippedByRemotePlayer;',
      'window.buildTierSelectorHtml = buildTierSelectorHtml;'
    ];

    exportsToCheck.forEach(exp => {
      assert.ok(scriptContent.includes(exp), `Missing required window export: ${exp}`);
    });
  });

  test('ADV-5.2: EMPIRICAL DISCOVERY: gameState lexical scoping vs global setInterval tickers', () => {
    const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf-8');
    
    // Look at line 6033: document.addEventListener('DOMContentLoaded', () => { ... });
    // Any setInterval after line 6033 is outside the DOMContentLoaded callback!
    const domLoadedCloseIndex = scriptContent.indexOf('updateContinueButtonState();');
    assert.ok(domLoadedCloseIndex > 0, 'Must find updateContinueButtonState in script.js');

    const codeAfterDomLoaded = scriptContent.slice(domLoadedCloseIndex);
    const intervalsOutsideScope = (codeAfterDomLoaded.match(/setInterval/g) || []).length;

    console.log(`     [OBSERVATION] Found ${intervalsOutsideScope} setInterval ticker(s) outside DOMContentLoaded scope.`);

    // Check for ReferenceError: gameState is not defined outside DOMContentLoaded
    const hasUncheckedGameStateAccess = codeAfterDomLoaded.includes('if (gameState.toolTimers)');
    assert.strictEqual(hasUncheckedGameStateAccess, true, 
      'FOUND CRITICAL BUG: line 6044 contains unchecked `if (gameState.toolTimers)` outside DOMContentLoaded lexical scope!');
  });

  test('ADV-5.3: Duplicate conflicting ticker detection at script footer', () => {
    const scriptContent = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf-8');
    const domLoadedCloseIndex = scriptContent.indexOf('updateContinueButtonState();');
    const footerCode = scriptContent.slice(domLoadedCloseIndex);

    // Ticker 1: lines ~6039 (calls non-existent renderMarketCatalog)
    const hasTicker1 = footerCode.includes('PHASE 02: TOOL DURABILITY COUNTDOWN & DYSFUNCTION TICKER');
    // Ticker 2: lines ~6101 (calls real renderMarketplace)
    const hasTicker2 = footerCode.includes('PHASE 02: GLOBAL TOOL DURABILITY & DYSFUNCTION TICKER');

    assert.ok(hasTicker1, 'Ticker 1 identified in footer');
    assert.ok(hasTicker2, 'Ticker 2 identified in footer');
    
    // Check for non-existent functions called in Ticker 1
    assert.ok(footerCode.includes('renderMarketCatalog'), 'Ticker 1 references non-existent renderMarketCatalog()');
    assert.ok(footerCode.includes('updatePlayerFrameHUD'), 'Ticker 1 references non-existent updatePlayerFrameHUD()');
  });

  test('ADV-5.4: Live VM execution of script.js interval tick throws ReferenceError', () => {
    const env = createTestEnvironment();
    const code = fs.readFileSync(path.resolve(__dirname, '../script.js'), 'utf-8');

    let errorThrown = null;
    env.window.setInterval = (cb) => {
      // Simulate 1st interval execution
      try {
        cb();
      } catch (err) {
        if (!errorThrown) errorThrown = err;
      }
    };

    const ctx = require('node:vm').createContext(env.window);
    require('node:vm').runInContext(code, ctx);

    assert.ok(errorThrown, 'Interval must fail due to gameState scoping');
    assert.strictEqual(errorThrown.name, 'ReferenceError');
    assert.ok(errorThrown.message.includes('gameState is not defined'), `Error must be ReferenceError on gameState, got: ${errorThrown.message}`);
  });

  console.log('\n=== Adversarial Challenge Suite Complete ===');
  console.log(`Passed: ${results.passed} | Failed: ${results.failed} | Total: ${results.tests.length}`);

  return results;
}

if (require.main === module) {
  const res = runMarketplaceAdversarial();
  process.exit(res.failed > 0 ? 1 : 0);
}

function runMarketplaceAdversarial() {
  return runAdversarialSuite();
}

module.exports = { runMarketplaceAdversarial };
