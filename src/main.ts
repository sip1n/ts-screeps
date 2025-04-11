import { CreepBase } from "./classes/creeps/CreepBase";
import { MemoryService } from "./utils/MemoryService";

export const loop = () => {
    // Clean up memory of non-existing creeps
    MemoryService.cleanupCreeps();

    // Run creep logic based on their role
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];

        // You can create specialized instances or use the base class
        let creepInstance: CreepBase;

        switch (creep.memory.role) {
            case 'harvester':
                creepInstance = new CreepBase(creep);
                break;
            case 'builder':
                creepInstance = new CreepBase(creep);
                break;
            case 'upgrader':
                creepInstance = new CreepBase(creep);
                break;
            default:
                // For any other role or dynamic role, just use the base class
                creepInstance = new CreepBase(creep);
                break;
        }

        // Run the creep's logic
        creepInstance.run();
    }

    // Simple auto-spawn logic (can be moved to a separate class later)
    const spawn = Game.spawns['Spawn1']; // Adjust this to your spawn's name

    if (spawn && !spawn.spawning) {
        const creepsByRole = MemoryService.countCreepsByRole();

        // Define the priority for spawning
        let roleToSpawn: string | null = null;

        // Always make sure we have at least 2 harvesters
        if ((creepsByRole.harvester || 0) < 2) {
            roleToSpawn = 'harvester';
        }
        // Then make sure we have at least 1 upgrader
        else if ((creepsByRole.upgrader || 0) < 1) {
            roleToSpawn = 'upgrader';
        }
        // Then make sure we have at least 1 builder
        else if ((creepsByRole.builder || 0) < 1) {
            roleToSpawn = 'builder';
        }
        // Additional logic to balance creeps based on needs
        else if ((creepsByRole.harvester || 0) < 4) {
            roleToSpawn = 'harvester';
        }
        else if ((creepsByRole.upgrader || 0) < 2) {
            roleToSpawn = 'upgrader';
        }
        else if ((creepsByRole.builder || 0) < 2) {
            roleToSpawn = 'builder';
        }

        // Spawn the needed creep
        if (roleToSpawn) {
            const newName = `${roleToSpawn}_${Game.time}`;
            console.log(`Spawning new ${roleToSpawn}: ${newName}`);

            // Basic body parts, adjust as needed
            spawn.spawnCreep([WORK, CARRY, MOVE], newName, {
                memory: { role: roleToSpawn }
            });
        }
    }

    // Display spawning information
    if (spawn && spawn.spawning) {
        const spawningCreep = Game.creeps[spawn.spawning.name];
        spawn.room.visual.text(
            `🛠️ ${spawningCreep.memory.role}`,
            spawn.pos.x + 1,
            spawn.pos.y,
            { align: 'left', opacity: 0.8 }
        );
    }

    // Log stats every 10 ticks
    if (Game.time % 10 === 0) {
        MemoryService.logStats();
    }
};