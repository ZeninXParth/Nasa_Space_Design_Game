# Horizon-X Documentation Master Index

## 1. Project Overview
Horizon-X is a multi-department 3D aerospace engineering simulation and educational game built for the NASA Space Apps Challenge. Players collaborate as Mechanical, Electronic, and Network engineers to assemble, verify, and launch the Hubble Space Telescope into Low Earth Orbit following NASA Goddard Space Flight Center standards.

## 2. Documentation Structure

### 2.1 PDF Specifications
- `docs/nasa_space_design_game.pdf`: Comprehensive project game design specification document.
- `docs/nasa_resources.pdf`: Curated NASA technical resources, APIs, and mission data references.

### 2.2 Phase Specifications and Worksheets
- `docs/phases/Phase_02_instructions.md`: Phase 02 Main HUD, Check-in, Marketplace, and Department Workbenches.
- `docs/phases/Phase_02_implementation.txt`: Implementation milestones for Phase 02.
- `docs/phases/Phase_02_Error_handling.txt`: Error handling protocols for Phase 02.
- `docs/phases/Phase_02_debugging.md`: Debugging logs, canvas resolution, and coordinate verification.
- `docs/phases/Phase_03_Worksheet_Instructions.md`: Phase 03 3D Lobby environment, spawn state, and facility keycard access.
- `docs/phases/Phase_04_Launch_Simulation_Instructions.md`: Phase 04 STS-31 Shuttle Launch Simulation, NASA GMAT telemetry, and GSFC Engineering Directives.
- `docs/phases/Phase_05_Telescope_Targets_Instructions.md`: Phase 05 Space Mission Targets (HST, JWST, Chandra), Cleanroom GSE Platform overhaul, and Educational Complexity Modes.

### 2.3 Technical References
- `docs/Resorses.md`: Complete specification of official NASA Space Apps Challenge reference materials, tools, datasets, and frameworks.
- `docs/Implemented_Resorses.md`: Concrete implementation evidence and source code mapping for every NASA resource in Horizon-X.
- `docs/NASA_RESOURCES.md`: Official NASA data sources, tools, and technical citations:
  - NASA GMAT R2026a (General Mission Analysis Tool)
  - NASA Systems Engineering Handbook (NASA SP-2016-6105 Rev 2)
  - NASA CubeSat 101 Guidelines
  - GSFC Mission Design Lab (MDL) and Concurrent Modeling
  - NASA Technical Standards (NASA-STD-5020, NASA-STD-8739)

## 3. Department Breakdown
- Desk 01: Mechanical Department (workbench3d.js, sadm3d.js)
  - Subsystems: RSU-02 Gyro Canister, SADM Solar Array Drive Mechanism
- Desk 02: Electronic Department (electronicsWorkbench3d.js)
  - Subsystems: DF-224 Flight Computer PCB, Fine Guidance Sensor (FGS)
- Desk 03: Network Department (networkWorkbench3d.js)
  - Subsystems: High-Gain Antenna (HGA) Dish, Optical Fiber Splicer

## 4. Architectural Rules
All development follows the invariants defined in the root AGENTS.md:
- Rule 1: Always explicitly export classes to the window global object.
- Rule 2: Always update cache-busting version query parameters (?v=X.XX) in index.html when modifying script or style files.
- Rule 3: Verify fundamental DOM elements and canvas existence before adjusting 3D camera mathematics.
- Rule 4: Git and branch hygiene: Pull before coding, never force push, and maintain clean commit logs.
- Rule 5: Keep department states and event listeners isolated.
