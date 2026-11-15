# 🛰️ NASA Space Apps Challenge — Official Data & Resources

This document compiles the official resources published for the NASA Space Apps Challenge and maps their technical directives, datasets, and frameworks directly to the **Horizon-X** interactive 3D space mission design simulation.

---

## 📚 1. Official NASA Data & Resources

### 1.1 [Design and Develop Science Missions](https://www.nasa.gov/wp-content/uploads/2025/04/250323-design-and-develop-science-mission.pdf?emrc=a454cf)
* **Overview:** A comprehensive systems-engineering approach used by NASA to develop scientific space missions. Explains how a mission progresses from an initial scientific need through requirements definition, design, verification, and implementation.
* **The Four Major Mission Segments:**
  1. **Launch Segment:** The launch vehicle and services required to place the mission in space.
  2. **Space Segment:** Spacecraft, instruments, orbiters, landers, or rovers used to conduct the mission.
  3. **Ground Segment:** Ground stations and mission-control facilities responsible for communication, data reception, and mission management.
  4. **User Segment:** Scientists and other users who analyse and apply the mission's data.

### 1.2 [General Mission Analysis Tool (GMAT)](https://software.nasa.gov/software/GSC-19468-1)
* **Overview:** Open-source, enterprise-level software system developed to support the design, analysis, optimization, and navigation of space missions. Developed through collaboration involving NASA, private industry, academia, and other contributors.
* **Capabilities:**
  * Modeling and analysing spacecraft trajectories across low Earth orbit (LEO), geostationary, highly elliptical orbits, lunar missions, libration-point trajectories, interplanetary transfers, and deep-space exploration.
  * High-fidelity physical models for spacecraft, propulsion systems, trajectories, and orbital manoeuvres.
  * Orbit propagation, trajectory optimization, orbit determination, navigation-data simulation, launch-window analysis, manoeuvre planning, and engineering trade-off evaluations.
  * Visualization of mission parameters, plots, reports, and analytical outputs.

### 1.3 [Concept Maturity Levels (CMLs)](https://dataverse.jpl.nasa.gov/dataset.xhtml?persistentId=hdl:2014/44299)
* **Overview:** A framework developed by NASA’s Jet Propulsion Laboratory (JPL) to measure and progressively develop the maturity of a space mission concept before entering formal project formulation.
* **Progression:**
  * Stages mission development from **CML 1** (initial mission idea) through increasingly detailed levels involving feasibility analysis, trade studies, point design, implementation planning, and detailed engineering.
  * Primary emphasis on **CML 1–4**, where the pivotal architectural and trade-study design decisions are made.

### 1.4 [Mission Design Lab (MDL)](https://etd.gsfc.nasa.gov/capabilities/integrated-design-center/mission-design-lab/)
* **Overview:** NASA’s collaborative concurrent engineering environment at Goddard Space Flight Center (GSFC) where engineers and scientists rapidly develop and evaluate space mission concepts.
* **Study Levels:**
  * **Office Hours:** Rapid brainstorming and identification of major technical hurdles.
  * **Concept Development:** Feasibility, risk assessment, and system boundaries.
  * **Trade Studies:** Comparative analysis of mission architectures and design options.
  * **Point Design:** Detailed technical design including CAD models, equipment lists, engineering models, and cost estimates.
* **Comprehensive Multidisciplinary Analysis:**
  * Complete mission coverage: Orbit & trajectory, spacecraft, communications, ground systems, launch vehicle, mission operations, and end-of-mission planning.
  * Spacecraft disciplines: Power, propulsion, thermal, structures, avionics, communications, attitude control, flight software, reliability, cost, and risk.

### 1.5 [NASA Mission Viz](https://nasa.github.io/mission-viz/)
* **Overview:** An interactive, web-based visualization environment designed to represent and explore space mission concepts and trajectories in real-time 3D.
* **Key Features:**
  * 3D space environment with interactive celestial bodies, spacecraft, and orbital trajectories.
  * Dynamic spatial and temporal exploration, viewpoint changes, and intuitive understanding of orbital mechanics and interplanetary dynamics.
  * Bridges numerical data with visual storytelling to communicate mission objectives, spacecraft movement, and mission events.

