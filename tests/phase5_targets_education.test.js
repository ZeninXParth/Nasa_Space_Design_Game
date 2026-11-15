/**
 * Horizon-X: NASA Space Mission Design Game
 * Tier 6: Phase 5 Space Mission Targets & Educational Framework Test Suite
 * Validates Target Selection Screen (Hubble, JWST, Chandra), Difficulty Toggle (13+),
 * NASA Citations (GMAT, CML, MDL, CubeSat 101), and Launch Gate Stop.
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

function runPhase5TargetsEducationTests() {
  const suiteResults = {
    name: 'Tier 6: Phase 5 Space Mission Targets & Educational Systems Engineering',
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

  const indexPath = path.join(__dirname, '..', 'index.html');
  const stylePath = path.join(__dirname, '..', 'style.css');
  const scriptPath = path.join(__dirname, '..', 'script.js');
  const assemblyPath = path.join(__dirname, '..', 'assembly3d.js');

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const styleCss = fs.readFileSync(stylePath, 'utf8');
  const scriptJs = fs.readFileSync(scriptPath, 'utf8');
  const assemblyJs = fs.readFileSync(assemblyPath, 'utf8');

  test('P5.1: Target Selection Screen defines all 3 NASA telescope mission targets', () => {
    assert.ok(indexHtml.includes('id="targetCardHubble"'), 'Hubble Space Telescope target card must exist');
    assert.ok(indexHtml.includes('id="targetCardJwst"'), 'James Webb Space Telescope target card must exist');
    assert.ok(indexHtml.includes('id="targetCardChandra"'), 'Chandra X-Ray Observatory target card must exist');
  });

  test('P5.2: Target cards link to normalized genuine image assets', () => {
    assert.ok(indexHtml.includes('target_hubble.jpeg'), 'Hubble target image must be referenced');
    assert.ok(indexHtml.includes('target_jwst.jpeg'), 'JWST target image must be referenced');
    assert.ok(indexHtml.includes('target_chandra.jpeg'), 'Chandra target image must be referenced');

    assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'target_hubble.jpeg')), 'target_hubble.jpeg must exist on disk');
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'target_jwst.jpeg')), 'target_jwst.jpeg must exist on disk');
    assert.ok(fs.existsSync(path.join(__dirname, '..', 'assets', 'images', 'target_chandra.jpeg')), 'target_chandra.jpeg must exist on disk');
  });

  test('P5.3: Educational Complexity Mode Toggle exists for Age 13+ students and engineers', () => {
    assert.ok(indexHtml.includes('id="btnDiffApprentice"'), 'Apprentice mode button (Age 13+) must exist');
    assert.ok(indexHtml.includes('id="btnDiffEngineer"'), 'Flight Engineer button must exist');
    assert.ok(scriptJs.includes('setDifficultyLevel'), 'setDifficultyLevel function must exist');
  });

  test('P5.4: In-Game Research Terminals include official NASA citations (GMAT, CML, MDL, CubeSat 101)', () => {
    assert.ok(indexHtml.includes('tab-nasa-citations'), 'Mechanical modal must have NASA citations tab');
    assert.ok(indexHtml.includes('NASA GMAT R2026a'), 'NASA GMAT citation must be present');
    assert.ok(indexHtml.includes('JPL CML 1–4'), 'JPL CML citation must be present');
    assert.ok(indexHtml.includes('GSFC MDL'), 'GSFC Mission Design Lab citation must be present');
    assert.ok(indexHtml.includes('CubeSat 101'), 'NASA CubeSat 101 citation must be present');
  });

  test('P5.5: Objective screen displays authentic NASA Systems Briefing matching Figma 391:60', () => {
    assert.ok(indexHtml.includes('id="objectiveScreen"'), 'Objective screen container must exist');
    assert.ok(indexHtml.includes('Hubble Space Telescope'), 'Hubble Space Telescope target title must be present');
    assert.ok(indexHtml.includes('Desk 01 (Mechanical)'), 'Desk 01 Mechanical reference must exist');
    assert.ok(indexHtml.includes('Desk 02 (Electronic )'), 'Desk 02 Electronic reference must exist');
    assert.ok(indexHtml.includes('Desk 03 (Network)'), 'Desk 03 Network reference must exist');
  });

  test('P5.6: Hubble Assembly enables Launch Button and holds for Phase 6 without premature simulation', () => {
    assert.ok(assemblyJs.includes('READY FOR LAUNCH'), 'Assembly launch button must show READY FOR LAUNCH text');
    assert.ok(assemblyJs.includes('STS-61 PRE-FLIGHT VERIFIED'), 'Pre-flight verified certification notice must exist');
    assert.ok(assemblyJs.includes('Phase 5 Gate'), 'Phase 5 launch gate must hold before triggering direct simulation');
  });

  test('P5.7: style.css defines authoritative Figma obsidian theme for target cards and citations', () => {
    assert.ok(styleCss.includes('.target-selection-layout'), 'Target selection layout class must be styled');
    assert.ok(styleCss.includes('.target-card-figma'), 'Target card Figma obsidian class must be styled');
    assert.ok(styleCss.includes('.paper-citations-grid'), 'Paper citations grid must be styled');
    assert.ok(styleCss.includes('.target-diff-btn'), 'Difficulty buttons must be styled');
  });

  return suiteResults;
}

module.exports = { runPhase5TargetsEducationTests };
