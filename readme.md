# 🎮 Screeps Scripts

<div align="center">
  
![Screeps](https://img.shields.io/badge/Screeps-FF5A00?style=for-the-badge&logo=screeps&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Rollup](https://img.shields.io/badge/Rollup-EC4A3F?style=for-the-badge&logo=rollup.js&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B32C3?style=for-the-badge&logo=eslint&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)

</div>

This project contains TypeScript-based scripts for the [Screeps](https://screeps.com/) game. Screeps is an MMO strategy game where you program your units and build automated systems in a persistent game world.

This project is also an educational project to learn TypeScript by playing Screeps.

## 📁 Project Structure

```
src/
├── main.ts             # Main script that initializes the game logic
├── types.d.ts          # Type definitions and interfaces
├── classes/            # Classes like CreepBase and HarvesterCreep
├── roles/              # Role-specific logic
├── utils/              # Utility functions and tools
build/
└── main.js             # Compiled JavaScript code
```

## 🚀 Installation

1. Ensure you have [Node.js](https://nodejs.org/) and [TypeScript](https://www.typescriptlang.org/) installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the TypeScript code:
   ```bash
   npm run build
   ```

## 📋 Usage

1. The compiled code can be found in the `build/main.js` file.
2. The `build` folder contains the bundled output created by Rollup, which is optimized for Screeps to understand the script.
3. Upload the code to the Screeps server using the Screeps CLI or any preferred tool.

## ⚙️ Script Features

### 🧠 Memory System

The system handles memory management for your colony. When you need to reset memory or reinitialize the system after code updates, you can use:

```javascript
// Set this to false in the console to force reinitialization on the next tick
Memory._systemsInitialized = false;
```

This action:
- Forces the system to run initialization logic again on the next game tick
- Preserves your existing memory but ensures new configuration is properly applied
- Recognizes and initializes any newly added creep roles or other features

### 🛣️ Path Tracking & Heatmap System

The path tracking system follows creep movements and automatically creates roads in places where creeps move frequently. The system:

1. Tracks the movement of each creep and stores the movement in a heatmap
2. The heatmap "cools down" over time, so old routes disappear from the system
3. Visualizes the heatmap using the room.visual API
4. Automatically builds roads in places with high traffic

#### Console Commands for Managing the Heatmap System:

```javascript
// Enable or disable the system
PathTrackingService.setEnabled(true/false);

// Enable or disable visualization
PathTrackingService.setVisualization(true/false);

// Adjust the threshold after which roads are built
// Default value is 100, meaning roads are built when creeps have passed
// through a location at least 100 times
PathTrackingService.setRoadBuildThreshold(150);

// Clear the heatmap for a single room
PathTrackingService.clearHeatmap('W8N3');

// Clear all heatmap data
PathTrackingService.clearHeatmap();

// View a room's heatmap
const heatmapData = PathTrackingService.getHeatmapForRoom('W8N3');
console.log(JSON.stringify(heatmapData));
```

## 💻 Development

- Use [ESLint](https://eslint.org/) to ensure code quality:
  ```bash
  npm run lint
  ```
- Use [Rollup](https://rollupjs.org/) for bundling and optimizing the code.

## 🗺️ Roadmap 

## Phase 1: Core Functionality ✅

1. **Basic Creep Roles**
   - Implement essential creep roles: Harvester, Builder, Upgrader.
   - Ensure each role has clear logic and fallback behaviors.

2. **Room Management**
   - Create a room manager to oversee resource allocation and creep assignments.
   - Implement logic for spawning new creeps based on room needs.

3. **Energy Management**
   - Optimize energy harvesting and distribution.
   - Implement storage management for surplus energy.

## Phase 2: Advanced Features 🔄

1. **Defense Mechanisms**
   - Add logic for tower defense and creep-based defense.
   - Implement threat detection and response systems.

2. **Expansion Logic**
   - Automate claiming and managing new rooms.
   - Implement logic for remote mining and resource collection.

3. **Dynamic Role Assignment**
   - Create a system to dynamically assign roles to creeps based on real-time needs.
   - Implement a priority queue for tasks.

## Phase 3: Optimization 🔜

1. **Pathfinding Improvements**
   - Use Screeps' PathFinder API to optimize creep movement.
   - Cache frequently used paths to reduce CPU usage.

2. **Code Refactoring**
   - Modularize code for better maintainability.
   - Use TypeScript features like interfaces and generics to improve type safety.

3. **Performance Monitoring**
   - Implement tools to monitor CPU usage and memory consumption.
   - Optimize scripts to stay within Screeps' CPU limits.

## Phase 4: Endgame Automation 🔜

1. **Market Integration**
   - Automate resource trading on the Screeps market.
   - Implement logic for buying and selling resources based on room needs.

2. **Power Processing**
   - Automate power harvesting and processing.
   - Integrate power usage into room management.

3. **Colony Coordination**
   - Implement logic for coordinating multiple rooms and colonies.
   - Share resources and tasks between rooms for maximum efficiency.

## Phase 5: Continuous Improvement 🔜

1. **AI Enhancements**
   - Use machine learning or advanced algorithms to improve decision-making.
   - Experiment with adaptive strategies based on game state.

2. **Testing and Debugging**


---


## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---