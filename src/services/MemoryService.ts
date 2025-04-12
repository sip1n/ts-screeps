import { CreepRole } from "../utils/enums";
import { CreepDefinitions } from "../utils/CreepDefinitions";

export class MemoryService {
    /**
     * Get a value from Memory by key
     * @param key The key to get
     * @param defaultValue The default value to return if the key doesn't exist
     */
    public static get<T>(key: string, defaultValue?: T): T | undefined {
        return _.get(Memory, key, defaultValue) as T;
    }

    /**
     * Set a value in Memory
     * @param key The key to set
     * @param value The value to set
     */
    public static set<T>(key: string, value: T): void {
        _.set(Memory, key, value);
    }

    /**
     * Check if a key exists in Memory
     * @param key The key to check
     */
    public static has(key: string): boolean {
        return _.has(Memory, key);
    }

    /**
     * Delete a key from Memory
     * @param key The key to delete
     */
    public static delete(key: string): void {
        _.unset(Memory, key);
    }

    /**
     * Clean up memory of non-existing creeps
     */
    public static cleanupCreeps(): void {
        for (const name in Memory.creeps) {
            if (!Game.creeps[name]) {
                delete Memory.creeps[name];
                console.log(`Clearing non-existing creep memory: ${name}`);
            }
        }
    }

    /**
     * Get all creeps with a specific role
     * @param role The role to filter by
     */
    public static getCreepsByRole(role: CreepRole): Creep[] {
        return Object.values(Game.creeps).filter(creep =>
            creep.memory.role === role
        );
    }

    /**
     * Count creeps by role
     */
    public static countCreepsByRole(): Record<CreepRole, number> {
        const counts: Record<CreepRole, number> = {} as Record<CreepRole, number>;

        for (const name in Game.creeps) {
            const role = Game.creeps[name].memory.role as CreepRole;
            counts[role] = (counts[role] || 0) + 1;
        }

        return counts;
    }

    /**
     * Set a creep's role
     * @param creepName The name of the creep
     * @param role The new role to assign
     */
    public static setCreepRole(creepName: string, role: CreepRole): void {
        if (Game.creeps[creepName]) {
            Game.creeps[creepName].memory.role = role;
            console.log(`Reassigned ${creepName} to role: ${role}`);
        }
    }

    /**
     * Set a creep's working state (e.g., harvesting or delivering)
     * @param creepName The name of the creep
     * @param isWorking Whether the creep is in working mode
     */
    public static setCreepWorking(creepName: string, isWorking: boolean): void {
        if (Game.creeps[creepName]) {
            Game.creeps[creepName].memory.working = isWorking;
        }
    }

    /**
     * Log memory stats for debugging
     */
    public static logStats(): void {
        const creepCounts = this.countCreepsByRole();
        console.log('===== Colony Status =====');
        console.log(`Total creeps: ${Object.values(Game.creeps).length}`);

        for (const role in creepCounts) {
            // Cast the role string to CreepRole enum to satisfy TypeScript
            console.log(`${role}: ${creepCounts[role as CreepRole]}`);
        }

        console.log(`CPU Used: ${Game.cpu.getUsed().toFixed(2)}/${Game.cpu.limit}`);
        console.log(`Bucket: ${Game.cpu.bucket}/10000`);
        console.log('========================');
    }

    // Memory polku creepien määräasetuksille
    private static readonly CREEP_COUNTS_PATH = 'creepCounts';

    /**
     * Luo oletusarvoilla täytetyn creep count -objektin
     * @private
     * @returns Oletusarvoilla täytetty creep count objekti
     */
    private static createDefaultCreepCounts(): Record<CreepRole, number> {
        const creepDefinitions = CreepDefinitions.getInstance();
        const defaultCounts: Record<CreepRole, number> = {} as Record<CreepRole, number>;

        // Alustetaan oletusarvot kaikille rooleille
        creepDefinitions.getAllRoles().forEach(r => {
            defaultCounts[r] = creepDefinitions.getDefaultCountForRole(r);
        });

        return defaultCounts;
    }

    /**
     * Alusta creepien määräasetukset, jos niitä ei ole vielä määritelty
     */
    public static initCreepCounts(): void {
        if (!this.has(this.CREEP_COUNTS_PATH)) {
            // Alustetaan oletusarvot ja talletetaan ne muistiin
            this.set(this.CREEP_COUNTS_PATH, this.createDefaultCreepCounts());
            console.log('Initialized default creep counts in Memory');
        }
    }

    /**
     * Hae tietyn roolin creepien tavoitemäärä
     * @param role Rooli, jonka tavoitemäärä halutaan hakea
     * @returns Tavoitemäärä tai oletusarvo jos määrää ei ole asetettu
     */
    public static getCreepCountTarget(role: CreepRole): number {
        const counts = this.get<Record<CreepRole, number>>(this.CREEP_COUNTS_PATH, this.createDefaultCreepCounts());
        return counts ? counts[role] || 0 : 0;
    }

    /**
     * Aseta tietyn roolin creepien tavoitemäärä
     * @param role Rooli, jonka tavoitemäärä halutaan asettaa
     * @param count Uusi tavoitemäärä
     */
    public static setCreepCountTarget(role: CreepRole, count: number): void {
        const counts = this.get<Record<CreepRole, number>>(this.CREEP_COUNTS_PATH, this.createDefaultCreepCounts()) || this.createDefaultCreepCounts();
        counts[role] = count;
        this.set(this.CREEP_COUNTS_PATH, counts);
        console.log(`Set ${role} target count to ${count}`);
    }

    /**
     * Hae kaikkien roolien creepien tavoitemäärät
     * @returns Objekti, joka sisältää kaikkien roolien tavoitemäärät
     */
    public static getAllCreepCountTargets(): Record<CreepRole, number> {
        return this.get<Record<CreepRole, number>>(this.CREEP_COUNTS_PATH, this.createDefaultCreepCounts()) || this.createDefaultCreepCounts();
    }
}