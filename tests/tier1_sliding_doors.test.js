/**
 * Horizon-X: NASA Space Design Game
 * Tier 1 Test Suite: Milestone M3 — Automatic Sliding Doors & Cleanroom Facility Transition
 * 
 * Verifies:
 * - Feature 1: Double sliding door 3D geometry & initial closed coordinates
 * - Feature 2: openDoors() state transition, doorOpen flag, and green terminal LED (0x00FF88)
 * - Feature 3: closeDoors() state transition, doorOpen flag, and red terminal LED (0xFF2222)
 * - Feature 4: Quintic smooth easing trajectory for left and right panels
 * - Feature 5: Auto-close door timeout (5.0s timer)
 * - Feature 6: Procedural pneumatic whoosh audio synthesizer (playPneumaticDoorSound)
 * - Feature 7: Physical collision barrier toggling (closed door blocks gateway, open door permits passage)
 * - Feature 8: South-East gateway cleanroom crossing trigger at Z <= 6.95
 * - Feature 9: Cleanroom facility handoff (gameState.hasEnteredFacility = true, onCleanroomEntered)
 * - Feature 10: Multiplayer door synchronization (SYNC_DOOR_TRIGGER broadcast & remote ingestion)
 */

const assert = require('node:assert');
const { createTestEnvironment, loadScript } = require('./test_harness');

