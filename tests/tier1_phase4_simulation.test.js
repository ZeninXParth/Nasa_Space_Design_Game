/**
 * Horizon-X: NASA Space Mission Design Game
 * Tier 1 Unit & Integration Test Suite:
 * Phase 04: STS-31 Launch to LEO Simulation & Mission Complete Ending Screen
 * (Figma Nodes: 463:863, 466:1166, 470:1373, 470:1374)
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createTestEnvironment, loadScript } = require('./test_harness');

function runPhase4SimulationTests() {
  const suiteResults = {
    name: 'Tier 1: Phase 04 Simulation & Mission Complete Ending (Figma 463:863, 470:1373)',
    tests: [],
    passed: 0,
    failed: 0
  };

  function test(name, fn) {
    try {
      fn();
      suiteResults.tests.push({ name, status: 'PASS' });
      suiteResults.passed++;
    } catch (err) {
      suiteResults.tests.push({ name, status: 'FAIL', error: err.message });
      suiteResults.failed++;
    }
  }

  function setupTestEnv() {
    const env = createTestEnvironment();
    loadScript('rocketSimulationEngine.js', env);
    loadScript('launchSimulation.js', env);
    loadScript('multiplayerManager.js', env);
    loadScript('assembly3d.js', env);
    loadScript('script.js', env);
    env.document.dispatchEvent('DOMContentLoaded');
    return env;
  }

  const htmlPath = path.resolve(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // =========================================================================
  // 1. DOM MARKUP CHECKS
  // =========================================================================

  test('SIM.1: #simulationScreen exists in index.html with all HUD elements (Figma 463:863)', () => {
    assert.ok(html.includes('id="simulationScreen"'), '#simulationScreen must exist in DOM');
    assert.ok(html.includes('id="simulationCanvas"'), '#simulationCanvas must exist in DOM');
    assert.ok(html.includes('id="valSimThrust"'), 'Thrust readout must exist');
    assert.ok(html.includes('id="valSimVelocity"'), 'Velocity readout must exist');
    assert.ok(html.includes('id="valSimPressure"'), 'Pressure readout must exist');
    assert.ok(html.includes('id="valSimClock"'), 'Mission clock must exist');
    assert.ok(html.includes('id="valSimAltitude"'), 'Altitude readout must exist');
    assert.ok(html.includes('id="valSimFuel"'), 'Fuel percentage readout must exist');
    assert.ok(html.includes('id="btnSkipSimulation"'), 'Skip simulation button must exist');
  });

  test('SIM.2: #endingScreen exists in index.html matching Figma Node 470:1373', () => {
    assert.ok(html.includes('id="endingScreen"'), '#endingScreen must exist in DOM');
    assert.ok(html.includes('data-node-id="470:1373"'), 'Figma node 470:1373 must be tagged');
    assert.ok(html.includes('data-node-id="470:1374"'), 'Background node 470:1374 must be tagged');
    assert.ok(html.includes('Mission Complete'), 'Mission Complete heading must exist');
    assert.ok(html.includes('Primary Mission Contract'), 'Primary Mission Contract label must exist');
    assert.ok(html.includes('$ 75 M'), 'Primary contract $75M value must exist');
    assert.ok(html.includes('Precision Trajectory Bonus'), 'Precision Trajectory Bonus label must exist');
    assert.ok(html.includes('$ 15M'), 'Precision bonus $15M must exist');
    assert.ok(html.includes('Propellant Conservation Bonus'), 'Propellant Conservation Bonus label must exist');
    assert.ok(html.includes('$ 10M'), 'Propellant bonus $10M must exist');
    assert.ok(html.includes('Rapid Calibration Bonus'), 'Rapid Calibration Bonus label must exist');
    assert.ok(html.includes('$ 5M'), 'Rapid calibration bonus $5M must exist');
    assert.ok(html.includes('Total Max Payout'), 'Total Max Payout label must exist');
    assert.ok(html.includes('$ 105M'), 'Total max payout $105M must exist');
    assert.ok(html.includes('“That’s one small step for a man, one giant leap for mankind.”'), 'Neil Armstrong quote must exist');
    assert.ok(html.includes('ZeninXParth'), 'ZeninXParth team credit must exist');
  });

  // =========================================================================
  // 2. ROCKET SIMULATION ENGINE UNIT TESTS
  // =========================================================================

  test('SIM.3: RocketSimulationEngine initializes at T-00:00:10 with full fuel & 90 deg pitch', () => {
    const env = setupTestEnv();
    assert.ok(typeof env.window.RocketSimulationEngine === 'function', 'RocketSimulationEngine must be attached to window');
    const engine = new env.window.RocketSimulationEngine();
    const init = engine.getTelemetryPayload();
    assert.strictEqual(init.time, -10);
    assert.strictEqual(init.pitch_deg, 90);
    assert.strictEqual(init.fuel_percent, 100);
    assert.strictEqual(init.inclination_deg, 28.45);
    assert.strictEqual(init.completed, false);
  });

  test('SIM.4: RocketSimulationEngine milestones progress to MECO, ET separation, and LEO', () => {
    const env = setupTestEnv();
    const engine = new env.window.RocketSimulationEngine();
    let sawSrbSep = false;
    let sawEtSep = false;
    let guard = 0;

    while (!engine.completed && guard++ < 30000) {
      const state = engine.update(0.016);
      if (state.srb_separated) sawSrbSep = true;
      if (state.et_separated) sawEtSep = true;
    }

    assert.ok(sawSrbSep, 'Vehicle must separate SRBs at MET > 124s');
    assert.ok(sawEtSep, 'Vehicle must separate External Tank at MET > 530s');
    assert.ok(engine.completed, 'Simulation must complete in LEO');
  });

  // =========================================================================
  // 3. LAUNCH SIMULATION CONTROLLER & INTEGRATION
  // =========================================================================

  test('SIM.5: LaunchSimulation class is globally exported and provides start/stop lifecycle', () => {
    const env = setupTestEnv();
    assert.ok(typeof env.window.LaunchSimulation === 'function', 'LaunchSimulation must be attached to window');
    const sim = new env.window.LaunchSimulation('simulationCanvas');
    assert.ok(typeof sim.start === 'function', 'sim.start must be a function');
    assert.ok(typeof sim.stop === 'function', 'sim.stop must be a function');
  });

  test('SIM.6: triggerLaunchSequence switches screen to simulation and broadcasts multiplayer sync', () => {
    const env = setupTestEnv();
    let broadcastPacket = null;
    env.window.multiplayerManager.broadcastSync = (type, payload) => {
      broadcastPacket = { type, payload };
    };

    assert.ok(typeof env.window.triggerLaunchSequence === 'function', 'triggerLaunchSequence must be attached to window');
    env.window.triggerLaunchSequence();

    assert.ok(broadcastPacket, 'Multiplayer sync packet must be dispatched');
    assert.strictEqual(broadcastPacket.type, 'SYNC_TRIGGER_LAUNCH');

    const simScreen = env.document.getElementById('simulationScreen');
    assert.strictEqual(simScreen.classList.contains('active'), true, 'Simulation screen must become active');
  });

  test('SIM.7: Skip button transitions directly from simulation to #endingScreen', () => {
    const env = setupTestEnv();
    env.window.triggerLaunchSequence();

    const btnSkip = env.document.getElementById('btnSkipSimulation');
    assert.ok(btnSkip, 'Skip simulation button must exist in DOM');
    btnSkip.click();

    const endingScreen = env.document.getElementById('endingScreen');
    assert.strictEqual(endingScreen.classList.contains('active'), true, 'Ending screen must become active on skip');
  });

  return suiteResults;
}

if (require.main === module) {
  const results = runPhase4SimulationTests();
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

module.exports = { runPhase4SimulationTests };
