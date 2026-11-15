/**
 * Horizon-X | NASA Space Mission Design Game
 * Controller: Main Menu, Missions, Objective, Settings, and 3D FPS Facility Room
 * Phase 1 Architecture:
 * - Workflow: Start -> Missions -> Objective -> Start -> Smooth Transition -> Facility Enter
 * - Facility Controller Voiceover & Audio Transmission Sequencer (3 dialogues)
 * - Desk 01 (East Wall):
 *   1. Laptop (Marketplace with $150,000 budget & flight hardware requisition)
 *   2. Computer (Check IN & Registration Terminal, unlocking Mechanical Department control)
 *   3. Assembly & Research Papers (Technical Memorandum & schematics)
 *   4. Coffee Cup (NIO - Non-Interact Object)
 *   5. Workbench (Torque calibration & Damper installation)
 * - HUD: Mechanical Department status, Main Task, and Subtasks [SUB-TSK-M-01] & [SUB-TSK-M-02]
 */

document.addEventListener('DOMContentLoaded', () => {
  // --- Web Audio Synthesizer for Authentic Aerospace SFX ---
  let audioCtx = null;
  function getAudioContext() {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  function playRadioBeep(freq = 880, duration = 0.08, type = 'sine') {
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration);
    } catch (e) {}
  }

  // Authentic NASA Quindar Signaling Tones (Apollo & Shuttle GSFC Manned Spacecraft Center Spec)
  // Intro (PTT ON): 2525 Hz sine wave, 250 ms duration
  // Outro (PTT OFF): 2475 Hz sine wave, 250 ms duration
  function playQuindarTone(type = 'intro') {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const freq = (type === 'outro') ? 2475 : 2525;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(0.12, now + 0.005);
      gain.gain.setValueAtTime(0.12, now + 0.24);
      gain.gain.linearRampToValueAtTime(0.0001, now + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  function playCommsChirp() {
    playRadioBeep(1200, 0.06, 'triangle');
    setTimeout(() => playRadioBeep(1800, 0.08, 'sine'), 60);
  }

  function playSuccessChime() {
    playRadioBeep(523.25, 0.12, 'sine'); // C5
    setTimeout(() => playRadioBeep(659.25, 0.12, 'sine'), 100); // E5
    setTimeout(() => playRadioBeep(783.99, 0.15, 'sine'), 200); // G5
    setTimeout(() => playRadioBeep(1046.50, 0.25, 'sine'), 300); // C6
  }

  // --- Enhanced Authentic Aerospace Audio System ---
  function playCalmAlertSound() {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Soft, calming two-tone harmonic bell (non-jarring, friendly feedback)
      [520, 440].forEach((freq, i) => {
        const t = now + i * 0.12;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.08, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.38);
      });
    } catch (e) {}
  }

  function playInstrumentEquipped() {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Crisp mechanical tool holster/snap
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(840, now);
      osc.frequency.exponentialRampToValueAtTime(1400, now + 0.05);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    } catch (e) {}
  }

  function playPartFitted() {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Heavy mechanical docking clack + secondary acoustic chime
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(180, now);
      osc1.frequency.exponentialRampToValueAtTime(45, now + 0.15);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.17);

      setTimeout(() => {
        if (isAudioMuted) return;
        const t = ctx.currentTime;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(960, t);
        gain2.gain.setValueAtTime(0.14, t);
        gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.28);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(t);
        osc2.stop(t + 0.30);
      }, 40);
    } catch (e) {}
  }

  function playCheckoutStamp() {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Digital authorization stamp
      [440, 660, 880].forEach((freq, idx) => {
        const t = now + idx * 0.07;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.15, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.20);
      });
    } catch (e) {}
  }

  function playMissionAccomplished() {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Grand celebratory aerospace fanfare: C5, E5, G5, B5, C6
      const chord = [523.25, 659.25, 783.99, 987.77, 1046.50];
      chord.forEach((freq, idx) => {
        const t = now + idx * 0.14;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t);
        gain.gain.setValueAtTime(0.18, t);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.85);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(t);
        osc.stop(t + 0.90);
      });
    } catch (e) {}
  }

  // --- Phase 3 M2: Keycard Sound Synthesizers (Web Audio API) ---
  function playKeycardGrantedSound() {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Note 1: 1200 Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(1200, now);
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.18, now + 0.01);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.11);

      // Note 2: 1600 Hz (ascending chime)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1600, now + 0.09);
      gain2.gain.setValueAtTime(0.0001, now + 0.09);
      gain2.gain.linearRampToValueAtTime(0.20, now + 0.10);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.09);
      osc2.stop(now + 0.29);
    } catch (e) {}
  }
  window.playKeycardGrantedSound = playKeycardGrantedSound;

  function playKeycardDeniedSound() {
    if (isAudioMuted) return;
    try {
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      // Sawtooth buzzer burst 1: 220 Hz
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(220, now);
      gain1.gain.setValueAtTime(0.0001, now);
      gain1.gain.linearRampToValueAtTime(0.22, now + 0.008);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.09);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.095);

      // Sawtooth buzzer burst 2: 220 Hz after 60ms gap
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(220, now + 0.15);
      gain2.gain.setValueAtTime(0.0001, now + 0.15);
      gain2.gain.linearRampToValueAtTime(0.22, now + 0.158);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.245);
    } catch (e) {}
  }
  window.playKeycardDeniedSound = playKeycardDeniedSound;

  window.nasaAudio = {
    playCalmAlertSound,
    playInstrumentEquipped,
    playPartFitted,
    playCheckoutStamp,
    playMissionAccomplished,
    playSuccessChime,
    playQuindarTone,
    playKeycardGrantedSound,
    playKeycardDeniedSound
  };

  function showKeycardHudBanner(message, isGranted) {
    const bannerEl = document.getElementById('hudSecurityBanner');
    if (bannerEl) {
      bannerEl.textContent = message;
      bannerEl.className = 'hud-security-banner ' + (isGranted ? 'granted' : 'denied');
      bannerEl.classList.remove('hidden');
      clearTimeout(bannerEl._timer);
      bannerEl._timer = setTimeout(() => {
        bannerEl.classList.add('hidden');
      }, 4000);
    }
    if (typeof showCenterCalmAlert === 'function') {
      const title = isGranted ? 'SECURITY ACCESS' : 'ACCESS RESTRICTED';
      const icon = isGranted ? '🛡️' : '⛔';
      showCenterCalmAlert(title, message, icon);
    }
  }
  window.showKeycardHudBanner = showKeycardHudBanner;

  // --- Center Pointer Calm Alert Notification ---
  let calmAlertTimer = null;
  function showCenterCalmAlert(title, message, icon = '🛡️') {
    const alertEl = document.getElementById('hudCenterCalmAlert');
    const titleEl = document.getElementById('calmAlertTitle');
    const msgEl = document.getElementById('calmAlertMsg');
    const iconEl = document.getElementById('calmAlertIcon');
    if (!alertEl || !titleEl || !msgEl) return;

    titleEl.textContent = title;
    msgEl.textContent = message;
    if (iconEl) iconEl.textContent = icon;

    alertEl.classList.remove('hidden');
    playCalmAlertSound();

    if (calmAlertTimer) clearTimeout(calmAlertTimer);
    calmAlertTimer = setTimeout(() => {
      alertEl.classList.add('hidden');
    }, 3400);
  }
  window.showCenterCalmAlert = showCenterCalmAlert;

  // --- Background Audio & Click SFX ---
  const bgMusic = document.getElementById('bgMusic');
  const clickSfx = document.getElementById('clickSfx');
  const audioToggleBtn = document.getElementById('audioToggleBtn');
  const audioIconOn = document.getElementById('audioIconOn');
  const audioIconOff = document.getElementById('audioIconOff');
  const audioStatusText = document.getElementById('audioStatusText');
  const settingAudioToggle = document.getElementById('settingAudioToggle');
  const settingAudioDot = document.getElementById('settingAudioDot');
  const settingAudioStatusText = document.getElementById('settingAudioStatusText');

  // --- Screens ---
  const screens = {
    menu: document.getElementById('mainMenuScreen'),
    missions: document.getElementById('missionsScreen'),
    objective: document.getElementById('objectiveScreen'),
    room: document.getElementById('roomScreen'),
    proom: document.getElementById('pRoomScreen'),
    settings: document.getElementById('settingsScreen'),
    facility: document.getElementById('facilityScreen'),
    simulation: document.getElementById('simulationScreen'),
    ending: document.getElementById('endingScreen')
  };

  let facilityRoomInstance = null;
  let activeScreenKey = 'menu';
  let screenBeforeSettings = 'menu';

  // --- Audio Logic ---
  let isAudioMuted = false;
  window.isNasaAudioMuted = () => isAudioMuted;
  let bgMusicStarted = false;
  if (bgMusic) bgMusic.volume = 0.45;
  if (clickSfx) clickSfx.volume = 0.6;

  function playClick() {
    try {
      if (clickSfx) {
        clickSfx.currentTime = 0;
        clickSfx.play().catch(() => {});
      }
    } catch (e) {}
  }

    // Wire Figma 378:131 Controls Drawer
  const btnToggleControlsGuide = document.getElementById('btnToggleControlsGuide');
  const settingsControlsDrawer = document.getElementById('settingsControlsDrawer');
  if (btnToggleControlsGuide && settingsControlsDrawer) {
    btnToggleControlsGuide.addEventListener('click', () => {
      settingsControlsDrawer.classList.toggle('hidden');
    });
  }

  // Update Figma Audio Pill Toggle UI state
  function syncFigmaAudioToggleUI(isOn) {
    const toggle = document.getElementById('settingAudioToggle');
    if (toggle) {
      if (isOn) {
        toggle.classList.remove('is-off');
        toggle.classList.add('is-on');
        toggle.setAttribute('aria-checked', 'true');
      } else {
        toggle.classList.add('is-off');
        toggle.classList.remove('is-on');
        toggle.setAttribute('aria-checked', 'false');
      }
    }
  }

  function toggleAudio() {
    playClick();
    getAudioContext();
    isAudioMuted = !isAudioMuted;
    if (!isAudioMuted) {
      if (bgMusic) {
        bgMusic.play().then(() => {
          bgMusicStarted = true;
        }).catch((e) => console.log('Audio playback pending user gesture:', e));
      }
    } else {
      if (bgMusic) {
        try { bgMusic.pause(); } catch (e) {}
      }
      if (sadm3DInstance && sadm3DInstance.stopServoHum) {
        sadm3DInstance.stopServoHum();
      }
    }
    updateAudioUI();
  }

  function updateAudioUI() {
    if (isAudioMuted) {
      if (audioIconOn) audioIconOn.classList.add('hidden');
      if (audioIconOff) audioIconOff.classList.remove('hidden');
      if (audioStatusText) {
        audioStatusText.textContent = 'OFF';
        audioStatusText.style.color = 'rgba(255, 255, 255, 0.4)';
      }
      if (settingAudioStatusText) {
        settingAudioStatusText.textContent = 'AUDIO: DISABLED (CLICK TO ENABLE)';
      }
      syncFigmaAudioToggleUI(false);
      if (settingAudioDot) {
        settingAudioDot.className = 'settings-audio-dot dot-off';
      }
    } else {
      if (audioIconOn) audioIconOn.classList.remove('hidden');
      if (audioIconOff) audioIconOff.classList.add('hidden');
      if (audioStatusText) {
        audioStatusText.textContent = 'ON';
        audioStatusText.style.color = '#ffffff';
      }
      if (settingAudioStatusText) {
        settingAudioStatusText.textContent = 'AUDIO: ENABLED (CLICK TO MUTE)';
      }
      syncFigmaAudioToggleUI(true);
      if (settingAudioDot) {
        settingAudioDot.className = 'settings-audio-dot dot-on';
      }
    }
  }

  if (audioToggleBtn) audioToggleBtn.addEventListener('click', toggleAudio);
  if (settingAudioToggle) settingAudioToggle.addEventListener('click', toggleAudio);
  updateAudioUI();

  document.body.addEventListener('click', () => {
    getAudioContext();
    if (!bgMusicStarted && !isAudioMuted && bgMusic) {
      bgMusic.play().then(() => {
        bgMusicStarted = true;
        updateAudioUI();
      }).catch(() => {});
    }
  }, { once: true });

  // --- Screen Navigation ---
  function showScreen(screenKey) {
    playClick();

    if (screenKey === 'settings') {
      if (activeScreenKey !== 'settings') {
        screenBeforeSettings = activeScreenKey;
      }
      if (typeof syncSettingsInputsFromGameState === 'function') {
        syncSettingsInputsFromGameState();
      }
      if (typeof captureBaselineSettings === 'function') {
        captureBaselineSettings();
      }
      updateAudioUI();
    }
    activeScreenKey = screenKey;

    if (facilityRoomInstance && screenKey !== 'facility') {
      facilityRoomInstance.stop();
    }
    if (window.lobbyRoomInstance && screenKey !== 'facility') {
      window.lobbyRoomInstance.stop();
    }
    if (window.launchSimulationInstance && screenKey !== 'simulation') {
      window.launchSimulationInstance.stop();
    }

    Object.keys(screens).forEach((key) => {
      if (screens[key]) {
        screens[key].classList.remove('active');
      }
    });

    if (screens[screenKey]) {
      screens[screenKey].classList.add('active');
      window.location.hash = screenKey;

      if (screenKey === 'facility') {
        if (document.activeElement && typeof document.activeElement.blur === 'function') {
          document.activeElement.blur();
        }
        if (!gameState.hasEnteredFacility) {
          // Clean up any stale cleanroom facility room instance before mounting Lobby
          if (facilityRoomInstance) {
            try { facilityRoomInstance.destroy(); } catch (e) {}
            facilityRoomInstance = null;
            window.facilityRoomInstance = null;
          }
          const container = document.getElementById('facility3dCanvasContainer');
          if (container && !window.lobbyRoomInstance) {
            container.innerHTML = '';
          }

          // --- Phase 3: Player Spawns in Lobby Area First ---
          const LobbyClass = window.LobbyFPSRoom || (typeof LobbyFPSRoom !== 'undefined' ? LobbyFPSRoom : null);
          const isMpLobby = !!(gameState.isMultiplayer || (window.multiplayerManager && window.multiplayerManager.isInRoom));
          if (!window.lobbyRoomInstance && LobbyClass) {
            window.lobbyRoomInstance = new LobbyClass('facility3dCanvasContainer', {
              cameraMode: isMpLobby ? 'third_person' : 'first_person'
            });
          }
          if (window.lobbyRoomInstance) {
            if (isMpLobby && typeof window.lobbyRoomInstance.toggleCameraMode === 'function') {
              window.lobbyRoomInstance.toggleCameraMode('third_person');
            }
            window.lobbyRoomInstance.start();
            setTimeout(() => window.lobbyRoomInstance && window.lobbyRoomInstance.onWindowResize(), 60);
          }
          if (typeof updateLobbyWaitingState === 'function') {
            updateLobbyWaitingState();
          }
        } else {
          // --- Player Has Crossed into Cleanroom Facility Room ---
          const FacClass = window.FacilityFPSRoom || (typeof FacilityFPSRoom !== 'undefined' ? FacilityFPSRoom : null);
          if (!facilityRoomInstance && FacClass) {
            facilityRoomInstance = new FacClass('facility3dCanvasContainer');
            window.facilityRoomInstance = facilityRoomInstance;
          }
          if (facilityRoomInstance) {
            facilityRoomInstance.start();
            setTimeout(() => facilityRoomInstance.onWindowResize(), 60);
          }
          // Initialize Player Frame HUD & Mission Checklist
          updatePlayerFrameUI();
          updateMissionChecklistUI();
          // Trigger Phase 1 Facility Controller Transmission
          if (!gameState.commsDone) {
            initFacilityCommsSequence();
          }
        }
      } else if (screenKey === 'simulation') {
        if (!window.launchSimulationInstance && window.LaunchSimulation) {
          window.launchSimulationInstance = new window.LaunchSimulation('simulationCanvas', {
            onComplete: () => {
              showScreen('ending');
            }
          });
        }
        if (window.launchSimulationInstance) {
          window.launchSimulationInstance.start();
        }
      } else if (screenKey === 'ending') {
        playSuccessChime();
        playRadioBeep(880, 0.4, 'sine');
        if (typeof window.renderMissionDecisionAudit === 'function') {
          window.renderMissionDecisionAudit();
        }
      }
    }
  }

  function handleHashChange() {
    const hash = window.location.hash.replace('#', '').toLowerCase();
    if (hash === 'missions') showScreen('missions');
    else if (hash === 'objective') showScreen('objective');
    else if (hash === 'room') showScreen('room');
    else if (hash === 'proom' || hash === 'private-room') showScreen('proom');
    else if (hash === 'settings') showScreen('settings');
    else if (hash === 'facility') showScreen('facility');
    else if (hash === 'simulation') showScreen('simulation');
    else if (hash === 'ending') showScreen('ending');
    else showScreen('menu');
  }

  // --- Main Menu Navigation ---
  const SAVE_KEY = 'nasa_space_design_autosave';
  const btnContinue = document.getElementById('btnContinue');
  const continueBadge = document.getElementById('continueBadge');
  const btnStart = document.getElementById('btnStart');
  const btnRoom = document.getElementById('btnRoom');
  const btnSettings = document.getElementById('btnSettings');

  function enableAudioOnUserGesture() {
    getAudioContext();
    if (isAudioMuted) {
      isAudioMuted = false;
      updateAudioUI();
      if (bgMusic && bgMusic.paused) {
        bgMusic.play().then(() => {
          bgMusicStarted = true;
        }).catch(() => {});
      }
    }
  }
  window.enableAudioOnUserGesture = enableAudioOnUserGesture;

  if (btnContinue) {
    btnContinue.addEventListener('click', () => {
      enableAudioOnUserGesture();
      loadAutoSave();
    });
  }

  if (btnStart) {
    btnStart.addEventListener('click', () => {
      enableAudioOnUserGesture();
      resetGameState();
      showScreen('missions');
    });
  }
  if (btnRoom) btnRoom.addEventListener('click', () => showScreen('room'));
  if (btnSettings) {
    btnSettings.addEventListener('click', () => {
      captureBaselineSettings();
      showScreen('settings');
    });
  }

  // --- Missions & Space Mission Targets Navigation ---
  const missionCard1 = document.getElementById('missionCard1');
  const missionCard2 = document.getElementById('missionCard2');
  const btnSelectHubble = document.getElementById('btnSelectHubble');
  const btnSelectJwst = document.getElementById('btnSelectJwst');
  const btnSelectChandra = document.getElementById('btnSelectChandra');
  const targetCardHubble = document.getElementById('targetCardHubble');
  const targetCardJwst = document.getElementById('targetCardJwst');
  const targetCardChandra = document.getElementById('targetCardChandra');
  const btnMissionsBack = document.getElementById('btnMissionsBack');

  // Educational Complexity Toggle
  const btnDiffApprentice = document.getElementById('btnDiffApprentice');
  const btnDiffEngineer = document.getElementById('btnDiffEngineer');
  const objDifficultyTag = document.getElementById('objDifficultyTag');

  function setDifficultyLevel(level) {
    gameState.difficultyLevel = level;
    if (btnDiffApprentice) btnDiffApprentice.classList.toggle('active', level === 'apprentice');
    if (btnDiffEngineer) btnDiffEngineer.classList.toggle('active', level === 'engineer');
    if (objDifficultyTag) {
      objDifficultyTag.textContent = (level === 'apprentice')
        ? 'LEVEL 1 : APPRENTICE (AGE 13+)'
        : 'LEVEL 2 : FLIGHT ENGINEER';
    }
    if (window.showToast) {
      window.showToast(level === 'apprentice'
        ? 'MODE: Apprentice (Age 13+) Activated - Guided hints & simplified aerospace terminology'
        : 'MODE: Flight Engineer Activated - Standard flight tolerances & full telemetry', '🎓');
    }
  }

  if (btnDiffApprentice) {
    btnDiffApprentice.addEventListener('click', () => {
      playClick();
      setDifficultyLevel('apprentice');
    });
  }
  if (btnDiffEngineer) {
    btnDiffEngineer.addEventListener('click', () => {
      playClick();
      setDifficultyLevel('engineer');
    });
  }

  // Target 1: Hubble Space Telescope (Primary Active Campaign)
  function selectHubbleTarget() {
    playClick();
    enableAudioOnUserGesture();
    gameState.selectedTarget = 'hubble';
    showScreen('objective');
  }
  if (btnSelectHubble) btnSelectHubble.addEventListener('click', selectHubbleTarget);
  if (targetCardHubble) targetCardHubble.addEventListener('click', (e) => {
    if (e.target !== btnSelectHubble) selectHubbleTarget();
  });
  if (missionCard1) missionCard1.addEventListener('click', selectHubbleTarget);

  // Target 2: James Webb Space Telescope (Phase 6 Scheduled)
  function showJwstLockedAlert() {
    playClick();
    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert(
        'JWST MISSION STATUS: SCHEDULED FOR PHASE 6',
        'James Webb Space Telescope (Infrared & Exoplanet Atmospheres at Sun-Earth L2) is scheduled for NASA Phase 6 deployment. Please proceed with the primary Hubble Space Telescope campaign!',
        '🛰️'
      );
    } else if (window.showToast) {
      window.showToast('JWST: Scheduled for NASA Phase 6. Proceed with Hubble!', '🛰️');
    }
  }
  if (btnSelectJwst) btnSelectJwst.addEventListener('click', showJwstLockedAlert);
  if (targetCardJwst) targetCardJwst.addEventListener('click', showJwstLockedAlert);
  if (missionCard2) missionCard2.addEventListener('click', showJwstLockedAlert);

  // Target 3: Chandra X-Ray Observatory (Phase 6 Scheduled)
  function showChandraLockedAlert() {
    playClick();
    if (window.showCenterCalmAlert) {
      window.showCenterCalmAlert(
        'CHANDRA OBSERVATORY STATUS: SCHEDULED FOR PHASE 6',
        'Chandra X-Ray Observatory (High-energy black holes & supernovae in HEO orbit) is scheduled for NASA Phase 6 deployment. Please proceed with the primary Hubble Space Telescope campaign!',
        '🌌'
      );
    } else if (window.showToast) {
      window.showToast('Chandra: Scheduled for NASA Phase 6. Proceed with Hubble!', '🌌');
    }
  }
  if (btnSelectChandra) btnSelectChandra.addEventListener('click', showChandraLockedAlert);
  if (targetCardChandra) targetCardChandra.addEventListener('click', showChandraLockedAlert);

  if (btnMissionsBack) btnMissionsBack.addEventListener('click', () => showScreen('menu'));

  // --- Objective Navigation ---
  const btnObjectivePrev = document.getElementById('btnObjectivePrev');
  const btnObjectiveStart = document.getElementById('btnObjectiveStart');

  if (btnObjectivePrev) btnObjectivePrev.addEventListener('click', () => showScreen('missions'));
  if (btnObjectiveStart) {
    btnObjectiveStart.addEventListener('click', () => {
      enableAudioOnUserGesture();
      triggerFacilitySpawnTransition();
    });
  }

  function triggerFacilitySpawnTransition() {
    playClick();
    const overlay = document.getElementById('facilityTransitionOverlay');
    if (overlay) {
      overlay.classList.add('active');
      setTimeout(() => {
        showScreen('facility');
        if (facilityRoomInstance && facilityRoomInstance.player) {
          facilityRoomInstance.player.pos.x = 0;
          facilityRoomInstance.player.pos.z = 2.4;
          facilityRoomInstance.player.yaw = 0;
          facilityRoomInstance.player.pitch = 0;
        }
        setTimeout(() => overlay.classList.remove('active'), 150);
      }, 420);
    } else {
      showScreen('facility');
    }
  }

  // Facility Exit Button
  const btnExitFacility = document.getElementById('btnExitFacility');
  if (btnExitFacility) {
    btnExitFacility.addEventListener('click', () => {
      if (gameState.subtask01Complete && gameState.subtask02Complete && gameState.isCheckedIn) {
        showCenterCalmAlert("MANDATORY PROTOCOL", "All repairs verified! Please check out at the Computer Terminal to sign and archive mission logs.", "📋");
        return;
      }
      autoSaveGame();
      showScreen('menu');
      updateContinueButtonState();
    });
  }

  // =========================================================================
  // PHASE 1: GAME STATE & DUAL DEPARTMENT (ELECTRONIC & MECHANICAL) ARCHITECTURE
  // =========================================================================
  // Station Concurrency Locks for Multiplayer (Requirement 2)
  const stationLocks = {
    mechanical_desk_01: null,
    electronic_desk_02: null,
    network_desk_03: null
  };
  window.stationLocks = stationLocks;

  const gameState = {
    hasEnteredFacility: false,

    // Phase 02: Tiered Tool Durability & Room Lock State
    toolTimers: {}, // { [toolId]: { expiresAt, durationSec, tier, name, dept } }
    toolDysfunctional: {}, // { [toolId]: boolean }
    roomEquippedTools: {}, // { [toolId]: { equippedBy, tier, dept, expiresAt } }

    activeDept: 'electronic', // Default to Electronic Department as per user request

    // Engineering Directives & Decisions Ledger
    decisions: {
      mech_task1: null,
      mech_task2: null,
      elec_task1: null,
      elec_task2: null,
      net_task1: null,
      net_task2: null
    },
    decisionLogs: [],

    // Mechanical Department State (Desk 01)
    isCheckedIn: false,
    operatorName: 'Engineer Apprentice',
    checkInTimestamp: null,
    durationInterval: null,
    budget: 150000,
    purchased: {},      // Items bought with budget { [itemId]: true }
    playerFrame: [],    // The Player's Frame: up to 5 equipped instruments
    selectedSlot: 0,    // Currently selected instrument slot index
    papersChecked: false,
    inventory: {
      pgt: false,
      pins: false,
      gyro: false,
      hex: false,
      damper: false,
      sadm: false
    },
    damperInstalled: false,
    subtask01Complete: false,
    subtask02Complete: false,
    commsDone: false,

    // Electronic Department State (Desk 02)
    elecCheckedIn: false,
    elecOperatorName: 'Electrical Apprentice',
    elecCheckInTimestamp: null,
    elecDurationInterval: null,
    elecPurchased: {},
    elecPlayerFrame: [],
    elecSelectedSlot: 0,
    elecPapersChecked: false,
    elecInventory: {
      wriststrap: false,
      tweezers: false,
      icextractor: false,
      probes: false,
      screwdriver: false,
      ribbon: false,
      pcb: false,
      fgs: false
    },
    subtaskE01Complete: false,
    subtaskE02Complete: false,
    breakerMasterOn: false,
    telemetryDiagRun: false,
    staticShockIncidents: 0,
    voltagePrecision: 100,

    // Network & Communication Department State (Desk 03 - South Wall)
    netCheckedIn: false,
    netOperatorName: 'Network Apprentice',
    netCheckInTimestamp: null,
    netDurationInterval: null,
    netPurchased: {},
    netPlayerFrame: [],
    netSelectedSlot: 0,
    netPapersChecked: false,
    netInventory: {
      rf_wrench: false,
      laser_sight: false,
      fiber_stripper: false,
      coupler: false,
      splice_module: false
    },
    subtaskN01Complete: false,
    subtaskN02Complete: false,
    tdrssLinkEstablished: false,
    commTelemetryRun: false,
    fiberAttenuation: 0.018,
    downlinkDataRate: 4.096,

    // Phase 03 M2: Registration Desk & Keycard Auth State
    hasKeycard: false,
    assemblyPasscodes: {
      mech: null,
      elec: null,
      net: null
    },
    keycardRegistered: false,
    keycardRegistrationData: null
  };
  window.gameState = gameState;
  window.getNasaGameState = () => gameState;
    window.isToolOperational = (toolId) => {
    if (!window.hasPurchasedTool(toolId)) return false;
    const norm = toolId === 'clip' ? 'damper' : toolId;
    if (gameState.toolDysfunctional && (gameState.toolDysfunctional[toolId] || gameState.toolDysfunctional[norm])) {
      return false;
    }
    return true;
  };

  window.hasPurchasedTool = (toolId) => {
    const id = toolId === 'clip' ? 'damper' : toolId;
    return !!(
      gameState.purchased?.[id] ||
      gameState.purchased?.[toolId] ||
      gameState.elecPurchased?.[id] ||
      gameState.elecPurchased?.[toolId] ||
      gameState.inventory?.[id] ||
      gameState.inventory?.[toolId] ||
      gameState.elecInventory?.[id] ||
      gameState.elecInventory?.[toolId] ||
      (gameState.playerFrame && (gameState.playerFrame.includes(id) || gameState.playerFrame.includes(toolId))) ||
      (gameState.elecPlayerFrame && (gameState.elecPlayerFrame.includes(id) || gameState.elecPlayerFrame.includes(toolId))) ||
      gameState.netPurchased?.[id] ||
      gameState.netPurchased?.[toolId] ||
      gameState.netInventory?.[id] ||
      gameState.netInventory?.[toolId] ||
      (gameState.netPlayerFrame && (gameState.netPlayerFrame.includes(id) || gameState.netPlayerFrame.includes(toolId)))
    );
  };

  let lastSavedFacilityPlayer = null;
  let lastSavedWb3dState = null;
  let lastSavedSadmState = null;
  let lastSavedElectronicsWbState = null;
  let lastSavedNetworkWbState = null;

  function resetGameState() {
    gameState.hasEnteredFacility = false;
    gameState.activeDept = 'electronic';

    // Reset Mechanical
    gameState.isCheckedIn = false;
    gameState.operatorName = 'Engineer Apprentice';
    gameState.checkInTimestamp = null;
    if (gameState.durationInterval) {
      clearInterval(gameState.durationInterval);
      gameState.durationInterval = null;
    }
    gameState.budget = 150000;
    gameState.purchased = {};
    gameState.playerFrame = [];
    gameState.selectedSlot = 0;
    gameState.papersChecked = false;
    gameState.inventory = {
      pgt: false,
      pins: false,
      gyro: false,
      hex: false,
      damper: false,
      sadm: false
    };
    gameState.damperInstalled = false;
    gameState.subtask01Complete = false;
    gameState.subtask02Complete = false;
    gameState.commsDone = false;

    // Reset Electronic
    gameState.elecCheckedIn = false;
    gameState.elecOperatorName = 'Electrical Apprentice';
    gameState.elecCheckInTimestamp = null;
    if (gameState.elecDurationInterval) {
      clearInterval(gameState.elecDurationInterval);
      gameState.elecDurationInterval = null;
    }
    gameState.elecPurchased = {};
    gameState.elecPlayerFrame = [];
    gameState.elecSelectedSlot = 0;
    gameState.elecPapersChecked = false;
    gameState.elecInventory = {
      wriststrap: false,
      tweezers: false,
      icextractor: false,
      probes: false,
      screwdriver: false,
      ribbon: false,
      pcb: false,
      fgs: false
    };
    gameState.subtaskE01Complete = false;
    gameState.subtaskE02Complete = false;
    gameState.breakerMasterOn = false;
    gameState.telemetryDiagRun = false;
    gameState.staticShockIncidents = 0;
    gameState.voltagePrecision = 100;

    // Reset Network Department
    gameState.netCheckedIn = false;
    gameState.netOperatorName = 'Network Apprentice';
    gameState.netCheckInTimestamp = null;
    if (gameState.netDurationInterval) {
      clearInterval(gameState.netDurationInterval);
      gameState.netDurationInterval = null;
    }
    gameState.netPurchased = {};
    gameState.netPlayerFrame = [];
    gameState.netSelectedSlot = 0;
    gameState.netPapersChecked = false;
    gameState.netInventory = {
      rf_wrench: false,
      laser_sight: false,
      fiber_stripper: false,
      coupler: false,
      splice_module: false
    };
    gameState.subtaskN01Complete = false;
    gameState.subtaskN02Complete = false;
    gameState.tdrssLinkEstablished = false;
    gameState.commTelemetryRun = false;
    gameState.fiberAttenuation = 0.018;
    gameState.downlinkDataRate = 4.096;

    // Reset Keycard Authorization
    gameState.hasKeycard = false;
    gameState.keycardRegistered = false;
    gameState.keycardRegistrationData = null;

    lastSavedFacilityPlayer = null;
    lastSavedWb3dState = null;
    lastSavedSadmState = null;
    if (workbench3DInstance) {
      try { workbench3DInstance.destroy(); } catch (e) {}
      workbench3DInstance = null;
    }
    if (sadm3DInstance) {
      try { sadm3DInstance.destroy(); } catch (e) {}
      sadm3DInstance = null;
    }
    if (electronicsWorkbenchInstance) {
      try { electronicsWorkbenchInstance.destroy(); } catch (e) {}
      electronicsWorkbenchInstance = null;
    }
    if (networkWorkbenchInstance) {
      try { networkWorkbenchInstance.destroy(); } catch (e) {}
      networkWorkbenchInstance = null;
    }
    if (window.lobbyRoomInstance) {
      try { window.lobbyRoomInstance.destroy(); } catch (e) {}
      window.lobbyRoomInstance = null;
    }
    if (networkWorkbenchInstance) {
      try { networkWorkbenchInstance.destroy(); } catch (e) {}
      networkWorkbenchInstance = null;
    }
  }

  function autoSaveGame() {
    try {
      if (!gameState.hasEnteredFacility && !gameState.isCheckedIn && gameState.budget === 150000 && gameState.playerFrame.length === 0) {
        return;
      }

      let currentFacilityPlayer = null;
      if (facilityRoomInstance && facilityRoomInstance.player) {
        currentFacilityPlayer = {
          x: facilityRoomInstance.player.pos.x,
          y: facilityRoomInstance.player.pos.y,
          z: facilityRoomInstance.player.pos.z,
          yaw: facilityRoomInstance.player.yaw,
          pitch: facilityRoomInstance.player.pitch
        };
        lastSavedFacilityPlayer = currentFacilityPlayer;
      } else {
        currentFacilityPlayer = lastSavedFacilityPlayer;
      }

      if (workbench3DInstance && workbench3DInstance.getState) {
        lastSavedWb3dState = workbench3DInstance.getState();
      }
      if (sadm3DInstance && sadm3DInstance.getState) {
        lastSavedSadmState = sadm3DInstance.getState();
      }
      if (electronicsWorkbenchInstance && electronicsWorkbenchInstance.getState) {
        lastSavedElectronicsWbState = electronicsWorkbenchInstance.getState();
      }
      if (networkWorkbenchInstance && networkWorkbenchInstance.getState) {
        lastSavedNetworkWbState = networkWorkbenchInstance.getState();
      }

      const savePayload = {
        version: 1,
        savedAt: Date.now(),
        gameState: {
          hasEnteredFacility: !!gameState.hasEnteredFacility,
          activeDept: gameState.activeDept || 'electronic',
          // Mechanical Department
          isCheckedIn: !!gameState.isCheckedIn,
          operatorName: gameState.operatorName || 'Engineer Apprentice',
          checkInTimestamp: gameState.checkInTimestamp ? gameState.checkInTimestamp.toISOString() : null,
          budget: gameState.budget,
          purchased: gameState.purchased || {},
          playerFrame: gameState.playerFrame || [],
          selectedSlot: gameState.selectedSlot || 0,
          papersChecked: !!gameState.papersChecked,
          inventory: gameState.inventory || {},
          damperInstalled: !!gameState.damperInstalled,
          subtask01Complete: !!gameState.subtask01Complete,
          subtask02Complete: !!gameState.subtask02Complete,
          commsDone: !!gameState.commsDone,
          // Electronic Department
          elecCheckedIn: !!gameState.elecCheckedIn,
          elecOperatorName: gameState.elecOperatorName || 'Electrical Apprentice',
          elecCheckInTimestamp: gameState.elecCheckInTimestamp ? gameState.elecCheckInTimestamp.toISOString() : null,
          elecPurchased: gameState.elecPurchased || {},
          elecPlayerFrame: gameState.elecPlayerFrame || [],
          elecSelectedSlot: gameState.elecSelectedSlot || 0,
          elecPapersChecked: !!gameState.elecPapersChecked,
          elecInventory: gameState.elecInventory || {},
          subtaskE01Complete: !!gameState.subtaskE01Complete,
          subtaskE02Complete: !!gameState.subtaskE02Complete,
          breakerMasterOn: !!gameState.breakerMasterOn,
          telemetryDiagRun: !!gameState.telemetryDiagRun,
          staticShockIncidents: gameState.staticShockIncidents || 0,
          voltagePrecision: gameState.voltagePrecision || 100,
          // Network Department
          netCheckedIn: !!gameState.netCheckedIn,
          netOperatorName: gameState.netOperatorName || 'Network Apprentice',
          netCheckInTimestamp: gameState.netCheckInTimestamp ? gameState.netCheckInTimestamp.toISOString() : null,
          netPurchased: gameState.netPurchased || {},
          netPlayerFrame: gameState.netPlayerFrame || [],
          netSelectedSlot: gameState.netSelectedSlot || 0,
          netPapersChecked: !!gameState.netPapersChecked,
          netInventory: gameState.netInventory || {},
          subtaskN01Complete: !!gameState.subtaskN01Complete,
          subtaskN02Complete: !!gameState.subtaskN02Complete,
          tdrssLinkEstablished: !!gameState.tdrssLinkEstablished,
          commTelemetryRun: !!gameState.commTelemetryRun,
          fiberAttenuation: gameState.fiberAttenuation || 0.018,
          downlinkDataRate: gameState.downlinkDataRate || 4.096,
          assemblyPasscodes: gameState.assemblyPasscodes || { mech: null, elec: null, net: null }
        },
        facilityPlayer: currentFacilityPlayer,
        workbench3d: lastSavedWb3dState,
        sadm3d: lastSavedSadmState,
        electronicsWb3d: lastSavedElectronicsWbState,
        networkWb3d: lastSavedNetworkWbState
      };

      localStorage.setItem(SAVE_KEY, JSON.stringify(savePayload));
      updateContinueButtonState();
    } catch (e) {
      console.warn('Auto-save error:', e);
    }
  }

  function updateContinueButtonState() {
    if (!btnContinue) return;
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        btnContinue.disabled = true;
        if (continueBadge) continueBadge.classList.add('hidden');
        return;
      }

      const data = JSON.parse(raw);
      if (!data || !data.savedAt || !data.gameState) {
        btnContinue.disabled = true;
        if (continueBadge) continueBadge.classList.add('hidden');
        return;
      }

      btnContinue.disabled = false;
      if (continueBadge) {
        continueBadge.classList.remove('hidden');
        const diffMs = Math.max(0, Date.now() - data.savedAt);
        const mins = Math.floor(diffMs / 60000);
        if (mins < 1) {
          continueBadge.textContent = 'AUTO-SAVED: JUST NOW';
        } else if (mins < 60) {
          continueBadge.textContent = `AUTO-SAVED: ${mins}M AGO`;
        } else {
          const hours = Math.floor(mins / 60);
          continueBadge.textContent = `AUTO-SAVED: ${hours}H AGO`;
        }
      }
    } catch (e) {
      btnContinue.disabled = true;
      if (continueBadge) continueBadge.classList.add('hidden');
    }
  }

  function loadAutoSave() {
    playClick();
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (!raw) {
        showToast('No auto-save found. Starting fresh mission.', '⚠️');
        return;
      }
      const data = JSON.parse(raw);
      if (!data || !data.gameState) {
        showToast('Auto-save data corrupted.', '⚠️');
        return;
      }

      // 1. Restore gameState
      Object.assign(gameState, data.gameState);
      if (!gameState.assemblyPasscodes) {
        gameState.assemblyPasscodes = { mech: null, elec: null, net: null };
      }
      if (typeof checkAndAutoIssuePasscodes === 'function') {
        checkAndAutoIssuePasscodes(true);
      }

      if (gameState.checkInTimestamp) {
        gameState.checkInTimestamp = new Date(gameState.checkInTimestamp);
        if (gameState.isCheckedIn) {
          if (gameState.durationInterval) clearInterval(gameState.durationInterval);
          gameState.durationInterval = setInterval(() => {
            if (!gameState.isCheckedIn || !gameState.checkInTimestamp) return;
            const diffMs = Date.now() - gameState.checkInTimestamp.getTime();
            const totalSec = Math.floor(diffMs / 1000);
            const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
            const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
            const ss = String(totalSec % 60).padStart(2, '0');
            if (sessionLogDuration) {
              sessionLogDuration.innerHTML = `<span>Active Working Duration:</span> <span>${hh}:${mm}:${ss}</span>`;
            }
          }, 1000);
        }
      }

      if (gameState.elecCheckInTimestamp) {
        gameState.elecCheckInTimestamp = new Date(gameState.elecCheckInTimestamp);
        if (gameState.elecCheckedIn) {
          if (gameState.elecDurationInterval) clearInterval(gameState.elecDurationInterval);
          gameState.elecDurationInterval = setInterval(() => {
            if (!gameState.elecCheckedIn || !gameState.elecCheckInTimestamp) return;
            const diffMs = Date.now() - gameState.elecCheckInTimestamp.getTime();
            const totalSec = Math.floor(diffMs / 1000);
            const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
            const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
            const ss = String(totalSec % 60).padStart(2, '0');
            const durElec = document.getElementById('sessionLogDurationElec');
            if (durElec) {
              durElec.innerHTML = `<span>Active Working Duration:</span> <span>${hh}:${mm}:${ss}</span>`;
            }
          }, 1000);
        }
      }

      if (gameState.netCheckInTimestamp) {
        gameState.netCheckInTimestamp = new Date(gameState.netCheckInTimestamp);
        if (gameState.netCheckedIn) {
          if (gameState.netDurationInterval) clearInterval(gameState.netDurationInterval);
          gameState.netDurationInterval = setInterval(() => {
            if (!gameState.netCheckedIn || !gameState.netCheckInTimestamp) return;
            const diffMs = Date.now() - gameState.netCheckInTimestamp.getTime();
            const totalSec = Math.floor(diffMs / 1000);
            const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
            const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
            const ss = String(totalSec % 60).padStart(2, '0');
            const durNet = document.getElementById('sessionLogDurationNet');
            if (durNet) {
              durNet.innerHTML = `<span>Active Working Duration:</span> <span>${hh}:${mm}:${ss}</span>`;
            }
          }, 1000);
        }
      }

      // 2. Cache 3D states
      lastSavedFacilityPlayer = data.facilityPlayer || null;
      lastSavedWb3dState = data.workbench3d || null;
      lastSavedSadmState = data.sadm3d || null;
      lastSavedElectronicsWbState = data.electronicsWb3d || null;
      lastSavedNetworkWbState = data.networkWb3d || null;

      // 3. Switch directly to Facility room
      showScreen('facility');

      // 4. Restore 3D player position in facilityRoomInstance
      if (lastSavedFacilityPlayer && facilityRoomInstance && facilityRoomInstance.player) {
        facilityRoomInstance.player.pos.x = lastSavedFacilityPlayer.x;
        facilityRoomInstance.player.pos.y = lastSavedFacilityPlayer.y || 1.7;
        facilityRoomInstance.player.pos.z = Math.min(3.2, lastSavedFacilityPlayer.z);
        if (typeof lastSavedFacilityPlayer.yaw === 'number') {
          facilityRoomInstance.player.yaw = lastSavedFacilityPlayer.yaw;
          facilityRoomInstance.player.pitch = lastSavedFacilityPlayer.pitch || 0;
        }
        if (facilityRoomInstance.camera) {
          facilityRoomInstance.camera.position.set(
            facilityRoomInstance.player.pos.x,
            facilityRoomInstance.player.pos.y,
            facilityRoomInstance.player.pos.z
          );
          facilityRoomInstance.camera.rotation.y = facilityRoomInstance.player.yaw;
          facilityRoomInstance.camera.rotation.x = facilityRoomInstance.player.pitch;
        }
      }

      // 5. Dismiss comms if already completed
      if (gameState.commsDone) {
        closeComms();
      }

      // 6. Update all UI components
      setDepartment(gameState.activeDept || 'electronic');
      updatePlayerFrameUI();
      updateMissionChecklistUI();
      updateSessionSheetUI();
      updateSessionSheetElecUI();
      updateSessionSheetNetUI();
      renderMarketplace();
      renderMarketplaceElec();
      renderMarketplaceNet();
      updateWorkbenchUI();
      updateElecWorkbenchUI();
      updateNetWorkbenchUI();

      // 7. Update HUD Tasks
      if (gameState.isCheckedIn) {
        if (hudMainTaskCard) hudMainTaskCard.classList.add('completed');
        if (mainTaskStatusBadge) {
          mainTaskStatusBadge.textContent = 'CONTROL TAKEN';
          mainTaskStatusBadge.classList.remove('pending');
          mainTaskStatusBadge.classList.add('completed');
        }
        if (mainTaskHint) {
          mainTaskHint.textContent = 'Control authorized! Proceed to Laptop (Marketplace) & Workbench.';
        }
        if (subtaskCard01) {
          subtaskCard01.classList.remove('locked');
          if (gameState.subtask01Complete) {
            subtaskCard01.classList.remove('active');
            subtaskCard01.classList.add('done');
          } else {
            subtaskCard01.classList.add('active');
          }
        }
        if (subtaskPill01) subtaskPill01.textContent = gameState.subtask01Complete ? 'COMPLETED' : 'ACTIVE';

        if (subtaskCard02) {
          subtaskCard02.classList.remove('locked');
          if (gameState.subtask02Complete) {
            subtaskCard02.classList.remove('active');
            subtaskCard02.classList.add('done');
          } else {
            subtaskCard02.classList.add('active');
          }
        }
        if (subtaskPill02) subtaskPill02.textContent = gameState.subtask02Complete ? 'COMPLETED' : 'ACTIVE';
      }

      playSuccessChime();
      showToast(`Mission restored. Welcome back, ${gameState.operatorName}!`, '🚀');
    } catch (e) {
      console.error('Failed to load auto-save:', e);
      showToast('Error restoring saved game.', '⚠️');
    }
  }

  // =========================================================================
  // AUTHENTIC NASA GSFC FLIGHT CONTROLLER RADIO VOICE & SPEECH SYNTHESIS ENGINE
  // =========================================================================
  let activeFlightUtterance = null;
  let cachedSpeechVoices = [];
  let speechKeepAliveInterval = null;

  function populateSpeechVoices() {
    if (!('speechSynthesis' in window)) return [];
    try {
      cachedSpeechVoices = window.speechSynthesis.getVoices() || [];
    } catch (e) {
      cachedSpeechVoices = [];
    }
    return cachedSpeechVoices;
  }

  if ('speechSynthesis' in window) {
    populateSpeechVoices();
    window.speechSynthesis.onvoiceschanged = () => {
      populateSpeechVoices();
    };
  }

  function getBestFlightControllerVoice() {
    if (!cachedSpeechVoices || cachedSpeechVoices.length === 0) {
      populateSpeechVoices();
    }
    const enVoices = cachedSpeechVoices.filter(v => v.lang && v.lang.toLowerCase().startsWith('en'));
    if (!enVoices.length) return null;

    // Prefer clear authoritative / natural radio dispatcher voices
    const preferred = enVoices.find(v => 
      v.name.includes('David') || 
      v.name.includes('Guy') || 
      v.name.includes('Natural') || 
      v.name.includes('Google US English') || 
      v.name.includes('Mark') || 
      v.name.includes('Christopher') ||
      v.name.includes('Male')
    );
    if (preferred) return preferred;

    const enUS = enVoices.find(v => v.lang === 'en-US' || v.lang === 'en_US');
    return enUS || enVoices[0];
  }

  function cancelFlightControllerSpeech() {
    if (speechKeepAliveInterval) {
      clearInterval(speechKeepAliveInterval);
      speechKeepAliveInterval = null;
    }
    activeFlightUtterance = null;
    window._activeFlightUtterance = null;
    if ('speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
  }
  window.cancelFlightControllerSpeech = cancelFlightControllerSpeech;

  function speakFlightController(text, { title = 'GROUND CONTROL DISPATCH', icon = '📡', onEnd = null, rate = 1.02, pitch = 0.95, showNotification = true } = {}) {
    if (!text || typeof text !== 'string') return;
    
    // Ensure Audio Context is active on user gesture
    getAudioContext();

    // 1. Play NASA Quindar intro tone (2525 Hz) & chirp
    playQuindarTone('intro');
    playCommsChirp();

    // 2. Synchronized visual notification so subtitles always accompany voice
    if (showNotification && window.showCenterCalmAlert) {
      window.showCenterCalmAlert(title, text, icon);
    }

    // If audio is muted by user or Web Speech API is absent, finish gracefully
    if (isAudioMuted || !('speechSynthesis' in window)) {
      if (typeof onEnd === 'function') {
        setTimeout(onEnd, 1400);
      }
      return;
    }

    try {
      // Chrome deadlock fix: cancel existing speech, and resume if paused
      cancelFlightControllerSpeech();
      if (window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
      }

      // Allow 50ms for browser IPC cancel event to clear before queuing new utterance
      setTimeout(() => {
        try {
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = rate;
          utterance.pitch = pitch;
          utterance.volume = 1.0;

          const voice = getBestFlightControllerVoice();
          if (voice) {
            utterance.voice = voice;
          }

          // Chrome Garbage Collection Bug Fix: Store reference on window
          activeFlightUtterance = utterance;
          window._activeFlightUtterance = utterance;

          // Chrome keep-alive hack: Chrome halts speech >14s unless resume() is periodically called
          if (speechKeepAliveInterval) clearInterval(speechKeepAliveInterval);
          speechKeepAliveInterval = setInterval(() => {
            if (window.speechSynthesis && window.speechSynthesis.speaking) {
              window.speechSynthesis.pause();
              window.speechSynthesis.resume();
            } else {
              clearInterval(speechKeepAliveInterval);
              speechKeepAliveInterval = null;
            }
          }, 10000);

          utterance.onend = () => {
            if (speechKeepAliveInterval) {
              clearInterval(speechKeepAliveInterval);
              speechKeepAliveInterval = null;
            }
            activeFlightUtterance = null;
            window._activeFlightUtterance = null;
            playQuindarTone('outro');
            if (typeof onEnd === 'function') onEnd();
          };

          utterance.onerror = (err) => {
            if (speechKeepAliveInterval) {
              clearInterval(speechKeepAliveInterval);
              speechKeepAliveInterval = null;
            }
            activeFlightUtterance = null;
            window._activeFlightUtterance = null;
            if (typeof onEnd === 'function') onEnd();
          };

          window.speechSynthesis.speak(utterance);
        } catch (e) {
          console.warn('[VOICE] SpeechSynthesis error:', e);
          if (typeof onEnd === 'function') onEnd();
        }
      }, 50);

    } catch (e) {
      console.warn('[VOICE] Synthesis setup error:', e);
      if (typeof onEnd === 'function') onEnd();
    }
  }
  window.speakFlightController = speakFlightController;

  // --- Department Ground Control Radio Dispatches ---
  let hasPlayedNetDispatch = false;
  let hasPlayedElecDispatch = false;
  let hasPlayedMechDispatch = false;

  function triggerNetworkDepartmentDispatchAudio(force = false) {
    if (hasPlayedNetDispatch && !force) return;
    hasPlayedNetDispatch = true;

    const msg = "Apprentice, ground control has lost the high-gain data link with Hubble. The main transmitter antenna is misaligned, and the fiber data bus is showing critical attenuation. Get the telemetry stream back online.";
    
    const hudMainTask = document.getElementById('hudMainTaskText');
    if (hudMainTask) {
      hudMainTask.textContent = '[MAIN TASK]: Take control of the Network & Communication Department.';
    }

    speakFlightController(msg, {
      title: 'GSFC GROUND CONTROL // DESK 03 DISPATCH',
      icon: '📡',
      rate: 1.04,
      pitch: 0.95
    });
  }
  window.triggerNetworkDepartmentDispatchAudio = triggerNetworkDepartmentDispatchAudio;

  function triggerElectronicDepartmentDispatchAudio(force = false) {
    if (hasPlayedElecDispatch && !force) return;
    hasPlayedElecDispatch = true;

    const msg = "Apprentice, Hubble's DF-224 flight computer memory bank has experienced a dual-channel bit-flip and the Fine Guidance Sensor electronics require recalibration. Restore core computing and verify flight bus voltage.";

    const hudMainTask = document.getElementById('hudMainTaskText');
    if (hudMainTask) {
      hudMainTask.textContent = '[MAIN TASK]: Take control of the Electronic Department.';
    }

    speakFlightController(msg, {
      title: 'GSFC GROUND CONTROL // DESK 02 DISPATCH',
      icon: '⚡',
      rate: 1.04,
      pitch: 0.96
    });
  }
  window.triggerElectronicDepartmentDispatchAudio = triggerElectronicDepartmentDispatchAudio;

  function triggerMechanicalDepartmentDispatchAudio(force = false) {
    if (hasPlayedMechDispatch && !force) return;
    hasPlayedMechDispatch = true;

    const msg = "Apprentice, Hubble's secondary solar array drive mechanism and rate sensor gyros are showing telemetry drift. Perform critical bench inspections, replace worn gyros, and calibrate the drive mechanism.";

    const hudMainTask = document.getElementById('hudMainTaskText');
    if (hudMainTask) {
      hudMainTask.textContent = '[MAIN TASK]: Take control of the Mechanical Department.';
    }

    speakFlightController(msg, {
      title: 'GSFC GROUND CONTROL // DESK 01 DISPATCH',
      icon: '⚙️',
      rate: 1.04,
      pitch: 0.95
    });
  }
  window.triggerMechanicalDepartmentDispatchAudio = triggerMechanicalDepartmentDispatchAudio;

  // --- Facility Controller Transmission Sequencer ---
  const commsDialogues = [
    "You are assigned to repair and assemble the minor parts of the Hubble Space Telescope",
    "The complete telescope has been largely assembled by senior engineers, but for practical experience as a fresher, you are required to handle this task.",
    "All the resources are provided in the research papers, and the assembly method has been outlined. Please read them carefully and complete the mission within the given time limit."
  ];

  let commsStep = 0;
  let commsActive = false;

  const commsOverlay = document.getElementById('facilityCommsOverlay');
  const commsDialogueText = document.getElementById('commsDialogueText');
  const commsProgressText = document.getElementById('commsProgressText');
  const btnCommsNext = document.getElementById('btnCommsNext');
  const btnCommsSkip = document.getElementById('btnCommsSkip');

  function initFacilityCommsSequence() {
    gameState.commsDone = true;
    commsActive = false;
    if (commsOverlay) commsOverlay.classList.add('hidden');
    return;
  }

  function displayCommsStep(index) {
    if (index >= commsDialogues.length) {
      closeComms();
      return;
    }

    const text = commsDialogues[index];
    if (commsDialogueText) commsDialogueText.textContent = `"${text}"`;
    if (commsProgressText) commsProgressText.textContent = `TRANSMISSION ${index + 1} / ${commsDialogues.length}`;

    // Web Speech API Voiceover (Voice of Chief Flight Controller)
    speakFlightController(text, {
      title: `GSFC FLIGHT DIRECTOR // TRANSMISSION ${index + 1}`,
      icon: '🎙️',
      showNotification: false,
      rate: 1.02,
      pitch: 0.95
    });
  }

  function nextCommsStep() {
    playQuindarTone('outro');
    playClick();
    commsStep++;
    if (commsStep < commsDialogues.length) {
      setTimeout(() => displayCommsStep(commsStep), 280);
    } else {
      closeComms();
    }
  }

  function closeComms() {
    playQuindarTone('outro');
    cancelFlightControllerSpeech();
    commsActive = false;
    gameState.commsDone = true;
    if (commsOverlay) commsOverlay.classList.add('hidden');
    autoSaveGame();
  }

  if (btnCommsNext) btnCommsNext.addEventListener('click', nextCommsStep);
  if (btnCommsSkip) btnCommsSkip.addEventListener('click', closeComms);

  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space' && commsActive && screens.facility?.classList.contains('active')) {
      const anyModalOpen = document.querySelector('.facility-modal-backdrop:not(.hidden)');
      if (!anyModalOpen) {
        e.preventDefault();
        nextCommsStep();
      }
    }
  });

  // --- Toast Notification Helper ---
  const toastNIO = document.getElementById('toastNIO');
  const toastMsg = document.getElementById('toastMsg');
  let toastTimer = null;

  function showToast(msg, icon = '☕') {
    if (!toastNIO) return;
    if (toastMsg) toastMsg.textContent = msg;
    const iconEl = toastNIO.querySelector('.toast-icon');
    if (iconEl) iconEl.textContent = icon;
    toastNIO.classList.remove('hidden');

    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      toastNIO.classList.add('hidden');
    }, 3500);
  }

  // --- Dynamic Facility Modals Manager ---
  const modals = {
    // Mechanical Department (Desk 01)
    computer: document.getElementById('modalComputerSession'),
    laptop: document.getElementById('modalLaptopMarket'),
    papers: document.getElementById('modalResearchPapers'),
    workbench: document.getElementById('modalWorkbench'),
    debrief: document.getElementById('modalMissionAccomplished'),

    // Electronic Department (Desk 02)
    computer_elec: document.getElementById('modalComputerSessionElec'),
    laptop_elec: document.getElementById('modalLaptopMarketElec'),
    papers_elec: document.getElementById('modalResearchPapersElec'),
    workbench_elec: document.getElementById('modalElectronicsWorkbench'),
    debrief_elec: document.getElementById('modalMissionAccomplishedElec'),
    science_camera: document.getElementById('modalScienceCamera'),

    // Network Department (Desk 03 - South Wall)
    computer_net: document.getElementById('modalComputerSessionNet'),
    laptop_net: document.getElementById('modalLaptopMarketNet'),
    papers_net: document.getElementById('modalResearchPapersNet'),
    workbench_net: document.getElementById('modalNetworkWorkbench'),
    debrief_net: document.getElementById('modalMissionAccomplishedNet'),

    // Hubble Subsystem Assembly & Integration Bay (Figma Node 427:2)
    assembly: document.getElementById('modalHubbleAssembly'),

    // Phase 3 Lobby Reception Registration
    lobby_registration: document.getElementById('modalLobbyRegistration')
  };

  let workbench3DInstance = null;
  let sadm3DInstance = null;
  let electronicsWorkbenchInstance = null;
  let networkWorkbenchInstance = null;
  let assembly3DInstance = null;

  function openAssemblyModal(stageDept) {
    playClick();
    closeAllModals();
    if (facilityRoomInstance && typeof facilityRoomInstance.pause === 'function') {
      facilityRoomInstance.pause();
    }
    if (!window.Assembly3D) {
      console.warn('Assembly3D class not available');
      return;
    }
    if (!assembly3DInstance) {
      assembly3DInstance = new window.Assembly3D();
      window.assembly3DInstance = assembly3DInstance;
    }
    const targetModal = modals.assembly;
    if (targetModal) {
      targetModal.classList.remove('hidden');
      targetModal.setAttribute('aria-hidden', 'false');
    }
    const dept = stageDept || (gameState.activeDept === 'electronic' ? 'elec' : (gameState.activeDept === 'network' ? 'net' : 'mech'));
    assembly3DInstance.open();
    if (assembly3DInstance.switchDepartment) {
      assembly3DInstance.switchDepartment(dept);
    }
    showToast('Hubble Space Facility: Subsystem Assembly & Integration Bay Active!', '🛰️');
  }
  window.openAssemblyModal = openAssemblyModal;

  // =========================================================================
  // PHASE 02 REFACTORED: ASSEMBLY ACCESS PASSCODE & SELECTION SYSTEM
  // (Figma Nodes: 456:112, 456:32, 456:81) - Zero Multiplayer Lockout
  // =========================================================================

  function generateAssemblyPasscode(dept) {
    const prefix = dept.toUpperCase();
    const rand = Math.floor(1000 + Math.random() * 9000);
    return `${prefix}-${rand}`;
  }
  window.generateAssemblyPasscode = generateAssemblyPasscode;

  function updateStickyPasscodeUI() {
    const codes = gameState.assemblyPasscodes || {};
    const stickyHud = document.getElementById('stickyPasscodeHud');
    const hasAny = Object.values(codes).some(Boolean);
    if (stickyHud) {
      if (hasAny) stickyHud.classList.remove('hidden');
      else stickyHud.classList.add('hidden');
    }

    const depts = [
      { key: 'mech', chipId: 'stickyChipMech', valId: 'stickyValMech' },
      { key: 'elec', chipId: 'stickyChipElec', valId: 'stickyValElec' },
      { key: 'net', chipId: 'stickyChipNet', valId: 'stickyValNet' }
    ];

    depts.forEach(d => {
      const chip = document.getElementById(d.chipId);
      const valEl = document.getElementById(d.valId);
      const code = codes[d.key];
      if (code) {
        if (chip) {
          chip.classList.remove('locked');
          chip.classList.add('unlocked');
        }
        if (valEl) valEl.textContent = code;
      } else {
        if (chip) {
          chip.classList.add('locked');
          chip.classList.remove('unlocked');
        }
        if (valEl) valEl.textContent = 'LOCKED';
      }
    });
  }
  window.updateStickyPasscodeUI = updateStickyPasscodeUI;

  function showAssemblyPasscodeModal(dept, code) {
    playClick();
    playSuccessChime();
    const modal = document.getElementById('modalAssemblyPasscodeGenerated');
    const titleEl = document.getElementById('passcodeIssuedDeptTitle');
    const codeEl = document.getElementById('passcodeDisplayVal');

    const deptNames = {
      mech: 'MECHANICAL DEPARTMENT QUALIFIED',
      elec: 'ELECTRONIC DEPARTMENT QUALIFIED',
      net: 'NETWORK & COMM DEPARTMENT QUALIFIED'
    };

    if (titleEl) titleEl.textContent = deptNames[dept] || `${dept.toUpperCase()} DEPARTMENT QUALIFIED`;
    if (codeEl) codeEl.textContent = code;

    if (modal) {
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');
    }
    updateStickyPasscodeUI();
  }
  window.showAssemblyPasscodeModal = showAssemblyPasscodeModal;

  function triggerAssemblyPasscodeIssuance(dept) {
    if (!gameState.assemblyPasscodes) {
      gameState.assemblyPasscodes = { mech: null, elec: null, net: null };
    }
    if (!gameState.assemblyPasscodes[dept]) {
      gameState.assemblyPasscodes[dept] = generateAssemblyPasscode(dept);
      showAssemblyPasscodeModal(dept, gameState.assemblyPasscodes[dept]);
      if (window.multiplayerManager?.syncAssemblyPasscodeUnlocked) {
        window.multiplayerManager.syncAssemblyPasscodeUnlocked(dept, gameState.assemblyPasscodes[dept]);
      }
      autoSaveGame();
    } else {
      showAssemblyPasscodeModal(dept, gameState.assemblyPasscodes[dept]);
    }
    updateStickyPasscodeUI();
  }
  window.triggerAssemblyPasscodeIssuance = triggerAssemblyPasscodeIssuance;

  function checkAndAutoIssuePasscodes(silent = false) {
    if (!gameState.assemblyPasscodes) {
      gameState.assemblyPasscodes = { mech: null, elec: null, net: null };
    }
    let issuedAny = false;
    if (gameState.subtask01Complete && gameState.subtask02Complete && !gameState.assemblyPasscodes.mech) {
      gameState.assemblyPasscodes.mech = generateAssemblyPasscode('mech');
      issuedAny = true;
      if (!silent) showAssemblyPasscodeModal('mech', gameState.assemblyPasscodes.mech);
      if (window.multiplayerManager?.syncAssemblyPasscodeUnlocked) {
        window.multiplayerManager.syncAssemblyPasscodeUnlocked('mech', gameState.assemblyPasscodes.mech);
      }
    }
    if (gameState.subtaskE01Complete && gameState.subtaskE02Complete && !gameState.assemblyPasscodes.elec) {
      gameState.assemblyPasscodes.elec = generateAssemblyPasscode('elec');
      issuedAny = true;
      if (!silent) showAssemblyPasscodeModal('elec', gameState.assemblyPasscodes.elec);
      if (window.multiplayerManager?.syncAssemblyPasscodeUnlocked) {
        window.multiplayerManager.syncAssemblyPasscodeUnlocked('elec', gameState.assemblyPasscodes.elec);
      }
    }
    if (gameState.subtaskN01Complete && gameState.subtaskN02Complete && !gameState.assemblyPasscodes.net) {
      gameState.assemblyPasscodes.net = generateAssemblyPasscode('net');
      issuedAny = true;
      if (!silent) showAssemblyPasscodeModal('net', gameState.assemblyPasscodes.net);
      if (window.multiplayerManager?.syncAssemblyPasscodeUnlocked) {
        window.multiplayerManager.syncAssemblyPasscodeUnlocked('net', gameState.assemblyPasscodes.net);
      }
    }
    if (issuedAny) {
      autoSaveGame();
    }
    updateStickyPasscodeUI();
  }
  window.checkAndAutoIssuePasscodes = checkAndAutoIssuePasscodes;

  function openAssemblyDeptSelectModal() {
    playClick();
    closeAllModals();
    const modal = document.getElementById('modalAssemblyDeptSelect');
    if (!modal) {
      const activeDept = gameState.activeDept || 'mechanical';
      const stage = activeDept === 'electronic' ? 'elec' : (activeDept === 'network' ? 'net' : 'mech');
      openAssemblyModal(stage);
      return;
    }
    if (facilityRoomInstance && typeof facilityRoomInstance.pause === 'function') {
      facilityRoomInstance.pause();
    }
    updateLobbyWaitingState();
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    updateAssemblyDeptSelectUI();
  }
  window.openAssemblyDeptSelectModal = openAssemblyDeptSelectModal;
  window.openAssemblyClaimModal = openAssemblyDeptSelectModal; // Backward-compatibility alias

  function updateAssemblyDeptSelectUI() {
    const codes = gameState.assemblyPasscodes || {};
    const depts = [
      { key: 'mech', cardId: 'selectCardMech', btnId: 'btnSelectMech', statusId: 'selectStatusMech' },
      { key: 'elec', cardId: 'selectCardElec', btnId: 'btnSelectElec', statusId: 'selectStatusElec' },
      { key: 'net', cardId: 'selectCardNet', btnId: 'btnSelectNet', statusId: 'selectStatusNet' }
    ];

    depts.forEach(d => {
      const card = document.getElementById(d.cardId);
      const btn = document.getElementById(d.btnId);
      const status = document.getElementById(d.statusId);
      const code = codes[d.key];

      if (code) {
        if (card) card.classList.add('qualified');
        if (status) {
          status.textContent = 'QUALIFIED // READY FOR ASSEMBLY';
          status.style.color = '#10b981';
        }
        if (btn) {
          btn.disabled = false;
          btn.textContent = 'ENTER PASSCODE';
        }
      } else {
        if (card) card.classList.remove('qualified');
        if (status) {
          status.textContent = 'PENDING AT WORKBENCH';
          status.style.color = '#f59e0b';
        }
        if (btn) {
          btn.disabled = true;
          btn.textContent = 'TASKS PENDING';
        }
      }
    });
  }
  window.updateAssemblyDeptSelectUI = updateAssemblyDeptSelectUI;

  let activePasscodeTargetDept = 'mech';

  function openAssemblyPasscodeInputModal(dept) {
    playClick();
    activePasscodeTargetDept = dept;
    const selectModal = document.getElementById('modalAssemblyDeptSelect');
    if (selectModal) {
      selectModal.classList.add('hidden');
      selectModal.setAttribute('aria-hidden', 'true');
    }

    const inputModal = document.getElementById('modalAssemblyPasscodeInput');
    const deptSub = document.getElementById('passcodeInputTargetDept');
    const inputField = document.getElementById('assemblyPasscodeInputField');
    const errMsg = document.getElementById('passcodeErrorMsg');

    const deptLabels = {
      mech: 'DEPARTMENT: MECHANICAL',
      elec: 'DEPARTMENT: ELECTRONIC',
      net: 'DEPARTMENT: NETWORK & COMM'
    };

    if (deptSub) deptSub.textContent = deptLabels[dept] || `DEPARTMENT: ${dept.toUpperCase()}`;
    if (errMsg) errMsg.classList.add('hidden');
    if (inputField) {
      inputField.value = '';
      inputField.classList.remove('shake-error');
    }

    if (inputModal) {
      inputModal.classList.remove('hidden');
      inputModal.setAttribute('aria-hidden', 'false');
      setTimeout(() => { if (inputField && typeof inputField.focus === "function") inputField.focus(); }, 100);
    }
  }
  window.openAssemblyPasscodeInputModal = openAssemblyPasscodeInputModal;

  function verifyAssemblyPasscode() {
    const inputField = document.getElementById('assemblyPasscodeInputField');
    const errMsg = document.getElementById('passcodeErrorMsg');
    const entered = (inputField?.value || '').trim().toUpperCase();
    const expected = (gameState.assemblyPasscodes?.[activePasscodeTargetDept] || '').trim().toUpperCase();
    const expectedDigits = expected.replace(/[^0-9]/g, '');

    // Allow full code (e.g. MECH-7492), pure numeric digits (e.g. 7492 or 446523), or exact match
    const isMatch = entered && (entered === expected || (expectedDigits && entered === expectedDigits));

    if (isMatch) {
      playSuccessChime();
      showToast(`SECURITY CLEARANCE VERIFIED: Accessing ${activePasscodeTargetDept.toUpperCase()} Assembly Bay!`, '🛰️');
      const inputModal = document.getElementById('modalAssemblyPasscodeInput');
      if (inputModal) {
        inputModal.classList.add('hidden');
        inputModal.setAttribute('aria-hidden', 'true');
      }
      if (typeof window.openAssemblyModal === 'function') {
        window.openAssemblyModal(activePasscodeTargetDept);
      } else {
        openAssemblyModal(activePasscodeTargetDept);
      }
    } else {
      playRadioBeep(220, 0.25, 'sawtooth');
      if (errMsg) errMsg.classList.remove('hidden');
      if (inputField) {
        inputField.classList.add('shake-error');
        setTimeout(() => inputField.classList.remove('shake-error'), 450);
      }
    }
  }
  window.verifyAssemblyPasscode = verifyAssemblyPasscode;

  // Wire Figma 456:81 Interactive Numpad Keys
  const numpadGrid = document.getElementById('figmaNumpadGrid');
  if (numpadGrid) {
    numpadGrid.addEventListener('click', (e) => {
      const btn = e.target.closest('.figma-numpad-key');
      if (!btn) return;
      const key = btn.dataset.key;
      const input = document.getElementById('assemblyPasscodeInputField');
      if (!input) return;

      playClick();
      if (key === 'clear') {
        input.value = input.value.slice(0, -1);
      } else if (key === 'enter') {
        verifyAssemblyPasscode();
      } else if (key !== undefined) {
        if (input.value.length < 12) {
          input.value += key;
        }
      }
    });
  }

  // Wire new modal listeners
  const btnClosePasscodeIssued = document.getElementById('btnClosePasscodeIssuedModal');
  if (btnClosePasscodeIssued) {
    btnClosePasscodeIssued.addEventListener('click', () => {
      const modal = document.getElementById('modalAssemblyPasscodeGenerated');
      if (modal) {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
      }
      if (facilityRoomInstance && typeof facilityRoomInstance.resume === 'function') {
        facilityRoomInstance.resume();
      }
    });
  }

  const btnCopyPasscode = document.getElementById('btnCopyPasscode');
  if (btnCopyPasscode) {
    btnCopyPasscode.addEventListener('click', () => {
      const codeVal = document.getElementById('passcodeDisplayVal')?.textContent || '';
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(codeVal).then(() => {
          showToast(`Passcode ${codeVal} copied to clipboard!`, '📋');
        }).catch(() => {});
      } else {
        showToast(`Passcode: ${codeVal}`, '📋');
      }
    });
  }

  const btnSelectMech = document.getElementById('btnSelectMech');
  const btnSelectElec = document.getElementById('btnSelectElec');
  const btnSelectNet = document.getElementById('btnSelectNet');
  const btnCloseAssemblySelect = document.getElementById('btnCloseAssemblySelect');

  if (btnSelectMech) {
    btnSelectMech.addEventListener('click', () => openAssemblyPasscodeInputModal('mech'));
  }
  if (btnSelectElec) {
    btnSelectElec.addEventListener('click', () => openAssemblyPasscodeInputModal('elec'));
  }
  if (btnSelectNet) {
    btnSelectNet.addEventListener('click', () => openAssemblyPasscodeInputModal('net'));
  }
  if (btnCloseAssemblySelect) {
    btnCloseAssemblySelect.addEventListener('click', () => {
      const m = document.getElementById('modalAssemblyDeptSelect');
      if (m) {
        m.classList.add('hidden');
        m.setAttribute('aria-hidden', 'true');
      }
      if (facilityRoomInstance && typeof facilityRoomInstance.resume === 'function') {
        facilityRoomInstance.resume();
      }
    });
  }

  const btnSubmitAssemblyPasscode = document.getElementById('btnSubmitAssemblyPasscode');
  if (btnSubmitAssemblyPasscode) {
    btnSubmitAssemblyPasscode.addEventListener('click', verifyAssemblyPasscode);
  }

  const inputPasscodeField = document.getElementById('assemblyPasscodeInputField');
  if (inputPasscodeField) {
    inputPasscodeField.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        verifyAssemblyPasscode();
      }
    });
  }

  const btnAutofillPasscode = document.getElementById('btnAutofillPasscode');
  if (btnAutofillPasscode) {
    btnAutofillPasscode.addEventListener('click', () => {
      const code = gameState.assemblyPasscodes?.[activePasscodeTargetDept];
      if (code && inputPasscodeField) {
        inputPasscodeField.value = code;
        playClick();
      }
    });
  }

  const btnBackToDeptSelect = document.getElementById('btnBackToDeptSelect');
  if (btnBackToDeptSelect) {
    btnBackToDeptSelect.addEventListener('click', () => {
      const inputModal = document.getElementById('modalAssemblyPasscodeInput');
      if (inputModal) {
        inputModal.classList.add('hidden');
        inputModal.setAttribute('aria-hidden', 'true');
      }
      openAssemblyDeptSelectModal();
    });
  }

  // Interactive HUD Sticky Passcode Chips: click to view modal or copy
  ['mech', 'elec', 'net'].forEach(dept => {
    const capitalized = dept.charAt(0).toUpperCase() + dept.slice(1);
    const chip = document.getElementById('stickyChip' + capitalized);
    if (chip) {
      chip.style.cursor = 'pointer';
      chip.addEventListener('click', (e) => {
        e.stopPropagation();
        const code = gameState.assemblyPasscodes?.[dept];
        if (code) {
          showAssemblyPasscodeModal(dept, code);
        } else {
          showToast(dept.toUpperCase() + ' department has not qualified yet. Complete workbench tasks to earn your passcode!', '🔒');
        }
      });
    }
  });


    function openModal(modalKey) {
    playClick();
    // Close any other open modal
    closeAllModals();
    if (facilityRoomInstance && typeof facilityRoomInstance.pause === 'function') {
      facilityRoomInstance.pause();
    }

    const targetModal = modals[modalKey];
    if (targetModal) {
      targetModal.classList.remove('hidden');

      // Refresh specific content and ensure active department matches station
      if (modalKey === 'computer') {
        setDepartment('mechanical');
        updateSessionSheetUI();
      } else if (modalKey === 'laptop') {
        setDepartment('mechanical');
        renderMarketplace();
      } else if (modalKey === 'papers') {
        setDepartment('mechanical');
        gameState.papersChecked = true;
        updateMissionChecklistUI();
        autoSaveGame();
      } else if (modalKey === 'workbench') {
        setDepartment('mechanical');
        updateWorkbenchUI();
        const view02 = document.getElementById('wbViewSubtask02');
        if (view02 && !view02.classList.contains('hidden')) {
          initOrResizeSadm3D();
        } else {
          initOrResizeWorkbench3D();
        }
      } else if (modalKey === 'computer_elec') {
        setDepartment('electronic');
        updateSessionSheetElecUI();
      } else if (modalKey === 'laptop_elec') {
        setDepartment('electronic');
        renderMarketplaceElec();
      } else if (modalKey === 'papers_elec') {
        setDepartment('electronic');
        gameState.elecPapersChecked = true;
        updateMissionChecklistUI();
        autoSaveGame();
      } else if (modalKey === 'workbench_elec') {
        setDepartment('electronic');
        updateElecWorkbenchUI();
        initOrResizeElectronicsWorkbench3D();
      } else if (modalKey === 'computer_net') {
        setDepartment('network');
        updateSessionSheetNetUI();
      } else if (modalKey === 'laptop_net') {
        setDepartment('network');
        renderMarketplaceNet();
      } else if (modalKey === 'papers_net') {
        setDepartment('network');
        gameState.netPapersChecked = true;
        updateMissionChecklistUI();
        autoSaveGame();
      } else if (modalKey === 'workbench_net') {
        setDepartment('network');
        updateNetWorkbenchUI();
        initOrResizeNetworkWorkbench3D();
      }
      else if (modalKey === 'science_camera') {
        updateScienceCameraTelemetry();
      }
    }
  }

  function closeAllModals() {
    if (sadm3DInstance && sadm3DInstance.stopServoHum) {
      sadm3DInstance.stopServoHum();
    }
    if (assembly3DInstance && assembly3DInstance.stop) {
      assembly3DInstance.stop();
    }
    if (workbench3DInstance && typeof workbench3DInstance.stop === 'function') {
      workbench3DInstance.stop();
    }
    if (electronicsWorkbenchInstance && typeof electronicsWorkbenchInstance.stop === 'function') {
      electronicsWorkbenchInstance.stop();
    }
    if (networkWorkbenchInstance && typeof networkWorkbenchInstance.stop === 'function') {
      networkWorkbenchInstance.stop();
    }
    if (facilityRoomInstance && typeof facilityRoomInstance.resume === 'function') {
      facilityRoomInstance.resume();
    }
    const claimModal = document.getElementById('modalAssemblyClaim');
    if (claimModal) {
      claimModal.classList.add('hidden');
      claimModal.setAttribute('aria-hidden', 'true');
    }
    const miniGameOverlay = document.getElementById('assemblyMiniGameOverlay');
    if (miniGameOverlay) {
      miniGameOverlay.classList.add('hidden');
      miniGameOverlay.setAttribute('aria-hidden', 'true');
    }
    Object.values(modals).forEach((m) => {
      if (m) {
        m.classList.add('hidden');
        m.setAttribute('aria-hidden', 'true');
      }
    });
  }

  // =========================================================================
  // PHASE 3 - MILESTONE M2: REGISTRATION DESK & KEYCARD AUTH SYSTEM
  // =========================================================================


  // =========================================================================
  // MULTIPLAYER LOBBY CREW GATE & WAITING STATUS READOUT (Phase 5 Spec)
  // =========================================================================
  function updateLobbyWaitingState() {
    const isMp = !!(gameState.isMultiplayer || (window.multiplayerManager && window.multiplayerManager.isInRoom));
    const btnEquip = document.getElementById('btnAuthorizeIssueKeycard');
    const lobbyBanner = document.getElementById('lobbyWaitingStatusBanner');
    const lobbyText = document.getElementById('lobbyWaitingStatusText');
    const modalNotice = document.getElementById('modalWaitingPlayersNotice');

    // Host-specified max players
    const targetPlayers = (window.multiplayerManager && window.multiplayerManager.currentRoom && window.multiplayerManager.currentRoom.maxPlayers) ||
                          gameState.maxPlayers ||
                          4;

    // Arrived players count
    let currentPlayers = 1;
    if (window.multiplayerManager && window.multiplayerManager.currentRoom) {
      const room = window.multiplayerManager.currentRoom;
      if (room.players && Array.isArray(room.players)) {
        currentPlayers = room.players.length;
      } else if (typeof room.playersCount === 'number') {
        currentPlayers = room.playersCount;
      }
    }
    if (window.lobbyRoomInstance && window.lobbyRoomInstance.remotePlayers) {
      currentPlayers = Math.max(currentPlayers, 1 + window.lobbyRoomInstance.remotePlayers.size);
    }

    if (!isMp) {
      // Singleplayer mode - immediately available
      if (btnEquip) {
        btnEquip.disabled = false;
        btnEquip.classList.remove('disabled');
        btnEquip.textContent = 'Equip';
        btnEquip.title = 'Equip Hubble Space Facility Access Keycard';
      }
      if (lobbyBanner) lobbyBanner.classList.add('hidden');
      if (modalNotice) modalNotice.classList.add('hidden');
      return;
    }

    // Multiplayer mode
    const isLobbyActive = !gameState.hasEnteredFacility;
    const allArrived = currentPlayers >= targetPlayers;

    if (lobbyBanner) {
      if (isLobbyActive) {
        lobbyBanner.classList.remove('hidden');
        if (allArrived) {
          lobbyBanner.classList.add('all-ready');
          if (lobbyText) lobbyText.textContent = `ALL CREW ARRIVED [${targetPlayers}/${targetPlayers}] // READY TO EQUIP`;
        } else {
          lobbyBanner.classList.remove('all-ready');
          if (lobbyText) lobbyText.textContent = `WAITING FOR PLAYERS [${currentPlayers}/${targetPlayers}]`;
        }
      } else {
        lobbyBanner.classList.add('hidden');
      }
    }

    if (modalNotice) {
      modalNotice.classList.remove('hidden');
      if (allArrived) {
        modalNotice.classList.add('all-ready');
        modalNotice.textContent = `ALL CREW ARRIVED [${targetPlayers}/${targetPlayers}] // READY TO EQUIP`;
      } else {
        modalNotice.classList.remove('all-ready');
        modalNotice.textContent = `WAITING FOR PLAYERS [${currentPlayers}/${targetPlayers}]`;
      }
    }

    if (btnEquip) {
      if (allArrived) {
        btnEquip.disabled = false;
        btnEquip.classList.remove('disabled');
        btnEquip.textContent = 'Equip';
        btnEquip.title = 'Equip Hubble Space Facility Access Keycard';
      } else {
        btnEquip.disabled = true;
        btnEquip.classList.add('disabled');
        btnEquip.textContent = `WAITING FOR PLAYERS [${currentPlayers}/${targetPlayers}]`;
        btnEquip.title = `Waiting for all crew members to arrive in lobby (${currentPlayers}/${targetPlayers})`;
      }
    }
  }
  window.updateLobbyWaitingState = updateLobbyWaitingState;

  function openLobbyRegistrationModal() {
    playClick();
    if (typeof document !== 'undefined' && document.pointerLockElement && typeof document.exitPointerLock === 'function') {
      try { document.exitPointerLock(); } catch (e) {}
    }
    const activeRoom = facilityRoomInstance || (typeof window !== 'undefined' ? window.facilityRoomInstance : null);
    if (activeRoom && activeRoom.isPaused !== undefined) {
      activeRoom.isPaused = true;
    }

    const modal = document.getElementById('modalLobbyRegistration');
    if (!modal) return;

    if (typeof updateLobbyWaitingState === 'function') {
      updateLobbyWaitingState();
    }

    // Prefill Callsign from authManager, gameState, or localStorage
    const callsignInput = document.getElementById('regOperatorCallsign');
    const previewCallsign = document.getElementById('previewCallsign');
    const existingCallsign = (typeof window !== 'undefined' && window.authManager && window.authManager.operatorName) ||
                             gameState.operatorName ||
                             (typeof localStorage !== 'undefined' ? localStorage.getItem('nasa_operator_name') : null) ||
                             'Astronaut_01';

    if (callsignInput) {
      callsignInput.value = existingCallsign;
    }
    if (previewCallsign) {
      previewCallsign.textContent = `CALLSIGN: ${existingCallsign}`;
    }

    // Prefill Department selection
    const deptSelect = document.getElementById('regDepartmentSelect');
    const previewDept = document.getElementById('previewDept');
    const activeDept = gameState.activeDept || 'electronic';
    if (deptSelect) {
      deptSelect.value = activeDept;
    }
    if (previewDept) {
      previewDept.textContent = `DEPT: ${activeDept.toUpperCase()}`;
    }

    // Update live preview status
    const previewClearance = document.querySelector('.overlay-clearance');
    if (previewClearance) {
      previewClearance.textContent = gameState.hasKeycard ? 'STATUS: AUTHORIZED' : 'STATUS: PENDING ISSUE';
    }

    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
  }
  window.openLobbyRegistrationModal = openLobbyRegistrationModal;

  function closeLobbyRegistrationModal() {
    playClick();
    const modal = document.getElementById('modalLobbyRegistration');
    if (modal) {
      modal.classList.add('hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
    const activeRoom = facilityRoomInstance || (typeof window !== 'undefined' ? window.facilityRoomInstance : null);
    if (activeRoom && activeRoom.isPaused !== undefined) {
      activeRoom.isPaused = false;
    }
  }
  window.closeLobbyRegistrationModal = closeLobbyRegistrationModal;

  function authorizeAndIssueKeycard(customData = null) {
    playClick();
    const callsignInput = document.getElementById('regOperatorCallsign');
    const deptSelect = document.getElementById('regDepartmentSelect');

    const rawCallsign = (customData && customData.callsign) ||
                        (callsignInput ? callsignInput.value.trim() : null) ||
                        (typeof window !== 'undefined' && window.authManager && window.authManager.operatorName) ||
                        gameState.operatorName ||
                        'Astronaut_01';
    const callsign = rawCallsign.trim() || 'Astronaut_01';

    const department = (customData && customData.department) ||
                       (deptSelect ? deptSelect.value : null) ||
                       gameState.activeDept ||
                       'electronic';

    const clearance = (customData && customData.clearance) || 'STS-61 Mission Ground Prep';

    // Multiplayer Lobby Gate: Cannot equip until all players configured by host arrive
    const isMp = !!(gameState.isMultiplayer || (window.multiplayerManager && window.multiplayerManager.isInRoom));
    if (isMp) {
      const targetPlayers = (window.multiplayerManager && window.multiplayerManager.currentRoom && window.multiplayerManager.currentRoom.maxPlayers) ||
                            gameState.maxPlayers ||
                            4;
      let currentPlayers = 1;
      if (window.multiplayerManager && window.multiplayerManager.currentRoom) {
        const room = window.multiplayerManager.currentRoom;
        if (room.players && Array.isArray(room.players)) {
          currentPlayers = room.players.length;
        } else if (typeof room.playersCount === 'number') {
          currentPlayers = room.playersCount;
        }
      }
      if (window.lobbyRoomInstance && window.lobbyRoomInstance.remotePlayers) {
        currentPlayers = Math.max(currentPlayers, 1 + window.lobbyRoomInstance.remotePlayers.size);
      }
      if (currentPlayers < targetPlayers) {
        showToast(`WAITING FOR PLAYERS [${currentPlayers}/${targetPlayers}] - CANNOT EQUIP YET`, '⏳');
        return null;
      }
    }

    // 1. Update Game State
    gameState.keycardRegistered = true;
    gameState.hasKeycard = true;
    gameState.operatorName = callsign;
    gameState.elecOperatorName = callsign;
    gameState.netOperatorName = callsign;
    gameState.activeDept = department;
    gameState.keycardRegistrationData = {
      callsign,
      department,
      clearance,
      issuedAt: Date.now()
    };

    // 2. Sync with authManager & localStorage
    if (typeof window !== 'undefined' && window.authManager) {
      window.authManager.operatorName = callsign;
      if (typeof window.authManager.updateAllNameDisplays === 'function') {
        window.authManager.updateAllNameDisplays();
      }
    }
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('nasa_operator_name', callsign);
      }
    } catch (e) {}

    // 3. Update HUD Instruments Frame & Keycard Badge
    if (typeof updatePlayerFrameUI === 'function') {
      updatePlayerFrameUI();
    }
    const hudBadge = document.getElementById('hudKeycardBadge');
    if (hudBadge) {
      hudBadge.classList.remove('hidden');
      hudBadge.style.display = 'flex';
      const statusText = document.getElementById('hudKeycardBadgeStatus');
      if (statusText) statusText.textContent = 'AUTHORIZED [STS-61]';
    }

    // 4. Update preview card overlay status
    const previewClearance = document.querySelector('.overlay-clearance');
    if (previewClearance) {
      previewClearance.textContent = 'STATUS: AUTHORIZED';
    }

    // 5. Play Audio Chime
    if (typeof playKeycardGrantedSound === 'function') {
      playKeycardGrantedSound();
    } else if (typeof playSuccessChime === 'function') {
      playSuccessChime();
    }

    // 6. Display HUD Notification
    showKeycardHudBanner('FACILITY ACCESS KEYCARD ISSUED - PROCEED TO SOUTH-EAST AIRLOCK GATEWAY', true);

    // 7. Broadcast Multiplayer Synchronization Packet
    if (typeof window !== 'undefined' && window.multiplayerManager && typeof window.multiplayerManager.syncKeycardRegistration === 'function') {
      window.multiplayerManager.syncKeycardRegistration(gameState.keycardRegistrationData);
    }

    // 8. Close Modal and Resume 3D Controls
    setTimeout(() => {
      closeLobbyRegistrationModal();
    }, 300);

    return gameState.keycardRegistrationData;
  }
  window.authorizeAndIssueKeycard = authorizeAndIssueKeycard;

  function verifyKeycardAccess() {
    const activeRoom = window.lobbyRoomInstance || facilityRoomInstance || (typeof window !== 'undefined' ? window.facilityRoomInstance : null);

    if (gameState.hasKeycard) {
      // Access Granted
      if (typeof playKeycardGrantedSound === 'function') {
        playKeycardGrantedSound();
      }
      if (activeRoom && typeof activeRoom.setTerminalLedColor === 'function') {
        activeRoom.setTerminalLedColor(0x00FF88);
      }
      showKeycardHudBanner('ACCESS GRANTED - AIRLOCK DOORS OPENING', true);
      if (activeRoom && typeof activeRoom.openDoors === 'function') {
        activeRoom.openDoors(true);
      }
      if (typeof window !== 'undefined' && window.multiplayerManager?.broadcastSync) {
        window.multiplayerManager.broadcastSync('SYNC_DOOR_TRIGGER', { state: 'open' });
      }
      return true;
    } else {
      // Access Denied
      if (typeof playKeycardDeniedSound === 'function') {
        playKeycardDeniedSound();
      }
      if (activeRoom && typeof activeRoom.setTerminalLedColor === 'function') {
        activeRoom.setTerminalLedColor(0xFF2222);
      }
      showKeycardHudBanner('ACCESS DENIED - KEYCARD REQUIRED. PLEASE REGISTER AT RECEPTION DESK', false);
      return false;
    }
  }
  window.verifyKeycardAccess = verifyKeycardAccess;

  function onCleanroomEntered() {
    if (gameState) {
      gameState.hasEnteredFacility = true;
    }
    // Clean up Lobby instance
    if (window.lobbyRoomInstance) {
      try { window.lobbyRoomInstance.destroy(); } catch (e) {}
      window.lobbyRoomInstance = null;
    }
    // Initialize & mount Cleanroom Facility Room
    const FacClass = window.FacilityFPSRoom || (typeof FacilityFPSRoom !== 'undefined' ? FacilityFPSRoom : null);
    if (!facilityRoomInstance && FacClass) {
      facilityRoomInstance = new FacClass('facility3dCanvasContainer');
      window.facilityRoomInstance = facilityRoomInstance;
    }
    if (facilityRoomInstance) {
      if (facilityRoomInstance.player) {
        facilityRoomInstance.player.pos.x = 4.5;
        facilityRoomInstance.player.pos.z = 4.8;
        facilityRoomInstance.player.yaw = 0;
      }
      facilityRoomInstance.start();
      setTimeout(() => facilityRoomInstance.onWindowResize(), 60);
    }
    // Sync multiplayer connected peers inside Cleanroom
    if (window.multiplayerManager && window.multiplayerManager.isInRoom && window.multiplayerManager.currentRoom) {
      const room = window.multiplayerManager.currentRoom;
      if (room.players && facilityRoomInstance) {
        room.players.forEach((p) => {
          if (p.socketId !== window.multiplayerManager.socket?.id) {
            facilityRoomInstance.addRemotePlayer(p.socketId, p);
          }
        });
      }
    }

    updatePlayerFrameUI();
    updateMissionChecklistUI();
    if (!gameState.commsDone && typeof initFacilityCommsSequence === 'function') {
      initFacilityCommsSequence();
    }
    showToast('AIRLOCK CYCLE COMPLETE: Entered Hubble Space Facility.', '🚪');
  }
  window.onCleanroomEntered = onCleanroomEntered;

  // Wire Modal DOM Events
  const btnCloseLobbyRegistrationModal = document.getElementById('btnCloseLobbyRegistrationModal');
  if (btnCloseLobbyRegistrationModal) {
    btnCloseLobbyRegistrationModal.addEventListener('click', closeLobbyRegistrationModal);
  }

  const btnAuthorizeIssueKeycard = document.getElementById('btnAuthorizeIssueKeycard');
  if (btnAuthorizeIssueKeycard) {
    btnAuthorizeIssueKeycard.addEventListener('click', () => authorizeAndIssueKeycard());
  }

  const regCallsignInput = document.getElementById('regOperatorCallsign');
  if (regCallsignInput) {
    regCallsignInput.addEventListener('input', (e) => {
      const previewCallsign = document.getElementById('previewCallsign');
      if (previewCallsign) {
        previewCallsign.textContent = `CALLSIGN: ${e.target.value.trim() || 'ASTRONAUT'}`;
      }
    });
  }

  const regDeptSelect = document.getElementById('regDepartmentSelect');
  if (regDeptSelect) {
    regDeptSelect.addEventListener('change', (e) => {
      const previewDept = document.getElementById('previewDept');
      if (previewDept) {
        previewDept.textContent = `DEPT: ${e.target.value.toUpperCase()}`;
      }
    });
  }

  // Listen to 3D Lobby Event Dispatcher
  window.addEventListener('lobbyInteract', (e) => {
    const detail = e.detail || {};
    if (detail.type === 'monitor_lobby') {
      openLobbyRegistrationModal();
    } else if (detail.type === 'keycard_scanner') {
      verifyKeycardAccess();
    }
  });

  // Multiplayer Relay sync listener for keycard events
  if (typeof window !== 'undefined' && window.multiplayerManager) {
    const existingSync = window.multiplayerManager.onSyncEvent;
    window.multiplayerManager.onSyncEvent = (type, payload, sender, socketId) => {
      if (existingSync) existingSync(type, payload, sender, socketId);
      if (type === 'SYNC_KEYCARD_REGISTRATION') {
        console.log(`[MULTIPLAYER] Peer keycard registration from ${sender}:`, payload);
      }
      if (type === 'SYNC_DOOR_TRIGGER') {
        const activeRoom = window.lobbyRoomInstance || facilityRoomInstance || (typeof window !== 'undefined' ? window.facilityRoomInstance : null);
        if (activeRoom) {
          if (payload?.state === 'open' && typeof activeRoom.openDoors === 'function') {
            activeRoom.openDoors(false);
          } else if (payload?.state === 'closed' && typeof activeRoom.closeDoors === 'function') {
            activeRoom.closeDoors(false);
          }
        }
      }
    };
  }

  // Listen to 3D Event Dispatcher
  window.addEventListener('facilityInteract', (e) => {
    const detail = e.detail || {};
    const type = detail.type;

    // Automatically align department with whichever station the user interacts with
    if (type && type.includes('_net')) {
      setDepartment('network');
    } else if (type && type.includes('_elec')) {
      setDepartment('electronic');
    } else if (type && ['computer', 'laptop', 'papers', 'workbench'].includes(type)) {
      setDepartment('mechanical');
    }

    // --- Mechanical Department (Desk 01) ---
    if (type === 'computer') {
      openModal('computer');
    } else if (type === 'laptop') {
      if (!gameState.isCheckedIn) {
        showCenterCalmAlert('SECURITY PROTOCOL', 'Please check in at the Computer Terminal first to authorize Desk 01 session.', '🔒');
        openModal('computer');
        return;
      }
      openModal('laptop');
    } else if (type === 'papers') {
      openModal('papers');
    } else if (type === 'workbench') {
      if (!gameState.isCheckedIn) {
        showCenterCalmAlert('SECURITY PROTOCOL', 'Please check in at the Computer Terminal first to access Workbench 01.', '🔒');
        openModal('computer');
        return;
      }
      if (gameState.subtask01Complete && gameState.subtask02Complete) {
        triggerAssemblyPasscodeIssuance('mech');
        return;
      }
      openModal('workbench');
    } else if (type === 'coffee') {
      showToast('Hot Coffee. Essential fuel for NASA aerospace apprentices. (NIO)', '☕');
    }

    // --- Electronic Department (Desk 02) ---
    else if (type === 'computer_elec') {
      openModal('computer_elec');
    } else if (type === 'laptop_elec') {
      if (!gameState.elecCheckedIn) {
        showCenterCalmAlert('SECURITY PROTOCOL', 'Please check in at the Computer Terminal first to authorize Desk 02 session.', '🔒');
        openModal('computer_elec');
        return;
      }
      openModal('laptop_elec');
    } else if (type === 'papers_elec') {
      openModal('papers_elec');
    } else if (type === 'coffee_elec') {
      showToast('Hot Coffee. Essential fuel for NASA aerospace apprentices. (NIO)', '☕');
    } else if (type === 'workbench_elec') {
      if (!gameState.elecCheckedIn) {
        showCenterCalmAlert('SECURITY PROTOCOL', 'Please check in at the Computer Terminal first to access Desk 02 Electronics Workbench.', '🔒');
        openModal('computer_elec');
        return;
      }
      if (gameState.subtaskE01Complete && gameState.subtaskE02Complete) {
        triggerAssemblyPasscodeIssuance('elec');
        return;
      }
      openModal('workbench_elec');
      showToast('Desk 02 Electronics Workbench Active: DF-224 Flight Board Ready!', '⚡');
    }

    // --- Network Department (Desk 03 - South Wall) ---
    else if (type === 'computer_net') {
      openModal('computer_net');
    } else if (type === 'laptop_net') {
      if (!gameState.netCheckedIn) {
        showCenterCalmAlert('SECURITY PROTOCOL', 'Please check in at the Computer Terminal first to authorize Desk 03 session.', '🔒');
        openModal('computer_net');
        return;
      }
      openModal('laptop_net');
    } else if (type === 'papers_net') {
      openModal('papers_net');
    } else if (type === 'coffee_net') {
      showToast('Hot Coffee. Keeps telemetry packets flowing and carrier locked. (NIO)', '☕');
    } else if (type === 'workbench_net') {
      if (!gameState.netCheckedIn) {
        showCenterCalmAlert('SECURITY PROTOCOL', 'Please check in at the Computer Terminal first to access Desk 03 Network Workbench.', '🔒');
        openModal('computer_net');
        return;
      }
      if (gameState.subtaskN01Complete && gameState.subtaskN02Complete) {
        triggerAssemblyPasscodeIssuance('net');
        return;
      }
      openModal('workbench_net');
      showToast('Desk 03 Network Workbench Active: HGA Rig & Splicer Ready!', '📡');
    }

    // --- North Wall Science Telemetry Display ---
    else if (type === 'science_screen') {
      openModal('science_camera');
    }

    // --- Central Hubble Space Telescope ---
    else if (type === 'hubble') {
      openAssemblyClaimModal();
    } else if (type === 'console') {
      showToast('Mission Computer Terminal Online: Systems nominal.', '💻');
    }
  });

  // Close buttons on all modals
  ['btnCloseComputerModal', 'btnCloseLaptopModal', 'btnClosePapersModal', 'btnCloseWorkbenchModal', 'btnCloseDebriefModal',
   'btnCloseComputerModalElec', 'btnCloseLaptopModalElec', 'btnClosePapersModalElec', 'btnCloseElectronicsWorkbenchModal', 'btnCloseDebriefModalElec', 'btnCloseScienceCameraModal',
   'btnCloseComputerModalNet', 'btnCloseLaptopModalNet', 'btnClosePapersModalNet', 'btnCloseNetworkWorkbenchModal', 'btnCloseDebriefModalNet', 'btnCloseAssemblyModal'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) btn.addEventListener('click', closeAllModals);
  });

  const btnDebriefExplore = document.getElementById('btnDebriefExplore');
  const btnDebriefMainMenu = document.getElementById('btnDebriefMainMenu');
  if (btnDebriefExplore) {
    btnDebriefExplore.addEventListener('click', () => {
      playClick();
      closeAllModals();
      showToast('Mission certified! Feel free to explore the cleanroom facility.', '🚀');
    });
  }
  if (btnDebriefMainMenu) {
    btnDebriefMainMenu.addEventListener('click', () => {
      playClick();
      closeAllModals();
      showScreen('menu');
      updateContinueButtonState();
    });
  }

  const btnDebriefExploreElec = document.getElementById('btnDebriefExploreElec');
  const btnDebriefMainMenuElec = document.getElementById('btnDebriefMainMenuElec');
  if (btnDebriefExploreElec) {
    btnDebriefExploreElec.addEventListener('click', () => {
      playClick();
      closeAllModals();
      showToast('Electronic Department qualification certified! Feel free to explore the cleanroom.', '🚀');
    });
  }
  if (btnDebriefMainMenuElec) {
    btnDebriefMainMenuElec.addEventListener('click', () => {
      playClick();
      closeAllModals();
      showScreen('menu');
      updateContinueButtonState();
    });
  }

  // Backdrop click closes modal
  document.querySelectorAll('.facility-modal-backdrop').forEach((backdrop) => {
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeAllModals();
    });
  });

  // =========================================================================
  // 1. COMPUTER CHECK-IN & SESSION SHEET
  // =========================================================================
  const sessionSheetClock = document.getElementById('sessionSheetClock');
  const inputOperatorName = document.getElementById('inputOperatorName');
  const btnPerformCheckIn = document.getElementById('btnPerformCheckIn');
  const btnPerformCheckOut = document.getElementById('btnPerformCheckOut');
  const sessionStatusBanner = document.getElementById('sessionStatusBanner');
  const sessionStatusLabel = document.getElementById('sessionStatusLabel');
  const sessionLogCheckinTime = document.getElementById('sessionLogCheckinTime');
  const sessionLogDuration = document.getElementById('sessionLogDuration');

  // Main Task & Subtask HUD Elements
  const hudMainTaskCard = document.getElementById('hudMainTaskCard');
  const mainTaskStatusBadge = document.getElementById('mainTaskStatusBadge');
  const mainTaskHint = document.getElementById('mainTaskHint');
  const subtaskCard01 = document.getElementById('subtaskCard01');
  const subtaskPill01 = document.getElementById('subtaskPill01');
  const subtaskCard02 = document.getElementById('subtaskCard02');
  const subtaskPill02 = document.getElementById('subtaskPill02');
  const hudBudgetChip = document.getElementById('hudBudgetChip');

  // Live Clock on Session Sheet
  function updateSessionClock() {
    if (!sessionSheetClock) return;
    const now = new Date();
    const utcStr = now.toUTCString().replace('GMT', 'UTC');
    sessionSheetClock.value = utcStr;
  }
  setInterval(updateSessionClock, 1000);
  updateSessionClock();

  function updateSessionSheetUI() {
    if (inputOperatorName) inputOperatorName.value = gameState.operatorName;

    // Check-In Concurrency Lock Enforcement
    const lock1 = stationLocks.mechanical_desk_01;
    const isLocked1 = lock1 && lock1.lockedBy && lock1.lockedBy !== 'local' && lock1.lockedBy !== window.multiplayerManager?.socket?.id;
    if (isLocked1) {
      if (btnPerformCheckIn) {
        btnPerformCheckIn.disabled = true;
        btnPerformCheckIn.classList.add('disabled');
        btnPerformCheckIn.textContent = `OCCUPIED BY ${(lock1.playerName || 'ENGINEER').toUpperCase()}`;
      }
      if (inputOperatorName) inputOperatorName.disabled = true;
    } else if (!gameState.isCheckedIn && btnPerformCheckIn) {
      btnPerformCheckIn.disabled = false;
      btnPerformCheckIn.classList.remove('disabled');
      btnPerformCheckIn.textContent = 'CHECK IN';
      if (inputOperatorName) inputOperatorName.disabled = false;
    }

    if (gameState.isCheckedIn) {
      if (sessionStatusBanner) {
        sessionStatusBanner.classList.add('checked');
        const dot = sessionStatusBanner.querySelector('.status-indicator-dot');
        if (dot) {
          dot.classList.remove('not-checked');
          dot.classList.add('checked');
        }
      }
      if (sessionStatusLabel) sessionStatusLabel.textContent = 'STATUS: CHECKED IN (ACTIVE WORK SHIFT)';
      if (btnPerformCheckIn) {
        btnPerformCheckIn.disabled = true;
        btnPerformCheckIn.classList.add('disabled');
      }
      if (btnPerformCheckOut) {
        btnPerformCheckOut.disabled = false;
        btnPerformCheckOut.classList.remove('disabled');
      }
    } else if (!isLocked1) {
      if (sessionStatusBanner) {
        sessionStatusBanner.classList.remove('checked');
        const dot = sessionStatusBanner.querySelector('.status-indicator-dot');
        if (dot) {
          dot.classList.remove('checked');
          dot.classList.add('not-checked');
        }
      }
      if (sessionStatusLabel) sessionStatusLabel.textContent = 'STATUS: NOT CHECKED IN (VISITOR / PENDING)';
      if (btnPerformCheckIn) {
        btnPerformCheckIn.disabled = false;
        btnPerformCheckIn.classList.remove('disabled');
      }
      if (btnPerformCheckOut) {
        btnPerformCheckOut.disabled = true;
        btnPerformCheckOut.classList.add('disabled');
      }
    }
  }

  if (btnPerformCheckIn) {
    btnPerformCheckIn.addEventListener('click', () => {
      playClick();
      playSuccessChime();

      gameState.isCheckedIn = true;
      gameState.mechCheckedIn = true;
      if (inputOperatorName && inputOperatorName.value.trim()) {
        gameState.operatorName = inputOperatorName.value.trim();
      }
      const hudOpEl = document.getElementById('hudOperatorNameDisplay');
      if (hudOpEl) hudOpEl.textContent = gameState.operatorName;
      gameState.checkInTimestamp = new Date();

      if (sessionLogCheckinTime) {
        sessionLogCheckinTime.innerHTML = `<span>Check-in Timestamp:</span> <span>${gameState.checkInTimestamp.toLocaleTimeString()} UTC</span>`;
      }

      // Start duration counter
      if (gameState.durationInterval) clearInterval(gameState.durationInterval);
      gameState.durationInterval = setInterval(() => {
        if (!gameState.isCheckedIn || !gameState.checkInTimestamp) return;
        const diffMs = Date.now() - gameState.checkInTimestamp.getTime();
        const totalSec = Math.floor(diffMs / 1000);
        const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
        const ss = String(totalSec % 60).padStart(2, '0');
        if (sessionLogDuration) {
          sessionLogDuration.innerHTML = `<span>Active Working Duration:</span> <span>${hh}:${mm}:${ss}</span>`;
        }
      }, 1000);

      updateSessionSheetUI();

      // Broadcast station lock to peers
      window.multiplayerManager?.syncStationLock('mechanical_desk_01', true);
      stationLocks.mechanical_desk_01 = { lockedBy: window.multiplayerManager?.socket?.id || 'local', playerName: gameState.operatorName };

      // Switch department & sync frame to Mechanical
      setDepartment('mechanical');

      // Update Main Task: "Take control of mechanical department" -> COMPLETE!
      if (hudMainTaskCard) hudMainTaskCard.classList.add('completed');
      if (mainTaskStatusBadge) {
        mainTaskStatusBadge.textContent = 'CONTROL TAKEN';
        mainTaskStatusBadge.classList.remove('pending');
        mainTaskStatusBadge.classList.add('completed');
      }
      if (mainTaskHint) {
        mainTaskHint.textContent = 'Control authorized! Proceed to Laptop (Marketplace) & Workbench.';
      }

      // Unlock Subtasks
      if (subtaskCard01) {
        subtaskCard01.classList.remove('locked');
        subtaskCard01.classList.add('active');
      }
      if (subtaskPill01) subtaskPill01.textContent = 'ACTIVE';

      if (subtaskCard02) {
        subtaskCard02.classList.remove('locked');
        subtaskCard02.classList.add('active');
      }
      if (subtaskPill02) subtaskPill02.textContent = 'ACTIVE';

      updateMissionChecklistUI();
      showToast(`Welcome ${gameState.operatorName}. Mechanical Department control authorized!`, '✅');
      autoSaveGame();
    });
  }

  if (btnPerformCheckOut) {
    btnPerformCheckOut.addEventListener('click', () => {
      if (!gameState.isCheckedIn) return;
      playClick();
      playCheckoutStamp();
      gameState.isCheckedIn = false;
      gameState.mechCheckedIn = false;
      stationLocks.mechanical_desk_01 = null;
      window.multiplayerManager?.syncStationLock('mechanical_desk_01', false);
      if (gameState.durationInterval) clearInterval(gameState.durationInterval);
      updateSessionSheetUI();
      updateMissionChecklistUI();
      closeAllModals();
      autoSaveGame();

      if (gameState.subtask01Complete && gameState.subtask02Complete) {
        showMissionAccomplishedDebrief();
      } else {
        showToast('Checked out of GSFC Cleanroom session.', '📋');
      }
    });
  }

  function showMissionAccomplishedDebrief() {
    playMissionAccomplished();
    const modal = document.getElementById('modalMissionAccomplished');
    const opEl = document.getElementById('debriefOperatorName');
    const durEl = document.getElementById('debriefDuration');
    const budEl = document.getElementById('debriefBudget');

    if (opEl) opEl.textContent = gameState.operatorName;
    if (durEl && sessionLogDuration) {
      durEl.textContent = sessionLogDuration.querySelector('span:last-child')?.textContent || '00:08:42';
    }
    if (budEl) budEl.textContent = `$${gameState.budget.toLocaleString()}`;

    if (modal) modal.classList.remove('hidden');
  }

  // =========================================================================
  // 1B. DESK 02: ELECTRONIC DEPARTMENT COMPUTER CHECK-IN & SESSION SHEET
  // =========================================================================
  const sessionSheetClockElec = document.getElementById('sessionSheetClockElec');
  const inputOperatorNameElec = document.getElementById('inputOperatorNameElec');
  const btnPerformCheckInElec = document.getElementById('btnPerformCheckInElec');
  const btnPerformCheckOutElec = document.getElementById('btnPerformCheckOutElec');
  const sessionStatusBannerElec = document.getElementById('sessionStatusBannerElec');
  const sessionStatusLabelElec = document.getElementById('sessionStatusLabelElec');
  const sessionLogCheckinTimeElec = document.getElementById('sessionLogCheckinTimeElec');
  const sessionLogDurationElec = document.getElementById('sessionLogDurationElec');
  const btnRunTelemetryDiag = document.getElementById('btnRunTelemetryDiag');
  const diagValE01 = document.getElementById('diagValE01');
  const diagBarE01 = document.getElementById('diagBarE01');
  const diagValE02 = document.getElementById('diagValE02');
  const diagBarE02 = document.getElementById('diagBarE02');

  function updateSessionClockElec() {
    if (!sessionSheetClockElec) return;
    const now = new Date();
    sessionSheetClockElec.value = now.toUTCString().replace('GMT', 'UTC');
  }
  setInterval(updateSessionClockElec, 1000);
  updateSessionClockElec();

  function updateSessionSheetElecUI() {
    if (inputOperatorNameElec) inputOperatorNameElec.value = gameState.elecOperatorName;

    // Check-In Concurrency Lock Enforcement
    const lock2 = stationLocks.electronic_desk_02;
    const isLocked2 = lock2 && lock2.lockedBy && lock2.lockedBy !== 'local' && lock2.lockedBy !== window.multiplayerManager?.socket?.id;
    if (isLocked2) {
      if (btnPerformCheckInElec) {
        btnPerformCheckInElec.disabled = true;
        btnPerformCheckInElec.classList.add('disabled');
        btnPerformCheckInElec.textContent = `OCCUPIED BY ${(lock2.playerName || 'ENGINEER').toUpperCase()}`;
      }
      if (inputOperatorNameElec) inputOperatorNameElec.disabled = true;
    } else if (!gameState.elecCheckedIn && btnPerformCheckInElec) {
      btnPerformCheckInElec.disabled = false;
      btnPerformCheckInElec.classList.remove('disabled');
      btnPerformCheckInElec.textContent = 'CHECK IN';
      if (inputOperatorNameElec) inputOperatorNameElec.disabled = false;
    }

    if (gameState.elecCheckedIn) {
      if (sessionStatusBannerElec) {
        sessionStatusBannerElec.classList.add('checked');
        const dot = sessionStatusBannerElec.querySelector('.status-indicator-dot');
        if (dot) {
          dot.classList.remove('not-checked');
          dot.classList.add('checked');
        }
      }
      if (sessionStatusLabelElec) sessionStatusLabelElec.textContent = 'STATUS: CHECKED IN (ACTIVE WORK SHIFT)';
      if (btnPerformCheckInElec) {
        btnPerformCheckInElec.disabled = true;
        btnPerformCheckInElec.classList.add('disabled');
      }
    } else if (!isLocked2) {
      if (sessionStatusBannerElec) {
        sessionStatusBannerElec.classList.remove('checked');
        const dot = sessionStatusBannerElec.querySelector('.status-indicator-dot');
        if (dot) {
          dot.classList.remove('checked');
          dot.classList.add('not-checked');
        }
      }
      if (sessionStatusLabelElec) sessionStatusLabelElec.textContent = 'STATUS: NOT CHECKED IN (PENDING AUTHORIZATION)';
      if (btnPerformCheckInElec) {
        btnPerformCheckInElec.disabled = false;
        btnPerformCheckInElec.classList.remove('disabled');
      }
    }

    // Telemetry Diagnostic Button Readiness
    const breakerOn = gameState.breakerMasterOn || (electronicsWorkbenchInstance && electronicsWorkbenchInstance.breakerMasterOn);
    const bothComplete = gameState.subtaskE01Complete && gameState.subtaskE02Complete;

    if (btnRunTelemetryDiag) {
      if (bothComplete && breakerOn && !gameState.telemetryDiagRun) {
        btnRunTelemetryDiag.disabled = false;
        btnRunTelemetryDiag.classList.remove('disabled');
        btnRunTelemetryDiag.classList.add('ready-pulse');
      } else if (gameState.telemetryDiagRun) {
        btnRunTelemetryDiag.disabled = true;
        btnRunTelemetryDiag.classList.remove('disabled', 'ready-pulse');
        btnRunTelemetryDiag.classList.add('completed');
        btnRunTelemetryDiag.innerHTML = '<span>TELEMETRY DIAGNOSTIC PASSED [100% NOMINAL]</span>';
      } else {
        btnRunTelemetryDiag.disabled = true;
        btnRunTelemetryDiag.classList.add('disabled');
        btnRunTelemetryDiag.classList.remove('ready-pulse', 'completed');
      }
    }

    // Checkout button readiness (keep clickable so informative alert fires if prerequisites remain)
    if (btnPerformCheckOutElec) {
      const canCheckOut = gameState.elecCheckedIn && bothComplete && breakerOn && gameState.telemetryDiagRun;
      btnPerformCheckOutElec.disabled = false;
      btnPerformCheckOutElec.classList.toggle('ready-pulse', canCheckOut);
      btnPerformCheckOutElec.classList.toggle('pending-look', !canCheckOut);
    }
  }

  if (btnPerformCheckInElec) {
    btnPerformCheckInElec.addEventListener('click', () => {
      playClick();
      playSuccessChime();

      gameState.elecCheckedIn = true;
      if (inputOperatorNameElec && inputOperatorNameElec.value.trim()) {
        gameState.elecOperatorName = inputOperatorNameElec.value.trim();
      }
      const hudOpEl = document.getElementById('hudOperatorNameDisplay');
      if (hudOpEl) hudOpEl.textContent = gameState.elecOperatorName;
      gameState.elecCheckInTimestamp = new Date();

      if (sessionLogCheckinTimeElec) {
        sessionLogCheckinTimeElec.innerHTML = `<span>Check-in Timestamp:</span> <span>${gameState.elecCheckInTimestamp.toLocaleTimeString()} UTC</span>`;
      }

      if (gameState.elecDurationInterval) clearInterval(gameState.elecDurationInterval);
      gameState.elecDurationInterval = setInterval(() => {
        if (!gameState.elecCheckedIn || !gameState.elecCheckInTimestamp) return;
        const diffMs = Date.now() - gameState.elecCheckInTimestamp.getTime();
        const totalSec = Math.floor(diffMs / 1000);
        const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
        const ss = String(totalSec % 60).padStart(2, '0');
        if (sessionLogDurationElec) {
          sessionLogDurationElec.innerHTML = `<span>Active Working Duration:</span> <span>${hh}:${mm}:${ss}</span>`;
        }
      }, 1000);

      // Broadcast station lock to peers
      window.multiplayerManager?.syncStationLock('electronic_desk_02', true);
      stationLocks.electronic_desk_02 = { lockedBy: window.multiplayerManager?.socket?.id || 'local', playerName: gameState.elecOperatorName };

      setDepartment('electronic');
      updateSessionSheetElecUI();
      updateMissionChecklistUI();
      showToast(`Welcome ${gameState.elecOperatorName}. Electronic Department control authorized!`, '⚡');
      autoSaveGame();
    });
  }

  if (btnRunTelemetryDiag) {
    btnRunTelemetryDiag.addEventListener('click', () => {
      if (btnRunTelemetryDiag.disabled) return;
      playClick();
      playRadioBeep(600, 0.15, 'sawtooth');

      btnRunTelemetryDiag.disabled = true;
      if (diagValE01) diagValE01.textContent = 'RUNNING TELEMETRY SWEEP...';
      if (diagValE02) diagValE02.textContent = 'SYNCHRONIZING CLOCKS...';

      let progress = 0;
      const diagTimer = setInterval(() => {
        progress += 10;
        if (diagBarE01) diagBarE01.style.width = `${progress}%`;
        if (diagBarE02) diagBarE02.style.width = `${Math.min(100, Math.floor(progress * 1.05))}%`;
        playRadioBeep(800 + progress * 5, 0.04, 'sine');

        if (progress >= 100) {
          clearInterval(diagTimer);
          gameState.telemetryDiagRun = true;
          if (diagValE01) {
            diagValE01.textContent = 'CORE MEMORY: NOMINAL (100%)';
            diagValE01.style.color = '#10b981';
          }
          if (diagValE02) {
            diagValE02.textContent = 'VOLTAGE & WAVE: SYNCHRONIZED (100%)';
            diagValE02.style.color = '#10b981';
          }
          playSuccessChime();
          showToast('Telemetry diagnostic complete: All electronic subsystems NOMINAL!', '🚀');
          updateSessionSheetElecUI();
          updateMissionChecklistUI();
          autoSaveGame();
        }
      }, 180);
    });
  }

  if (btnPerformCheckOutElec) {
    btnPerformCheckOutElec.addEventListener('click', () => {
      playClick();
      if (!gameState.elecCheckedIn) {
        showCenterCalmAlert("NOT CHECKED IN", "Click [CHECK IN & AUTHORIZE TERMINAL] to initiate your shift first.", "ℹ️");
        return;
      }
      if (!gameState.subtaskE01Complete || !gameState.subtaskE02Complete) {
        showCenterCalmAlert("TASKS INCOMPLETE", "Complete both [SUB-TSK-E-01] (DF-224 Computer Repair) and [SUB-TSK-E-02] (FGS Calibration) before check-out.", "⚠️");
        return;
      }
      const breakerOn = gameState.breakerMasterOn || (electronicsWorkbenchInstance && electronicsWorkbenchInstance.breakerMasterOn);
      if (!breakerOn) {
        showCenterCalmAlert("BREAKER DE-ENERGIZED", "Desk 02 Workbench: Flip safety cover and energize Master Circuit Breaker switch [ON].", "⚡");
        return;
      }
      if (!gameState.telemetryDiagRun) {
        showCenterCalmAlert("DIAGNOSTIC REQUIRED", "Click the pulsing blue button [RUN SUBSYSTEM TELEMETRY DIAGNOSTIC] to finalize checkout.", "📋");
        return;
      }

      playCheckoutStamp();
      gameState.elecCheckedIn = false;
      stationLocks.electronic_desk_02 = null;
      window.multiplayerManager?.syncStationLock('electronic_desk_02', false);
      if (gameState.elecDurationInterval) clearInterval(gameState.elecDurationInterval);
      updateSessionSheetElecUI();
      closeAllModals();
      showMissionAccomplishedDebriefElec();
      autoSaveGame();
    });
  }

  function showMissionAccomplishedDebriefElec() {
    playMissionAccomplished();
    const modal = document.getElementById('modalMissionAccomplishedElec');
    const opEl = document.getElementById('debriefOperatorNameElec');
    const durEl = document.getElementById('debriefDurationElec');
    const shocksEl = document.getElementById('debriefShocksElec');
    const precEl = document.getElementById('debriefPrecisionElec');

    if (opEl) opEl.textContent = gameState.elecOperatorName;
    if (durEl && sessionLogDurationElec) {
      durEl.textContent = sessionLogDurationElec.querySelector('span:last-child')?.textContent || '00:07:35';
    }
    const shocks = gameState.staticShockIncidents || 0;
    const grade = shocks === 0 ? 'GRADE A (PERFECT)' : (shocks <= 1 ? 'GRADE B (ACCEPTABLE)' : 'GRADE C (NEEDS WORK)');
    if (shocksEl) {
      shocksEl.textContent = `${shocks} (${grade})`;
      shocksEl.className = `debrief-stat-val ${shocks === 0 ? 'status-green' : 'highlight'}`;
    }
    if (precEl) {
      precEl.textContent = `${(gameState.voltagePrecision || 100).toFixed(1)}% (5.00V)`;
    }

    if (modal) modal.classList.remove('hidden');
  }


  // =========================================================================
  // 1C. COMPUTER TERMINAL & SESSION SHEET (Desk 03 - Network Department)
  // =========================================================================
  const sessionSheetClockNet = document.getElementById('sessionSheetClockNet');
  const inputOperatorNameNet = document.getElementById('inputOperatorNameNet');
  const btnPerformCheckInNet = document.getElementById('btnPerformCheckInNet');
  const btnPerformCheckOutNet = document.getElementById('btnPerformCheckOutNet');
  const sessionStatusBannerNet = document.getElementById('sessionStatusBannerNet');
  const sessionStatusLabelNet = document.getElementById('sessionStatusLabelNet');
  const sessionLogCheckinTimeNet = document.getElementById('sessionLogCheckinTimeNet');
  const sessionLogDurationNet = document.getElementById('sessionLogDurationNet');
  const diagNetCarrierLock = document.getElementById('diagNetCarrierLock');
  const diagNetFiberLoss = document.getElementById('diagNetFiberLoss');
  const diagNetDownlink = document.getElementById('diagNetDownlink');

  function updateSessionClockNet() {
    if (!sessionSheetClockNet) return;
    const now = new Date();
    const hh = String(now.getUTCHours()).padStart(2, '0');
    const mm = String(now.getUTCMinutes()).padStart(2, '0');
    const ss = String(now.getUTCSeconds()).padStart(2, '0');
    sessionSheetClockNet.value = `${hh}:${mm}:${ss} UTC`;
  }
  setInterval(updateSessionClockNet, 1000);
  updateSessionClockNet();

  function updateSessionSheetNetUI() {
    if (inputOperatorNameNet) inputOperatorNameNet.value = gameState.netOperatorName;

    // Check-In Concurrency Lock Enforcement
    const lock3 = stationLocks.network_desk_03;
    const isLocked3 = lock3 && lock3.lockedBy && lock3.lockedBy !== 'local' && lock3.lockedBy !== window.multiplayerManager?.socket?.id;
    if (isLocked3) {
      if (btnPerformCheckInNet) {
        btnPerformCheckInNet.disabled = true;
        btnPerformCheckInNet.classList.add('disabled');
        btnPerformCheckInNet.textContent = `OCCUPIED BY ${(lock3.playerName || 'ENGINEER').toUpperCase()}`;
      }
      if (inputOperatorNameNet) inputOperatorNameNet.disabled = true;
    } else if (!gameState.netCheckedIn && btnPerformCheckInNet) {
      btnPerformCheckInNet.disabled = false;
      btnPerformCheckInNet.classList.remove('disabled');
      btnPerformCheckInNet.textContent = 'CHECK IN';
      if (inputOperatorNameNet) inputOperatorNameNet.disabled = false;
    }

    if (gameState.netCheckedIn) {
      if (sessionStatusBannerNet) {
        sessionStatusBannerNet.classList.add('checked');
        const dot = sessionStatusBannerNet.querySelector('.status-indicator-dot');
        if (dot) {
          dot.classList.remove('not-checked');
          dot.classList.add('checked');
        }
      }
      if (sessionStatusLabelNet) sessionStatusLabelNet.textContent = 'STATUS: CHECKED IN (ACTIVE WORK SHIFT)';
      if (btnPerformCheckInNet) {
        btnPerformCheckInNet.disabled = true;
        btnPerformCheckInNet.classList.add('disabled');
      }
    } else if (!isLocked3) {
      if (sessionStatusBannerNet) {
        sessionStatusBannerNet.classList.remove('checked');
        const dot = sessionStatusBannerNet.querySelector('.status-indicator-dot');
        if (dot) {
          dot.classList.remove('checked');
          dot.classList.add('not-checked');
        }
      }
      if (sessionStatusLabelNet) sessionStatusLabelNet.textContent = 'STATUS: NOT CHECKED IN (PENDING AUTHORIZATION)';
      if (btnPerformCheckInNet) {
        btnPerformCheckInNet.disabled = false;
        btnPerformCheckInNet.classList.remove('disabled');
      }
    }

    // Telemetry Diagnostics Indicators
    const hgaDone = !!gameState.subtaskN01Complete;
    const fiberDone = !!gameState.subtaskN02Complete;

    if (diagNetCarrierLock) {
      if (hgaDone) {
        diagNetCarrierLock.textContent = 'LOCKED (TDRSS KU-BAND // 15.0 GHz)';
        diagNetCarrierLock.style.color = '#10b981';
      } else {
        diagNetCarrierLock.textContent = 'UNLOCKED (Δφ: 135° PHASE DRIFT)';
        diagNetCarrierLock.style.color = '#f59e0b';
      }
    }

    if (diagNetFiberLoss) {
      if (fiberDone) {
        diagNetFiberLoss.textContent = 'ATTENUATION: < 0.02 dB [EXCELLENT]';
        diagNetFiberLoss.style.color = '#10b981';
      } else {
        diagNetFiberLoss.textContent = 'ATTENUATION: SEVERED (CORE SPLICE REQ)';
        diagNetFiberLoss.style.color = '#ef4444';
      }
    }

    if (diagNetDownlink) {
      if (hgaDone && fiberDone) {
        diagNetDownlink.textContent = '4.096 Mbps [100% TELEMETRY LOCK]';
        diagNetDownlink.style.color = '#10b981';
      } else if (hgaDone) {
        diagNetDownlink.textContent = '1.024 Mbps [CARRIER LOCKED]';
        diagNetDownlink.style.color = '#38bdf8';
      } else if (fiberDone) {
        diagNetDownlink.textContent = '0.512 Mbps [FIBER BUS NOMINAL]';
        diagNetDownlink.style.color = '#38bdf8';
      } else {
        diagNetDownlink.textContent = '0.000 Mbps [STANDBY / DEGRADED]';
        diagNetDownlink.style.color = '#f59e0b';
      }
    }

    // Check-out Button Readiness
    if (btnPerformCheckOutNet) {
      const canCheckOut = gameState.netCheckedIn && hgaDone && fiberDone;
      btnPerformCheckOutNet.disabled = false;
      btnPerformCheckOutNet.classList.toggle('ready-pulse', canCheckOut);
      btnPerformCheckOutNet.classList.toggle('pending-look', !canCheckOut);
    }
  }

  if (btnPerformCheckInNet) {
    btnPerformCheckInNet.addEventListener('click', () => {
      playClick();
      playSuccessChime();

      gameState.netCheckedIn = true;
      if (inputOperatorNameNet && inputOperatorNameNet.value.trim()) {
        gameState.netOperatorName = inputOperatorNameNet.value.trim();
      }
      const hudOpEl = document.getElementById('hudOperatorNameDisplay');
      if (hudOpEl) hudOpEl.textContent = gameState.netOperatorName;
      gameState.netCheckInTimestamp = new Date();

      if (sessionLogCheckinTimeNet) {
        sessionLogCheckinTimeNet.innerHTML = `<span>Check-in Timestamp:</span> <span>${gameState.netCheckInTimestamp.toLocaleTimeString()} UTC</span>`;
      }

      if (gameState.netDurationInterval) clearInterval(gameState.netDurationInterval);
      gameState.netDurationInterval = setInterval(() => {
        if (!gameState.netCheckedIn || !gameState.netCheckInTimestamp) return;
        const diffMs = Date.now() - gameState.netCheckInTimestamp.getTime();
        const totalSec = Math.floor(diffMs / 1000);
        const hh = String(Math.floor(totalSec / 3600)).padStart(2, '0');
        const mm = String(Math.floor((totalSec % 3600) / 60)).padStart(2, '0');
        const ss = String(totalSec % 60).padStart(2, '0');
        if (sessionLogDurationNet) {
          sessionLogDurationNet.innerHTML = `<span>Active Working Duration:</span> <span>${hh}:${mm}:${ss}</span>`;
        }
      }, 1000);

      window.multiplayerManager?.syncStationLock('network_desk_03', true);
      stationLocks.network_desk_03 = { lockedBy: window.multiplayerManager?.socket?.id || 'local', playerName: gameState.netOperatorName };

      setDepartment('network');
      updateSessionSheetNetUI();
      updateMissionChecklistUI();
      showToast(`Welcome ${gameState.netOperatorName}. Network & Comm Department control authorized!`, '📡');
      autoSaveGame();
    });
  }

  if (btnPerformCheckOutNet) {
    btnPerformCheckOutNet.addEventListener('click', () => {
      playClick();
      if (!gameState.netCheckedIn) {
        showCenterCalmAlert("NOT CHECKED IN", "Click [CHECK IN & AUTHORIZE TERMINAL] to initiate your shift first.", "ℹ️");
        return;
      }
      if (!gameState.subtaskN01Complete || !gameState.subtaskN02Complete) {
        showCenterCalmAlert("TASKS INCOMPLETE", "Complete both [SUB-TSK-N-01] (HGA Realignment) and [SUB-TSK-N-02] (SI-C&DH Fiber Repair) before check-out.", "⚠️");
        return;
      }

      playCheckoutStamp();
      gameState.netCheckedIn = false;
      stationLocks.network_desk_03 = null;
      window.multiplayerManager?.syncStationLock('network_desk_03', false);
      if (gameState.netDurationInterval) clearInterval(gameState.netDurationInterval);
      updateSessionSheetNetUI();
      closeAllModals();
      showMissionAccomplishedDebriefNet();
      autoSaveGame();
    });
  }

  function showMissionAccomplishedDebriefNet() {
    playMissionAccomplished();
    const modal = document.getElementById('modalMissionAccomplishedNet');
    const opEl = document.getElementById('debriefOperatorNameNet');
    const durEl = document.getElementById('debriefDurationNet');
    const attEl = document.getElementById('debriefAttenuationNet');
    const rateEl = document.getElementById('debriefDataRateNet');

    if (opEl) opEl.textContent = gameState.netOperatorName;
    if (durEl && sessionLogDurationNet) {
      durEl.textContent = sessionLogDurationNet.querySelector('span:last-child')?.textContent || '00:06:45';
    }
    if (attEl) {
      attEl.textContent = '< 0.02 dB (GRADE A)';
    }
    if (rateEl) {
      rateEl.textContent = '4.096 Mbps (100% LOCK)';
    }

    if (modal) modal.classList.remove('hidden');
  }

  const btnDebriefExploreNet = document.getElementById('btnDebriefExploreNet');
  const btnDebriefMainMenuNet = document.getElementById('btnDebriefMainMenuNet');
  if (btnDebriefExploreNet) {
    btnDebriefExploreNet.addEventListener('click', () => {
      playClick();
      closeAllModals();
      showToast('Mission certified! Feel free to explore the cleanroom facility.', '🚀');
    });
  }
  if (btnDebriefMainMenuNet) {
    btnDebriefMainMenuNet.addEventListener('click', () => {
      playClick();
      closeAllModals();
      showScreen('menu');
      updateContinueButtonState();
    });
  }
  // =========================================================================
  // 2. LAPTOP MARKETPLACE & THE PLAYER'S FRAME (MAX 5 INSTRUMENTS)
  // =========================================================================
  const marketRemainingBudget = document.getElementById('marketRemainingBudget');
  const marketItemsGrid = document.getElementById('marketItemsGrid');
  const hudTopBudget = document.getElementById('hudTopBudget');
  const playerFrameSlots = document.getElementById('playerFrameSlots');
  const frameCountBadge = document.getElementById('frameCountBadge');
  const frameAlertBanner = document.getElementById('frameAlertBanner');

  // PHASE 02: SHARED MISSION BUDGET DISPLAY SYNCHRONIZER
  function updateBudgetDisplays() {
    const formatted = `$${Number(gameState.budget || 0).toLocaleString()}`;
    const hudTop = document.getElementById('hudTopBudget');
    if (hudTop) {
      hudTop.textContent = formatted;
      const curr = hudTop.previousElementSibling;
      if (curr && curr.classList.contains('hud-frame-currency')) {
        curr.style.display = 'none';
      }
    }
    const hudChip = document.getElementById('hudBudgetChip');
    if (hudChip) {
      hudChip.textContent = `BUDGET: ${formatted}`;
    }
    const debrief = document.getElementById('debriefBudget');
    if (debrief) {
      debrief.textContent = formatted;
    }
    const budgetEls = document.querySelectorAll('[id^="marketRemainingBudget"]');
    budgetEls.forEach(el => {
      el.textContent = formatted;
    });
    ['marketRemainingBudget', 'marketRemainingBudgetElec', 'marketRemainingBudgetNet'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.textContent = formatted;
    });
  }
  window.updateBudgetDisplays = updateBudgetDisplays;

  // PHASE 02: TIERED INSTRUMENTS (Level 1 = 5m, Level 2 = 15m, Level 3 = 35m)
  const TOOL_TIERS = {
    1: { level: 1, name: 'Level 01', subtitle: 'Economy', durationSec: 300, priceMultiplier: 0.40, label: 'LVL 1 [5m]' },
    2: { level: 2, name: 'Level 02', subtitle: 'Aerospace', durationSec: 900, priceMultiplier: 0.70, label: 'LVL 2 [15m]' },
    3: { level: 3, name: 'Level 03', subtitle: 'NASA Flight', durationSec: 2100, priceMultiplier: 1.00, label: 'LVL 3 [35m]' }
  };
  window.TOOL_TIERS = TOOL_TIERS;

  const selectedToolTiers = {}; // { [toolId]: 1 | 2 | 3 }

  function getToolTier(toolId) {
    return selectedToolTiers[toolId] || 1;
  }
  function setToolTier(toolId, tier) {
    selectedToolTiers[toolId] = tier;
  }
  window.getToolTier = getToolTier;
  window.setToolTier = setToolTier;

  function isEquippedByRemotePlayer(itemId) {
    if (!gameState || !gameState.roomEquippedTools) return false;
    const info = gameState.roomEquippedTools[itemId];
    if (!info || !info.equippedBy) return false;
    const localName = window.multiplayerManager?.localPlayerName || gameState.operatorName || 'LocalPlayer';
    if (info.equippedBy === localName || info.equippedBy === 'You') return false;
    if (info.expiresAt && info.expiresAt <= Date.now()) return false;
    return true;
  }
  window.isEquippedByRemotePlayer = isEquippedByRemotePlayer;

  function buildTierSelectorHtml(item, isPurchased, isEquippedByOther) {
    const curTier = getToolTier(item.id);
    return `
      <div class="tier-selector-group" data-item-id="${item.id}">
        ${[1, 2, 3].map(lvl => {
          const t = TOOL_TIERS[lvl];
          const p = calculateTierPrice(item.price, lvl);
          const activeClass = curTier === lvl ? 'active' : '';
          const disabledAttr = (isPurchased || isEquippedByOther) ? 'disabled' : '';
          return `
            <button type="button" class="tier-pill-btn ${activeClass}" data-tier="${lvl}" data-id="${item.id}" ${disabledAttr} title="${t.name} (${t.durationSec / 60}m) - $${p.toLocaleString()}">
              <span class="tier-lvl">${t.name}</span>
              <span class="tier-dur">${t.durationSec / 60}m</span>
              <span class="tier-cost">$${p.toLocaleString()}</span>
            </button>
          `;
        }).join('')}
      </div>
    `;
  }
  window.buildTierSelectorHtml = buildTierSelectorHtml;

  function calculateTierPrice(basePrice, tier) {
    const mult = TOOL_TIERS[tier]?.priceMultiplier || 1.0;
    return Math.round(basePrice * mult);
  }
  window.calculateTierPrice = calculateTierPrice;

  const marketCatalog = [
    {
      id: 'pgt',
      name: 'Pistol Grip Torque Wrench (PGT)',
      shortName: 'PGT Torque Wrench',
      keyLabel: 'p',
      category: 'tool',
      price: 18500,
      image: 'assets/images/image 2.png',
      desc: 'Precision computerized micro-torque driver with calibrated breakaway limiter for delicate flight bolts.'
    },
    {
      id: 'pins',
      name: 'Alignment Guide Pin Set',
      shortName: 'Alignment Pin',
      keyLabel: 'A',
      category: 'tool',
      price: 4200,
      image: 'assets/images/image 3.png',
      desc: 'High-tensile titanium alignment pins to guide canister insertion into Aft Shroud without rail damage.'
    },
    {
      id: 'gyro',
      name: 'RSU-02 Gyroscope Canister',
      shortName: 'Gyro Canister',
      keyLabel: 'G',
      category: 'part',
      price: 45000,
      image: 'assets/images/tool_gyro.svg',
      desc: 'Rate Sensing Unit containing dual high-inertia spinning rotors for telescope pointing.'
    },
    {
      id: 'hex',
      name: 'Drive Latch Hex Key (5mm)',
      shortName: 'Hex Key 5mm',
      keyLabel: 'H',
      category: 'tool',
      price: 2800,
      image: 'assets/images/tool_hex.svg',
      desc: 'Non-magnetic Beryllium-Copper aerospace hex driver for unlocking solar array drive shafts.'
    },
    {
      id: 'damper',
      name: 'Thermal Damper Clip & Lube',
      shortName: 'Damper Clip',
      keyLabel: 'D',
      category: 'tool',
      price: 6500,
      image: 'assets/images/tool_damper.svg',
      desc: 'Viscoelastic damping clip and space-rated grease to isolate solar panel thermal shock oscillations.'
    },
    {
      id: 'sadm',
      name: 'SADM Solar Drive Gear & Hinge',
      shortName: 'SADM Drive Gear',
      keyLabel: 'S',
      category: 'part',
      price: 38000,
      image: 'assets/images/tool_sadm.svg',
      desc: 'Motorized bi-stem drive mechanism that rotates the primary solar array wings to face the Sun.'
    }
  ];

  // --- Electronic Department (Desk 02) Flight Procurement Catalog ---
  const marketCatalogElec = [
    {
      id: 'wriststrap',
      name: 'Anti-Static ESD Grounding Wrist Strap',
      shortName: 'ESD Wrist Strap',
      keyLabel: '1',
      category: 'tool',
      price: 1500,
      image: 'assets/images/tool_wriststrap.svg',
      desc: 'Conductive wrist band with coiled wire and bench clamp. Prevents catastrophic electrostatic shock.'
    },
    {
      id: 'tweezers',
      name: 'Precision Wire Tweezers (Anti-Static)',
      shortName: 'Precision Tweezers',
      keyLabel: '2',
      category: 'tool',
      price: 1200,
      image: 'assets/images/tool_tweezers.svg',
      desc: 'Fine-point curved stainless tweezers for unlatching delicate gold ribbon cable locking tabs.'
    },
    {
      id: 'icextractor',
      name: 'Anti-Static IC Extractor / Board Puller',
      shortName: 'IC Extractor',
      keyLabel: '3',
      category: 'tool',
      price: 2800,
      image: 'assets/images/tool_icextractor.svg',
      desc: 'Insulated spring steel gripper designed to lift damaged circuit boards squarely without bending socket pins.'
    },
    {
      id: 'probes',
      name: 'Digital Multimeter Test Probes (Red/Black)',
      shortName: 'DMM Probes',
      keyLabel: '4',
      category: 'tool',
      price: 3500,
      image: 'assets/images/tool_probes.svg',
      desc: 'Pointed aerospace test leads for measuring precision voltage nodes across sensor test points.'
    },
    {
      id: 'screwdriver',
      name: 'Non-Conductive Ceramic Tuning Screwdriver',
      shortName: 'Tuning Tool',
      keyLabel: '5',
      category: 'tool',
      price: 1800,
      image: 'assets/images/tool_screwdriver.svg',
      desc: 'Polymer/ceramic trimmer tool that adjusts delicate potentiometers without introducing capacitive distortion.'
    },
    {
      id: 'ribbon',
      name: 'Kapton Gold Aerospace Data Ribbon Cable',
      shortName: 'Kapton Ribbon',
      keyLabel: 'R',
      category: 'part',
      price: 8500,
      image: 'assets/images/part_ribbon.svg',
      desc: 'Radiation-hardened high-speed data bus connecting DF-224 computer to telemetry processing units.'
    },
    {
      id: 'pcb',
      name: 'DF-224 Flight Computer Replacement PCB',
      shortName: 'Flight PCB',
      keyLabel: 'P',
      category: 'part',
      price: 32000,
      image: 'assets/images/part_pcb.svg',
      desc: 'Certified spaceflight printed circuit board assembly featuring gold-plated bus connectors and ceramic QFPs.'
    },
    {
      id: 'fgs',
      name: 'Fine Guidance Sensor Optical Electronic Box',
      shortName: 'FGS Sensor Box',
      keyLabel: 'F',
      category: 'part',
      price: 45000,
      image: 'assets/images/part_fgs.svg',
      desc: 'Precision interferometer guidance module housing voltage regulation nodes and signal telemetry channels.'
    }
  ];


  // --- Network Department (Desk 03) Flight Procurement Catalog ---
  const marketCatalogNet = [
    {
      id: 'rf_wrench',
      name: 'Pneumatic RF Torque Wrench (Coaxial Collar)',
      shortName: 'RF Torque Wrench',
      keyLabel: '1',
      category: 'tool',
      price: 4500,
      image: 'assets/images/tool_rf_wrench.svg',
      desc: 'Cordless power tool with digital torque read-out and specialized hollow crescent socket head for coaxial cables.'
    },
    {
      id: 'laser_sight',
      name: 'Laser Alignment Sight (Ruby Optics)',
      shortName: 'Laser Sight',
      keyLabel: '2',
      category: 'tool',
      price: 3200,
      image: 'assets/images/tool_laser_sight.svg',
      desc: 'Anodized silver cylinder with ruby laser emitter that snaps onto antenna feed horn for spatial targeting.'
    },
    {
      id: 'fiber_stripper',
      name: 'Precision Fiber Stripper & Cleaver Tool',
      shortName: 'Fiber Cleaver',
      keyLabel: '3',
      category: 'tool',
      price: 2800,
      image: 'assets/images/tool_fiber_stripper.svg',
      desc: 'Neon-yellow micro-stripper with integrated loupe lens and diamond blade for 90-degree flat core cleaving.'
    },
    {
      id: 'coupler',
      name: 'Gold-Plated RF Waveguide Coaxial Coupler',
      shortName: 'RF Waveguide Coupler',
      keyLabel: '4',
      category: 'part',
      price: 8500,
      image: 'assets/images/part_coupler.svg',
      desc: 'High-frequency gold-plated coaxial union block with hex fastening nuts for HGA transceiver feed.'
    },
    {
      id: 'splice_module',
      name: 'Fiber-Optic Fusion Splice Protection Modules',
      shortName: 'Splice Modules & Sleeves',
      keyLabel: '5',
      category: 'part',
      price: 5000,
      image: 'assets/images/part_splice_module.svg',
      desc: 'Radiation-hardened optical fiber splice sleeves with EVA thermal shrink tube and steel strength member.'
    }
  ];

  // --- THE PLAYER'S FRAME CONTROLLER ---
  function updatePlayerFrameUI() {
    updateBudgetDisplays();

    // Always sync ALL inventory caches with frame & purchases so workbenches never miss items
    marketCatalog.forEach(it => {
      gameState.inventory[it.id] = (gameState.playerFrame || []).includes(it.id) || !!gameState.purchased[it.id];
    });
    marketCatalogElec.forEach(it => {
      gameState.elecInventory[it.id] = (gameState.elecPlayerFrame || []).includes(it.id) || !!gameState.elecPurchased[it.id];
    });
    marketCatalogNet.forEach(it => {
      gameState.netInventory[it.id] = (gameState.netPlayerFrame || []).includes(it.id) || !!gameState.netPurchased[it.id];
    });

    // Update Player Frame department pills
    const pillMech = document.getElementById('pillFrameMech');
    const pillElec = document.getElementById('pillFrameElec');
    const pillNet = document.getElementById('pillFrameNet');
    const pillCountMech = document.getElementById('pillCountMech');
    const pillCountElec = document.getElementById('pillCountElec');
    const pillCountNet = document.getElementById('pillCountNet');
    const mechCount = (gameState.playerFrame || []).length;
    const elecCount = (gameState.elecPlayerFrame || []).length;
    const netCount = (gameState.netPlayerFrame || []).length;
    if (pillCountMech) pillCountMech.textContent = `[${mechCount}/5]`;
    if (pillCountElec) pillCountElec.textContent = `[${elecCount}/5]`;
    if (pillCountNet) pillCountNet.textContent = `[${netCount}/5]`;

    const isNet = gameState.activeDept === 'network';
    const isElec = gameState.activeDept === 'electronic';
    if (pillMech) pillMech.classList.toggle('active', !isNet && !isElec);
    if (pillElec) pillElec.classList.toggle('active', isElec);
    if (pillNet) pillNet.classList.toggle('active', isNet);

    // Sync Keycard Inventory Badge
    const keycardBadge = document.getElementById('hudKeycardBadge');
    if (keycardBadge) {
      if (gameState.hasKeycard) {
        keycardBadge.classList.remove('hidden');
        keycardBadge.style.display = 'flex';
      } else {
        keycardBadge.classList.add('hidden');
        keycardBadge.style.display = 'none';
      }
    }

    if (!playerFrameSlots) return;
    playerFrameSlots.innerHTML = '';

    let activeFrame = gameState.playerFrame || [];
    let activeCatalog = marketCatalog;
    let selectedIndex = gameState.selectedSlot;

    if (isNet) {
      activeFrame = gameState.netPlayerFrame || [];
      activeCatalog = marketCatalogNet;
      selectedIndex = gameState.netSelectedSlot;
    } else if (isElec) {
      activeFrame = gameState.elecPlayerFrame || [];
      activeCatalog = marketCatalogElec;
      selectedIndex = gameState.elecSelectedSlot;
    }

    if (activeFrame.length === 0) {
      const notice = document.createElement('div');
      notice.className = 'frame-empty-notice';
      notice.textContent = isNet ? 'NET FRAME: VISIT LAPTOP TO EQUIP TOOLS' : (isElec ? 'ELEC FRAME: VISIT LAPTOP TO EQUIP TOOLS' : 'MECH FRAME: VISIT LAPTOP TO EQUIP TOOLS');
      playerFrameSlots.appendChild(notice);
    }

    activeFrame.forEach((itemId, i) => {
      const item = activeCatalog.find(c => c.id === itemId);
      if (!item) return;

      const slotEl = document.createElement('div');
      slotEl.className = 'frame-slot-item';
      if (selectedIndex === i) {
        slotEl.classList.add('selected');
      }
      slotEl.setAttribute('data-slot', i);
      slotEl.setAttribute('data-id', item.id);
      slotEl.title = `${item.name} (Click or press [R] to drop)`;

      const timer = gameState.toolTimers && gameState.toolTimers[item.id];
      let timerHtml = '';
      let isDysfunctional = !!(gameState.toolDysfunctional && gameState.toolDysfunctional[item.id]);

      if (timer && timer.expiresAt) {
        const remSec = Math.max(0, Math.floor((timer.expiresAt - Date.now()) / 1000));
        const m = Math.floor(remSec / 60).toString().padStart(2, '0');
        const s = (remSec % 60).toString().padStart(2, '0');
        const pct = Math.max(0, Math.min(100, (remSec / (timer.durationSec || 300)) * 100));
        const barColor = remSec > 60 ? '#10b981' : (remSec > 15 ? '#f59e0b' : '#ef4444');
        if (remSec === 0) isDysfunctional = true;

        timerHtml = `
          <div class="frame-slot-timer ${remSec <= 30 && remSec > 0 ? 'critical-pulse' : ''} ${remSec === 0 ? 'expired' : ''}">
            <span class="timer-tier-tag">L${timer.tier || 1}</span>
            <span class="timer-countdown" id="timerCount_${item.id}">${remSec > 0 ? `${m}:${s}` : 'EXPIRED'}</span>
          </div>
          <div class="frame-slot-durability-track">
            <div class="frame-slot-durability-fill" id="timerFill_${item.id}" style="width: ${pct}%; background: ${barColor};"></div>
          </div>
        `;
      }

      if (isDysfunctional) {
        slotEl.classList.add('dysfunctional');
      }

      slotEl.innerHTML = `
        <img src="${item.image}" alt="${item.name}" class="slot-tool-img">
        <span class="slot-key-label">${item.keyLabel}</span>
        ${timerHtml}
      `;

      // Click on tool drops it
      slotEl.addEventListener('click', () => {
        if (isNet) {
          gameState.netSelectedSlot = i;
          dropInstrumentNet(item.id);
        } else if (isElec) {
          gameState.elecSelectedSlot = i;
          dropInstrumentElec(item.id);
        } else {
          gameState.selectedSlot = i;
          dropInstrument(item.id);
        }
      });

      playerFrameSlots.appendChild(slotEl);
    });
  }

  // --- DROP INSTRUMENT ACTION (MECH) ---
  function dropInstrument(itemId) {
    const idx = (gameState.playerFrame || []).indexOf(itemId);
    if (idx === -1) return;

    const item = marketCatalog.find(c => c.id === itemId);
    const itemName = item ? item.shortName : itemId;

    // Remove from frame
    gameState.playerFrame.splice(idx, 1);
    if (gameState.inventory) gameState.inventory[itemId] = false;

    // Remove from room lock & broadcast release
    if (gameState.roomEquippedTools && gameState.roomEquippedTools[itemId]) {
      delete gameState.roomEquippedTools[itemId];
    }
    if (window.multiplayerManager?.syncToolRelease) {
      window.multiplayerManager.syncToolRelease(itemId, 'mechanical');
    }

    // Adjust selected slot if needed
    if (gameState.selectedSlot >= gameState.playerFrame.length) {
      gameState.selectedSlot = Math.max(0, gameState.playerFrame.length - 1);
    }

    playRadioBeep(520, 0.12, 'sine');
    showToast(`Dropped ${itemName}. Available to EQUIP in Market.`, '📦');

    updatePlayerFrameUI();
    renderMarketplace();
    updateWorkbenchUI();
    autoSaveGame();
  }
  window.dropInstrument = dropInstrument;

  // --- DROP INSTRUMENT ACTION (ELEC) ---
  function dropInstrumentElec(itemId) {
    if (!gameState.elecPlayerFrame) gameState.elecPlayerFrame = [];
    const idx = gameState.elecPlayerFrame.indexOf(itemId);
    if (idx === -1) return;

    const item = marketCatalogElec.find(c => c.id === itemId);
    const itemName = item ? item.shortName : itemId;

    gameState.elecPlayerFrame.splice(idx, 1);
    if (gameState.elecInventory) gameState.elecInventory[itemId] = false;

    if (gameState.roomEquippedTools && gameState.roomEquippedTools[itemId]) {
      delete gameState.roomEquippedTools[itemId];
    }
    if (window.multiplayerManager?.syncToolRelease) {
      window.multiplayerManager.syncToolRelease(itemId, 'electronic');
    }

    if (gameState.elecSelectedSlot >= gameState.elecPlayerFrame.length) {
      gameState.elecSelectedSlot = Math.max(0, gameState.elecPlayerFrame.length - 1);
    }

    playRadioBeep(520, 0.12, 'sine');
    showToast(`Dropped ${itemName}. Available to EQUIP in Market.`, '📦');

    updatePlayerFrameUI();
    renderMarketplaceElec();
    updateElecWorkbenchUI();
    autoSaveGame();
  }
  window.dropInstrumentElec = dropInstrumentElec;

  // --- EQUIP INSTRUMENT ACTION (FROM MECH MARKET) ---
  function equipInstrument(itemId) {
    if (!gameState.playerFrame) gameState.playerFrame = [];
    if (gameState.playerFrame.length >= 5) {
      alert("Inventory frame full (maximum 5 instruments). Press [R] to drop an instrument first!");
      return;
    }

    if (!gameState.playerFrame.includes(itemId)) {
      gameState.playerFrame.push(itemId);
      if (!gameState.inventory) gameState.inventory = {};
      gameState.inventory[itemId] = true;
    }

    const timer = gameState.toolTimers && gameState.toolTimers[itemId];
    const remSec = timer && timer.expiresAt ? Math.max(0, Math.floor((timer.expiresAt - Date.now()) / 1000)) : 300;
    if (!gameState.roomEquippedTools) gameState.roomEquippedTools = {};
    gameState.roomEquippedTools[itemId] = {
      equippedBy: window.multiplayerManager?.localPlayerName || gameState.operatorName || 'You',
      tier: timer?.tier || 1,
      dept: 'mechanical',
      expiresAt: timer?.expiresAt || (Date.now() + remSec * 1000)
    };
    if (window.multiplayerManager?.syncToolPurchase) {
      window.multiplayerManager.syncToolPurchase(itemId, timer?.tier || 1, 0, remSec, 'mechanical', gameState.budget);
    }

    const item = marketCatalog.find(c => c.id === itemId);
    const itemName = item ? item.shortName : itemId;

    playSuccessChime();
    showToast(`Equipped ${itemName} to frame.`, '🎒');

    updatePlayerFrameUI();
    renderMarketplace();
    updateWorkbenchUI();
    autoSaveGame();
  }
  window.equipInstrument = equipInstrument;

  // --- EQUIP INSTRUMENT ACTION (FROM ELEC MARKET) ---
  function equipInstrumentElec(itemId) {
    if (!gameState.elecPlayerFrame) gameState.elecPlayerFrame = [];
    if (gameState.elecPlayerFrame.length >= 5) {
      alert("Inventory frame full (maximum 5 instruments). Press [R] to drop an instrument first!");
      return;
    }

    if (!gameState.elecPlayerFrame.includes(itemId)) {
      gameState.elecPlayerFrame.push(itemId);
      if (!gameState.elecInventory) gameState.elecInventory = {};
      gameState.elecInventory[itemId] = true;
    }

    const timer = gameState.toolTimers && gameState.toolTimers[itemId];
    const remSec = timer && timer.expiresAt ? Math.max(0, Math.floor((timer.expiresAt - Date.now()) / 1000)) : 300;
    if (!gameState.roomEquippedTools) gameState.roomEquippedTools = {};
    gameState.roomEquippedTools[itemId] = {
      equippedBy: window.multiplayerManager?.localPlayerName || gameState.operatorName || 'You',
      tier: timer?.tier || 1,
      dept: 'electronic',
      expiresAt: timer?.expiresAt || (Date.now() + remSec * 1000)
    };
    if (window.multiplayerManager?.syncToolPurchase) {
      window.multiplayerManager.syncToolPurchase(itemId, timer?.tier || 1, 0, remSec, 'electronic', gameState.budget);
    }

    const item = marketCatalogElec.find(c => c.id === itemId);
    const itemName = item ? item.shortName : itemId;

    playSuccessChime();
    showToast(`Equipped ${itemName} to frame.`, '🎒');

    updatePlayerFrameUI();
    renderMarketplaceElec();
    updateElecWorkbenchUI();
    autoSaveGame();
  }
  window.equipInstrumentElec = equipInstrumentElec;

  // --- BUY MARKET ITEM ACTION (MECH) ---
  function buyMarketItem(item) {
    if (isEquippedByRemotePlayer(item.id)) {
      const equippedInfo = gameState.roomEquippedTools[item.id];
      alert(`Requisition Locked: ${item.name} is already equipped by ${equippedInfo.equippedBy}.`);
      return;
    }

    const curTier = getToolTier(item.id);
    const tierPrice = calculateTierPrice(item.price, curTier);
    const durationSec = TOOL_TIERS[curTier].durationSec;

    if (gameState.budget < tierPrice) {
      alert(`Requisition Denied: Insufficient budget for ${item.name} (${TOOL_TIERS[curTier].name}). Price: $${tierPrice.toLocaleString()}, Remaining: $${gameState.budget.toLocaleString()}`);
      return;
    }

    playClick();
    playRadioBeep(980, 0.1, 'sine');

    gameState.budget -= tierPrice;
    gameState.purchased[item.id] = true;
    gameState.toolTimers[item.id] = {
      tier: curTier,
      durationSec: durationSec,
      expiresAt: Date.now() + durationSec * 1000,
      name: item.shortName || item.name,
      dept: 'mechanical'
    };
    if (gameState.toolDysfunctional) delete gameState.toolDysfunctional[item.id];

    if (!gameState.roomEquippedTools) gameState.roomEquippedTools = {};
    gameState.roomEquippedTools[item.id] = {
      equippedBy: window.multiplayerManager?.localPlayerName || gameState.operatorName || 'You',
      tier: curTier,
      dept: 'mechanical',
      expiresAt: Date.now() + durationSec * 1000
    };

    updateBudgetDisplays();

    if (window.multiplayerManager?.syncToolPurchase) {
      window.multiplayerManager.syncToolPurchase(item.id, curTier, tierPrice, durationSec, 'mechanical', gameState.budget);
    }
    if (window.multiplayerManager?.syncBudget) {
      window.multiplayerManager.syncBudget(gameState.budget, item, 'mechanical');
    }

    if (!gameState.playerFrame) gameState.playerFrame = [];
    if (!gameState.playerFrame.includes(item.id)) {
      if (gameState.playerFrame.length < 5) {
        gameState.playerFrame.push(item.id);
        if (!gameState.inventory) gameState.inventory = {};
        gameState.inventory[item.id] = true;
        showToast(`Acquired & equipped: ${item.shortName || item.name} (Level 0${curTier}) to frame.`, '📦');
      } else {
        showToast(`Acquired: ${item.shortName || item.name} (Level 0${curTier}). Frame is full (5/5) — use [R] to drop a tool to equip it.`, '⚠️');
      }
    } else {
      if (!gameState.inventory) gameState.inventory = {};
      gameState.inventory[item.id] = true;
      showToast(`Re-requisitioned & refreshed: ${item.shortName || item.name} (Level 0${curTier}).`, '⚡');
    }

    setDepartment('mechanical');
    renderMarketplace();
    updatePlayerFrameUI();
    updateWorkbenchUI();
    autoSaveGame();
  }
  window.buyMarketItem = buyMarketItem;

  // --- BUY MARKET ITEM ACTION (ELEC) ---
  function buyMarketItemElec(item) {
    if (isEquippedByRemotePlayer(item.id)) {
      const equippedInfo = gameState.roomEquippedTools[item.id];
      alert(`Requisition Locked: ${item.name} is already equipped by ${equippedInfo.equippedBy}.`);
      return;
    }

    const curTier = getToolTier(item.id);
    const tierPrice = calculateTierPrice(item.price, curTier);
    const durationSec = TOOL_TIERS[curTier].durationSec;

    if (gameState.budget < tierPrice) {
      alert(`Requisition Denied: Insufficient budget for ${item.name} (${TOOL_TIERS[curTier].name}). Price: $${tierPrice.toLocaleString()}, Remaining: $${gameState.budget.toLocaleString()}`);
      return;
    }

    playClick();
    playRadioBeep(980, 0.1, 'sine');

    gameState.budget -= tierPrice;
    if (!gameState.elecPurchased) gameState.elecPurchased = {};
    gameState.elecPurchased[item.id] = true;
    gameState.toolTimers[item.id] = {
      tier: curTier,
      durationSec: durationSec,
      expiresAt: Date.now() + durationSec * 1000,
      name: item.shortName || item.name,
      dept: 'electronic'
    };
    if (gameState.toolDysfunctional) delete gameState.toolDysfunctional[item.id];

    if (!gameState.roomEquippedTools) gameState.roomEquippedTools = {};
    gameState.roomEquippedTools[item.id] = {
      equippedBy: window.multiplayerManager?.localPlayerName || gameState.operatorName || 'You',
      tier: curTier,
      dept: 'electronic',
      expiresAt: Date.now() + durationSec * 1000
    };

    updateBudgetDisplays();

    if (window.multiplayerManager?.syncToolPurchase) {
      window.multiplayerManager.syncToolPurchase(item.id, curTier, tierPrice, durationSec, 'electronic', gameState.budget);
    }
    if (window.multiplayerManager?.syncBudget) {
      window.multiplayerManager.syncBudget(gameState.budget, item, 'electronic');
    }

    if (!gameState.elecPlayerFrame) gameState.elecPlayerFrame = [];
    if (!gameState.elecPlayerFrame.includes(item.id)) {
      if (gameState.elecPlayerFrame.length < 5) {
        gameState.elecPlayerFrame.push(item.id);
        if (!gameState.elecInventory) gameState.elecInventory = {};
        gameState.elecInventory[item.id] = true;
        showToast(`Acquired & equipped: ${item.shortName || item.name} (Level 0${curTier}) to frame.`, '📦');
      } else {
        showToast(`Acquired: ${item.shortName || item.name} (Level 0${curTier}). Frame is full (5/5) — use [R] to drop a tool to equip it.`, '⚠️');
      }
    } else {
      if (!gameState.elecInventory) gameState.elecInventory = {};
      gameState.elecInventory[item.id] = true;
      showToast(`Re-requisitioned & refreshed: ${item.shortName || item.name} (Level 0${curTier}).`, '⚡');
    }

    setDepartment('electronic');
    renderMarketplaceElec();
    updatePlayerFrameUI();
    updateElecWorkbenchUI();
    autoSaveGame();
  }
  window.buyMarketItemElec = buyMarketItemElec;

  // --- DROP INSTRUMENT ACTION (NET) ---
  function dropInstrumentNet(itemId) {
    if (!gameState.netPlayerFrame) gameState.netPlayerFrame = [];
    const idx = gameState.netPlayerFrame.indexOf(itemId);
    if (idx === -1) return;

    const item = marketCatalogNet.find(c => c.id === itemId);
    const itemName = item ? item.shortName : itemId;

    gameState.netPlayerFrame.splice(idx, 1);
    if (gameState.netInventory) gameState.netInventory[itemId] = false;

    if (gameState.roomEquippedTools && gameState.roomEquippedTools[itemId]) {
      delete gameState.roomEquippedTools[itemId];
    }
    if (window.multiplayerManager?.syncToolRelease) {
      window.multiplayerManager.syncToolRelease(itemId, 'network');
    }

    if (gameState.netSelectedSlot >= gameState.netPlayerFrame.length) {
      gameState.netSelectedSlot = Math.max(0, gameState.netPlayerFrame.length - 1);
    }

    playRadioBeep(520, 0.12, 'sine');
    showToast(`Dropped ${itemName}. Available to EQUIP in Market.`, '📦');

    updatePlayerFrameUI();
    renderMarketplaceNet();
    updateNetWorkbenchUI();
    autoSaveGame();
  }
  window.dropInstrumentNet = dropInstrumentNet;

  // --- EQUIP INSTRUMENT ACTION (FROM NET MARKET) ---
  function equipInstrumentNet(itemId) {
    if (!gameState.netPlayerFrame) gameState.netPlayerFrame = [];
    if (gameState.netPlayerFrame.length >= 5) {
      alert("Inventory frame full (maximum 5 instruments). Press [R] to drop an instrument first!");
      return;
    }

    if (!gameState.netPlayerFrame.includes(itemId)) {
      gameState.netPlayerFrame.push(itemId);
      if (!gameState.netInventory) gameState.netInventory = {};
      gameState.netInventory[itemId] = true;
    }

    const timer = gameState.toolTimers && gameState.toolTimers[itemId];
    const remSec = timer && timer.expiresAt ? Math.max(0, Math.floor((timer.expiresAt - Date.now()) / 1000)) : 300;
    if (!gameState.roomEquippedTools) gameState.roomEquippedTools = {};
    gameState.roomEquippedTools[itemId] = {
      equippedBy: window.multiplayerManager?.localPlayerName || gameState.operatorName || 'You',
      tier: timer?.tier || 1,
      dept: 'network',
      expiresAt: timer?.expiresAt || (Date.now() + remSec * 1000)
    };
    if (window.multiplayerManager?.syncToolPurchase) {
      window.multiplayerManager.syncToolPurchase(itemId, timer?.tier || 1, 0, remSec, 'network', gameState.budget);
    }

    const item = marketCatalogNet.find(c => c.id === itemId);
    const itemName = item ? item.shortName : itemId;

    playSuccessChime();
    showToast(`Equipped ${itemName} to frame.`, '🎒');

    updatePlayerFrameUI();
    renderMarketplaceNet();
    updateNetWorkbenchUI();
    autoSaveGame();
  }
  window.equipInstrumentNet = equipInstrumentNet;

  // --- BUY MARKET ITEM ACTION (NET) ---
  function buyMarketItemNet(item) {
    if (isEquippedByRemotePlayer(item.id)) {
      const equippedInfo = gameState.roomEquippedTools[item.id];
      alert(`Requisition Locked: ${item.name} is already equipped by ${equippedInfo.equippedBy}.`);
      return;
    }

    const curTier = getToolTier(item.id);
    const tierPrice = calculateTierPrice(item.price, curTier);
    const durationSec = TOOL_TIERS[curTier].durationSec;

    if (gameState.budget < tierPrice) {
      alert(`Requisition Denied: Insufficient budget for ${item.name} (${TOOL_TIERS[curTier].name}). Price: $${tierPrice.toLocaleString()}, Remaining: $${gameState.budget.toLocaleString()}`);
      return;
    }

    playClick();
    playRadioBeep(980, 0.1, 'sine');

    gameState.budget -= tierPrice;
    if (!gameState.netPurchased) gameState.netPurchased = {};
    gameState.netPurchased[item.id] = true;
    gameState.toolTimers[item.id] = {
      tier: curTier,
      durationSec: durationSec,
      expiresAt: Date.now() + durationSec * 1000,
      name: item.shortName || item.name,
      dept: 'network'
    };
    if (gameState.toolDysfunctional) delete gameState.toolDysfunctional[item.id];

    if (!gameState.roomEquippedTools) gameState.roomEquippedTools = {};
    gameState.roomEquippedTools[item.id] = {
      equippedBy: window.multiplayerManager?.localPlayerName || gameState.operatorName || 'You',
      tier: curTier,
      dept: 'network',
      expiresAt: Date.now() + durationSec * 1000
    };

    updateBudgetDisplays();

    if (window.multiplayerManager?.syncToolPurchase) {
      window.multiplayerManager.syncToolPurchase(item.id, curTier, tierPrice, durationSec, 'network', gameState.budget);
    }
    if (window.multiplayerManager?.syncBudget) {
      window.multiplayerManager.syncBudget(gameState.budget, item, 'network');
    }

    if (!gameState.netPlayerFrame) gameState.netPlayerFrame = [];
    if (!gameState.netPlayerFrame.includes(item.id)) {
      if (gameState.netPlayerFrame.length < 5) {
        gameState.netPlayerFrame.push(item.id);
        if (!gameState.netInventory) gameState.netInventory = {};
        gameState.netInventory[item.id] = true;
        showToast(`Acquired & equipped: ${item.shortName || item.name} (Level 0${curTier}) to frame.`, '📦');
      } else {
        showToast(`Acquired: ${item.shortName || item.name} (Level 0${curTier}). Frame is full (5/5) — use [R] to drop a tool to equip it.`, '⚠️');
      }
    } else {
      if (!gameState.netInventory) gameState.netInventory = {};
      gameState.netInventory[item.id] = true;
      showToast(`Re-requisitioned & refreshed: ${item.shortName || item.name} (Level 0${curTier}).`, '⚡');
    }

    setDepartment('network');
    renderMarketplaceNet();
    updatePlayerFrameUI();
    updateNetWorkbenchUI();
    autoSaveGame();
  }
  window.buyMarketItemNet = buyMarketItemNet;

  // --- RENDER MARKETPLACE (MECH) ---
  function renderMarketplace() {
    updateBudgetDisplays();

    if (!marketItemsGrid) return;
    marketItemsGrid.innerHTML = '';

    marketCatalog.forEach((item) => {
      const curTier = getToolTier(item.id);
      const tierPrice = calculateTierPrice(item.price, curTier);
      const equippedInfo = gameState.roomEquippedTools ? gameState.roomEquippedTools[item.id] : null;
      const isEquippedByOther = isEquippedByRemotePlayer(item.id);
      const isExpired = !!(gameState.toolDysfunctional && gameState.toolDysfunctional[item.id]);
      const rawPurchased = !!(gameState.purchased && gameState.purchased[item.id]);
      const isPurchased = rawPurchased && !isExpired;
      const isEquipped = (gameState.playerFrame || []).includes(item.id) && !isExpired;

      const card = document.createElement('div');
      card.className = `market-item-card ${isPurchased ? 'item-acquired' : ''}`;
      card.classList.add('market-item-card');
      if (isPurchased) card.classList.add('item-acquired');
      card.setAttribute('data-tool-id', item.id);

      let buttonHtml = '';
      if (isEquippedByOther) {
        buttonHtml = `
          <button class="btn-buy-item locked" disabled title="Equipped by ${equippedInfo.equippedBy}">
            Instrument Equipped already
          </button>
        `;
      } else if (isExpired) {
        buttonHtml = `
          <button class="btn-buy-item btn-re-requisition" data-action="buy" data-id="${item.id}">
            RE-REQUISITION [-$${tierPrice.toLocaleString()}]
          </button>
        `;
      } else if (!isPurchased) {
        buttonHtml = `
          <button class="btn-buy-item" data-action="buy" data-id="${item.id}">
            REQUISITION [-$${tierPrice.toLocaleString()}]
          </button>
        `;
      } else if (isEquipped) {
        buttonHtml = `
          <div class="market-equipped-group">
            <span class="market-equipped-tag">EQUIPPED (IN FRAME)</span>
            <button class="btn-drop-market" data-action="drop" data-id="${item.id}" title="Drop this tool [R]">
              DROP [R]
            </button>
          </div>
        `;
      } else {
        buttonHtml = `
          <button class="btn-buy-item btn-equip-item" data-action="equip" data-id="${item.id}">
            EQUIP TO FRAME
          </button>
        `;
      }

      const timer = gameState.toolTimers && gameState.toolTimers[item.id];
      let timerHtml = '';
      if (timer && timer.expiresAt && !isEquippedByOther) {
        const remSec = Math.max(0, Math.floor((timer.expiresAt - Date.now()) / 1000));
        const m = Math.floor(remSec / 60).toString().padStart(2, '0');
        const s = (remSec % 60).toString().padStart(2, '0');
        const timeStr = remSec > 0 ? `${m}:${s}` : 'EXPIRED';
        const pct = Math.max(0, Math.min(100, (remSec / (timer.durationSec || 300)) * 100));
        const barColor = remSec > 60 ? '#10b981' : (remSec > 15 ? '#f59e0b' : '#ef4444');
        timerHtml = `
          <div class="card-durability-row ${remSec <= 30 && remSec > 0 ? 'critical-pulse' : ''} ${remSec === 0 ? 'expired' : ''}" id="cardTimerWrap_${item.id}">
            <span class="card-timer-badge">EXPIRY: <strong id="cardTimerCount_${item.id}">${timeStr}</strong></span>
            <div class="card-durability-track">
              <div class="card-durability-fill" id="cardTimerFill_${item.id}" style="width: ${pct}%; background: ${barColor};"></div>
            </div>
          </div>
        `;
      } else if (isEquippedByOther && equippedInfo && equippedInfo.expiresAt) {
        const remSec = Math.max(0, Math.floor((equippedInfo.expiresAt - Date.now()) / 1000));
        const m = Math.floor(remSec / 60).toString().padStart(2, '0');
        const s = (remSec % 60).toString().padStart(2, '0');
        const timeStr = remSec > 0 ? `${m}:${s}` : 'EXPIRED';
        const pct = Math.max(0, Math.min(100, (remSec / ((TOOL_TIERS[equippedInfo.tier]?.durationSec) || 300)) * 100));
        timerHtml = `
          <div class="card-durability-row" id="cardTimerWrap_${item.id}">
            <span class="card-timer-badge">[${equippedInfo.equippedBy}]: <strong id="cardTimerCount_${item.id}">${timeStr}</strong></span>
            <div class="card-durability-track">
              <div class="card-durability-fill" id="cardTimerFill_${item.id}" style="width: ${pct}%; background: #64748b;"></div>
            </div>
          </div>
        `;
      } else {
        timerHtml = `
          <div class="card-durability-row" id="cardTimerWrap_${item.id}" style="display: none;">
            <span class="card-timer-badge">EXPIRY: <strong id="cardTimerCount_${item.id}">--:--</strong></span>
            <div class="card-durability-track">
              <div class="card-durability-fill" id="cardTimerFill_${item.id}" style="width: 100%;"></div>
            </div>
          </div>
        `;
      }

      let priceLabel = `$${tierPrice.toLocaleString()}`;
      if (isEquippedByOther) {
        priceLabel = `LOCKED (${equippedInfo.equippedBy})`;
      } else if (isExpired) {
        priceLabel = 'EXPIRED';
      } else if (isPurchased) {
        priceLabel = 'OWNED';
      }

      card.innerHTML = `
        <div style="display: flex; gap: 14px; align-items: flex-start;">
          <img src="${item.image}" alt="${item.name}" style="width: 48px; height: 64px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); margin-top: 4px;">
          <div style="flex: 1; min-width: 0;">
            <div class="item-badge-row">
              <span class="item-category-tag ${item.category}">${item.category.toUpperCase()}</span>
              <span class="item-price ${isExpired ? 'expired-text' : ''}">${priceLabel}</span>
            </div>
            <h4 class="item-name">${item.name}</h4>
            <p class="item-desc">${item.desc}</p>
            ${buildTierSelectorHtml(item, isPurchased, isEquippedByOther)}
            ${timerHtml}
          </div>
        </div>
        ${buttonHtml}
      `;

      card.querySelectorAll('.tier-pill-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const tier = parseInt(btn.getAttribute('data-tier'), 10);
          setToolTier(item.id, tier);
          card.querySelectorAll('.tier-pill-btn').forEach(b => {
            b.classList.toggle('active', parseInt(b.getAttribute('data-tier'), 10) === tier);
          });
          const newPrice = calculateTierPrice(item.price, tier);
          const buyBtn = card.querySelector('[data-action="buy"]');
          if (buyBtn && !buyBtn.disabled) {
            buyBtn.textContent = isExpired
              ? `RE-REQUISITION [-$${newPrice.toLocaleString()}]`
              : `REQUISITION [-$${newPrice.toLocaleString()}]`;
          }
          const priceSpan = card.querySelector('.item-price');
          if (priceSpan && !isPurchased && !isEquippedByOther) {
            priceSpan.textContent = isExpired ? 'EXPIRED' : `$${newPrice.toLocaleString()}`;
          }
        });
      });

      const btnBuy = card.querySelector('[data-action="buy"]');
      if (btnBuy) {
        btnBuy.addEventListener('click', () => buyMarketItem(item));
      }

      const btnEquip = card.querySelector('[data-action="equip"]');
      if (btnEquip) {
        btnEquip.addEventListener('click', () => equipInstrument(item.id));
      }

      const btnDrop = card.querySelector('[data-action="drop"]');
      if (btnDrop) {
        btnDrop.addEventListener('click', () => dropInstrument(item.id));
      }

      marketItemsGrid.appendChild(card);
    });
  }
  window.renderMarketplace = renderMarketplace;

  // --- RENDER MARKETPLACE (ELEC) ---
  const marketItemsGridElec = document.getElementById('marketItemsGridElec');
  const requiredElecTools = ['wriststrap', 'tweezers', 'icextractor', 'probes', 'screwdriver', 'pcb', 'ribbon'];

  function renderMarketplaceElec() {
    updateBudgetDisplays();

    const elecReqCount = document.getElementById('elecReqCount');
    if (elecReqCount) {
      const acquiredCount = requiredElecTools.filter(id => {
        const isExp = !!(gameState.toolDysfunctional && gameState.toolDysfunctional[id]);
        return window.hasPurchasedTool(id) && !isExp;
      }).length;
      elecReqCount.textContent = `${acquiredCount} / ${requiredElecTools.length} REQUIRED ACQUIRED`;
      if (acquiredCount === requiredElecTools.length) {
        elecReqCount.classList.add('complete');
      } else {
        elecReqCount.classList.remove('complete');
      }
    }

    if (!marketItemsGridElec) return;
    marketItemsGridElec.innerHTML = '';

    marketCatalogElec.forEach((item) => {
      const curTier = getToolTier(item.id);
      const tierPrice = calculateTierPrice(item.price, curTier);
      const equippedInfo = gameState.roomEquippedTools ? gameState.roomEquippedTools[item.id] : null;
      const isEquippedByOther = isEquippedByRemotePlayer(item.id);
      const isExpired = !!(gameState.toolDysfunctional && gameState.toolDysfunctional[item.id]);
      const rawPurchased = !!gameState.elecPurchased?.[item.id] || window.hasPurchasedTool(item.id);
      const isPurchased = rawPurchased && !isExpired;
      const isEquipped = (gameState.elecPlayerFrame || []).includes(item.id) && !isExpired;
      const isRequired = requiredElecTools.includes(item.id);

      const card = document.createElement('div');
      card.className = `market-item-card ${isRequired ? 'required-flight-item' : 'optional-flight-item'} ${isPurchased ? 'item-acquired' : ''}`;
      card.classList.add('market-item-card', isRequired ? 'required-flight-item' : 'optional-flight-item');
      if (isPurchased) card.classList.add('item-acquired');
      card.setAttribute('data-tool-id', item.id);

      let buttonHtml = '';
      if (isEquippedByOther) {
        buttonHtml = `
          <button class="btn-buy-item locked" disabled title="Equipped by ${equippedInfo.equippedBy}">
            Instrument Equipped already
          </button>
        `;
      } else if (isExpired) {
        buttonHtml = `
          <button class="btn-buy-item btn-re-requisition" data-action="buy" data-id="${item.id}">
            RE-REQUISITION [-$${tierPrice.toLocaleString()}]
          </button>
        `;
      } else if (!isPurchased) {
        buttonHtml = `
          <button class="btn-buy-item" data-action="buy" data-id="${item.id}">
            REQUISITION [-$${tierPrice.toLocaleString()}]
          </button>
        `;
      } else if (isEquipped) {
        buttonHtml = `
          <div class="market-equipped-group">
            <span class="market-equipped-tag">EQUIPPED (IN FRAME)</span>
            <button class="btn-drop-market" data-action="drop" data-id="${item.id}" title="Drop this tool [R]">
              DROP [R]
            </button>
          </div>
        `;
      } else {
        buttonHtml = `
          <button class="btn-buy-item btn-equip-item" data-action="equip" data-id="${item.id}">
            EQUIP TO FRAME
          </button>
        `;
      }

      const timer = gameState.toolTimers && gameState.toolTimers[item.id];
      let timerHtml = '';
      if (timer && timer.expiresAt && !isEquippedByOther) {
        const remSec = Math.max(0, Math.floor((timer.expiresAt - Date.now()) / 1000));
        const m = Math.floor(remSec / 60).toString().padStart(2, '0');
        const s = (remSec % 60).toString().padStart(2, '0');
        const timeStr = remSec > 0 ? `${m}:${s}` : 'EXPIRED';
        const pct = Math.max(0, Math.min(100, (remSec / (timer.durationSec || 300)) * 100));
        const barColor = remSec > 60 ? '#10b981' : (remSec > 15 ? '#f59e0b' : '#ef4444');
        timerHtml = `
          <div class="card-durability-row ${remSec <= 30 && remSec > 0 ? 'critical-pulse' : ''} ${remSec === 0 ? 'expired' : ''}" id="cardTimerWrap_${item.id}">
            <span class="card-timer-badge">EXPIRY: <strong id="cardTimerCount_${item.id}">${timeStr}</strong></span>
            <div class="card-durability-track">
              <div class="card-durability-fill" id="cardTimerFill_${item.id}" style="width: ${pct}%; background: ${barColor};"></div>
            </div>
          </div>
        `;
      } else if (isEquippedByOther && equippedInfo && equippedInfo.expiresAt) {
        const remSec = Math.max(0, Math.floor((equippedInfo.expiresAt - Date.now()) / 1000));
        const m = Math.floor(remSec / 60).toString().padStart(2, '0');
        const s = (remSec % 60).toString().padStart(2, '0');
        const timeStr = remSec > 0 ? `${m}:${s}` : 'EXPIRED';
        const pct = Math.max(0, Math.min(100, (remSec / ((TOOL_TIERS[equippedInfo.tier]?.durationSec) || 300)) * 100));
        timerHtml = `
          <div class="card-durability-row" id="cardTimerWrap_${item.id}">
            <span class="card-timer-badge">[${equippedInfo.equippedBy}]: <strong id="cardTimerCount_${item.id}">${timeStr}</strong></span>
            <div class="card-durability-track">
              <div class="card-durability-fill" id="cardTimerFill_${item.id}" style="width: ${pct}%; background: #64748b;"></div>
            </div>
          </div>
        `;
      } else {
        timerHtml = `
          <div class="card-durability-row" id="cardTimerWrap_${item.id}" style="display: none;">
            <span class="card-timer-badge">EXPIRY: <strong id="cardTimerCount_${item.id}">--:--</strong></span>
            <div class="card-durability-track">
              <div class="card-durability-fill" id="cardTimerFill_${item.id}" style="width: 100%;"></div>
            </div>
          </div>
        `;
      }

      let priceLabel = `$${tierPrice.toLocaleString()}`;
      if (isEquippedByOther) {
        priceLabel = `LOCKED (${equippedInfo.equippedBy})`;
      } else if (isExpired) {
        priceLabel = 'EXPIRED';
      } else if (isPurchased) {
        priceLabel = 'OWNED';
      }

      const reqBadgeHtml = isRequired
        ? (isPurchased ? '<span class="flight-req-badge acquired">ACQUIRED ✓</span>' : '<span class="flight-req-badge">REQUIRED FOR FLIGHT</span>')
        : '<span class="flight-optional-badge">OPTIONAL</span>';

      card.innerHTML = `
        <div style="display: flex; gap: 14px; align-items: flex-start;">
          <img src="${item.image}" alt="${item.name}" style="width: 48px; height: 64px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); margin-top: 4px;">
          <div style="flex: 1; min-width: 0;">
            <div class="item-badge-row" style="flex-wrap: wrap; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="item-category-tag ${item.category}">${item.category.toUpperCase()}</span>
                ${reqBadgeHtml}
              </div>
              <span class="item-price ${isExpired ? 'expired-text' : ''}">${priceLabel}</span>
            </div>
            <h4 class="item-name">${item.name}</h4>
            <p class="item-desc">${item.desc}</p>
            ${buildTierSelectorHtml(item, isPurchased, isEquippedByOther)}
            ${timerHtml}
          </div>
        </div>
        ${buttonHtml}
      `;

      card.querySelectorAll('.tier-pill-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const tier = parseInt(btn.getAttribute('data-tier'), 10);
          setToolTier(item.id, tier);
          card.querySelectorAll('.tier-pill-btn').forEach(b => {
            b.classList.toggle('active', parseInt(b.getAttribute('data-tier'), 10) === tier);
          });
          const newPrice = calculateTierPrice(item.price, tier);
          const buyBtn = card.querySelector('[data-action="buy"]');
          if (buyBtn && !buyBtn.disabled) {
            buyBtn.textContent = isExpired
              ? `RE-REQUISITION [-$${newPrice.toLocaleString()}]`
              : `REQUISITION [-$${newPrice.toLocaleString()}]`;
          }
          const priceSpan = card.querySelector('.item-price');
          if (priceSpan && !isPurchased && !isEquippedByOther) {
            priceSpan.textContent = isExpired ? 'EXPIRED' : `$${newPrice.toLocaleString()}`;
          }
        });
      });

      const btnBuy = card.querySelector('[data-action="buy"]');
      if (btnBuy) btnBuy.addEventListener('click', () => buyMarketItemElec(item));

      const btnEquip = card.querySelector('[data-action="equip"]');
      if (btnEquip) btnEquip.addEventListener('click', () => equipInstrumentElec(item.id));

      const btnDrop = card.querySelector('[data-action="drop"]');
      if (btnDrop) btnDrop.addEventListener('click', () => dropInstrumentElec(item.id));

      marketItemsGridElec.appendChild(card);
    });
  }
  window.renderMarketplaceElec = renderMarketplaceElec;

  // --- RENDER MARKETPLACE (NET) ---
  const marketCatalogGridNet = document.getElementById('marketCatalogGridNet');
  const requiredNetTools = ['rf_wrench', 'laser_sight', 'fiber_stripper', 'coupler', 'splice_module'];

  function renderMarketplaceNet() {
    updateBudgetDisplays();

    const netReqCount = document.getElementById('netReqCount');
    if (netReqCount) {
      const acquiredCount = requiredNetTools.filter(id => {
        const isExp = !!(gameState.toolDysfunctional && gameState.toolDysfunctional[id]);
        return window.hasPurchasedTool(id) && !isExp;
      }).length;
      netReqCount.textContent = `${acquiredCount} / ${requiredNetTools.length} REQUIRED ACQUIRED`;
      if (acquiredCount === requiredNetTools.length) {
        netReqCount.classList.add('complete');
      } else {
        netReqCount.classList.remove('complete');
      }
    }

    if (!marketCatalogGridNet) return;
    marketCatalogGridNet.innerHTML = '';

    marketCatalogNet.forEach((item) => {
      const curTier = getToolTier(item.id);
      const tierPrice = calculateTierPrice(item.price, curTier);
      const equippedInfo = gameState.roomEquippedTools ? gameState.roomEquippedTools[item.id] : null;
      const isEquippedByOther = isEquippedByRemotePlayer(item.id);
      const isExpired = !!(gameState.toolDysfunctional && gameState.toolDysfunctional[item.id]);
      const rawPurchased = !!gameState.netPurchased?.[item.id] || window.hasPurchasedTool(item.id);
      const isPurchased = rawPurchased && !isExpired;
      const isEquipped = (gameState.netPlayerFrame || []).includes(item.id) && !isExpired;
      const isRequired = requiredNetTools.includes(item.id);

      const card = document.createElement('div');
      card.className = `market-item-card ${isRequired ? 'required-flight-item' : 'optional-flight-item'} ${isPurchased ? 'item-acquired' : ''}`;
      card.classList.add('market-item-card', isRequired ? 'required-flight-item' : 'optional-flight-item');
      if (isPurchased) card.classList.add('item-acquired');
      card.setAttribute('data-tool-id', item.id);

      let buttonHtml = '';
      if (isEquippedByOther) {
        buttonHtml = `
          <button class="btn-buy-item locked" disabled title="Equipped by ${equippedInfo.equippedBy}">
            Instrument Equipped already
          </button>
        `;
      } else if (isExpired) {
        buttonHtml = `
          <button class="btn-buy-item btn-re-requisition" data-action="buy" data-id="${item.id}">
            RE-REQUISITION [-$${tierPrice.toLocaleString()}]
          </button>
        `;
      } else if (!isPurchased) {
        buttonHtml = `
          <button class="btn-buy-item" data-action="buy" data-id="${item.id}">
            REQUISITION [-$${tierPrice.toLocaleString()}]
          </button>
        `;
      } else if (isEquipped) {
        buttonHtml = `
          <div class="market-equipped-group">
            <span class="market-equipped-tag">EQUIPPED (IN FRAME)</span>
            <button class="btn-drop-market" data-action="drop" data-id="${item.id}" title="Drop this tool [R]">
              DROP [R]
            </button>
          </div>
        `;
      } else {
        buttonHtml = `
          <button class="btn-buy-item btn-equip-item" data-action="equip" data-id="${item.id}">
            EQUIP TO FRAME
          </button>
        `;
      }

      const timer = gameState.toolTimers && gameState.toolTimers[item.id];
      let timerHtml = '';
      if (timer && timer.expiresAt && !isEquippedByOther) {
        const remSec = Math.max(0, Math.floor((timer.expiresAt - Date.now()) / 1000));
        const m = Math.floor(remSec / 60).toString().padStart(2, '0');
        const s = (remSec % 60).toString().padStart(2, '0');
        const timeStr = remSec > 0 ? `${m}:${s}` : 'EXPIRED';
        const pct = Math.max(0, Math.min(100, (remSec / (timer.durationSec || 300)) * 100));
        const barColor = remSec > 60 ? '#10b981' : (remSec > 15 ? '#f59e0b' : '#ef4444');
        timerHtml = `
          <div class="card-durability-row ${remSec <= 30 && remSec > 0 ? 'critical-pulse' : ''} ${remSec === 0 ? 'expired' : ''}" id="cardTimerWrap_${item.id}">
            <span class="card-timer-badge">EXPIRY: <strong id="cardTimerCount_${item.id}">${timeStr}</strong></span>
            <div class="card-durability-track">
              <div class="card-durability-fill" id="cardTimerFill_${item.id}" style="width: ${pct}%; background: ${barColor};"></div>
            </div>
          </div>
        `;
      } else if (isEquippedByOther && equippedInfo && equippedInfo.expiresAt) {
        const remSec = Math.max(0, Math.floor((equippedInfo.expiresAt - Date.now()) / 1000));
        const m = Math.floor(remSec / 60).toString().padStart(2, '0');
        const s = (remSec % 60).toString().padStart(2, '0');
        const timeStr = remSec > 0 ? `${m}:${s}` : 'EXPIRED';
        const pct = Math.max(0, Math.min(100, (remSec / ((TOOL_TIERS[equippedInfo.tier]?.durationSec) || 300)) * 100));
        timerHtml = `
          <div class="card-durability-row" id="cardTimerWrap_${item.id}">
            <span class="card-timer-badge">[${equippedInfo.equippedBy}]: <strong id="cardTimerCount_${item.id}">${timeStr}</strong></span>
            <div class="card-durability-track">
              <div class="card-durability-fill" id="cardTimerFill_${item.id}" style="width: ${pct}%; background: #64748b;"></div>
            </div>
          </div>
        `;
      } else {
        timerHtml = `
          <div class="card-durability-row" id="cardTimerWrap_${item.id}" style="display: none;">
            <span class="card-timer-badge">EXPIRY: <strong id="cardTimerCount_${item.id}">--:--</strong></span>
            <div class="card-durability-track">
              <div class="card-durability-fill" id="cardTimerFill_${item.id}" style="width: 100%;"></div>
            </div>
          </div>
        `;
      }

      let priceLabel = `$${tierPrice.toLocaleString()}`;
      if (isEquippedByOther) {
        priceLabel = `LOCKED (${equippedInfo.equippedBy})`;
      } else if (isExpired) {
        priceLabel = 'EXPIRED';
      } else if (isPurchased) {
        priceLabel = 'OWNED';
      }

      const reqBadgeHtml = isRequired
        ? (isPurchased ? '<span class="flight-req-badge acquired">ACQUIRED ✓</span>' : '<span class="flight-req-badge">REQUIRED FOR FLIGHT</span>')
        : '<span class="flight-optional-badge">OPTIONAL</span>';

      card.innerHTML = `
        <div style="display: flex; gap: 14px; align-items: flex-start;">
          <img src="${item.image}" alt="${item.name}" style="width: 48px; height: 64px; object-fit: contain; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.5)); margin-top: 4px;">
          <div style="flex: 1; min-width: 0;">
            <div class="item-badge-row" style="flex-wrap: wrap; gap: 6px;">
              <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                <span class="item-category-tag ${item.category}">${item.category.toUpperCase()}</span>
                ${reqBadgeHtml}
              </div>
              <span class="item-price ${isExpired ? 'expired-text' : ''}">${priceLabel}</span>
            </div>
            <h4 class="item-name">${item.name}</h4>
            <p class="item-desc">${item.desc}</p>
            ${buildTierSelectorHtml(item, isPurchased, isEquippedByOther)}
            ${timerHtml}
          </div>
        </div>
        ${buttonHtml}
      `;

      card.querySelectorAll('.tier-pill-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const tier = parseInt(btn.getAttribute('data-tier'), 10);
          setToolTier(item.id, tier);
          card.querySelectorAll('.tier-pill-btn').forEach(b => {
            b.classList.toggle('active', parseInt(b.getAttribute('data-tier'), 10) === tier);
          });
          const newPrice = calculateTierPrice(item.price, tier);
          const buyBtn = card.querySelector('[data-action="buy"]');
          if (buyBtn && !buyBtn.disabled) {
            buyBtn.textContent = isExpired
              ? `RE-REQUISITION [-$${newPrice.toLocaleString()}]`
              : `REQUISITION [-$${newPrice.toLocaleString()}]`;
          }
          const priceSpan = card.querySelector('.item-price');
          if (priceSpan && !isPurchased && !isEquippedByOther) {
            priceSpan.textContent = isExpired ? 'EXPIRED' : `$${newPrice.toLocaleString()}`;
          }
        });
      });

      const btnBuy = card.querySelector('[data-action="buy"]');
      if (btnBuy) btnBuy.addEventListener('click', () => buyMarketItemNet(item));

      const btnEquip = card.querySelector('[data-action="equip"]');
      if (btnEquip) btnEquip.addEventListener('click', () => equipInstrumentNet(item.id));

      const btnDrop = card.querySelector('[data-action="drop"]');
      if (btnDrop) btnDrop.addEventListener('click', () => dropInstrumentNet(item.id));

      marketCatalogGridNet.appendChild(card);
    });
  }
  window.renderMarketplaceNet = renderMarketplaceNet;

  // =========================================================================
  // 3. RESEARCH & ASSEMBLY PAPERS (Technical Memorandum)
  // =========================================================================
  // Desk 01 (Mechanical Department)
  const paperTabs = document.querySelectorAll('#modalResearchPapers .paper-tab');
  const paperPages = document.querySelectorAll('#modalResearchPapers .paper-page');

  paperTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      playClick();
      paperTabs.forEach(t => t.classList.remove('active'));
      paperPages.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetPage = document.getElementById(targetId);
      if (targetPage) targetPage.classList.add('active');

      gameState.papersChecked = true;
      updateMissionChecklistUI();
      autoSaveGame();
    });
  });

  // Desk 02 (Electronic Department)
  const paperTabsElec = document.querySelectorAll('#modalResearchPapersElec .paper-tab');
  const paperPagesElec = document.querySelectorAll('#modalResearchPapersElec .paper-page');

  paperTabsElec.forEach((tab) => {
    tab.addEventListener('click', () => {
      playClick();
      paperTabsElec.forEach(t => t.classList.remove('active'));
      paperPagesElec.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetPage = document.getElementById(targetId);
      if (targetPage) targetPage.classList.add('active');

      gameState.elecPapersChecked = true;
      updateMissionChecklistUI();
      autoSaveGame();
    });
  });


  // Desk 03 (Network & Communication Department)
  const paperTabsNet = document.querySelectorAll('#modalResearchPapersNet .paper-tab');
  const paperPagesNet = document.querySelectorAll('#modalResearchPapersNet .paper-page');

  paperTabsNet.forEach((tab) => {
    tab.addEventListener('click', () => {
      playClick();
      paperTabsNet.forEach(t => t.classList.remove('active'));
      paperPagesNet.forEach(p => p.classList.remove('active'));

      tab.classList.add('active');
      const targetId = tab.getAttribute('data-tab');
      const targetPage = document.getElementById(targetId);
      if (targetPage) targetPage.classList.add('active');

      gameState.netPapersChecked = true;
      updateMissionChecklistUI();
      autoSaveGame();
    });
  });

  // =========================================================================
  // 4. ASSEMBLY WORKBENCH INTERACTION & 3D CALIBRATION
  // =========================================================================
  function initOrResizeWorkbench3D() {
    const container = document.getElementById('wb3dCanvasContainer');
    if (!container) return;

    if (!workbench3DInstance && window.Workbench3D) {
      workbench3DInstance = new window.Workbench3D('wb3dCanvasContainer', {
        onComplete: () => {
          gameState.subtask01Complete = true;
          updateMissionChecklistUI();
          updateWorkbenchUI();

          if (subtaskCard01) {
            subtaskCard01.classList.remove('active');
            subtaskCard01.classList.add('done');
          }
          if (subtaskPill01) subtaskPill01.textContent = 'COMPLETED';

          showToast('SUBTASK 01 COMPLETE: RSU-02 Gyroscope Mounted and Torqued to 30 N·m!', '🚀');
          if (gameState.subtask01Complete && gameState.subtask02Complete) {
            triggerAssemblyPasscodeIssuance('mech');
          }
          autoSaveGame();
        }
      });
      if (lastSavedWb3dState && workbench3DInstance.restoreState) {
        workbench3DInstance.restoreState(lastSavedWb3dState);
      }
    } else if (workbench3DInstance) {
      if (lastSavedWb3dState && workbench3DInstance.restoreState) {
        workbench3DInstance.restoreState(lastSavedWb3dState);
      }
      setTimeout(() => workbench3DInstance.onResize(), 60);
    }
  }

  function initOrResizeSadm3D() {
    const container = document.getElementById('wb3dCanvasContainerSadm');
    if (!container) return;

    if (!sadm3DInstance && window.Sadm3D) {
      sadm3DInstance = new window.Sadm3D('wb3dCanvasContainerSadm', {
        onComplete: () => {
          gameState.subtask02Complete = true;
          gameState.damperInstalled = true;
          updateMissionChecklistUI();
          updateWorkbenchUI();

          if (subtaskCard02) {
            subtaskCard02.classList.remove('active');
            subtaskCard02.classList.add('done');
          }
          if (subtaskPill02) subtaskPill02.textContent = 'COMPLETED';

          showToast('TASK 02 COMPLETE: Solar Array Drive Serviced, Damped, and Synchronized!', '☀️');
          if (gameState.subtask01Complete && gameState.subtask02Complete) {
            triggerAssemblyPasscodeIssuance('mech');
          }
          autoSaveGame();
        }
      });
      if (lastSavedSadmState && sadm3DInstance.restoreState) {
        sadm3DInstance.restoreState(lastSavedSadmState);
      }
    } else if (sadm3DInstance) {
      if (lastSavedSadmState && sadm3DInstance.restoreState) {
        sadm3DInstance.restoreState(lastSavedSadmState);
      }
      setTimeout(() => sadm3DInstance.onResize(), 60);
    }
  }

  // Workbench Navigation Tabs
  const tabSubtask01 = document.getElementById('tabSubtask01');
  const tabSubtask02 = document.getElementById('tabSubtask02');
  const wbViewSubtask01 = document.getElementById('wbViewSubtask01');
  const wbViewSubtask02 = document.getElementById('wbViewSubtask02');

  if (tabSubtask01 && tabSubtask02 && wbViewSubtask01 && wbViewSubtask02) {
    tabSubtask01.addEventListener('click', () => {
      playClick();
      if (sadm3DInstance && sadm3DInstance.stopServoHum) {
        sadm3DInstance.stopServoHum();
      }
      tabSubtask01.classList.add('active');
      tabSubtask02.classList.remove('active');
      wbViewSubtask01.classList.remove('hidden');
      wbViewSubtask02.classList.add('hidden');
      initOrResizeWorkbench3D();
    });

    tabSubtask02.addEventListener('click', () => {
      playClick();
      if (!gameState.subtask01Complete) {
        showCenterCalmAlert("SEQUENCE PROTOCOL", "Complete Sub-Task 01 (RSU-02 Gyroscope Assembly) before servicing Solar Array Drive.", "⚙️");
        return;
      }
      tabSubtask02.classList.add('active');
      tabSubtask01.classList.remove('active');
      wbViewSubtask02.classList.remove('hidden');
      wbViewSubtask01.classList.add('hidden');
      initOrResizeSadm3D();
      setTimeout(() => {
        if (sadm3DInstance && typeof sadm3DInstance.onResize === 'function') {
          sadm3DInstance.onResize();
        }
      }, 60);
    });
  }

  const gyroPartStatus = document.getElementById('gyroPartStatus');
  const wbGyroOverallDot = document.getElementById('wbGyroOverallDot');
  const reqGyroPart = document.getElementById('reqGyroPart');
  const reqPGTTool = document.getElementById('reqPGTTool');
  const reqGuidePins = document.getElementById('reqGuidePins');

  const sadmPartStatus = document.getElementById('sadmPartStatus');
  const wbSadmOverallDot = document.getElementById('wbSadmOverallDot');
  const reqSadmPart = document.getElementById('reqSadmPart');
  const reqHexKey = document.getElementById('reqHexKey');
  const reqDamperClip = document.getElementById('reqDamperClip');
  const damperClipStatusTxt = document.getElementById('damperClipStatusTxt');
  const btnInstallDamper = document.getElementById('btnInstallDamper');
  const btnServiceSadm = document.getElementById('btnServiceSadm');

  function updateWorkbenchUI() {
    if (tabSubtask02) {
      if (!gameState.subtask01Complete) {
        tabSubtask02.classList.add('locked');
        tabSubtask02.title = "LOCKED: Complete Subtask 01 (Gyroscope) first";
      } else {
        tabSubtask02.classList.remove('locked');
        tabSubtask02.title = "";
      }
    }

    // 1. Gyro Requirements Tags in Footer
    const hasGyro = window.hasPurchasedTool('gyro');
    const hasPGT = window.hasPurchasedTool('pgt');
    const hasPins = window.hasPurchasedTool('pins');

    if (reqGyroPart) reqGyroPart.classList.toggle('ready', hasGyro);
    if (reqPGTTool) reqPGTTool.classList.toggle('ready', hasPGT);
    if (reqGuidePins) reqGuidePins.classList.toggle('ready', hasPins);

    if (gyroPartStatus) {
      if (gameState.subtask01Complete) {
        gyroPartStatus.textContent = 'MOUNTED & TORQUED TO 30 N·m [DONE]';
        gyroPartStatus.style.color = '#10b981';
        if (wbGyroOverallDot) wbGyroOverallDot.style.background = '#10b981';
      } else {
        gyroPartStatus.textContent = '3D PRECISION ASSEMBLY BAY ACTIVE';
        gyroPartStatus.style.color = '#38bdf8';
        if (wbGyroOverallDot) wbGyroOverallDot.style.background = '#38bdf8';
      }
    }

    // 2. SADM Requirements Tags in Footer
    const hasSadm = window.hasPurchasedTool('sadm');
    const hasHex = window.hasPurchasedTool('hex');
    const hasDamper = window.hasPurchasedTool('damper');

    if (reqSadmPart) reqSadmPart.classList.toggle('ready', hasSadm);
    if (reqHexKey) reqHexKey.classList.toggle('ready', hasHex);
    if (reqDamperClip) reqDamperClip.classList.toggle('ready', hasDamper);

    if (sadmPartStatus) {
      if (gameState.subtask02Complete) {
        sadmPartStatus.textContent = 'LATCHED, DAMPED & CALIBRATED [DONE]';
        sadmPartStatus.style.color = '#10b981';
        if (wbSadmOverallDot) wbSadmOverallDot.style.background = '#10b981';
      } else {
        sadmPartStatus.textContent = '3D SOLAR DRIVE STATION ACTIVE';
        sadmPartStatus.style.color = '#38bdf8';
        if (wbSadmOverallDot) wbSadmOverallDot.style.background = '#38bdf8';
      }
    }

    updateReqItem(reqSadmPart, hasSadm);
    updateReqItem(reqHexKey, hasHex);
    updateReqItem(reqDamperClip, hasDamper);

    if (btnInstallDamper) {
      btnInstallDamper.disabled = !hasDamper || gameState.damperInstalled || gameState.subtask02Complete;
    }

    if (damperClipStatusTxt) {
      damperClipStatusTxt.textContent = gameState.damperInstalled ? 'Damper Clip: INSTALLED & LUBRICATED' : 'Damper Clip: NOT INSTALLED';
      damperClipStatusTxt.style.color = gameState.damperInstalled ? '#10b981' : '#f59e0b';
    }

    if (btnServiceSadm) {
      const eligible = hasSadm && hasHex && gameState.damperInstalled && !gameState.subtask02Complete;
      btnServiceSadm.disabled = !eligible;
      if (gameState.subtask02Complete) {
        btnServiceSadm.textContent = 'SERVICED & LATCHED [COMPLETED]';
        btnServiceSadm.classList.add('assembled');
      }
    }
  }

  function updateReqItem(el, hasItem) {
    if (!el) return;
    const valEl = el.querySelector('.req-val');
    if (valEl) {
      valEl.textContent = hasItem ? 'Present' : 'Missing';
      valEl.className = `req-val ${hasItem ? 'ok' : 'missing'}`;
    }
  }

  if (btnInstallDamper) {
    btnInstallDamper.addEventListener('click', () => {
      playClick();
      playRadioBeep(750, 0.15, 'sine');
      gameState.damperInstalled = true;
      updateWorkbenchUI();
      showToast('Thermal Damper Clip successfully installed over SADM hinge.', '🔧');
    });
  }

  if (btnServiceSadm) {
    btnServiceSadm.addEventListener('click', () => {
      playClick();
      playSuccessChime();

      gameState.subtask02Complete = true;
      updateWorkbenchUI();

      // Update Subtask 02 Card on HUD
      if (subtaskCard02) {
        subtaskCard02.classList.remove('active');
        subtaskCard02.classList.add('done');
      }
      if (subtaskPill02) subtaskPill02.textContent = 'COMPLETED';

      showToast('SUBTASK 02 COMPLETE: Solar Array Drive Mechanism Serviced & Latched!', '🌟');
      if (gameState.subtask01Complete && gameState.subtask02Complete) {
        triggerAssemblyPasscodeIssuance('mech');
      }
      updateMissionChecklistUI();
    });
  }

  // =========================================================================
  // 4B. ELECTRONICS WORKBENCH INTERACTION & 3D CALIBRATION (DESK 02)
  // =========================================================================
  function initOrResizeElectronicsWorkbench3D() {
    const container = document.getElementById('wb3dCanvasContainerElec');
    if (!container) return;

    if (!electronicsWorkbenchInstance && window.ElectronicsWorkbench3D) {
      electronicsWorkbenchInstance = new window.ElectronicsWorkbench3D('wb3dCanvasContainerElec', {
        initialTask: 'subtask01',
        onCompleteTask01: () => {
          gameState.subtaskE01Complete = true;
          updateMissionChecklistUI();
          updateElecWorkbenchUI();
          showToast('SUBTASK E-01 COMPLETE: DF-224 Flight PCB Seated & Ribbon Locked!', '⚡');
          autoSaveGame();
          if (tabSubtaskE01 && tabSubtaskE02) {
            tabSubtaskE01.classList.remove('active');
            tabSubtaskE02.classList.add('active');
            if (electronicsWorkbenchInstance) {
              electronicsWorkbenchInstance.setTaskView('subtask02');
            }
          }
        },
        onCompleteTask02: () => {
          gameState.subtaskE02Complete = true;
          updateMissionChecklistUI();
          updateElecWorkbenchUI();
          showToast('SUBTASK E-02 COMPLETE: FGS Voltage Tuned to 5.0V & Waveform Locked!', '📡');
          if (gameState.subtaskE01Complete && gameState.subtaskE02Complete) {
            triggerAssemblyPasscodeIssuance('elec');
          }
          autoSaveGame();
        },
        onBreakerOn: () => {
          gameState.breakerMasterOn = true;
          updateMissionChecklistUI();
          updateSessionSheetElecUI();
          showToast('MASTER CIRCUIT BREAKER ENERGIZED: Return to Computer for Telemetry Check-Out!', '⚡');
          autoSaveGame();
        },
        onShock: (incidents) => {
          gameState.staticShockIncidents = incidents;
          autoSaveGame();
        }
      });
      if (lastSavedElectronicsWbState && electronicsWorkbenchInstance.restoreState) {
        electronicsWorkbenchInstance.restoreState(lastSavedElectronicsWbState);
      }
    } else if (electronicsWorkbenchInstance) {
      if (lastSavedElectronicsWbState && electronicsWorkbenchInstance.restoreState) {
        electronicsWorkbenchInstance.restoreState(lastSavedElectronicsWbState);
      }
      setTimeout(() => electronicsWorkbenchInstance.onResize(), 60);
    }
  }

  // Workbench Navigation Tabs for Desk 02
  const tabSubtaskE01 = document.getElementById('tabSubtaskE01');
  const tabSubtaskE02 = document.getElementById('tabSubtaskE02');

  if (tabSubtaskE01 && tabSubtaskE02) {
    tabSubtaskE01.addEventListener('click', () => {
      playClick();
      tabSubtaskE01.classList.add('active');
      tabSubtaskE02.classList.remove('active');
      if (electronicsWorkbenchInstance) {
        electronicsWorkbenchInstance.setTaskView('subtask01');
      }
    });

    tabSubtaskE02.addEventListener('click', () => {
      playClick();
      if (!gameState.subtaskE01Complete) {
        showCenterCalmAlert("SEQUENCE PROTOCOL", "Complete Subtask [SUB-TSK-E-01] (DF-224 Computer Repair) before FGS Sensor Calibration.", "⚠️");
        return;
      }
      tabSubtaskE02.classList.add('active');
      tabSubtaskE01.classList.remove('active');
      if (electronicsWorkbenchInstance) {
        electronicsWorkbenchInstance.setTaskView('subtask02');
      }
    });
  }

  const wbElecOverallDot = document.getElementById('wbElecOverallDot');
  const elecPartStatus = document.getElementById('elecPartStatus');
  const reqWristStrap = document.getElementById('reqWristStrap');
  const reqTweezers = document.getElementById('reqTweezers');
  const reqIcExtractor = document.getElementById('reqIcExtractor');
  const reqProbes = document.getElementById('reqProbes');
  const reqScrewdriver = document.getElementById('reqScrewdriver');
  const reqPcbPart = document.getElementById('reqPcbPart');
  const reqRibbonPart = document.getElementById('reqRibbonPart');

  function updateElecWorkbenchUI() {
    const hasWrist = window.hasPurchasedTool('wriststrap');
    const hasTweezers = window.hasPurchasedTool('tweezers');
    const hasExtractor = window.hasPurchasedTool('icextractor');
    const hasProbes = window.hasPurchasedTool('probes');
    const hasScrewdriver = window.hasPurchasedTool('screwdriver');
    const hasPcb = window.hasPurchasedTool('pcb');
    const hasRibbon = window.hasPurchasedTool('ribbon');

    if (reqWristStrap) reqWristStrap.classList.toggle('ready', hasWrist);
    if (reqTweezers) reqTweezers.classList.toggle('ready', hasTweezers);
    if (reqIcExtractor) reqIcExtractor.classList.toggle('ready', hasExtractor);
    if (reqProbes) reqProbes.classList.toggle('ready', hasProbes);
    if (reqScrewdriver) reqScrewdriver.classList.toggle('ready', hasScrewdriver);
    if (reqPcbPart) reqPcbPart.classList.toggle('ready', hasPcb);
    if (reqRibbonPart) reqRibbonPart.classList.toggle('ready', hasRibbon);

    const elecErrMsg = document.getElementById('wbElecLowerErrorMsg');
    let elecStatusTxt = '';
    let elecStatusColor = '#38bdf8';

    if (gameState.subtaskE01Complete && gameState.subtaskE02Complete) {
      const breakerOn = gameState.breakerMasterOn || (electronicsWorkbenchInstance && electronicsWorkbenchInstance.breakerMasterOn);
      if (breakerOn) {
        elecStatusTxt = 'ALL REPAIRS VERIFIED & ENERGIZED [PROCEED TO CHECK-OUT]';
        elecStatusColor = '#10b981';
      } else {
        elecStatusTxt = 'HARDWARE NOMINAL: ENERGIZE MASTER CIRCUIT BREAKER';
        elecStatusColor = '#f59e0b';
      }
    } else if (gameState.subtaskE01Complete) {
      elecStatusTxt = '[SUB-TSK-E-02] FGS SENSOR CALIBRATION ACTIVE';
      elecStatusColor = '#38bdf8';
    } else {
      elecStatusTxt = '[SUB-TSK-E-01] DF-224 COMPUTER REPAIR ACTIVE';
      elecStatusColor = '#38bdf8';
    }

    if (elecPartStatus) {
      elecPartStatus.textContent = elecStatusTxt;
      elecPartStatus.style.color = elecStatusColor;
      if (wbElecOverallDot) wbElecOverallDot.style.background = elecStatusColor;
    }
    if (elecErrMsg) {
      elecErrMsg.textContent = elecStatusTxt;
      elecErrMsg.style.color = elecStatusColor;
    }
  }

  const btnWbElecRestart = document.getElementById('btnWbElecRestart');
  const btnWbElecQuit = document.getElementById('btnWbElecQuit');
  if (btnWbElecRestart) {
    btnWbElecRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      playClick();
      showConfirmation(
        'RESTART MISSION FROM SCRATCH? All saved progress, inventory, and telemetry will be reset. Budget restores to $150,000.00.',
        () => {
          performFullMissionRestart();
        }
      );
    });
  }
  if (btnWbElecQuit) {
    btnWbElecQuit.addEventListener('click', (e) => {
      e.stopPropagation();
      performQuitToMenu();
    });
  }



  function initOrResizeNetworkWorkbench3D() {
    const container = document.getElementById('wb3dCanvasContainerNet');
    if (!container) return;

    if (!networkWorkbenchInstance && window.NetworkWorkbench3D) {
      networkWorkbenchInstance = new window.NetworkWorkbench3D('wb3dCanvasContainerNet', {
        initialTask: 'subtask01',
        onCompleteTask01: () => {
          gameState.subtaskN01Complete = true;
          updateMissionChecklistUI();
          updateNetWorkbenchUI();
          updateSessionSheetNetUI();
          showToast('SUBTASK N-01 COMPLETE: HGA Coupler Replaced & Gimbal Aligned!', '📡');
          autoSaveGame();
          if (tabSubtaskN01 && tabSubtaskN02) {
            tabSubtaskN01.classList.remove('active');
            tabSubtaskN02.classList.add('active');
            if (networkWorkbenchInstance) {
              networkWorkbenchInstance.setTaskView('subtask02');
            }
          }
        },
        onCompleteTask02: () => {
          gameState.subtaskN02Complete = true;
          updateMissionChecklistUI();
          updateNetWorkbenchUI();
          updateSessionSheetNetUI();
          showToast('SUBTASK N-02 COMPLETE: SI-C&DH Fiber Core Spliced & Protected!', '🔬');
          if (gameState.subtaskN01Complete && gameState.subtaskN02Complete) {
            triggerAssemblyPasscodeIssuance('net');
          }
          autoSaveGame();
        }
      });
      if (lastSavedNetworkWbState && networkWorkbenchInstance.restoreState) {
        networkWorkbenchInstance.restoreState(lastSavedNetworkWbState);
      }
    } else if (networkWorkbenchInstance) {
      if (lastSavedNetworkWbState && networkWorkbenchInstance.restoreState) {
        networkWorkbenchInstance.restoreState(lastSavedNetworkWbState);
      }
      setTimeout(() => networkWorkbenchInstance.resize(), 60);
    }
  }


  // Workbench Navigation Tabs for Desk 03 (Network Department)
  const tabSubtaskN01 = document.getElementById('tabSubtaskN01');
  const tabSubtaskN02 = document.getElementById('tabSubtaskN02');

  if (tabSubtaskN01 && tabSubtaskN02) {
    tabSubtaskN01.addEventListener('click', () => {
      playClick();
      tabSubtaskN01.classList.add('active');
      tabSubtaskN02.classList.remove('active');
      if (networkWorkbenchInstance) {
        networkWorkbenchInstance.setTaskView('subtask01');
      }
    });

    tabSubtaskN02.addEventListener('click', () => {
      playClick();
      if (!gameState.subtaskN01Complete) {
        showCenterCalmAlert("SEQUENCE PROTOCOL", "Complete Subtask [SUB-TSK-N-01] (HGA Realignment) before SI-C&DH Fiber Bus Splicing.", "⚠️");
        return;
      }
      tabSubtaskN02.classList.add('active');
      tabSubtaskN01.classList.remove('active');
      if (networkWorkbenchInstance) {
        networkWorkbenchInstance.setTaskView('subtask02');
      }
    });
  }

  const reqRfWrench = document.getElementById('reqRfWrench');
  const reqLaserSight = document.getElementById('reqLaserSight');
  const reqFiberStripper = document.getElementById('reqFiberStripper');
  const reqRfCoupler = document.getElementById('reqRfCoupler');
  const reqSpliceModule = document.getElementById('reqSpliceModule');
  function updateNetWorkbenchUI() {
    const hasWrench = window.hasPurchasedTool('rf_wrench');
    const hasLaser = window.hasPurchasedTool('laser_sight');
    const hasStripper = window.hasPurchasedTool('fiber_stripper');
    const hasCoupler = window.hasPurchasedTool('coupler');
    const hasSplice = window.hasPurchasedTool('splice_module');

    if (reqRfWrench) reqRfWrench.classList.toggle('ready', hasWrench);
    if (reqLaserSight) reqLaserSight.classList.toggle('ready', hasLaser);
    if (reqFiberStripper) reqFiberStripper.classList.toggle('ready', hasStripper);
    if (reqRfCoupler) reqRfCoupler.classList.toggle('ready', hasCoupler);
    if (reqSpliceModule) reqSpliceModule.classList.toggle('ready', hasSplice);

    const wbNetOverallDot = document.getElementById('wbNetOverallDot');
    const netPartStatus = document.getElementById('netPartStatus');

    const netErrMsg = document.getElementById('wbNetLowerErrorMsg');
    let netStatusTxt = '';
    let netStatusColor = '#f59e0b';

    if (gameState.subtaskN01Complete && gameState.subtaskN02Complete) {
      netStatusTxt = 'ALL REPAIRS VERIFIED // TELEMETRY LOCKED [PROCEED TO CHECK-OUT]';
      netStatusColor = '#10b981';
    } else if (gameState.subtaskN01Complete) {
      netStatusTxt = '[SUB-TSK-N-02] SI-C&DH FIBER CORE SPLICING IN PROGRESS';
      netStatusColor = '#38bdf8';
    } else {
      netStatusTxt = '[SUB-TSK-N-01] HGA GIMBAL REALIGNMENT & COAXIAL COUPLER SWAP';
      netStatusColor = '#f59e0b';
    }

    if (netPartStatus) {
      netPartStatus.textContent = netStatusTxt;
      netPartStatus.style.color = netStatusColor;
      if (wbNetOverallDot) wbNetOverallDot.style.background = netStatusColor;
    }
    if (netErrMsg) {
      netErrMsg.textContent = netStatusTxt;
      netErrMsg.style.color = netStatusColor;
    }
  }

  const btnWbNetRestart = document.getElementById('btnWbNetRestart');
  const btnWbNetQuit = document.getElementById('btnWbNetQuit');
  if (btnWbNetRestart) {
    btnWbNetRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      performFullMissionRestart();
    });
  }
  if (btnWbNetQuit) {
    btnWbNetQuit.addEventListener('click', (e) => {
      e.stopPropagation();
      performQuitToMenu();
    });
  }

  // --- Mission Checklist Syncer ---
  const chkCheckIn = document.getElementById('chkCheckIn');
  const chkCheckInIcon = document.getElementById('chkCheckInIcon');
  const chkAssembleReport = document.getElementById('chkAssembleReport');
  const chkReportIcon = document.getElementById('chkReportIcon');
  const chkGyroAssembly = document.getElementById('chkGyroAssembly');
  const chkGyroIcon = document.getElementById('chkGyroIcon');
  const chkSadmAssembly = document.getElementById('chkSadmAssembly');
  const chkSadmIcon = document.getElementById('chkSadmIcon');
  const btnFacilitySettings = document.getElementById('btnFacilitySettings');
  const btnToggleCameraView = document.getElementById('btnToggleCameraView');
  if (btnToggleCameraView) {
    btnToggleCameraView.addEventListener('click', () => {
      playClick();
      const activeRoom = window.lobbyRoomInstance || facilityRoomInstance;
      if (activeRoom && typeof activeRoom.toggleCameraMode === 'function') {
        activeRoom.toggleCameraMode();
      }
    });
  }

  const btnFacilityRestart = document.getElementById('btnFacilityRestart');
  const btnFacilityQuit = document.getElementById('btnFacilityQuit');
  const btnWbRestart = document.getElementById('btnWbRestart');
  const btnWbQuit = document.getElementById('btnWbQuit');
  const btnSettingsRestartMission = document.getElementById('btnSettingsRestartMission');
  const btnSettingsQuitMenu = document.getElementById('btnSettingsQuitMenu');

  if (btnFacilitySettings) {
    btnFacilitySettings.addEventListener('click', () => {
      playClick();
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
      captureBaselineSettings();
      showScreen('settings');
    });
  }

  function performFullMissionRestart() {
    playClick();

    // 1. Clear saved progress in localStorage
    try {
      localStorage.removeItem(SAVE_KEY);
    } catch (e) {
      console.warn('Auto-save clearance error:', e);
    }

    // 2. Clear state variables
    resetGameState();

    // 3. Reset 3D interactive bay instances if active
    if (workbench3DInstance) {
      try { workbench3DInstance.destroy(); } catch (e) {}
      workbench3DInstance = null;
    }
    if (sadm3DInstance) {
      try { sadm3DInstance.destroy(); } catch (e) {}
      sadm3DInstance = null;
    }
    if (electronicsWorkbenchInstance) {
      try { electronicsWorkbenchInstance.destroy(); } catch (e) {}
      electronicsWorkbenchInstance = null;
    }

    // 4. Reset Facility 3D room player coordinates and telemetry visuals
    if (facilityRoomInstance) {
      if (facilityRoomInstance.player) {
        facilityRoomInstance.player.pos.set(0, 1.7, 2.4);
        facilityRoomInstance.player.yaw = 0;
        facilityRoomInstance.player.pitch = 0;
      }
      if (facilityRoomInstance.camera) {
        facilityRoomInstance.camera.position.set(0, 1.7, 2.4);
        facilityRoomInstance.camera.rotation.set(0, 0, 0);
      }
      if (typeof facilityRoomInstance.updateMissionVisuals === 'function') {
        facilityRoomInstance.updateMissionVisuals(gameState);
      }
    }

    // 5. Close any open overlays or modals
    closeAllModals();

    // 6. Reset HUD indicators & frames
    const hudTopBudget = document.getElementById('hudTopBudget');
    if (hudTopBudget) hudTopBudget.textContent = '150000.00';
    const marketRemainingBudget = document.getElementById('marketRemainingBudget');
    if (marketRemainingBudget) marketRemainingBudget.textContent = '$150,000';
    const marketRemainingBudgetElec = document.getElementById('marketRemainingBudgetElec');
    if (marketRemainingBudgetElec) marketRemainingBudgetElec.textContent = '$150,000';
    const marketRemainingBudgetNet = document.getElementById('marketRemainingBudgetNet');
    if (marketRemainingBudgetNet) marketRemainingBudgetNet.textContent = '$150,000';

    setDepartment('electronic');
    updatePlayerFrameUI();
    updateMissionChecklistUI();
    updateSessionSheetUI();
    updateSessionSheetElecUI();
    updateSessionSheetNetUI();
    renderMarketplace();
    renderMarketplaceElec();
    renderMarketplaceNet();
    updateWorkbenchUI();
    updateElecWorkbenchUI();
    updateNetWorkbenchUI();
    updateContinueButtonState();

    // Reset comms dialogue sequencer
    commsStep = 0;
    commsActive = false;

    // Reset task badges on HUD
    if (hudMainTaskCard) hudMainTaskCard.classList.remove('completed');
    if (mainTaskStatusBadge) {
      mainTaskStatusBadge.textContent = 'PENDING CHECK-IN';
      mainTaskStatusBadge.classList.remove('completed');
      mainTaskStatusBadge.classList.add('pending');
    }
    if (mainTaskHint) {
      mainTaskHint.textContent = 'Walk to Desk 02 and check in on the Computer to begin.';
    }
    if (subtaskCard01) {
      subtaskCard01.classList.remove('active', 'done');
      subtaskCard01.classList.add('locked');
    }
    if (subtaskPill01) subtaskPill01.textContent = 'LOCKED';
    if (subtaskCard02) {
      subtaskCard02.classList.remove('active', 'done');
      subtaskCard02.classList.add('locked');
    }
    if (subtaskPill02) subtaskPill02.textContent = 'LOCKED';

    playSuccessChime();
    showToast('MISSION RESTARTED: Clean slate initialized. Budget reset to $150,000.00.', '🔄');
  }

  function performQuitToMenu() {
    playClick();
    // Auto-save current progress so Continue is available on menu
    autoSaveGame();

    // Release pointer lock
    if (document.pointerLockElement) {
      document.exitPointerLock?.();
    }

    // Close any open modals
    closeAllModals();

    // Disconnect from multiplayer session if active
    if (window.multiplayerManager && window.multiplayerManager.isInRoom) {
      window.multiplayerManager.leaveRoom();
      if (facilityRoomInstance && typeof facilityRoomInstance.clearRemotePlayers === 'function') {
        facilityRoomInstance.clearRemotePlayers();
      }
      const mpBadge = document.getElementById('hudMultiplayerBadge');
      if (mpBadge) mpBadge.classList.add('hidden');
    }

    // Navigate to menu
    showScreen('menu');
    updateContinueButtonState();
    showToast('Returned to Main Menu. Mission progress auto-saved.', '🚪');
  }

  if (btnFacilityRestart) {
    btnFacilityRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      playClick();
      if (document.pointerLockElement) {
        document.exitPointerLock?.();
      }
      showConfirmation(
        'RESTART MISSION FROM SCRATCH? All saved progress, inventory, and telemetry will be reset. Budget restores to $150,000.00.',
        () => {
          performFullMissionRestart();
        }
      );
    });
  }

  if (btnFacilityQuit) {
    btnFacilityQuit.addEventListener('click', (e) => {
      e.stopPropagation();
      performQuitToMenu();
    });
  }

  if (btnWbRestart) {
    btnWbRestart.addEventListener('click', (e) => {
      e.stopPropagation();
      playClick();
      showConfirmation(
        'RESTART MISSION FROM SCRATCH? All saved progress, inventory, and telemetry will be reset. Budget restores to $150,000.00.',
        () => {
          performFullMissionRestart();
        }
      );
    });
  }

  if (btnWbQuit) {
    btnWbQuit.addEventListener('click', (e) => {
      e.stopPropagation();
      performQuitToMenu();
    });
  }

  if (btnSettingsRestartMission) {
    btnSettingsRestartMission.addEventListener('click', () => {
      playClick();
      showConfirmation(
        'RESTART MISSION FROM SCRATCH? All saved progress, inventory, and telemetry will be reset. Budget restores to $150,000.00.',
        () => {
          performFullMissionRestart();
          showScreen('facility');
        }
      );
    });
  }

  if (btnSettingsQuitMenu) {
    btnSettingsQuitMenu.addEventListener('click', () => {
      performQuitToMenu();
    });
  }

  // --- Department Switcher Controller ---
  function setDepartment(dept) {
    gameState.activeDept = dept;
    const isNet = dept === 'network';
    const isElec = dept === 'electronic';

    // Trigger Ground Control Dispatch Audio for the selected department
    if (isNet) {
      triggerNetworkDepartmentDispatchAudio();
    } else if (isElec) {
      triggerElectronicDepartmentDispatchAudio();
    } else {
      triggerMechanicalDepartmentDispatchAudio();
    }

    // HUD department switcher pills
    const btnHudElec = document.getElementById('btnHudDeptElec');
    const btnHudMech = document.getElementById('btnHudDeptMech');
    if (btnHudElec) btnHudElec.classList.toggle('active', isElec);
    if (btnHudMech) btnHudMech.classList.toggle('active', !isElec && !isNet);

    // Objective screen chips
    const chipElec = document.getElementById('chipDeptElec');
    const chipMech = document.getElementById('chipDeptMech');
    if (chipElec) chipElec.classList.toggle('active', isElec);
    if (chipMech) chipMech.classList.toggle('active', !isElec && !isNet);

    // Switch active checklist in HUD
    const chkListNet = document.getElementById('hudChecklistNet');
    const chkListElec = document.getElementById('hudChecklistElec');
    const chkListMech = document.getElementById('hudChecklistMech');
    if (chkListNet) chkListNet.classList.toggle('hidden', !isNet);
    if (chkListElec) chkListElec.classList.toggle('hidden', !isElec);
    if (chkListMech) chkListMech.classList.toggle('hidden', isNet || isElec);

    // Update HUD active department title
    const activeDeptTitle = document.getElementById('hudActiveDeptTitle');
    if (activeDeptTitle) {
      activeDeptTitle.textContent = isNet ? 'DEPARTMENT: NETWORK & COMM [DESK 03]' : (isElec ? 'DEPARTMENT: ELECTRONIC [DESK 02]' : 'DEPARTMENT: MECHANICAL [DESK 01]');
    }

    updateMissionChecklistUI();
    updatePlayerFrameUI();
    if (facilityRoomInstance && facilityRoomInstance.updateMissionVisuals) {
      facilityRoomInstance.updateMissionVisuals(gameState);
    }
    updateScienceCameraTelemetry();
  }

  const btnHudDeptElec = document.getElementById('btnHudDeptElec');
  const btnHudDeptMech = document.getElementById('btnHudDeptMech');
  const chipDeptElec = document.getElementById('chipDeptElec');
  const chipDeptMech = document.getElementById('chipDeptMech');

  if (btnHudDeptElec) btnHudDeptElec.addEventListener('click', () => { playClick(); setDepartment('electronic'); });
  if (btnHudDeptMech) btnHudDeptMech.addEventListener('click', () => { playClick(); setDepartment('mechanical'); });
  if (chipDeptElec) chipDeptElec.addEventListener('click', () => { playClick(); setDepartment('electronic'); });
  if (chipDeptMech) chipDeptMech.addEventListener('click', () => { playClick(); setDepartment('mechanical'); });

  // --- Mission Checklist Syncer ---
  const pillFrameMech = document.getElementById('pillFrameMech');
  const pillFrameElec = document.getElementById('pillFrameElec');
  const pillFrameNet = document.getElementById('pillFrameNet');
  if (pillFrameMech) pillFrameMech.addEventListener('click', () => { playClick(); setDepartment('mechanical'); });
  if (pillFrameElec) pillFrameElec.addEventListener('click', () => { playClick(); setDepartment('electronic'); });
  if (pillFrameNet) pillFrameNet.addEventListener('click', () => { playClick(); setDepartment('network'); });

  const chkCheckInElec = document.getElementById('chkCheckInElec');
  const chkCheckInElecIcon = document.getElementById('chkCheckInElecIcon');
  const chkPapersElec = document.getElementById('chkPapersElec');
  const chkPapersElecIcon = document.getElementById('chkPapersElecIcon');
  const chkSubtaskE01 = document.getElementById('chkSubtaskE01');
  const chkSubtaskE01Icon = document.getElementById('chkSubtaskE01Icon');
  const chkSubtaskE02 = document.getElementById('chkSubtaskE02');
  const chkSubtaskE02Icon = document.getElementById('chkSubtaskE02Icon');
  const chkDiagElec = document.getElementById('chkDiagElec');
  const chkDiagElecIcon = document.getElementById('chkDiagElecIcon');

  const chkCheckInNet = document.getElementById('chkCheckInNet');
  const chkCheckInNetIcon = document.getElementById('chkCheckInNetIcon');
  const chkPapersNet = document.getElementById('chkPapersNet');
  const chkPapersNetIcon = document.getElementById('chkPapersNetIcon');
  const chkSubtaskN01 = document.getElementById('chkSubtaskN01');
  const chkSubtaskN01Icon = document.getElementById('chkSubtaskN01Icon');
  const chkSubtaskN02 = document.getElementById('chkSubtaskN02');
  const chkSubtaskN02Icon = document.getElementById('chkSubtaskN02Icon');
  const chkDiagNet = document.getElementById('chkDiagNet');
  const chkDiagNetIcon = document.getElementById('chkDiagNetIcon');

  
  // --- Phase 02: Live Mission Shift Elapsed Timer ---
  let missionStartTime = Date.now();
  try {
    const savedStart = localStorage.getItem('nasa_mission_start_time');
    if (savedStart) missionStartTime = parseInt(savedStart, 10);
    else localStorage.setItem('nasa_mission_start_time', missionStartTime.toString());
  } catch (e) {}

  function updateMissionTimerUI() {
    const timerEl = document.getElementById('hudMissionTimer');
    if (!timerEl) return;
    const elapsedSec = Math.floor((Date.now() - missionStartTime) / 1000);
    const hrs = String(Math.floor(elapsedSec / 3600)).padStart(2, '0');
    const mins = String(Math.floor((elapsedSec % 3600) / 60)).padStart(2, '0');
    const secs = String(elapsedSec % 60).padStart(2, '0');
    timerEl.textContent = `${hrs} : ${mins} : ${secs}`;
  }
  setInterval(updateMissionTimerUI, 1000);

  // --- Phase 02: Single Active Task Determinator (Node 375:66 Specification) ---
  function updateSingleActiveTaskUI() {
    const taskEl = document.getElementById('hudCenterTaskText');
    if (!taskEl) return;

    // In Reception Lobby: show lobby orientation tasks before entering cleanroom
    if (!gameState.hasEnteredFacility) {
      if (typeof isLobbyWaitingBlocked === 'function' && isLobbyWaitingBlocked()) {
        taskEl.textContent = '[LOBBY] Awaiting Crew Arrival at Reception Desk';
      } else if (!gameState.hasKeycard) {
        taskEl.textContent = '[LOBBY] Approach Registration Desk to Claim Role & Keycard';
      } else {
        taskEl.textContent = '[LOBBY] All Crew Ready — Proceed through North Gateway to Cleanroom Air Shower';
      }
      return;
    }

    let activeText = 'Take Control of Hubble Space Facility';
    const dept = gameState.activeDept || 'electronic';

    if (dept === 'electronic') {
      if (!gameState.elecCheckedIn) {
        activeText = '[DESK 02] Approach Terminal & Check In to Electronic Dept';
      } else if (!window.hasPurchasedTool('probes') || !window.hasPurchasedTool('screwdriver')) {
        activeText = '[DESK 02] Open Laptop Marketplace & Procure Avionics Tools';
      } else if (!gameState.subtaskE01Complete) {
        activeText = '[DESK 02] Access Electronics Workbench: Repair DF-224 Flight Computer';
      } else if (!gameState.subtaskE02Complete) {
        activeText = '[DESK 02] Access Electronics Workbench: Calibrate Fine Guidance Sensor (FGS)';
      } else if (!gameState.breakerMasterOn && !(window.electronicsWorkbenchInstance && window.electronicsWorkbenchInstance.breakerMasterOn)) {
        activeText = '[DESK 02] Energize Master Circuit Breaker at Workbench';
      } else {
        activeText = '[DESK 02] Avionics Repairs Complete! Proceed to Assembly Bay';
      }
    } else if (dept === 'mechanical') {
      if (!gameState.isCheckedIn && !gameState.mechCheckedIn) {
        activeText = '[DESK 01] Approach Terminal & Check In to Mechanical Dept';
      } else if (!window.hasPurchasedTool('pgt') && !window.hasPurchasedTool('torque_wrench')) {
        activeText = '[DESK 01] Open Laptop Marketplace & Procure PGT Torque Wrench';
      } else if (!gameState.subtask01Complete) {
        activeText = '[DESK 01] Access Workbench: Align & Torque RSU-02 Gyroscope';
      } else if (!gameState.subtask02Complete) {
        activeText = '[DESK 01] Access Workbench: Replace Solar Array Drive Mechanism (SADM)';
      } else {
        activeText = '[DESK 01] Mechanical Subsystems Complete! Proceed to Assembly Bay';
      }
    } else if (dept === 'network') {
      if (!gameState.netCheckedIn) {
        activeText = '[DESK 03] Approach Terminal & Check In to Network & Comm Dept';
      } else if (!window.hasPurchasedTool('rf_wrench') || !window.hasPurchasedTool('fiber_stripper')) {
        activeText = '[DESK 03] Open Laptop Marketplace & Procure RF & Fiber Instruments';
      } else if (!gameState.subtaskN01Complete) {
        activeText = '[DESK 03] Access 3D Workbench: Replace Gold RF Coupler & Align HGA Gimbal';
      } else if (!gameState.subtaskN02Complete) {
        activeText = '[DESK 03] Access 3D Workbench: Splice SI-C&DH High-Rate Fiber Data Bus';
      } else {
        activeText = '[DESK 03] Telecommunications Link Certified! Proceed to Assembly Bay';
      }
    }

    taskEl.textContent = activeText;
  }

  function updateMissionChecklistUI() {
    if (typeof checkAndAutoIssuePasscodes === 'function') {
      checkAndAutoIssuePasscodes();
    }
    updateSingleActiveTaskUI();

    // 0. Network Department Checklist
    if (chkCheckInNet && chkCheckInNetIcon) {
      if (gameState.netCheckedIn) {
        chkCheckInNetIcon.textContent = '✓';
        chkCheckInNet.classList.add('done');
      } else {
        chkCheckInNetIcon.textContent = '○';
        chkCheckInNet.classList.remove('done');
      }
    }
    if (chkPapersNet && chkPapersNetIcon) {
      if (gameState.netPapersChecked) {
        chkPapersNetIcon.textContent = '✓';
        chkPapersNet.classList.add('done');
      } else {
        chkPapersNetIcon.textContent = '○';
        chkPapersNet.classList.remove('done');
      }
    }
    if (chkSubtaskN01 && chkSubtaskN01Icon) {
      if (gameState.subtaskN01Complete) {
        chkSubtaskN01Icon.textContent = '✓';
        chkSubtaskN01.classList.add('done');
      } else {
        chkSubtaskN01Icon.textContent = '○';
        chkSubtaskN01.classList.remove('done');
      }
    }
    if (chkSubtaskN02 && chkSubtaskN02Icon) {
      if (gameState.subtaskN02Complete) {
        chkSubtaskN02Icon.textContent = '✓';
        chkSubtaskN02.classList.add('done');
      } else {
        chkSubtaskN02Icon.textContent = '○';
        chkSubtaskN02.classList.remove('done');
      }
    }
    if (chkDiagNet && chkDiagNetIcon) {
      if (gameState.subtaskN01Complete && gameState.subtaskN02Complete) {
        chkDiagNetIcon.textContent = '✓';
        chkDiagNet.classList.add('done');
      } else {
        chkDiagNetIcon.textContent = '○';
        chkDiagNet.classList.remove('done');
      }
    }
    // 1. Electronic Department Checklist
    if (chkCheckInElec && chkCheckInElecIcon) {
      if (gameState.elecCheckedIn) {
        chkCheckInElecIcon.textContent = '✓';
        chkCheckInElec.classList.add('done');
      } else {
        chkCheckInElecIcon.textContent = '○';
        chkCheckInElec.classList.remove('done');
      }
    }

    if (chkPapersElec && chkPapersElecIcon) {
      if (gameState.elecPapersChecked) {
        chkPapersElecIcon.textContent = '✓';
        chkPapersElec.classList.add('done');
      } else {
        chkPapersElecIcon.textContent = '○';
        chkPapersElec.classList.remove('done');
      }
    }

    if (chkSubtaskE01 && chkSubtaskE01Icon) {
      if (gameState.subtaskE01Complete) {
        chkSubtaskE01Icon.textContent = '✓';
        chkSubtaskE01.classList.add('done');
      } else {
        chkSubtaskE01Icon.textContent = '○';
        chkSubtaskE01.classList.remove('done');
      }
    }

    if (chkSubtaskE02 && chkSubtaskE02Icon) {
      if (gameState.subtaskE02Complete) {
        chkSubtaskE02Icon.textContent = '✓';
        chkSubtaskE02.classList.add('done');
      } else {
        chkSubtaskE02Icon.textContent = '○';
        chkSubtaskE02.classList.remove('done');
      }
    }

    if (chkDiagElec && chkDiagElecIcon) {
      const breakerOn = gameState.breakerMasterOn || (electronicsWorkbenchInstance && electronicsWorkbenchInstance.breakerMasterOn);
      if (gameState.telemetryDiagRun) {
        chkDiagElecIcon.textContent = '✓';
        chkDiagElec.classList.add('done');
      } else if (gameState.subtaskE01Complete && gameState.subtaskE02Complete && breakerOn) {
        chkDiagElecIcon.textContent = '⚡';
        chkDiagElec.classList.remove('done');
      } else {
        chkDiagElecIcon.textContent = '○';
        chkDiagElec.classList.remove('done');
      }
    }

    // 2. Mechanical Department Checklist
    if (chkCheckInIcon && chkCheckIn) {
      if (gameState.isCheckedIn) {
        chkCheckInIcon.textContent = '✓';
        chkCheckIn.classList.add('done');
      } else {
        chkCheckInIcon.textContent = '○';
        chkCheckIn.classList.remove('done');
      }
    }

    if (chkReportIcon && chkAssembleReport) {
      if (gameState.papersChecked) {
        chkReportIcon.textContent = '✓';
        chkAssembleReport.classList.add('done');
      } else {
        chkReportIcon.textContent = '○';
        chkAssembleReport.classList.remove('done');
      }
    }

    if (chkGyroIcon && chkGyroAssembly) {
      if (gameState.subtask01Complete) {
        chkGyroIcon.textContent = '✓';
        chkGyroAssembly.classList.add('done');
      } else {
        chkGyroIcon.textContent = '○';
        chkGyroAssembly.classList.remove('done');
      }
    }

    if (chkSadmIcon && chkSadmAssembly) {
      if (gameState.subtask02Complete) {
        chkSadmIcon.textContent = '✓';
        chkSadmAssembly.classList.add('done');
      } else {
        chkSadmIcon.textContent = '○';
        chkSadmAssembly.classList.remove('done');
      }
    }

    // 3. Header Texts based on active department
    const mainTaskEl = document.getElementById('hudMainTaskText');
    const subTaskEl = document.getElementById('hudSubTaskText');

    if (gameState.activeDept === 'network') {
      if (gameState.subtaskN01Complete && gameState.subtaskN02Complete) {
        if (mainTaskEl) {
          mainTaskEl.textContent = "COMMUNICATION & TELEMETRY 100% OPERATIONAL";
          mainTaskEl.style.color = "#10b981";
        }
        if (subTaskEl) {
          subTaskEl.textContent = "TDRSS Ku-Band locked. Log checkout at Desk 03.";
          subTaskEl.style.color = "#38bdf8";
        }
      } else if (gameState.netCheckedIn) {
        if (mainTaskEl) {
          mainTaskEl.textContent = "[MAIN TASK]: Network & Communication Department";
          mainTaskEl.style.color = "#38bdf8";
        }
        if (subTaskEl) {
          if (!gameState.subtaskN01Complete) {
            subTaskEl.textContent = "[SUB-TSK-N-01] High-Gain Antenna Gimbal & Transceiver Realignment";
          } else {
            subTaskEl.textContent = "[SUB-TSK-N-02] SI-C&DH Fiber-Optic Bus Splicing";
          }
          subTaskEl.style.color = "";
        }
      } else {
        if (mainTaskEl) {
          mainTaskEl.textContent = "[MAIN TASK]: Take control of Network & Comm Department";
          mainTaskEl.style.color = "";
        }
        if (subTaskEl) {
          subTaskEl.textContent = "Walk to Desk 03 (South Wall) and check in at Computer Terminal";
          subTaskEl.style.color = "";
        }
      }
    } else if (gameState.activeDept === 'electronic') {
      const breakerOn = gameState.breakerMasterOn || (electronicsWorkbenchInstance && electronicsWorkbenchInstance.breakerMasterOn);
      if (gameState.telemetryDiagRun) {
        if (mainTaskEl) {
          mainTaskEl.textContent = "ELECTRONIC SYSTEM FULLY CERTIFIED & OPERATIONAL";
          mainTaskEl.style.color = "#10b981";
        }
        if (subTaskEl) {
          subTaskEl.textContent = "All telemetry streams nominal. Check out logged.";
          subTaskEl.style.color = "#38bdf8";
        }
      } else if (gameState.subtaskE01Complete && gameState.subtaskE02Complete && breakerOn) {
        if (mainTaskEl) {
          mainTaskEl.textContent = "MANDATORY SHIFT CHECK-OUT: RUN TELEMETRY DIAGNOSTIC";
          mainTaskEl.style.color = "#38bdf8";
        }
        if (subTaskEl) {
          subTaskEl.textContent = "Return to Desk 02 Computer Terminal to run diagnostics & check out";
          subTaskEl.style.color = "#e0f2fe";
        }
      } else if (gameState.subtaskE01Complete && gameState.subtaskE02Complete) {
        if (mainTaskEl) {
          mainTaskEl.textContent = "AVIONICS VERIFIED: ENERGIZE MASTER CIRCUIT BREAKER";
          mainTaskEl.style.color = "#f59e0b";
        }
        if (subTaskEl) {
          subTaskEl.textContent = "Workbench Desk 02: Flip safety cover & toggle breaker to [ON]";
          subTaskEl.style.color = "#e0f2fe";
        }
      } else if (gameState.elecCheckedIn) {
        if (mainTaskEl) {
          mainTaskEl.textContent = "[MAIN TASK]: Take control of the Electronic Department";
          mainTaskEl.style.color = "#38bdf8";
        }
        if (subTaskEl) {
          if (!gameState.subtaskE01Complete) {
            subTaskEl.textContent = "[SUB-TSK-E-01] DF-224 Main Computer Repair (PCB Hot-Swap)";
          } else {
            subTaskEl.textContent = "[SUB-TSK-E-02] Fine Guidance Sensor (FGS) Calibration";
          }
          subTaskEl.style.color = "";
        }
      } else {
        if (mainTaskEl) {
          mainTaskEl.textContent = "[MAIN TASK]: Take control of the Electronic Department";
          mainTaskEl.style.color = "";
        }
        if (subTaskEl) {
          subTaskEl.textContent = "Walk to Desk 02 (West Wall) and check in at Computer Terminal";
          subTaskEl.style.color = "";
        }
      }
    } else {
      // Mechanical Department
      if (gameState.subtask01Complete && gameState.subtask02Complete) {
        if (mainTaskEl) {
          mainTaskEl.textContent = "ALL REPAIRS VERIFIED: MANDATORY SHIFT CHECK-OUT";
          mainTaskEl.style.color = "#10b981";
        }
        if (subTaskEl) {
          subTaskEl.textContent = "Return to Computer Terminal to sign out and log mission shift";
          subTaskEl.style.color = "#38bdf8";
        }
      } else {
        if (mainTaskEl) {
          mainTaskEl.textContent = "Take controlled of mechanical department";
          mainTaskEl.style.color = "";
        }
        if (subTaskEl) {
          subTaskEl.textContent = "Fixed-head star tracker & rate gyro assembly";
          subTaskEl.style.color = "";
        }
      }
    }

    if (facilityRoomInstance && facilityRoomInstance.updateMissionVisuals) {
      facilityRoomInstance.updateMissionVisuals(gameState);
    }
  }

  // =========================================================================
  // OPTION A: OPTICAL SCIENCE CAMERA & WAVEFRONT TELEMETRY (WFPC2 / COSTAR)
  // =========================================================================
  function calculateOpticalTelemetry(state = gameState) {
    const gyroDone = !!(state.subtask01Complete || (state.tasks && state.tasks.gyroAssembly));
    const sadmDone = !!(state.subtask02Complete || (state.tasks && state.tasks.sadmAssembly));
    const df224Done = !!(state.subtaskE01Complete || (state.electronicTasks && state.electronicTasks.subtaskE01));
    const fgsDone = !!(state.subtaskE02Complete || (state.electronicTasks && state.electronicTasks.subtaskE02));
    const hgaDone = !!(state.subtaskN01Complete || (state.networkTasks && state.networkTasks.subtaskN01));
    const fiberDone = !!(state.subtaskN02Complete || (state.networkTasks && state.networkTasks.subtaskN02));
    const allDone = gyroDone && sadmDone && df224Done && fgsDone && hgaDone && fiberDone;

    // FWHM starts at 1.400" (Uncorrected 2.2µm primary mirror spherical aberration)
    let fwhm = 1.400;
    if (df224Done) fwhm -= 0.55;
    if (gyroDone) fwhm -= 0.35;
    if (sadmDone) fwhm -= 0.25;
    if (fgsDone) fwhm -= 0.198;
    fwhm = Math.max(0.052, fwhm);

    // Strehl ratio starts at 0.12 (12%), targets 0.85 (85%)
    let strehl = 0.12;
    if (df224Done) strehl += 0.24;
    if (gyroDone) strehl += 0.18;
    if (sadmDone) strehl += 0.14;
    if (fgsDone) strehl += 0.17;
    strehl = Math.min(0.85, strehl);

    // RMS Pointing Jitter starts at 35.4 mas, targets 3.2 mas
    let jitter = 35.4;
    if (gyroDone) jitter -= 15.0;
    if (sadmDone) jitter -= 10.0;
    if (fgsDone) jitter -= 7.2;
    jitter = Math.max(3.2, jitter);

    // Resolution metric: starts at 0.720", targets 0.052"
    let resolution = 0.720;
    if (gyroDone) resolution -= 0.18;
    if (sadmDone) resolution -= 0.12;
    if (df224Done) resolution -= 0.22;
    if (fgsDone) resolution -= 0.148;
    resolution = Math.max(0.052, resolution);

    // FGS Interferometer status
    let fgsStatus = 'HUNTING / COARSE';
    let fgsPercent = 20;
    if (fgsDone) {
      fgsStatus = 'FINE LOCK // INTERFEROMETRIC';
      fgsPercent = 100;
    } else if (state.elecCheckedIn) {
      fgsStatus = 'SEARCHING 5.0V REFERENCE';
      fgsPercent = 45;
    }

    const completedCount = (gyroDone ? 1 : 0) + (sadmDone ? 1 : 0) + (df224Done ? 1 : 0) + (fgsDone ? 1 : 0) + (hgaDone ? 1 : 0) + (fiberDone ? 1 : 0);
    const clearancePercent = Math.round((completedCount / 6) * 100);

    return {
      gyroDone,
      sadmDone,
      df224Done,
      fgsDone,
      allDone,
      fwhm,
      strehl,
      jitter,
      resolution,
      fgsStatus,
      fgsPercent,
      clearancePercent
    };
  }

  function updateScienceCameraTelemetry() {
    const tele = calculateOpticalTelemetry(gameState);

    // Update 3D North Wall screen display if facility instance is active
    if (facilityRoomInstance && facilityRoomInstance.updateNorthWallScienceScreen) {
      facilityRoomInstance.updateNorthWallScienceScreen(gameState);
    }

    // 1. Update HUD PiP Card
    const hudDot = document.getElementById('scienceHudDot');
    const hudStatus = document.getElementById('hudScienceStatusText');
    const hudFwhm = document.getElementById('hudScienceFwhm');
    const hudRes = document.getElementById('hudScienceRes');
    const hudPreviewImg = document.getElementById('hudSciencePreviewImg');

    if (hudFwhm) hudFwhm.textContent = `${tele.fwhm.toFixed(3)}"`;
    if (hudRes) hudRes.textContent = `${tele.resolution.toFixed(3)}"`;

    if (hudPreviewImg) {
      const blurPx = Math.max(0, (tele.fwhm * 2.8)).toFixed(1);
      const contrast = (1.0 + (tele.strehl * 0.25)).toFixed(2);
      hudPreviewImg.style.filter = `blur(${blurPx}px) contrast(${contrast}) brightness(0.95)`;
    }

    if (hudDot && hudStatus) {
      if (tele.allDone) {
        hudDot.className = 'science-pulse-dot nominal';
        hudStatus.className = 'science-cam-status-overlay nominal';
        hudStatus.textContent = 'DIFFRACTION LIMITED';
      } else if (tele.clearancePercent >= 50) {
        hudDot.className = 'science-pulse-dot warning';
        hudStatus.className = 'science-cam-status-overlay';
        hudStatus.textContent = `CLEARANCE: ${tele.clearancePercent}%`;
      } else {
        hudDot.className = 'science-pulse-dot';
        hudStatus.className = 'science-cam-status-overlay';
        hudStatus.textContent = 'SPHERICAL ABERRATION';
      }
    }

    // 2. Update Modal Gauges & Display
    const modalImg = document.getElementById('modalScienceTelemetryImg');
    const modalHalo = document.getElementById('modalAberrationHalo');
    const gaugeFwhmVal = document.getElementById('gaugeFwhmVal');
    const gaugeFwhmFill = document.getElementById('gaugeFwhmFill');
    const gaugeStrehlVal = document.getElementById('gaugeStrehlVal');
    const gaugeStrehlFill = document.getElementById('gaugeStrehlFill');
    const gaugeJitterVal = document.getElementById('gaugeJitterVal');
    const gaugeJitterFill = document.getElementById('gaugeJitterFill');
    const gaugeFgsLockVal = document.getElementById('gaugeFgsLockVal');
    const gaugeFgsLockFill = document.getElementById('gaugeFgsLockFill');
    const channelStatus = document.getElementById('scienceChannelStatus');
    const feedBanner = document.getElementById('scienceFeedBanner');
    const feedBannerMsg = document.getElementById('scienceFeedBannerMsg');

    if (modalImg) {
      const modalBlur = Math.max(0, (tele.fwhm * 3.2)).toFixed(1);
      const modalContrast = (1.0 + (tele.strehl * 0.3)).toFixed(2);
      modalImg.style.filter = `blur(${modalBlur}px) contrast(${modalContrast}) brightness(0.95)`;
    }

    if (modalHalo) {
      const haloOpacity = Math.max(0, (1 - (tele.strehl - 0.12) / 0.73)).toFixed(2);
      modalHalo.style.opacity = haloOpacity;
    }

    if (gaugeFwhmVal) gaugeFwhmVal.textContent = `${tele.fwhm.toFixed(3)}"`;
    if (gaugeFwhmFill) {
      const pct = Math.min(100, Math.round(((1.400 - tele.fwhm) / (1.400 - 0.052)) * 85 + 15));
      gaugeFwhmFill.style.width = `${pct}%`;
      gaugeFwhmFill.className = tele.fwhm <= 0.06 ? 'gauge-bar-fill nominal' : (tele.fwhm <= 0.5 ? 'gauge-bar-fill warning' : 'gauge-bar-fill alert');
    }

    if (gaugeStrehlVal) gaugeStrehlVal.textContent = tele.strehl.toFixed(3);
    if (gaugeStrehlFill) {
      const pct = Math.round((tele.strehl / 0.85) * 100);
      gaugeStrehlFill.style.width = `${pct}%`;
      gaugeStrehlFill.className = tele.strehl >= 0.8 ? 'gauge-bar-fill nominal' : (tele.strehl >= 0.4 ? 'gauge-bar-fill warning' : 'gauge-bar-fill alert');
    }

    if (gaugeJitterVal) gaugeJitterVal.textContent = `${tele.jitter.toFixed(1)} mas`;
    if (gaugeJitterFill) {
      const pct = Math.min(100, Math.round(((35.4 - tele.jitter) / (35.4 - 3.2)) * 75 + 25));
      gaugeJitterFill.style.width = `${pct}%`;
      gaugeJitterFill.className = tele.jitter <= 4.0 ? 'gauge-bar-fill nominal' : (tele.jitter <= 15.0 ? 'gauge-bar-fill warning' : 'gauge-bar-fill alert');
    }

    if (gaugeFgsLockVal) {
      gaugeFgsLockVal.textContent = tele.fgsStatus;
      gaugeFgsLockVal.className = tele.fgsDone ? 'gauge-main-val nominal' : 'gauge-main-val highlight';
    }
    if (gaugeFgsLockFill) {
      gaugeFgsLockFill.style.width = `${tele.fgsPercent}%`;
      gaugeFgsLockFill.className = tele.fgsDone ? 'gauge-bar-fill nominal' : (tele.fgsPercent >= 40 ? 'gauge-bar-fill warning' : 'gauge-bar-fill alert');
    }

    if (channelStatus) {
      if (tele.allDone) {
        channelStatus.className = 'science-channel-pill nominal';
        channelStatus.textContent = 'FEED STATUS: DIFFRACTION LIMITED (COSTAR / WFPC2 NOMINAL)';
      } else {
        channelStatus.className = 'science-channel-pill';
        channelStatus.textContent = `FEED STATUS: UNCROSSED ABERRATED (${tele.clearancePercent}% RESTORED)`;
      }
    }

    if (feedBanner && feedBannerMsg) {
      if (tele.allDone) {
        feedBanner.className = 'science-feed-banner nominal';
        feedBannerMsg.textContent = 'ALL SUBSYSTEMS NOMINAL: FGS INTERFEROMETER LOCKED. 0.052 ARCSECOND DIFFRACTION-LIMITED CORE ACHIEVED.';
      } else {
        feedBanner.className = 'science-feed-banner';
        feedBannerMsg.textContent = `OPTICAL PATH AFFECTED BY 2.2µm PRIMARY MIRROR SPHERICAL ABERRATION. SUBSYSTEM REPAIRS PENDING (${4 - ((tele.gyroDone?1:0)+(tele.sadmDone?1:0)+(tele.df224Done?1:0)+(tele.fgsDone?1:0))} REMAINING).`;
      }
    }

    // 3. Attribution List Rows
    updateAttributionRow('attrGyroRow', 'attrGyroIcon', tele.gyroDone);
    updateAttributionRow('attrSadmRow', 'attrSadmIcon', tele.sadmDone);
    updateAttributionRow('attrDf224Row', 'attrDf224Icon', tele.df224Done);
    updateAttributionRow('attrFgsRow', 'attrFgsIcon', tele.fgsDone);

    // 4. Overall Summary Box
    const summaryRes = document.getElementById('scienceSummaryRes');
    const summaryClearance = document.getElementById('scienceSummaryClearance');
    if (summaryRes) summaryRes.textContent = `${tele.resolution.toFixed(3)} arcsec`;
    if (summaryClearance) summaryClearance.textContent = `${tele.clearancePercent}%`;
  }

  function updateAttributionRow(rowId, iconId, isDone) {
    const row = document.getElementById(rowId);
    const icon = document.getElementById(iconId);
    if (!row || !icon) return;
    if (isDone) {
      row.classList.add('done');
      icon.textContent = '✓';
    } else {
      row.classList.remove('done');
      icon.textContent = '○';
    }
  }

  // Science Camera Modal Mode Toggle (Live vs Compare)
  const btnScienceModeLive = document.getElementById('btnScienceModeLive');
  const btnScienceModeCompare = document.getElementById('btnScienceModeCompare');
  const scienceCompareSlider = document.getElementById('scienceCompareSlider');
  const scienceRangeSlider = document.getElementById('scienceRangeSlider');
  const scienceCompareAfterClip = document.getElementById('scienceCompareAfterClip');
  const scienceDividerLine = document.getElementById('scienceDividerLine');

  if (btnScienceModeLive && btnScienceModeCompare && scienceCompareSlider) {
    btnScienceModeLive.addEventListener('click', () => {
      playClick();
      btnScienceModeLive.classList.add('active');
      btnScienceModeCompare.classList.remove('active');
      scienceCompareSlider.classList.add('hidden');
    });

    btnScienceModeCompare.addEventListener('click', () => {
      playClick();
      btnScienceModeCompare.classList.add('active');
      btnScienceModeLive.classList.remove('active');
      scienceCompareSlider.classList.remove('hidden');
    });
  }

  if (scienceRangeSlider && scienceCompareAfterClip && scienceDividerLine) {
    scienceRangeSlider.addEventListener('input', (e) => {
      const val = e.target.value;
      scienceCompareAfterClip.style.clipPath = `inset(0 0 0 ${val}%)`;
      scienceDividerLine.style.left = `${val}%`;
    });
  }

  // Open Science Camera modal from HUD PiP card
  const btnOpenScienceModal = document.getElementById('btnOpenScienceModal');
  if (btnOpenScienceModal) {
    btnOpenScienceModal.addEventListener('click', (e) => {
      e.stopPropagation();
      openModal('science_camera');
    });
  }
  const hudScienceCamCard = document.getElementById('hudScienceCamCard');
  if (hudScienceCamCard) {
    hudScienceCamCard.addEventListener('click', () => {
      openModal('science_camera');
    });
  }

  // --- Keyboard Drop [R] and Slot Selection [1-5] ---
  window.addEventListener('keydown', (e) => {
    const activeTag = document.activeElement?.tagName?.toLowerCase();
    if (activeTag === 'input' || activeTag === 'textarea') return;

    const code = e.code;
    const key = e.key;

    // [R] Key to DROP active/selected instrument from frame
    if (code === 'KeyR' || key === 'r' || key === 'R') {
      if (gameState.activeDept === 'network') {
        if (gameState.netPlayerFrame && gameState.netPlayerFrame.length > 0) {
          const targetId = gameState.netPlayerFrame[gameState.netSelectedSlot] || gameState.netPlayerFrame[0];
          if (targetId) {
            e.preventDefault();
            dropInstrumentNet(targetId);
          }
        }
      } else if (gameState.activeDept === 'electronic') {
        if (gameState.elecPlayerFrame && gameState.elecPlayerFrame.length > 0) {
          const targetId = gameState.elecPlayerFrame[gameState.elecSelectedSlot] || gameState.elecPlayerFrame[0];
          if (targetId) {
            e.preventDefault();
            dropInstrumentElec(targetId);
          }
        }
      } else {
        if (gameState.playerFrame && gameState.playerFrame.length > 0) {
          const targetId = gameState.playerFrame[gameState.selectedSlot] || gameState.playerFrame[0];
          if (targetId) {
            e.preventDefault();
            dropInstrument(targetId);
          }
        }
      }
    }

    // Keys 1 to 5 to select hotbar slot
    if (['Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5'].includes(code) || ['1', '2', '3', '4', '5'].includes(key)) {
      const slotNum = parseInt(key) - 1;
      if (gameState.activeDept === 'network') {
        if (slotNum >= 0 && slotNum < (gameState.netPlayerFrame || []).length) {
          gameState.netSelectedSlot = slotNum;
          updatePlayerFrameUI();
        }
      } else if (gameState.activeDept === 'electronic') {
        if (slotNum >= 0 && slotNum < (gameState.elecPlayerFrame || []).length) {
          gameState.elecSelectedSlot = slotNum;
          updatePlayerFrameUI();
        }
      } else {
        if (slotNum >= 0 && slotNum < (gameState.playerFrame || []).length) {
          gameState.selectedSlot = slotNum;
          updatePlayerFrameUI();
        }
      }
    }

    // Key [U] to inspect/use
    if (code === 'KeyU' || key === 'u' || key === 'U') {
      if (gameState.activeDept === 'network') {
        if (gameState.netPlayerFrame && gameState.netPlayerFrame.length > 0) {
          const activeId = gameState.netPlayerFrame[gameState.netSelectedSlot];
          const activeItem = marketCatalogNet.find(c => c.id === activeId);
          if (activeItem) {
            showToast(`Active Instrument: ${activeItem.name}. Ready for network telemetry on Desk 03.`, '📡');
          }
        }
      } else if (gameState.activeDept === 'electronic') {
        if (gameState.elecPlayerFrame && gameState.elecPlayerFrame.length > 0) {
          const activeId = gameState.elecPlayerFrame[gameState.elecSelectedSlot];
          const activeItem = marketCatalogElec.find(c => c.id === activeId);
          if (activeItem) {
            showToast(`Active Instrument: ${activeItem.name}. Ready for electronics servicing on Desk 02.`, '⚡');
          }
        }
      } else {
        if (gameState.playerFrame && gameState.playerFrame.length > 0) {
          const activeId = gameState.playerFrame[gameState.selectedSlot];
          const activeItem = marketCatalog.find(c => c.id === activeId);
          if (activeItem) {
            showToast(`Active Instrument: ${activeItem.name}. Ready for assembly at Workbench.`, '🔧');
          }
        }
      }
    }
  });

  // --- Room Screen Navigation (Node 378:46) ---
  const btnOpenPrivateRoom = document.getElementById('btnOpenPrivateRoom');
  const btnRoomBack = document.getElementById('btnRoomBack');
  const joinGameInput = document.getElementById('joinGameInput');
  const joinGameSubmitBtn = document.getElementById('joinGameSubmitBtn');

  if (btnOpenPrivateRoom) btnOpenPrivateRoom.addEventListener('click', () => showScreen('proom'));
  if (btnRoomBack) btnRoomBack.addEventListener('click', () => showScreen('menu'));

  // --- Multiplayer HUD & Notification Wiring ---
  const joinGamePasscode = document.getElementById('joinGamePasscode');
  const joinRoomError = document.getElementById('joinRoomError');
  const btnLaunchPrivateRoom = document.getElementById('btnLaunchPrivateRoom');
  const createRoomError = document.getElementById('createRoomError');
  const hudMultiplayerBadge = document.getElementById('hudMultiplayerBadge');
  const hudMpRoomText = document.getElementById('hudMpRoomText');
  const hudMpCountText = document.getElementById('hudMpCountText');

  function getActivePlayerName() {
    if (window.authManager && window.authManager.operatorName) {
      return window.authManager.operatorName;
    }
    const joinInput = document.getElementById('joinPlayerNameInput');
    if (joinInput && joinInput.value.trim()) return joinInput.value.trim();
    const createInput = document.getElementById('createPlayerNameInput');
    if (createInput && createInput.value.trim()) return createInput.value.trim();
    return (settingPlayerName && settingPlayerName.value.trim()) || ('Commander_' + Math.floor(100 + Math.random() * 900));
  }

  function updateMultiplayerBadge(room) {
    if (!hudMultiplayerBadge) return;
    if (room && room.roomId) {
      hudMultiplayerBadge.classList.remove('hidden');
      if (hudMpRoomText) hudMpRoomText.textContent = `ROOM: ${room.roomId}`;
      const count = room.playersCount || (room.players ? room.players.length : 1);
      if (hudMpCountText) hudMpCountText.textContent = `[${count}/${room.maxPlayers || 4}]`;
    } else {
      hudMultiplayerBadge.classList.add('hidden');
    }
  }

  // Register Multiplayer Relay Event Handlers
  if (window.multiplayerManager) {
    window.multiplayerManager.onPlayerJoined = (data) => {
      console.log('[MULTIPLAYER] Remote engineer arrived:', data.name);
      if (window.lobbyRoomInstance && typeof window.lobbyRoomInstance.addRemotePlayer === 'function') {
        window.lobbyRoomInstance.addRemotePlayer(data.socketId, data);
      }
      if (facilityRoomInstance && typeof facilityRoomInstance.addRemotePlayer === 'function') {
        facilityRoomInstance.addRemotePlayer(data.socketId, data);
      }
      if (window.multiplayerManager.currentRoom) {
        window.multiplayerManager.currentRoom.playersCount = (window.multiplayerManager.currentRoom.playersCount || 1) + 1;
        updateMultiplayerBadge(window.multiplayerManager.currentRoom);
      }
      showToast(`ENGINEER ARRIVED: ${data.name} entered cleanroom.`, '👨‍🚀');
      if (typeof updateLobbyWaitingState === 'function') updateLobbyWaitingState();
    };

    window.multiplayerManager.onPlayerMoved = (data) => {
      if (window.lobbyRoomInstance && typeof window.lobbyRoomInstance.updateRemotePlayer === 'function') {
        window.lobbyRoomInstance.updateRemotePlayer(data.socketId, data);
      }
      if (facilityRoomInstance && typeof facilityRoomInstance.updateRemotePlayer === 'function') {
        facilityRoomInstance.updateRemotePlayer(data.socketId, data);
      }
    };

    window.multiplayerManager.onPlayerLeft = (data) => {
      console.log('[MULTIPLAYER] Remote engineer departed:', data.name);
      if (window.lobbyRoomInstance && typeof window.lobbyRoomInstance.removeRemotePlayer === 'function') {
        window.lobbyRoomInstance.removeRemotePlayer(data.socketId);
      }
      if (facilityRoomInstance && typeof facilityRoomInstance.removeRemotePlayer === 'function') {
        facilityRoomInstance.removeRemotePlayer(data.socketId);
      }
      if (window.multiplayerManager.currentRoom) {
        window.multiplayerManager.currentRoom.playersCount = data.remainingCount || Math.max(1, (window.multiplayerManager.currentRoom.playersCount || 2) - 1);
        updateMultiplayerBadge(window.multiplayerManager.currentRoom);
      }
      showToast(`ENGINEER DEPARTED: ${data.name} exited.`, '🚪');
      if (typeof updateLobbyWaitingState === 'function') updateLobbyWaitingState();
    };

    
  // --- Phase 02: Voice Chat & Player Slots Setup ---
  const btnVoiceMicToggle = document.getElementById('btnVoiceMicToggle');
  if (btnVoiceMicToggle) {
    btnVoiceMicToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      playClick();
      if (window.voiceManager) {
        window.voiceManager.toggleMute();
      }
    });
  }

  // Keybinding [M] for Mic Mute Toggle
  window.addEventListener('keydown', (e) => {
    if (e.key === 'm' || e.key === 'M') {
      const activeTag = document.activeElement ? document.activeElement.tagName.toLowerCase() : '';
      if (activeTag === 'input' || activeTag === 'textarea') return;
      if (activeScreenKey !== 'menu') {
        if (window.voiceManager) window.voiceManager.toggleMute();
      }
    }
  });

  if (window.voiceManager) {
    window.voiceManager.onLocalSpeakingChanged = (speaking) => {
      const slot1 = document.getElementById('slotPlayer1');
      if (slot1) slot1.classList.toggle('speaking', speaking);
      const wave = document.getElementById('micBreathWave');
      if (wave) wave.classList.toggle('active', speaking);
      const btn = document.getElementById('btnVoiceMicToggle');
      if (btn) btn.classList.toggle('speaking', speaking);
    };

    window.voiceManager.onRemoteSpeakingChanged = (socketId, speaking) => {
      const slots = [document.getElementById('slotPlayer2'), document.getElementById('slotPlayer3'), document.getElementById('slotPlayer4')];
      slots.forEach((s) => {
        if (s && s.dataset.socketId === socketId) {
          s.classList.toggle('speaking', speaking);
        }
      });
      if (facilityRoomInstance && typeof facilityRoomInstance.setRemotePlayerSpeaking === 'function') {
        facilityRoomInstance.setRemotePlayerSpeaking(socketId, speaking);
      }
    };
  }

  function updateConnectedPlayerSlotsUI(room) {
    const slots = [
      document.getElementById('slotPlayer1'),
      document.getElementById('slotPlayer2'),
      document.getElementById('slotPlayer3'),
      document.getElementById('slotPlayer4')
    ];

    if (!slots[0]) return;
    slots[0].classList.add('active'); // Local player always active

    const remotePlayers = room && room.players ? room.players.filter(p => p.socketId !== window.multiplayerManager?.socket?.id) : [];

    for (let i = 1; i < 4; i++) {
      if (slots[i]) {
        if (remotePlayers[i - 1]) {
          slots[i].classList.add('active');
          slots[i].dataset.socketId = remotePlayers[i - 1].socketId;
          slots[i].title = remotePlayers[i - 1].name || `Engineer ${i + 1}`;
        } else {
          slots[i].classList.remove('active', 'speaking');
          slots[i].dataset.socketId = '';
          slots[i].title = 'Slot Empty';
        }
      }
    }
  }

    window.multiplayerManager.onRoomStateChanged = (room) => {
      updateConnectedPlayerSlotsUI(room);

      updateMultiplayerBadge(room);
      if (typeof updateLobbyWaitingState === 'function') updateLobbyWaitingState();
    };

    // Real-Time Room State Synchronization Bus
    window.multiplayerManager.onSyncEvent = (type, payload, sender, socketId) => {
      console.log('[SYNC BUS RECEIVED]:', type, payload, 'from', sender);

      // Phase 02: Single-Purchase Tool Sync ("Instrument Equipped already")
      if (type === 'SYNC_TOOL_PURCHASE' && payload) {
        if (typeof payload.newBudget === 'number') {
          gameState.budget = payload.newBudget;
          updateBudgetDisplays();
        }
        if (!gameState.roomEquippedTools) gameState.roomEquippedTools = {};
        gameState.roomEquippedTools[payload.itemId] = {
          equippedBy: payload.purchasedBy,
          tier: payload.tier,
          dept: payload.dept,
          expiresAt: Date.now() + (payload.durationSec || 300) * 1000
        };
        renderMarketplace();
        renderMarketplaceElec();
        renderMarketplaceNet();
        showToast(`ROOM MARKET: ${payload.purchasedBy} equipped ${payload.itemId} (LVL 0${payload.tier}). Instrument locked for room.`, '🔒');
      }

      // Team Synchronized Avatar Profile Selection
      if (type === 'SYNC_AVATAR_SELECT' && payload && payload.socketId) {
        console.log('[MULTIPLAYER] Avatar update from peer:', payload);
        if (window.lobbyRoomInstance && window.lobbyRoomInstance.remotePlayers && window.lobbyRoomInstance.remotePlayers.has(payload.socketId)) {
          window.lobbyRoomInstance.addRemotePlayer(payload.socketId, { name: payload.name, avatarId: payload.avatarId });
        }
        if (facilityRoomInstance && facilityRoomInstance.remotePlayers && facilityRoomInstance.remotePlayers.has(payload.socketId)) {
          facilityRoomInstance.addRemotePlayer(payload.socketId, { name: payload.name, avatarId: payload.avatarId });
        }
      }

      // Team Synchronized Airlock Transition into Cleanroom
      if (type === 'SYNC_AIRLOCK_TRANSITION') {
        console.log('[MULTIPLAYER] Team airlock transition received from', sender);
        showToast(`CREW ENTRY: ${sender} opened airlock. Entering Cleanroom together!`, '🚀');
        if (window.lobbyRoomInstance) {
          window.lobbyRoomInstance.openDoors(false);
          setTimeout(() => {
            if (typeof onCleanroomEntered === 'function') {
              onCleanroomEntered();
            }
          }, 800);
        }
      }

      if (type === 'SYNC_DOOR_TRIGGER' && payload) {
        if (window.lobbyRoomInstance) {
          if (payload.state === 'open') window.lobbyRoomInstance.openDoors(false);
          else window.lobbyRoomInstance.closeDoors(false);
        }
      }

            if (type === 'SYNC_TOOL_RELEASE' && payload) {
        if (gameState.roomEquippedTools && gameState.roomEquippedTools[payload.itemId]) {
          delete gameState.roomEquippedTools[payload.itemId];
          renderMarketplace();
          renderMarketplaceElec();
          renderMarketplaceNet();
          showToast(`ROOM MARKET: ${payload.releasedBy} dropped ${payload.itemId}. Available to requisition!`, '🔓');
        }
      }

      // 1. Shared Mission Budget Sync (Requirement 3)
      if (type === 'SYNC_BUDGET' && typeof payload.budget === 'number') {
        gameState.budget = payload.budget;
        updateBudgetDisplays();
        if (renderMarketplace) renderMarketplace();
        if (renderMarketplaceElec) renderMarketplaceElec();
        if (renderMarketplaceNet) renderMarketplaceNet();
        showToast(`BUDGET UPDATE: ${sender} procured ${payload.itemName || 'item'} (-${(payload.itemPrice || 0).toLocaleString()})`, '💰');
      }

      // 2. Station Check-In Concurrency Lock (Requirement 2)
      if (type === 'SYNC_STATION_LOCK') {
        const dept = payload.dept;
        stationLocks[dept] = payload.inUse ? { lockedBy: socketId, playerName: sender } : null;
        updateSessionSheetUI();
        updateSessionSheetElecUI();
        updateSessionSheetNetUI();
        const deptName = dept === 'mechanical_desk_01' ? 'Mechanical (Desk 01)' : (dept === 'network_desk_03' ? 'Network (Desk 03)' : 'Electronic (Desk 02)');
        if (payload.inUse) {
          showToast(`STATION IN-USE: ${sender} checked in to ${deptName}. Awaiting checkout.`, '🔒');
        } else {
          showToast(`STATION UNLOCKED: ${deptName} is now available for check-in!`, '🔓');
        }
      }

      // 3. Task Completion Sync
      if (type === 'SYNC_VOICE_ACTIVITY' && payload) {
        if (window.voiceManager) window.voiceManager.handleRemoteVoiceActivity(payload.socketId || socketId, !!payload.speaking);
        return;
      }
      if (type === 'SYNC_ASSEMBLY_PASSCODE' && payload) {
        if (!gameState.assemblyPasscodes) gameState.assemblyPasscodes = { mech: null, elec: null, net: null };
        gameState.assemblyPasscodes[payload.dept] = payload.passcode;
        updateStickyPasscodeUI();
        showToast(`CREW CLEARANCE: ${payload.dept.toUpperCase()} Assembly Passcode (${payload.passcode}) pinned to HUD!`, '🔑');
      }
      if (type === 'SYNC_TASK_COMPLETED') {
        if (payload.taskId === 'subtask01') gameState.subtask01Complete = true;
        if (payload.taskId === 'subtask02') gameState.subtask02Complete = true;
        if (payload.taskId === 'subtaskE01') gameState.subtaskE01Complete = true;
        if (payload.taskId === 'subtaskE02') gameState.subtaskE02Complete = true;
        updateMissionChecklistUI();
        showToast(`MISSION PROGRESS: ${sender} completed ${payload.taskId.toUpperCase()}!`, '✅');
      }

      // Phase 02: Hubble Subsystem Assembly Real-Time Sync
      if (type === 'SYNC_ASSEMBLY_STEP_COMPLETE' && payload) {
        const d = payload.dept; // 'mech' | 'elec' | 'net'
        if (window.assembly3DInstance) {
          window.assembly3DInstance.assembledStages[d] = true;
          if (window.assembly3DInstance.attachMarkers && window.assembly3DInstance.attachMarkers[d]) {
            window.assembly3DInstance.attachMarkers[d].material.color.setHex(0x22c55e);
          }
          const badge = document.getElementById(`stageBadge_${d}`);
          if (badge) {
            badge.textContent = 'INSTALLED & CERTIFIED';
            badge.className = 'stage-badge completed';
          }
          if (window.assembly3DInstance.assembledStages.mech && window.assembly3DInstance.assembledStages.elec && window.assembly3DInstance.assembledStages.net) {
            const btnLaunch = document.getElementById('btnCertifyAndLaunch');
            if (btnLaunch) {
              btnLaunch.disabled = false;
              btnLaunch.classList.remove('disabled');
              btnLaunch.classList.add('ready');
            }
            const overallStatus = document.getElementById('assemblyOverallStatus');
            if (overallStatus) {
              overallStatus.textContent = 'ALL SUBSYSTEMS CERTIFIED // READY FOR STS-61 LAUNCH';
              overallStatus.className = 'overall-status-ready';
            }
          }
        }
        showToast(`ASSEMBLY UPDATE: ${payload.playerName || sender} installed STAGE ${d.toUpperCase()} on Hubble!`, '🛰️');
      }

      if (type === 'SYNC_TRIGGER_LAUNCH') {
        if (typeof window.triggerLaunchSequence === 'function') {
          window.triggerLaunchSequence();
        }
      }
    };
  }

  // Join Existing Private Room
  async function handleJoinRoom() {
    playClick();
    if (joinRoomError) {
      joinRoomError.textContent = '';
      joinRoomError.classList.add('hidden');
    }

    const inputVal = (joinGameInput.value || '').trim();
    const passcodeVal = (joinGamePasscode ? joinGamePasscode.value : '').trim();

    if (!inputVal) {
      if (joinRoomError) {
        joinRoomError.textContent = 'Please enter Room Code (e.g. ARTEMIS-3).';
        joinRoomError.classList.remove('hidden');
      } else {
        alert('Please enter Room Code (e.g. ARTEMIS-3).');
      }
      joinGameInput.focus();
      return;
    }

    if (joinGameSubmitBtn) joinGameSubmitBtn.disabled = true;

    // Server connects automatically to Render relay in background
    let targetServer = 'https://nasa-game.onrender.com';
    let targetRoomId = inputVal.toUpperCase().trim();

    if (inputVal.includes('://') || inputVal.includes('.onrender.com') || inputVal.includes('.app')) {
      targetServer = inputVal;
      targetRoomId = 'ARTEMIS-3';
    }

    try {
      const pName = getActivePlayerName();
      showToast(`Connecting to room ${targetRoomId}...`, '📡');

      const room = await window.multiplayerManager.joinRoom({
        serverUrl: targetServer,
        roomId: targetRoomId,
        passcode: passcodeVal,
        playerName: pName
      });

      console.log('[MULTIPLAYER] Room joined successfully:', room);
      gameState.isMultiplayer = true;
      gameState.maxPlayers = (room && room.maxPlayers) || 4;
      updateMultiplayerBadge(room);
      if (typeof updateLobbyWaitingState === 'function') updateLobbyWaitingState();
      showToast(`CONNECTED: Joined cleanroom session ${room.roomId}`, '🚀');

      // Option 1: Team spawns together in Multiplayer Briefing Lobby!
      gameState.hasEnteredFacility = false;
      if (window.lobbyRoomInstance) {
        try { window.lobbyRoomInstance.destroy(); } catch (e) {}
        window.lobbyRoomInstance = null;
      }
      if (facilityRoomInstance) {
        try { facilityRoomInstance.destroy(); } catch (e) {}
        facilityRoomInstance = null;
        window.facilityRoomInstance = null;
      }
      const container = document.getElementById('facility3dCanvasContainer');
      if (container) container.innerHTML = '';

      showScreen('facility');
      const activeRoom = window.lobbyRoomInstance || facilityRoomInstance;
      if (activeRoom) {
        if (typeof activeRoom.clearRemotePlayers === 'function') {
          activeRoom.clearRemotePlayers();
        }
        if (room.players) {
          room.players.forEach((p) => {
            if (p.socketId !== window.multiplayerManager.socket?.id) {
              if (typeof activeRoom.addRemotePlayer === 'function') {
                activeRoom.addRemotePlayer(p.socketId, p);
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('[MULTIPLAYER] Join error:', err);
      const msg = err.message || 'Cannot join room. Check Room Code and Passcode.';
      if (joinRoomError) {
        joinRoomError.textContent = msg;
        joinRoomError.classList.remove('hidden');
      } else {
        alert(`Join Error: ${msg}`);
      }
    } finally {
      if (joinGameSubmitBtn) joinGameSubmitBtn.disabled = false;
    }
  }

  if (joinGameSubmitBtn) joinGameSubmitBtn.addEventListener('click', handleJoinRoom);
  if (joinGameInput) {
    joinGameInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleJoinRoom();
    });
  }
  if (joinGamePasscode) {
    joinGamePasscode.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') handleJoinRoom();
    });
  }

  // Launch New Private Room
  async function handleLaunchPrivateRoom() {
    playClick();
    if (createRoomError) {
      createRoomError.textContent = '';
      createRoomError.classList.add('hidden');
    }

    const roomCodeVal = (roomCodeField ? roomCodeField.value : '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    const pass = (passcodeField ? passcodeField.value : '').trim();
    const pName = getActivePlayerName();

    // Use clean Room Code directly (no confusing duplicate prefixes)
    const generatedId = roomCodeVal || ('ARTEMIS-' + Math.floor(100 + Math.random() * 900));
    const sUrl = 'https://nasa-game.onrender.com';

    if (btnLaunchPrivateRoom) btnLaunchPrivateRoom.disabled = true;

    try {
      showToast(`Launching cleanroom session [${generatedId}]...`, '🛰️');
      const room = await window.multiplayerManager.createRoom({
        serverUrl: sUrl,
        roomId: generatedId,
        passcode: pass,
        maxPlayers: playerCount,
        playerName: pName
      });

      console.log('[MULTIPLAYER] Created private room:', room);
      gameState.isMultiplayer = true;
      gameState.maxPlayers = playerCount;
      updateMultiplayerBadge(room);
      if (typeof updateLobbyWaitingState === 'function') updateLobbyWaitingState();
      showToast(`ROOM READY: Code [${room.roomId}]${pass ? ' | Pass: ' + pass : ''}`, '✨');

      // Option 1: Team spawns together in Multiplayer Briefing Lobby!
      gameState.hasEnteredFacility = false;
      if (window.lobbyRoomInstance) {
        try { window.lobbyRoomInstance.destroy(); } catch (e) {}
        window.lobbyRoomInstance = null;
      }
      if (facilityRoomInstance) {
        try { facilityRoomInstance.destroy(); } catch (e) {}
        facilityRoomInstance = null;
        window.facilityRoomInstance = null;
      }
      const container = document.getElementById('facility3dCanvasContainer');
      if (container) container.innerHTML = '';

      showScreen('facility');
      const activeRoom = window.lobbyRoomInstance || facilityRoomInstance;
      if (activeRoom) {
        if (typeof activeRoom.clearRemotePlayers === 'function') {
          activeRoom.clearRemotePlayers();
        }
        if (room.players) {
          room.players.forEach((p) => {
            if (p.socketId !== window.multiplayerManager.socket?.id) {
              if (typeof activeRoom.addRemotePlayer === 'function') {
                activeRoom.addRemotePlayer(p.socketId, p);
              }
            }
          });
        }
      }
    } catch (err) {
      console.warn('[MULTIPLAYER] Launch room error:', err);
      const msg = `${err.message || 'Failed to start room. Check connection.'}`;
      if (createRoomError) {
        createRoomError.textContent = msg;
        createRoomError.classList.remove('hidden');
      } else {
        alert(msg);
      }
    } finally {
      if (btnLaunchPrivateRoom) btnLaunchPrivateRoom.disabled = false;
    }
  }

  if (btnLaunchPrivateRoom) {
    btnLaunchPrivateRoom.addEventListener('click', handleLaunchPrivateRoom);
  }

  // --- Private Room Screen (Node 378:72) ---
  const btnPRoomBack = document.getElementById('btnPRoomBack');
  const roomCodeField = document.getElementById('roomCodeField');
  const btnRefreshRoomCode = document.getElementById('btnRefreshRoomCode');
  const passcodeField = document.getElementById('passcodeField');
  const btnRefreshPasscode = document.getElementById('btnRefreshPasscode');
  const btnPlayerDec = document.getElementById('btnPlayerDec');
  const btnPlayerInc = document.getElementById('btnPlayerInc');
  const playerCountDisplay = document.getElementById('playerCountDisplay');

  let playerCount = 4;
  if (btnPRoomBack) btnPRoomBack.addEventListener('click', () => showScreen('room'));

  const sampleRoomCodes = [
    'ARTEMIS-3',
    'APOLLO-11',
    'GSFC-01',
    'HUBBLE-HST',
    'VOYAGER-1',
    'HORIZON-X',
    'ORION-07',
    'PERSEVERANCE',
    'CURIOSITY'
  ];

  if (btnRefreshRoomCode && roomCodeField) {
    btnRefreshRoomCode.addEventListener('click', () => {
      playClick();
      const current = roomCodeField.value.trim().toUpperCase();
      const filtered = sampleRoomCodes.filter(c => c !== current);
      const nextCode = filtered[Math.floor(Math.random() * filtered.length)];
      roomCodeField.value = nextCode;
    });
  }

  const samplePasscodes = [
    '1234',
    'NASA-2026',
    '0000',
    '2026',
    'ALPHA',
    '7777'
  ];

  if (btnRefreshPasscode && passcodeField) {
    btnRefreshPasscode.addEventListener('click', () => {
      playClick();
      const current = passcodeField.value.trim();
      const filtered = samplePasscodes.filter(p => p !== current);
      const nextCode = filtered[Math.floor(Math.random() * filtered.length)];
      passcodeField.value = nextCode;
    });
  }

  function updatePlayerCountUI() {
    if (playerCountDisplay) playerCountDisplay.textContent = playerCount;
  }

  if (btnPlayerDec) {
    btnPlayerDec.addEventListener('click', () => {
      playClick();
      if (playerCount > 1) {
        playerCount--;
        updatePlayerCountUI();
      }
    });
  }

  if (btnPlayerInc) {
    btnPlayerInc.addEventListener('click', () => {
      playClick();
      if (playerCount < 4) {
        playerCount++;
        updatePlayerCountUI();
      }
    });
  }

  // --- Settings Screen (Node 378:131) ---
  const btnSettingsBack = document.getElementById('btnSettingsBack');
  const settingPlayerName = document.getElementById('settingPlayerName');
  const sliderMasterVolume = document.getElementById('sliderMasterVolume');
  const sliderBrightness = document.getElementById('sliderBrightness');
  const brightnessValText = document.getElementById('brightnessValText');
  const sliderHorizSens = document.getElementById('sliderHorizSens');
  const sliderVertSens = document.getElementById('sliderVertSens');
  const sliderInstrumentVolume = document.getElementById('sliderInstrumentVolume');

  window.currentGameBrightness = 50;

  function applyGameBrightness(val) {
    const num = Math.max(25, Math.min(80, parseInt(val) || 50));
    window.currentGameBrightness = num;

    const container = document.getElementById('facility3dCanvasContainer');
    if (container) {
      const factor = (num / 50).toFixed(2);
      container.style.filter = `brightness(${factor})`;
    }

    if (facilityRoomInstance && typeof facilityRoomInstance.setBrightness === 'function') {
      facilityRoomInstance.setBrightness(num);
    }

    if (brightnessValText) {
      brightnessValText.textContent = `${num}%`;
    }
  }

  window.horizSensitivity = 80;
  window.vertSensitivity = 80;

  if (sliderBrightness) {
    sliderBrightness.addEventListener('input', (e) => {
      applyGameBrightness(e.target.value);
    });
  }
  if (sliderMasterVolume) {
    sliderMasterVolume.addEventListener('input', (e) => {
      if (bgMusic) bgMusic.volume = (parseFloat(e.target.value) / 100) * 0.5;
    });
  }
  if (sliderInstrumentVolume) {
    sliderInstrumentVolume.addEventListener('input', (e) => {
      if (clickSfx) clickSfx.volume = (parseFloat(e.target.value) / 100);
    });
  }
  if (sliderHorizSens) {
    sliderHorizSens.addEventListener('input', (e) => {
      window.horizSensitivity = parseInt(e.target.value) || 80;
    });
  }
  if (sliderVertSens) {
    sliderVertSens.addEventListener('input', (e) => {
      window.vertSensitivity = parseInt(e.target.value) || 80;
    });
  }

  // Live Settings Value Badges Sync
  const valMasterVolume = document.getElementById('valMasterVolume');
  const valInstrumentVolume = document.getElementById('valInstrumentVolume');
  const valHorizSens = document.getElementById('valHorizSens');
  const valVertSens = document.getElementById('valVertSens');

  function updateSettingsValueBadges() {
    if (sliderBrightness && brightnessValText) brightnessValText.textContent = `${sliderBrightness.value}%`;
    if (sliderMasterVolume && valMasterVolume) valMasterVolume.textContent = `${sliderMasterVolume.value}%`;
    if (sliderInstrumentVolume && valInstrumentVolume) valInstrumentVolume.textContent = `${sliderInstrumentVolume.value}%`;
    if (sliderHorizSens && valHorizSens) valHorizSens.textContent = `${sliderHorizSens.value}`;
    if (sliderVertSens && valVertSens) valVertSens.textContent = `${sliderVertSens.value}`;
  }

  if (sliderBrightness) {
    sliderBrightness.addEventListener('input', () => updateSettingsValueBadges());
  }
  if (sliderMasterVolume) {
    sliderMasterVolume.addEventListener('input', () => updateSettingsValueBadges());
  }
  if (sliderInstrumentVolume) {
    sliderInstrumentVolume.addEventListener('input', () => updateSettingsValueBadges());
  }
  if (sliderHorizSens) {
    sliderHorizSens.addEventListener('input', () => updateSettingsValueBadges());
  }
  if (sliderVertSens) {
    sliderVertSens.addEventListener('input', () => updateSettingsValueBadges());
  }
  updateSettingsValueBadges();

    function syncSettingsInputsFromGameState() {
    if (!settingPlayerName) return;
    const currentName = gameState.operatorName || gameState.elecOperatorName || gameState.netOperatorName || (window.authManager && window.authManager.operatorName) || settingPlayerName.value || 'Player_0223';
    settingPlayerName.value = currentName;
  }

  let baselineSettings = {};

  function captureBaselineSettings() {
    baselineSettings = {
      playerName: settingPlayerName ? settingPlayerName.value : 'Player_0223',
      masterVolume: sliderMasterVolume ? sliderMasterVolume.value : '80',
      brightness: sliderBrightness ? sliderBrightness.value : '50',
      horizSens: sliderHorizSens ? sliderHorizSens.value : '80',
      vertSens: sliderVertSens ? sliderVertSens.value : '80',
      instrumentVolume: sliderInstrumentVolume ? sliderInstrumentVolume.value : '80'
    };
  }
  captureBaselineSettings();

  function hasSettingsChanged() {
    if (!settingPlayerName) return false;
    if (!baselineSettings || typeof baselineSettings.playerName === 'undefined') {
      captureBaselineSettings();
      return false;
    }
    return (
      settingPlayerName.value !== baselineSettings.playerName ||
      sliderMasterVolume.value !== baselineSettings.masterVolume ||
      (sliderBrightness && sliderBrightness.value !== baselineSettings.brightness) ||
      sliderHorizSens.value !== baselineSettings.horizSens ||
      sliderVertSens.value !== baselineSettings.vertSens ||
      sliderInstrumentVolume.value !== baselineSettings.instrumentVolume
    );
  }

  function applySettings() {
    if (settingPlayerName && settingPlayerName.value.trim()) {
      const cleanName = settingPlayerName.value.trim();
      gameState.operatorName = cleanName;
      gameState.elecOperatorName = cleanName;
      gameState.netOperatorName = cleanName;
      const hudNameEl = document.getElementById('hudOperatorNameDisplay');
      if (hudNameEl) hudNameEl.textContent = cleanName;
      if (inputOperatorName) inputOperatorName.value = cleanName;
      const elecIn = document.getElementById('inputOperatorNameElec');
      if (elecIn) elecIn.value = cleanName;
      const netIn = document.getElementById('inputOperatorNameNet');
      if (netIn) netIn.value = cleanName;
      const menuNameEl = document.getElementById('menuOperatorName');
      if (menuNameEl) menuNameEl.textContent = cleanName;
      if (window.authManager && typeof window.authManager.saveLocalName === 'function') {
        window.authManager.saveLocalName(cleanName);
      }
    }
    if (sliderMasterVolume && bgMusic) {
      bgMusic.volume = (sliderMasterVolume.value / 100) * 0.5;
    }
    if (sliderBrightness) {
      applyGameBrightness(sliderBrightness.value);
    }
    if (sliderHorizSens) {
      window.horizSensitivity = parseInt(sliderHorizSens.value) || 80;
    }
    if (sliderVertSens) {
      window.vertSensitivity = parseInt(sliderVertSens.value) || 80;
    }
    if (sliderInstrumentVolume && clickSfx) {
      clickSfx.volume = (sliderInstrumentVolume.value / 100);
    }
  }

  function handleSettingsBack() {
    playClick();
    const returnTarget = (screenBeforeSettings && screenBeforeSettings !== 'settings') ? screenBeforeSettings : 'menu';
    if (hasSettingsChanged()) {
      showConfirmation('Really Wants save changes ?', () => {
        applySettings();
        captureBaselineSettings();
        showScreen(returnTarget);
      }, () => {
        if (settingPlayerName && baselineSettings.playerName) settingPlayerName.value = baselineSettings.playerName;
        if (sliderMasterVolume && baselineSettings.masterVolume) {
          sliderMasterVolume.value = baselineSettings.masterVolume;
          if (bgMusic) bgMusic.volume = (sliderMasterVolume.value / 100) * 0.5;
        }
        if (sliderBrightness && baselineSettings.brightness) {
          sliderBrightness.value = baselineSettings.brightness;
          applyGameBrightness(baselineSettings.brightness);
        updateSettingsValueBadges();
        }
        if (sliderHorizSens && baselineSettings.horizSens) {
          sliderHorizSens.value = baselineSettings.horizSens;
          window.horizSensitivity = parseInt(baselineSettings.horizSens) || 80;
        }
        if (sliderVertSens && baselineSettings.vertSens) {
          sliderVertSens.value = baselineSettings.vertSens;
          window.vertSensitivity = parseInt(baselineSettings.vertSens) || 80;
        }
        if (sliderInstrumentVolume && baselineSettings.instrumentVolume) {
          sliderInstrumentVolume.value = baselineSettings.instrumentVolume;
          if (clickSfx) clickSfx.volume = (sliderInstrumentVolume.value / 100);
        }
        showScreen(returnTarget);
      });
    } else {
      showScreen(returnTarget);
    }
  }

  if (btnSettingsBack) btnSettingsBack.addEventListener('click', handleSettingsBack);

  // --- Confirmation Pop-Up Modal (Node 381:273) ---
  const confirmationOverlay = document.getElementById('confirmationOverlay');
  const confirmationQuestionText = document.getElementById('confirmationQuestionText');
  const btnConfirmNo = document.getElementById('btnConfirmNo');
  const btnConfirmYes = document.getElementById('btnConfirmYes');

  let confirmCallbackYes = null;
  let confirmCallbackNo = null;

  function showConfirmation(questionText, onYes, onNo) {
    if (!confirmationOverlay || !confirmationQuestionText) return;
    confirmationQuestionText.textContent = questionText;
    confirmCallbackYes = onYes;
    confirmCallbackNo = onNo;
    confirmationOverlay.classList.remove('hidden');
  }

  function hideConfirmation() {
    if (!confirmationOverlay) return;
    confirmationOverlay.classList.add('hidden');
    confirmCallbackYes = null;
    confirmCallbackNo = null;
  }

  if (btnConfirmYes) {
    btnConfirmYes.addEventListener('click', () => {
      playClick();
      const cb = confirmCallbackYes;
      hideConfirmation();
      if (typeof cb === 'function') cb();
    });
  }

  if (btnConfirmNo) {
    btnConfirmNo.addEventListener('click', () => {
      playClick();
      const cb = confirmCallbackNo;
      hideConfirmation();
      if (typeof cb === 'function') cb();
    });
  }

  if (confirmationOverlay) {
    confirmationOverlay.addEventListener('click', (e) => {
      if (e.target === confirmationOverlay) {
        playClick();
        hideConfirmation();
      }
    });
  }

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const openModal = document.querySelector('.facility-modal-backdrop:not(.hidden)');
      if (openModal) {
        playClick();
        closeAllModals();
        return;
      }
      if (confirmationOverlay && !confirmationOverlay.classList.contains('hidden')) {
        playClick();
        hideConfirmation();
        return;
      }
      if (screens.objective?.classList.contains('active')) showScreen('missions');
      else if (screens.missions?.classList.contains('active')) showScreen('menu');
      else if (screens.proom?.classList.contains('active')) showScreen('room');
      else if (screens.room?.classList.contains('active')) showScreen('menu');
      else if (screens.settings?.classList.contains('active')) handleSettingsBack();
      else if (screens.facility?.classList.contains('active')) showScreen('menu');
    }
  });

  // --- Background Auto-Save Loop & Window Lifecycle Listeners ---
  setInterval(() => {
    if (activeScreenKey === 'facility' || document.querySelector('.facility-modal-backdrop:not(.hidden)')) {
      autoSaveGame();
    }
  }, 4000);

  // Refresh Continue button relative time every 10s on menu
  setInterval(() => {
    if (activeScreenKey === 'menu') {
      updateContinueButtonState();
    }
  }, 10000);

  window.addEventListener('beforeunload', () => autoSaveGame());
  window.addEventListener('pagehide', () => autoSaveGame());
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      autoSaveGame();
    }
  });

  // Initialize Continue button state on page load
  updateContinueButtonState();

  if (window.location.hash) {
    handleHashChange();
  }

  // =========================================================================
  // PHASE 02: TOOL DURABILITY COUNTDOWN & DYSFUNCTION TICKER
  // =========================================================================
  window.syncMultiplayerAssemblyStep = function(dept) {
    if (window.multiplayerManager) {
      const payload = {
        dept: dept,
        playerName: gameState.operatorName || gameState.elecOperatorName || gameState.netOperatorName || 'Engineer'
      };
      if (typeof window.multiplayerManager.broadcastSync === 'function') {
        window.multiplayerManager.broadcastSync('SYNC_ASSEMBLY_STEP_COMPLETE', payload);
      } else if (typeof window.multiplayerManager.broadcastSyncEvent === 'function') {
        window.multiplayerManager.broadcastSyncEvent('SYNC_ASSEMBLY_STEP_COMPLETE', payload);
      }
    }
  };

  // PHASE 02: GLOBAL TOOL DURABILITY & DYSFUNCTION TICKER (1-sec interval)
  setInterval(() => {
    if (!gameState || !gameState.toolTimers) return;
    const now = Date.now();
    let hasExpired = false;

    Object.keys(gameState.toolTimers).forEach(toolId => {
      const t = gameState.toolTimers[toolId];
      if (!t || !t.expiresAt) return;

      const remSec = Math.max(0, Math.floor((t.expiresAt - now) / 1000));
      const m = Math.floor(remSec / 60).toString().padStart(2, '0');
      const s = (remSec % 60).toString().padStart(2, '0');

      // Update HUD frame timer elements directly if visible
      const countEl = document.getElementById('timerCount_' + toolId);
      const fillEl = document.getElementById('timerFill_' + toolId);
      if (countEl) {
        countEl.textContent = remSec > 0 ? `${m}:${s}` : 'EXPIRED';
        const timerWrap = countEl.closest('.frame-slot-timer');
        if (timerWrap) {
          timerWrap.classList.toggle('critical-pulse', remSec <= 30 && remSec > 0);
          timerWrap.classList.toggle('expired', remSec === 0);
        }
      }
      if (fillEl && t.durationSec) {
        const pct = Math.max(0, Math.min(100, (remSec / t.durationSec) * 100));
        fillEl.style.width = pct + '%';
        fillEl.style.background = remSec > 60 ? '#10b981' : (remSec > 15 ? '#f59e0b' : '#ef4444');
      }

      // Update Marketplace Card timer elements directly if visible
      const cardWrap = document.getElementById('cardTimerWrap_' + toolId);
      const cardCount = document.getElementById('cardTimerCount_' + toolId);
      const cardFill = document.getElementById('cardTimerFill_' + toolId);
      if (cardWrap) {
        cardWrap.style.display = 'flex';
        cardWrap.classList.toggle('critical-pulse', remSec <= 30 && remSec > 0);
        cardWrap.classList.toggle('expired', remSec === 0);
      }
      if (cardCount) {
        cardCount.textContent = remSec > 0 ? `${m}:${s}` : 'EXPIRED';
      }
      if (cardFill && t.durationSec) {
        const pct = Math.max(0, Math.min(100, (remSec / t.durationSec) * 100));
        cardFill.style.width = pct + '%';
        cardFill.style.background = remSec > 60 ? '#10b981' : (remSec > 15 ? '#f59e0b' : '#ef4444');
      }

      // Check expiry trigger
      if (remSec === 0 && !gameState.toolDysfunctional[toolId]) {
        gameState.toolDysfunctional[toolId] = true;
        hasExpired = true;
        playErrorBuzzGlobal();
        showToast(`⚠️ [DYSFUNCTION]: ${t.name} (Level 0${t.tier}) has expired! Replace from Laptop.`, '💥');
      }
    });

    // Check remote roomEquippedTools for expiration
    if (gameState.roomEquippedTools) {
      Object.keys(gameState.roomEquippedTools).forEach(toolId => {
        const rTool = gameState.roomEquippedTools[toolId];
        if (rTool && rTool.expiresAt) {
          const remSec = Math.max(0, Math.floor((rTool.expiresAt - now) / 1000));
          if (remSec === 0) {
            delete gameState.roomEquippedTools[toolId];
            hasExpired = true;
          } else {
            const cardCount = document.getElementById('cardTimerCount_' + toolId);
            if (cardCount && isEquippedByRemotePlayer(toolId)) {
              const m = Math.floor(remSec / 60).toString().padStart(2, '0');
              const s = (remSec % 60).toString().padStart(2, '0');
              cardCount.textContent = `${m}:${s}`;
            }
          }
        }
      });
    }

    if (hasExpired) {
      updatePlayerFrameUI();
      renderMarketplace();
      renderMarketplaceElec();
      renderMarketplaceNet();
    }
  }, 1000);

  function playErrorBuzzGlobal() {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(110, ctx.currentTime);
      osc2.frequency.setValueAtTime(116, ctx.currentTime);
      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.36);
      osc2.stop(ctx.currentTime + 0.36);
    } catch(e) {}
  }
  // =========================================================================
  // PHASE 04: STS-31 LAUNCH & LEO SIMULATION + MISSION COMPLETE ENDING
  // =========================================================================
  function triggerLaunchSequence() {
    if (typeof closeAllModals === 'function') closeAllModals();
    if (window.multiplayerManager?.broadcastSync) {
      window.multiplayerManager.broadcastSync('SYNC_TRIGGER_LAUNCH', {
        timestamp: Date.now()
      });
    }
    showToast('STS-31 LAUNCH SEQUENCE INITIATED: T-10s to liftoff!', '🚀');
    showScreen('simulation');
  }
  window.triggerLaunchSequence = triggerLaunchSequence;

  const btnSkipSim = document.getElementById('btnSkipSimulation');
  if (btnSkipSim) {
    btnSkipSim.addEventListener('click', () => {
      playClick();
      if (window.launchSimulationInstance) {
        window.launchSimulationInstance.stop();
      }
      showScreen('ending');
    });
  }

  ['btnEndingReplay', 'btnEndingReplayBottom'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        playClick();
        triggerLaunchSequence();
      });
    }
  });

  ['btnEndingMenu', 'btnEndingBackToMenu'].forEach(id => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        playClick();
        showScreen('menu');
      });
    }
  });

  const btnEndingBackToFacility = document.getElementById('btnEndingBackToFacility');
  if (btnEndingBackToFacility) {
    btnEndingBackToFacility.addEventListener('click', () => {
      playClick();
      showScreen('facility');
    });
  }

  // =========================================================================
  // NASA MISSION DECISION AUDIT & FLIGHT REPORT RENDERER
  // =========================================================================
  function renderMissionDecisionAudit() {
    if (!window.DecisionManager || typeof window.DecisionManager.calculateFlightAudit !== 'function') return;
    const audit = window.DecisionManager.calculateFlightAudit();

    const pill = document.getElementById('auditScorePill');
    const badge = document.getElementById('auditStatusBadge');
    const list = document.getElementById('auditDirectivesList');

    if (pill) {
      pill.textContent = `FLIGHT READINESS: ${audit.scorePercent}% [GRADE: ${audit.grade}]`;
      pill.style.color = audit.scorePercent >= 80 ? '#10b981' : audit.scorePercent >= 50 ? '#f59e0b' : '#ef4444';
    }
    if (badge) {
      badge.textContent = audit.statusText;
      badge.className = `audit-status-badge ${audit.isMissionFailure ? 'failed' : 'nominal'}`;
    }

    if (list) {
      list.innerHTML = audit.details.map(d => `
        <div class="audit-directive-card ${d.isNominal ? 'nominal' : 'flagged'}">
          <div class="audit-dir-head">
            <span class="audit-dir-title"><strong>[${d.directiveCode}]</strong> ${d.title} (${d.subsystem})</span>
            <span class="audit-dir-badge ${d.isNominal ? 'nominal' : 'shortcut'}">${d.isNominal ? '✓ FLIGHT NOMINAL' : '✗ SHORTCUT LOGGED'}</span>
          </div>
          <p class="audit-dir-explain">
            ${d.isNominal 
              ? `<strong>Decision: YES (Approved).</strong> ${d.correctRationale}`
              : `<strong>Decision: NO (Bypassed).</strong> <span style="color:#ef4444;">${d.shortcutConsequence}</span><br/><span style="color:#38bdf8;">${d.recommendation}</span>`
            }
          </p>
        </div>
      `).join('');
    }

    // Dynamic Contract Payout calculation based on decision quality
    const totalPayoutEl = document.querySelector('[data-node-id="470:1404"]');
    if (totalPayoutEl) {
      const basePayout = 105;
      const finalPayout = Math.max(0, basePayout - audit.penaltyDeduction);
      totalPayoutEl.textContent = `$ ${finalPayout}M`;
      if (audit.isMissionFailure) {
        totalPayoutEl.style.color = '#ef4444';
      } else {
        totalPayoutEl.style.color = '#38bdf8';
      }
    }
  }
  window.renderMissionDecisionAudit = renderMissionDecisionAudit;

  // Initialize Horizon-X Mobile & Touch Interactive Controls Manager
  if (typeof window.MobileControlsManager === 'function') {
    window.mobileControlsManager = new window.MobileControlsManager();
  }
});
