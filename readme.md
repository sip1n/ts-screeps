# Screeps Scripts

This project contains TypeScript-based scripts for the [Screeps](https://screeps.com/) game. Screeps is an MMO strategy game where you program your units and build automated systems in a persistent game world.

This project is also an educational project to learn TypeScript by playing Screeps.

## Project Structure

```
src/
├── main.ts             # Main script that initializes the game logic
├── types.d.ts          # Type definitions and interfaces
├── classes/            # Classes like CreepBase and HarvesterCreep
├── roles/              # Role-specific logic
├── utils/              # Utility functions and tools
build/
└── main.js             # Compiled JavaScript code
dist/                   # Output directory for easier inspection of compiled code
```

## Installation

1. Ensure you have [Node.js](https://nodejs.org/) and [TypeScript](https://www.typescriptlang.org/) installed.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Compile the TypeScript code:
   ```bash
   npm run build
   ```

## Usage

1. The compiled code can be found in the `build/main.js` file.
2. The `dist` folder is used to store the output in a more readable format for easier inspection. However, the `build` folder contains the bundled output created by Rollup, which is optimized for Screeps to understand the script.
3. Upload the code to the Screeps server using the Screeps CLI or any preferred tool.

## Script Features

- **CreepBase**: A base class defining common functionality for all creeps.
- **HarvesterCreep**: A class managing creeps specialized in resource harvesting.
- **Roles and Logic**: Each creep role has its own logic, located in the `roles/` folder.
- **Utility Functions**: General-purpose tools and functions are located in the `utils/` folder.

## Development

- Use [ESLint](https://eslint.org/) to ensure code quality:
  ```bash
  npm run lint
  ```
- Use [Rollup](https://rollupjs.org/) for bundling and optimizing the code.

## Roadmap 

## Phase 1: Core Functionality

1. **Basic Creep Roles**
   - Implement essential creep roles: Harvester, Builder, Upgrader.
   - Ensure each role has clear logic and fallback behaviors.

2. **Room Management**
   - Create a room manager to oversee resource allocation and creep assignments.
   - Implement logic for spawning new creeps based on room needs.

3. **Energy Management**
   - Optimize energy harvesting and distribution.
   - Implement storage management for surplus energy.

## Phase 2: Advanced Features

1. **Defense Mechanisms**
   - Add logic for tower defense and creep-based defense.
   - Implement threat detection and response systems.

2. **Expansion Logic**
   - Automate claiming and managing new rooms.
   - Implement logic for remote mining and resource collection.

3. **Dynamic Role Assignment**
   - Create a system to dynamically assign roles to creeps based on real-time needs.
   - Implement a priority queue for tasks.

## Phase 3: Optimization

1. **Pathfinding Improvements**
   - Use Screeps' PathFinder API to optimize creep movement.
   - Cache frequently used paths to reduce CPU usage.

2. **Code Refactoring**
   - Modularize code for better maintainability.
   - Use TypeScript features like interfaces and generics to improve type safety.

3. **Performance Monitoring**
   - Implement tools to monitor CPU usage and memory consumption.
   - Optimize scripts to stay within Screeps' CPU limits.

## Phase 4: Endgame Automation

1. **Market Integration**
   - Automate resource trading on the Screeps market.
   - Implement logic for buying and selling resources based on room needs.

2. **Power Processing**
   - Automate power harvesting and processing.
   - Integrate power usage into room management.

3. **Colony Coordination**
   - Implement logic for coordinating multiple rooms and colonies.
   - Share resources and tasks between rooms for maximum efficiency.

## Phase 5: Continuous Improvement

1. **AI Enhancements**
   - Use machine learning or advanced algorithms to improve decision-making.
   - Experiment with adaptive strategies based on game state.

2. **Community Contributions**
   - Open the project for contributions from the Screeps community.
   - Document the codebase thoroughly to make it accessible to others.

3. **Testing and Debugging**
   - Write unit tests for critical functions.
   - Use Screeps' simulation mode to test new features before deploying.

---

By following this roadmap, you can systematically build a fully automated and efficient Screeps script. Adjust the steps as needed based on your progress and goals.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

Contributions are welcome! Let's build better Screeps strategies together!