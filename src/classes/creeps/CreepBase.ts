export class CreepBase {

    protected creep: Creep;

    constructor(creep: Creep) {
        this.creep = creep;
        // Alustetaan working-tila, jos sitä ei ole vielä määritelty
        if (this.creep.memory.working === undefined) {
            this.creep.memory.working = false;
        }
    }

    /**
     * Aloittaa energian keräämisvaiheen
     */
    public startHarvesting(): void {
        this.creep.memory.working = false;
        this.harvestEnergy();
    }

    /**
     * Aloittaa työskentelyn (energian käyttämisen)
     */
    public startWorking(): void {
        this.creep.memory.working = true;
    }

    /**
     * Tarkistaa työskenteleekö creep (eli käyttääkö se energiaansa)
     */
    public isWorking(): boolean {
        return Boolean(this.creep.memory.working);
    }

    /**
     * Päivittää creepin tilan automaattisesti:
     * - Jos työskentelee ja on tyhjä, aloittaa keräämisen
     * - Jos kerää ja on täynnä, aloittaa työskentelyn
     * @returns true jos tila vaihtui, false jos ei
     */
    public updateWorkingState(): boolean {
        if (this.isWorking() && this.isEmpty()) {
            this.startHarvesting();
            return true;
        } else if (!this.isWorking() && this.isFull()) {
            this.startWorking();
            return true;
        }
        return false;
    }

    /**
     * Kerää energiaa lähimmästä lähteestä
     */
    public harvestEnergy(): void {
        const source = this.getClosestSource();
        if (source) {
            this.harvestSource(source);
        }
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

    public getAllConstructionSites(): ConstructionSite[] {
        return this.creep.room.find(FIND_CONSTRUCTION_SITES);
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

    /**
     * Hakee huoneen kaikki korjausta tarvitsevat rakenteet
     * @param minHitsPercent Paljonko prosenttia rakenteen max HP:stä pitää olla jäljellä jotta sitä ei tarvitse korjata (oletus 0.75 = 75%)
     * @returns Lista rakenteista, jotka tarvitsevat korjausta
     */
    public getStructuresToRepair(minHitsPercent: number = 0.75): Structure[] {
        return this.creep.room.find(FIND_STRUCTURES, {
            filter: (structure) => {
                // Walls and ramparts are handled separately because they have so much HP
                if (structure.structureType === STRUCTURE_WALL || structure.structureType === STRUCTURE_RAMPART) {
                    return structure.hits < 10000; // Cap at 10k hits for walls/ramparts initially
                }

                return structure.hits < structure.hitsMax * minHitsPercent;
            }
        });
    }

    /**
     * Hakee lähimmän korjausta tarvitsevan rakenteen
     * @param minHitsPercent Paljonko prosenttia rakenteen max HP:stä pitää olla jäljellä jotta sitä ei tarvitse korjata (oletus 0.75 = 75%)
     * @returns Lähin korjausta tarvitseva rakenne tai null jos ei löydy
     */
    public getClosestStructureToRepair(minHitsPercent: number = 0.75): Structure | null {
        const structures = this.getStructuresToRepair(minHitsPercent);
        if (structures.length === 0) return null;

        return this.creep.pos.findClosestByPath(structures);
    }

    /**
     * Korjaa määritetyn rakenteen
     * @param structure Rakenne, joka korjataan
     * @returns Korjausoperaation tulos (ScreepsReturnCode)
     */
    public repairStructure(structure: Structure): number {
        if (this.creep.repair(structure) === ERR_NOT_IN_RANGE) {
            this.creep.moveTo(structure);
        }
        return this.creep.repair(structure);
    }

    /**
     * Hakee ja korjaa lähimmän korjausta tarvitsevan rakenteen
     * @param minHitsPercent Paljonko prosenttia rakenteen max HP:stä pitää olla jäljellä jotta sitä ei tarvitse korjata (oletus 0.75 = 75%)
     * @returns true jos korjattavaa löytyi, false jos ei
     */
    public repairClosestStructure(minHitsPercent: number = 0.75): boolean {
        const structure = this.getClosestStructureToRepair(minHitsPercent);
        if (structure) {
            this.repairStructure(structure);
            return true;
        }
        return false;
    }

    /**
     * Tarkistaa ja asettaa creepin idle-tilan
     * @param isIdle Asetetaanko idle-tilaan
     */
    public setIdleState(isIdle: boolean): void {
        this.creep.memory.idle = isIdle;
    }

    /**
     * Tarkistaa onko creep idle-tilassa
     */
    public isIdle(): boolean {
        return Boolean(this.creep.memory.idle);
    }

    /**
     * Tarkistaa onko creep pakotetussa idle-tilassa
     */
    public isForceIdle(): boolean {
        return Boolean(this.creep.memory.forceIdle);
    }
}