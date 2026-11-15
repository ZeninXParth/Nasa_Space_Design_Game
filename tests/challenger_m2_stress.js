/**
 * Horizon-X: NASA Space Design Game
 * Empirical Challenger M2 Stress Harness & Verification Oracles
 * 
 * Verifies and stress-tests:
 * 1. Physical Graphic Inspection of `assets/images/key-card.png` (PNG chunks, IHDR, CRC32, IDAT decompression, ISO 7810 ratio)
 * 2. Form Submission Stress Testing (empty, whitespace, special chars, XSS payloads, Unicode, rapid burst submissions, re-registration)
 * 3. Live Preview Dynamic Synchronization (input and change event reactivity, fallback handling)
 * 4. Modal Re-entrance & Pointer Lock State Stability (50 open/close cycles, idempotent calls, pause/unpause invariant)
 * 5. Scanner & Terminal Authentication Stress Test (permission checking, LED toggles, audio triggers, rapid calls, headless resilience)
 * 6. Multiplayer Synchronization Invariants (payload schema, peer isolation)
 * 7. AGENTS.md Invariants & Cache Buster Check
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
const { createTestEnvironment, loadScript } = require('./test_harness');

function calculateCRC32(buf) {
  let crc = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ buf[i]) & 0xFF];
  }
  return (crc ^ (-1)) >>> 0;
}

const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
  }
  CRC_TABLE[i] = c;
}

function runEmpiricalChallenge() {
  const results = {
    total: 0,
    passed: 0,
    failed: 0,
    tests: []
  };

  function challenge(description, fn) {
    results.total++;
    try {
      fn();
      results.passed++;
      results.tests.push({ description, status: 'PASS' });
      console.log(`  ✔ [CHALLENGE PASS] ${description}`);
    } catch (err) {
      results.failed++;
      results.tests.push({ description, status: 'FAIL', error: err.message, stack: err.stack });
      console.error(`  ✖ [CHALLENGE FAIL] ${description}\n    ${err.message}`);
    }
  }

  console.log('\n================================================================================');
  console.log('🛡️  EMPIRICAL CHALLENGER STRESS HARNESS: MILESTONE M2 (REGISTRATION & AUTH)');
  console.log('================================================================================\n');

  // =========================================================================
  // DOMAIN 1: PHYSICAL GRAPHIC INSPECTION (assets/images/key-card.png)
  // =========================================================================
  console.log('--- Domain 1: Physical Graphic Inspection & Byte-Level PNG Validation ---');

  const keycardPath = path.resolve(__dirname, '../assets/images/key-card.png');
  const fileBuffer = fs.readFileSync(keycardPath);

  challenge('CH-PNG-1: PNG 8-byte signature is exact standard [137, 80, 78, 71, 13, 10, 26, 10]', () => {
    const expectedSig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
    assert.strictEqual(fileBuffer.subarray(0, 8).equals(expectedSig), true);
  });

  // Parse all chunks
  let offset = 8;
  const chunks = [];
  while (offset < fileBuffer.length) {
    const length = fileBuffer.readUInt32BE(offset);
    const type = fileBuffer.toString('ascii', offset + 4, offset + 8);
    const data = fileBuffer.subarray(offset + 8, offset + 8 + length);
    const crc = fileBuffer.readUInt32BE(offset + 8 + length);
    chunks.push({ type, length, data, crc, chunkStart: offset });
    offset += 12 + length;
  }

  challenge('CH-PNG-2: First chunk is IHDR and last chunk is IEND', () => {
    assert.ok(chunks.length >= 3, `Expected at least 3 chunks (IHDR, IDAT, IEND), found ${chunks.length}`);
    assert.strictEqual(chunks[0].type, 'IHDR');
    assert.strictEqual(chunks[chunks.length - 1].type, 'IEND');
    assert.strictEqual(offset, fileBuffer.length, 'No trailing garbage bytes after IEND');
  });

  challenge('CH-PNG-3: IHDR specifications match ISO 7810 ID-1 standard ratio and RGBA format', () => {
    const ihdr = chunks[0];
    assert.strictEqual(ihdr.length, 13, 'IHDR length must be exactly 13 bytes');
    const width = ihdr.data.readUInt32BE(0);
    const height = ihdr.data.readUInt32BE(4);
    const bitDepth = ihdr.data[8];
    const colorType = ihdr.data[9];
    const compMethod = ihdr.data[10];
    const filterMethod = ihdr.data[11];
    const interlace = ihdr.data[12];

    assert.strictEqual(width, 512, 'Width must be 512px');
    assert.strictEqual(height, 324, 'Height must be 324px');
    const aspectRatio = width / height;
    assert.ok(Math.abs(aspectRatio - 1.5802) < 0.01, `Aspect ratio ${aspectRatio.toFixed(4)} matches ISO 7810 ID-1 (~1.58:1)`);
    assert.strictEqual(bitDepth, 8, 'Bit depth must be 8 bits per channel');
    assert.strictEqual(colorType, 6, 'Color type must be 6 (RGBA)');
    assert.strictEqual(compMethod, 0, 'Compression method must be 0 (deflate)');
    assert.strictEqual(filterMethod, 0, 'Filter method must be 0 (standard adaptive)');
    assert.strictEqual(interlace, 0, 'Interlace must be 0 (non-interlaced)');
  });

  challenge('CH-PNG-4: All chunk CRC32 checksums are cryptographically and mathematically valid', () => {
    for (const chunk of chunks) {
      const typeAndData = Buffer.concat([Buffer.from(chunk.type, 'ascii'), chunk.data]);
      const computedCRC = calculateCRC32(typeAndData);
      assert.strictEqual(computedCRC, chunk.crc, `CRC32 mismatch on chunk ${chunk.type}: computed 0x${computedCRC.toString(16)} vs stored 0x${chunk.crc.toString(16)}`);
    }
  });

  challenge('CH-PNG-5: IDAT payload decompresses cleanly into raw scanlines with actual non-blank pixels', () => {
    const idatChunks = chunks.filter(c => c.type === 'IDAT');
    assert.ok(idatChunks.length >= 1, 'At least 1 IDAT chunk must be present');
    const compressedData = Buffer.concat(idatChunks.map(c => c.data));
    const decompressed = zlib.inflateSync(compressedData);

    const expectedRawLength = 324 * (1 + 512 * 4); // height * (1 filter byte + width * 4 bytes RGBA)
    assert.strictEqual(decompressed.length, expectedRawLength, `Decompressed scanline buffer must equal ${expectedRawLength} bytes`);

    let nonZeroCount = 0;
    for (let i = 0; i < decompressed.length; i++) {
      if (decompressed[i] !== 0) nonZeroCount++;
    }
    const nonZeroRatio = nonZeroCount / decompressed.length;
    assert.ok(nonZeroRatio > 0.4, `Keycard image must have rich graphic detail (non-zero ratio: ${(nonZeroRatio*100).toFixed(1)}%)`);
  });

  // =========================================================================
  // DOMAIN 2: FORM SUBMISSION STRESS & INPUT BOUNDARY HARNESS
  // =========================================================================
  console.log('\n--- Domain 2: Form Submission Stress & Boundary Conditions ---');

  function setupEnvironment() {
    const env = createTestEnvironment();
    loadScript('authManager.js', env);
    loadScript('multiplayerManager.js', env);
    loadScript('lobby3d.js', env);
    loadScript('script.js', env);
    env.document.dispatchEvent('DOMContentLoaded');
    return env;
  }

  challenge('CH-FORM-1: Empty or whitespace-only callsigns fall back to default callsign', () => {
    const env = setupEnvironment();
    const callsignInput = env.document.getElementById('regOperatorCallsign');

    // Case A: Empty string
    callsignInput.value = '';
    const resA = env.window.authorizeAndIssueKeycard();
    assert.strictEqual(resA.callsign, 'Astronaut_01', 'Empty string must fallback to Astronaut_01');
    assert.strictEqual(env.window.gameState.hasKeycard, true);

    // Reset
    env.window.gameState.hasKeycard = false;
    env.window.gameState.keycardRegistered = false;

    // Case B: Pure whitespace
    callsignInput.value = '     \t  \n  ';
    const resB = env.window.authorizeAndIssueKeycard();
    assert.strictEqual(resB.callsign, 'Astronaut_01', 'Whitespace string must fallback to Astronaut_01');
  });

  challenge('CH-FORM-2: Callsigns with special characters, XSS vectors, and emojis are safely handled', () => {
    const testCases = [
      { input: '<script>alert("hack")</script>', expectedName: '<script>alert("hack")</script>' },
      { input: 'Astro\' OR \'1\'=\'1', expectedName: 'Astro\' OR \'1\'=\'1' },
      { input: '🚀 Commander Orion 🛰️', expectedName: '🚀 Commander Orion 🛰️' },
      { input: 'A'.repeat(300), expectedName: 'A'.repeat(300) }
    ];

    for (const tc of testCases) {
      const env = setupEnvironment();
      const callsignInput = env.document.getElementById('regOperatorCallsign');
      callsignInput.value = tc.input;
      const res = env.window.authorizeAndIssueKeycard();

      assert.strictEqual(res.callsign, tc.expectedName);
      assert.strictEqual(env.window.gameState.operatorName, tc.expectedName);
      const hudBadge = env.document.getElementById('hudKeycardBadge');
      assert.strictEqual(hudBadge.classList.contains('hidden'), false);
    }
  });

  challenge('CH-FORM-3: Department switching assigns exact department slice and handles invalid fallbacks', () => {
    const env = setupEnvironment();
    const deptSelect = env.document.getElementById('regDepartmentSelect');

    const validDepts = ['mechanical', 'electronic', 'network'];
    for (const d of validDepts) {
      deptSelect.value = d;
      const res = env.window.authorizeAndIssueKeycard();
      assert.strictEqual(res.department, d);
      assert.strictEqual(env.window.gameState.activeDept, d);
    }

    const customRes = env.window.authorizeAndIssueKeycard({
      callsign: 'FlightDirector_Gene',
      department: 'orbital_operations',
      clearance: 'STS-61 Director Level 5'
    });
    assert.strictEqual(customRes.callsign, 'FlightDirector_Gene');
    assert.strictEqual(customRes.department, 'orbital_operations');
    assert.strictEqual(customRes.clearance, 'STS-61 Director Level 5');
    assert.strictEqual(env.window.gameState.activeDept, 'orbital_operations');
  });

  challenge('CH-FORM-4: Rapid burst submissions (50 concurrent/sequential calls) maintain state integrity', () => {
    const env = setupEnvironment();
    const callsignInput = env.document.getElementById('regOperatorCallsign');

    for (let i = 0; i < 50; i++) {
      callsignInput.value = `BurstAstronaut_${i}`;
      const res = env.window.authorizeAndIssueKeycard();
      assert.strictEqual(res.callsign, `BurstAstronaut_${i}`);
      assert.strictEqual(env.window.gameState.hasKeycard, true);
      assert.strictEqual(env.window.gameState.keycardRegistered, true);
    }
    assert.strictEqual(env.window.gameState.operatorName, 'BurstAstronaut_49');
    assert.strictEqual(env.window.gameState.keycardRegistrationData.callsign, 'BurstAstronaut_49');
  });

  challenge('CH-FORM-5: Re-registration with new credentials updates existing keycard data', () => {
    const env = setupEnvironment();
    env.window.authorizeAndIssueKeycard({
      callsign: 'Cadet_Initial',
      department: 'mechanical'
    });
    assert.strictEqual(env.window.gameState.operatorName, 'Cadet_Initial');
    assert.strictEqual(env.window.gameState.activeDept, 'mechanical');

    env.window.authorizeAndIssueKeycard({
      callsign: 'Lead_Promoted',
      department: 'network',
      clearance: 'Level 4 Cleanroom Shift Lead'
    });
    assert.strictEqual(env.window.gameState.operatorName, 'Lead_Promoted');
    assert.strictEqual(env.window.gameState.activeDept, 'network');
    assert.strictEqual(env.window.gameState.keycardRegistrationData.clearance, 'Level 4 Cleanroom Shift Lead');
  });

  // =========================================================================
  // DOMAIN 3: LIVE PREVIEW SYNCHRONIZATION
  // =========================================================================
  console.log('\n--- Domain 3: Live Preview Dynamic Synchronization ---');

  challenge('CH-PREV-1: Typing into callsign input dispatches "input" event and updates preview immediately', () => {
    const env = setupEnvironment();
    const callsignInput = env.document.getElementById('regOperatorCallsign');
    const previewCallsign = env.document.getElementById('previewCallsign');

    assert.ok(callsignInput, 'Input exists');
    assert.ok(previewCallsign, 'Preview element exists');

    callsignInput.value = 'Discovery_Pilot';
    callsignInput.dispatchEvent({ type: 'input', target: callsignInput });

    assert.strictEqual(previewCallsign.textContent, 'CALLSIGN: Discovery_Pilot');

    callsignInput.value = '';
    callsignInput.dispatchEvent({ type: 'input', target: callsignInput });
    assert.strictEqual(previewCallsign.textContent, 'CALLSIGN: ASTRONAUT');
  });

  challenge('CH-PREV-2: Selecting new department dispatches "change" event and updates preview immediately', () => {
    const env = setupEnvironment();
    const deptSelect = env.document.getElementById('regDepartmentSelect');
    const previewDept = env.document.getElementById('previewDept');

    deptSelect.value = 'network';
    deptSelect.dispatchEvent({ type: 'change', target: deptSelect });
    assert.strictEqual(previewDept.textContent, 'DEPT: NETWORK');

    deptSelect.value = 'mechanical';
    deptSelect.dispatchEvent({ type: 'change', target: deptSelect });
    assert.strictEqual(previewDept.textContent, 'DEPT: MECHANICAL');
  });

  challenge('CH-PREV-3: Clearance status preview transitions from PENDING ISSUE to AUTHORIZED upon issuance', () => {
    const env = setupEnvironment();
    env.window.openLobbyRegistrationModal();

    const previewClearance = env.document.querySelector('.overlay-clearance');
    assert.ok(previewClearance, 'Clearance overlay exists');
    assert.strictEqual(previewClearance.textContent, 'STATUS: PENDING ISSUE');

    env.window.authorizeAndIssueKeycard();
    assert.strictEqual(previewClearance.textContent, 'STATUS: AUTHORIZED');
  });

  // =========================================================================
  // DOMAIN 4: MODAL RE-ENTRANCE & 3D POINTER LOCK STABILITY
  // =========================================================================
  console.log('\n--- Domain 4: Modal Re-entrance & Pointer Lock Stability ---');

  challenge('CH-MODAL-1: Opening modal releases pointer lock and pauses active 3D room', () => {
    const env = setupEnvironment();
    let exitPointerLockCalled = false;
    env.document.pointerLockElement = env.document.getElementById('facilityCanvas') || {};
    env.document.exitPointerLock = () => { exitPointerLockCalled = true; };

    const mockRoom = { isPaused: false };
    env.window.facilityRoomInstance = mockRoom;

    env.window.openLobbyRegistrationModal();

    assert.strictEqual(exitPointerLockCalled, true, 'document.exitPointerLock() must be called');
    assert.strictEqual(mockRoom.isPaused, true, 'Active room must be paused');

    const modal = env.document.getElementById('modalLobbyRegistration');
    assert.strictEqual(modal.classList.contains('hidden'), false);
    assert.strictEqual(modal.attributes['aria-hidden'], 'false');
  });

  challenge('CH-MODAL-2: Closing modal hides window and unpauses active 3D room', () => {
    const env = setupEnvironment();
    const mockRoom = { isPaused: true };
    env.window.facilityRoomInstance = mockRoom;

    env.window.openLobbyRegistrationModal();
    env.window.closeLobbyRegistrationModal();

    assert.strictEqual(mockRoom.isPaused, false, 'Active room must be unpaused');
    const modal = env.document.getElementById('modalLobbyRegistration');
    assert.strictEqual(modal.classList.contains('hidden'), true);
    assert.strictEqual(modal.attributes['aria-hidden'], 'true');
  });

  challenge('CH-MODAL-3: 50 rapid alternating open/close cycles maintain deterministic invariant states', () => {
    const env = setupEnvironment();
    const mockRoom = { isPaused: false };
    env.window.facilityRoomInstance = mockRoom;
    const modal = env.document.getElementById('modalLobbyRegistration');

    for (let i = 0; i < 50; i++) {
      env.window.openLobbyRegistrationModal();
      assert.strictEqual(mockRoom.isPaused, true);
      assert.strictEqual(modal.classList.contains('hidden'), false);

      env.window.closeLobbyRegistrationModal();
      assert.strictEqual(mockRoom.isPaused, false);
      assert.strictEqual(modal.classList.contains('hidden'), true);
    }
  });

  challenge('CH-MODAL-4: Repeated calls to open (when open) and close (when closed) are idempotent', () => {
    const env = setupEnvironment();
    const mockRoom = { isPaused: false };
    env.window.facilityRoomInstance = mockRoom;
    const modal = env.document.getElementById('modalLobbyRegistration');

    // Repeated open
    env.window.openLobbyRegistrationModal();
    env.window.openLobbyRegistrationModal();
    env.window.openLobbyRegistrationModal();
    assert.strictEqual(mockRoom.isPaused, true);
    assert.strictEqual(modal.classList.contains('hidden'), false);

    // Repeated close
    env.window.closeLobbyRegistrationModal();
    env.window.closeLobbyRegistrationModal();
    env.window.closeLobbyRegistrationModal();
    assert.strictEqual(mockRoom.isPaused, false);
    assert.strictEqual(modal.classList.contains('hidden'), true);
  });

  challenge('CH-MODAL-5: Close button click event handler properly delegates to closeLobbyRegistrationModal', () => {
    const env = setupEnvironment();
    const mockRoom = { isPaused: false };
    env.window.facilityRoomInstance = mockRoom;
    const modal = env.document.getElementById('modalLobbyRegistration');
    const closeBtn = env.document.getElementById('btnCloseLobbyRegistrationModal');

    env.window.openLobbyRegistrationModal();
    assert.strictEqual(modal.classList.contains('hidden'), false);

    closeBtn.dispatchEvent({ type: 'click' });
    assert.strictEqual(modal.classList.contains('hidden'), true);
    assert.strictEqual(mockRoom.isPaused, false);
  });

  // =========================================================================
  // DOMAIN 5: SCANNER & TERMINAL AUTHENTICATION STRESS TEST
  // =========================================================================
  console.log('\n--- Domain 5: Scanner & Terminal Authentication Stress Test ---');

  challenge('CH-SCAN-1: Access Denied branch triggers red LED (0xFF2222), buzzer, banner, and blocks doors', () => {
    const env = setupEnvironment();
    let ledColorSet = null;
    let doorsOpened = false;
    let buzzerPlayed = false;

    env.window.facilityRoomInstance = {
      setTerminalLedColor: (hex) => { ledColorSet = hex; },
      openDoors: () => { doorsOpened = true; }
    };
    env.window.playKeycardDeniedSound = () => { buzzerPlayed = true; };

    env.window.gameState.hasKeycard = false;

    const authResult = env.window.verifyKeycardAccess();
    assert.strictEqual(authResult, false, 'Must reject access when hasKeycard is false');
    assert.strictEqual(ledColorSet, 0xFF2222, 'Must set terminal LED to RED (0xFF2222)');
    assert.strictEqual(buzzerPlayed, true, 'Must play denied buzzer sound');
    assert.strictEqual(doorsOpened, false, 'Must NOT open sliding doors');

    const banner = env.document.getElementById('hudSecurityBanner');
    assert.ok(banner.textContent.includes('ACCESS DENIED'));
    assert.strictEqual(banner.classList.contains('denied'), true);
  });

  challenge('CH-SCAN-2: Access Granted branch triggers green LED (0x00FF88), chime, banner, and opens doors', () => {
    const env = setupEnvironment();
    let ledColorSet = null;
    let doorsOpened = false;
    let chimePlayed = false;

    env.window.facilityRoomInstance = {
      setTerminalLedColor: (hex) => { ledColorSet = hex; },
      openDoors: () => { doorsOpened = true; }
    };
    env.window.playKeycardGrantedSound = () => { chimePlayed = true; };

    env.window.gameState.hasKeycard = true;

    const authResult = env.window.verifyKeycardAccess();
    assert.strictEqual(authResult, true, 'Must grant access when hasKeycard is true');
    assert.strictEqual(ledColorSet, 0x00FF88, 'Must set terminal LED to GREEN (0x00FF88)');
    assert.strictEqual(chimePlayed, true, 'Must play granted chime sound');
    assert.strictEqual(doorsOpened, true, 'Must invoke openDoors() on active room');

    const banner = env.document.getElementById('hudSecurityBanner');
    assert.ok(banner.textContent.includes('ACCESS GRANTED'));
    assert.strictEqual(banner.classList.contains('granted'), true);
  });

  challenge('CH-SCAN-3: Verification terminal is resilient when facilityRoomInstance or methods are absent', () => {
    const env = setupEnvironment();
    env.window.facilityRoomInstance = null;

    env.window.gameState.hasKeycard = false;
    assert.doesNotThrow(() => {
      const res = env.window.verifyKeycardAccess();
      assert.strictEqual(res, false);
    });

    env.window.gameState.hasKeycard = true;
    assert.doesNotThrow(() => {
      const res = env.window.verifyKeycardAccess();
      assert.strictEqual(res, true);
    });
  });

  challenge('CH-SCAN-4: Rapid scanning stress test (100 sequential verification calls) is stable', () => {
    const env = setupEnvironment();
    let doorCallCount = 0;
    env.window.facilityRoomInstance = {
      setTerminalLedColor: () => {},
      openDoors: () => { doorCallCount++; }
    };
    env.window.gameState.hasKeycard = true;

    for (let i = 0; i < 100; i++) {
      const res = env.window.verifyKeycardAccess();
      assert.strictEqual(res, true);
    }
    assert.strictEqual(doorCallCount, 100);
  });

  // =========================================================================
  // DOMAIN 6: MULTIPLAYER SYNCHRONIZATION INVARIANTS
  // =========================================================================
  console.log('\n--- Domain 6: Multiplayer Synchronization Invariants ---');

  challenge('CH-NET-1: Keycard issuance broadcasts SYNC_KEYCARD_REGISTRATION packet with valid metadata', () => {
    const env = setupEnvironment();
    let packetSent = null;

    env.window.multiplayerManager = {
      syncKeycardRegistration: (data) => {
        packetSent = data;
      }
    };

    env.window.authorizeAndIssueKeycard({
      callsign: 'Astronaut_Buzz',
      department: 'electronic',
      clearance: 'STS-61 Tier 3'
    });

    assert.ok(packetSent, 'Must call syncKeycardRegistration');
    assert.strictEqual(packetSent.callsign, 'Astronaut_Buzz');
    assert.strictEqual(packetSent.department, 'electronic');
    assert.strictEqual(packetSent.clearance, 'STS-61 Tier 3');
    assert.ok(typeof packetSent.issuedAt === 'number');
  });

  // =========================================================================
  // DOMAIN 7: AGENTS.MD INVARIANTS & INTEGRITY VERIFICATION
  // =========================================================================
  console.log('\n--- Domain 7: AGENTS.md Invariants & Cache Buster Check ---');

  challenge('CH-RULE-1: All required functions and classes are explicitly attached to window', () => {
    const env = setupEnvironment();
    const requiredGlobals = [
      'openLobbyRegistrationModal',
      'closeLobbyRegistrationModal',
      'authorizeAndIssueKeycard',
      'verifyKeycardAccess',
      'playKeycardGrantedSound',
      'playKeycardDeniedSound',
      'LobbyFPSRoom'
    ];

    for (const g of requiredGlobals) {
      assert.strictEqual(typeof env.window[g], 'function', `Global ${g} must be exported to window`);
    }
  });

  challenge('CH-RULE-2: Cache buster ?v=5.7 is uniformly updated across all 14 project script/link tags', () => {
    const htmlContent = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    const requiredBumps = [
      'assets/js/hubbleGlbData.js?v=5.7',
      'assets/js/avatarGlbData.js?v=5.7',
      'style.css?v=5.7',
      'multiplayerManager.js?v=5.7',
      'voiceManager.js?v=5.7',
      'facility3d.js?v=5.7',
      'workbench3d.js?v=5.7',
      'sadm3d.js?v=5.7',
      'electronicsWorkbench3d.js?v=5.7',
      'networkWorkbench3d.js?v=5.7',
      'assembly3d.js?v=5.7',
      'authManager.js?v=5.7',
      'lobby3d.js?v=5.7',
      'script.js?v=5.7'
    ];

    for (const tag of requiredBumps) {
      assert.ok(htmlContent.includes(tag), `index.html must contain updated cache buster: ${tag}`);
    }
    assert.strictEqual(htmlContent.includes('?v=5.6'), false, 'Zero legacy ?v=5.6 tags allowed');
  });

  // =========================================================================
  // SUMMARY SCOREBOARD
  // =========================================================================
  console.log('\n================================================================================');
  console.log(`🏁 EMPIRICAL CHALLENGE SUMMARY: ${results.passed}/${results.total} CHALLENGES PASSED`);
  console.log(`Failed: ${results.failed}`);
  console.log('================================================================================\n');

  if (results.failed > 0) {
    throw new Error(`${results.failed} challenge tests failed!`);
  }

  return results;
}

if (require.main === module) {
  try {
    runEmpiricalChallenge();
    process.exit(0);
  } catch (err) {
    console.error('Empirical Challenger suite encountered failures:', err.message);
    process.exit(1);
  }
}

module.exports = { runEmpiricalChallenge };
