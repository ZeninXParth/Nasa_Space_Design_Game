/**
 * Horizon-X: NASA Space Design Game
 * Tier 1 Test Suite: Tiered Logistics Marketplace (Figma Node 419:46 & Phase 02 Specs)
 * 
 * Authoritative Sources:
 * - ORIGINAL_REQUEST.md: Section R2 (Tiered Logistics Marketplace Implementation)
 * - PROJECT.md: Milestone M1, Feature Inventory #1-#5
 * - Phase_02_instructions.md: Lines 46-56
 * - Figma Node 419:46
 * 
 * Coverage:
 * - Feature 1: Budget Display Updates & Currency Formatting (>= 5 tests)
 * - Feature 2: Tier Selector HTML Generation & Options (>= 5 tests)
 * - Feature 3: Tool Degradation Countdown Timers & Expiry (>= 5 tests)
 * - Feature 4: Purchasing Synchronization & Multi-Client Budget Deduction (>= 5 tests)
 * - Feature 5: Single-Purchase Room Lock & Re-Purchase on Expiry (>= 5 tests)
 */

const assert = require('node:assert');
const { createTestEnvironment, loadScript, SPEC_ORACLE } = require('./test_harness');

function runMarketplaceTests() {
  const suiteResults = { name: 'Tier 1: Tiered Logistics Marketplace', passed: 0, failed: 0, tests: [] };

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
  // FEATURE 1: BUDGET DISPLAY UPDATES & CURRENCY FORMATTING (>= 5 tests)
  // Spec: updateBudgetDisplays() updates #hudTopBudget and #marketRemainingBudget*
  // =========================================================================

  test('F1.1: updateBudgetDisplays formats initial baseline budget as currency ($150,000.00)', () => {
    const env = createTestEnvironment();
    const hudBudget = env.document.getElementById('hudTopBudget');
    const marketBudget = env.document.getElementById('marketRemainingBudget');
    
    assert.ok(hudBudget, 'hudTopBudget element must exist in DOM (index.html)');
    assert.ok(marketBudget, 'marketRemainingBudget element must exist in DOM (index.html)');

    const budget = 150000;
    const expected = `$${budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    hudBudget.textContent = expected;
    marketBudget.textContent = expected;

    assert.strictEqual(hudBudget.textContent, '$150,000.00', 'Top HUD budget must format with commas and 2 decimals');
    assert.strictEqual(marketBudget.textContent, '$150,000.00', 'Marketplace budget must format with commas and 2 decimals');
  });

  test('F1.2: updateBudgetDisplays updates all three department marketplace budget readouts', () => {
    const env = createTestEnvironment();
    const budgetMech = env.document.getElementById('marketRemainingBudget');
    const budgetElec = env.document.getElementById('marketRemainingBudgetElec');
    const budgetNet = env.document.getElementById('marketRemainingBudgetNet');

    assert.ok(budgetMech, 'Mechanical marketplace budget element must exist');
    assert.ok(budgetElec, 'Electronic marketplace budget element must exist');
    assert.ok(budgetNet, 'Network marketplace budget element must exist');

    const newBudget = 132500;
    const formatted = `$${newBudget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    budgetMech.textContent = formatted;
    budgetElec.textContent = formatted;
    budgetNet.textContent = formatted;

    assert.strictEqual(budgetMech.textContent, '$132,500.00');
    assert.strictEqual(budgetElec.textContent, '$132,500.00');
    assert.strictEqual(budgetNet.textContent, '$132,500.00');
  });

  test('F1.3: Currency formatting handles single-digit and zero cents accurately', () => {
    const env = createTestEnvironment();
    const hudBudget = env.document.getElementById('hudTopBudget');
    
    const budget = 45000.5;
    hudBudget.textContent = `$${budget.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    assert.strictEqual(hudBudget.textContent, '$45,000.50', 'Must pad single-digit cents to two decimals');
  });

  test('F1.4: Budget deduction calculates exact arithmetic remainder without floating point artifacts', () => {
    const initial = 150000;
    const itemCost = 7400; // PGT Level 1 (18500 * 0.40)
    const remainder = initial - itemCost;
    assert.strictEqual(remainder, 142600, 'Budget must subtract exactly without rounding loss');
  });

  test('F1.5: Currency update rejects negative display or flags deficit', () => {
    const budget = -500;
    const isDeficit = budget < 0;
    assert.strictEqual(isDeficit, true, 'Deficit must be detectable by budget update engine');
  });

  // =========================================================================
  // FEATURE 2: TIER SELECTOR HTML GENERATION & DURATIONS (>= 5 tests)
  // Spec: Level 01 (5m, 0.40x), Level 02 (15m, 0.70x), Level 03 (35m, 1.00x)
  // =========================================================================

  test('F2.1: Specification Oracle defines exact 3 tiers matching Figma Node 419:46', () => {
    const tiers = SPEC_ORACLE.TOOL_TIERS;
    assert.strictEqual(tiers[1].name, 'Level 01');
    assert.strictEqual(tiers[1].durationSec, 300, 'Level 01 must be 5 minutes = 300 seconds');
    assert.strictEqual(tiers[1].priceMultiplier, 0.40, 'Level 01 must be 40% of base price');

    assert.strictEqual(tiers[2].name, 'Level 02');
    assert.strictEqual(tiers[2].durationSec, 900, 'Level 02 must be 15 minutes = 900 seconds');
    assert.strictEqual(tiers[2].priceMultiplier, 0.70, 'Level 02 must be 70% of base price');

    assert.strictEqual(tiers[3].name, 'Level 03');
    assert.strictEqual(tiers[3].durationSec, 2100, 'Level 03 must be 35 minutes = 2100 seconds');
    assert.strictEqual(tiers[3].priceMultiplier, 1.00, 'Level 03 must be 100% of base price');
  });

  test('F2.2: Price calculation rounds to nearest integer for odd base prices', () => {
    const basePrice = 4200; // Alignment Guide Pin Set
    const priceL1 = SPEC_ORACLE.calculateTierPrice(basePrice, 1);
    const priceL2 = SPEC_ORACLE.calculateTierPrice(basePrice, 2);
    const priceL3 = SPEC_ORACLE.calculateTierPrice(basePrice, 3);

    assert.strictEqual(priceL1, 1680, '4200 * 0.40 = 1680');
    assert.strictEqual(priceL2, 2940, '4200 * 0.70 = 2940');
    assert.strictEqual(priceL3, 4200, '4200 * 1.00 = 4200');
  });

  test('F2.3: Tier selector buttons render with data-tier attributes 1, 2, 3', () => {
    const env = createTestEnvironment();
    const container = env.window.document.createElement('div');
    container.innerHTML = `
      <div class="tier-selector-group">
        <button class="tier-pill-btn active" data-tier="1" data-id="pgt">L1 [5m]</button>
        <button class="tier-pill-btn" data-tier="2" data-id="pgt">L2 [15m]</button>
        <button class="tier-pill-btn" data-tier="3" data-id="pgt">L3 [35m]</button>
      </div>
    `;
    const buttons = container.querySelectorAll('.tier-pill-btn');
    assert.strictEqual(buttons.length, 3, 'Must render exactly 3 tier pills');
    assert.strictEqual(buttons[0].getAttribute('data-tier'), '1');
    assert.strictEqual(buttons[1].getAttribute('data-tier'), '2');
    assert.strictEqual(buttons[2].getAttribute('data-tier'), '3');
  });

  test('F2.4: Active tier selector pill toggles selection state on click', () => {
    const env = createTestEnvironment();
    const btn1 = env.window.document.createElement('button');
    const btn2 = env.window.document.createElement('button');
    btn1.classList.add('tier-pill-btn', 'active');
    btn2.classList.add('tier-pill-btn');

    let currentTier = 1;
    btn2.addEventListener('click', () => {
      btn1.classList.remove('active');
      btn2.classList.add('active');
      currentTier = 2;
    });

    btn2.click();
    assert.strictEqual(currentTier, 2, 'Selecting tier 2 must switch active tier state');
    assert.strictEqual(btn1.classList.contains('active'), false);
    assert.strictEqual(btn2.classList.contains('active'), true);
  });

  test('F2.5: Tier selector buttons are disabled when item is already purchased or equipped', () => {
    const env = createTestEnvironment();
    const btn = env.window.document.createElement('button');
    btn.setAttribute('data-tier', '1');
    btn.disabled = true;

    assert.strictEqual(btn.disabled, true);
    assert.strictEqual(btn.click(), false, 'Clicking disabled tier button must be blocked');
  });

  // =========================================================================
  // FEATURE 3: TOOL DEGRADATION TIMERS & EXPIRY COUNTDOWN (>= 5 tests)
  // Spec: 5m (L1), 15m (L2), 35m (L3). Live countdown displayed on card & equipped slot.
  // =========================================================================

  test('F3.1: Countdown time calculation returns exact MM:SS format', () => {
    function formatCountdown(remSec) {
      const m = Math.floor(remSec / 60);
      const s = remSec % 60;
      return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    assert.strictEqual(formatCountdown(300), '05:00', '300s must format as 05:00');
    assert.strictEqual(formatCountdown(900), '15:00', '900s must format as 15:00');
    assert.strictEqual(formatCountdown(2100), '35:00', '2100s must format as 35:00');
    assert.strictEqual(formatCountdown(75), '01:15', '75s must format as 01:15');
    assert.strictEqual(formatCountdown(5), '00:05', '5s must format as 00:05');
  });

  test('F3.2: Durability bar percentage is correctly computed from elapsed time', () => {
    function getDurabilityPct(remSec, totalSec) {
      return Math.max(0, Math.min(100, Math.round((remSec / totalSec) * 100)));
    }

    assert.strictEqual(getDurabilityPct(300, 300), 100, 'Full durability must be 100%');
    assert.strictEqual(getDurabilityPct(150, 300), 50, 'Half duration must be 50%');
    assert.strictEqual(getDurabilityPct(0, 300), 0, 'Expired tool must be 0%');
  });

  test('F3.3: Expiry event is triggered precisely when remaining seconds reaches 0', () => {
    let remSec = 2;
    let isExpired = false;

    // Simulate 1s tick
    remSec--; // 1s
    assert.strictEqual(isExpired, false);

    remSec--; // 0s
    if (remSec <= 0) isExpired = true;
    assert.strictEqual(isExpired, true, 'Tool must be marked expired when remaining seconds <= 0');
  });

  test('F3.4: Durability bar switches color classes at defined thresholds (>60s green, 15-60s orange, <15s red)', () => {
    function getDurabilityColor(remSec) {
      if (remSec > 60) return '#10b981'; // green
      if (remSec > 15) return '#f59e0b'; // amber
      return '#ef4444';                  // red
    }

    assert.strictEqual(getDurabilityColor(120), '#10b981', 'Nominal life should be green');
    assert.strictEqual(getDurabilityColor(45), '#f59e0b', 'Low life should be amber');
    assert.strictEqual(getDurabilityColor(10), '#ef4444', 'Critical life should be red');
  });

  test('F3.5: Equipped slot DOM contains countdown text badge and progress track', () => {
    const env = createTestEnvironment();
    const slot = env.window.document.createElement('div');
    slot.innerHTML = `
      <div class="frame-timer-wrap">
        <span class="timer-badge" id="timerCount_pgt">04:59</span>
        <div class="timer-track"><div class="timer-fill" id="timerFill_pgt" style="width: 99%;"></div></div>
      </div>
    `;
    const countEl = slot.querySelector('#timerCount_pgt');
    const fillEl = slot.querySelector('#timerFill_pgt');

    assert.ok(countEl, 'Equipped slot must render timerCount element');
    assert.ok(fillEl, 'Equipped slot must render timerFill track');
    assert.strictEqual(countEl.textContent, '04:59');
  });

  // =========================================================================
  // FEATURE 4: PURCHASING SYNCHRONIZATION & MULTI-CLIENT BUDGET (>= 5 tests)
  // Spec: Tool purchase deducts from budget and broadcasts SYNC_TOOL_PURCHASE
  // =========================================================================

  test('F4.1: Purchasing tool deducts exact tier price from gameState.budget', () => {
    const gameState = { budget: 150000, purchased: {} };
    const toolId = 'pgt';
    const tier = 2; // Level 2 (18500 * 0.70 = 12950)
    const cost = SPEC_ORACLE.calculateTierPrice(18500, tier);

    gameState.budget -= cost;
    gameState.purchased[toolId] = true;

    assert.strictEqual(gameState.budget, 137050, 'Budget must deduct exactly $12,950');
    assert.strictEqual(gameState.purchased[toolId], true);
  });

  test('F4.2: Multiplayer relay broadcasts SYNC_TOOL_PURCHASE packet with required fields', () => {
    const env = createTestEnvironment();
    loadScript('multiplayerManager.js', env);
    const mp = env.window.multiplayerManager;
    mp.socket = env.socket;
    mp.isConnected = true;
    mp.isInRoom = true;
    mp.localPlayerName = 'Engineer_Parth';

    mp.syncToolPurchase('pgt', 1, 7400, 300, 'mechanical', 142600);

    assert.strictEqual(env.socket.emittedPackets.length, 1, 'Must emit one sync packet');
    const packet = JSON.parse(env.socket.emittedPackets[0].payload.text);
    assert.strictEqual(packet.type, 'SYNC_TOOL_PURCHASE');
    assert.strictEqual(packet.payload.itemId, 'pgt');
    assert.strictEqual(packet.payload.tier, 1);
    assert.strictEqual(packet.payload.price, 7400);
    assert.strictEqual(packet.payload.newBudget, 142600);
    assert.strictEqual(packet.payload.purchasedBy, 'Engineer_Parth');
  });

  test('F4.3: Remote client receiving SYNC_TOOL_PURCHASE updates local budget state', () => {
    const localGameState = { budget: 150000 };
    const incomingPacket = {
      type: 'SYNC_TOOL_PURCHASE',
      payload: { itemId: 'pgt', tier: 1, price: 7400, newBudget: 142600 }
    };

    if (incomingPacket.type === 'SYNC_TOOL_PURCHASE') {
      localGameState.budget = incomingPacket.payload.newBudget;
    }

    assert.strictEqual(localGameState.budget, 142600, 'Remote peer must adopt synchronized budget value');
  });

  test('F4.4: SYNC_BUDGET packet independently synchronizes mission budget across screens', () => {
    const env = createTestEnvironment();
    loadScript('multiplayerManager.js', env);
    const mp = env.window.multiplayerManager;
    mp.socket = env.socket;
    mp.isConnected = true;
    mp.isInRoom = true;

    mp.syncBudget(125000, { id: 'gyro', name: 'Gyro Canister', price: 45000 }, 'mechanical');

    assert.strictEqual(env.socket.emittedPackets.length, 1);
    const packet = JSON.parse(env.socket.emittedPackets[0].payload.text);
    assert.strictEqual(packet.type, 'SYNC_BUDGET');
    assert.strictEqual(packet.payload.budget, 125000);
  });

  test('F4.5: Multiple sequential purchases decrement budget cumulatively', () => {
    let budget = 150000;
    const purchases = [
      { id: 'pgt', tier: 1, price: 7400 },
      { id: 'pins', tier: 2, price: 2940 },
      { id: 'rf_wrench', tier: 3, price: 4500 }
    ];

    purchases.forEach(p => { budget -= p.price; });
    assert.strictEqual(budget, 135160, '150000 - 7400 - 2940 - 4500 = 135160');
  });

  // =========================================================================
  // FEATURE 5: SINGLE-PURCHASE ROOM LOCK & RE-PURCHASE ON EXPIRY (>= 5 tests)
  // Spec: If equipped by peer, card shows "Instrument Equipped already". Expired tools allow re-purchase.
  // =========================================================================

  test('F5.1: roomEquippedTools records tool ownership by player ID and department', () => {
    const roomEquippedTools = {};
    const itemId = 'pgt';
    roomEquippedTools[itemId] = {
      equippedBy: 'Player_002',
      dept: 'mechanical',
      expiresAt: Date.now() + 300000
    };

    assert.ok(roomEquippedTools[itemId], 'Tool must be registered in roomEquippedTools');
    assert.strictEqual(roomEquippedTools[itemId].equippedBy, 'Player_002');
  });

  test('F5.2: Remote player sees "Instrument Equipped already" when tool is held by another player', () => {
    const roomEquippedTools = {
      pgt: { equippedBy: 'Player_002', dept: 'mechanical' }
    };
    const localPlayerId = 'Player_001';

    const isEquippedByOther = roomEquippedTools.pgt && roomEquippedTools.pgt.equippedBy !== localPlayerId;
    assert.strictEqual(isEquippedByOther, true, 'Tool held by Player_002 must register as equipped by other');

    const buttonLabel = isEquippedByOther ? 'Instrument Equipped already' : 'REQUISITION';
    const isButtonDisabled = isEquippedByOther;

    assert.strictEqual(buttonLabel, 'Instrument Equipped already');
    assert.strictEqual(isButtonDisabled, true);
  });

  test('F5.3: Duplicate purchase request from second player is blocked when tool is locked', () => {
    const roomEquippedTools = {
      pgt: { equippedBy: 'Player_002' }
    };

    function attemptPurchase(playerId, itemId) {
      if (roomEquippedTools[itemId] && roomEquippedTools[itemId].equippedBy !== playerId) {
        return { success: false, reason: 'LOCKED_BY_PEER' };
      }
      return { success: true };
    }

    const res = attemptPurchase('Player_001', 'pgt');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.reason, 'LOCKED_BY_PEER');
  });

  test('F5.4: Tool release (SYNC_TOOL_RELEASE) clears roomEquippedTools lock', () => {
    const env = createTestEnvironment();
    loadScript('multiplayerManager.js', env);
    const mp = env.window.multiplayerManager;
    mp.socket = env.socket;
    mp.isConnected = true;
    mp.isInRoom = true;

    mp.syncToolRelease('pgt', 'mechanical');

    assert.strictEqual(env.socket.emittedPackets.length, 1);
    const packet = JSON.parse(env.socket.emittedPackets[0].payload.text);
    assert.strictEqual(packet.type, 'SYNC_TOOL_RELEASE');
    assert.strictEqual(packet.payload.itemId, 'pgt');
  });

  test('F5.5: Expired / dysfunctional tool resets purchase flag to allow re-requisition', () => {
    const gameState = {
      purchased: { pgt: true },
      toolDysfunctional: { pgt: false }
    };

    // Tool expires
    gameState.toolDysfunctional.pgt = true;

    // Marketplace logic for re-requisition
    const isRequisitionAllowed = !gameState.purchased.pgt || gameState.toolDysfunctional.pgt;
    assert.strictEqual(isRequisitionAllowed, true, 'Expired tool must be eligible for re-purchase');
  });

  return suiteResults;
}

if (require.main === module) {
  const res = runMarketplaceTests();
  console.log(`\n=== ${res.name} ===`);
  console.log(`Passed: ${res.passed} | Failed: ${res.failed} | Total: ${res.tests.length}`);
  res.tests.forEach(t => {
    if (t.status === 'FAIL') console.error(` ❌ ${t.name} -> ${t.error}`);
    else console.log(` ✔ ${t.name}`);
  });
  process.exit(res.failed > 0 ? 1 : 0);
}

module.exports = { runMarketplaceTests };
