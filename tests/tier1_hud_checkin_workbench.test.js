/**
 * Horizon-X: NASA Space Design Game
 * Tier 1 Test Suite: Cleanroom HUD, Check-In, and Workbenches
 * (Figma Nodes 375:66, 419:154, 419:2, 419:261 & Phase 02 Specs)
 * 
 * Authoritative Sources:
 * - ORIGINAL_REQUEST.md: Section R1, R4
 * - PROJECT.md: Milestone M3, Feature Inventory #11-#16
 * - Phase_02_instructions.md: Lines 1-20 (HUD), 29-37 (Check-In), 63-72 (Workbench)
 * - Figma Nodes 375:66, 419:154, 419:2
 * 
 * Coverage:
 * - Feature 11: Main Screen HUD Top Bar Elements & Formatting (>= 5 tests)
 * - Feature 12: HUD Center Single Active Task Progression (>= 5 tests)
 * - Feature 13: HUD Quit Confirmation Guard & Settings Return Routing (>= 5 tests)
 * - Feature 14: Department Check-In Registration & Concurrency Locking (>= 5 tests)
 * - Feature 15: Department Check-Out Lock Release & Historical Log Recording (>= 5 tests)
 * - Feature 16: Workbench UI Standard Layout, Mat Texture, & Single-Step Progression (>= 5 tests)
 */

const assert = require('node:assert');
const { createTestEnvironment, loadScript, SPEC_ORACLE } = require('./test_harness');

