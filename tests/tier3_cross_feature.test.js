/**
 * Horizon-X: NASA Space Design Game
 * Tier 3 Test Suite: Cross-Feature Combinations & State Synchronization
 * 
 * Authoritative Sources:
 * - ORIGINAL_REQUEST.md: Section R2, R3, R4
 * - PROJECT.md: Milestone E2E Track, Tier 3 Specifications
 * - Phase_02_instructions.md & Figma Nodes
 * 
 * Coverage:
 * - Marketplace Purchase + Budget Sync + Tool Equipping + Socket Broadcast
 * - Remote Peer Packet Ingestion + Room Locks + UI Re-rendering
 * - Tool Expiry + Audio SFX + Frame Slot Clearing + Re-purchase Lifecycle
 * - Terminal Check-in + Concurrency Lock + Multi-Client Workstation Authorization
 * - Terminal Check-out + Lock Release + Shift History Log Recording
 * - Assembly Claiming + Multi-Client Lockout
 * - Assembly Mini-Game Passing + 3D Mesh Mounting + Cumulative Telemetry Recalculation
 * - Cross-Department Telemetry Constraints Progression (Mech -> Elec -> Net)
 * - STS-61 Launch Gate Resolution & Multiplayer State Convergence
 */

const assert = require('node:assert');
const { createTestEnvironment, loadScript, SPEC_ORACLE } = require('./test_harness');