### 1.6 [A Learning Game About Telescopes (Webb: Build It Yourself)](https://science.nasa.gov/mission/webb/game-build-it-yourself/)
* **Overview:** Educational simulation where the player acts as a scientist designing a space telescope, demonstrating how scientific objectives dictate engineering parameters.
* **Gameplay Dynamics:**
  * Selection of scientific objectives -> Constrained selection of wavelengths, scientific instruments, and optical systems.
  * 3 levels of increasing complexity, teaching how ambitious science requires coordinated engineering trade-offs.
  * Animated launch sequence, scientific return evaluation, and mapping virtual designs to real NASA flight missions.

### 1.7 [CubeSat 101 - Basic Concepts and Processes for First-Time CubeSat Developers](https://www3.nasa.gov/sites/default/files/atoms/files/nasa_csli_cubesat_101_508.pdf)
* **Overview:** Essential handbook created by NASA’s CubeSat Launch Initiative (CSLI) providing fundamental concepts across all mission phases—from Concept of Operations (ConOps) to launch integration and orbital operations.

### 1.8 [Visualize a Space Mission Using Virtual Reality (2023 NASA Space Apps)](https://www.spaceappschallenge.org/2023/challenges/visualize-a-space-mission-using-virtual-reality/)
* **Overview:** 2023 challenge asking participants to develop interactive 3D/VR applications visualizing complete space missions:
  1. Mission concept (scientific & operational objectives).
  2. Orbital trajectories (Earth orbit, Earth–Moon transfers, deep space).
  3. Mission timeline (sequential critical events).
  4. 3D spatial visualization (intuitive dynamics and spatial relationships).

### 1.9 [CSA (Canadian Space Agency) Digital Games and Activities](https://www.asc-csa.gc.ca/eng/youth-educators/digital-games-and-activities.asp)
* **Overview:** Canadian Space Agency collection of interactive educational games, digital activities, e-books, and hands-on modules making space science accessible and engaging.

---

## 🛰️ 2. Horizon-X Architectural Alignment Matrix

| NASA Resource | Key Requirement / Concept | Horizon-X Implementation |
| :--- | :--- | :--- |
| **Design and Develop Science Missions** | 4 Mission Segments: Launch, Space, Ground, User | **Launch:** STS-31 Launch Simulation (`simulationScreen`).<br>**Space:** GSFC Cleanroom HST Assembly (`facility3d.js`).<br>**Ground:** Desk 03 Network / Ku-Band Ground Terminal (`networkWorkbench3d.js`).<br>**User:** Science Camera & Optical Clearance Telemetry (`WFPC2 / COSTAR`). |
| **Mission Design Lab (MDL)** | Multidisciplinary engineering bays at GSFC: Attitude Control, Thermal, Power, Avionics, Comms | **Desk 01 (Mechanical):** RSU-02 Gyro Attitude Control & SADM Thermal Dampers.<br>**Desk 02 (Electronic):** Solar Array Drive Electronics & Power Bus.<br>**Desk 03 (Network):** RF Waveguides & High Gain Antenna Feedhorn. |
| **Concept Maturity Levels (CML 1–4)** | Progressive maturation from mission idea to trade studies and point design | **Multi-Tier Gameplay:** Apprentice Level 1 Check-In -> Department Procurement Trade Studies -> Component Precision Installation -> Official Debrief Flight Certification. |
| **NASA Mission Viz & VR Challenge** | Web-based real-time 3D trajectory and spatial visualization | **Three.js WebGL Engine:** Full first-person 3D cleanroom exploration, 3D interactive workbenches, interactive orbital flight path, and mobile virtual joystick support. |
| **A Learning Game About Telescopes** | Scientific objectives drive instrument selection and engineering constraints | **Laptop Marketplace & Science Camera Modal:** Procurement budget constraints, instrument compatibility checks, and post-assembly telemetry verification. |
| **General Mission Analysis Tool (GMAT)** | Trajectory propagation and orbital mechanics | **Physics Simulation Engine:** `rocketSimulationEngine.js` calculating staging, drag, gravity turns, and orbital insertion parameters. |
