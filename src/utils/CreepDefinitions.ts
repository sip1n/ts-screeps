import { CreepRole } from "./enums";

/**
 * Interface, joka määrittelee creep-roolien ominaisuudet
 */
export interface ICreepDefinition {
    // Roolin nimi
    role: CreepRole;
    // Roolin kuvaus
    description: string;
    // Roolin minimivaatimukset (body parts)
    minimumBody: BodyPartConstant[];
    // Roolin perusruumis energian skaalautumista varten
    baseBody: BodyPartConstant[];
    // Oletusmäärä tätä roolia
    defaultCount: number;
}

/**
 * Luokka, joka sisältää keskitetyt määrittelyt kaikille creep-rooleille
 */
export class CreepDefinitions {
    // Singleton-instanssi
    private static instance: CreepDefinitions;

    // Map, joka sisältää kaikki roolimäärittelyt
    private definitions: Map<CreepRole, ICreepDefinition> = new Map();

    /**
     * Yksityinen konstruktori, joka alustaa määrittelyt
     */
    private constructor() {
        this.initializeDefinitions();
    }

    /**
     * Hakee singleton-instanssin
     */
    public static getInstance(): CreepDefinitions {
        if (!CreepDefinitions.instance) {
            CreepDefinitions.instance = new CreepDefinitions();
        }
        return CreepDefinitions.instance;
    }

    /**
     * Alustaa kaikki creep-roolien määrittelyt
     */
    private initializeDefinitions(): void {
        // PAWN - Perustyöntekijä, joka voi tehdä kaikkea
        this.definitions.set(CreepRole.PAWN, {
            role: CreepRole.PAWN,
            description: "Perustyöntekijä, joka voi tehdä kaikkea mutta ei erikoistu mihinkään",
            minimumBody: [WORK, CARRY, MOVE],
            baseBody: [WORK, CARRY, MOVE],
            defaultCount: 2
        });

        // HARVESTER - Resurssien kerääjä
        this.definitions.set(CreepRole.HARVESTER, {
            role: CreepRole.HARVESTER,
            description: "Resurssien kerääjä, erikoistunut tehokkaaseen louhintaan",
            minimumBody: [WORK, WORK, CARRY, MOVE],
            baseBody: [WORK, WORK, CARRY, MOVE],
            defaultCount: 2
        });

        // BUILDER - Rakentaja
        this.definitions.set(CreepRole.BUILDER, {
            role: CreepRole.BUILDER,
            description: "Rakentaja, erikoistunut rakenteiden rakentamiseen ja korjaamiseen",
            minimumBody: [WORK, CARRY, CARRY, MOVE, MOVE],
            baseBody: [WORK, CARRY, CARRY, MOVE, MOVE],
            defaultCount: 2
        });

        // UPGRADER - Controllerin päivittäjä
        this.definitions.set(CreepRole.UPGRADER, {
            role: CreepRole.UPGRADER,
            description: "Controllerin päivittäjä, erikoistunut controllerin tehokkaaseen päivittämiseen",
            minimumBody: [WORK, WORK, CARRY, MOVE],
            baseBody: [WORK, WORK, CARRY, MOVE],
            defaultCount: 2
        });

        // REPAIRMAN - Rakenteiden korjaaja
        this.definitions.set(CreepRole.REPAIRMAN, {
            role: CreepRole.REPAIRMAN,
            description: "Yleismies jantunen, joka korjaa rakenteita ja ylläpitää koloniaa",
            minimumBody: [WORK, CARRY, CARRY, MOVE, MOVE],
            baseBody: [WORK, CARRY, CARRY, MOVE, MOVE],
            defaultCount: 1
        });

        // lisää muita rooleja tarvittaessa
    }

    /**
     * Hakee tietyn roolin määrittelyn
     * @param role Rooli, jonka määrittely halutaan hakea
     * @returns Roolin määrittely tai undefined jos roolia ei löydy
     */
    public getDefinition(role: CreepRole): ICreepDefinition | undefined {
        return this.definitions.get(role);
    }

    /**
     * Hakee kaikkien roolien määrittelyt
     * @returns Kaikki roolimäärittelyt map-objektina
     */
    public getAllDefinitions(): Map<CreepRole, ICreepDefinition> {
        return this.definitions;
    }

    /**
     * Hakee tietyn roolin minimiruumiinosat
     * @param role Rooli, jonka minimiruumiinosat halutaan hakea
     * @returns Minimiruumiinosat tai oletus ([WORK, CARRY, MOVE]) jos roolia ei löydy
     */
    public getMinimumBodyForRole(role: CreepRole): BodyPartConstant[] {
        const definition = this.definitions.get(role);
        return definition ? definition.minimumBody : [WORK, CARRY, MOVE];
    }

    /**
     * Hakee tietyn roolin perusruumiinosan energian skaalautumista varten
     * @param role Rooli, jonka perusruumiinosa halutaan hakea
     * @returns Perusruumiinosa tai oletus ([WORK, CARRY, MOVE]) jos roolia ei löydy
     */
    public getBaseBodyForRole(role: CreepRole): BodyPartConstant[] {
        const definition = this.definitions.get(role);
        return definition ? definition.baseBody : [WORK, CARRY, MOVE];
    }

    /**
     * Hakee tietyn roolin oletusmäärän
     * @param role Rooli, jonka oletusmäärä halutaan hakea
     * @returns Oletusmäärä tai 0 jos roolia ei löydy
     */
    public getDefaultCountForRole(role: CreepRole): number {
        const definition = this.definitions.get(role);
        return definition ? definition.defaultCount : 0;
    }

    /**
     * Hakee kaikki määritellyt roolit
     * @returns Kaikki määritellyt roolit array-objektina
     */
    public getAllRoles(): CreepRole[] {
        return Array.from(this.definitions.keys());
    }
}