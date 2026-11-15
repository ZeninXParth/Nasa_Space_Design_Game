/**
 * Horizon-X | Empirical Challenger Stress Test Harness
 * Milestone M1: Lobby 3D Environment & Spatial Architecture
 * 
 * Tests:
 * 1. Boundary Value Analysis on Collision Detection
 * 2. Obstacle Collision & Sliding Dynamics
 * 3. Multiplayer Spawn Distribution & Extreme Parameter Fuzzing
 * 4. Lifecycle Stability, Re-entrance & Resource Cleanup
 */

const assert = require('node:assert');
const { createTestEnvironment, loadScript } = require('./test_harness');

function runStressTests() {
  console.log('================================================================================');
  console.log('🔥 HORIZON-X EMPIRICAL CHALLENGER STRESS HARNESS — MILESTONE M1');
  console.log('================================================================================\n');

  let passed = 0;
  let failed = 0;
  const findings = [];

  function challenge(title, fn) {
    try {
      fn();
      passed++;
      console.log(`  [PASS] ${title}`);
    } catch (err) {
      failed++;
      console.error(`  [FAIL] ${title}`);
      console.error(`         Reason: ${err.message}`);
      findings.push({ title, error: err.message, stack: err.stack });
    }
  }

  const env = createTestEnvironment();
  loadScript('lobby3d.js', env);
  const LobbyFPSRoom = env.window.LobbyFPSRoom;

  // =========================================================================
  // VECTOR 1: BOUNDARY VALUE ANALYSIS ON COLLISION DETECTION
  // =========================================================================
  console.log('--- VECTOR 1: BOUNDARY VALUE ANALYSIS (COLLISION BOUNDARIES) ---');

  const room = new LobbyFPSRoom();
  const pad = room.player.radius; // 0.38m
  assert.strictEqual(pad, 0.38, 'Player radius must be 0.38m');

  // Exact boundary thresholds:
  // West wall: X = -6.0 -> walkable X >= -6.0 + 0.38 = -5.62
  // East wall: X = +6.0 -> walkable X <= 6.0 - 0.38 = +5.62
  // South wall: Z = 17.0 -> walkable Z <= 17.0 - 0.38 = 16.62
  // North wall: Z = 7.0 -> walkable Z >= 7.0 + 0.38 = 7.38 (except gateway corridor)

  challenge('BVA 1.1: West boundary step threshold (-5.62 vs -5.62001)', () => {
    assert.strictEqual(room.checkCollision(-5.6199, 14.5), false, 'Just inside West boundary must be walkable');
    assert.strictEqual(room.checkCollision(-5.6200, 14.5), false, 'At exact West boundary (-5.62) must be walkable');
    assert.strictEqual(room.checkCollision(-5.6201, 14.5), true, 'Just outside West boundary (-5.6201) must collide');
    assert.strictEqual(room.checkCollision(-6.0000, 14.5), true, 'On physical West wall (-6.0) must collide');
    assert.strictEqual(room.checkCollision(-100.0, 14.5), true, 'Far beyond West wall (-100.0) must collide');
  });

  challenge('BVA 1.2: East boundary step threshold (+5.62 vs +5.62001)', () => {
    assert.strictEqual(room.checkCollision(5.6199, 14.5), false, 'Just inside East boundary must be walkable');
    assert.strictEqual(room.checkCollision(5.6200, 14.5), false, 'At exact East boundary (+5.62) must be walkable');
    assert.strictEqual(room.checkCollision(5.6201, 14.5), true, 'Just outside East boundary (+5.6201) must collide');
    assert.strictEqual(room.checkCollision(6.0000, 14.5), true, 'On physical East wall (+6.0) must collide');
    assert.strictEqual(room.checkCollision(100.0, 14.5), true, 'Far beyond East wall (+100.0) must collide');
  });

  challenge('BVA 1.3: South boundary step threshold (+16.62 vs +16.62001)', () => {
    assert.strictEqual(room.checkCollision(0.0, 16.6199), false, 'Just inside South boundary must be walkable');
    assert.strictEqual(room.checkCollision(0.0, 16.6200), false, 'At exact South boundary (16.62) must be walkable');
    assert.strictEqual(room.checkCollision(0.0, 16.6201), true, 'Just outside South boundary (16.6201) must collide');
    assert.strictEqual(room.checkCollision(0.0, 17.0000), true, 'On physical South wall (17.0) must collide');
    assert.strictEqual(room.checkCollision(0.0, 50.0000), true, 'Far beyond South wall (50.0) must collide');
  });

  challenge('BVA 1.4: North boundary step threshold away from gateway (+7.38 vs +7.3799)', () => {
    // Center at X=0.0 (solid wall section)
    assert.strictEqual(room.checkCollision(0.0, 7.3801), false, 'Just inside North boundary must be walkable');
    assert.strictEqual(room.checkCollision(0.0, 7.3800), false, 'At exact North boundary (7.38) must be walkable');
    assert.strictEqual(room.checkCollision(0.0, 7.3799), true, 'Just outside North boundary (7.3799) must collide');
    assert.strictEqual(room.checkCollision(0.0, 7.0000), true, 'On physical North wall (7.0) must collide');
    assert.strictEqual(room.checkCollision(0.0, 0.0000), true, 'Far North of room (0.0) must collide');
  });

  challenge('BVA 1.5: Room corner boundary intersections', () => {
    // South-West corner (-5.62, 16.62)
    assert.strictEqual(room.checkCollision(-5.62, 16.62), false, 'South-West walkable corner must not collide');
    assert.strictEqual(room.checkCollision(-5.621, 16.62), true, 'South-West beyond West must collide');
    assert.strictEqual(room.checkCollision(-5.62, 16.621), true, 'South-West beyond South must collide');

    // South-East corner (+5.62, 16.62)
    assert.strictEqual(room.checkCollision(5.62, 16.62), false, 'South-East walkable corner must not collide');
    assert.strictEqual(room.checkCollision(5.621, 16.62), true, 'South-East beyond East must collide');
    assert.strictEqual(room.checkCollision(5.62, 16.621), true, 'South-East beyond South must collide');

    // North-West corner (-5.62, 7.38)
    assert.strictEqual(room.checkCollision(-5.62, 7.38), false, 'North-West walkable corner must not collide');
    assert.strictEqual(room.checkCollision(-5.621, 7.38), true, 'North-West beyond West must collide');
    assert.strictEqual(room.checkCollision(-5.62, 7.379), true, 'North-West beyond North must collide');
  });

  challenge('BVA 1.6: Gateway corridor boundary thresholds (X in [3.6, 5.4], door open vs closed)', () => {
    // Gateway opening is [3.6, 5.4]. Player radius = 0.38.
    // Inner walkable clearance in gateway is X in [3.6 + 0.38, 5.4 - 0.38] = [3.98, 5.02]
    
    // When door is closed:
    room.closeDoors();
    room.doorProgress = 0.0;
    assert.strictEqual(room.checkCollision(4.5, 7.1), true, 'Corridor at Z=7.1 with closed door must collide');
    assert.strictEqual(room.checkCollision(3.98, 7.1), true, 'Left margin of gateway with closed door must collide');
    assert.strictEqual(room.checkCollision(5.02, 7.1), true, 'Right margin of gateway with closed door must collide');

    // When door is open:
    room.openDoors();
    room.doorProgress = 1.0;
    assert.strictEqual(room.checkCollision(4.5, 7.1), false, 'Center of gateway with open door is passable');
    assert.strictEqual(room.checkCollision(3.98, 7.1), false, 'Left clearance margin (3.98) with open door is passable');
    assert.strictEqual(room.checkCollision(5.02, 7.1), false, 'Right clearance margin (5.02) with open door is passable');

    // Just beyond gateway frame boundaries with open door (should collide with door jamb):
    assert.strictEqual(room.checkCollision(3.97, 7.1), true, 'Left door jamb (3.97) must collide even when door is open');
    assert.strictEqual(room.checkCollision(5.03, 7.1), true, 'Right door jamb (5.03) must collide even when door is open');
  });

  room.destroy();

  // =========================================================================
  // VECTOR 2: OBSTACLE COLLISIONS & SLIDING DYNAMICS
  // =========================================================================
  console.log('\n--- VECTOR 2: OBSTACLE COLLISIONS & SLIDING DYNAMICS ---');

  challenge('OBS 2.1: Circular desk perimeter collision envelope and combined West barrier', () => {
    const r = new LobbyFPSRoom();
    // Circular desk: minX: -3.55, maxX: -1.45, minZ: 10.95, maxZ: 13.05
    // Expanded with pad (0.38): X in [-3.93, -1.07], Z in [10.57, 13.43]
    
    // Center of desk
    assert.strictEqual(r.checkCollision(-2.5, 12.0), true, 'Center of circular desk must collide');

    // East edge of desk envelope (facing open center walkway)
    assert.strictEqual(r.checkCollision(-1.07, 12.0), true, 'East edge of desk envelope (-1.07) must collide');
    assert.strictEqual(r.checkCollision(-1.069, 12.0), false, 'Just outside East edge (-1.069) must be clear into central walkway');

    // North edge of desk envelope
    assert.strictEqual(r.checkCollision(-2.5, 10.57), true, 'North edge of desk envelope (10.57) must collide');
    assert.strictEqual(r.checkCollision(-2.5, 10.569), false, 'Just outside North edge (10.569) must be clear');

    // South edge of desk envelope
    assert.strictEqual(r.checkCollision(-2.5, 13.43), true, 'South edge of desk envelope (13.43) must collide');
    assert.strictEqual(r.checkCollision(-2.5, 13.431), false, 'Just outside South edge (13.431) must be clear');

    // West edge of circular desk overlaps with sofa envelope (gap is only 0.35m < player diameter 0.76m)
    // Confirm that attempting to squeeze between circular desk and sofa is blocked:
    assert.strictEqual(r.checkCollision(-3.72, 12.0), true, 'Pinch point between desk and sofa must collide');
    assert.strictEqual(r.checkCollision(-3.931, 12.0), true, 'West of desk at Z=12 is inside sofa envelope and must collide');

    r.destroy();
  });

  challenge('OBS 2.2: White sofa perimeter collision envelope and West wall barrier', () => {
    const r = new LobbyFPSRoom();
    // Sofa: minX: -5.9, maxX: -3.9, minZ: 10.5, maxZ: 13.5
    // Expanded with pad (0.38): X in [-6.28, -3.52], Z in [10.12, 13.88]
    
    assert.strictEqual(r.checkCollision(-4.9, 12.0), true, 'Center of sofa must collide');

    // North clearance above sofa
    assert.strictEqual(r.checkCollision(-4.9, 10.12), true, 'North edge of sofa (10.12) must collide');
    assert.strictEqual(r.checkCollision(-4.9, 10.119), false, 'Just North of sofa (10.119) is walkable');

    // South clearance below sofa
    assert.strictEqual(r.checkCollision(-4.9, 13.88), true, 'South edge of sofa (13.88) must collide');
    assert.strictEqual(r.checkCollision(-4.9, 13.881), false, 'Just South of sofa (13.881) is walkable');

    // Note on West edge: sofa is at -5.9, West wall is at -6.0 (gap = 0.1m).
    // Player cannot pass between sofa and West wall.
    assert.strictEqual(r.checkCollision(-5.8, 12.0), true, 'Between sofa and West wall is impassable');
    r.destroy();
  });

  challenge('OBS 2.3: Registration desk perimeter collision envelope', () => {
    const r = new LobbyFPSRoom();
    // Reg Desk: minX: 3.8, maxX: 5.9, minZ: 10.2, maxZ: 13.8
    // Expanded with pad (0.38): X in [3.42, 6.28], Z in [9.82, 14.18]
    
    assert.strictEqual(r.checkCollision(4.85, 12.0), true, 'Center of reg desk must collide');
    assert.strictEqual(r.checkCollision(3.42, 12.0), true, 'West edge of reg desk envelope (3.42) must collide');
    assert.strictEqual(r.checkCollision(3.419, 12.0), false, 'Just outside West edge (3.419) must be clear');

    assert.strictEqual(r.checkCollision(4.85, 9.82), true, 'North edge of reg desk envelope (9.82) must collide');
    assert.strictEqual(r.checkCollision(4.85, 9.819), false, 'Just outside North edge (9.819) must be clear');

    assert.strictEqual(r.checkCollision(4.85, 14.18), true, 'South edge of reg desk envelope (14.18) must collide');
    assert.strictEqual(r.checkCollision(4.85, 14.181), false, 'Just outside South edge (14.181) must be clear');

    // Wide 4.49m open central corridor between desk East (-1.07) and reg desk West (3.42)
    assert.strictEqual(r.checkCollision(0.0, 12.0), false, 'Central corridor (X=0.0) must be clear');
    assert.strictEqual(r.checkCollision(1.5, 12.0), false, 'Central corridor (X=1.5) must be clear');
    assert.strictEqual(r.checkCollision(-0.5, 12.0), false, 'Central corridor (X=-0.5) must be clear');

    r.destroy();
  });

  challenge('OBS 2.4: Axis-separated sliding along obstacle walls', () => {
    const r = new LobbyFPSRoom();
    // Place player at X = 0.0, Z = 12.0 (open walkway East of circular desk, West of reg desk)
    r.player.pos.x = 0.0;
    r.player.pos.z = 12.0;
    r.player.yaw = 0; // facing North (-Z)

    // Move diagonally: forward (towards North -Z) and left (towards West -X, hitting circular desk)
    // Circular desk East collision edge is at X = -1.07.
    // If player starts at X = -1.00, Z = 12.0:
    r.player.pos.x = -1.00;
    r.player.pos.z = 12.0;

    // Simulate pressing forward (-Z) and left (-X)
    r.keys.forward = true;
    r.keys.left = true;

    // Run 10 ticks of update(0.016)
    for (let i = 0; i < 10; i++) {
      r.update(0.016);
    }

    // Player should slide along North (-Z), but West movement should be blocked by circular desk!
    assert.ok(r.player.pos.z < 12.0, 'Player must slide along Z in unobstructed axis');
    assert.ok(r.player.pos.x >= -1.07, `Player X (${r.player.pos.x}) must NOT penetrate circular desk (<= -1.07)`);
    assert.strictEqual(r.checkCollision(r.player.pos.x, r.player.pos.z), false, 'Sliding state must remain in valid non-colliding space');

    r.destroy();
  });

  challenge('OBS 2.5: Closed sliding door prevents penetration during forward sprint', () => {
    const r = new LobbyFPSRoom();
    // Place player in front of closed sliding door at X = 4.5, Z = 7.5
    r.player.pos.x = 4.5;
    r.player.pos.z = 7.5;
    r.player.yaw = 0; // Facing North directly toward door
    r.doorOpen = false;
    r.doorProgress = 0.0;

    // Full forward sprint into door
    r.keys.forward = true;
    r.keys.sprint = true;

    // Simulate 60 frames (1 second) of sprinting straight into door
    for (let i = 0; i < 60; i++) {
      r.update(0.016);
    }

    // Player must be stopped at doorway boundary (Z >= 7.38) and not penetrate into corridor
    assert.ok(r.player.pos.z >= 7.38, `Player Z (${r.player.pos.z}) must not penetrate through closed door (min 7.38)`);
    assert.strictEqual(r.checkCollision(r.player.pos.x, r.player.pos.z), false, 'Player position must remain valid');

    r.destroy();
  });

  // =========================================================================
  // VECTOR 3: MULTIPLAYER SPAWN DISTRIBUTION & EXTREME PARAMETER FUZZING
  // =========================================================================
  console.log('\n--- VECTOR 3: MULTIPLAYER SPAWN DISTRIBUTION & FUZZING ---');

  challenge('SPAWN 3.1: Standard player count N = 1, 2, 3, 4 distribution verification', () => {
    const r = new LobbyFPSRoom();

    // N = 1
    const s1_0 = r.getSpawnPosition(0, 1);
    assert.strictEqual(s1_0.x, 0);
    assert.strictEqual(s1_0.y, 1.7);
    assert.strictEqual(s1_0.z, 14.5);
    assert.strictEqual(s1_0.yaw, 0);

    // N = 2
    const s2_0 = r.getSpawnPosition(0, 2);
    const s2_1 = r.getSpawnPosition(1, 2);
    assert.strictEqual(s2_0.x, -0.7);
    assert.strictEqual(s2_1.x, 0.7);
    assert.strictEqual(Number((s2_1.x - s2_0.x).toFixed(2)), 1.4, 'Lateral spacing must be exactly 1.4m');

    // N = 3
    const s3_0 = r.getSpawnPosition(0, 3);
    const s3_1 = r.getSpawnPosition(1, 3);
    const s3_2 = r.getSpawnPosition(2, 3);
    assert.strictEqual(s3_0.x, -1.4);
    assert.strictEqual(s3_1.x, 0.0);
    assert.strictEqual(s3_2.x, 1.4);

    // N = 4
    const s4_0 = r.getSpawnPosition(0, 4);
    const s4_1 = r.getSpawnPosition(1, 4);
    const s4_2 = r.getSpawnPosition(2, 4);
    const s4_3 = r.getSpawnPosition(3, 4);
    assert.strictEqual(s4_0.x, -2.1);
    assert.strictEqual(s4_1.x, -0.7);
    assert.strictEqual(s4_2.x, 0.7);
    assert.strictEqual(s4_3.x, 2.1);

    // Ensure all 4 spawn positions are in non-colliding walkable space
    [s4_0, s4_1, s4_2, s4_3].forEach((s, idx) => {
      assert.strictEqual(r.checkCollision(s.x, s.z), false, `Spawn point P${idx} (X=${s.x}, Z=${s.z}) must be walkable`);
    });

    r.destroy();
  });



  challenge('SPAWN 3.2: Clamping of out-of-range player index (negative or > N-1)', () => {
    const r = new LobbyFPSRoom();

    // playerIndex = -5 should clamp to k = 0
    const under = r.getSpawnPosition(-5, 4);
    assert.strictEqual(under.x, -2.1, 'Negative playerIndex should clamp to first slot');

    // playerIndex = 99 should clamp to k = N - 1
    const over = r.getSpawnPosition(99, 4);
    assert.strictEqual(over.x, 2.1, 'Oversized playerIndex should clamp to last slot');

    r.destroy();
  });

  challenge('SPAWN 3.3: Extreme player counts (N = 0, negative N, large N)', () => {
    const r = new LobbyFPSRoom();

    // N = 0 or negative should default to N = 1
    const zero = r.getSpawnPosition(0, 0);
    assert.strictEqual(zero.x, 0, 'N=0 must treat playerCount as 1');

    const neg = r.getSpawnPosition(0, -10);
    assert.strictEqual(neg.x, 0, 'Negative N must treat playerCount as 1');

    // Large N test: N = 8
    // With N=8, slots span X in [-4.9, +4.9]. Room bounds are [-5.62, +5.62].
    const n8_0 = r.getSpawnPosition(0, 8);
    const n8_7 = r.getSpawnPosition(7, 8);
    assert.strictEqual(n8_0.x, -4.9);
    assert.strictEqual(n8_7.x, 4.9);
    assert.strictEqual(r.checkCollision(n8_0.x, n8_0.z), false, 'N=8 player 0 is inside room');
    assert.strictEqual(r.checkCollision(n8_7.x, n8_7.z), false, 'N=8 player 7 is inside room');

    // Fuzzing extreme N = 20: what happens?
    const n20_0 = r.getSpawnPosition(0, 20);
    // (0 - 19/2) * 1.4 = -13.3m (outside room)
    // Check if checkCollision flags this as out of bounds:
    assert.strictEqual(r.checkCollision(n20_0.x, n20_0.z), true, 'N=20 out-of-bounds spawn correctly flagged by collision');

    r.destroy();
  });

  // =========================================================================
  // VECTOR 4: LIFECYCLE STABILITY, RE-ENTRANCE & CLEANUP
  // =========================================================================
  console.log('\n--- VECTOR 4: LIFECYCLE STABILITY & RESOURCE CLEANUP ---');

  challenge('LIFE 4.1: Rapid lifecycle instantiation and destruction loop (50 cycles)', () => {
    const container = env.document.createElement('div');
    container.id = 'stressLoopContainer';
    env.document.body.appendChild(container);

    for (let i = 0; i < 50; i++) {
      const roomInstance = new LobbyFPSRoom(container);
      roomInstance.start();
      roomInstance.onResize();
      roomInstance.update(0.016);
      roomInstance.stop();
      roomInstance.destroy();
    }
    assert.strictEqual(container.innerHTML, '', 'Container should be cleanly emptied after destroy');
  });

  challenge('LIFE 4.2: Re-entrance resilience (double start, double stop, double destroy)', () => {
    const container = env.document.createElement('div');
    container.id = 'reentranceContainer';
    env.document.body.appendChild(container);

    const r = new LobbyFPSRoom(container);
    // Double start
    r.start();
    r.start();
    assert.strictEqual(r.isRunning, true);

    // Double stop
    r.stop();
    r.stop();
    assert.strictEqual(r.isRunning, false);

    // Double destroy
    r.destroy();
    r.destroy();
    assert.strictEqual(r.isRunning, false);
  });

  challenge('LIFE 4.3: Door state cycle stress test (rapid toggle)', () => {
    const r = new LobbyFPSRoom();
    assert.strictEqual(r.doorState, 'closed');
    assert.strictEqual(r.doorOpen, false);

    for (let i = 0; i < 20; i++) {
      r.toggleDoors();
      r.update(0.05);
    }

    // Clean open then clean close
    r.openDoors();
    for (let i = 0; i < 30; i++) r.update(0.05); // allow full opening
    assert.strictEqual(r.doorState, 'open');
    assert.strictEqual(r.doorProgress, 1.0);

    r.closeDoors();
    for (let i = 0; i < 30; i++) r.update(0.05); // allow full closing
    assert.strictEqual(r.doorState, 'closed');
    assert.strictEqual(r.doorProgress, 0.0);

    r.destroy();
  });

  // =========================================================================
  // VECTOR 5: ADVANCED ADVERSARIAL STRESS SCENARIOS
  // =========================================================================
  console.log('\n--- VECTOR 5: ADVANCED ADVERSARIAL STRESS SCENARIOS ---');

  challenge('ADV 5.1: Lag spike & delta time clamping (dt = 10s clamped to 0.1s max displacement)', () => {
    const r = new LobbyFPSRoom();
    r.player.pos.x = 0;
    r.player.pos.z = 14.5;
    r.keys.forward = true;
    r.keys.sprint = true;

    // A massive 10-second lag spike (e.g. browser tab suspended)
    r.update(10.0);

    // Max sprint speed is 3.8 * 1.65 = 6.27 m/s.
    // With dt clamped to 0.1s, max displacement is 0.627m.
    const displacement = 14.5 - r.player.pos.z;
    assert.ok(displacement <= 0.63, `Displacement during lag spike (${displacement}m) must be clamped to <= 0.63m`);
    assert.ok(displacement > 0.60, `Displacement (${displacement}m) should match 0.1s of sprinting`);

    r.destroy();
  });

  challenge('ADV 5.2: Event listener cleanup verification on window', () => {
    // Track added/removed listeners on mock window
    const listeners = { keydown: 0, keyup: 0, resize: 0 };
    const origAdd = env.window.addEventListener;
    const origRemove = env.window.removeEventListener;

    env.window.addEventListener = (evt, fn) => {
      if (listeners[evt] !== undefined) listeners[evt]++;
      if (origAdd) origAdd.call(env.window, evt, fn);
    };
    env.window.removeEventListener = (evt, fn) => {
      if (listeners[evt] !== undefined) listeners[evt]--;
      if (origRemove) origRemove.call(env.window, evt, fn);
    };

    const container = env.document.createElement('div');
    container.id = 'eventTestContainer';
    env.document.body.appendChild(container);

    const r = new LobbyFPSRoom(container);
    assert.strictEqual(listeners.keydown, 1, 'keydown listener should be attached');
    assert.strictEqual(listeners.keyup, 1, 'keyup listener should be attached');
    assert.strictEqual(listeners.resize, 1, 'resize listener should be attached');

    r.destroy();

    assert.strictEqual(listeners.keydown, 0, 'keydown listener must be cleaned up on destroy');
    assert.strictEqual(listeners.keyup, 0, 'keyup listener must be cleaned up on destroy');
    assert.strictEqual(listeners.resize, 0, 'resize listener must be cleaned up on destroy');

    // Restore
    env.window.addEventListener = origAdd;
    env.window.removeEventListener = origRemove;
  });

  challenge('ADV 5.3: Proximity detection and active interactable distance thresholds', () => {
    const r = new LobbyFPSRoom();

    // 1. Reception Monitor at X=4.85, Z=12.0 (maxDist = 3.5m)
    r.player.pos.x = 4.85;
    r.player.pos.z = 12.0;
    r.checkInteractions();
    assert.ok(r.activeInteractable, 'Must detect interactable at monitor');
    assert.strictEqual(r.activeInteractable.type, 'monitor_lobby');

    // Step to distance 3.4m -> still active
    r.player.pos.x = 4.85 - 3.4;
    r.checkInteractions();
    assert.strictEqual(r.activeInteractable?.type, 'monitor_lobby');

    // Step to distance 3.6m (> 3.5m) -> inactive
    r.player.pos.x = 4.85 - 3.6;
    r.checkInteractions();
    assert.notStrictEqual(r.activeInteractable?.type, 'monitor_lobby', 'Must deactivate beyond 3.5m');

    // 2. Keycard scanner at X=3.3, Z=7.3 (maxDist = 3.0m)
    r.player.pos.x = 3.3;
    r.player.pos.z = 7.3;
    r.checkInteractions();
    assert.ok(r.activeInteractable, 'Must detect interactable at scanner');
    assert.strictEqual(r.activeInteractable.type, 'keycard_scanner');

    // Step to distance 3.2m (> 3.0m) -> inactive
    r.player.pos.z = 7.3 + 3.2;
    r.checkInteractions();
    assert.notStrictEqual(r.activeInteractable?.type, 'keycard_scanner', 'Must deactivate beyond 3.0m');

    r.destroy();
  });

  challenge('ADV 5.4: Diagonal sliding into gateway door jamb corner (X=3.98, Z=7.38)', () => {
    const r = new LobbyFPSRoom();
    // Position near left jamb of closed door
    r.player.pos.x = 3.90;
    r.player.pos.z = 7.45;
    r.player.yaw = 0; // Facing North
    r.doorOpen = false;
    r.doorProgress = 0.0;

    // Move forward and right (towards doorway opening)
    r.keys.forward = true;
    r.keys.right = true;

    for (let i = 0; i < 20; i++) {
      r.update(0.016);
    }

    // Door is closed, so Z must not penetrate past 7.38
    assert.ok(r.player.pos.z >= 7.38, 'Z must not penetrate closed door threshold');
    // But rightward movement (X) should slide player towards door center
    assert.ok(r.player.pos.x > 3.90, 'X must slide rightwards unobstructed');
    assert.strictEqual(r.checkCollision(r.player.pos.x, r.player.pos.z), false, 'Corner sliding must keep player in valid space');

    r.destroy();
  });

  // Summary
  console.log('\n================================================================================');
  console.log(`STRESS HARNESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('================================================================================\n');

  if (failed > 0) {
    throw new Error(`${failed} stress test challenges failed!`);
  }

  return { passed, failed, findings };
}

if (require.main === module) {
  runStressTests();
}

module.exports = { runStressTests };
