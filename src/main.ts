import { CreepService } from "./services/creeps/CreepService";
import { MemoryService } from "./services/MemoryService";
import { PathTrackingService } from "./services/pathTracking/PathTrackingService";
import { SpawnerService } from "./services/SpawnerService";

export const loop = () => {
    MemoryService.cleanupCreeps();

    // Alusta ja päivitä path tracking järjestelmä
    PathTrackingService.initialize();
    PathTrackingService.update();

    CreepService.runCreeps();
    SpawnerService.runSpawners();

    // Log stats every 10 ticks
    if (Game.time % 10 === 0) {
        MemoryService.logStats();
    }
};