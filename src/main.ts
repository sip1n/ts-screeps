import { CreepBase } from "./classes/creeps/CreepBase";
import { MemoryService } from "./services/MemoryService";
import { SpawnerService } from "./services/SpawnerService";
import { CreepRole } from "./utils/enums";

export const loop = () => {
    // Clean up memory of non-existing creeps
    MemoryService.cleanupCreeps();

    // Run creep logic based on their role
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];
        // Create creep instance directly without the switch since all roles use the same base class
        const creepInstance = new CreepBase(creep);
        creepInstance.run();
    }

    SpawnerService.runSpawners();

    // Log stats every 10 ticks
    if (Game.time % 10 === 0) {
        MemoryService.logStats();
    }
};