/**
 * 🛰️ Tier 1 Test Suite: Task + Engineering Decisions Workflow
 * Verifies DecisionManager, 6 Directives, Modal DOM, Decision Recording,
 * Simulation Anomaly Flags, and Post-Mission Debriefing Audit Report.
 */

const assert = require('assert');
const fs = require('fs');
const path = require('path');

function runDecisionWorkflowTests() {
  const suiteResults = { name: 'Tier 1: Task + Engineering Decisions Workflow', passed: 0, failed: 0, tests: [] };

  function test(name, fn) {
    try {
      fn();
      suiteResults.passed++;
      suiteResults.tests.push({ name, status: 'PASS' });
      console.log(`  ✔ [PASS] ${name}`);
    } catch (err) {
      suiteResults.failed++;
      suiteResults.tests.push({ name, status: 'FAIL', error: err.message });
      console.error(`  ❌ [FAIL] ${name}: ${err.message}`);
    }
  }

  // Helper to load HTML into mock DOM
  function setupTestEnv() {
    const htmlPath = path.join(__dirname, '..', 'index.html');
    const html = fs.readFileSync(htmlPath, 'utf8');

    const dom = {
      elements: {},
      getElementById(id) {
        if (!this.elements[id]) {
          this.elements[id] = {
            id,
            classList: {
              classes: new Set(['hidden']),
              add(c) { this.classes.add(c); },
              remove(c) { this.classes.delete(c); },
              contains(c) { return this.classes.has(c); },
              toggle(c, v) { if (v) this.classes.add(c); else this.classes.delete(c); }
            },
            attributes: {},
            setAttribute(k, v) { this.attributes[k] = v; },
            getAttribute(k) { return this.attributes[k]; },
            textContent: '',
            innerHTML: '',
            style: {}
          };
        }
        return this.elements[id];
      },
      querySelector(selector) {
        if (selector === '[data-node-id="470:1404"]') {
          return this.getElementById('totalPayoutVal');
        }
        return null;
      }
    };

    const mockWindow = {
      document: dom,
      gameState: {
        decisions: {
          mech_task1: null, mech_task2: null,
          elec_task1: null, elec_task2: null,
          net_task1: null, net_task2: null
        },
        decisionLogs: []
      },
      addEventListener() {},
      removeEventListener() {}
    };

    // Load decisionManager in sandbox
    const code = fs.readFileSync(path.join(__dirname, '..', 'decisionManager.js'), 'utf8');
    const runInScope = new Function('window', code);
    runInScope(mockWindow);

    return { window: mockWindow, document: dom, html };
  }

  // 1. DATA MODEL & GLOBAL EXPORTS (AGENTS.md Rule 1)
  test('DEC.1: DecisionManager and ENGINEERING_DIRECTIVES are exported to window', () => {
    const env = setupTestEnv();
    assert.ok(env.window.DecisionManager, 'DecisionManager must be attached to window');
    assert.ok(env.window.ENGINEERING_DIRECTIVES, 'ENGINEERING_DIRECTIVES must be attached to window');
  });

  test('DEC.2: Exactly 6 authoritative directives defined across Mech, Elec, and Net', () => {
    const env = setupTestEnv();
    const directives = env.window.ENGINEERING_DIRECTIVES;
    const keys = Object.keys(directives);
    assert.strictEqual(keys.length, 6, 'Must have exactly 6 directives');
    assert.ok(directives.mech_task1 && directives.mech_task1.directiveCode === 'ENG-M01');
    assert.ok(directives.mech_task2 && directives.mech_task2.directiveCode === 'ENG-M02');
    assert.ok(directives.elec_task1 && directives.elec_task1.directiveCode === 'ENG-E01');
    assert.ok(directives.elec_task2 && directives.elec_task2.directiveCode === 'ENG-E02');
    assert.ok(directives.net_task1 && directives.net_task1.directiveCode === 'ENG-N01');
    assert.ok(directives.net_task2 && directives.net_task2.directiveCode === 'ENG-N02');
  });

  // 2. DOM INTEGRATION IN index.html
  test('DEC.3: #modalEngineeringDecision exists in index.html with all required controls', () => {
    const env = setupTestEnv();
    assert.ok(env.html.includes('id="modalEngineeringDecision"'), 'Modal must exist in index.html');
    assert.ok(env.html.includes('id="btnDecisionYes"'), 'YES decision button must exist');
    assert.ok(env.html.includes('id="btnDecisionNo"'), 'NO decision button must exist');
    assert.ok(env.html.includes('id="decQuestionText"'), 'Question text container must exist');
  });

  test('DEC.4: #endingDecisionAuditBox exists in index.html inside #endingScreen', () => {
    const env = setupTestEnv();
    assert.ok(env.html.includes('id="endingDecisionAuditBox"'), 'Audit report box must exist');
    assert.ok(env.html.includes('id="auditScorePill"'), 'Score pill element must exist');
    assert.ok(env.html.includes('id="auditDirectivesList"'), 'Directives list container must exist');
  });

  // 3. DECISION RECORDING & STATE MACHINE
  test('DEC.5: recordDecision updates gameState.decisions and logs full record', () => {
    const env = setupTestEnv();
    const mgr = env.window.DecisionManager;

    const rec1 = mgr.recordDecision('mech_task1', true);
    assert.strictEqual(env.window.gameState.decisions.mech_task1, true, 'mech_task1 must be true');
    assert.strictEqual(rec1.choice, 'YES');
    assert.strictEqual(rec1.isNominal, true);

    const rec2 = mgr.recordDecision('elec_task1', false);
    assert.strictEqual(env.window.gameState.decisions.elec_task1, false, 'elec_task1 must be false (shortcut)');
    assert.strictEqual(rec2.choice, 'NO');
    assert.strictEqual(rec2.isNominal, false);
    assert.strictEqual(env.window.gameState.decisionLogs.length, 2);
  });

  // 4. FLIGHT AUDIT & SCORING EVALUATION
  test('DEC.6: calculateFlightAudit yields 100% A+ when all 6 directives are Nominal', () => {
    const env = setupTestEnv();
    const mgr = env.window.DecisionManager;

    ['mech_task1', 'mech_task2', 'elec_task1', 'elec_task2', 'net_task1', 'net_task2'].forEach(k => {
      mgr.recordDecision(k, true);
    });

    const audit = mgr.calculateFlightAudit();
    assert.strictEqual(audit.scorePercent, 100);
    assert.strictEqual(audit.grade, 'A+');
    assert.strictEqual(audit.nominalCount, 6);
    assert.strictEqual(audit.shortcutCount, 0);
    assert.strictEqual(audit.isMissionFailure, false);
    assert.strictEqual(audit.penaltyDeduction, 0);
  });

  test('DEC.7: calculateFlightAudit detects shortcuts, deducts penalty and details correction', () => {
    const env = setupTestEnv();
    const mgr = env.window.DecisionManager;

    mgr.recordDecision('mech_task1', false); // Shortcut (Trapped moisture)
    mgr.recordDecision('mech_task2', true);
    mgr.recordDecision('elec_task1', true);
    mgr.recordDecision('elec_task2', true);
    mgr.recordDecision('net_task1', true);
    mgr.recordDecision('net_task2', true);

    const audit = mgr.calculateFlightAudit();
    assert.strictEqual(audit.nominalCount, 5);
    assert.strictEqual(audit.shortcutCount, 1);
    assert.strictEqual(audit.scorePercent, 83);
    assert.strictEqual(audit.grade, 'B+');
    assert.strictEqual(audit.penaltyDeduction, 15);

    const flagged = audit.details.find(d => d.key === 'mech_task1');
    assert.strictEqual(flagged.isNominal, false);
    assert.ok(flagged.shortcutConsequence.includes('Moisture iced the RSU-02'));
    assert.ok(flagged.recommendation.includes('Correction Needed'));
  });

  test('DEC.8: calculateFlightAudit flags mission failure (Grade F) when >= 4 shortcuts taken', () => {
    const env = setupTestEnv();
    const mgr = env.window.DecisionManager;

    ['mech_task1', 'mech_task2', 'elec_task1', 'net_task1'].forEach(k => {
      mgr.recordDecision(k, false);
    });
    mgr.recordDecision('elec_task2', true);
    mgr.recordDecision('net_task2', true);

    const audit = mgr.calculateFlightAudit();
    assert.strictEqual(audit.grade, 'F');
    assert.strictEqual(audit.isMissionFailure, true);
    assert.strictEqual(audit.penaltyDeduction, 75);
  });

  return suiteResults;
}

if (require.main === module) {
  console.log('\n==================================================');
  console.log('🧪 Running Task + Decisions Workflow Tests...');
  console.log('==================================================\n');
  const res = runDecisionWorkflowTests();
  console.log(`\nPassed: ${res.passed} / ${res.passed + res.failed}`);
  process.exit(res.failed > 0 ? 1 : 0);
}

module.exports = { runDecisionWorkflowTests };
