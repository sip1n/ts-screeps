import { CreepRole } from "../utils/enums";
import { CreepDefinitions } from "../utils/CreepDefinitions";
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
        // Etsitään ensimmäinen spawneri joka ei ole spawnauksessa
        const availableSpawn = Object.values(Game.spawns).find(spawn => !spawn.spawning);
        if (!availableSpawn) {
            return null;
        }

        // Tarkistetaan jos PAWN-creep lähestyy elinkaarensa loppua
        const criticalPawn = MemoryService.getCreepsByRole(CreepRole.PAWN)
            .find(creep => creep.ticksToLive !== undefined && creep.ticksToLive < 50);

        if (criticalPawn && this.canSpawnCreep(availableSpawn, CreepRole.PAWN)) {
            return CreepRole.PAWN;
        }

        // Tarkistetaan onko meillä tarpeeksi creepejä jokaista roolia varten
        // Käytetään Memory-asetuksia määrien hallintaan
        const currentCounts = MemoryService.countCreepsByRole();

        // Tarkista jokainen rooli järjestyksessä
        const rolesToCheck = [
            CreepRole.PAWN,
            CreepRole.HARVESTER,
            CreepRole.BUILDER,
            CreepRole.UPGRADER
        ];

        for (const role of rolesToCheck) {
            const currentCount = currentCounts[role] || 0;
            const targetCount = MemoryService.getCreepCountTarget(role);

            if (currentCount < targetCount && this.canSpawnCreep(availableSpawn, role)) {
                return role;
            }
        }

        return null; // Ei roolia tai energiaa ei riitä mihinkään rooliin
    }

    private static spawnCreep(spawn: StructureSpawn, role: CreepRole): ScreepsReturnCode {
        const creepName = role + Game.time;
        const body = this.getBodyPartsForRole(role, spawn.room.energyAvailable);

        return spawn.spawnCreep(body, creepName, {
            memory: { role: role }
        });
    }

    private static getBodyPartsForRole(role: CreepRole, energyAvailable: number): BodyPartConstant[] {
        // Käytetään CreepDefinitions-luokkaa pohjaruumiinosien hakemiseen
        const creepDefinitions = CreepDefinitions.getInstance();

        // Jos energia ei riitä minimivaatimuksiin, palauta minimivaatimukset (ei pitäisi tapahtua)
        const minimumBody = creepDefinitions.getMinimumBodyForRole(role);
        if (energyAvailable < this.calculateBodyCost(minimumBody)) {
            return minimumBody;
        }

        // Käytetään pohjaruumiinosia skaalattavuuteen
        const baseBody = creepDefinitions.getBaseBodyForRole(role);
        return this.getScalableBody(baseBody, energyAvailable);
    }

    private static canSpawnCreep(spawn: StructureSpawn, role: CreepRole): boolean {
        // Tarkistetaan, että energiaa on vähintään roolin minimivaatimukseen
        const minimumBody = this.getMinimumBodyForRole(role);
        const minimumCost = this.calculateBodyCost(minimumBody);

        if (spawn.room.energyAvailable < minimumCost) {
            return false;
        }

        // Jos energiaa on tarpeeksi, tehdään vielä dryrun API:n kautta varmuuden vuoksi
        const body = this.getBodyPartsForRole(role, spawn.room.energyAvailable);
        const spawnResult = spawn.spawnCreep(body, "dryrun", { dryRun: true });
        return spawnResult === OK;
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

    /**
     * Palauttaa roolin minimiruumiinosat, joilla creep voi toimia
     */
    private static getMinimumBodyForRole(role: CreepRole): BodyPartConstant[] {
        // Käytetään CreepDefinitions-luokkaa minimivaatimusten hakemiseen
        return CreepDefinitions.getInstance().getMinimumBodyForRole(role);
    }

}