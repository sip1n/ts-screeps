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
}