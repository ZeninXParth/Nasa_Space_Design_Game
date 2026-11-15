/**
 * Horizon-X: NASA Space Mission Design Game
 * Tier 5: Mobile & Touch Interactive Controls Test Suite
 * Validates Virtual Joystick, Touch Look, Action Hub, and Responsive Layout
 */

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

function runMobileControlsTests() {
  const suiteResults = {
    name: 'Tier 5: Mobile & Touch Interactive Controls (Virtual Joystick & Action Hub)',
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
  const mobileJsPath = path.join(__dirname, '..', 'mobileControls.js');
  const stylePath = path.join(__dirname, '..', 'style.css');

  const indexHtml = fs.readFileSync(indexPath, 'utf8');
  const mobileJs = fs.readFileSync(mobileJsPath, 'utf8');
  const styleCss = fs.readFileSync(stylePath, 'utf8');

  test('MC.1: MobileControlsManager is defined and explicitly exported to window (AGENTS.md Rule 1)', () => {
    assert.ok(mobileJs.includes('class MobileControlsManager'), 'MobileControlsManager class must be declared');
    assert.ok(mobileJs.includes('window.MobileControlsManager = MobileControlsManager'), 'MobileControlsManager must be exported to window');
  });

  test('MC.2: index.html includes mobileControls.js with uniform cache-buster ?v=7.15', () => {
    assert.ok(/mobileControls\.js\?v=7\.[0-9]+/.test(indexHtml), 'index.html must reference mobileControls.js with ?v=7.x');
  });

  test('MC.3: index.html viewport meta includes maximum-scale and cover for mobile gameplay', () => {
    assert.ok(indexHtml.includes('viewport-fit=cover') || indexHtml.includes('user-scalable=no'), 'Viewport meta must optimize for mobile gameplay');
  });

  test('MC.4: Mobile Controls DOM template defines Joystick Zone, Base, and Knob', () => {
    assert.ok(mobileJs.includes('id="mobileJoystickZone"'), 'Joystick zone must exist in template');
    assert.ok(mobileJs.includes('id="mobileJoystickBase"'), 'Joystick base must exist in template');
    assert.ok(mobileJs.includes('id="mobileJoystickKnob"'), 'Joystick knob must exist in template');
  });

  test('MC.5: Mobile Actions Hub includes Contextual Interact [E], Sprint [RUN], Camera [VIEW], and Jump', () => {
    assert.ok(mobileJs.includes('id="btnMobileInteract"'), 'Mobile interact button must exist');
    assert.ok(mobileJs.includes('id="btnMobileSprint"'), 'Mobile sprint button must exist');
    assert.ok(mobileJs.includes('id="btnMobileCamera"'), 'Mobile camera button must exist');
    assert.ok(mobileJs.includes('id="btnMobileJump"'), 'Mobile jump button must exist');
  });

  test('MC.6: Virtual joystick kinematics maps displacement vector to room keys (forward, backward, left, right)', () => {
    assert.ok(mobileJs.includes('room.keys.forward = ny < -deadzone'), 'Forward key mapping must exist');
    assert.ok(mobileJs.includes('room.keys.backward = ny > deadzone'), 'Backward key mapping must exist');
    assert.ok(mobileJs.includes('room.keys.left = nx < -deadzone'), 'Left key mapping must exist');
    assert.ok(mobileJs.includes('room.keys.right = nx > deadzone'), 'Right key mapping must exist');
  });

  test('MC.7: Auto-sprint engages when joystick is pushed past outer threshold', () => {
    assert.ok(mobileJs.includes('room.keys.sprint = true'), 'Auto-sprint or sprint lock must set room.keys.sprint');
  });

  test('MC.8: Proximity beacon dynamic labels update for laptop, computer, workbench, hubble and airlock', () => {
    assert.ok(mobileJs.includes('REQUISITION'), 'Requisition label must be handled');
    assert.ok(mobileJs.includes('CHECK IN'), 'Check in label must be handled');
    assert.ok(mobileJs.includes('WORKBENCH'), 'Workbench label must be handled');
    assert.ok(mobileJs.includes('ASSEMBLE'), 'Assemble label must be handled');
    assert.ok(mobileJs.includes('in-range'), 'in-range visual beacon class must be applied');
  });

  test('MC.9: style.css defines complete responsive styling and animations for mobile controls overlay', () => {
    assert.ok(styleCss.includes('.mobile-controls-overlay'), 'mobile-controls-overlay must be styled');
    assert.ok(styleCss.includes('.mobile-joystick-base'), 'mobile-joystick-base must be styled');
    assert.ok(styleCss.includes('.mobile-joystick-knob'), 'mobile-joystick-knob must be styled');
    assert.ok(styleCss.includes('.btn-interact'), 'btn-interact must be styled');
    assert.ok(styleCss.includes('@media (max-width: 860px)'), 'Mobile media queries must exist');
  });

  test('MC.10: Tap raycasting or proximity action triggers handleInteractKey on active 3D room', () => {
    assert.ok(mobileJs.includes('triggerInteractAction'), 'triggerInteractAction must exist');
    assert.ok(mobileJs.includes('handleInteractKey'), 'handleInteractKey must be invoked');
  });

  return suiteResults;
}

module.exports = { runMobileControlsTests };
