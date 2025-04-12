import { CreepService } from "./services/creeps/CreepService";
import { MemoryService } from "./services/MemoryService";
import { PathTrackingService } from "./services/pathTracking/PathTrackingService";
import { SpawnerService } from "./services/SpawnerService";

export const loop = () => {
    // Alustetaan järjestelmät vain kerran pelisession alussa
    if (!Memory._systemsInitialized) {
        console.log('Initializing systems at game tick:', Game.time);

        // Puhdistetaan kuolleiden creepien muisti
        MemoryService.cleanupCreeps();

        // Alustetaan creepien määrätavoitteet
        MemoryService.initCreepCounts();

        // Alusta path tracking järjestelmä
        PathTrackingService.initialize();

        // Merkitään järjestelmät alustetuiksi
        Memory._systemsInitialized = true;
        console.log('Systems initialized successfully');
    }

    // Nämä suoritetaan jokaisessa loopissa
    PathTrackingService.update();
    CreepService.runCreeps();
    SpawnerService.runSpawners();

    // Log stats every 10 ticks
    if (Game.time % 10 === 0) {
        MemoryService.logStats();

        // Varmistetaan että kuolleiden creepien muisti siivotaan säännöllisesti
        MemoryService.cleanupCreeps();
    }
};