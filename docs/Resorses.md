# Official NASA Space Apps Challenge Resources Specification

## 1. Document Overview
This document details the official reference materials, tools, datasets, frameworks, and scientific guidelines provided for the NASA Space Apps Challenge Space Mission Design Game. These resources define the systems engineering standards, orbital physics models, and educational objectives required for an authentic space observatory design and assembly simulation.

---

## 2. Primary NASA Resources Breakdown

### 2.1 Design and Develop Science Missions
- Source: NASA Science Mission Directorate & NASA Systems Engineering Handbook (NASA SP-2016-6105 Rev 2).
- Key Concept: Systems engineering methodology governing the full lifecycle of a NASA space mission (Phase A through Phase F).
- The Four Major Mission Segments:
  1. Launch Segment: Launch vehicle selection (Space Shuttle STS-31 stack), ascent trajectory, stage separation, and orbital insertion services.
  2. Space Segment: Spacecraft bus structure, payload scientific instruments, solar arrays (SADM), gyroscopes (RSU), power distribution, and high-gain communication antennas.
  3. Ground Segment: NASA Goddard Space Flight Center (GSFC) cleanroom integration facility, metrology tooling, and network ground communication stations.
  4. User Segment: Astrophysics data processing, telemetry verification, and scientific deep-space imaging (e.g. M100 Galactic Core survey).

### 2.2 NASA General Mission Analysis Tool (GMAT R2026a)
- Source: NASA Goddard Space Flight Center (GSFC), software.nasa.gov.
- Capabilities: Enterprise-grade orbital mechanics and flight trajectory software used for real NASA flight dynamics.
- Technical Parameters for Hubble Space Telescope (HST / STS-31):
  - Central Gravity Body: Earth with JGM-3 20x20 spherical harmonic geopotential model.
  - Numerical Integrator: Runge-Kutta 8(9) Prince-Dormand variable step integrator.
  - Semi-Major Axis (a): 6,971.5 km.
  - Orbital Altitude (h): 593.2 km (Low Earth Orbit - LEO).
  - Orbital Inclination (i): 28.47 degrees.
  - Orbit Eccentricity (e): 0.00028 (near-circular orbit).
  - Orbital Period (T): 96.5 minutes (~14.9 revolutions per day).
  - Staging Sequence: Solid Rocket Booster (SRB) burnout, External Tank (ET) jettison, and payload bay deployment.

### 2.3 JPL Concept Maturity Levels (CML 1 to CML 4)
- Source: NASA Jet Propulsion Laboratory (JPL) Architecture Trade-Study Framework.
- Progression Model:
  - CML 1 (Concept Definition): Initial scientific objective formulation (e.g., ultraviolet optical deep-field survey).
  - CML 2 (Feasibility Assessment): Project constraints, financial budget boundaries ($150,000 baseline), and operational shift duration.
  - CML 3 (Trade Studies): Multi-tier procurement trade-offs evaluating cost versus durability, precision, and tool specifications.
  - CML 4 (Point Design): Final subsystem hardware mounting, metrology tolerance checking, and flight certification.

### 2.4 GSFC Mission Design Lab (MDL)
- Source: Goddard Space Flight Center Integrated Design Center (IDC).
- Collaborative Concurrent Engineering Protocols:
  - Multidisciplinary engineering disciplines working in parallel across dedicated technical desks.
  - Rapid feasibility assessments and engineering directivity evaluations before hardware lock.
  - Real-time resolution of subsystem conflicts across mechanical, electrical, thermal, and communication systems.

### 2.5 NASA Mission Viz & 3D WebGL Frameworks
- Source: NASA Open Source Software & WebGL Spatial Visualization Initiatives.
- Key Principles:
  - Interactive first-person and third-person real-time 3D environments.
  - Intuitive visualization of orbital trajectories, spacecraft spatial attitudes, and cleanroom assembly bays.
  - Bridging rigorous numerical telemetry data with accessible interactive visual graphics.

### 2.6 A Learning Game About Telescopes (Webb: Build It Yourself)
- Source: NASA Science Mission Directorate Educational Gaming Division.
- Core Educational Paradigm:
  - The fundamental rule of space observatory design: Scientific objectives dictate engineering constraints.
  - Selecting astronomical targets (optical/UV stars, infrared proto-galaxies, high-energy X-ray pulsars) determines required optical mirror coatings, sensor types, and cryogenic thermal dissipation needs.
  - Historical mission matching comparing completed student designs against authentic NASA observatories (Hubble, JWST, Chandra, Nancy Grace Roman).

### 2.7 NASA CubeSat 101 & Workmanship Technical Standards
- Source: NASA CubeSat Launch Initiative (CSLI) & NASA Office of Safety and Mission Assurance (OSMA).
- Technical Directives Enforced:
  - NASA-STD-5020: Requirements for Threaded Fastening System Preload and Margin of Safety.
  - NASA-STD-8739.3: Soldered Electrical Connections and Class 3 High-Reliability Standards.
  - NASA-STD-8739.5: Fiber Optic and Coaxial Cable Harness Assemblies and Shielding.
  - Mil-Spec hermetic sealing and galvanic optocoupler signal isolation protocols.

### 2.8 2023 NASA Space Apps 3D/VR Visualization Challenge
- Core Requirements:
  - Real-time 3D spatial dynamics and navigation.
  - Sequential chronological mission timeline from assembly to launch.
  - Contextual interaction systems (interact, inspect, sprint, tools).
  - Cross-platform responsiveness including mobile virtual touch controls.

### 2.9 Canadian Space Agency (CSA) Youth Educational Games
- Educational Guidelines:
  - Age-appropriate tiered complexity modes (Age 13+ secondary school vs professional engineering).
  - Clear visual feedback on errors without dead ends.
  - Gamification of mission budgeting, time constraints, and team coordination.
