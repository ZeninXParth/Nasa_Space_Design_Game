<p align="center">
  <img src="assets/images/Space Apps Logo Color and White motif.png" alt="NASA Space Apps Challenge Logo" width="480">
</p>

<p align="center">
  <b>Horizon-X</b> is an interactive 3D aerospace engineering simulation and educational mission design game developed for the NASA Space Apps Challenge. Players collaborate in real-time across Mechanical, Electronic, and Network engineering departments inside a virtual NASA Goddard Space Flight Center cleanroom to design, procure, assemble, and launch the Hubble Space Telescope into Low Earth Orbit.
</p>

<p align="center">
  <b>Technologies Used:</b> WebGL &bull; Three.js &bull; JavaScript (ES6+) &bull; HTML5 &bull; CSS3 &bull; NASA GMAT R2026a &bull; WebSocket Relay &bull; ReadyPlayerMe &bull; Vercel Edge
</p>

---

# Horizon-X: NASA Space Apps Challenge

## Introduction of the Challenge

The NASA Space Apps Challenge is the world's largest annual global hackathon, calling upon scientists, engineers, designers, educators, and innovators to solve real-world problems on Earth and in space using NASA's open-source data and engineering standards.

Among the most vital challenges presented is the creation of an interactive, educational space mission design game. Developing complex scientific observatories—such as the Hubble Space Telescope, the James Webb Space Telescope, or the Chandra X-Ray Observatory—requires navigating intricate multidisciplinary engineering, tight financial budgets, strict orbital mechanics, and unforgiving quality assurance standards. 

Traditional aerospace engineering education often relies on dense theoretical handbooks and disparate simulation tools, which can be difficult for students and aspiring engineers to synthesize. The goal of this challenge is to transform authentic NASA systems engineering methodologies into an interactive, collaborative, and visually rich simulation that demonstrates how scientific observation goals directly dictate spacecraft design, hardware procurement, component assembly, and orbital launch operations.

---

## Modern Solution of this Challenge

Horizon-X delivers a browser-native, collaborative 3D aerospace engineering simulation and educational game. It bridges the gap between high-level astrophysics and ground-level cleanroom integration, placing players directly in the role of aerospace engineers and mission architects.

The core innovations of this solution include:

- Browser-Native 3D Cleanroom and Metrology: Built on WebGL and Three.js, Horizon-X delivers real-time first-person and third-person exploration of the Goddard Space Flight Center cleanroom without requiring proprietary software downloads, plugins, or high-end graphics processing units.
- Multidisciplinary Role Specialization: Emulating genuine aerospace development, the facility is partitioned into three specialized engineering departments: Mechanical, Electronic, and Network. Each station features dedicated workbenches, interactive computers, and authentic assembly tasks.
- Real-Time Multiplayer Collaboration: Distributed engineering teams can enter the cleanroom together, verify arrival gates, claim terminal locks, manage a collective mission budget, and synchronously build spacecraft subsystems without operational conflicts.
- Dual-Tier Educational Complexity: Horizon-X provides a dynamic complexity toggle. The Introductory Mode presents intuitive conceptual analogies and visual schematics suitable for secondary school students (Age 13+). The Systems Engineering Mode activates rigorous NASA specifications, micro-inch metrology tolerances, electrical noise margins, and exact orbital state vectors.
- End-to-End Mission Lifecycle: Players progress seamlessly through scientific target selection, logistics trade studies, 3D precision assembly mini-games, Goddard engineering directives, an STS-31 Space Shuttle launch simulation, and a comprehensive flight audit debriefing.

---

## Use of the Provided Resources

Horizon-X strictly incorporates the official data, tools, datasets, and systems-engineering frameworks provided for the NASA Space Apps Challenge:

- Design and Develop Science Missions (NASA SP-2016-6105 Rev 2): Forms the architectural backbone of the simulation, structuring the game into the four foundational NASA mission segments: Launch Segment, Space Segment, Ground Segment, and User Segment.
- NASA General Mission Analysis Tool (GMAT R2026a): Supplies authoritative orbital dynamics, numerical propagation algorithms, and Keplerian orbital parameters for Low Earth Orbit insertion.
- JPL Concept Maturity Levels (CML 1 through 4): Guides the progressive mission lifecycle from initial concept definition (CML 1) and project constraint feasibility (CML 2) to multi-tier procurement trade studies (CML 3) and point-design subsystem assembly (CML 4).
- GSFC Mission Design Lab (MDL): Provides the collaborative concurrent engineering model used across the cleanroom, where multidisciplinary desks resolve subsystem dependencies simultaneously.
- A Learning Game About Telescopes (Webb: Build It Yourself): Informs the core educational mechanic wherein scientific targets (ultraviolet, optical, infrared, or X-ray) dictate physical hardware requirements, sensor choices, and thermal management.
- NASA Mission Viz and 3D/VR Visualization Challenge: Guides spatial navigation, chronological event staging, and mobile-friendly virtual joystick kinematics.

