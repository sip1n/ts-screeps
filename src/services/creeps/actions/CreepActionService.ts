import { CreepBase } from "../../../classes/creeps/CreepBase";

/**
 * Palveluluokka, joka määrittelee creepien toimintojen logiikan
 */
export class CreepActionService {
    // Määritellään raja, paljonko energiaa "yksinkertainen" rakenne saa maksimissaan vaatia
    private static readonly SIMPLE_STRUCTURE_MAX_ENERGY = 3000;

    /**
     * Siirtää energiaa lähimpään rakenteeseen, joka sitä tarvitsee
     * @returns true jos siirto onnistui, false jos ei löytynyt kohdetta
     */
    public static transferEnergyToStructures(creep: CreepBase): boolean {
        const result = creep.transferEnergyToClosestStructure();
        return result !== null;
    }

    /**
     * Rakentaa rakenteita. Jos ei ole rakennuskohteita, päivittää controlleria.
     * @returns true jos rakentaminen onnistui, false jos ei löytynyt kohdetta
     */
    public static buildStructures(creep: CreepBase): boolean {
        const site = creep.getClosestConstructionSite();
        if (site) {
            creep.buildStructure(site);
            return true;
        }
        return false;
    }

    /**
     * Rakentaa vain "kevyitä"(esim. max 3000) pisteen rakenteita
     * @returns true jos rakentaminen onnistui, false jos ei löytynyt sopivia kohteita
     */
    public static buildSimpleStructures(creep: CreepBase): boolean {
        // Haetaan kaikki rakennuskohteet
        const sites = creep.getAllConstructionSites();

        // Palautetaan heti false jos rakennuskohteita ei löydy
        if (sites.length === 0) return false;


        // Suodatetaan rakenteet, joiden rakentaminen vaatii vähän energiaa
        const simpleStructures = sites.filter(site => {
            return site.progressTotal <= this.SIMPLE_STRUCTURE_MAX_ENERGY;
        });

        if (simpleStructures.length === 0) return false;

        const closestSimple = creep['creep'].pos.findClosestByPath(simpleStructures);
        if (closestSimple) {
            creep.buildStructure(closestSimple);
            return true;
        }

        return false;
    }

    /**
     * Korjaa rakenteita, prioriteettijärjestyksessä
     * @param creep Creep, joka korjaa rakenteita
     * @param minHitsPercent Paljonko prosenttia rakenteen max HP:stä pitää olla jäljellä jotta sitä ei tarvitse korjata (oletus 0.75 = 75%)
     * @returns true jos korjaus onnistui, false jos ei löytynyt korjattavaa
     */
    public static repairStructures(creep: CreepBase, minHitsPercent: number = 0.75): boolean {
        return creep.repairClosestStructure(minHitsPercent);
    }

    /**
     * Laskee paljonko energiaa rakenteen valmiiksi saattamiseen vielä tarvitaan
     */
    private static getStructureRemainingEnergy(site: ConstructionSite): number {
        // Rakenteen jäljellä oleva energia on suoraan progressTotal - progress
        return site.progressTotal - site.progress;
    }

    /**
     * Päivittää controlleria
     * @returns true jos päivitys onnistui, false jos ei löytynyt controlleria
     */
    public static upgradeController(creep: CreepBase): boolean {
        const result = creep.upgradeController();
        return result !== null;
    }

    /**
     * Suorittaa harvester-toiminnot: täyttää energia-rakenteita
     */
    public static runHarvesterActions(creep: CreepBase): void {
        if (!this.transferEnergyToStructures(creep)) {
            // Jos ei ole energiavarastoja täytettävänä, asetutaan idle-tilaan
            creep.setIdleState(true);
        } else {
            creep.setIdleState(false);
        }
    }

    /**
     * Suorittaa builder-toiminnot: rakentaa rakenteita, muuten päivittää controlleria
     */
    public static runBuilderActions(creep: CreepBase): void {
        if (this.buildStructures(creep)) {
            creep.setIdleState(false);
        } else {
            // Jos ei ole rakennuskohteita, asetutaan idle-tilaan
            creep.setIdleState(true);
        }
    }

    /**
     * Suorittaa upgrader-toiminnot: päivittää controlleria
     */
    public static runUpgraderActions(creep: CreepBase): void {
        if (this.upgradeController(creep)) {
            creep.setIdleState(false);
        } else {
            // Jos ei ole controlleria päivitettävänä, asetutaan idle-tilaan (epätodennäköistä)
            creep.setIdleState(true);
        }
    }

    /**
     * Suorittaa repairman-toiminnot: korjaa rakenteita, muuten tukee muita tehtäviä
     */
    public static runRepairmanActions(creep: CreepBase): void {
        if (this.repairStructures(creep)) {
            creep.setIdleState(false);
        } else {
            // Jos ei ole korjattavaa, asetutaan idle-tilaan
            creep.setIdleState(true);
        }
    }

    /**
     * Suorittaa pawn-toiminnot, prioriteettijärjestyksessä:
     * 1. Siirtää energiaa rakenteisiin
     * 2. Rakentaa VAIN yksinkertaisia rakenteita (seinät, tiet)
     * 3. Päivittää controlleria
     */
    public static runPawnActions(creep: CreepBase): void {
        if (this.transferEnergyToStructures(creep)) {
            creep.setIdleState(false);
        } else if (this.buildSimpleStructures(creep)) {
            creep.setIdleState(false);
        } else if (this.upgradeController(creep)) {
            creep.setIdleState(false);
        } else {
            // Jos mitään tehtävää ei löydy, asetutaan idle-tilaan
            creep.setIdleState(true);
        }
    }

    /**
     * Suorittaa dynaamiset tehtävät idle-tilassa oleville creepeille
     * @param creep Idle-tilassa oleva creep
     * @returns true jos jotain tehtävää löytyi ja suoritettiin, false jos ei mitään tehtävää saatavilla
     */
    public static runDynamicIdleTasks(creep: CreepBase): boolean {
        // Prioriteettijärjestyksessä:
        // 1. Energia varastoihin (tärkeintä)
        if (this.transferEnergyToStructures(creep)) {
            return true;
        }

        // 2. Korjaa rakenteita jotka ovat huonossa kunnossa (alle 50%)
        if (this.repairStructures(creep, 0.5)) {
            return true;
        }

        // 3. Rakenna rakenteita
        if (this.buildStructures(creep)) {
            return true;
        }

        // 4. Päivitä controlleria (viimeinen prioriteetti)
        if (this.upgradeController(creep)) {
            return true;
        }

        // Ei löytynyt mitään tehtävää
        return false;
    }
}