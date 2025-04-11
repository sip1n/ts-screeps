import { HarvesterCreep } from "./classes/HarvesterCreep";

export const loop = () => {
    for (const name in Game.creeps) {
        const creep = Game.creeps[name];

        if (creep.memory.role === "harvester") {
            const harvester = new HarvesterCreep(creep);
            harvester.run();
        }
    }
};