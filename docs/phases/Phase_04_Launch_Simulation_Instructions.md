# Phase 04: STS-31 Launch Simulation, GMAT Telemetry & Engineering Directives

## 1. Overview
Phase 04 implements the STS-31 Space Shuttle Launch Simulation, live NASA GMAT R2026a orbital mechanics telemetry integration, and the Goddard Space Flight Center Engineering Directive Decision System.

## 2. Key Components

### 2.1 Launch Simulation (STS-31 Shuttle Liftoff)
- Launch complex LC-39A visual staging.
- Dynamic timeline:
  - T-0s: Solid Rocket Booster (SRB) Ignition and Liftoff.
  - T+15s: Roll maneuver and ascent trajectory.
  - T+45s: Max-Q aerodynamic pressure peak.
  - T+120s: SRB burnout and staging separation.
  - T+240s: Main Engine Cut-Off (MECO) and External Tank (ET) jettison.
  - T+360s: Low Earth Orbit (LEO) insertion at 593.2 km altitude.
  - Deployment: Hubble Space Telescope released from Discovery cargo bay.

### 2.2 NASA GMAT R2026a Orbital Telemetry HUD
- Real-time telemetry card displaying orbital parameters:
  - Central Gravity Model: Earth JGM-3 20x20 Geopotential.
  - Numerical Integrator: Runge-Kutta 8(9) variable step.
  - Semi-Major Axis (a): 6,971.5 km.
  - Orbital Altitude (h): 593.2 km LEO.
  - Inclination (i): 28.47 degrees.
  - Eccentricity (e): 0.00028.
  - Orbital Period (T): 96.5 minutes.

### 2.3 GSFC Engineering Directive Decisions
- Directives across three departments:
  - ENG-M01: Dual O-Ring Hermetic Seal Protocol (Mechanical Task 1).
  - ENG-M02: NASA-STD-5020 Threaded Preload Verification (Mechanical Task 2).
  - ENG-E01: NASA-STD-8739.3 Class 3 Mil-Spec Solder Inspection (Electronic Task 1).
  - ENG-E02: Optocoupler Galvanic Isolation Protocol (Electronic Task 2).
  - ENG-N01: Microwave Coaxial Torque Locking and Phase Calibration (Network Task 1).
  - ENG-N02: NASA-STD-8739.5 Double-Braid Grounding and Fiber Splicing (Network Task 2).
- Flight Audit Scoring:
  - 100% Nominal score yields Grade A+ and GSFC Flight Clearance.
  - Non-standard shortcut decisions deduct penalties and report specific corrective actions.

### 2.4 Mission Debriefing & Ending Screen
- Comprehensive flight audit review.
- Real NASA Historical Matcher Card comparing spacecraft specs to HST STS-31 flight architecture.
- GMAT Mission Design Lab Flight Clearance Certificate.
- Direct replay controls.
