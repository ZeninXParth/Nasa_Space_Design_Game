/**
 * Horizon-X: NASA Space Design Game
 * Tier 1 Test Suite: Milestone M1 — Lobby 3D Environment & Spatial Architecture
 * 
 * Verifies:
 * - Feature 1: LobbyFPSRoom class definition & window.LobbyFPSRoom export (AGENTS.md Rule 1)
 * - Feature 2: Spatial Dimensions (12m x 10m x 4.2m) & Surface Colors (#F1FAEE, #FAEDCD, #F8F3F0)
 * - Feature 3: Single-player spawn coordinates (X=0, Z=14.5, Y=1.7, yaw=0)
 * - Feature 4: Multiplayer lateral spawn distribution for 1 to 4 players (1.4m spacing)
 * - Feature 5: 11 Procedural Environmental Props presence & initialization
 * - Feature 6: AABB Collision Boxes & Obstacle Detection (Perimeter, Circular Desk, Sofa, Reg Desk)
 * - Feature 7: South-East Gateway Corridor opening at X in [3.6, 5.4], Z = 7.0 and sliding doors
 * - Feature 8: Complete Three.js Lifecycle Methods (start, stop, render, update, onResize, destroy)
 */

const assert = require('node:assert');
const { createTestEnvironment, loadScript } = require('./test_harness');

