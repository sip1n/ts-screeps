import { CreepBase } from "./CreepBase";

export class HarvesterCreep extends CreepBase {
    constructor(creep: Creep) {
        super(creep);
    }

    public run(): void {
        if (this.isFull()) {
            const target = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
                filter: structure =>
                    (structure.structureType === STRUCTURE_SPAWN ||
                        structure.structureType === STRUCTURE_EXTENSION) &&
                    structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0
            });

            if (target) {
                this.transferEnergy(target);
            }
        } else {
            const source = this.getClosestSource();
            if (source) {
                this.harvestSource(source);
            }
        }
    }

    public getAllSources(): Source[] {
        return this.creep.room.find(FIND_SOURCES);
    }

    public getClosestSource(): Source | null {
        return this.creep.pos.findClosestByPath(FIND_SOURCES);
    }

    public harvestSource(source: Source): number {
        return this.creep.harvest(source);
    }

    public transferEnergy(target: Structure): number {
        return this.creep.transfer(target, RESOURCE_ENERGY);
    }

    public withdrawEnergy(target: Structure): number {
        return this.creep.withdraw(target, RESOURCE_ENERGY);
    }

    public transferEnergyToClosestStructure(): number | null {
        const closestStructure = this.creep.pos.findClosestByPath(FIND_STRUCTURES, {
            filter: (structure) => {
                return (
                    structure.structureType === STRUCTURE_SPAWN ||
                    structure.structureType === STRUCTURE_EXTENSION ||
                    structure.structureType === STRUCTURE_TOWER
                ) && structure.store.getFreeCapacity(RESOURCE_ENERGY) > 0;
            }
        });

        if (closestStructure) {
            return this.creep.transfer(closestStructure, RESOURCE_ENERGY);
        }

        return null;
    }
}