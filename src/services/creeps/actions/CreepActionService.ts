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
        this.transferEnergyToStructures(creep);
    }

    /**
     * Suorittaa builder-toiminnot: rakentaa rakenteita, muuten päivittää controlleria
     */
    public static runBuilderActions(creep: CreepBase): void {
        if (!this.buildStructures(creep)) {
            this.upgradeController(creep);
        }
    }

    /**
     * Suorittaa upgrader-toiminnot: päivittää controlleria
     */
    public static runUpgraderActions(creep: CreepBase): void {
        this.upgradeController(creep);
    }

    /**
     * Suorittaa pawn-toiminnot, prioriteettijärjestyksessä:
     * 1. Siirtää energiaa rakenteisiin
     * 2. Rakentaa VAIN yksinkertaisia rakenteita (seinät, tiet)
     * 3. Päivittää controlleria
     */
    public static runPawnActions(creep: CreepBase): void {
        if (!this.transferEnergyToStructures(creep)) {
            // Huom: Pawn rakentaa vain yksinkertaisia rakenteita
            if (!this.buildSimpleStructures(creep)) {
                this.upgradeController(creep);
            }
        }
    }
}