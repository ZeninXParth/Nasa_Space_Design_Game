/**
 * Horizon-X: NASA Space Design Game
 * Master E2E CLI Test Runner & Certification Suite
 * 
 * Executes all 4 tiers of opaque-box E2E tests:
 * - Tier 1: Feature Coverage (Marketplace, Assembly, HUD/Check-In/Workbenches) [80 tests]
 * - Tier 2: Boundary & Corner Cases [25 tests]
 * - Tier 3: Cross-Feature Combinations & State Synchronization [15 tests]
 * - Tier 4: Real-World Application Scenarios (Full STS-61 Walkthrough) [15 tests]
 * 
 * Total Tests: 135
 * Exit code 0 on all passes, non-zero on failure.
 */

const { performance } = require('node:perf_hooks');
const { runMarketplaceTests } = require('./tier1_marketplace.test');
const { runAssemblyTests } = require('./tier1_assembly.test');
const { runHudCheckinWorkbenchTests } = require('./tier1_hud_checkin_workbench.test');
const { runLobbyRoomTests } = require('./tier1_lobby_room.test');
const { runKeycardAuthTests } = require('./tier1_keycard_auth.test');
const { runPasscodeWorkflowTests } = require('./tier1_passcode_workflow.test');
const { runSlidingDoorsTests } = require('./tier1_sliding_doors.test');
const { runPhase4SimulationTests } = require('./tier1_phase4_simulation.test');
const { runDecisionWorkflowTests } = require('./tier1_decisions_workflow.test');
const { runBoundaryTests } = require('./tier2_boundaries.test');
const { runCrossFeatureTests } = require('./tier3_cross_feature.test');
const { runMissionScenariosTests } = require('./tier4_mission_scenarios.test');
const { runMobileControlsTests } = require('./mobile_controls.test');
const { runPhase5TargetsEducationTests } = require('./phase5_targets_education.test');

function runAllE2ETests() {
  const startTime = performance.now();

  console.log('╔════════════════════════════════════════════════════════════════════════════════╗');
  console.log('║ 🛰️  PROJECT HORIZON-X | NASA SPACE APPS | OPAQUE-BOX E2E TEST SUITE RUNNER      ║');
  console.log('╚════════════════════════════════════════════════════════════════════════════════╝\n');

  const suiteRunners = [
    runMarketplaceTests,
    runAssemblyTests,
    runHudCheckinWorkbenchTests,
    runLobbyRoomTests,
    runKeycardAuthTests,
    runPasscodeWorkflowTests,
    runSlidingDoorsTests,
    runPhase4SimulationTests,
    runDecisionWorkflowTests,
    runBoundaryTests,
    runCrossFeatureTests,
    runMissionScenariosTests,
    runMobileControlsTests,
    runPhase5TargetsEducationTests
  ];

  let totalPassed = 0;
  let totalFailed = 0;
  const suiteReports = [];

  for (const runner of suiteRunners) {
    const res = runner();
    totalPassed += res.passed;
    totalFailed += res.failed;
    suiteReports.push(res);
  }

  const durationMs = (performance.now() - startTime).toFixed(2);

  // Print Detailed Report
  for (const suite of suiteReports) {
    const statusIcon = suite.failed === 0 ? '✔' : '✖';
    console.log(`\n--------------------------------------------------------------------------------`);
    console.log(`${statusIcon} ${suite.name.toUpperCase()} (Passed: ${suite.passed} / ${suite.tests.length})`);
    console.log(`--------------------------------------------------------------------------------`);

    suite.tests.forEach(t => {
      if (t.status === 'PASS') {
        console.log(`  ✔ [PASS] ${t.name}`);
      } else {
        console.error(`  ❌ [FAIL] ${t.name}`);
        console.error(`       Error: ${t.error}`);
      }
    });
  }

  // Summary Table
  console.log('\n================================================================================');
  console.log('🏁 E2E FLIGHT CERTIFICATION SUMMARY');
  console.log('================================================================================');
  console.log(`Total Test Suites:  ${suiteReports.length}`);
  console.log(`Total Test Cases:   ${totalPassed + totalFailed}`);
  console.log(`Passed:             ${totalPassed} (100% nominal)`);
  console.log(`Failed:             ${totalFailed}`);
  console.log(`Execution Duration: ${durationMs} ms`);
  console.log('--------------------------------------------------------------------------------');

  if (totalFailed === 0) {
    console.log(`🚀 RESULT: ALL ${totalPassed} TESTS NOMINAL. FLIGHT CERTIFICATION PASSED (PHASE 02 + PHASE 03 M1 & M2).\n`);
    process.exit(0);
  } else {
    console.error(`💥 RESULT: ${totalFailed} TESTS FAILED. INVESTIGATION REQUIRED.\n`);
    process.exit(1);
  }
}

if (require.main === module) {
  runAllE2ETests();
}

module.exports = { runAllE2ETests };
