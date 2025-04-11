export class CreepBase {
    protected creep: Creep;

    constructor(creep: Creep) {
        this.creep = creep;
    }

    public getCreepId(): string {
        return this.creep.id;
    }

    public getName(): string {
        return this.creep.name;
    }

    public getPosition(): number[] {
        return [this.creep.pos.x, this.creep.pos.y];
    }

    public isFull(): boolean {
        return this.creep.store.getFreeCapacity() === 0;
    }

    public isEmpty(): boolean {
        return this.creep.store.getUsedCapacity() === 0;
    }

    public getEnergy(): number {
        return this.creep.store.getUsedCapacity(RESOURCE_ENERGY);
    }

    public getEnergyCapacity(): number {
        return this.creep.store.getCapacity(RESOURCE_ENERGY);
    }

    public getBodyParts(): BodyPartConstant[] {
        return this.creep.body.map(part => part.type);
    }

    public getBodyPartCount(part: BodyPartConstant): number {
        return this.creep.body.filter(bodyPart => bodyPart.type === part).length;
    }

    public getBodyPartHits(part: BodyPartConstant): number {
        const bodyPart = this.creep.body.find(bodyPart => bodyPart.type === part);
        return bodyPart ? bodyPart.hits : 0;
    }

    public getCreepRoom(): string {
        return this.creep.room.name;
    }

    public moveToPosition(position: RoomPosition): void {
        this.creep.moveTo(position);
    }

    public moveToTarget(target: Creep | Structure): void {
        if (!target) {
            console.log(`Target not found for creep ${this.creep.name}`);
            return;
        }
        this.creep.moveTo(target);
    }

    public getAllSources(): Source[] {
        return this.creep.room.find(FIND_SOURCES);
    }

    public getClosestSource(): Source | null {
        return this.creep.pos.findClosestByPath(FIND_SOURCES);
    }

    public harvestSource(source: Source): number {
        if (this.creep.harvest(source) === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(source);
        }
        return this.creep.harvest(source);
    }

    public transferEnergy(target: Structure): number {
        if (this.creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target);
        }
        return this.creep.transfer(target, RESOURCE_ENERGY);
    }

    public withdrawEnergy(target: Structure | Source): number {
        if (target instanceof Source) {
            return this.harvestSource(target);
        }

        if (this.creep.withdraw(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(target);
        }
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
            if (this.creep.transfer(closestStructure, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(closestStructure);
            }
            return this.creep.transfer(closestStructure, RESOURCE_ENERGY);
        }

        return null;
    }

    public getClosestConstructionSite(): ConstructionSite | null {
        return this.creep.pos.findClosestByPath(FIND_CONSTRUCTION_SITES);
    }

    public buildStructure(site: ConstructionSite): number {
        if (this.creep.build(site) === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(site);
        }
        return this.creep.build(site);
    }

    public upgradeController(): number | null {
        const controller = this.creep.room.controller;
        if (controller) {
            if (this.creep.upgradeController(controller) === ERR_NOT_IN_RANGE) {
                this.creep.moveTo(controller);
            }
            return this.creep.upgradeController(controller);
        }
        return null;
    }

    public run(): void {
        const role = this.creep.memory.role;

        if (this.isEmpty()) {
            const source = this.getClosestSource();
            if (source) {
                this.harvestSource(source);
            }
        } else {
            switch (role) {
                case 'harvester': {
                    this.transferEnergyToClosestStructure();
                    break;
                }
                case 'builder': {
                    const site = this.getClosestConstructionSite();
                    if (site) {
                        this.buildStructure(site);
                    } else {
                        this.upgradeController();
                    }
                    break;
                }
                case 'upgrader': {
                    this.upgradeController();
                    break;
                }
                default: {
                    if (this.transferEnergyToClosestStructure() === null) {
                        const site = this.getClosestConstructionSite();
                        if (site) {
                            this.buildStructure(site);
                        } else {
                            this.upgradeController();
                        }
                    }
                    break;
                }
            }
        }
    }
}