function runLobbyRoomTests() {
  const suiteResults = { name: 'Tier 1: Lobby 3D Room & Spatial Architecture', passed: 0, failed: 0, tests: [] };

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
  // 1. CLASS DEFINITION & GLOBAL EXPORT (AGENTS.md Rule 1)
  // =========================================================================

  test('M1.1: LobbyFPSRoom class is defined and exported to window.LobbyFPSRoom', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    assert.ok(env.window.LobbyFPSRoom, 'window.LobbyFPSRoom must be explicitly attached');
    assert.strictEqual(typeof env.window.LobbyFPSRoom, 'function', 'LobbyFPSRoom must be a class/constructor function');
  });

  test('M1.2: LobbyFPSRoom instantiates with container and options', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const container = env.document.createElement('div');
    container.id = 'lobbyContainerTest';
    env.document.body.appendChild(container);

    const room = new env.window.LobbyFPSRoom(container, { cameraMode: 'first_person' });
    assert.ok(room, 'LobbyFPSRoom instance must be created');
    assert.strictEqual(room.cameraMode, 'first_person');
    room.destroy();
  });

  // =========================================================================
  // 2. SPATIAL DIMENSIONS & ARCHITECTURAL MATERIALS
  // =========================================================================

  test('M1.3: Lobby dimensions match 12.0m width, 10.0m depth, 4.2m height', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.strictEqual(room.room.width, 12.0, 'Width must be 12.0m (X: -6 to +6)');
    assert.strictEqual(room.room.depth, 10.0, 'Depth must be 10.0m (Z: 7 to 17)');
    assert.strictEqual(room.room.height, 4.2, 'Height must be 4.2m (Y: 0 to 4.2)');
    assert.strictEqual(room.room.minX, -6.0);
    assert.strictEqual(room.room.maxX, 6.0);
    assert.strictEqual(room.room.minZ, 7.0);
    assert.strictEqual(room.room.maxZ, 17.0);
    room.destroy();
  });

  test('M1.4: Surface colors match approved palette (#232832 floor, #1F242C ceiling, #2D3440 walls)', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    const validFloors = ['#232832', '#F1FAEE'];
    const validCeilings = ['#1F242C', '#FAEDCD'];
    const validWalls = ['#2D3440', '#F8F3F0'];

    assert.ok(validFloors.includes(room.floorColor.toUpperCase()), 'Floor color must match approved palette');
    assert.ok(validCeilings.includes(room.ceilingColor.toUpperCase()), 'Ceiling color must match approved palette');
    assert.ok(validWalls.includes(room.wallColor.toUpperCase()), 'Walls color must match approved palette');

    // Also verify material color values
    if (room.floorMaterial?.color?.getHexString) {
      assert.ok(['232832', 'F1FAEE'].includes(room.floorMaterial.color.getHexString().toUpperCase()));
    }
    if (room.ceilingMaterial?.color?.getHexString) {
      assert.ok(['1F242C', 'FAEDCD'].includes(room.ceilingMaterial.color.getHexString().toUpperCase()));
    }
    if (room.wallMaterial?.color?.getHexString) {
      assert.ok(['2D3440', 'F8F3F0'].includes(room.wallMaterial.color.getHexString().toUpperCase()));
    }
    room.destroy();
  });

  // =========================================================================
  // 3. SPAWN POSITION CALCULATIONS (SINGLE & MULTIPLAYER)
  // =========================================================================

  test('M1.5: Single-player spawn coordinates are X=0.0, Z=14.5, Y=1.7, yaw=0', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.strictEqual(room.player.pos.x, 0, 'Single-player spawn X must be 0');
    assert.strictEqual(room.player.pos.y, 1.7, 'Single-player spawn Y must be 1.7 (eye level)');
    assert.strictEqual(room.player.pos.z, 14.5, 'Single-player spawn Z must be 14.5');
    assert.strictEqual(room.player.yaw, 0, 'Yaw must be 0 (facing North)');
    assert.strictEqual(room.player.radius, 0.38, 'Player bounding cylinder radius must be 0.38m');
    room.destroy();
  });

  test('M1.6: Multiplayer spawn offset calculations for 1, 2, 3, and 4 players (1.4m spacing)', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();

    // 1 Player: X = 0.0
    const p1_0 = room.getSpawnPosition(0, 1);
    assert.strictEqual(p1_0.x, 0.0);
    assert.strictEqual(p1_0.z, 14.5);

    // 2 Players: X = -0.7m, +0.7m (Spacing = 1.4m)
    const p2_0 = room.getSpawnPosition(0, 2);
    const p2_1 = room.getSpawnPosition(1, 2);
    assert.strictEqual(p2_0.x, -0.7);
    assert.strictEqual(p2_1.x, 0.7);
    assert.strictEqual(Number((p2_1.x - p2_0.x).toFixed(2)), 1.4);

    // 3 Players: X = -1.4m, 0.0m, +1.4m
    const p3_0 = room.getSpawnPosition(0, 3);
    const p3_1 = room.getSpawnPosition(1, 3);
    const p3_2 = room.getSpawnPosition(2, 3);
    assert.strictEqual(p3_0.x, -1.4);
    assert.strictEqual(p3_1.x, 0.0);
    assert.strictEqual(p3_2.x, 1.4);
    assert.strictEqual(Number((p3_1.x - p3_0.x).toFixed(2)), 1.4);
    assert.strictEqual(Number((p3_2.x - p3_1.x).toFixed(2)), 1.4);

    // 4 Players: X = -2.1m, -0.7m, +0.7m, +2.1m
    const p4_0 = room.getSpawnPosition(0, 4);
    const p4_1 = room.getSpawnPosition(1, 4);
    const p4_2 = room.getSpawnPosition(2, 4);
    const p4_3 = room.getSpawnPosition(3, 4);
    assert.strictEqual(p4_0.x, -2.1);
    assert.strictEqual(p4_1.x, -0.7);
    assert.strictEqual(p4_2.x, 0.7);
    assert.strictEqual(p4_3.x, 2.1);
    assert.strictEqual(Number((p4_1.x - p4_0.x).toFixed(2)), 1.4);
    assert.strictEqual(Number((p4_2.x - p4_1.x).toFixed(2)), 1.4);
    assert.strictEqual(Number((p4_3.x - p4_2.x).toFixed(2)), 1.4);

    room.destroy();
  });

  // =========================================================================
  // 4. ENVIRONMENTAL PROPS INVENTORY (11 PROPS)
  // =========================================================================

  test('M1.7: Prop 1 — Circular desk with research papers is instantiated', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.circularDeskProp, 'circularDeskProp must exist');
    assert.ok(room.props.circularDesk, 'props.circularDesk must exist');
    assert.strictEqual(room.circularDeskProp.position.x, -2.5);
    assert.strictEqual(room.circularDeskProp.position.z, 12.0);
    room.destroy();
  });

  test('M1.8: Prop 2 — White leather sofa in seating area is instantiated', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.sofaProp, 'sofaProp must exist');
    assert.ok(room.props.sofa, 'props.sofa must exist');
    assert.strictEqual(room.sofaProp.position.x, -4.9);
    assert.strictEqual(room.sofaProp.position.z, 12.0);
    room.destroy();
  });

  test('M1.9: Prop 3 — Dual air conditioning units on upper West and South walls are instantiated', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.airConditioners, 'airConditioners array must exist');
    assert.strictEqual(room.airConditioners.length, 2, 'Must have exactly 2 AC units');
    assert.ok(room.airConditionerWestProp, 'West AC unit must exist');
    assert.ok(room.airConditionerSouthProp, 'South AC unit must exist');
    room.destroy();
  });

  test('M1.10: Prop 4 — Corner-mounted security camera dome/housings are instantiated (4 corners)', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.securityCameras, 'securityCameras array must exist');
    assert.strictEqual(room.securityCameras.length, 4, 'Must have 4 security cameras in all 4 corners');
    room.destroy();
  });

  test('M1.11: Prop 5 — Overhead hanging informational screen is instantiated', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.hangingScreenProp, 'hangingScreenProp must exist');
    assert.ok(room.props.hangingScreen, 'props.hangingScreen must exist');
    room.destroy();
  });

  test('M1.12: Prop 6 — Modern registration desk on East wall is instantiated', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.registrationDeskProp, 'registrationDeskProp must exist');
    assert.ok(room.props.registrationDesk, 'props.registrationDesk must exist');
    assert.strictEqual(room.registrationDeskProp.position.x, 4.85);
    assert.strictEqual(room.registrationDeskProp.position.z, 12.0);
    room.destroy();
  });

  test('M1.13: Prop 7 & 8 — Curved ultrawide monitor and gooseneck microphone on reception desk', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.registrationMonitorProp, 'registrationMonitorProp must exist');
    assert.ok(room.props.registrationMonitor, 'props.registrationMonitor must exist');
    assert.ok(room.microphoneProp, 'microphoneProp must exist');
    assert.ok(room.props.microphone, 'props.microphone must exist');
    room.destroy();
  });

  test('M1.14: Prop 9 — Security access card terminal prop near gateway is instantiated', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.keycardTerminalProp, 'keycardTerminalProp must exist');
    assert.ok(room.props.keycardTerminal, 'props.keycardTerminal must exist');
    assert.strictEqual(room.keycardTerminalProp.position.x, 3.3);
    assert.strictEqual(room.keycardTerminalProp.position.z, 7.3);
    room.destroy();
  });

  test('M1.15: Prop 10 — South-East gateway corridor opening coordinates match X in [3.6, 5.4], Z = 7.0', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.gateway, 'gateway definition must exist');
    assert.strictEqual(room.gateway.minX, 3.6, 'Gateway minX must be 3.6');
    assert.strictEqual(room.gateway.maxX, 5.4, 'Gateway maxX must be 5.4');
    assert.strictEqual(room.gateway.z, 7.0, 'Gateway Z must be 7.0');
    assert.strictEqual(room.gateway.width, 1.8, 'Gateway width must be 1.8m');
    assert.strictEqual(room.gateway.height, 2.8, 'Gateway height must be 2.8m');
    assert.ok(room.gatewayCorridorProp, 'gatewayCorridorProp must exist');
    room.destroy();
  });

  test('M1.16: Prop 11 — Double sliding transparent glass door prop with left/right panels', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();
    assert.ok(room.slidingDoorProp, 'slidingDoorProp must exist');
    assert.ok(room.props.slidingDoor, 'props.slidingDoor must exist');
    assert.ok(room.doorPanelLeft, 'doorPanelLeft must exist');
    assert.ok(room.doorPanelRight, 'doorPanelRight must exist');
    assert.strictEqual(room.doorOpen, false, 'Door must initialize in closed state');
    room.destroy();
  });

  // =========================================================================
  // 5. AABB COLLISION DETECTION & OBSTACLES
  // =========================================================================

  test('M1.17: AABB collision box definitions for perimeter walls, circular desk, sofa, and registration desk', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();

    // Verify circular desk obstacle
    assert.ok(room.circularDeskBox, 'circularDeskBox must be defined');
    assert.strictEqual(room.circularDeskBox.minX, -3.55);
    assert.strictEqual(room.circularDeskBox.maxX, -1.45);
    assert.strictEqual(room.circularDeskBox.minZ, 10.95);
    assert.strictEqual(room.circularDeskBox.maxZ, 13.05);

    // Verify sofa obstacle
    assert.ok(room.sofaBox, 'sofaBox must be defined');
    assert.strictEqual(room.sofaBox.minX, -5.9);
    assert.strictEqual(room.sofaBox.maxX, -3.9);
    assert.strictEqual(room.sofaBox.minZ, 10.5);
    assert.strictEqual(room.sofaBox.maxZ, 13.5);

    // Verify registration desk obstacle
    assert.ok(room.registrationDeskBox, 'registrationDeskBox must be defined');
    assert.strictEqual(room.registrationDeskBox.minX, 3.8);
    assert.strictEqual(room.registrationDeskBox.maxX, 5.9);
    assert.strictEqual(room.registrationDeskBox.minZ, 10.2);
    assert.strictEqual(room.registrationDeskBox.maxZ, 13.8);

    // Verify obstacles list contains all 3 primary furniture obstacles
    assert.ok(room.obstacles.includes(room.circularDeskBox));
    assert.ok(room.obstacles.includes(room.sofaBox));
    assert.ok(room.obstacles.includes(room.registrationDeskBox));

    room.destroy();
  });

  test('M1.18: checkCollision correctly blocks obstacles and allows open walkway', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();

    // Center of room walkway is open
    assert.strictEqual(room.checkCollision(0.0, 12.0), false, 'Center walkway must be passable');
    assert.strictEqual(room.checkCollision(0.0, 14.5), false, 'Spawn zone must be passable');

    // Inside Circular desk -> collision
    assert.strictEqual(room.checkCollision(-2.5, 12.0), true, 'Inside circular desk must collide');

    // Inside Sofa -> collision
    assert.strictEqual(room.checkCollision(-4.8, 12.0), true, 'Inside sofa must collide');

    // Inside Registration desk -> collision
    assert.strictEqual(room.checkCollision(4.85, 12.0), true, 'Inside registration desk must collide');

    // Outside West perimeter (X < -6.0) -> collision
    assert.strictEqual(room.checkCollision(-6.2, 12.0), true, 'Outside West wall must collide');

    // Outside East perimeter (X > 6.0) -> collision
    assert.strictEqual(room.checkCollision(6.2, 12.0), true, 'Outside East wall must collide');

    // Outside South perimeter (Z > 17.0) -> collision
    assert.strictEqual(room.checkCollision(0.0, 17.2), true, 'Outside South wall must collide');

    room.destroy();
  });

  test('M1.19: Door collision state toggles with openDoors() and closeDoors()', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const room = new env.window.LobbyFPSRoom();

    // When door is closed, attempting to step through gateway (X=4.5, Z=7.0) is blocked
    assert.strictEqual(room.doorOpen, false);
    assert.strictEqual(room.checkCollision(4.5, 6.95), true, 'Closed door must block entry');

    // Open doors
    room.openDoors();
    assert.strictEqual(room.doorOpen, true);
    room.doorProgress = 1.0; // Simulate fully open
    assert.strictEqual(room.checkCollision(4.5, 6.95), false, 'Open door allows passage through gateway');

    // Close doors again
    room.closeDoors();
    assert.strictEqual(room.doorOpen, false);
    room.doorProgress = 0.0;
    assert.strictEqual(room.checkCollision(4.5, 6.95), true, 'Re-closed door blocks entry again');

    // Outside gateway opening (e.g. X=0, Z=6.95 North wall) is ALWAYS blocked
    assert.strictEqual(room.checkCollision(0.0, 6.95), true, 'Solid North wall is blocked even if door is open');

    room.destroy();
  });

  // =========================================================================
  // 6. LIFECYCLE METHODS
  // =========================================================================

  test('M1.20: Lifecycle methods start(), render(), update(), onResize(), stop(), and destroy() work without exceptions', () => {
    const env = createTestEnvironment();
    loadScript('lobby3d.js', env);

    const container = env.document.createElement('div');
    container.id = 'lobbyLifecycleContainer';
    env.document.body.appendChild(container);

    const room = new env.window.LobbyFPSRoom(container);

    // start()
    assert.strictEqual(room.isRunning, false);
    room.start();
    assert.strictEqual(room.isRunning, true);

    // update(0.016)
    room.keys.forward = true;
    room.update(0.016);
    assert.notStrictEqual(room.player.vel.z, 0, 'Velocity should update when moving forward');
    room.keys.forward = false;

    // onResize()
    room.onResize();

    // stop()
    room.stop();
    assert.strictEqual(room.isRunning, false);

    // destroy()
    room.destroy();
    assert.strictEqual(room.isRunning, false);
  });

  return suiteResults;
}

if (require.main === module) {
  const res = runLobbyRoomTests();
  console.log(`Passed: ${res.passed} / ${res.tests.length}`);
  res.tests.forEach(t => console.log(`  ${t.status === 'PASS' ? '✔' : '❌'} ${t.name}`));
  if (res.failed > 0) process.exit(1);
}

module.exports = { runLobbyRoomTests };
