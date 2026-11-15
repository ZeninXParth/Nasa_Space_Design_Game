\# Phase 03: Lobby Environment, Player Spawn \& Facility Access System



\## 1. Phase Overview

Develop a modern, realistic lobby environment that serves as the primary spawn area for both \*\*Single-Player and Multiplayer modes\*\*. The lobby will function as the main entry point to the Hubble Space Telescope Facility.



The environment must include realistic interior architecture, furniture, security infrastructure, registration desk, and an interactive access-control system that allows players to obtain and use a facility keycard.



\## 2. Interior Design \& Environment Specifications



\### 2.1 Floor

\- \*\*Base Color:\*\* `#F1FAEE`

\- Implement a subtle grid-line pattern across the entire floor.

\- The floor material should resemble a modern, polished lobby surface with realistic textures and lighting.



\### 2.2 Ceiling

\- \*\*Base Color:\*\* `#FAEDCD`

\- Install two white LED hanging lights using the provided reference image:

&#x20; - `Led-hanging-light.jpeg`

\- Ensure the lighting provides balanced illumination throughout the lobby.



\### 2.3 Walls

\- \*\*Base Color:\*\* `#F8F3F0`

\- Maintain a clean, modern architectural appearance.

\- Ensure all walls, corners, and object placements are consistent with the lobby's spatial layout.



\## 3. Interior Objects \& Asset Placement



Use the following provided reference assets to recreate the lobby environment accurately.



\### 3.1 General Lobby Furniture \& Infrastructure



| Object | Reference Asset | Placement / Requirements |

|---|---|---|

| Circular Desk | `Circular-desk-lobby.jpeg` | Position within the lobby with scattered paperwork on its surface. |

| White Sofa | `Sofa-white-lobby-area.jpeg` | Install in the designated seating area. |

| Air Conditioner | `Air-conditionor-lobby-room.jpeg` | Attach to the upper sections of the West and South walls. |

| Security Cameras | `Security-cam-lobby-area.jpeg` | Install in the upper corners, providing coverage in all directions. |

| LED Hanging Lights | `Led-hanging-light.jpeg` | Install two units on the ceiling. |



These objects should primarily serve as environmental elements and remain non-interactable.



\### 3.2 Registration \& Security Desk



Position the modern registration desk on the \*\*East wall\*\* using the provided reference:



\- `lobby-resistration-mordern-desk.jpeg`



The registration desk must contain:



1\. \*\*Registration Monitor\*\*

&#x20;  - Reference: `Monitor-resistration-desk.jpeg`

&#x20;  - Used for the player's facility registration and keycard collection.



2\. \*\*Registration Microphone\*\*

&#x20;  - Reference: `Microphone-on-restration-desk.jpeg`

&#x20;  - Positioned appropriately on the registration desk as part of the reception setup.



3\. \*\*Keycard Access Machine\*\*

&#x20;  - Reference: `Key-card-check-machine.jpeg`

&#x20;  - Installed near the facility entrance for keycard verification.



The registration monitor and keycard access machine must support the required player interactions.



\## 4. Player Interaction \& Keycard Registration System



The registration desk will serve as the primary interaction point when players spawn inside the lobby.



\### Step 1: Player Spawn

\- Spawn the player inside the lobby area according the private room selected players count.

\- Support both Single-Player and Multiplayer spawning logic.

\- Ensure players can navigate freely around the lobby.



\### Step 2: Computer Interaction

\- Players approach the registration desk.

\- Allow interaction with the registration monitor.

\- Trigger the facility registration interface when the player interacts with the computer.



\### Step 3: Keycard Collection

\- Upon successful registration, provide the player with a Hubble Space Telescope Facility Access Keycard.

\- Use the provided asset:

&#x20; - `key-card.png`

\- Display the collected keycard within the player's inventory or designated keycard frame/interface.

\- Ensure the keycard is associated with the respective player.



\## 5. Facility Entrance \& Keycard Verification System



\### 5.1 Keycard Authentication

\- Position the keycard verification machine near the lobby's South-side entrance.

\- Players must approach the machine and interact with it.

\- Allow the player to present or scan the collected keycard.

\- Validate the keycard before granting access.



\### 5.2 Automatic Sliding Door Mechanism

Use the following reference asset:



\- `Slide-door-Transparent.jpeg`



\*\*Door Configuration:\*\*

\- Install the transparent automatic sliding door on the South wall of the lobby.

\- Connect the lobby's South-side entrance directly to the Facility Room's South-corner entrance.



\*\*Expected Interaction Flow:\*\*



1\. Player approaches the keycard verification machine.

2\. Player scans the previously collected facility keycard.

3\. The system validates the keycard.

4\. Upon successful authentication, play the appropriate access-granted sound effect.

5\. Automatically open the transparent sliding door.

6\. Allow the player to enter the Facility Room.

7\. Close the sliding door automatically after the player passes through.



If authentication fails, deny access and keep the sliding door closed.



\## 6. Facility Transition \& Task Assignment



Once the player successfully enters the Facility Room:



\- Transition the player from the lobby into the facility environment.

\- Trigger the existing facility gameplay logic.

\- Assign tasks according to the facility's established operational workflow.

\- Ensure that the existing task-assignment system remains functional.

\- Maintain player-specific task progression in Multiplayer mode.



\## 7. Interaction Classification



Organize all lobby objects into two categories.



\*\*Non-Interactable Objects:\*\*

\- Sofa

\- Circular desk and scattered papers

\- Air conditioners

\- Ceiling lights

\- Security cameras

\- Walls, floor, and ceiling



\*\*Interactable Objects:\*\*

\- Registration monitor

\- Keycard verification machine

\- Facility access keycard

\- Automatic sliding door (system-controlled interaction)



\## 8. Technical \& Implementation Requirements



\- Maintain realistic proportions, object placement, and interior design.

\- Use the provided reference images as the primary visual guidelines.

\- Implement collision detection for furniture, walls, and environmental objects.

\- Ensure the player cannot walk through solid objects.

\- Keep all interactive elements accessible and responsive.

\- Implement player-specific keycard ownership and authentication.

\- Ensure Single-Player and Multiplayer compatibility.

\- Connect the lobby entrance system with the existing Facility Room environment and gameplay logic.

\- Avoid modifying or breaking existing facility mechanics.



\## 9. Expected Final Outcome



The completed Phase 03 should deliver a fully designed, modern lobby environment that functions as the primary spawn and registration area for the Hubble Space Telescope Facility.



Players must be able to:



1\. Spawn inside the lobby.

2\. Navigate the lobby environment.

3\. Access the registration computer.

4\. Register and collect their facility access keycard.

5\. Approach the security verification machine.

6\. Authenticate their keycard.

7\. Enter the Facility Room through the automatic sliding door.

8\. Receive their assigned facility tasks upon entering.



\*\*Final Objective:\*\* Establish a seamless connection between the Lobby Environment and the Facility Room, combining realistic interior design, interactive registration, security authentication, and multiplayer-compatible facility access.