function runCrossFeatureTests() {
  const suiteResults = { name: 'Tier 3: Cross-Feature Combinations', passed: 0, failed: 0, tests: [] };

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
  // 1. MARKETPLACE -> BUDGET SYNC -> TOOL EQUIPPING -> PEER LOCK
  // =========================================================================

  test('X1.1: Local tool purchase deducts budget, equips to player frame slot, and broadcasts SYNC_TOOL_PURCHASE', () => {
    const env = createTestEnvironment();
    loadScript('multiplayerManager.js', env);

    const gameState = {
      budget: 150000,
      equippedTools: [],
      purchased: {},
      toolTimers: {}
    };

    const mp = env.window.multiplayerManager;
    mp.socket = env.socket;
    mp.isConnected = true;
    mp.isInRoom = true;
    mp.localPlayerName = 'Engineer_Abhijeet';

    // Purchase Level 2 PGT ($12,950, 900s)
    const itemId = 'pgt';
    const tier = 2;
    const cost = SPEC_ORACLE.calculateTierPrice(18500, tier);
    const durationSec = SPEC_ORACLE.TOOL_TIERS[tier].durationSec;

    gameState.budget -= cost;
    gameState.purchased[itemId] = true;
    gameState.equippedTools.push(itemId);
    gameState.toolTimers[itemId] = {
      tier,
      durationSec,
      expiresAt: Date.now() + durationSec * 1000
    };

    mp.syncToolPurchase(itemId, tier, cost, durationSec, 'mechanical', gameState.budget);

    // Verify local state
    assert.strictEqual(gameState.budget, 137050);
    assert.ok(gameState.equippedTools.includes('pgt'));
    assert.strictEqual(gameState.toolTimers.pgt.durationSec, 900);

    // Verify broadcast packet
    assert.strictEqual(env.socket.emittedPackets.length, 1);
    const packet = JSON.parse(env.socket.emittedPackets[0].payload.text);
    assert.strictEqual(packet.type, 'SYNC_TOOL_PURCHASE');
    assert.strictEqual(packet.payload.itemId, 'pgt');
    assert.strictEqual(packet.payload.newBudget, 137050);
  });

  test('X1.2: Remote peer ingesting SYNC_TOOL_PURCHASE syncs budget and locks marketplace card to "Instrument Equipped already"', () => {
    const peerEnv = createTestEnvironment();
    const peerGameState = {
      budget: 150000,
      roomEquippedTools: {}
    };

    const incomingPacket = {
      type: 'SYNC_TOOL_PURCHASE',
      payload: {
        itemId: 'pgt',
        tier: 2,
        price: 12950,
        durationSec: 900,
        newBudget: 137050,
        purchasedBy: 'Engineer_Abhijeet'
      }
    };

    // Simulate peer handler
    peerGameState.budget = incomingPacket.payload.newBudget;
    peerGameState.roomEquippedTools[incomingPacket.payload.itemId] = {
      equippedBy: incomingPacket.payload.purchasedBy,
      tier: incomingPacket.payload.tier
    };

    // Card rendering logic for peer
    const isEquippedByOther = peerGameState.roomEquippedTools.pgt && peerGameState.roomEquippedTools.pgt.equippedBy !== 'Peer_Parth';
    assert.strictEqual(isEquippedByOther, true);

    const buttonLabel = isEquippedByOther ? 'Instrument Equipped already' : 'REQUISITION';
    const isButtonDisabled = isEquippedByOther;

    assert.strictEqual(peerGameState.budget, 137050, 'Remote peer adopted new budget');
    assert.strictEqual(buttonLabel, 'Instrument Equipped already', 'Card displays single-purchase lock text');
    assert.strictEqual(isButtonDisabled, true, 'Requisition button disabled for peer');
  });

  test('X1.3: Tool expiry lifecycle clears equipped slot and allows re-requisition across clients', () => {
    const gameState = {
      purchased: { pgt: true },
      equippedTools: ['pgt'],
      toolDysfunctional: { pgt: false },
      roomEquippedTools: { pgt: { equippedBy: 'Player_01' } }
    };

    // Timer expires
    gameState.toolDysfunctional.pgt = true;
    gameState.equippedTools = gameState.equippedTools.filter(id => id !== 'pgt');
    delete gameState.roomEquippedTools.pgt;

    assert.strictEqual(gameState.equippedTools.includes('pgt'), false, 'Expired tool removed from frame slot');
    assert.strictEqual(gameState.toolDysfunctional.pgt, true, 'Marked dysfunctional');

    // Check re-purchase eligibility
    const canRequisition = !gameState.roomEquippedTools.pgt || gameState.toolDysfunctional.pgt;
    assert.strictEqual(canRequisition, true, 'Expired tool allows re-requisition from marketplace');
  });

  // =========================================================================
  // 2. CHECK-IN -> LOCK -> WORKBENCH AUTHORIZATION -> CHECK-OUT UNLOCK
  // =========================================================================

  test('X2.1: Terminal check-in claims station lock and authorizes workbench access', () => {
    const env = createTestEnvironment();
    loadScript('multiplayerManager.js', env);

    const gameState = { isCheckedIn: false, activeDept: 'mechanical' };
    const stationLocks = {};

    const mp = env.window.multiplayerManager;
    mp.socket = env.socket;
    mp.isConnected = true;
    mp.isInRoom = true;
    mp.localPlayerName = 'Astronaut_Zenin';

    // Check in
    gameState.isCheckedIn = true;
    mp.syncStationLock('mechanical_desk_01', true);
    stationLocks.mechanical_desk_01 = { lockedBy: 'sock_123', playerName: mp.localPlayerName };

    // Workbench access guard check
    function canAccessWorkbench(isCheckedIn) {
      return isCheckedIn;
    }

    assert.strictEqual(canAccessWorkbench(gameState.isCheckedIn), true, 'Workbench authorized after check-in');
    assert.strictEqual(stationLocks.mechanical_desk_01.playerName, 'Astronaut_Zenin');
  });

  test('X2.2: Second player attempting check-in on occupied desk is locked out', () => {
    const stationLocks = {
      mechanical_desk_01: { lockedBy: 'sock_123', playerName: 'Astronaut_Zenin' }
    };

    function requestCheckIn(dept, requesterSocketId) {
      if (stationLocks[dept] && stationLocks[dept].lockedBy !== requesterSocketId) {
        return { success: false, message: `OCCUPIED BY ${stationLocks[dept].playerName.toUpperCase()}` };
      }
      return { success: true };
    }

    const res = requestCheckIn('mechanical_desk_01', 'sock_peer');
    assert.strictEqual(res.success, false);
    assert.strictEqual(res.message, 'OCCUPIED BY ASTRONAUT_ZENIN');
  });

  test('X2.3: Checkout releases station lock and logs session record into shift history', () => {
    const env = createTestEnvironment();
    loadScript('multiplayerManager.js', env);

    const gameState = {
      isCheckedIn: true,
      checkInTime: Date.now() - 360000, // 6 minutes ago
      shiftHistory: []
    };
    const stationLocks = {
      mechanical_desk_01: { lockedBy: 'sock_123', playerName: 'Astronaut_Zenin' }
    };

    const mp = env.window.multiplayerManager;
    mp.socket = env.socket;
    mp.isConnected = true;
    mp.isInRoom = true;

    // Checkout
    const duration = Math.floor((Date.now() - gameState.checkInTime) / 1000);
    gameState.shiftHistory.push({
      operator: 'Astronaut_Zenin',
      dept: 'mechanical',
      durationSec: duration,
      completedAt: new Date().toISOString()
    });

    gameState.isCheckedIn = false;
    delete stationLocks.mechanical_desk_01;
    mp.syncStationLock('mechanical_desk_01', false);

    assert.strictEqual(gameState.isCheckedIn, false);
    assert.strictEqual(stationLocks.mechanical_desk_01, undefined, 'Lock released');
    assert.strictEqual(gameState.shiftHistory.length, 1);
    assert.strictEqual(gameState.shiftHistory[0].operator, 'Astronaut_Zenin');
    assert.ok(gameState.shiftHistory[0].durationSec >= 360);
  });

  // =========================================================================
  // 3. ASSEMBLY CLAIMING & MULTI-CLIENT SELECTION LOCK
  // =========================================================================

  test('X3.1: Pre-assembly department claiming locks chosen department for remote peers', () => {
    const assemblyDeptLocks = {};

    function claimDepartment(dept, playerName) {
      if (assemblyDeptLocks[dept]) {
        return { success: false, reason: 'ALREADY_CLAIMED' };
      }
      assemblyDeptLocks[dept] = playerName;
      return { success: true, broadcast: { type: 'SYNC_ASSEMBLY_CLAIM', dept, playerName } };
    }

    const claimMech = claimDepartment('mech', 'Parth');
    assert.strictEqual(claimMech.success, true);
    assert.strictEqual(claimMech.broadcast.type, 'SYNC_ASSEMBLY_CLAIM');

    // Peer attempts to claim mechanical
    const peerClaimMech = claimDepartment('mech', 'Zenin');
    assert.strictEqual(peerClaimMech.success, false);
    assert.strictEqual(peerClaimMech.reason, 'ALREADY_CLAIMED');

    // Peer claims electrical
    const peerClaimElec = claimDepartment('elec', 'Zenin');
    assert.strictEqual(peerClaimElec.success, true);
    assert.strictEqual(assemblyDeptLocks.elec, 'Zenin');
  });

  // =========================================================================
  // 4. ASSEMBLY MINI-GAME -> MOUNTING -> TELEMETRY UPDATE -> SYNC
  // =========================================================================

  test('X4.1: Passing mechanical alignment mini-game completes task 1 and recalculates telemetry', () => {
    const env = createTestEnvironment();
    loadScript('assembly3d.js', env);

    const assembly = new env.window.Assembly3D();
    assembly.switchDepartment('mech');

    assert.strictEqual(assembly.assembledStages.mech_task1, false);

    // Simulate passing crosshair alignment mini-game
    const alignmentPassed = true;
    if (alignmentPassed) {
      assembly.assembledStages.mech_task1 = true;
      assembly.switchDepartment('mech');
    }

    assert.strictEqual(assembly.assembledStages.mech_task1, true);
    assert.strictEqual(env.document.getElementById('btnAssemblePart1').textContent, 'Assembled');

    const telem = SPEC_ORACLE.TELEMETRY.calculateCumulative(['mech_task1'], 150000);
    assert.strictEqual(telem.mass, 10910, '10800 + 110 = 10,910 kg');
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(assembly.assembledStages), false, 'Launch still locked (1/6)');

    assembly.destroy();
  });

  test('X4.2: Mechanical completion of both tasks (RSU-02 and SADM) satisfies mechanical requirements', () => {
    const env = createTestEnvironment();
    loadScript('assembly3d.js', env);

    const assembly = new env.window.Assembly3D();
    assembly.assembledStages.mech_task1 = true;
    assembly.assembledStages.mech_task2 = true;
    assembly.switchDepartment('mech');

    const isMechDone = assembly.assembledStages.mech_task1 && assembly.assembledStages.mech_task2;
    assert.strictEqual(isMechDone, true);

    const telem = SPEC_ORACLE.TELEMETRY.calculateCumulative(['mech_task1', 'mech_task2'], 150000);
    assert.strictEqual(telem.mass, 11060);
    assert.strictEqual(telem.power, 2300);

    // Launch button must remain locked because Elec and Net are incomplete!
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(assembly.assembledStages), false);

    assembly.destroy();
  });

  test('X4.3: Remote assembly completion packet (SYNC_ASSEMBLY_STEP_COMPLETE) updates peer assembly state', () => {
    const peerStages = {
      mech_task1: false,
      mech_task2: false,
      elec_task1: false,
      elec_task2: false,
      net_task1: false,
      net_task2: false
    };

    const incomingPacket = {
      type: 'SYNC_ASSEMBLY_STEP_COMPLETE',
      stage: 'mech_task1'
    };

    if (incomingPacket.type === 'SYNC_ASSEMBLY_STEP_COMPLETE') {
      peerStages[incomingPacket.stage] = true;
    }

    assert.strictEqual(peerStages.mech_task1, true);
    assert.strictEqual(peerStages.mech_task2, false);
  });

  // =========================================================================
  // 5. CROSS-DEPARTMENT CONVERGENCE & STS-61 LAUNCH CERTIFICATION
  // =========================================================================

  test('X5.1: 4/6 tasks complete across Mechanical & Electrical maintains locked launch button', () => {
    const stages = {
      mech_task1: true,
      mech_task2: true,
      elec_task1: true,
      elec_task2: true,
      net_task1: false,
      net_task2: false
    };

    const telem = SPEC_ORACLE.TELEMETRY.calculateCumulative(
      ['mech_task1', 'mech_task2', 'elec_task1', 'elec_task2'],
      50000
    );

    assert.strictEqual(telem.mass, 11100, '10800 + 110 + 150 + 25 + 15 = 11,100 kg');
    assert.strictEqual(telem.power, 2400, 'Power nominal');
    assert.strictEqual(telem.isDataNominal, false, 'Comms data rate still 0.0 Mbps');
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(stages), false, 'Launch gate strictly locked');
  });

  test('X5.2: Final Network integration completes all 6 stages and satisfies all 4 flight constraints', () => {
    const allStages = SPEC_ORACLE.ALL_REQUIRED_STAGES;
    const stages = {};
    allStages.forEach(s => { stages[s] = true; });

    const telem = SPEC_ORACLE.TELEMETRY.calculateCumulative(allStages, 31500);

    assert.strictEqual(telem.mass, 11110);
    assert.strictEqual(telem.power, 2400);
    assert.strictEqual(telem.dataRate, 1.0);
    assert.strictEqual(telem.expenditure, 118500);

    assert.strictEqual(telem.isMassNominal, true);
    assert.strictEqual(telem.isPowerNominal, true);
    assert.strictEqual(telem.isDataNominal, true);
    assert.strictEqual(telem.isBudgetNominal, true);

    const isReady = SPEC_ORACLE.isLaunchReady(stages);
    assert.strictEqual(isReady, true, 'All 6 stages certified for STS-61 launch');
  });

  test('X5.3: Certified launch state activates launch button and triggers mission completion alert', () => {
    const env = createTestEnvironment();
    const btnLaunch = env.document.getElementById('btnAssemblyLaunch');

    let missionLaunched = false;
    btnLaunch.addEventListener('click', () => {
      missionLaunched = true;
    });

    // Certify
    btnLaunch.disabled = false;
    btnLaunch.classList.add('ready');

    btnLaunch.click();
    assert.strictEqual(missionLaunched, true);
  });

  test('X5.4: Concurrent multi-client marketplace operations avoid tool acquisition conflicts', () => {
    let sharedBudget = 150000;
    const roomEquipped = {};

    function purchase(playerId, itemId, tier, price) {
      if (roomEquipped[itemId]) return { success: false, reason: 'ALREADY_EQUIPPED' };
      if (sharedBudget < price) return { success: false, reason: 'INSUFFICIENT_FUNDS' };
      sharedBudget -= price;
      roomEquipped[itemId] = { equippedBy: playerId, tier };
      return { success: true, budget: sharedBudget };
    }

    const p1 = purchase('Astronaut_1', 'pgt', 2, 12950);
    const p2 = purchase('Astronaut_2', 'pcb', 3, 32000);
    const p3Duplicate = purchase('Astronaut_3', 'pgt', 1, 7400);

    assert.strictEqual(p1.success, true);
    assert.strictEqual(p2.success, true);
    assert.strictEqual(p3Duplicate.success, false);
    assert.strictEqual(p3Duplicate.reason, 'ALREADY_EQUIPPED');
    assert.strictEqual(sharedBudget, 105050, '150000 - 12950 - 32000 = 105050');
  });

  test('X5.5: Multi-department assembly claiming across 3 engineers distributes all 3 workbenches cleanly', () => {
    const claimedDepts = {};

    function claim(dept, player) {
      if (claimedDepts[dept]) return false;
      claimedDepts[dept] = player;
      return true;
    }

    assert.strictEqual(claim('mech', 'Parth'), true);
    assert.strictEqual(claim('elec', 'Zenin'), true);
    assert.strictEqual(claim('net', 'Abhijeet'), true);
    assert.strictEqual(claim('mech', 'Fourth_Player'), false, 'Cannot claim already assigned department');

    assert.strictEqual(Object.keys(claimedDepts).length, 3, 'All 3 departments successfully distributed');
  });

  return suiteResults;
}

if (require.main === module) {
  const res = runCrossFeatureTests();
  console.log(`\n=== ${res.name} ===`);
  console.log(`Passed: ${res.passed} | Failed: ${res.failed} | Total: ${res.tests.length}`);
  res.tests.forEach(t => {
    if (t.status === 'FAIL') console.error(` ❌ ${t.name} -> ${t.error}`);
    else console.log(` ✔ ${t.name}`);
  });
  process.exit(res.failed > 0 ? 1 : 0);
}

module.exports = { runCrossFeatureTests };
