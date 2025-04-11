import { CreepBase } from "../../classes/creeps/CreepBase";
import { CreepRole } from "../../utils/enums";

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
        if (creep.isEmpty()) {
            this.harvestEnergy(creep);
            return;
        }

        const role = creep['creep'].memory.role;

        switch (role) {
            case CreepRole.HARVESTER:
                this.runHarvester(creep);
                break;
            case CreepRole.BUILDER:
                this.runBuilder(creep);
                break;
            case CreepRole.UPGRADER:
                this.runUpgrader(creep);
                break;
            default:
                this.runDefaultBehavior(creep);
                break;
        }
    }

    /**
     * Käsittelee energian keräämisen
     */
    private static harvestEnergy(creep: CreepBase): void {
        const source = creep.getClosestSource();
        if (source) {
            creep.harvestSource(source);
        }
    }

    /**
     * Suorittaa HARVESTER-roolin toiminnan
     */
    private static runHarvester(creep: CreepBase): void {
        creep.transferEnergyToClosestStructure();
    }

    /**
     * Suorittaa BUILDER-roolin toiminnan
     */
    private static runBuilder(creep: CreepBase): void {
        const site = creep.getClosestConstructionSite();
        if (site) {
            creep.buildStructure(site);
        } else {
            creep.upgradeController();
        }
    }

    /**
     * Suorittaa UPGRADER-roolin toiminnan
     */
    private static runUpgrader(creep: CreepBase): void {
        creep.upgradeController();
    }

    /**
     * Suorittaa oletustoiminnan, jos rooli ei ole määritelty
     */
    private static runDefaultBehavior(creep: CreepBase): void {
        if (creep.transferEnergyToClosestStructure() === null) {
            const site = creep.getClosestConstructionSite();
            if (site) {
                creep.buildStructure(site);
            } else {
                creep.upgradeController();
            }
        }
    }
}