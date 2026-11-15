/**
 * Horizon-X: NASA Space Design Game
 * Tier 1 Test Suite: Milestone M2 — Registration Desk & Keycard Auth System
 * 
 * Verifies:
 * - Feature 1: Procedural Keycard Graphic `assets/images/key-card.png` (dimensions & format)
 * - Feature 2: Registration Modal DOM Markup (`#modalLobbyRegistration`, form, preview)
 * - Feature 3: Player Keycard Inventory Badge (`#hudKeycardBadge` in `#playerInstrumentsFrame`)
 * - Feature 4: Security Terminal HUD Banner (`#hudSecurityBanner`)
 * - Feature 5: East Registration Desk Interactable (`monitor_lobby` coords & radius <= 2.2m)
 * - Feature 6: Security Scanner Interactable (`keycard_scanner` coords & radius <= 2.2m)
 * - Feature 7: Modal Open / Close Lifecycle & Callsign Prefill
 * - Feature 8: Keycard Authorization Workflow & `gameState` Transitions (`hasKeycard`, `keycardRegistered`)
 * - Feature 9: Keycard Scanner Validation (Access Granted vs. Access Denied)
 * - Feature 10: Terminal LED State Toggling (`0x00FF88` vs. `0xFF2222`)
 * - Feature 11: Web Audio Procedural SFX Synthesizers (`playKeycardGrantedSound`, `playKeycardDeniedSound`)
 * - Feature 12: Multiplayer Synchronization Event (`SYNC_KEYCARD_REGISTRATION`)
 * - Feature 13: AGENTS.md Compliance: Window Exports & Cache Version Bump `?v=5.7`
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createTestEnvironment, loadScript } = require('./test_harness');

function runKeycardAuthTests() {
  const suiteResults = { name: 'Tier 1: Registration Desk & Keycard Auth System', passed: 0, failed: 0, tests: [] };

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
  // 1. PROCEDURAL KEYCARD GRAPHIC VERIFICATION
  // =========================================================================

  test('M2.1: assets/images/key-card.png exists on disk with valid PNG header and dimensions', () => {
    const keycardPath = path.resolve(__dirname, '../assets/images/key-card.png');
    assert.ok(fs.existsSync(keycardPath), 'key-card.png must exist on disk at assets/images/key-card.png');

    const fileBuffer = fs.readFileSync(keycardPath);
    assert.ok(fileBuffer.length > 500, `key-card.png size must be substantial, got ${fileBuffer.length} bytes`);

    // Verify 8-byte PNG signature: 89 50 4E 47 0D 0A 1A 0A
    const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
    assert.ok(fileBuffer.subarray(0, 8).equals(pngSignature), 'Must have valid PNG signature header');

    // Extract IHDR width and height (bytes 16-24)
    const width = fileBuffer.readUInt32BE(16);
    const height = fileBuffer.readUInt32BE(20);
    assert.strictEqual(width, 512, 'Keycard width must be 512px');
    assert.strictEqual(height, 324, 'Keycard height must be 324px');
  });

  // =========================================================================
  // 2. REGISTRATION MODAL DOM & MARKUP VERIFICATION
  // =========================================================================

  test('M2.2: #modalLobbyRegistration markup exists in index.html with accessibility attributes', () => {
    const env = createTestEnvironment();
    const modal = env.document.getElementById('modalLobbyRegistration');
    assert.ok(modal, '#modalLobbyRegistration must exist in index.html DOM');
    assert.ok(modal.classList.contains('facility-modal-backdrop'), 'Must have facility-modal-backdrop class');
    assert.ok(modal.classList.contains('hidden'), 'Must initialize in hidden state');
    assert.strictEqual(modal.attributes['aria-hidden'], 'true', 'aria-hidden must be true initially');
  });

  test('M2.3: #formLobbyRegistration contains callsign input, department select, and authorization button', () => {
    const env = createTestEnvironment();
    const form = env.document.getElementById('formLobbyRegistration');
    assert.ok(form, '#formLobbyRegistration must exist');

    const callsignInput = env.document.getElementById('regOperatorCallsign');
    assert.ok(callsignInput, '#regOperatorCallsign input element must exist');

    const deptSelect = env.document.getElementById('regDepartmentSelect');
    assert.ok(deptSelect, '#regDepartmentSelect select dropdown must exist');

    const clearanceBox = env.document.getElementById('regClearanceLevel');
    assert.ok(clearanceBox, '#regClearanceLevel display element must exist');

    const authBtn = env.document.getElementById('btnAuthorizeIssueKeycard');
    assert.ok(authBtn, '#btnAuthorizeIssueKeycard submit button must exist');

    const closeBtn = env.document.getElementById('btnCloseLobbyRegistrationModal');
    assert.ok(closeBtn, '#btnCloseLobbyRegistrationModal close button must exist');
  });

  test('M2.4: #regKeycardPreview displays live credential preview and overlay data fields', () => {
    const env = createTestEnvironment();
    const preview = env.document.getElementById('regKeycardPreview');
    assert.ok(preview, '#regKeycardPreview must exist inside modal');

    const previewCallsign = env.document.getElementById('previewCallsign');
    assert.ok(previewCallsign, '#previewCallsign overlay readout must exist');

    const previewDept = env.document.getElementById('previewDept');
    assert.ok(previewDept, '#previewDept overlay readout must exist');
  });

  // =========================================================================
  // 3. HUD BADGE & BANNER CONTAINERS
  // =========================================================================

  test('M2.5: #hudKeycardBadge exists in #playerInstrumentsFrame and initializes hidden', () => {
    const env = createTestEnvironment();
    const frame = env.document.getElementById('playerInstrumentsFrame');
    assert.ok(frame, '#playerInstrumentsFrame must exist in HUD');

    const badge = env.document.getElementById('hudKeycardBadge');
    assert.ok(badge, '#hudKeycardBadge must exist in DOM');
    assert.ok(badge.classList.contains('hidden'), 'Keycard badge must initialize hidden before claim');

    const badgeStatus = env.document.getElementById('hudKeycardBadgeStatus');
    assert.ok(badgeStatus, '#hudKeycardBadgeStatus must exist');
  });

  test('M2.6: #hudSecurityBanner exists in HUD and initializes hidden', () => {
    const env = createTestEnvironment();
    const banner = env.document.getElementById('hudSecurityBanner');
    assert.ok(banner, '#hudSecurityBanner must exist in DOM');
    assert.ok(banner.classList.contains('hidden'), 'Security banner must initialize hidden');
  });

  // =========================================================================
  // 4. LOBBY 3D INTERACTION TARGETS & SPECIFICATION COMPLIANCE
  // =========================================================================

  test('M2.7: LobbyFPSRoom interactable monitor_lobby is configured at X~4.85, Z~12.0 with radius <= 2.2m', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.interactables.monitor_lobby, 'monitor_lobby interactable must be registered');

    const target = room.interactables.monitor_lobby;
    assert.strictEqual(target.x, 4.85, 'monitor_lobby X coordinate must be 4.85');
    assert.strictEqual(target.z, 12.0, 'monitor_lobby Z coordinate must be 12.0');
    assert.ok(target.maxDist <= 2.2, `Interaction radius must be <= 2.2m per M2 spec, got ${target.maxDist}`);
    assert.strictEqual(target.label, '[E] Register at Reception Terminal');

    room.destroy();
  });

  test('M2.8: LobbyFPSRoom interactable keycard_scanner is configured at X~3.3, Z~7.3 with radius <= 2.2m', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.interactables.keycard_scanner, 'keycard_scanner interactable must be registered');

    const target = room.interactables.keycard_scanner;
    assert.strictEqual(target.x, 3.3, 'keycard_scanner X coordinate must be 3.3');
    assert.strictEqual(target.z, 7.3, 'keycard_scanner Z coordinate must be 7.3');
    assert.ok(target.maxDist <= 2.2, `Interaction radius must be <= 2.2m per M2 spec, got ${target.maxDist}`);
    assert.ok(target.label.includes('Scan Keycard to Access'), 'Label must prompt keycard scan');

    room.destroy();
  });

  // Helper to bootstrap test environment with DOMContentLoaded fired
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
  // 5. REGISTRATION MODAL LIFECYCLE & CALLSIGN PREFILL
  // =========================================================================

  test('M2.9: openLobbyRegistrationModal unhides modal and prefills operator callsign', () => {
    const env = setupTestEnv();

    // Set mock callsign
    if (!env.window.authManager) {
      env.window.authManager = { operatorName: 'Commander_Apollo' };
    } else {
      env.window.authManager.operatorName = 'Commander_Apollo';
    }

    env.window.openLobbyRegistrationModal();

    const modal = env.document.getElementById('modalLobbyRegistration');
    assert.strictEqual(modal.classList.contains('hidden'), false, 'Modal hidden class must be removed');
    assert.strictEqual(modal.attributes['aria-hidden'], 'false');

    const callsignInput = env.document.getElementById('regOperatorCallsign');
    assert.strictEqual(callsignInput.value, 'Commander_Apollo', 'Callsign must be prefilled from authManager');
  });

  test('M2.10: closeLobbyRegistrationModal hides modal and restores aria-hidden attribute', () => {
    const env = setupTestEnv();

    env.window.openLobbyRegistrationModal();
    env.window.closeLobbyRegistrationModal();

    const modal = env.document.getElementById('modalLobbyRegistration');
    assert.strictEqual(modal.classList.contains('hidden'), true, 'Modal hidden class must be added');
    assert.strictEqual(modal.attributes['aria-hidden'], 'true');
  });

  // =========================================================================
  // 6. KEYCARD AUTHORIZATION & STATE TRANSITIONS
  // =========================================================================

  test('M2.11: authorizeAndIssueKeycard sets gameState.hasKeycard and keycardRegistered to true', () => {
    const env = setupTestEnv();

    const gameState = env.window.gameState || env.window.getNasaGameState();
    assert.strictEqual(gameState.hasKeycard, false, 'Initial hasKeycard must be false');
    assert.strictEqual(gameState.keycardRegistered, false, 'Initial keycardRegistered must be false');

    env.window.authorizeAndIssueKeycard({
      callsign: 'Astronaut_Nova',
      department: 'mechanical'
    });

    assert.strictEqual(gameState.hasKeycard, true, 'gameState.hasKeycard must be true after issuance');
    assert.strictEqual(gameState.keycardRegistered, true, 'gameState.keycardRegistered must be true after issuance');
  });

  test('M2.12: authorizeAndIssueKeycard records registration metadata with timestamp and clearance', () => {
    const env = setupTestEnv();

    const data = env.window.authorizeAndIssueKeycard({
      callsign: 'Specialist_Orion',
      department: 'electronic',
      clearance: 'STS-61 Mission Ground Prep'
    });

    assert.ok(data, 'Registration data must be returned');
    assert.strictEqual(data.callsign, 'Specialist_Orion');
    assert.strictEqual(data.department, 'electronic');
    assert.strictEqual(data.clearance, 'STS-61 Mission Ground Prep');
    assert.ok(typeof data.issuedAt === 'number' && data.issuedAt > 0, 'Timestamp must be recorded');

    const gameState = env.window.gameState || env.window.getNasaGameState();
    assert.deepStrictEqual(gameState.keycardRegistrationData, data, 'Registration data must match in gameState');
  });

  test('M2.13: authorizeAndIssueKeycard displays collected keycard badge in #playerInstrumentsFrame', () => {
    const env = setupTestEnv();

    const badge = env.document.getElementById('hudKeycardBadge');
    assert.strictEqual(badge.classList.contains('hidden'), true);

    env.window.authorizeAndIssueKeycard({ callsign: 'Flight_Tech_01' });

    assert.strictEqual(badge.classList.contains('hidden'), false, 'Keycard badge must become visible');
    assert.strictEqual(badge.style.display, 'flex');
  });

  test('M2.14: authorizeAndIssueKeycard displays HUD notification banner with exact required text', () => {
    const env = setupTestEnv();

    env.window.authorizeAndIssueKeycard();

    const banner = env.document.getElementById('hudSecurityBanner');
    const calmAlertMsg = env.document.getElementById('calmAlertMsg');

    const expectedText = 'FACILITY ACCESS KEYCARD ISSUED - PROCEED TO SOUTH-EAST AIRLOCK GATEWAY';
    const foundText = (banner && banner.textContent.trim()) || (calmAlertMsg && calmAlertMsg.textContent.trim());
    assert.ok(foundText.includes(expectedText), `Notification banner must contain exact prompt: ${expectedText}`);
  });

  test('M2.15: authorizeAndIssueKeycard broadcasts SYNC_KEYCARD_REGISTRATION packet to multiplayerManager', () => {
    const env = setupTestEnv();

    let broadcastedPacket = null;
    if (env.window.multiplayerManager) {
      env.window.multiplayerManager.broadcastSync = (type, payload) => {
        broadcastedPacket = { type, payload };
      };
    }

    env.window.authorizeAndIssueKeycard({ callsign: 'Pilot_Cassini', department: 'network' });

    assert.ok(broadcastedPacket, 'Must broadcast synchronization packet');
    assert.strictEqual(broadcastedPacket.type, 'SYNC_KEYCARD_REGISTRATION');
    assert.strictEqual(broadcastedPacket.payload.callsign, 'Pilot_Cassini');
    assert.strictEqual(broadcastedPacket.payload.department, 'network');
    assert.strictEqual(broadcastedPacket.payload.hasKeycard, true);
  });

  // =========================================================================
  // 7. SECURITY SCANNER VALIDATION: ACCESS GRANTED VS DENIED
  // =========================================================================

  test('M2.16: verifyKeycardAccess returns false when gameState.hasKeycard is false', () => {
    const env = setupTestEnv();

    const gameState = env.window.gameState || env.window.getNasaGameState();
    gameState.hasKeycard = false;

    const result = env.window.verifyKeycardAccess();
    assert.strictEqual(result, false, 'Access must be denied when keycard is not possessed');
  });

  test('M2.17: When keycard is missing, verifyKeycardAccess sets terminal LED to red (0xFF2222)', () => {
    const env = setupTestEnv();

    const room = new env.window.LobbyFPSRoom();
    env.window.facilityRoomInstance = room;

    const gameState = env.window.gameState || env.window.getNasaGameState();
    gameState.hasKeycard = false;

    env.window.verifyKeycardAccess();

    assert.strictEqual(room.terminalLedColor, 0xFF2222, 'Terminal LED must turn red (0xFF2222) on access denied');
    room.destroy();
  });

  test('M2.18: When keycard is missing, verifyKeycardAccess displays exact denied banner text', () => {
    const env = setupTestEnv();

    const gameState = env.window.gameState || env.window.getNasaGameState();
    gameState.hasKeycard = false;

    env.window.verifyKeycardAccess();

    const banner = env.document.getElementById('hudSecurityBanner');
    const calmAlertMsg = env.document.getElementById('calmAlertMsg');

    const expectedDenied = 'ACCESS DENIED - KEYCARD REQUIRED. PLEASE REGISTER AT RECEPTION DESK';
    const foundText = (banner && banner.textContent.trim()) || (calmAlertMsg && calmAlertMsg.textContent.trim());
    assert.ok(foundText.includes(expectedDenied), `Banner must display: ${expectedDenied}`);
  });

  test('M2.19: verifyKeycardAccess returns true when gameState.hasKeycard is true', () => {
    const env = setupTestEnv();

    const gameState = env.window.gameState || env.window.getNasaGameState();
    gameState.hasKeycard = true;

    const result = env.window.verifyKeycardAccess();
    assert.strictEqual(result, true, 'Access must be granted when keycard is held');
  });

  test('M2.20: When keycard is present, verifyKeycardAccess turns terminal LED to green (0x00FF88)', () => {
    const env = setupTestEnv();

    const room = new env.window.LobbyFPSRoom();
    env.window.facilityRoomInstance = room;

    const gameState = env.window.gameState || env.window.getNasaGameState();
    gameState.hasKeycard = true;

    env.window.verifyKeycardAccess();

    assert.strictEqual(room.terminalLedColor, 0x00FF88, 'Terminal LED must turn green (0x00FF88) on access granted');
    room.destroy();
  });

  test('M2.21: When keycard is present, verifyKeycardAccess displays exact granted banner text', () => {
    const env = setupTestEnv();

    const gameState = env.window.gameState || env.window.getNasaGameState();
    gameState.hasKeycard = true;

    env.window.verifyKeycardAccess();

    const banner = env.document.getElementById('hudSecurityBanner');
    const calmAlertMsg = env.document.getElementById('calmAlertMsg');

    const expectedGranted = 'ACCESS GRANTED - AIRLOCK DOORS OPENING';
    const foundText = (banner && banner.textContent.trim()) || (calmAlertMsg && calmAlertMsg.textContent.trim());
    assert.ok(foundText.includes(expectedGranted), `Banner must display: ${expectedGranted}`);
  });

  test('M2.22: When keycard is present, verifyKeycardAccess calls openDoors on active lobby room', () => {
    const env = setupTestEnv();

    const room = new env.window.LobbyFPSRoom();
    env.window.facilityRoomInstance = room;

    let openDoorsCalled = false;
    room.openDoors = () => { openDoorsCalled = true; };

    const gameState = env.window.gameState || env.window.getNasaGameState();
    gameState.hasKeycard = true;

    env.window.verifyKeycardAccess();

    assert.strictEqual(openDoorsCalled, true, 'openDoors must be invoked upon valid keycard authentication');
    room.destroy();
  });

  // =========================================================================
  // 8. AUDIO SYNTHESIZERS & LED CONTROLS
  // =========================================================================

  test('M2.23: playKeycardGrantedSound and playKeycardDeniedSound execute safely without throwing', () => {
    const env = setupTestEnv();

    assert.strictEqual(typeof env.window.playKeycardGrantedSound, 'function');
    assert.strictEqual(typeof env.window.playKeycardDeniedSound, 'function');

    // Test executions in mock audio context
    assert.doesNotThrow(() => {
      env.window.playKeycardGrantedSound();
    }, 'playKeycardGrantedSound must execute safely');

    assert.doesNotThrow(() => {
      env.window.playKeycardDeniedSound();
    }, 'playKeycardDeniedSound must execute safely');
  });

  test('M2.24: LobbyFPSRoom.setTerminalLedColor updates material color and emissive hex values', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    room.setTerminalLedColor(0x00FF88);
    assert.strictEqual(room.terminalLedColor, 0x00FF88);

    room.setTerminalLedColor(0xFF2222);
    assert.strictEqual(room.terminalLedColor, 0xFF2222);
    room.destroy();
  });

  // =========================================================================
  // 9. AGENTS.MD INVARIANTS: CACHE BUSTER & WINDOW EXPORTS
  // =========================================================================

  test('M2.25: index.html has all script and link tags bumped to cache version ?v=5.7', () => {
    const htmlPath = path.resolve(__dirname, '../index.html');
    const htmlContent = fs.readFileSync(htmlPath, 'utf-8');

    // Verify all modified JS/CSS files use ?v=5.7 or newer (?v=5.8+)
    const requiredScripts = [
      'assets/js/hubbleGlbData.js',
      'assets/js/avatarGlbData.js',
      'style.css',
      'multiplayerManager.js',
      'voiceManager.js',
      'facility3d.js',
      'workbench3d.js',
      'sadm3d.js',
      'electronicsWorkbench3d.js',
      'networkWorkbench3d.js',
      'assembly3d.js',
      'authManager.js',
      'lobby3d.js',
      'script.js'
    ];

    requiredScripts.forEach(script => {
      const regex = new RegExp(`${script.replace('.', '\\.')}\\?v=(?:5\\.[7-9]|[67]\\.[0-9]+)`);
      assert.ok(regex.test(htmlContent), `index.html must contain updated cache buster for: ${script}`);
    });

    // Ensure zero references to legacy ?v=5.6 remain
    assert.strictEqual(htmlContent.includes('?v=5.6'), false, 'All legacy ?v=5.6 references must be upgraded to ?v=5.7+');
  });

  // =========================================================================
  // 14. MULTIPLAYER LOBBY GATE & 3RD PERSON CAMERA VERIFICATION
  // =========================================================================

  test('M2.14: Multiplayer Equip Gate disables Equip button and displays waiting readouts until all players arrive', () => {
    const env = setupTestEnv();
    env.window.gameState.isMultiplayer = true;
    env.window.gameState.maxPlayers = 4;
    env.window.multiplayerManager.isInRoom = true;
    env.window.multiplayerManager.currentRoom = {
      roomId: 'TEST-ROOM',
      maxPlayers: 4,
      playersCount: 1,
      players: [{ socketId: 's1', name: 'Astronaut_01' }]
    };

    env.window.openLobbyRegistrationModal();

    const authBtn = env.document.getElementById('btnAuthorizeIssueKeycard');
    assert.ok(authBtn.disabled, 'Equip button must be disabled when players < maxPlayers');
    assert.ok(authBtn.textContent.includes('WAITING FOR PLAYERS [1/4]'), 'Equip button text must indicate waiting count');

    const banner = env.document.getElementById('lobbyWaitingStatusBanner');
    assert.strictEqual(banner.classList.contains('hidden'), false, 'Lobby waiting banner must be visible');
    const bannerText = env.document.getElementById('lobbyWaitingStatusText');
    assert.strictEqual(bannerText.textContent, 'WAITING FOR PLAYERS [1/4]');

    const modalNotice = env.document.getElementById('modalWaitingPlayersNotice');
    assert.strictEqual(modalNotice.classList.contains('hidden'), false);
    assert.ok(modalNotice.textContent.includes('WAITING FOR PLAYERS [1/4]'));

    // Attempting to authorize while gated must be blocked
    const result = env.window.authorizeAndIssueKeycard();
    assert.strictEqual(result, null, 'Keycard issuance must be blocked when crew has not arrived');
  });

  test('M2.15: When all multiplayer players arrive, Equip button unlocks and allows keycard issuance', () => {
    const env = setupTestEnv();
    env.window.gameState.isMultiplayer = true;
    env.window.gameState.maxPlayers = 4;
    env.window.multiplayerManager.isInRoom = true;
    env.window.multiplayerManager.currentRoom = {
      roomId: 'TEST-ROOM',
      maxPlayers: 4,
      playersCount: 4,
      players: [
        { socketId: 's1', name: 'Astronaut_01' },
        { socketId: 's2', name: 'Astronaut_02' },
        { socketId: 's3', name: 'Astronaut_03' },
        { socketId: 's4', name: 'Astronaut_04' }
      ]
    };

    env.window.openLobbyRegistrationModal();

    const authBtn = env.document.getElementById('btnAuthorizeIssueKeycard');
    assert.strictEqual(authBtn.disabled, false, 'Equip button must be enabled once all players arrive');
    assert.strictEqual(authBtn.textContent.trim(), 'Equip');

    const bannerText = env.document.getElementById('lobbyWaitingStatusText');
    assert.ok(bannerText.textContent.includes('ALL CREW ARRIVED [4/4]'));

    const result = env.window.authorizeAndIssueKeycard();
    assert.ok(result, 'Keycard issuance must succeed once all players arrive');
    assert.strictEqual(env.window.gameState.hasKeycard, true);
  });

  test('M2.16: LobbyFPSRoom defaults to third_person camera in multiplayer mode', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    env.window.gameState = { isMultiplayer: true };
    const room = new env.window.LobbyFPSRoom();
    assert.strictEqual(room.cameraMode, 'third_person', 'Lobby camera must default to third_person in multiplayer');

    room.toggleCameraMode();
    assert.strictEqual(room.cameraMode, 'first_person');

    room.toggleCameraMode();
    assert.strictEqual(room.cameraMode, 'third_person');
    room.destroy();
  });

  return suiteResults;
}

// Direct execution support: `node tests/tier1_keycard_auth.test.js`
if (require.main === module) {
  const results = runKeycardAuthTests();
  console.log(`\n==================================================`);
  console.log(`🧪 Suite: ${results.name}`);
  console.log(`Passed: ${results.passed} / ${results.passed + results.failed}`);
  console.log(`Failed: ${results.failed}`);
  console.log(`==================================================\n`);

  results.tests.forEach(t => {
    const mark = t.status === 'PASS' ? '✔' : '✖';
    console.log(`  ${mark} [${t.status}] ${t.name}`);
    if (t.error) console.log(`     Error: ${t.error}`);
  });

  process.exit(results.failed > 0 ? 1 : 0);
}

module.exports = { runKeycardAuthTests };
