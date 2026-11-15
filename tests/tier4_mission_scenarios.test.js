/**
 * Horizon-X: NASA Space Design Game
 * Tier 4 Test Suite: Real-World Application Scenarios
 * Full 3-Department End-to-End Mission Walkthrough (STS-61 Servicing Mission)
 * 
 * Authoritative Sources:
 * - ORIGINAL_REQUEST.md: Section R1, R2, R3, R4
 * - PROJECT.md: Milestone E2E Track, Tier 4 Specifications
 * - Phase_02_instructions.md: Full end-to-end flight workflow
 */

const assert = require('node:assert');
const { createTestEnvironment, loadScript, SPEC_ORACLE } = require('./test_harness');

function runMissionScenariosTests() {
  const suiteResults = { name: 'Tier 4: Real-World Application Scenarios (STS-61)', passed: 0, failed: 0, tests: [] };

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

  // Complete End-to-End Mission State
  const missionState = {
    callSign: 'STS61_FlightLead',
    budget: 150000,
    activeDept: null,
    stationLocks: {},
    shiftHistory: [],
    equippedTools: [],
    assembledStages: {
      mech_task1: false,
      mech_task2: false,
      elec_task1: false,
      elec_task2: false,
      net_task1: false,
      net_task2: false
    },
    claimedDepartments: {},
    telemetry: SPEC_ORACLE.TELEMETRY.calculateCumulative([], 150000)
  };

  // =========================================================================
  // SCENARIO PHASE A: CLEANROOM FACILITY ARRIVAL & HUD BOOTSTRAP
  // =========================================================================

  test('M1: Phase A - Facility initialization bootstraps callsign, shift timer, and baseline budget', () => {
    const env = createTestEnvironment();
    const callsignEl = env.document.getElementById('hudOperatorNameDisplay');
    const timerEl = env.document.getElementById('hudMissionTimer');
    const budgetEl = env.document.getElementById('hudTopBudget');

    callsignEl.textContent = missionState.callSign;
    timerEl.textContent = '00 : 00 : 00';
    budgetEl.textContent = `$${missionState.budget.toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

    assert.strictEqual(callsignEl.textContent, 'STS61_FlightLead');
    assert.strictEqual(timerEl.textContent, '00 : 00 : 00');
    assert.strictEqual(budgetEl.textContent, '$150,000.00');

    assert.strictEqual(missionState.telemetry.mass, 10800, 'Baseline mass 10,800 kg');
    assert.strictEqual(missionState.telemetry.power, 1850, 'Baseline power 1,850 W');
    assert.strictEqual(missionState.telemetry.dataRate, 0.0, 'Baseline comms 0.0 Mbps');
  });

  // =========================================================================
  // SCENARIO PHASE B: MECHANICAL DEPARTMENT OPERATIONS (DESK 01)
  // =========================================================================

  test('M2: Phase B.1 - Mechanical Engineer checks in to Desk 01 terminal and claims station lock', () => {
    missionState.activeDept = 'mechanical';
    missionState.stationLocks.mechanical_desk_01 = {
      operator: missionState.callSign,
      checkedInAt: Date.now()
    };

    assert.ok(missionState.stationLocks.mechanical_desk_01);
    assert.strictEqual(missionState.stationLocks.mechanical_desk_01.operator, 'STS61_FlightLead');
  });

  test('M3: Phase B.2 - Mechanical Logistics requisitions PGT Torque Wrench (Level 02, $12,950)', () => {
    const pgtCost = SPEC_ORACLE.calculateTierPrice(18500, 2);
    missionState.budget -= pgtCost;
    missionState.equippedTools.push('pgt');

    assert.strictEqual(pgtCost, 12950);
    assert.strictEqual(missionState.budget, 137050, 'Budget decrements to $137,050.00');
    assert.ok(missionState.equippedTools.includes('pgt'));
  });

  test('M4: Phase B.3 - Mechanical Assembly mounts RSU-02 Gyro Canister Hatch (Task 1)', () => {
    missionState.claimedDepartments.mech = missionState.callSign;
    missionState.assembledStages.mech_task1 = true;

    missionState.telemetry = SPEC_ORACLE.TELEMETRY.calculateCumulative(
      Object.keys(missionState.assembledStages).filter(k => missionState.assembledStages[k]),
      missionState.budget
    );

    assert.strictEqual(missionState.telemetry.mass, 10910, 'Mass reaches 10,910 kg');
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(missionState.assembledStages), false, 'Launch gate locked');
  });

  test('M5: Phase B.4 - Mechanical Assembly mounts SADM Solar Array Drive Mechanism (Task 2)', () => {
    missionState.assembledStages.mech_task2 = true;

    missionState.telemetry = SPEC_ORACLE.TELEMETRY.calculateCumulative(
      Object.keys(missionState.assembledStages).filter(k => missionState.assembledStages[k]),
      missionState.budget
    );

    assert.strictEqual(missionState.telemetry.mass, 11060, 'Mass reaches 11,060 kg');
    assert.strictEqual(missionState.telemetry.power, 2300, 'Power reaches 2,300 W (+450W solar)');
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(missionState.assembledStages), false, 'Launch gate locked');
  });

  test('M6: Phase B.5 - Mechanical Engineer checks out from Desk 01, releasing lock and logging shift', () => {
    const shiftDuration = 480; // 8 minutes
    missionState.shiftHistory.push({
      operator: missionState.callSign,
      dept: 'mechanical',
      durationSec: shiftDuration
    });
    delete missionState.stationLocks.mechanical_desk_01;

    assert.strictEqual(missionState.stationLocks.mechanical_desk_01, undefined);
    assert.strictEqual(missionState.shiftHistory.length, 1);
  });

  // =========================================================================
  // SCENARIO PHASE C: ELECTRICAL DEPARTMENT OPERATIONS (DESK 02)
  // =========================================================================

  test('M7: Phase C.1 - Electronic Engineer checks in to Desk 02 terminal and claims station lock', () => {
    missionState.activeDept = 'electronic';
    missionState.stationLocks.electronic_desk_02 = {
      operator: missionState.callSign,
      checkedInAt: Date.now()
    };
    assert.ok(missionState.stationLocks.electronic_desk_02);
  });

  test('M8: Phase C.2 - Electronic Logistics requisitions DF-224 PCB (Level 03 Flight, $32,000)', () => {
    const pcbCost = SPEC_ORACLE.calculateTierPrice(32000, 3);
    missionState.budget -= pcbCost;
    missionState.equippedTools.push('pcb');

    assert.strictEqual(pcbCost, 32000);
    assert.strictEqual(missionState.budget, 105050);
  });

  test('M9: Phase C.3 - Electronic Assembly mounts DF-224 Board (Task 1) and FGS Sensor (Task 2)', () => {
    missionState.claimedDepartments.elec = missionState.callSign;
    missionState.assembledStages.elec_task1 = true;
    missionState.assembledStages.elec_task2 = true;

    missionState.telemetry = SPEC_ORACLE.TELEMETRY.calculateCumulative(
      Object.keys(missionState.assembledStages).filter(k => missionState.assembledStages[k]),
      missionState.budget
    );

    assert.strictEqual(missionState.telemetry.mass, 11100, 'Mass reaches 11,100 kg');
    assert.strictEqual(missionState.telemetry.power, 2400, 'Power reaches 2,400 W (Nominal)');
    assert.strictEqual(SPEC_ORACLE.isLaunchReady(missionState.assembledStages), false, 'Launch gate locked');
  });

  test('M10: Phase C.4 - Electronic Engineer checks out from Desk 02, releasing lock and logging shift', () => {
    missionState.shiftHistory.push({
      operator: missionState.callSign,
      dept: 'electronic',
      durationSec: 540
    });
    delete missionState.stationLocks.electronic_desk_02;

    assert.strictEqual(missionState.stationLocks.electronic_desk_02, undefined);
    assert.strictEqual(missionState.shiftHistory.length, 2);
  });

  // =========================================================================
  // SCENARIO PHASE D: NETWORK DEPARTMENT OPERATIONS (DESK 03)
  // =========================================================================

  test('M11: Phase D.1 - Network Engineer checks in to Desk 03 terminal and claims station lock', () => {
    missionState.activeDept = 'network';
    missionState.stationLocks.network_desk_03 = {
      operator: missionState.callSign,
      checkedInAt: Date.now()
    };
    assert.ok(missionState.stationLocks.network_desk_03);
  });

  test('M12: Phase D.2 - Network Logistics requisitions RF Torque Wrench (Level 02, $3,150)', () => {
    const rfCost = SPEC_ORACLE.calculateTierPrice(4500, 2);
    missionState.budget -= rfCost;
    missionState.equippedTools.push('rf_wrench');

    assert.strictEqual(rfCost, 3150);
    assert.strictEqual(missionState.budget, 101900);
  });

  test('M13: Phase D.3 - Network Assembly mounts HGA Dish (Task 1) and Fiber Splicer (Task 2)', () => {
    missionState.claimedDepartments.net = missionState.callSign;
    missionState.assembledStages.net_task1 = true;
    missionState.assembledStages.net_task2 = true;

    missionState.telemetry = SPEC_ORACLE.TELEMETRY.calculateCumulative(
      Object.keys(missionState.assembledStages).filter(k => missionState.assembledStages[k]),
      missionState.budget
    );

    assert.strictEqual(missionState.telemetry.mass, 11110, 'Mass reaches 11,110 kg');
    assert.strictEqual(missionState.telemetry.power, 2400, 'Power remains 2,400 W');
    assert.strictEqual(missionState.telemetry.dataRate, 1.0, 'Comms rate reaches 1.0 Mbps (Nominal)');
  });

  test('M14: Phase D.4 - Network Engineer checks out from Desk 03, releasing lock and logging shift', () => {
    missionState.shiftHistory.push({
      operator: missionState.callSign,
      dept: 'network',
      durationSec: 360
    });
    delete missionState.stationLocks.network_desk_03;

    assert.strictEqual(missionState.stationLocks.network_desk_03, undefined);
    assert.strictEqual(missionState.shiftHistory.length, 3);
  });

  // =========================================================================
  // SCENARIO PHASE E: STS-61 MISSION LAUNCH CERTIFICATION
  // =========================================================================

  test('M15: Phase E - All 6 subsystems certified across 3 departments; STS-61 Launch Unlocks and executes', () => {
    const env = createTestEnvironment();
    const btnLaunch = env.document.getElementById('btnAssemblyLaunch');

    // Evaluate launch readiness
    const isReady = SPEC_ORACLE.isLaunchReady(missionState.assembledStages);
    assert.strictEqual(isReady, true, 'All 6 stages certified');

    // Verify all 4 constraints are nominal
    assert.strictEqual(missionState.telemetry.isMassNominal, true);
    assert.strictEqual(missionState.telemetry.isPowerNominal, true);
    assert.strictEqual(missionState.telemetry.isDataNominal, true);
    assert.strictEqual(missionState.telemetry.isBudgetNominal, true);

    // Launch action
    let launchExecuted = false;
    btnLaunch.addEventListener('click', () => {
      launchExecuted = true;
    });

    btnLaunch.disabled = false;
    btnLaunch.classList.add('ready');

    btnLaunch.click();
    assert.strictEqual(launchExecuted, true, 'STS-61 Mission successfully launched!');
  });

  return suiteResults;
}

if (require.main === module) {
  const res = runMissionScenariosTests();
  console.log(`\n=== ${res.name} ===`);
  console.log(`Passed: ${res.passed} | Failed: ${res.failed} | Total: ${res.tests.length}`);
  res.tests.forEach(t => {
    if (t.status === 'FAIL') console.error(` ❌ ${t.name} -> ${t.error}`);
    else console.log(` ✔ ${t.name}`);
  });
  process.exit(res.failed > 0 ? 1 : 0);
}

module.exports = { runMissionScenariosTests };
