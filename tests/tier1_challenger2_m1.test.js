/**
 * Horizon-X: NASA Space Design Game
 * Challenger 2 Verification Suite — Milestone M1 Interface Alignment & Integration
 * 
 * Objectives:
 * 1. Interface Alignment:
 *    - Verify corridor gateway coordinates: check that doorway opening at X in [3.6, 5.4], Z = 7.0
 *      aligns with Cleanroom South-East corner without conflicting with Desk 03 (Network Dept at center-South X in [-2.6, 2.6]).
 *    - Verify clearance against Cleanroom Desk 01 (Mechanical Dept at East wall).
 * 2. Door State Toggling & Collision Mechanics:
 *    - Ensure opening the doors toggles collision off and closing toggles collision back on.
 *    - Verify solid North wall remains impenetrable outside gateway opening regardless of door state.
 * 3. Script Tags & Cache Busting in index.html:
 *    - Check that lobby3d.js?v=5.6 is loaded before script.js?v=5.6.
 *    - Check that all scripts and stylesheet share ?v=5.6 uniformly.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createTestEnvironment, loadScript } = require('./test_harness');

function runChallenger2Suite() {
  const results = { name: 'Challenger 2: Milestone M1 Alignment & Invariant Verification', passed: 0, failed: 0, tests: [] };

  function test(name, fn) {
    try {
      fn();
      results.passed++;
      results.tests.push({ name, status: 'PASS' });
      console.log(`  ✔ [PASS] ${name}`);
    } catch (err) {
      results.failed++;
      results.tests.push({ name, status: 'FAIL', error: err.message });
      console.error(`  ✖ [FAIL] ${name}: ${err.message}`);
    }
  }

  console.log('\n================================================================================');
  console.log('🛸 CHALLENGER 2: MILESTONE M1 INTERFACE ALIGNMENT & INTEGRATION SUITE');
  console.log('================================================================================\n');

  // =========================================================================
  // OBJECTIVE 1: INTERFACE ALIGNMENT & GEOMETRIC CLEARANCE
  // =========================================================================
  test('ALIGN.1: Cleanroom Desk 03 bounding box and Lobby Gateway corridor coordinates separation', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const lobby = new env.window.LobbyFPSRoom();

    // Authoritative Cleanroom coordinates (facility3d.js:80-120)
    const cleanroomBounds = {
      minX: -6.0,
      maxX: 6.0,
      minZ: -7.0,
      maxZ: 7.0,
      height: 4.2
    };

    const cleanroomDesk03 = {
      minX: -2.6,
      maxX: 2.6,
      minZ: 5.6,
      maxZ: 6.8,
      height: 0.88
    };

    const cleanroomDesk01 = {
      minX: 3.8,
      maxX: 5.9,
      minZ: -2.6,
      maxZ: 2.6,
      height: 0.88
    };

    // 1. Check Gateway coordinates
    assert.strictEqual(lobby.gateway.minX, 3.6, 'Gateway minX must be 3.6m');
    assert.strictEqual(lobby.gateway.maxX, 5.4, 'Gateway maxX must be 5.4m');
    assert.strictEqual(lobby.gateway.z, 7.0, 'Gateway Z must be 7.0m (shared interface plane)');
    assert.strictEqual(lobby.gateway.width, 1.8, 'Gateway width must be 1.8m');

    // 2. Check alignment with Cleanroom boundary: Z = 7.0 is Cleanroom South wall
    assert.strictEqual(lobby.room.minZ, cleanroomBounds.maxZ, 'Lobby North wall (Z=7.0) must directly meet Cleanroom South wall (Z=7.0)');
    assert.strictEqual(lobby.room.width, cleanroomBounds.maxX - cleanroomBounds.minX, 'Room widths must match exactly (12.0m)');
    assert.strictEqual(lobby.room.height, cleanroomBounds.height, 'Room heights must match exactly (4.2m)');

    // 3. Check clearance against Desk 03 (Network Dept at center-South)
    const desk03EastEdge = cleanroomDesk03.maxX; // 2.6m
    const gatewayWestEdge = lobby.gateway.minX; // 3.6m
    const lateralClearanceDesk03 = gatewayWestEdge - desk03EastEdge;
    assert.ok(lateralClearanceDesk03 >= 1.0, `Clearance from Desk 03 must be >= 1.0m (actual: ${lateralClearanceDesk03.toFixed(2)}m)`);

    // Verify ZERO horizontal overlap with Desk 03
    const hasOverlapDesk03 = (gatewayWestEdge < cleanroomDesk03.maxX && lobby.gateway.maxX > cleanroomDesk03.minX);
    assert.strictEqual(hasOverlapDesk03, false, 'Gateway corridor and Desk 03 must have ZERO horizontal overlap');

    // 4. Check clearance against Cleanroom Desk 01 (Mechanical Dept at East wall)
    const longitudinalClearanceDesk01 = lobby.gateway.z - cleanroomDesk01.maxZ; // 7.0 - 2.6 = 4.4m
    assert.ok(longitudinalClearanceDesk01 >= 4.0, `Longitudinal clearance from Cleanroom Desk 01 must be >= 4.0m (actual: ${longitudinalClearanceDesk01.toFixed(2)}m)`);

    lobby.destroy();
  });

  test('ALIGN.2: Gateway opening coordinates align with Cleanroom South-East corner', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const lobby = new env.window.LobbyFPSRoom();

    // Cleanroom South-East corner quadrant: X in [0.0, 6.0], Z in [5.0, 7.0]
    assert.ok(lobby.gateway.minX > 0, 'Gateway opening is in the East half (X > 0)');
    assert.ok(lobby.gateway.maxX < lobby.room.maxX, 'Gateway opening is within East boundary (X < 6.0)');
    assert.strictEqual(lobby.gateway.z, 7.0, 'Gateway is on South boundary of cleanroom / North boundary of lobby');

    lobby.destroy();
  });

  // =========================================================================
  // OBJECTIVE 2: DOOR STATE TOGGLING & COLLISION DYNAMICS
  // =========================================================================
  test('DOORS.1: Closed door blocks passage across the entire gateway span', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const lobby = new env.window.LobbyFPSRoom();
    assert.strictEqual(lobby.doorOpen, false, 'Doors must initialize closed');
    assert.strictEqual(lobby.doorProgress, 0.0, 'Door progress must initialize at 0.0');

    // Test multiple sample points through the doorway (Z = 6.95, inside cleanroom transition)
    for (let x = 3.6; x <= 5.4; x += 0.2) {
      const blocked = lobby.checkCollision(Number(x.toFixed(2)), 6.95);
      assert.strictEqual(blocked, true, `Gateway at X=${x.toFixed(2)}, Z=6.95 must be blocked when doors are closed`);
    }

    lobby.destroy();
  });

  test('DOORS.2: Open doors toggle collision OFF and allow unobstructed passage through gateway', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const lobby = new env.window.LobbyFPSRoom();

    // Open doors
    lobby.openDoors();
    assert.strictEqual(lobby.doorOpen, true, 'doorOpen must be true');
    assert.strictEqual(lobby.doorState, 'opening', 'doorState must be opening');

    // Simulate animation frames to full opening
    for (let frame = 0; frame < 15; frame++) {
      lobby.updateDoors(0.1);
    }
    assert.strictEqual(lobby.doorProgress, 1.0, 'Door progress must reach 1.0');
    assert.strictEqual(lobby.doorState, 'open', 'Door state must be open');

    // Test that doorway points are now passable (collision is OFF)
    // Using walkable clearance considering player radius (pad = 0.38m)
    const pad = lobby.player.radius;
    const minWalkX = lobby.gateway.minX + pad; // 3.98
    const maxWalkX = lobby.gateway.maxX - pad; // 5.02

    for (let x = minWalkX; x <= maxWalkX; x += 0.2) {
      const blocked = lobby.checkCollision(Number(x.toFixed(2)), 6.95);
      assert.strictEqual(blocked, false, `Gateway at X=${x.toFixed(2)}, Z=6.95 must be passable when doors are open`);
    }

    lobby.destroy();
  });

  test('DOORS.3: Closing doors toggles collision back ON to block entry', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const lobby = new env.window.LobbyFPSRoom();
    lobby.openDoors();
    lobby.doorProgress = 1.0;
    lobby.doorState = 'open';

    // Verify it was open
    assert.strictEqual(lobby.checkCollision(4.5, 6.95), false);

    // Close doors
    lobby.closeDoors();
    assert.strictEqual(lobby.doorOpen, false, 'doorOpen must toggle to false');
    assert.strictEqual(lobby.doorState, 'closing', 'doorState must be closing');

    // Advance closing animation
    for (let frame = 0; frame < 15; frame++) {
      lobby.updateDoors(0.1);
    }
    assert.strictEqual(lobby.doorProgress, 0.0, 'Door progress must reach 0.0');
    assert.strictEqual(lobby.doorState, 'closed', 'Door state must be closed');

    // Collision must now be back ON
    assert.strictEqual(lobby.checkCollision(4.5, 6.95), true, 'Gateway must block passage once doors are re-closed');

    lobby.destroy();
  });

  test('DOORS.4: Solid North wall remains strictly impassable outside doorway even when doors are open', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const lobby = new env.window.LobbyFPSRoom();
    lobby.openDoors();
    lobby.doorProgress = 1.0;

    // Sample North wall points outside gateway opening
    const wallSampleXs = [-5.0, -3.0, -1.0, 0.0, 1.0, 2.5, 3.2, 5.8];
    for (const x of wallSampleXs) {
      assert.strictEqual(lobby.checkCollision(x, 6.95), true, `Solid North wall at X=${x} must remain impassable even when doors are open`);
    }

    lobby.destroy();
  });

  // =========================================================================
  // OBJECTIVE 3: SCRIPT TAGS & CACHE BUSTING IN index.html
  // =========================================================================
  test('CACHE.1: index.html loads lobby3d.js?v=5.6 immediately before script.js?v=5.6', () => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const lobbyScriptTag = '<script src="lobby3d.js?v=5.6"></script>';
    const mainScriptTag = '<script src="script.js?v=5.6"></script>';

    assert.ok(html.includes(lobbyScriptTag), `index.html must contain exact script tag: ${lobbyScriptTag}`);
    assert.ok(html.includes(mainScriptTag), `index.html must contain exact script tag: ${mainScriptTag}`);

    const lobbyIdx = html.indexOf(lobbyScriptTag);
    const mainIdx = html.indexOf(mainScriptTag);

    assert.ok(lobbyIdx < mainIdx, 'lobby3d.js must be loaded BEFORE script.js');

    // Check that there are NO other script tags between lobby3d.js and script.js
    const between = html.substring(lobbyIdx + lobbyScriptTag.length, mainIdx).trim();
    assert.strictEqual(between, '', 'lobby3d.js must be directly adjacent (no intervening scripts) before script.js');
  });

  test('CACHE.2: All active game scripts and styles uniformly share ?v=5.6 without stale versions', () => {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const requiredTags = [
      'assets/js/hubbleGlbData.js?v=5.6',
      'assets/js/avatarGlbData.js?v=5.6',
      'style.css?v=5.6',
      'multiplayerManager.js?v=5.6',
      'voiceManager.js?v=5.6',
      'facility3d.js?v=5.6',
      'workbench3d.js?v=5.6',
      'sadm3d.js?v=5.6',
      'electronicsWorkbench3d.js?v=5.6',
      'networkWorkbench3d.js?v=5.6',
      'assembly3d.js?v=5.6',
      'authManager.js?v=5.6',
      'lobby3d.js?v=5.6',
      'script.js?v=5.6'
    ];

    for (const tag of requiredTags) {
      assert.ok(html.includes(tag), `index.html must include '${tag}'`);
    }

    // Check for any obsolete cache query strings in <script> or <link> tags
    const staleMatches = html.match(/(?:src|href)="[^"]+\?v=(?!5\.6)[^"]+"/g) || [];
    assert.deepStrictEqual(staleMatches, [], `Found stale cache versions in index.html: ${JSON.stringify(staleMatches)}`);
  });

  // =========================================================================
  // OBJECTIVE 4: AGENTS.md INVARIANTS & CLASS EXPORTS
  // =========================================================================
  test('INVARIANT.1: window.LobbyFPSRoom is attached globally per AGENTS.md Rule 1', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    assert.ok(env.window.LobbyFPSRoom, 'window.LobbyFPSRoom must be explicitly attached');
    assert.strictEqual(typeof env.window.LobbyFPSRoom, 'function', 'LobbyFPSRoom must be a class constructor');
  });

  console.log('--------------------------------------------------------------------------------');
  console.log(`Results: ${results.passed} / ${results.passed + results.failed} passed`);
  console.log('================================================================================\n');

  return results;
}

if (require.main === module) {
  const r = runChallenger2Suite();
  if (r.failed > 0) process.exit(1);
}

module.exports = { runChallenger2Suite };