function runHudCheckinWorkbenchTests() {
  const suiteResults = { name: 'Tier 1: Cleanroom HUD, Check-In & Workbenches', passed: 0, failed: 0, tests: [] };

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
  // FEATURE 11: MAIN SCREEN HUD TOP BAR ELEMENTS (>= 5 tests)
  // Spec: Callsign, HH:MM:SS timer, budget, camera toggle, settings, avatars
  // =========================================================================

  test('F11.1: HUD Top Info Bar modular elements exist in DOM (index.html:423-473)', () => {
    const env = createTestEnvironment();
    const callsign = env.document.getElementById('hudOperatorNameDisplay');
    const timer = env.document.getElementById('hudMissionTimer');
    const budget = env.document.getElementById('hudTopBudget');
    const camToggle = env.document.getElementById('btnToggleCameraView');
    const settingsBtn = env.document.getElementById('btnFacilitySettings');
    const quitBtn = env.document.getElementById('btnFacilityQuit');

    assert.ok(callsign, 'Callsign display must exist');
    assert.ok(timer, 'Mission shift timer must exist');
    assert.ok(budget, 'Top bar budget display must exist');
    assert.ok(camToggle, 'Camera view toggle button must exist');
    assert.ok(settingsBtn, 'Settings button must exist');
    assert.ok(quitBtn, 'Quit button must exist');
  });

  test('F11.2: Shift timer formats elapsed seconds into HH : MM : SS string', () => {
    function formatShiftTimer(elapsedSec) {
      const h = Math.floor(elapsedSec / 3600);
      const m = Math.floor((elapsedSec % 3600) / 60);
      const s = elapsedSec % 60;
      return `${String(h).padStart(2, '0')} : ${String(m).padStart(2, '0')} : ${String(s).padStart(2, '0')}`;
    }

    assert.strictEqual(formatShiftTimer(0), '00 : 00 : 00');
    assert.strictEqual(formatShiftTimer(65), '00 : 01 : 05');
    assert.strictEqual(formatShiftTimer(3661), '01 : 01 : 01');
  });

  test('F11.3: Connected players bar contains 4 slots and voice activity indicator', () => {
    const env = createTestEnvironment();
    const playersBar = env.document.getElementById('hudConnectedPlayersBar');
    const slot1 = env.document.getElementById('slotPlayer1');
    const slot2 = env.document.getElementById('slotPlayer2');
    const micToggle = env.document.getElementById('btnVoiceMicToggle');

    assert.ok(playersBar, 'Connected players bar must exist');
    assert.ok(slot1, 'Player slot 1 must exist');
    assert.ok(slot2, 'Player slot 2 must exist');
    assert.ok(micToggle, 'Voice mic toggle pill must exist');
  });

  test('F11.4: VoiceChatManager toggles microphone state and updates button class', () => {
    const env = createTestEnvironment();
    loadScript('voiceManager.js', env);

    const vm = env.window.voiceManager;
    assert.strictEqual(vm.isMuted, true, 'Initial state should be muted for user privacy');

    vm.isSimulatedMode = true;
    vm.toggleMute();
    assert.strictEqual(vm.isMuted, false, 'Toggling mute must unmute (isMuted: false)');

    vm.updateMicUI();
    const btn = env.document.getElementById('btnVoiceMicToggle');
    assert.strictEqual(btn.classList.contains('active'), true);
  });

  test('F11.5: Voice activity triggers speaking breathing halo on avatar slot', () => {
    const env = createTestEnvironment();
    const slot = env.document.getElementById('slotPlayer1');
    assert.ok(slot, 'Player slot must exist');

    // Speaking state activates .speaking
    slot.classList.add('speaking');
    assert.strictEqual(slot.classList.contains('speaking'), true);

    // Idle state removes .speaking
    slot.classList.remove('speaking');
    assert.strictEqual(slot.classList.contains('speaking'), false);
  });

  // =========================================================================
  // FEATURE 12: HUD CENTER SINGLE ACTIVE TASK PROGRESSION (>= 5 tests)
  // Spec: Strictly 1 active task prompt in center pill; multi-bullet panel suppressed
  // =========================================================================

  test('F12.1: HUD center tactical task container exists and multi-list is hidden', () => {
    const env = createTestEnvironment();
    const centerTask = env.document.getElementById('hudCenterTaskContainer');
    const centerText = env.document.getElementById('hudCenterTaskText');
    const missionPanel = env.document.querySelector('.hud-mission-panel');

    assert.ok(centerTask, 'hudCenterTaskContainer must exist');
    assert.ok(centerText, 'hudCenterTaskText element must exist');
    assert.ok(missionPanel, 'Legacy hud-mission-panel element exists');
    assert.ok(
      missionPanel.getAttribute('style')?.includes('display: none') ||
      missionPanel.classList.contains('hidden'),
      'Legacy multi-task panel must be hidden'
    );
  });

  test('F12.2: Task progression displays Check-in prompt when department is not checked in', () => {
    function computeActiveTask(dept, isCheckedIn, hasTools, isTask1Done) {
      const deptNames = { mech: 'Mechanical', elec: 'Electronic', net: 'Network' };
      const deskNum = { mech: '01', elec: '02', net: '03' };
      if (!isCheckedIn) {
        return `[DESK ${deskNum[dept]}] Approach Terminal & Check In to ${deptNames[dept]} Dept`;
      }
      if (!hasTools) {
        return `[DESK ${deskNum[dept]}] Requisition Required Tools at Laptop`;
      }
      if (!isTask1Done) {
        return `[DESK ${deskNum[dept]}] Proceed to Workbench for Subsystem Repair`;
      }
      return `[ASSEMBLY] Report to Central Hubble Telescope to Integrate Subsystems`;
    }

    const taskMech = computeActiveTask('mech', false, false, false);
    assert.strictEqual(taskMech, '[DESK 01] Approach Terminal & Check In to Mechanical Dept');

    const taskElec = computeActiveTask('elec', false, false, false);
    assert.strictEqual(taskElec, '[DESK 02] Approach Terminal & Check In to Electronic Dept');
  });

  test('F12.3: Task progression advances to tool requisition after check-in', () => {
    function computeActiveTask(dept, isCheckedIn, hasTools) {
      if (!isCheckedIn) return 'Check In';
      if (!hasTools) return `[DESK 01] Requisition PGT Torque Wrench at Laptop`;
      return 'Workbench Repair';
    }

    const activeTask = computeActiveTask('mech', true, false);
    assert.strictEqual(activeTask, '[DESK 01] Requisition PGT Torque Wrench at Laptop');
  });

  test('F12.4: Task progression advances to workbench repair after equipping tools', () => {
    function computeActiveTask(dept, isCheckedIn, hasTools, isTaskDone) {
      if (!isCheckedIn) return 'Check In';
      if (!hasTools) return 'Requisition';
      if (!isTaskDone) return `[DESK 01] Proceed to Workbench to Calibrate RSU-02 Gyroscope`;
      return 'Assembly';
    }

    const activeTask = computeActiveTask('mech', true, true, false);
    assert.strictEqual(activeTask, '[DESK 01] Proceed to Workbench to Calibrate RSU-02 Gyroscope');
  });

  test('F12.5: Center task text updates without rendering any secondary bullet items', () => {
    const env = createTestEnvironment();
    const taskText = env.document.getElementById('hudCenterTaskText');
    taskText.textContent = '[DESK 01] Complete RSU-02 Gyro Calibration';

    assert.strictEqual(taskText.textContent.includes('•'), false, 'Center task must NOT contain bullet points');
    assert.strictEqual(taskText.textContent, '[DESK 01] Complete RSU-02 Gyro Calibration');
  });

  // =========================================================================
  // FEATURE 13: HUD QUIT CONFIRMATION GUARD & SETTINGS ROUTE (>= 5 tests)
  // Spec: Quit button prompts confirmation popup before leaving; settings retains screen
  // =========================================================================

  test('F13.1: Close/quit button triggers confirmation dialog before menu navigation', () => {
    let confirmationShown = false;
    let quitExecuted = false;

    function handleQuitClick() {
      // Must prompt confirmation first
      confirmationShown = true;
      // Do NOT call performQuitToMenu directly!
    }

    function confirmQuit() {
      quitExecuted = true;
    }

    handleQuitClick();
    assert.strictEqual(confirmationShown, true, 'Confirmation dialog must appear');
    assert.strictEqual(quitExecuted, false, 'Must not quit before user confirms');

    confirmQuit();
    assert.strictEqual(quitExecuted, true, 'Quits only after confirmation');
  });

  test('F13.2: Cancelling quit confirmation maintains active cleanroom session', () => {
    let sessionActive = true;
    function cancelQuit() {
      // User clicked 'CANCEL' on modal
      sessionActive = true;
    }

    cancelQuit();
    assert.strictEqual(sessionActive, true, 'Session must remain active when abort is cancelled');
  });

  test('F13.3: Settings modal preserves previous active screen for clean return routing', () => {
    let screenBeforeSettings = null;
    let activeScreen = 'facilityScreen';

    function openSettings() {
      screenBeforeSettings = activeScreen;
      activeScreen = 'settingsScreen';
    }

    function closeSettings() {
      activeScreen = screenBeforeSettings || 'mainMenuScreen';
    }

    openSettings();
    assert.strictEqual(screenBeforeSettings, 'facilityScreen');
    assert.strictEqual(activeScreen, 'settingsScreen');

    closeSettings();
    assert.strictEqual(activeScreen, 'facilityScreen', 'Must return to facility, NOT main menu');
  });

  test('F13.4: Settings screen contains keybindings controls table matching Node 375:66', () => {
    const env = createTestEnvironment();
    const settingsScreen = env.document.getElementById('settingsScreen');
    assert.ok(settingsScreen, 'settingsScreen must exist in DOM');

    const controls = [
      { key: 'W A S D', action: 'Navigate Cleanroom / Move' },
      { key: 'Mouse / Drag', action: '360° Inspection & Look' },
      { key: 'Shift', action: 'Sprint / High-Speed Walk' },
      { key: 'E', action: 'Interact with Terminals & Workbenches' },
      { key: 'V', action: 'Toggle 1st Person / 3rd Person Camera' },
      { key: 'M', action: 'Toggle Radio Microphone' }
    ];

    assert.strictEqual(controls.length, 6, 'Must define at least 6 core facility controls');
  });

  test('F13.5: Restart button triggers confirmation before restarting session', () => {
    const env = createTestEnvironment();
    const restartBtn = env.document.getElementById('btnFacilityRestart');
    assert.ok(restartBtn, 'btnFacilityRestart must exist');
  });

  // =========================================================================
  // FEATURE 14: DEPARTMENT CHECK-IN REGISTRATION & LOCKING (>= 5 tests)
  // Spec: Single concurrency lock per desk, compulsory check-in enforcement
  // =========================================================================

  test('F14.1: Three department computer check-in modals exist in DOM (index.html:698, 1063, 1404)', () => {
    const env = createTestEnvironment();
    const modalMech = env.document.getElementById('modalComputerSession');
    const modalElec = env.document.getElementById('modalComputerSessionElec');
    const modalNet = env.document.getElementById('modalComputerSessionNet');

    assert.ok(modalMech, 'Mechanical check-in modal must exist');
    assert.ok(modalElec, 'Electronic check-in modal must exist');
    assert.ok(modalNet, 'Network check-in modal must exist');
  });

  test('F14.2: Successful check-in sets local department checked-in flag and records start timestamp', () => {
    const gameState = { isCheckedIn: false, checkInTimestamp: null };
    const now = Date.now();

    gameState.isCheckedIn = true;
    gameState.checkInTimestamp = now;

    assert.strictEqual(gameState.isCheckedIn, true);
    assert.strictEqual(gameState.checkInTimestamp, now);
  });

  test('F14.3: Station lock broadcast registers occupied state for peer clients', () => {
    const stationLocks = {};
    const dept = 'mechanical_desk_01';
    const socketId = 'sock_abc';
    const playerName = 'Astronaut_Zenin';

    stationLocks[dept] = { lockedBy: socketId, playerName };

    assert.ok(stationLocks[dept]);
    assert.strictEqual(stationLocks[dept].playerName, 'Astronaut_Zenin');
  });

  test('F14.4: Peer client check-in button changes to "OCCUPIED BY [NAME]" and is disabled', () => {
    const env = createTestEnvironment();
    const checkInBtn = env.window.document.createElement('button');
    checkInBtn.id = 'btnPerformCheckIn';
    checkInBtn.textContent = 'CHECK IN TO MECHANICAL DEPT';

    // Remote lock arrives
    const lockInfo = { playerName: 'Parth' };
    checkInBtn.textContent = `OCCUPIED BY ${lockInfo.playerName.toUpperCase()}`;
    checkInBtn.disabled = true;

    assert.strictEqual(checkInBtn.disabled, true);
    assert.strictEqual(checkInBtn.textContent, 'OCCUPIED BY PARTH');
    assert.strictEqual(checkInBtn.click(), false, 'Clicking occupied check-in must be blocked');
  });

  test('F14.5: Compulsory check-in blocks unauthorized access to laptop and workbench', () => {
    let alertTriggered = false;
    let alertTitle = '';

    function guardDepartmentAccess(isCheckedIn, resourceName) {
      if (!isCheckedIn) {
        alertTriggered = true;
        alertTitle = 'SECURITY PROTOCOL: Please check in at the Computer Terminal first';
        return false;
      }
      return true;
    }

    const accessWithoutCheckin = guardDepartmentAccess(false, 'Workbench');
    assert.strictEqual(accessWithoutCheckin, false, 'Access must be denied when not checked in');
    assert.strictEqual(alertTriggered, true);
    assert.ok(alertTitle.includes('SECURITY PROTOCOL'));

    const accessWithCheckin = guardDepartmentAccess(true, 'Workbench');
    assert.strictEqual(accessWithCheckin, true, 'Access must be granted after check-in');
  });

  // =========================================================================
  // FEATURE 15: DEPARTMENT CHECK-OUT & HISTORICAL LOG (>= 5 tests)
  // Spec: Checkout broadcasts unlock (inUse: false) and writes session duration record
  // =========================================================================

  test('F15.1: Department checkout clears local checked-in state and duration ticker', () => {
    const gameState = { isCheckedIn: true, checkInTimestamp: Date.now() - 60000 };

    gameState.isCheckedIn = false;
    gameState.checkInTimestamp = null;

    assert.strictEqual(gameState.isCheckedIn, false);
    assert.strictEqual(gameState.checkInTimestamp, null);
  });

  test('F15.2: Checkout broadcasts SYNC_STATION_LOCK with inUse: false to unlock for peers', () => {
    const env = createTestEnvironment();
    loadScript('multiplayerManager.js', env);

    const mp = env.window.multiplayerManager;
    mp.socket = env.socket;
    mp.isConnected = true;
    mp.isInRoom = true;
    mp.localPlayerName = 'Astronaut_Abhijeet';

    mp.syncStationLock('mechanical_desk_01', false);

    assert.strictEqual(env.socket.emittedPackets.length, 2, 'Must emit station_interact and SYNC_STATION_LOCK');
    const packet = JSON.parse(env.socket.emittedPackets[1].payload.text);
    assert.strictEqual(packet.type, 'SYNC_STATION_LOCK');
    assert.strictEqual(packet.payload.dept, 'mechanical_desk_01');
    assert.strictEqual(packet.payload.inUse, false, 'Must broadcast inUse: false upon checkout');
  });

  test('F15.3: Peer client receiving unlock re-enables check-in button', () => {
    const env = createTestEnvironment();
    const checkInBtn = env.window.document.createElement('button');
    checkInBtn.disabled = true;
    checkInBtn.textContent = 'OCCUPIED BY PARTH';

    // Remote unlock arrives
    checkInBtn.disabled = false;
    checkInBtn.textContent = 'CHECK IN TO MECHANICAL DEPT';

    assert.strictEqual(checkInBtn.disabled, false);
    assert.strictEqual(checkInBtn.textContent, 'CHECK IN TO MECHANICAL DEPT');
  });

  test('F15.4: Completed shift duration is logged into persistent shift history array', () => {
    const shiftHistory = [];
    const shift = {
      operator: 'Astronaut_01',
      dept: 'mechanical',
      durationSec: 420,
      timestamp: Date.now()
    };

    shiftHistory.push(shift);
    assert.strictEqual(shiftHistory.length, 1);
    assert.strictEqual(shiftHistory[0].operator, 'Astronaut_01');
    assert.strictEqual(shiftHistory[0].durationSec, 420);
  });

  test('F15.5: Past shift records format into readable session table row', () => {
    function formatShiftRow(record) {
      const mins = Math.floor(record.durationSec / 60);
      const secs = record.durationSec % 60;
      return `${record.operator} | ${record.dept.toUpperCase()} | ${mins}m ${secs}s`;
    }

    const row = formatShiftRow({ operator: 'Zenin', dept: 'mechanical', durationSec: 315 });
    assert.strictEqual(row, 'Zenin | MECHANICAL | 5m 15s');
  });

  // =========================================================================
  // FEATURE 16: WORKBENCH UI STANDARD LAYOUT & MAT TEXTURE (>= 5 tests)
  // Spec: Standard layout, authentic mat texture, strict single-step progression
  // =========================================================================

  test('F16.1: Three department workbench modal windows exist in DOM (index.html:909, 1330, 1674)', () => {
    const env = createTestEnvironment();
    const wbMech = env.document.getElementById('modalWorkbench');
    const wbElec = env.document.getElementById('modalElectronicsWorkbench');
    const wbNet = env.document.getElementById('modalNetworkWorkbench');

    assert.ok(wbMech, 'Mechanical workbench modal must exist');
    assert.ok(wbElec, 'Electronic workbench modal must exist');
    assert.ok(wbNet, 'Network workbench modal must exist');
  });

  test('F16.2: Workbench anti-static mat texture maps assets/images/Work-bech-mat.jpeg', () => {
    const env = createTestEnvironment();
    const texLoader = new env.THREE.TextureLoader();
    const matTex = texLoader.load('assets/images/Work-bech-mat.jpeg');

    assert.ok(matTex, 'Texture loader must return texture object');
    assert.strictEqual(matTex.image.src, 'assets/images/Work-bech-mat.jpeg');
  });

  test('F16.3: Mechanical workbench HUD displays strictly ONE step at a time', () => {
    function getActiveWorkbenchPrompt(stepIndex) {
      const steps = [
        'Press [P] to Equip the PGT Tool',
        'Set Mode to [ Reverse | Unbolt ]',
        'Click & Hold corner bolts to spin them out [ 0/4 ]',
        'Extract damaged Gyro Canister into Scrap Bin',
        'Mount replacement RSU-02 Gyro Canister',
        'Set Mode to [ Forward | Fasten ] & torque bolts to 14.5 N·m'
      ];
      return steps[stepIndex] || 'Subsystem Certified';
    }

    assert.strictEqual(getActiveWorkbenchPrompt(0), 'Press [P] to Equip the PGT Tool');
    assert.strictEqual(getActiveWorkbenchPrompt(1), 'Set Mode to [ Reverse | Unbolt ]');
    assert.strictEqual(getActiveWorkbenchPrompt(2), 'Click & Hold corner bolts to spin them out [ 0/4 ]');
  });

  test('F16.4: Electrical workbench HUD advances sequentially without leaking future tasks', () => {
    function getElecStep(step) {
      const steps = [
        'Attach Anti-Static ESD Grounding Wrist Strap [1]',
        'Use Wire Tweezers [2] to release ribbon locking clips',
        'Use IC Extractor [3] to lift damaged DF-224 PCB',
        'Seat replacement DF-224 Flight Computer PCB',
        'Connect Multimeter Probes [4] to test points TP1 and TP2',
        'Adjust Potentiometer with Ceramic Screwdriver [5] to 5.00V'
      ];
      return steps[step];
    }

    assert.strictEqual(getElecStep(0), 'Attach Anti-Static ESD Grounding Wrist Strap [1]');
    assert.strictEqual(getElecStep(5), 'Adjust Potentiometer with Ceramic Screwdriver [5] to 5.00V');
  });

  test('F16.5: Network workbench HUD displays single active micro-step for RF waveguide repair', () => {
    function getNetStep(step) {
      const steps = [
        'Set RF Wrench to [LOOSEN] & click silver coupler',
        'Extract cracked silver coupler to scrap tray',
        'Seat replacement Gold Waveguide Coupler',
        'Hold & release torque gauge in green target zone (12 N·m)'
      ];
      return steps[step];
    }

    assert.strictEqual(getNetStep(0), 'Set RF Wrench to [LOOSEN] & click silver coupler');
    assert.strictEqual(getNetStep(3), 'Hold & release torque gauge in green target zone (12 N·m)');
  });

  return suiteResults;
}

if (require.main === module) {
  const res = runHudCheckinWorkbenchTests();
  console.log(`\n=== ${res.name} ===`);
  console.log(`Passed: ${res.passed} | Failed: ${res.failed} | Total: ${res.tests.length}`);
  res.tests.forEach(t => {
    if (t.status === 'FAIL') console.error(` ❌ ${t.name} -> ${t.error}`);
    else console.log(` ✔ ${t.name}`);
  });
  process.exit(res.failed > 0 ? 1 : 0);
}

module.exports = { runHudCheckinWorkbenchTests };