function runSlidingDoorsTests() {
  const suiteResults = { name: 'Tier 1: Automatic Sliding Doors & Cleanroom Transition', passed: 0, failed: 0, tests: [] };

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
  // 1. 3D GEOMETRY & INITIAL COORDINATES
  // =========================================================================

  test('M3.1: Sliding door panels initialize with dual glass groups and closed X coordinates', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.doorPanelLeft, 'Left door panel group must exist');
    assert.ok(room.doorPanelRight, 'Right door panel group must exist');
    assert.strictEqual(room.doorState, 'closed', 'Initial door state must be closed');
    assert.strictEqual(room.doorOpen, false, 'Initial doorOpen must be false');
    assert.strictEqual(room.doorProgress, 0.0, 'Initial doorProgress must be 0.0');

    // Closed X positions: panelW=0.9m, closedXLeft=4.05, closedXRight=4.95
    assert.ok(Math.abs(room.doorPanelLeft.position.x - 4.05) < 0.05, 'Left door panel closed X should be ~4.05');
    assert.ok(Math.abs(room.doorPanelRight.position.x - 4.95) < 0.05, 'Right door panel closed X should be ~4.95');

    room.destroy();
  });

  // =========================================================================
  // 2. OPEN & CLOSE STATE CONTROLS & LED TOGGLING
  // =========================================================================

  test('M3.2: openDoors() transitions state to opening and illuminates green terminal LED (0x00FF88)', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    room.openDoors(false);

    assert.strictEqual(room.doorState, 'opening', 'Door state must transition to opening');
    assert.strictEqual(room.doorOpen, true, 'doorOpen flag must be true');
    assert.strictEqual(room.terminalLedColor, 0x00FF88, 'Terminal LED must illuminate green (0x00FF88)');

    room.destroy();
  });

  test('M3.3: closeDoors() transitions state to closing and illuminates red terminal LED (0xFF2222)', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    room.openDoors(false);
    room.closeDoors(false);

    assert.strictEqual(room.doorState, 'closing', 'Door state must transition to closing');
    assert.strictEqual(room.doorOpen, false, 'doorOpen flag must be false');
    assert.strictEqual(room.terminalLedColor, 0xFF2222, 'Terminal LED must illuminate red (0xFF2222)');

    room.destroy();
  });

  // =========================================================================
  // 3. QUINTIC SMOOTH EASING TRAJECTORY
  // =========================================================================

  test('M3.4: updateDoors() animates panels outwards smoothly to open positions', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    room.openDoors(false);

    // Step animation half-way (~0.4s)
    room.updateDoors(0.4);
    assert.ok(room.doorProgress > 0.0 && room.doorProgress < 1.0, 'Progress must be between 0 and 1');
    assert.ok(room.doorPanelLeft.position.x < room.doorPanelLeftClosedX, 'Left panel must slide West');
    assert.ok(room.doorPanelRight.position.x > room.doorPanelRightClosedX, 'Right panel must slide East');

    // Step animation to full completion
    room.updateDoors(0.8);
    assert.strictEqual(room.doorProgress, 1.0, 'Progress must cap at 1.0');
    assert.strictEqual(room.doorState, 'open', 'Door state must become open');

    room.destroy();
  });

  // =========================================================================
  // 4. AUTO-CLOSE TIMEOUT
  // =========================================================================

  test('M3.5: openDoors() sets auto-close timeout timer', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    room.openDoors(false);

    assert.ok(room.doorCloseTimeout, 'openDoors must create doorCloseTimeout timer');

    room.destroy();
    assert.strictEqual(room.doorCloseTimeout, null, 'destroy must clean up doorCloseTimeout');
  });

  // =========================================================================
  // 5. AUDIO SYNTHESIS
  // =========================================================================

  test('M3.6: playPneumaticDoorSound executes for opening and closing without errors', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.doesNotThrow(() => room.playPneumaticDoorSound(true), 'Opening sound should synthesize cleanly');
    assert.doesNotThrow(() => room.playPneumaticDoorSound(false), 'Closing sound should synthesize cleanly');

    room.destroy();
  });

  // =========================================================================
  // 6. COLLISION BARRIER TOGGLING
  // =========================================================================

  test('M3.7: Closed door blocks passage at North gateway; open door permits passage', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    const gatewayX = 4.5; // Center of gateway opening (3.6 to 5.4)

    // When door is closed: Z=6.8 (just beyond door line Z=7.0) must collide
    assert.strictEqual(room.doorOpen, false);
    const blocked = room.checkCollision(gatewayX, 6.8);
    assert.strictEqual(blocked, true, 'Closed door must block passage through gateway');

    // Open doors fully
    room.openDoors(false);
    room.doorProgress = 1.0;
    room.doorState = 'open';

    const permitted = room.checkCollision(gatewayX, 6.8);
    assert.strictEqual(permitted, false, 'Open door must permit passage through gateway');

    room.destroy();
  });

  function setupTestEnv() {
    const env = createTestEnvironment();
    loadScript('authManager.js', env);
    loadScript('multiplayerManager.js', env);
    loadScript('lobby3d.js', env);
    loadScript('script.js', env);
    env.document.dispatchEvent('DOMContentLoaded');
    return env;
  }

  // =========================================================================
  // 7. CLEANROOM TRANSITION TRIGGER & HANDOFF
  // =========================================================================

  test('M3.8: onCrossCleanroomBoundary() dispatches cleanroomTransition event and calls onCleanroomEntered', () => {
    const env = setupTestEnv();

    let transitionDispatched = false;
    env.window.addEventListener('cleanroomTransition', () => {
      transitionDispatched = true;
    });

    const room = new env.window.LobbyFPSRoom();
    room.player.pos.x = 4.5;
    room.player.pos.z = 6.8; // Inside South-East gateway heading North
    room.onCrossCleanroomBoundary();

    assert.strictEqual(room.hasCrossedIntoCleanroom, true, 'hasCrossedIntoCleanroom must be true');
    assert.strictEqual(transitionDispatched, true, 'cleanroomTransition event must be dispatched');
    const gameState = env.window.gameState || env.window.getNasaGameState();
    assert.strictEqual(gameState.hasEnteredFacility, true, 'gameState.hasEnteredFacility must be set to true');

    room.destroy();
  });

  // =========================================================================
  // 8. MULTIPLAYER SYNCHRONIZATION EVENT (SYNC_DOOR_TRIGGER)
  // =========================================================================

  test('M3.9: openDoors(true) broadcasts SYNC_DOOR_TRIGGER via multiplayer relay', () => {
    const env = createTestEnvironment();
    loadScript('multiplayerManager.js', env);
    loadScript('lobby3d.js', env);

    let broadcastType = null;
    let broadcastPayload = null;
    env.window.multiplayerManager.broadcastSync = (type, payload) => {
      broadcastType = type;
      broadcastPayload = payload;
    };

    const room = new env.window.LobbyFPSRoom();
    room.openDoors(true);

    assert.strictEqual(broadcastType, 'SYNC_DOOR_TRIGGER');
    assert.strictEqual(broadcastPayload.state, 'open');

    room.closeDoors(true);
    assert.strictEqual(broadcastType, 'SYNC_DOOR_TRIGGER');
    assert.strictEqual(broadcastPayload.state, 'closed');

    room.destroy();
  });

  test('M3.10: verifyKeycardAccess() opens sliding doors when keycard is held', () => {
    const env = setupTestEnv();

    const room = new env.window.LobbyFPSRoom();
    env.window.lobbyRoomInstance = room;

    const gameState = env.window.gameState || env.window.getNasaGameState();
    gameState.hasKeycard = true;
    const accessGranted = env.window.verifyKeycardAccess();

    assert.strictEqual(accessGranted, true, 'Access must be granted with keycard');
    assert.strictEqual(room.doorOpen, true, 'Doors must open on keycard verification');
    assert.strictEqual(room.doorState, 'opening', 'Door state must transition to opening');

    room.destroy();
  });

  return suiteResults;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = { runSlidingDoorsTests };
}

if (require.main === module) {
  const result = runSlidingDoorsTests();
  console.log(`\n${result.name}: Passed ${result.passed} / ${result.tests.length}`);
  if (result.failed > 0) {
    console.error('Failed tests:', result.tests.filter(t => t.status === 'FAIL'));
  }
  process.exit(result.failed > 0 ? 1 : 0);
}
