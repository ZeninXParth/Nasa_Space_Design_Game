/**
 * 🛰️ Horizon-X | NASA Engineering Decision Manager
 * Authoritative Decision Matrix & Evaluation Engine across Mechanical, Electronic, and Network Workbenches.
 * Evaluates Good vs Bad Decisions, feeds into STS-31 Launch/Orbit Simulation, and generates Post-Mission Debriefing Reports.
 */

(function (window) {
  'use strict';

  const ENGINEERING_DIRECTIVES = {
    mech_task1: {
      dept: 'mech',
      taskIndex: 1,
      directiveCode: 'ENG-M01',
      title: 'Inert Nitrogen Cryogenic Purge Protocol',
      subsystem: 'RSU-02 Gyroscopic Canister',
      question: 'Execute High-Purity Nitrogen Purge Protocol to evacuate ambient moisture before bolt torque lock?',
      yesOption: {
        label: 'YES — APPROVE PURGE',
        desc: 'Eliminates moisture; zero gyro bearing crystallization in cryogenic LEO orbit.',
        isNominal: true,
        badge: 'FLIGHT NOMINAL'
      },
      noOption: {
        label: 'NO — EXPEDITE SHORTCUT',
        desc: 'Saves time, but trapped humidity risks bearing icing and attitude drift jitter in orbit.',
        isNominal: false,
        badge: 'HIGH RISK SHORTCUT'
      },
      correctRationale: 'Standard NASA GSFC cleanroom protocol requires inert nitrogen purging for sealed gyro canisters to prevent moisture condensation and orbital crystallization at -150°C.',
      shortcutConsequence: 'Moisture iced the RSU-02 bearings in LEO, causing high-frequency attitude drift and unstable guide-star locking.'
    },
    mech_task2: {
      dept: 'mech',
      taskIndex: 2,
      directiveCode: 'ENG-M02',
      title: 'Cryogenic Beryllium-Copper Dry Lubricant',
      subsystem: 'SADM Solar Array Drive Mechanism',
      question: 'Apply Cryogenic Beryllium-Copper Dry-Film Lubricant coat to the solar array drive gear teeth?',
      yesOption: {
        label: 'YES — APPLY COATING',
        desc: 'Prevents vacuum cold-welding across -150°C to +120°C day/night thermal cycling.',
        isNominal: true,
        badge: 'FLIGHT NOMINAL'
      },
      noOption: {
        label: 'NO — BYPASS COATING',
        desc: 'Drive gears risk vacuum cold-welding during orbital day/night sun-tracking cycles.',
        isNominal: false,
        badge: 'HIGH RISK SHORTCUT'
      },
      correctRationale: 'In space vacuum, bare metal gear teeth cold-weld instantly upon friction. Dry-film molybdenum/beryllium lubricant prevents drive seizure during solar tracking.',
      shortcutConsequence: 'Solar array drive seized in orbit during orbital sunrise, reducing solar array power generation by 35%.'
    },
    elec_task1: {
      dept: 'elec',
      taskIndex: 1,
      directiveCode: 'ENG-E01',
      title: 'Radiation-Hardened ECC Parity Buffer Activation',
      subsystem: 'DF-224 Flight Computer Board',
      question: 'Activate Radiation-Hardened Error Correction Code (ECC) & Parity Buffering on the DF-224 memory bus?',
      yesOption: {
        label: 'YES — ACTIVATE ECC',
        desc: 'Protects flight computer memory from South Atlantic Anomaly (SAA) cosmic ray bit-flips.',
        isNominal: true,
        badge: 'FLIGHT NOMINAL'
      },
      noOption: {
        label: 'NO — MINIMIZE POWER',
        desc: 'Lowers current draw by 40mA, but leaves memory unprotected against single-event upsets (SEU).',
        isNominal: false,
        badge: 'HIGH RISK SHORTCUT'
      },
      correctRationale: 'Passing through the South Atlantic Anomaly subjects Hubble to intense trapped proton flux. ECC parity buffering is critical to prevent computer crashes and Safe-Mode transitions.',
      shortcutConsequence: 'A cosmic ray flipped a bit in the attitude control RAM while in the SAA, triggering an emergency computer restart.'
    },
    elec_task2: {
      dept: 'elec',
      taskIndex: 2,
      directiveCode: 'ENG-E02',
      title: '-40°C Thermoelectric Peltier Pre-Chill',
      subsystem: 'FGS Fine Guidance Sensor',
      question: 'Engage -40°C Thermoelectric Peltier Pre-Cooling test on the Fine Guidance Sensor photodiode matrix?',
      yesOption: {
        label: 'YES — PRE-CHILL MATRIX',
        desc: 'Eliminates thermal dark-current noise, ensuring 0.007 arcsec sub-pixel star tracking.',
        isNominal: true,
        badge: 'FLIGHT NOMINAL'
      },
      noOption: {
        label: 'NO — AMBIENT LOCK',
        desc: 'Skips chill cycle; higher sensor noise floor risks guide star acquisition loss.',
        isNominal: false,
        badge: 'HIGH RISK SHORTCUT'
      },
      correctRationale: 'FGS optical interferometer detectors require cryogenic dark-current suppression to differentiate faint 14th-magnitude guide stars from thermal sensor noise.',
      shortcutConsequence: 'High thermal sensor noise caused guide star acquisition lock delays, postponing the first science observation.'
    },
    net_task1: {
      dept: 'net',
      taskIndex: 1,
      directiveCode: 'ENG-N01',
      title: 'Gold-Kapton RF-Shielding Wrap',
      subsystem: 'High-Gain Antenna (HGA) Ku-Band Feed Horn',
      question: 'Apply Gold-Kapton RF-shielding wrap around the feed horn waveguide junction?',
      yesOption: {
        label: 'YES — APPLY RF WRAP',
        desc: 'Blocks electromagnetic interference (EMI) leakage with orbiter Ku-band radar during release.',
        isNominal: true,
        badge: 'FLIGHT NOMINAL'
      },
      noOption: {
        label: 'NO — LEAVE UNWRAPPED',
        desc: 'Bare waveguide allows RF harmonics leakage, degrading downlink signal-to-noise ratio.',
        isNominal: false,
        badge: 'HIGH RISK SHORTCUT'
      },
      correctRationale: 'Space Shuttle orbiter radar harmonics interfere with unshielded Ku-band feeds. Gold-Kapton multi-layer wrap guarantees clean high-speed telemetry downlink.',
      shortcutConsequence: 'Orbital telemetry experienced 35% signal-to-noise degradation due to radar EMI leakage.'
    },
    net_task2: {
      dept: 'net',
      taskIndex: 2,
      directiveCode: 'ENG-N02',
      title: 'Dual-Pass OTDR Return-Loss Verification',
      subsystem: 'SI-C&DH Optical Fiber Splice Module',
      question: 'Execute Dual-Pass Optical Time-Domain Reflectometer (OTDR) return-loss attenuation scan?',
      yesOption: {
        label: 'YES — RUN OTDR SCAN',
        desc: 'Verifies optical return loss < -60 dB, preventing laser back-reflection into science data bus.',
        isNominal: true,
        badge: 'FLIGHT NOMINAL'
      },
      noOption: {
        label: 'NO — VISUAL APPROVAL ONLY',
        desc: 'Saves time; unverified micro-cracks risk science image packet dropouts in orbit.',
        isNominal: false,
        badge: 'HIGH RISK SHORTCUT'
      },
      correctRationale: 'Sub-micron optical fiber core splices require bi-directional OTDR reflectance testing to ensure high-rate science image packets do not encounter back-reflection distortion.',
      shortcutConsequence: 'Intermittent optical packet loss forced the SI-C&DH data rate to throttle down to 0.4 Mbps.'
    }
  };

  class DecisionManager {
    constructor() {
      this.directives = ENGINEERING_DIRECTIVES;
      this.currentCallback = null;
      this.currentTaskKey = null;
      this.init();
    }

    init() {
      // Ensure gameState contains decision ledger
      if (typeof window.gameState !== 'undefined' && !window.gameState.decisions) {
        window.gameState.decisions = {
          mech_task1: null,
          mech_task2: null,
          elec_task1: null,
          elec_task2: null,
          net_task1: null,
          net_task2: null
        };
        window.gameState.decisionLogs = [];
      }
    }

    getDecision(taskKey) {
      if (window.gameState && window.gameState.decisions) {
        return window.gameState.decisions[taskKey];
      }
      return null;
    }

    hasMadeDecision(taskKey) {
      const d = this.getDecision(taskKey);
      return d !== null && d !== undefined;
    }

    recordDecision(taskKey, approvedYes) {
      const dir = this.directives[taskKey];
      if (!dir) return;

      if (!window.gameState) window.gameState = {};
      if (!window.gameState.decisions) {
        window.gameState.decisions = {
          mech_task1: null, mech_task2: null,
          elec_task1: null, elec_task2: null,
          net_task1: null, net_task2: null
        };
      }
      if (!window.gameState.decisionLogs) window.gameState.decisionLogs = [];

      window.gameState.decisions[taskKey] = approvedYes;

      const record = {
        taskKey,
        dept: dir.dept,
        directiveCode: dir.directiveCode,
        title: dir.title,
        subsystem: dir.subsystem,
        choice: approvedYes ? 'YES' : 'NO',
        isNominal: approvedYes === dir.yesOption.isNominal,
        timestamp: new Date().toISOString()
      };

      // Replace previous record if exists, or append
      const idx = window.gameState.decisionLogs.findIndex(l => l.taskKey === taskKey);
      if (idx >= 0) {
        window.gameState.decisionLogs[idx] = record;
      } else {
        window.gameState.decisionLogs.push(record);
      }

      // Broadcast multiplayer sync if available
      if (window.multiplayer && typeof window.multiplayer.broadcast === 'function') {
        window.multiplayer.broadcast({
          type: 'SYNC_ENGINEERING_DECISION',
          taskKey,
          approvedYes,
          record
        });
      }

      return record;
    }

    promptDecision(taskKey, onComplete) {
      const dir = this.directives[taskKey];
      if (!dir) {
        if (typeof onComplete === 'function') onComplete(true);
        return;
      }

      // If already decided, proceed directly
      if (this.hasMadeDecision(taskKey)) {
        if (typeof onComplete === 'function') onComplete(this.getDecision(taskKey));
        return;
      }

      this.currentTaskKey = taskKey;
      this.currentCallback = onComplete;

      const modal = document.getElementById('modalEngineeringDecision');
      if (!modal) {
        // Fallback: auto-approve if modal markup not present
        this.recordDecision(taskKey, true);
        if (typeof onComplete === 'function') onComplete(true);
        return;
      }

      // Populate Modal Content
      const badge = document.getElementById('decDirectiveBadge');
      const title = document.getElementById('decTitle');
      const sub = document.getElementById('decSubsystem');
      const qText = document.getElementById('decQuestionText');
      const yesLbl = document.getElementById('decYesLabel');
      const yesDesc = document.getElementById('decYesDesc');
      const noLbl = document.getElementById('decNoLabel');
      const noDesc = document.getElementById('decNoDesc');

      if (badge) badge.textContent = `DIRECTIVE: ${dir.directiveCode} // ${dir.dept.toUpperCase()} DIVISION`;
      if (title) title.textContent = dir.title;
      if (sub) sub.textContent = `SUBSYSTEM: ${dir.subsystem.toUpperCase()}`;
      if (qText) qText.textContent = dir.question;
      if (yesLbl) yesLbl.textContent = dir.yesOption.label;
      if (yesDesc) yesDesc.textContent = dir.yesOption.desc;
      if (noLbl) noLbl.textContent = dir.noOption.label;
      if (noDesc) noDesc.textContent = dir.noOption.desc;

      // Show modal
      modal.classList.remove('hidden');
      modal.setAttribute('aria-hidden', 'false');

      // Wire YES & NO button actions
      const btnYes = document.getElementById('btnDecisionYes');
      const btnNo = document.getElementById('btnDecisionNo');

      const handleChoice = (isYes) => {
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        window.removeEventListener('keydown', keyListener);

        const rec = this.recordDecision(taskKey, isYes);

        if (window.showToast) {
          if (isYes) {
            window.showToast(`✓ DIRECTIVE APPROVED: ${dir.directiveCode} Flight Nominal Protocol Verified!`, '✨');
          } else {
            window.showToast(`⚠️ SHORTCUT LOGGED: ${dir.directiveCode} bypassed. Mission risk recorded!`, 'warning');
          }
        }

        if (typeof this.currentCallback === 'function') {
          this.currentCallback(isYes, rec);
          this.currentCallback = null;
        }
      };

      if (btnYes) btnYes.onclick = () => handleChoice(true);
      if (btnNo) btnNo.onclick = () => handleChoice(false);

      // Keyboard hotkeys: Y = Yes, N = No
      const keyListener = (e) => {
        if (modal.classList.contains('hidden')) return;
        if (e.key === 'y' || e.key === 'Y') {
          e.preventDefault();
          handleChoice(true);
        } else if (e.key === 'n' || e.key === 'N') {
          e.preventDefault();
          handleChoice(false);
        }
      };
      window.addEventListener('keydown', keyListener);
    }

    calculateFlightAudit() {
      const logs = (window.gameState && window.gameState.decisionLogs) || [];
      const totalDecisions = 6;
      let nominalCount = 0;
      let shortcutCount = 0;

      const details = [];

      for (const [key, dir] of Object.entries(this.directives)) {
        const choice = (window.gameState && window.gameState.decisions && window.gameState.decisions[key]);
        const isNominal = choice === true;
        if (choice === true) nominalCount++;
        else if (choice === false) shortcutCount++;

        details.push({
          key,
          directiveCode: dir.directiveCode,
          dept: dir.dept,
          title: dir.title,
          subsystem: dir.subsystem,
          decisionMade: choice === true ? 'YES (Approved)' : choice === false ? 'NO (Bypassed)' : 'NOT RECORDED',
          isNominal,
          correctRationale: dir.correctRationale,
          shortcutConsequence: dir.shortcutConsequence,
          recommendation: isNominal 
            ? 'Nominal decision executed. Preserved flight certification.'
            : `Correction Needed: Player chose NO (Bypass). Correct decision: ${dir.yesOption.label}. ${dir.correctRationale}`
        });
      }

      const scorePercent = Math.round((nominalCount / totalDecisions) * 100);
      let grade = 'A+';
      let statusText = 'EXEMPLARY FLIGHT RATING';
      let isMissionFailure = false;
      let penaltyDeduction = 0;

      if (scorePercent === 100) {
        grade = 'A+';
        statusText = 'FLIGHT NOMINAL // ALL DIRECTIVES CERTIFIED';
        penaltyDeduction = 0;
      } else if (scorePercent >= 80) {
        grade = 'B+';
        statusText = 'ACCEPTABLE // MINOR TELEMETRY ANOMALIES';
        penaltyDeduction = 15; // $15M deduction
      } else if (scorePercent >= 50) {
        grade = 'C-';
        statusText = 'SUB-NOMINAL // HIGH RISK ORBITAL SAFE MODE';
        penaltyDeduction = 40; // $40M deduction
      } else {
        grade = 'F';
        statusText = 'CRITICAL MISSION FAILURE // SHORTCUTS COMPROMISED PAYLOAD';
        isMissionFailure = true;
        penaltyDeduction = 75; // $75M deduction (forfeits primary payout)
      }

      return {
        totalDecisions,
        nominalCount,
        shortcutCount,
        scorePercent,
        grade,
        statusText,
        isMissionFailure,
        penaltyDeduction,
        details
      };
    }
  }

  // Global Exports per AGENTS.md Rule 1
  window.ENGINEERING_DIRECTIVES = ENGINEERING_DIRECTIVES;
  window.DecisionManager = new DecisionManager();

})(window);