---

## Implementation of Resources

Each official NASA resource is concretely implemented within the Horizon-X application:

### The Four Mission Segments
- Launch Segment: Implemented through an animated and physics-backed STS-31 Space Shuttle Discovery launch simulation. The sequence visualizes Launch Complex 39-A liftoff, aerodynamic pressure peaking at Max-Q, Solid Rocket Booster burnout and separation, Main Engine Cut-Off, External Tank jettison, and payload bay deployment into Low Earth Orbit.
- Space Segment: Realized in the 3D Hubble Assembly facility, where players integrate the 10,800 kg observatory bus with gyroscopic attitude canisters, solar array drive mechanisms, flight computers, optical guidance sensors, and dual high-gain parabolic antennas.
- Ground Segment: Modeled as the NASA Goddard Space Flight Center cleanroom featuring three isolated stations (Desk 01 Mechanical, Desk 02 Electronic, Desk 03 Network) equipped with check-in terminals, shift countdowns, security keycard authentication, and ground communication links.
- User Segment: Displayed during post-deployment telemetry, where deep-space astronomical survey data from the M100 Starburst Galactic Core is validated across focal plane detectors and ground downlinks.

### NASA GMAT R2026a Orbital Dynamics HUD
- Real-Time Flight Dynamics Card: Displays live flight telemetry during orbital insertion, including Earth JGM-3 twenty-by-twenty spherical harmonic gravity modeling and Runge-Kutta eight-nine variable step numerical integration.
- Exact Flight Parameters: Renders semi-major axis of 6,971.5 kilometers, Low Earth Orbit altitude of 593.2 kilometers, orbital inclination of 28.47 degrees, near-circular eccentricity of 0.00028, and an orbital period of 96.5 minutes.
- Flight Clearance Stamp: Validates the final mission debrief with an official Goddard Mission Design Lab certification.

### Tiered Logistics and Concept Maturity Levels
- 3-Tier Logistics Marketplace: Implements CML Level 3 trade studies, requiring players to balance a limited baseline budget of 150,000 dollars across Standard, Calibrated, and Flight-Grade tools based on durability timers and precision ratings.
- Point Design Verification: Enforces precision alignment on workbenches, including reticle centering within 15 pixels, voltage tuning within 0.2 volts of 5.0 volts, and phase angle synchronization within 5 degrees.

### GSFC Engineering Directives Decision System
- Six Authoritative Directives: Enforces critical design choices across all three departments, including dual O-ring hermetic seals, threaded fastener preload torques, Class 3 mil-spec solder inspections, optocoupler galvanic isolation, coaxial microwave torque locking, and double-braided shielding.
- Flight Audit Scoring: Computes an objective flight score from 0 to 100 percent, awarding Grade A-Plus clearance for standard-compliant decisions and documenting specific corrective actions when cost-saving shortcuts are attempted.
- Historical Mission Matcher: Compares the player's completed design against authentic NASA flight records, confirming a 100 percent architecture match to the Hubble Space Telescope STS-31 deployment.

---

## Technologies and Development Information

### Core Technologies
- 3D Graphics and Spatial Visualization: WebGL, Three.js
- Web Application Framework: Modern Vanilla JavaScript (ES6+), HTML5, CSS3
- Orbital Trajectory Engine: NASA General Mission Analysis Tool (GMAT R2026a)
- Real-Time Multiplayer Networking: WebSockets, Socket.IO Relay
- 3D Astronaut Geometry and Avatars: ReadyPlayerMe
- Global Cloud Hosting and Delivery: Vercel Edge Network

### Production Deployment
The application is deployed globally and is accessible instantly without any software installation:
- Production Deployment (Vercel Edge Network): https://nasagame.vercel.app

### Technical Platform Architecture
- Web-First Engine: Built entirely using modern web standards including HTML5, CSS3, and WebGL with Three.js. Runs natively in all modern desktop and mobile web browsers without compilation or plugins.
- Client-Side Performance: Subsystem 3D geometries, textures, and ReadyPlayerMe astronaut avatars are embedded to ensure instantaneous zero-latency rendering regardless of network connectivity.
- Mobile and Touch Integration: Features a responsive virtual joystick and contextual action hub, providing full movement, camera looking, and object interaction on touchscreens, tablets, and mobile devices.
- Multi-Client Relay: Powered by low-latency WebSocket communication to synchronize player positions, terminal reservations, marketplace purchases, and assembly progression between concurrent users.
- Automated Flight Certification: Backed by an exhaustive automated end-to-end opaque-box test suite consisting of 242 test cases across 14 distinct test suites, verifying every DOM element, 3D canvas, state transition, and engineering calculation.
- Documentation Library: Comprehensive technical specifications, phase instruction worksheets, and NASA reference manuals are permanently organized within the project documentation directory.
