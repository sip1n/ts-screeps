import { CreepBase } from "../../classes/creeps/CreepBase";
import { CreepRole } from "../../utils/enums";
import { CreepActionService } from "./actions/CreepActionService";

export class CreepService {
    /**
     * Suorittaa creepien toimintalogiikan
     */
    public static runCreeps(): void {
        for (const name in Game.creeps) {
            const creep = Game.creeps[name];
            const creepInstance = new CreepBase(creep);
            this.runCreepByRole(creepInstance);
        }
    }

    /**
     * Suorittaa creepin toiminnan roolin mukaan
     */
    private static runCreepByRole(creep: CreepBase): void {
        // Päivitetään creepin työskentelytila
        creep.updateWorkingState();

        const role = creep['creep'].memory.role;

        // Jos creep on pakotettu idle-tilaan, ohitetaan kaikki logiikka
        if (creep.isForceIdle()) {
            return;
        }

        // Jos creep ei ole työskentelytilassa, kerätään energiaa
        if (!creep.isWorking()) {
            creep.harvestEnergy();
            return;
        }

        // Jos creep on idle-tilassa, yritetään suorittaa dynaamisia tehtäviä
        if (creep.isIdle()) {
            // Jos dynaamisia tehtäviä ei löydy, käytetään oletus roolia (pawn)
            if (!CreepActionService.runDynamicIdleTasks(creep)) {
                console.log(`Creep ${creep.getName()} is idle and has no dynamic tasks available.`);
            } else {
                console.log(`Creep ${creep.getName()} is performing dynamic tasks while idle.`);
            }
            return;
        }

        // Jos creep on työskentelytilassa, toimitaan roolin mukaan käyttäen CreepActionService-palvelua
        switch (role) {
            case CreepRole.PAWN:
                CreepActionService.runPawnActions(creep);
                break;
            case CreepRole.HARVESTER:
                CreepActionService.runHarvesterActions(creep);
                break;
            case CreepRole.BUILDER:
                CreepActionService.runBuilderActions(creep);
                break;
            case CreepRole.UPGRADER:
                CreepActionService.runUpgraderActions(creep);
                break;
            case CreepRole.REPAIRMAN:
                CreepActionService.runRepairmanActions(creep);
                break;
            default:
                CreepActionService.runPawnActions(creep); // Oletustoiminta
                break;
        }
    }
}