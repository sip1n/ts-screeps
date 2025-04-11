import { CreepRole } from "../utils/enums";
import { MemoryService } from "./MemoryService";

export class SpawnerService {
    private static _roleToSpawn: CreepRole | null = null;
    static get roleToSpawn(): CreepRole | null { return this._roleToSpawn; } // for maybe e.g. visualization

    static runSpawners() {
        for (const spawnName in Game.spawns) {
            const spawn = Game.spawns[spawnName];
            if (spawn.spawning) continue;

            const creepsByRole = MemoryService.countCreepsByRole();



        }
    }
}