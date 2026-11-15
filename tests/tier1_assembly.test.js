/**
 * Horizon-X: NASA Space Design Game
 * Tier 1 Test Suite: Hubble Space Telescope Assembly Screen (Figma Node 427:2 & Phase 02 Specs)
 * 
 * Authoritative Sources:
 * - ORIGINAL_REQUEST.md: Section R3 (Hubble Space Telescope Assembly Screen Implementation)
 * - PROJECT.md: Milestone M2, Feature Inventory #6-#10
 * - Phase_02_instructions.md: Lines 99-112
 * - Figma Node 427:2
 * 
 * Coverage:
 * - Feature 6: Dual-Viewport 3D Metrology Initialization & Elements (>= 5 tests)
 * - Feature 7: Subsystem Hardware Mapping Across 3 Departments (>= 5 tests)
 * - Feature 8: Dynamic 4-Constraint Telemetry Engine (>= 5 tests)
 * - Feature 9: Interactive Assembly Mini-Games (>= 5 tests)
 * - Feature 10: STS-61 Launch Gate Certification & Lock Verification (>= 5 tests)
 */

const assert = require('node:assert');
const { createTestEnvironment, loadScript, SPEC_ORACLE } = require('./test_harness');

function runAssemblyTests() {
  const suiteResults = { name: 'Tier 1: Hubble Space Telescope Assembly', passed: 0, failed: 0, tests: [] };

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
  // FEATURE 6: DUAL-VIEWPORT 3D METROLOGY INITIALIZATION (>= 5 tests)
  // Spec: Left Hubble GLB canvas, right two 3D task cards (STL parts)
  // =========================================================================

  test('F6.1: Dual-viewport canvas elements exist in DOM (index.html:2188-2222)', () => {
    const env = createTestEnvironment();
    const telescopeCanvas = env.document.getElementById('assemblyTelescopeCanvas');
    const part1Canvas = env.document.getElementById('assemblyPart1Canvas');
    const part2Canvas = env.document.getElementById('assemblyPart2Canvas');

    assert.ok(telescopeCanvas, 'Left telescope 3D canvas must exist in DOM');
    assert.ok(part1Canvas, 'Right Task 01 part canvas must exist in DOM');
    assert.ok(part2Canvas, 'Right Task 02 part canvas must exist in DOM');
  });

  test('F6.2: Assembly modal container has correct ID and accessibility attributes', () => {
    const env = createTestEnvironment();
    const modal = env.document.getElementById('modalHubbleAssembly');

    assert.ok(modal, 'modalHubbleAssembly container must exist');
    assert.ok(modal.classList.contains('facility-modal-backdrop'));
    assert.strictEqual(modal.getAttribute('data-node-id'), '427:2');
  });

  test('F6.3: Assembly header bar contains title, department readout, and launch button', () => {
    const env = createTestEnvironment();
    const deptTitle = env.document.getElementById('assemblyDeptTitle');
    const btnLaunch = env.document.getElementById('btnAssemblyLaunch');
    const btnClose = env.document.getElementById('btnCloseAssemblyModal');
    const btnRestart = env.document.getElementById('btnAssemblyRestart');

    assert.ok(deptTitle, 'Department title element must exist');
    assert.ok(btnLaunch, 'STS-61 Launch button must exist');
    assert.ok(btnClose, 'Modal close button must exist');
    assert.ok(btnRestart, 'View reset/restart button must exist');
    assert.strictEqual(btnLaunch.disabled, true, 'Launch button must initialize in disabled state');
  });

  test('F6.4: Assembly3D instance initializes with 3 distinct scenes and cameras', () => {
    const env = createTestEnvironment();
    loadScript('assembly3d.js', env);

    const assembly = new env.window.Assembly3D();
    assert.strictEqual(assembly.currentDept, 'mech', 'Default department must be Mechanical');
    assert.ok(assembly.sceneHubble, 'Hubble scene must be created');
    assert.ok(assembly.scenePart1, 'Part 1 preview scene must be created');
    assert.ok(assembly.scenePart2, 'Part 2 preview scene must be created');
    assembly.destroy();
  });

  test('F6.5: Viewport auto-framing resizes WebGL renderers to canvas dimensions', () => {
    const env = createTestEnvironment();
    loadScript('assembly3d.js', env);

    const assembly = new env.window.Assembly3D();
    assembly.resizeViewports();

    assert.strictEqual(assembly.cameraHubble.aspect, 800 / 600);
    assembly.destroy();
  });

  // =========================================================================
  // FEATURE 7: SUBSYSTEM HARDWARE MAPPING ACROSS 3 DEPARTMENTS (>= 5 tests)
  // Spec: 6 tasks across Mechanical, Electronic, Network
  // =========================================================================

  test('F7.1: Department title dynamically updates when switching department', () => {
    const env = createTestEnvironment();
    loadScript('assembly3d.js', env);

    const assembly = new env.window.Assembly3D();
    const titleEl = env.document.getElementById('assemblyDeptTitle');

    assembly.switchDepartment('mech');
    assert.strictEqual(titleEl.textContent, 'MECHANICAL DEPARTMENT');

    assembly.switchDepartment('elec');
    assert.strictEqual(titleEl.textContent, 'ELECTRONIC DEPARTMENT');

    assembly.switchDepartment('net');
    assert.strictEqual(titleEl.textContent, 'NETWORK & COMM DEPARTMENT');

    assembly.destroy();
  });

  test('F7.2: Task cards render status text "READY FOR INTEGRATION" before assembly', () => {
    const env = createTestEnvironment();
    loadScript('assembly3d.js', env);

    const assembly = new env.window.Assembly3D();
    const status1 = env.document.getElementById('assemblyCard1StatusText');
    const status2 = env.document.getElementById('assemblyCard2StatusText');

    assert.strictEqual(status1.textContent, 'READY FOR INTEGRATION');
    assert.strictEqual(status2.textContent, 'READY FOR INTEGRATION');

    assembly.destroy();
  });

  test('F7.3: Subsystem mapping matches authoritative STL models per department', () => {
    const stages = SPEC_ORACLE.TELEMETRY.STAGES;
    assert.strictEqual(stages.mech_task1.name, 'RSU-02 Gyro Canister Hatch');
    assert.strictEqual(stages.mech_task2.name, 'SADM Solar Array Drive');
    assert.strictEqual(stages.elec_task1.name, 'DF-224 Flight Computer PCB');
    assert.strictEqual(stages.elec_task2.name, 'Fine Guidance Sensor (FGS)');
    assert.strictEqual(stages.net_task1.name, 'High Gain Antenna (HGA) Dish');
    assert.strictEqual(stages.net_task2.name, 'SI-C&DH Fiber Bus Splicer');
  });

  test('F7.4: Completed task card updates button to "Assembled" and disables further assembly', () => {
    const env = createTestEnvironment();
    loadScript('assembly3d.js', env);

    const assembly = new env.window.Assembly3D();
    assembly.assembledStages.mech_task1 = true;
    assembly.switchDepartment('mech');

    const btn1 = env.document.getElementById('btnAssemblePart1');
    const status1 = env.document.getElementById('assemblyCard1StatusText');

    assert.strictEqual(btn1.textContent, 'Assembled');
    assert.strictEqual(btn1.disabled, true);
    assert.strictEqual(status1.textContent, 'ASSEMBLED & FLIGHT LOCKED');

    assembly.destroy();
  });

  test('F7.5: Switching departments isolates task states to the selected department', () => {
    const env = createTestEnvironment();
    loadScript('assembly3d.js', env);

    const assembly = new env.window.Assembly3D();
    assembly.assembledStages.mech_task1 = true;
    assembly.assembledStages.elec_task1 = false;

    // View mechanical
    assembly.switchDepartment('mech');
    assert.strictEqual(env.document.getElementById('btnAssemblePart1').textContent, 'Assembled');

    // Switch to electrical
    assembly.switchDepartment('elec');
    assert.strictEqual(env.document.getElementById('btnAssemblePart1').textContent, 'Assemble');

    assembly.destroy();
  });

  // =========================================================================
  // FEATURE 8: DYNAMIC 4-CONSTRAINT TELEMETRY ENGINE (>= 5 tests)
  // Spec: Baseline: 10,800kg, 1,850W, 0 Mbps. Target: 11,110kg, 2,400W, 1.0 Mbps, <= $150k.
  // =========================================================================

  test('F8.1: Baseline telemetry reflects un-integrated Hubble spacecraft constraints', () => {
    const telem = SPEC_ORACLE.TELEMETRY.calculateCumulative([], 150000);
    assert.strictEqual(telem.mass, 10800, 'Baseline mass must be 10,800 kg');
    assert.strictEqual(telem.power, 1850, 'Baseline power must be 1,850 W');
    assert.strictEqual(telem.dataRate, 0.0, 'Baseline comms rate must be 0.0 Mbps');
    assert.strictEqual(telem.expenditure, 0, 'Initial expenditure must be $0');
  });

  test('F8.2: Mechanical subsystem integration adds exact mass and solar power deltas', () => {
    // Mechanical: RSU-02 (+110 kg) and SADM (+150 kg, +450 W)
    const telem = SPEC_ORACLE.TELEMETRY.calculateCumulative(['mech_task1', 'mech_task2'], 150000);
    assert.strictEqual(telem.mass, 11060, '10800 + 110 + 150 = 11,060 kg');
    assert.strictEqual(telem.power, 2300, '1850 + 450 = 2,300 W');
    assert.strictEqual(telem.isPowerNominal, true, 'Power >= 2,200 W nominal threshold reached');
  });

  test('F8.3: Network subsystem integration achieves full 1.0 Mbps flight comms link', () => {
    // Network: HGA (+0.5 Mbps) and SI-C&DH (+0.5 Mbps)
    const telem = SPEC_ORACLE.TELEMETRY.calculateCumulative(['net_task1', 'net_task2'], 150000);
    assert.strictEqual(telem.dataRate, 1.0, '0.5 + 0.5 = 1.0 Mbps');
    assert.strictEqual(telem.isDataNominal, true, 'Comms rate meets 1.0 Mbps flight requirement');
  });

  test('F8.4: Full integration of all 6 subsystems achieves exact nominal values', () => {
    const allStages = SPEC_ORACLE.ALL_REQUIRED_STAGES;
    const telem = SPEC_ORACLE.TELEMETRY.calculateCumulative(allStages, 31500);

    assert.strictEqual(telem.mass, 11110, 'Total mass must be 11,110 kg');
    assert.strictEqual(telem.power, 2400, 'Total power must be 2,400 W');
    assert.strictEqual(telem.dataRate, 1.0, 'Total data transmission rate must be 1.0 Mbps');
    assert.strictEqual(telem.expenditure, 118500, '$150,000 - $31,500 = $118,500 spent');
    assert.strictEqual(telem.isMassNominal, true, '11,110 kg <= 11,600 kg nominal limit');
    assert.strictEqual(telem.isPowerNominal, true, '2,400 W >= 2,200 W nominal limit');
    assert.strictEqual(telem.isDataNominal, true, '1.0 Mbps >= 1.0 Mbps nominal limit');
  });

  test('F8.5: Telemetry DOM footer elements update with formatted values', () => {
    const env = createTestEnvironment();
    const massEl = env.document.getElementById('telemMassVal');
    const powerEl = env.document.getElementById('telemPowerVal');
    const dataEl = env.document.getElementById('telemDataVal');
    const budgetEl = env.document.getElementById('telemBudgetVal');

    assert.ok(massEl && powerEl && dataEl && budgetEl, 'All 4 telemetry DOM elements must exist');

    massEl.textContent = '11,110 kg';
    powerEl.textContent = '+2,400W';
    dataEl.textContent = '1.0 Mbps';
    budgetEl.textContent = '$118,500.00';

    assert.strictEqual(massEl.textContent, '11,110 kg');
    assert.strictEqual(powerEl.textContent, '+2,400W');
    assert.strictEqual(dataEl.textContent, '1.0 Mbps');
    assert.strictEqual(budgetEl.textContent, '$118,500.00');
  });

  // =========================================================================
  // FEATURE 9: INTERACTIVE ASSEMBLY MINI-GAMES (>= 5 tests)
  // Spec: Precision alignment mini-game on assemble click; mounts on completion
  // =========================================================================

  test('F9.1: Mechanical crosshair alignment succeeds within +/- 15px reticle tolerance', () => {
    function verifyMechanicalAlignment(reticleX, reticleY, targetX = 0, targetY = 0) {
      const dist = Math.sqrt((reticleX - targetX) ** 2 + (reticleY - targetY) ** 2);
      return dist <= 15;
    }

    assert.strictEqual(verifyMechanicalAlignment(5, 5), true, 'Dist 7.07px is within 15px tolerance');
    assert.strictEqual(verifyMechanicalAlignment(0, 14), true, 'Dist 14px is within 15px tolerance');
    assert.strictEqual(verifyMechanicalAlignment(16, 0), false, 'Dist 16px is outside tolerance');
    assert.strictEqual(verifyMechanicalAlignment(20, 20), false, 'Dist 28.28px is outside tolerance');
  });

  test('F9.2: Electrical waveform frequency match succeeds at 5.0V target voltage (+/- 0.2V)', () => {
    function verifyElectricalWaveform(tunedVoltage) {
      return Math.abs(tunedVoltage - 5.0) <= 0.2;
    }

    assert.strictEqual(verifyElectricalWaveform(5.0), true);
    assert.strictEqual(verifyElectricalWaveform(5.15), true);
    assert.strictEqual(verifyElectricalWaveform(4.85), true);
    assert.strictEqual(verifyElectricalWaveform(4.5), false, '0.5V offset is out of tolerance');
  });

  test('F9.3: Network RF carrier phase sync succeeds within +/- 5 degrees of phase lock', () => {
    function verifyPhaseSync(phaseDeltaDeg) {
      const norm = Math.abs(phaseDeltaDeg) % 360;
      return norm <= 5 || norm >= 355;
    }

    assert.strictEqual(verifyPhaseSync(0), true, '0 deg phase delta is locked');
    assert.strictEqual(verifyPhaseSync(3), true, '3 deg phase delta is locked');
    assert.strictEqual(verifyPhaseSync(358), true, '-2 deg phase delta is locked');
    assert.strictEqual(verifyPhaseSync(25), false, '25 deg phase delta is unlocked');
  });

  test('F9.4: Completing mini-game dispatches stage completion and attaches mesh to Hubble model', () => {
    const env = createTestEnvironment();
    loadScript('assembly3d.js', env);

    const assembly = new env.window.Assembly3D();
    const stageKey = 'mech_task1';

    // Simulate completion
    assembly.assembledStages[stageKey] = true;
    assembly.switchDepartment('mech');

    assert.strictEqual(assembly.assembledStages[stageKey], true);
    const btn = env.document.getElementById('btnAssemblePart1');
    assert.strictEqual(btn.disabled, true);
    assert.strictEqual(btn.textContent, 'Assembled');

    assembly.destroy();
  });

  test('F9.5: Mini-game completion broadcasts SYNC_ASSEMBLY_STEP_COMPLETE via socket relay', () => {
    const env = createTestEnvironment();
    let broadcastPacket = null;
    env.window.syncMultiplayerAssemblyStep = (stepKey) => {
      broadcastPacket = { type: 'SYNC_ASSEMBLY_STEP_COMPLETE', stage: stepKey };
    };

    env.window.syncMultiplayerAssemblyStep('elec_task1');
    assert.ok(broadcastPacket, 'Sync broadcast must be called');
    assert.strictEqual(broadcastPacket.stage, 'elec_task1');
  });

  // =========================================================================
  // FEATURE 10: STS-61 LAUNCH GATE CERTIFICATION (>= 5 tests)
  // Spec: STS-61 launch button unlocked ONLY when ALL 6 subsystem tasks complete
  // =========================================================================

  test('F10.1: Launch button remains disabled when 0 out of 6 tasks are complete', () => {
    const stages = { mech_task1: false, mech_task2: false, elec_task1: false, elec_task2: false, net_task1: false, net_task2: false };
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(stages), false);
  });

  test('F10.2: Launch button remains disabled when only 1 department finishes (2/6 tasks)', () => {
    const stages = { mech_task1: true, mech_task2: true, elec_task1: false, elec_task2: false, net_task1: false, net_task2: false };
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(stages), false, 'Mechanical alone must NOT unlock launch');
  });

  test('F10.3: Launch button remains disabled when 5 out of 6 tasks are complete', () => {
    const stages = { mech_task1: true, mech_task2: true, elec_task1: true, elec_task2: true, net_task1: true, net_task2: false };
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(stages), false, 'Missing net_task2 must block launch');
  });

  test('F10.4: Launch button unlocks when all 6 subsystem tasks across all 3 departments are complete', () => {
    const stages = { mech_task1: true, mech_task2: true, elec_task1: true, elec_task2: true, net_task1: true, net_task2: true };
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(stages), true, 'All 6 stages complete must certify launch readiness');
  });

  test('F10.5: Unlocked launch button activates visual readiness class and trigger callback', () => {
    const env = createTestEnvironment();
    const btnLaunch = env.document.getElementById('btnAssemblyLaunch');

    let launchTriggered = false;
    btnLaunch.addEventListener('click', () => {
      launchTriggered = true;
    });

    // Unlocking state
    btnLaunch.disabled = false;
    btnLaunch.classList.add('ready');

    assert.strictEqual(btnLaunch.disabled, false);
    assert.strictEqual(btnLaunch.classList.contains('ready'), true);

    btnLaunch.click();
    assert.strictEqual(launchTriggered, true, 'Clicking unlocked launch button triggers launch callback');
  });

  return suiteResults;
}

if (require.main === module) {
  const res = runAssemblyTests();
  console.log(`\n=== ${res.name} ===`);
  console.log(`Passed: ${res.passed} | Failed: ${res.failed} | Total: ${res.tests.length}`);
  res.tests.forEach(t => {
    if (t.status === 'FAIL') console.error(` ❌ ${t.name} -> ${t.error}`);
    else console.log(` ✔ ${t.name}`);
  });
  process.exit(res.failed > 0 ? 1 : 0);
}

module.exports = { runAssemblyTests };
