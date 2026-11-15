/**
 * Horizon-X: NASA Space Mission Design Game
 * Tier 1 Unit & Integration Test Suite:
 * Assembly Access Passcode & Department Selection Workflow
 * (Figma Nodes: 456:112, 456:32, 456:81, 427:2)
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const { createTestEnvironment, loadScript } = require('./test_harness');

function runPasscodeWorkflowTests() {
  const suiteResults = {
    name: 'Tier 1: Assembly Passcode & Selection Workflow (Figma 456:112, 456:32, 456:81)',
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
    loadScript('multiplayerManager.js', env);
    loadScript('assembly3d.js', env);
    loadScript('script.js', env);
    env.document.dispatchEvent('DOMContentLoaded');
    return env;
  }

  const htmlPath = path.resolve(__dirname, '..', 'index.html');
  const html = fs.readFileSync(htmlPath, 'utf-8');

  // =========================================================================
  // 1. DOM MARKUP CHECKS & LEGACY WIPE VERIFICATION
  // =========================================================================

  test('PW.1: Legacy #modalAssemblyClaim and lockout markup are completely purged from index.html', () => {
    assert.strictEqual(html.includes('id="modalAssemblyClaim"'), false, 'Legacy modalAssemblyClaim must be purged');
    assert.strictEqual(html.includes('id="cardClaimMech"'), false, 'Legacy cardClaimMech must be purged');
    assert.strictEqual(html.includes('id="btnClaimMech"'), false, 'Legacy btnClaimMech must be purged');
    assert.strictEqual(html.includes('Claimed departments are locked for peer engineers'), false, 'Legacy concurrency lockout text must be purged');
  });

  test('PW.2: #modalAssemblyPasscodeGenerated exists in index.html (Figma Node 456:112)', () => {
    assert.ok(html.includes('id="modalAssemblyPasscodeGenerated"'), 'Modal 456:112 must exist in DOM');
    assert.ok(html.includes('id="passcodeIssuedDeptTitle"'), 'Department title readout must exist');
    assert.ok(html.includes('id="passcodeDisplayVal"'), 'Glowing passcode display must exist');
    assert.ok(html.includes('id="btnCopyPasscode"'), 'Copy passcode button must exist');
    assert.ok(html.includes('id="btnClosePasscodeIssuedModal"'), 'Confirmation button must exist');
  });

  test('PW.3: #stickyPasscodeHud exists with 3 department chips in index.html', () => {
    assert.ok(html.includes('id="stickyPasscodeHud"'), 'Sticky Passcode HUD bar must exist');
    assert.ok(html.includes('id="stickyChipMech"'), 'Mechanical sticky chip must exist');
    assert.ok(html.includes('id="stickyChipElec"'), 'Electronic sticky chip must exist');
    assert.ok(html.includes('id="stickyChipNet"'), 'Network sticky chip must exist');
  });

  test('PW.4: #modalAssemblyDeptSelect exists in index.html (Figma Node 456:32)', () => {
    assert.ok(html.includes('id="modalAssemblyDeptSelect"'), 'Modal 456:32 must exist in DOM');
    assert.ok(html.includes('id="selectCardMech"'), 'Mechanical select card must exist');
    assert.ok(html.includes('id="selectCardElec"'), 'Electronic select card must exist');
    assert.ok(html.includes('id="selectCardNet"'), 'Network select card must exist');
    assert.ok(html.includes('id="btnSelectMech"'), 'Mechanical select button must exist');
    assert.ok(html.includes('id="btnSelectElec"'), 'Electronic select button must exist');
    assert.ok(html.includes('id="btnSelectNet"'), 'Network select button must exist');
  });

  test('PW.5: #modalAssemblyPasscodeInput exists in index.html (Figma Node 456:81)', () => {
    assert.ok(html.includes('id="modalAssemblyPasscodeInput"'), 'Modal 456:81 must exist in DOM');
    assert.ok(html.includes('id="passcodeInputTargetDept"'), 'Target dept readout must exist');
    assert.ok(html.includes('id="assemblyPasscodeInputField"'), 'Passcode input text field must exist');
    assert.ok(html.includes('id="btnAutofillPasscode"'), 'Autofill button must exist');
    assert.ok(html.includes('id="btnSubmitAssemblyPasscode"'), 'Submit verification button must exist');
    assert.ok(html.includes('id="btnBackToDeptSelect"'), 'Back button must exist');
  });

  // =========================================================================
  // 2. STATE MACHINE & PASSCODE GENERATION LOGIC
  // =========================================================================

  test('PW.6: generateAssemblyPasscode returns authentic department-prefixed code', () => {
    const env = setupTestEnv();
    assert.ok(typeof env.window.generateAssemblyPasscode === 'function', 'generateAssemblyPasscode must be globally exported');
    const mechCode = env.window.generateAssemblyPasscode('mech');
    assert.ok(/^MECH-\d{4}$/.test(mechCode), `Passcode must match MECH-XXXX pattern, received: ${mechCode}`);

    const elecCode = env.window.generateAssemblyPasscode('elec');
    assert.ok(/^ELEC-\d{4}$/.test(elecCode), `Passcode must match ELEC-XXXX pattern, received: ${elecCode}`);

    const netCode = env.window.generateAssemblyPasscode('net');
    assert.ok(/^NET-\d{4}$/.test(netCode), `Passcode must match NET-XXXX pattern, received: ${netCode}`);
  });

  test('PW.7: triggerAssemblyPasscodeIssuance populates gameState and displays modal (Figma 456:112)', () => {
    const env = setupTestEnv();
    const gameState = env.window.gameState;
    assert.ok(gameState.assemblyPasscodes, 'gameState.assemblyPasscodes must be initialized');
    assert.strictEqual(gameState.assemblyPasscodes.mech, null);

    env.window.triggerAssemblyPasscodeIssuance('mech');

    assert.ok(gameState.assemblyPasscodes.mech, 'Mechanical passcode must now be populated');
    assert.ok(/^MECH-\d{4}$/.test(gameState.assemblyPasscodes.mech));

    const modal = env.document.getElementById('modalAssemblyPasscodeGenerated');
    assert.strictEqual(modal.classList.contains('hidden'), false, 'Modal 456:112 must be unhidden');

    const displayVal = env.document.getElementById('passcodeDisplayVal');
    assert.strictEqual(displayVal.textContent, gameState.assemblyPasscodes.mech);
  });

  test('PW.8: triggerAssemblyPasscodeIssuance updates sticky HUD chip to unlocked state', () => {
    const env = setupTestEnv();
    env.window.triggerAssemblyPasscodeIssuance('mech');

    const stickyChip = env.document.getElementById('stickyChipMech');
    assert.strictEqual(stickyChip.classList.contains('unlocked'), true, 'Sticky chip must have unlocked class');
    assert.strictEqual(stickyChip.classList.contains('locked'), false);

    const stickyVal = env.document.getElementById('stickyValMech');
    assert.strictEqual(stickyVal.textContent, env.window.gameState.assemblyPasscodes.mech);
  });

  test('PW.9: triggerAssemblyPasscodeIssuance broadcasts SYNC_ASSEMBLY_PASSCODE via multiplayer', () => {
    const env = setupTestEnv();
    let broadcastPacket = null;
    env.window.multiplayerManager.broadcastSync = (type, payload) => {
      broadcastPacket = { type, payload };
    };

    env.window.triggerAssemblyPasscodeIssuance('elec');

    assert.ok(broadcastPacket, 'Broadcast packet must be dispatched');
    assert.strictEqual(broadcastPacket.type, 'SYNC_ASSEMBLY_PASSCODE');
    assert.strictEqual(broadcastPacket.payload.dept, 'elec');
    assert.strictEqual(broadcastPacket.payload.passcode, env.window.gameState.assemblyPasscodes.elec);
  });

  // =========================================================================
  // 3. DEPARTMENT SELECTION & PASSCODE VALIDATION (Figma 456:32 & 456:81)
  // =========================================================================

  test('PW.10: updateAssemblyDeptSelectUI enables qualified departments with zero multiplayer lockout', () => {
    const env = setupTestEnv();
    env.window.gameState.assemblyPasscodes.mech = 'MECH-5555';
    env.window.updateAssemblyDeptSelectUI();

    const mechCard = env.document.getElementById('selectCardMech');
    assert.strictEqual(mechCard.classList.contains('qualified'), true, 'Qualified card must have qualified class');

    const mechBtn = env.document.getElementById('btnSelectMech');
    assert.strictEqual(mechBtn.disabled, false, 'Qualified department button must be enabled');

    // Electronic is not qualified yet
    const elecBtn = env.document.getElementById('btnSelectElec');
    assert.strictEqual(elecBtn.disabled, true, 'Unfinished department button must remain disabled');
  });

  test('PW.11: openAssemblyPasscodeInputModal sets target department and opens modal (Figma 456:81)', () => {
    const env = setupTestEnv();
    env.window.openAssemblyPasscodeInputModal('mech');

    const modal = env.document.getElementById('modalAssemblyPasscodeInput');
    assert.strictEqual(modal.classList.contains('hidden'), false, 'Input modal must be unhidden');

    const sub = env.document.getElementById('passcodeInputTargetDept');
    assert.strictEqual(sub.textContent, 'DEPARTMENT: MECHANICAL');
  });

  test('PW.12: verifyAssemblyPasscode rejects invalid passcode with error banner', () => {
    const env = setupTestEnv();
    env.window.gameState.assemblyPasscodes.mech = 'MECH-7777';
    env.window.openAssemblyPasscodeInputModal('mech');

    const inputField = env.document.getElementById('assemblyPasscodeInputField');
    inputField.value = 'WRONG-CODE';

    env.window.verifyAssemblyPasscode();

    const errMsg = env.document.getElementById('passcodeErrorMsg');
    assert.strictEqual(errMsg.classList.contains('hidden'), false, 'Error message must be shown');

    const modal = env.document.getElementById('modalAssemblyPasscodeInput');
    assert.strictEqual(modal.classList.contains('hidden'), false, 'Modal must remain open on error');
  });

  test('PW.13: verifyAssemblyPasscode accepts correct passcode and opens Assembly3D', () => {
    const env = setupTestEnv();
    env.window.gameState.assemblyPasscodes.mech = 'MECH-7777';
    env.window.openAssemblyPasscodeInputModal('mech');

    let assemblyOpenedDept = null;
    env.window.openAssemblyModal = (dept) => {
      assemblyOpenedDept = dept;
    };

    const inputField = env.document.getElementById('assemblyPasscodeInputField');
    inputField.value = 'mech-7777'; // Case-insensitive test

    env.window.verifyAssemblyPasscode();

    const modal = env.document.getElementById('modalAssemblyPasscodeInput');
    assert.strictEqual(modal.classList.contains('hidden'), true, 'Modal must be hidden on success');
    assert.strictEqual(assemblyOpenedDept, 'mech', 'Assembly modal must be launched for mech dept');
  });

  test('PW.14: Autofill button prefills input field with earned department passcode', () => {
    const env = setupTestEnv();
    env.window.gameState.assemblyPasscodes.mech = 'MECH-9999';
    env.window.openAssemblyPasscodeInputModal('mech');

    const btnAutofill = env.document.getElementById('btnAutofillPasscode');
    btnAutofill.click();

    const inputField = env.document.getElementById('assemblyPasscodeInputField');
    assert.strictEqual(inputField.value, 'MECH-9999', 'Input field must be populated with stored passcode');
  });

  // =========================================================================
  // 4. CACHE BUSTING UNIFORMITY (AGENTS.md Rule 2)
  // =========================================================================

  test('PW.15: index.html has all 14 project script and link tags bumped uniformly to ?v=7.14', () => {
    const requiredScripts = [
      'assets/js/hubbleGlbData.js',
      'assets/js/avatarGlbData.js',
      'style.css',
      'multiplayerManager.js',
      'voiceManager.js',
      'facility3d.js',
      'workbench3d.js',
      'sadm3d.js',
      'electronicsWorkbench3d.js',
      'networkWorkbench3d.js',
      'assembly3d.js',
      'authManager.js',
      'lobby3d.js',
      'script.js'
    ];

    requiredScripts.forEach(script => {
      const regex = new RegExp(`${script.replace('.', '\\.')}\\?v=7\\.[0-9]+`);
      assert.ok(regex.test(html), `index.html must contain updated cache buster ?v=7.14 for: ${script}`);
    });

    // Zero legacy ?v=6.0 references allowed
    assert.strictEqual(html.includes('?v=6.0'), false, 'Zero legacy ?v=6.0 references allowed');
  });

  test('PW.16: checkAndAutoIssuePasscodes automatically issues passcode when department tasks complete', () => {
    const env = setupTestEnv();
    env.window.gameState.subtask01Complete = true;
    env.window.gameState.subtask02Complete = true;
    env.window.gameState.assemblyPasscodes = { mech: null, elec: null, net: null };

    env.window.checkAndAutoIssuePasscodes();

    assert.ok(env.window.gameState.assemblyPasscodes.mech, 'Mechanical passcode must be auto-generated');
    assert.ok(/^MECH-\d{4}$/.test(env.window.gameState.assemblyPasscodes.mech));

    const stickyVal = env.document.getElementById('stickyValMech');
    assert.strictEqual(stickyVal.textContent, env.window.gameState.assemblyPasscodes.mech);
  });

  test('PW.17: Re-interacting with workbench when tasks complete re-displays passcode modal', () => {
    const env = setupTestEnv();
    env.window.gameState.isCheckedIn = true;
    env.window.gameState.subtask01Complete = true;
    env.window.gameState.subtask02Complete = true;
    env.window.gameState.assemblyPasscodes = { mech: 'MECH-4892', elec: null, net: null };

    // Dispatch facilityInteract event for workbench
    env.window.dispatchEvent({
      type: 'facilityInteract',
      detail: { type: 'workbench', label: 'ACCESS MECHANICAL WORKBENCH' }
    });

    const modal = env.document.getElementById('modalAssemblyPasscodeGenerated');
    assert.strictEqual(modal.classList.contains('hidden'), false, 'Passcode modal must be shown on workbench interact');

    const displayVal = env.document.getElementById('passcodeDisplayVal');
    assert.strictEqual(displayVal.textContent, 'MECH-4892');
  });

  return suiteResults;
}

if (require.main === module) {
  const results = runPasscodeWorkflowTests();
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

module.exports = { runPasscodeWorkflowTests };
