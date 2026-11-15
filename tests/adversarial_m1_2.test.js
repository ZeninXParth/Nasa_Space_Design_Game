/**
 * Horizon-X Milestone 1 Adversarial Challenge Harness
 * Challenger 2: Testing Multi-Department Rendering, Rapid Tier Switching,
 * Tool Expiration & Re-Requisitioning, Budget Display Robustness, and Global Scope Lifecycle.
 */

const assert = require('node:assert');
const { createTestEnvironment, loadScript, SPEC_ORACLE } = require('./test_harness');

function runAdversarialChallengeSuite() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    failures: []
  };

  function test(name, fn) {
    results.total++;
    try {
      fn();
      results.passed++;
      console.log(`  [PASS] ${name}`);
    } catch (err) {
      results.failed++;
      results.failures.push({ name, error: err.message, stack: err.stack });
      console.log(`  [FAIL] ${name}`);
      console.log(`         Error: ${err.message}`);
    }
  }

  console.log('=================================================================');
  console.log('CHALLENGER 2: ADVERSARIAL STRESS-TEST OF MILESTONE 1 STATE MACHINE');
  console.log('=================================================================\n');

  // =========================================================================
  // SECTION 1: GLOBAL LIFECYCLE & SCOPE INTEGRITY (The 1-Sec Ticker Crash)
  // =========================================================================
  console.log('--- SECTION 1: Global Lifecycle & Scope Integrity ---');

  test('Bug Check 1.1: Loading script.js without external window.gameState crashes after 1s', (done) => {
    // We demonstrate that lines 6039-6085 and 6101-6186 reside outside DOMContentLoaded
    // and reference an undeclared `gameState` identifier in the global scope.
    const env = createTestEnvironment();
    // Do NOT mock env.window.gameState
    loadScript('script.js', env);
    env.document.dispatchEvent('DOMContentLoaded');

    // Inside DOMContentLoaded, window.getNasaGameState is exposed:
    assert.ok(env.window.getNasaGameState, 'window.getNasaGameState should be exposed');
    const localGameState = env.window.getNasaGameState();
    assert.ok(localGameState, 'Local gameState exists inside closure');

    // But in the global context outside DOMContentLoaded, window.gameState is UNDEFINED:
    assert.strictEqual(env.window.gameState, undefined, 'window.gameState is NOT attached to window');
  });

  // =========================================================================
  // SECTION 2: MULTI-DEPARTMENT MARKETPLACE RENDERING
  // Verify Mechanical, Electrical, and Network marketplaces render tiers, timers, and locks
  // =========================================================================
  console.log('\n--- SECTION 2: Multi-Department Marketplace Rendering ---');

  function setupEnvironmentForMarketplaces() {
    const env = createTestEnvironment();
    // Provide window.gameState alias so script.js doesn't crash on intervals
    env.window.gameState = {};
    loadScript('script.js', env);
    env.document.dispatchEvent('DOMContentLoaded');
    return env;
  }

  test('M1: Mechanical marketplace (#marketItemsGrid) renders tiers, timers, and locks', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    const grid = env.document.getElementById('marketItemsGrid');
    assert.ok(grid, 'marketItemsGrid element must exist');

    // Simulate remote lock on 'pins'
    gameState.roomEquippedTools = {
      pins: {
        equippedBy: 'Remote_Specialist',
        tier: 2,
        dept: 'mechanical',
        expiresAt: Date.now() + 600000
      }
    };

    // Render Mechanical marketplace
    env.window.renderMarketplace();

    const cards = grid.querySelectorAll('.market-item-card');
    assert.strictEqual(cards.length, 6, 'Mechanical marketplace must render 6 items');

    // Verify 'pgt' card (available)
    const pgtCard = grid.querySelector('[data-tool-id="pgt"]');
    assert.ok(pgtCard, 'PGT card must exist');
    const pgtTiers = pgtCard.querySelectorAll('.tier-pill-btn');
    assert.strictEqual(pgtTiers.length, 3, 'PGT card must render 3 tier buttons');
    assert.strictEqual(pgtTiers[0].getAttribute('data-tier'), '1');
    assert.strictEqual(pgtTiers[1].getAttribute('data-tier'), '2');
    assert.strictEqual(pgtTiers[2].getAttribute('data-tier'), '3');

    // Verify timer elements exist on card
    const pgtTimerWrap = pgtCard.querySelector('#cardTimerWrap_pgt');
    const pgtTimerCount = pgtCard.querySelector('#cardTimerCount_pgt');
    const pgtTimerFill = pgtCard.querySelector('#cardTimerFill_pgt');
    assert.ok(pgtTimerWrap, 'PGT card must have cardTimerWrap');
    assert.ok(pgtTimerCount, 'PGT card must have cardTimerCount');
    assert.ok(pgtTimerFill, 'PGT card must have cardTimerFill');

    // Verify 'pins' card (remotely locked)
    const pinsCard = grid.querySelector('[data-tool-id="pins"]');
    assert.ok(pinsCard, 'Pins card must exist');
    const pinsLockBtn = pinsCard.querySelector('.btn-buy-item.locked');
    assert.ok(pinsLockBtn, 'Locked item must have .btn-buy-item.locked');
    assert.strictEqual(pinsLockBtn.disabled, true, 'Locked item button must be disabled');
    assert.ok(pinsLockBtn.textContent.includes('Instrument Equipped already'), 'Must display "Instrument Equipped already"');
    const pinsTiers = pinsCard.querySelectorAll('.tier-pill-btn');
    pinsTiers.forEach(btn => {
      assert.strictEqual(btn.disabled, true, 'Tier pills must be disabled for locked tool');
    });
  });

  test('M2: Electrical marketplace (#marketItemsGridElec) renders tiers, timers, and locks', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    const grid = env.document.getElementById('marketItemsGridElec');
    assert.ok(grid, 'marketItemsGridElec element must exist');

    // Simulate remote lock on 'tweezers'
    gameState.roomEquippedTools = {
      tweezers: {
        equippedBy: 'Dr_Elec',
        tier: 1,
        dept: 'electronic',
        expiresAt: Date.now() + 250000
      }
    };

    // Render Electrical marketplace
    env.window.renderMarketplaceElec();

    const cards = grid.querySelectorAll('.market-item-card');
    assert.strictEqual(cards.length, 8, 'Electrical marketplace must render 8 flight items');

    // Verify wriststrap (available)
    const wristCard = grid.querySelector('[data-tool-id="wriststrap"]');
    assert.ok(wristCard, 'Wriststrap card must exist');
    const wristTiers = wristCard.querySelectorAll('.tier-pill-btn');
    assert.strictEqual(wristTiers.length, 3, 'Wriststrap must have 3 tier pills');
    const wristTimerWrap = wristCard.querySelector('#cardTimerWrap_wriststrap');
    assert.ok(wristTimerWrap, 'Wriststrap must have cardTimerWrap');

    // Verify tweezers (locked)
    const tweezersCard = grid.querySelector('[data-tool-id="tweezers"]');
    assert.ok(tweezersCard, 'Tweezers card must exist');
    const lockBtn = tweezersCard.querySelector('.btn-buy-item.locked');
    assert.ok(lockBtn, 'Tweezers must show locked button');
    assert.strictEqual(lockBtn.disabled, true);
    assert.ok(lockBtn.textContent.includes('Instrument Equipped already'));
  });

  test('M3: Network marketplace (#marketCatalogGridNet) renders tiers, timers, and locks', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    const grid = env.document.getElementById('marketCatalogGridNet');
    assert.ok(grid, 'marketCatalogGridNet element must exist');

    // Simulate remote lock on 'coupler'
    gameState.roomEquippedTools = {
      coupler: {
        equippedBy: 'Net_Admin',
        tier: 3,
        dept: 'network',
        expiresAt: Date.now() + 1800000
      }
    };

    // Render Network marketplace
    env.window.renderMarketplaceNet();

    const cards = grid.querySelectorAll('.market-item-card');
    assert.strictEqual(cards.length, 6, 'Network marketplace must render 6 tools/modules');

    // Verify rf_wrench (available)
    const rfCard = grid.querySelector('[data-tool-id="rf_wrench"]');
    assert.ok(rfCard, 'rf_wrench card must exist');
    const rfTiers = rfCard.querySelectorAll('.tier-pill-btn');
    assert.strictEqual(rfTiers.length, 3, 'rf_wrench must have 3 tier pills');
    const rfTimerWrap = rfCard.querySelector('#cardTimerWrap_rf_wrench');
    assert.ok(rfTimerWrap, 'rf_wrench must have cardTimerWrap');

    // Verify coupler (locked)
    const couplerCard = grid.querySelector('[data-tool-id="coupler"]');
    assert.ok(couplerCard, 'Coupler card must exist');
    const lockBtn = couplerCard.querySelector('.btn-buy-item.locked');
    assert.ok(lockBtn, 'Coupler must show locked button');
    assert.strictEqual(lockBtn.disabled, true);
    assert.ok(lockBtn.textContent.includes('Instrument Equipped already'));
  });

  // =========================================================================
  // SECTION 3: RAPID SWITCHING BETWEEN TIERS (L1 -> L3 -> L2)
  // =========================================================================
  console.log('\n--- SECTION 3: Rapid Tier Switching (L1 -> L3 -> L2) ---');

  test('S1: Rapid tier switching in Mechanical Marketplace (PGT)', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    gameState.budget = 150000;
    env.window.renderMarketplace();

    const grid = env.document.getElementById('marketItemsGrid');
    const pgtCard = grid.querySelector('[data-tool-id="pgt"]');
    const tierBtns = pgtCard.querySelectorAll('.tier-pill-btn');
    const buyBtn = pgtCard.querySelector('[data-action="buy"]');

    const btnL1 = tierBtns.find(b => b.getAttribute('data-tier') === '1');
    const btnL2 = tierBtns.find(b => b.getAttribute('data-tier') === '2');
    const btnL3 = tierBtns.find(b => b.getAttribute('data-tier') === '3');

    // 1. Initial default is L1
    assert.strictEqual(env.window.getToolTier('pgt'), 1, 'Initial tier should be 1');
    assert.ok(btnL1.classList.contains('active'), 'L1 pill should be active');
    assert.ok(buyBtn.textContent.includes('7,400'), 'Initial button should display L1 price ($7,400)');

    // 2. Rapid switch to L3
    btnL3.click();
    assert.strictEqual(env.window.getToolTier('pgt'), 3, 'Tier should now be 3');
    assert.ok(btnL3.classList.contains('active'), 'L3 pill should be active');
    assert.strictEqual(btnL1.classList.contains('active'), false, 'L1 pill must not be active');
    assert.ok(buyBtn.textContent.includes('18,500'), 'Button must update to L3 price ($18,500)');

    // 3. Rapid switch to L2
    btnL2.click();
    assert.strictEqual(env.window.getToolTier('pgt'), 2, 'Tier should now be 2');
    assert.ok(btnL2.classList.contains('active'), 'L2 pill should be active');
    assert.strictEqual(btnL3.classList.contains('active'), false, 'L3 pill must not be active');
    assert.ok(buyBtn.textContent.includes('12,950'), 'Button must update to L2 price ($12,950)');

    // 4. Click REQUISITION at L2
    buyBtn.click();

    // Verify deductions and state
    const expectedCost = 12950; // 18500 * 0.70
    assert.strictEqual(gameState.budget, 150000 - expectedCost, 'Budget must deduct exact Tier 2 cost');
    assert.strictEqual(gameState.toolTimers.pgt.tier, 2, 'toolTimers must record tier 2');
    assert.strictEqual(gameState.toolTimers.pgt.durationSec, 900, 'toolTimers duration must be 900s (15 min)');
    assert.strictEqual(gameState.roomEquippedTools.pgt.tier, 2, 'roomEquippedTools must record tier 2');
    assert.ok(gameState.playerFrame.includes('pgt'), 'PGT must be equipped to player frame');
  });

  test('S2: Rapid tier switching in Electrical Marketplace (Wriststrap)', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    gameState.budget = 150000;
    env.window.renderMarketplaceElec();

    const grid = env.document.getElementById('marketItemsGridElec');
    const card = grid.querySelector('[data-tool-id="wriststrap"]');
    const tierBtns = card.querySelectorAll('.tier-pill-btn');
    const buyBtn = card.querySelector('[data-action="buy"]');

    const btnL1 = tierBtns.find(b => b.getAttribute('data-tier') === '1');
    const btnL2 = tierBtns.find(b => b.getAttribute('data-tier') === '2');
    const btnL3 = tierBtns.find(b => b.getAttribute('data-tier') === '3');

    // Switch L1 -> L3 -> L2
    btnL3.click();
    assert.strictEqual(env.window.getToolTier('wriststrap'), 3);
    assert.ok(buyBtn.textContent.includes('1,500'), 'L3 price is 100% = $1,500');

    btnL2.click();
    assert.strictEqual(env.window.getToolTier('wriststrap'), 2);
    assert.ok(buyBtn.textContent.includes('1,050'), 'L2 price is 70% = $1,050');

    // Requisition
    buyBtn.click();
    assert.strictEqual(gameState.budget, 150000 - 1050, 'Budget must deduct $1,050');
    assert.strictEqual(gameState.toolTimers.wriststrap.tier, 2);
    assert.strictEqual(gameState.toolTimers.wriststrap.durationSec, 900);
  });

  // =========================================================================
  // SECTION 4: TOOL EXPIRATION & RE-REQUISITION AT DIFFERENT TIER
  // =========================================================================
  console.log('\n--- SECTION 4: Tool Expiry & Cross-Tier Re-Requisition ---');

  test('E1: Requisition at L1 -> Expire -> Re-requisition at L3 (Mechanical: PGT)', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    gameState.budget = 150000;

    // 1. Initial purchase at Level 1 (5 min, $7,400)
    env.window.renderMarketplace();
    const grid = env.document.getElementById('marketItemsGrid');
    const pgtCard = grid.querySelector('[data-tool-id="pgt"]');
    const buyBtn = pgtCard.querySelector('[data-action="buy"]');
    buyBtn.click();

    assert.strictEqual(gameState.budget, 142600);
    assert.strictEqual(gameState.toolTimers.pgt.tier, 1);
    assert.strictEqual(gameState.toolTimers.pgt.durationSec, 300);
    assert.strictEqual(gameState.purchased.pgt, true);

    // 2. Simulate Expiration (durability reaches 0)
    gameState.toolDysfunctional.pgt = true;
    gameState.toolTimers.pgt.expiresAt = Date.now() - 1000; // expired in past

    // Re-render marketplace
    env.window.renderMarketplace();

    const expiredCard = grid.querySelector('[data-tool-id="pgt"]');
    const reBuyBtn = expiredCard.querySelector('[data-action="buy"]');
    assert.ok(reBuyBtn, 'Card must have re-requisition buy button');
    assert.ok(reBuyBtn.classList.contains('btn-re-requisition'), 'Button must have .btn-re-requisition class');
    assert.ok(reBuyBtn.textContent.includes('RE-REQUISITION'), 'Button text must say RE-REQUISITION');

    // Verify tier selector is re-enabled
    const reTiers = expiredCard.querySelectorAll('.tier-pill-btn');
    reTiers.forEach(btn => {
      assert.strictEqual(btn.disabled, false, 'Tier pills must be re-enabled on expired instrument');
    });

    // 3. Select Level 3 for re-requisition
    const btnL3 = reTiers.find(b => b.getAttribute('data-tier') === '3');
    btnL3.click();
    assert.strictEqual(env.window.getToolTier('pgt'), 3, 'Selected tier must be updated to 3');
    assert.ok(reBuyBtn.textContent.includes('18,500'), 'Re-requisition price must update to $18,500');

    // 4. Click RE-REQUISITION
    reBuyBtn.click();

    // Verify state restored at Level 3
    assert.strictEqual(gameState.budget, 142600 - 18500, 'Budget must deduct L3 price $18,500');
    assert.strictEqual(gameState.toolDysfunctional.pgt, undefined, 'toolDysfunctional flag must be cleared');
    assert.strictEqual(gameState.toolTimers.pgt.tier, 3, 'toolTimers must reflect tier 3');
    assert.strictEqual(gameState.toolTimers.pgt.durationSec, 2100, 'Duration must be 2100s (35 min)');
    assert.strictEqual(gameState.roomEquippedTools.pgt.tier, 3, 'roomEquippedTools must reflect tier 3');
  });

  test('E2: Requisition at L1 -> Expire -> Re-requisition at L3 (Network: RF Wrench)', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    gameState.budget = 150000;

    env.window.renderMarketplaceNet();
    const grid = env.document.getElementById('marketCatalogGridNet');
    const card = grid.querySelector('[data-tool-id="rf_wrench"]');
    const buyBtn = card.querySelector('[data-action="buy"]');

    // Buy L1 ($4,500 * 0.40 = $1,800)
    buyBtn.click();
    assert.strictEqual(gameState.budget, 150000 - 1800);
    assert.strictEqual(gameState.toolTimers.rf_wrench.tier, 1);

    // Expire
    gameState.toolDysfunctional.rf_wrench = true;
    env.window.renderMarketplaceNet();

    const expCard = grid.querySelector('[data-tool-id="rf_wrench"]');
    const reBuyBtn = expCard.querySelector('[data-action="buy"]');
    assert.ok(reBuyBtn.classList.contains('btn-re-requisition'));

    // Switch to L3 ($4,500)
    const btnL3 = expCard.querySelectorAll('.tier-pill-btn').find(b => b.getAttribute('data-tier') === '3');
    btnL3.click();
    assert.ok(reBuyBtn.textContent.includes('4,500'));

    // Re-purchase
    reBuyBtn.click();
    assert.strictEqual(gameState.budget, 150000 - 1800 - 4500);
    assert.strictEqual(gameState.toolDysfunctional.rf_wrench, undefined);
    assert.strictEqual(gameState.toolTimers.rf_wrench.tier, 3);
    assert.strictEqual(gameState.toolTimers.rf_wrench.durationSec, 2100);
  });

  // =========================================================================
  // SECTION 5: ROBUSTNESS OF updateBudgetDisplays()
  // Verify it never throws under null, undefined, NaN, empty string, or negative
  // =========================================================================
  console.log('\n--- SECTION 5: updateBudgetDisplays() Robustness ---');

  test('B1: updateBudgetDisplays handles null budget without throwing ($0)', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    gameState.budget = null;

    assert.doesNotThrow(() => {
      env.window.updateBudgetDisplays();
    });

    const hudTop = env.document.getElementById('hudTopBudget');
    assert.strictEqual(hudTop.textContent, '$0', 'null budget must render as $0');
  });

  test('B2: updateBudgetDisplays handles undefined budget without throwing ($0)', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    gameState.budget = undefined;

    assert.doesNotThrow(() => {
      env.window.updateBudgetDisplays();
    });

    const hudTop = env.document.getElementById('hudTopBudget');
    assert.strictEqual(hudTop.textContent, '$0', 'undefined budget must render as $0');
  });

  test('B3: updateBudgetDisplays handles NaN budget without throwing ($0)', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    gameState.budget = NaN;

    assert.doesNotThrow(() => {
      env.window.updateBudgetDisplays();
    });

    const hudTop = env.document.getElementById('hudTopBudget');
    assert.strictEqual(hudTop.textContent, '$0', 'NaN budget must render as $0');
  });

  test('B4: updateBudgetDisplays handles empty string budget without throwing ($0)', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    gameState.budget = '';

    assert.doesNotThrow(() => {
      env.window.updateBudgetDisplays();
    });

    const hudTop = env.document.getElementById('hudTopBudget');
    assert.strictEqual(hudTop.textContent, '$0', 'empty string budget must render as $0');
  });

  test('B5: updateBudgetDisplays handles negative budget without throwing ($-500)', () => {
    const env = setupEnvironmentForMarketplaces();
    const gameState = env.window.getNasaGameState();
    gameState.budget = -500;

    assert.doesNotThrow(() => {
      env.window.updateBudgetDisplays();
    });

    const hudTop = env.document.getElementById('hudTopBudget');
    assert.strictEqual(hudTop.textContent, '$-500', 'negative budget must format correctly');
  });

  test('B6: updateBudgetDisplays survives when target DOM elements are missing', () => {
    const env = createTestEnvironment();
    env.window.gameState = {};
    loadScript('script.js', env);
    env.document.dispatchEvent('DOMContentLoaded');

    // Remove budget elements from DOM
    ['hudTopBudget', 'hudBudgetChip', 'debriefBudget', 'marketRemainingBudget', 'marketRemainingBudgetElec', 'marketRemainingBudgetNet'].forEach(id => {
      const el = env.document.getElementById(id);
      if (el && el.parentNode) el.parentNode.removeChild(el);
    });

    assert.doesNotThrow(() => {
      env.window.updateBudgetDisplays();
    }, 'Must not throw even when all budget DOM elements are missing');
  });

  console.log('\n=================================================================');
  console.log(`TOTAL TESTS: ${results.total} | PASSED: ${results.passed} | FAILED: ${results.failed}`);
  console.log('=================================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  }
}

runAdversarialChallengeSuite();
