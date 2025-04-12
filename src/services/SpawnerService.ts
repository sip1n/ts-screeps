import { CreepRole } from "../utils/enums";
import { MemoryService } from "./MemoryService";

export class SpawnerService {
    private static _roleToSpawn: CreepRole | null = null;
    static get roleToSpawn(): CreepRole | null { return this._roleToSpawn; } // for maybe e.g. visualization

    static runSpawners() {
        for (const spawnName in Game.spawns) {
            const spawn = Game.spawns[spawnName];
            if (spawn.spawning) continue;

            this._roleToSpawn = this.getRoleToSpawn();
            if (this._roleToSpawn) {
                this.spawnCreep(spawn, this._roleToSpawn);
            }
        }
    }

    private static getRoleToSpawn(): CreepRole | null {
        switch (true) {
            case MemoryService.getCreepsByRole(CreepRole.PAWN).length < 2:
                return CreepRole.PAWN;
            case MemoryService.getCreepsByRole(CreepRole.HARVESTER).length < 2:
                return CreepRole.HARVESTER;
            case MemoryService.getCreepsByRole(CreepRole.BUILDER).length < 2:
                return CreepRole.BUILDER;
            case MemoryService.getCreepsByRole(CreepRole.UPGRADER).length < 2:
                return CreepRole.UPGRADER;
            default:
                return null; // No role to spawn
        }
    }

    private static spawnCreep(spawn: StructureSpawn, role: CreepRole): ScreepsReturnCode {
        const creepName = role + Game.time;
        const body = this.getBodyPartsForRole(role, spawn.room.energyAvailable);

        return spawn.spawnCreep(body, creepName, {
            memory: { role: role }
        });
    }

    private static getBodyPartsForRole(role: CreepRole, energyAvailable: number): BodyPartConstant[] {
        // Perustason creep (pawn) - käytetään kun energia on vähissä tai alussa
        const basicBody: BodyPartConstant[] = [WORK, CARRY, MOVE];
        // Jos energia ei riitä edes perustason creepiin, palautetaan se
        if (energyAvailable < this.calculateBodyCost(basicBody)) {
            return basicBody;
        }

        // Jos energia riittää kehittyneempiin creepeihin, määritellään ne roolin mukaan
        switch (role) {
            case CreepRole.PAWN:
                return this.getScalableBody([WORK, CARRY, MOVE], energyAvailable);

            case CreepRole.HARVESTER:
                // Harvesterilla enemmän WORK-osia resurssien tehokkaaseen keräämiseen
                return this.getScalableBody([WORK, WORK, CARRY, MOVE], energyAvailable);

            case CreepRole.BUILDER:
                // Builderilla tasapaino WORK ja CARRY -osien välillä
                return this.getScalableBody([WORK, CARRY, CARRY, MOVE, MOVE], energyAvailable);

            case CreepRole.UPGRADER:
                // Upgraderilla tasapaino WORK ja CARRY -osien välillä
                return this.getScalableBody([WORK, WORK, CARRY, MOVE], energyAvailable);

            default:
                return basicBody;
        }
    }

    private static calculateBodyCost(body: BodyPartConstant[]): number {
        return body.reduce((cost, part) => {
            switch (part) {
                case WORK: return cost + 100;
                case CARRY: return cost + 50;
                case MOVE: return cost + 50;
                case ATTACK: return cost + 80;
                case RANGED_ATTACK: return cost + 150;
                case HEAL: return cost + 250;
                case CLAIM: return cost + 600;
                case TOUGH: return cost + 10;
                default: return cost;
            }
        }, 0);
    }

    private static getScalableBody(baseBody: BodyPartConstant[], energyAvailable: number): BodyPartConstant[] {
        // Jos energia ei riitä edes perusbodyyn, palautetaan minimivaatimus
        if (energyAvailable < this.calculateBodyCost([WORK, CARRY, MOVE])) {
            return [WORK, CARRY, MOVE];
        }

        // Adaptiivinen lähestymistapa, joka rakentaa osia yksittäin energian mukaan
        const finalBody: BodyPartConstant[] = [];
        let remainingEnergy = energyAvailable;

        // Prioritized parts to add based on energy availability
        const parts: Partial<Record<BodyPartConstant, number>> = {};

        // Initialize parts counts based on base body
        baseBody.forEach(part => {
            parts[part] = (parts[part] || 0) + 1;
        });

        // Kerätään lista eri bodyparteista oikeassa suhteessa
        const partTypes: BodyPartConstant[] = [];
        for (const part in parts) {
            for (let i = 0; i < (parts[part as BodyPartConstant] || 0); i++) {
                partTypes.push(part as BodyPartConstant);
            }
        }

        // Lisää osia niin kauan kuin energiaa riittää, pitäen oikean suhteen
        let index = 0;
        const MAX_PARTS = 50; // Game maximum

        while (remainingEnergy > 0 && finalBody.length < MAX_PARTS) {
            const part = partTypes[index % partTypes.length];
            const partCost = this.getPartCost(part);

            if (remainingEnergy >= partCost) {
                finalBody.push(part);
                remainingEnergy -= partCost;
            } else {
                // Jos ei ole tarpeeksi energiaa seuraavaan osaan, lopetetaan
                break;
            }

            index++;
        }

        // Jos body on tyhjä (ei pitäisi olla mahdollista), palautetaan perusbody
        if (finalBody.length === 0) {
            return [WORK, CARRY, MOVE];
        }

        return this.optimizeBodyOrder(finalBody);
    }

    /**
     * Järjestää body partsit optimaaliseen järjestykseen
     * Taistelukierroksen aikana osat vahingoittuvat järjestyksessä, joten
     * sijoitamme TOUGH-osat ensin, sitten WORKit jne.
     */
    private static optimizeBodyOrder(body: BodyPartConstant[]): BodyPartConstant[] {
        // Prioriteettijärjestys (alimmat ensin)
        const priority: BodyPartConstant[] = [
            TOUGH, WORK, ATTACK, RANGED_ATTACK, HEAL, CLAIM, CARRY, MOVE
        ];

        // Lajitellaan osat prioriteettijärjestykseen
        const result: BodyPartConstant[] = [];

        // Käydään läpi prioriteettijärjestyksessä
        priority.forEach(partType => {
            body.forEach(part => {
                if (part === partType) {
                    result.push(part);
                }
            });
        });

        return result;
    }

    /**
     * Palauttaa yksittäisen bodypartin hinnan
     */
    private static getPartCost(part: BodyPartConstant): number {
        switch (part) {
            case WORK: return 100;
            case CARRY: return 50;
            case MOVE: return 50;
            case ATTACK: return 80;
            case RANGED_ATTACK: return 150;
            case HEAL: return 250;
            case CLAIM: return 600;
            case TOUGH: return 10;
            default: return 0;
        }
    }
}