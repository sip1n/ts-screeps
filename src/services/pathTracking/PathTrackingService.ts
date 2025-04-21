/**
 * Palveluluokka, joka seuraa creepien polkuja ja luo heatmapin
 * usein käytetyistä reiteistä teiden rakentamista varten
 */

export class PathTrackingService {
  /**
   * Palauttaa oletusasetukset path tracking -järjestelmälle
   */
  private static getDefaultSettings(): Required<
    NonNullable<Memory["pathTracking"]>
  > {
    return {
      enabled: true,
      updateFrequency: 1, // Päivitetään joka tick
      decayRate: 0.01, // Lämpökartta jäähtyy hitaasti ajan myötä
      buildRoadThreshold: 10, // Päivitetty: Pienempi kynnysarvo tien rakentamiselle
      roadBuildInterval: 300, // Rakennetaan teitä kerran 300 tickin aikana
      visualize: true, // Visualisoidaan heatmap oletuksena
      useConnectedRoads: true, // Rakennetaan yhtenäisiä tieverkostoja
      lastRoadBuildTime: 0, // Alustusarvo
    };
  }

  /**
   * Alustaa path tracking järjestelmän jos sitä ei vielä ole
   */
  public static initialize(): void {
    // Alustetaan pathTracking jos sitä ei vielä ole
    if (!Memory.pathTracking) {
      Memory.pathTracking = this.getDefaultSettings();
    } else {
      // Alustetaan puuttuvat asetukset käymällä läpi defaults-objekti
      const defaults = this.getDefaultSettings();
      for (const key of Object.keys(defaults) as Array<keyof typeof defaults>) {
        if (Memory.pathTracking[key] === undefined) {
          // @ts-expect-error: not assignable to type 'never'
          Memory.pathTracking[key] = defaults[key];
          console.log(`PathTracking: Alustettu puuttuva asetus ${key}`);
        }
      }
    }

    // Alustetaan heatmap jos sitä ei vielä ole
    if (!Memory.heatmap) {
      Memory.heatmap = {};
    }

    // Alustetaan pathCache jos sitä ei vielä ole
    if (!Memory.pathCache) {
      Memory.pathCache = {};
    }
  }

  /**
   * Päivittää heatmapin creepien liikkeiden perusteella
   */
  public static update(): void {
    // Early return jos path tracking ei ole käytössä
    if (!Memory.pathTracking?.enabled) return;

    // Päivitetään vain tietyin väliajoin CPU:n säästämiseksi
    if (Game.time % (Memory.pathTracking.updateFrequency || 1) !== 0) return;

    // Nyt voimme jatkaa varsinaista päivitystä
    for (const name in Game.creeps) {
      const creep = Game.creeps[name];
      this.trackCreepMovement(creep);
    }

    // Decay heatmap values over time
    this.decayHeatmap();

    // Visualisoi heatmap jos käytössä
    if (Memory.pathTracking.visualize) {
      this.visualizeHeatmap();
    }

    // Tarkista pitäisikö rakentaa teitä
    this.buildRoadsOnHotPaths();
  }

  /**
   * Seuraa yhden creepin liikettä ja päivittää heatmapia
   */
  private static trackCreepMovement(creep: Creep): void {
    const currentPos = {
      x: creep.pos.x,
      y: creep.pos.y,
      roomName: creep.room.name,
    };

    // Jos creepillä on jo tallennettu edellinen sijainti ja se on eri kuin nykyinen
    if (
      creep.memory.previousPos &&
      (creep.memory.previousPos.x !== currentPos.x ||
        creep.memory.previousPos.y !== currentPos.y)
    ) {
      // Päivitä heatmap
      this.incrementHeatmapValue(
        currentPos.roomName,
        currentPos.x,
        currentPos.y
      );
    }

    // Tallenna nykyinen sijainti seuraavaa tickiä varten
    creep.memory.previousPos = currentPos;
  }

  /**
   * Kasvattaa heatmapin arvoa tietyssä huoneessa ja koordinaateissa
   */
  private static incrementHeatmapValue(
    roomName: string,
    x: number,
    y: number
  ): void {
    if (!Memory.heatmap) {
      Memory.heatmap = {};
    }

    if (!Memory.heatmap[roomName]) {
      Memory.heatmap[roomName] = {};
    }

    if (!Memory.heatmap[roomName][x]) {
      Memory.heatmap[roomName][x] = {};
    }

    if (!Memory.heatmap[roomName][x][y]) {
      Memory.heatmap[roomName][x][y] = 0;
    }

    Memory.heatmap[roomName][x][y] += 1;
  }

  /**
   * Vähentää heatmapin arvoja ajan myötä, jotta vanhat reitit "jäähtyvät"
   */
  private static decayHeatmap(): void {
    if (!Memory.heatmap) {
      return;
    }

    const decayRate = Memory.pathTracking?.decayRate || 0.01;

    for (const roomName in Memory.heatmap) {
      for (const x in Memory.heatmap[roomName]) {
        for (const y in Memory.heatmap[roomName][x]) {
          const xNum = parseInt(x);
          const yNum = parseInt(y);

          // Vähennä arvoa decay-prosentin verran
          Memory.heatmap[roomName][xNum][yNum] *= 1 - decayRate;

          // Jos arvo on liian pieni, poista se kokonaan
          if (Memory.heatmap[roomName][xNum][yNum] < 0.1) {
            delete Memory.heatmap[roomName][xNum][yNum];
          }
        }

        // Siivoa tyhjät x-koordinaatit
        if (Object.keys(Memory.heatmap[roomName][x]).length === 0) {
          delete Memory.heatmap[roomName][x];
        }
      }

      // Siivoa tyhjät huoneet
      if (Object.keys(Memory.heatmap[roomName]).length === 0) {
        delete Memory.heatmap[roomName];
      }
    }
  }

  /**
   * Rakentaa teitä usein käytetyille reiteille
   */
  private static buildRoadsOnHotPaths(): void {
    if (!Memory.heatmap || !Memory.pathTracking) {
      return;
    }

    // Tarkista onko aika rakentaa teitä
    const lastBuildTime = Memory.pathTracking.lastRoadBuildTime || 0;
    const interval = Memory.pathTracking.roadBuildInterval || 300;

    if (Game.time - lastBuildTime < interval) return;

    const threshold = Memory.pathTracking.buildRoadThreshold || 10; // Käytä päivitettyä kynnysarvoa
    let roadsBuilt = 0;
    const maxRoadsPerCycle = 5; // Rajoita rakennettavien teiden määrää per kierros

    // Käy läpi kaikki huoneet ja löydä "kuumimmat" kohdat
    for (const roomName in Memory.heatmap) {
      const room = Game.rooms[roomName];
      if (!room || !room.controller || !room.controller.my) continue;

      // Kerää lista potentiaalisista tien rakennuspaikoista
      const hotspots: { x: number; y: number; value: number }[] = [];

      for (const x in Memory.heatmap[roomName]) {
        for (const y in Memory.heatmap[roomName][x]) {
          const xNum = parseInt(x);
          const yNum = parseInt(y);
          const value = Memory.heatmap[roomName][xNum][yNum];

          if (value >= threshold) {
            hotspots.push({ x: xNum, y: yNum, value: value });
          }
        }
      }

      // Järjestä "kuumimmat" kohdat ensin
      hotspots.sort((a, b) => b.value - a.value);

      // Jos yhtenäisten teiden rakennus on käytössä, käytä sitä
      if (Memory.pathTracking.useConnectedRoads) {
        roadsBuilt += this.buildConnectedRoads(
          room,
          hotspots,
          maxRoadsPerCycle - roadsBuilt
        );
      } else {
        // Käytä perinteistä metodia, rakenna teitä järjestyksessä
        for (const spot of hotspots) {
          if (roadsBuilt >= maxRoadsPerCycle) break;

          const pos = new RoomPosition(spot.x, spot.y, roomName);

          // Tarkista onko paikalla jo tie tai construction site
          const structures = pos.lookFor(LOOK_STRUCTURES);
          const hasRoad = structures.some(
            (s) => s.structureType === STRUCTURE_ROAD
          );

          if (!hasRoad) {
            const sites = pos.lookFor(LOOK_CONSTRUCTION_SITES);
            const hasSite = sites.some(
              (s) => s.structureType === STRUCTURE_ROAD
            );

            if (!hasSite) {
              // Rakenna tie
              const result = room.createConstructionSite(pos, STRUCTURE_ROAD);
              if (result === OK) {
                roadsBuilt++;
                console.log(
                  `Building road at ${roomName} ${spot.x},${
                    spot.y
                  } (heat: ${spot.value.toFixed(2)})`
                );
              }
            }
          }
        }
      }
    }

    // Päivitä viimeisimmän rakennusajan
    if (roadsBuilt > 0) {
      Memory.pathTracking.lastRoadBuildTime = Game.time;
      console.log(`Built ${roadsBuilt} roads based on creep movement heatmap`);
    }
  }

  /**
   * Rakentaa yhtenäisiä teitä hotspottien välille
   */
  private static buildConnectedRoads(
    room: Room,
    hotspots: { x: number; y: number; value: number }[],
    maxRoads: number
  ): number {
    if (hotspots.length < 2) {
      return 0; // Ei tarpeeksi hotspotteja yhdistettäväksi
    }

    let roadsBuilt = 0;

    // Etsi olemassa olevat tiet ja huoneen tärkeät rakenukset (spawnit, kontrolleri, jne.)
    const existingRoads: RoomPosition[] = [];
    const importantStructures: RoomPosition[] = [];

    // Etsitään olemassa olevat tiet ja tärkeät rakennukset
    const structures = room.find(FIND_STRUCTURES);
    for (const struct of structures) {
      if (struct.structureType === STRUCTURE_ROAD) {
        existingRoads.push(struct.pos);
      } else if (
        struct.structureType === STRUCTURE_SPAWN ||
        struct.structureType === STRUCTURE_STORAGE ||
        struct.structureType === STRUCTURE_TERMINAL
      ) {
        importantStructures.push(struct.pos);
      }
    }

    // Lisätään kontrolleri tärkeisiin rakenteisiin
    if (room.controller) {
      importantStructures.push(room.controller.pos);
    }

    // Lisää myös rakennustyömaat teihin
    const constructionSites = room.find(FIND_CONSTRUCTION_SITES, {
      filter: (site) => site.structureType === STRUCTURE_ROAD,
    });
    for (const site of constructionSites) {
      existingRoads.push(site.pos);
    }

    // Jos olemassa olevia teitä tai rakenteita ei ole, rakennetaan hotspottien välisiä yhteyksiä
    if (existingRoads.length === 0 && importantStructures.length === 0) {
      // Valitaan ensimmäinen hotspot lähtöpisteeksi
      const startPos = new RoomPosition(
        hotspots[0].x,
        hotspots[0].y,
        room.name
      );

      // Yhdistä muut hotspotit tähän
      for (let i = 1; i < hotspots.length && roadsBuilt < maxRoads; i++) {
        const targetPos = new RoomPosition(
          hotspots[i].x,
          hotspots[i].y,
          room.name
        );
        roadsBuilt += this.buildRoadBetween(
          room,
          startPos,
          targetPos,
          maxRoads - roadsBuilt
        );
      }
    } else {
      // Muuten yhdistetään hotspotit lähimpiin olemassa oleviin teihin tai rakenteisiin
      for (const spot of hotspots) {
        if (roadsBuilt >= maxRoads) break;

        const startPos = new RoomPosition(spot.x, spot.y, room.name);

        // Etsi lähin olemassa oleva tie tai tärkeä rakenne
        let closestTarget: RoomPosition | null = null;
        let closestDistance = Infinity;

        // Tarkistetaan ensin onko hotspot jo tiellä
        const posStructs = startPos.lookFor(LOOK_STRUCTURES);
        const posConstSites = startPos.lookFor(LOOK_CONSTRUCTION_SITES);

        const isAlreadyRoad =
          posStructs.some((s) => s.structureType === STRUCTURE_ROAD) ||
          posConstSites.some((s) => s.structureType === STRUCTURE_ROAD);

        if (isAlreadyRoad) continue; // Tällä hotspotilla on jo tie, skipataaan

        // Etsi lähin tie tai rakenne
        for (const pos of [...existingRoads, ...importantStructures]) {
          const distance = startPos.getRangeTo(pos);
          if (distance < closestDistance && distance > 0) {
            // Vältä samaa positiota
            closestDistance = distance;
            closestTarget = pos;
          }
        }

        // Jos löydettiin kohde, rakenna tie siihen
        if (closestTarget && closestDistance > 1) {
          // Vain jos etäisyys > 1
          roadsBuilt += this.buildRoadBetween(
            room,
            startPos,
            closestTarget,
            maxRoads - roadsBuilt
          );
        }
      }
    }

    return roadsBuilt;
  }

  /**
   * Rakentaa tien kahden pisteen välille käyttäen pathfindingia
   */
  private static buildRoadBetween(
    room: Room,
    start: RoomPosition,
    end: RoomPosition,
    maxRoads: number
  ): number {
    // Generoi avain tälle reitille path cachea varten
    const pathKey = `${start.roomName}-${start.x},${start.y}-${end.roomName}-${end.x},${end.y}`;

    let path: RoomPosition[];

    // Tarkista onko reitti jo cachessa
    if (Memory.pathCache && Memory.pathCache[pathKey]) {
      path = Memory.pathCache[pathKey].path;
      // Päivitä last used
      Memory.pathCache[pathKey].lastUsed = Game.time;
    } else {
      // Laske reitti
      const result = PathFinder.search(
        start,
        { pos: end, range: 1 },
        {
          plainCost: 2,
          swampCost: 5,
          roomCallback: (roomName) => {
            // Voidaan käyttää tässä roomCallback-funktiota, joka ottaa huomioon olemassa olevat tiet
            const r = Game.rooms[roomName];
            if (!r) return false; // Skip rooms we don't have visibility to

            const costs = new PathFinder.CostMatrix();

            // Aseta olemassa olevat tiet halvimmiksi
            r.find(FIND_STRUCTURES).forEach((struct) => {
              if (struct.structureType === STRUCTURE_ROAD) {
                costs.set(struct.pos.x, struct.pos.y, 1); // Tiet ovat halpoja kulkea
              } else if (
                struct.structureType !== STRUCTURE_CONTAINER &&
                struct.structureType !== STRUCTURE_RAMPART
              ) {
                costs.set(struct.pos.x, struct.pos.y, 255); // Esteet ovat kalliita/mahdottomia
              }
            });

            // Ota huomioon myös rakennustyömaat
            r.find(FIND_CONSTRUCTION_SITES).forEach((site) => {
              if (site.structureType === STRUCTURE_ROAD) {
                costs.set(site.pos.x, site.pos.y, 1); // Tietyömaat ovat myös halpoja
              } else if (
                site.structureType !== STRUCTURE_CONTAINER &&
                site.structureType !== STRUCTURE_RAMPART
              ) {
                costs.set(site.pos.x, site.pos.y, 255);
              }
            });

            return costs;
          },
        }
      );

      // Käsittele polunhaun tulos
      if (result.incomplete) {
        console.log(`Path finding incomplete from ${start} to ${end}`);
        return 0;
      }

      path = result.path;

      // Tallenna reitti cacheen
      if (!Memory.pathCache) Memory.pathCache = {};
      Memory.pathCache[pathKey] = {
        path: path,
        lastUsed: Game.time,
      };
    }

    // Rakenna tiet polun varrelle
    let roadsBuilt = 0;
    for (const pos of path) {
      if (roadsBuilt >= maxRoads) break;

      // Tarkista onko tässä kohdassa jo tie tai rakennustyömaa
      // Luodaan uusi RoomPosition-objekti, koska muistista ladatuilta objekteilta puuttuu lookFor-metodi
      const roomPos = new RoomPosition(pos.x, pos.y, pos.roomName);
      const structures = roomPos.lookFor(LOOK_STRUCTURES);
      const hasRoad = structures.some(
        (s) => s.structureType === STRUCTURE_ROAD
      );

      if (!hasRoad) {
        const sites = roomPos.lookFor(LOOK_CONSTRUCTION_SITES);
        const hasSite = sites.some((s) => s.structureType === STRUCTURE_ROAD);

        if (!hasSite) {
          // Rakenna tie
          const result = room.createConstructionSite(roomPos, STRUCTURE_ROAD);
          if (result === OK) {
            roadsBuilt++;
            console.log(
              `Building connected road at ${roomPos} as part of path`
            );
          }
        }
      }
    }

    return roadsBuilt;
  }

  /**
   * Puhdistaa vanhentuneet pathcache-merkinnät
   */
  public static cleanupPathCache(maxAge: number = 20000): void {
    if (!Memory.pathCache) return;

    const currentTime = Game.time;
    let cleaned = 0;

    for (const key in Memory.pathCache) {
      if (currentTime - Memory.pathCache[key].lastUsed > maxAge) {
        delete Memory.pathCache[key];
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`Cleaned up ${cleaned} old path cache entries`);
    }
  }

  /**
   * Visualisoi heatmap huoneessa
   */
  private static visualizeHeatmap(): void {
    if (!Memory.heatmap || !Memory.pathTracking) {
      return;
    }

    for (const roomName in Memory.heatmap) {
      const room = Game.rooms[roomName];
      if (!room) continue; // Skip rooms we don't have visibility

      const visual = room.visual;
      const threshold = Memory.pathTracking.buildRoadThreshold || 100;

      for (const x in Memory.heatmap[roomName]) {
        for (const y in Memory.heatmap[roomName][x]) {
          const xNum = parseInt(x);
          const yNum = parseInt(y);
          const value = Memory.heatmap[roomName][xNum][yNum];

          // Väri vaihtelee sinisestä punaiseen lämpötilan mukaan
          const intensity = Math.min(1, value / threshold);
          const color = this.getHeatColor(intensity);

          // Piirrä "lämpö" pisteinä
          visual.circle(xNum, yNum, {
            radius: 0.15 + intensity * 0.3,
            fill: color,
            opacity: 0.3 + intensity * 0.5,
          });

          // Jos arvo ylittää kynnysrajan, näytä teksti
          if (value >= threshold) {
            visual.text(value.toFixed(0), xNum, yNum, {
              font: 0.3,
              align: "center",
              color: "#ffffff",
            });
          }
        }
      }
    }
  }

  /**
   * Generoi värin heat-intensiteetin perusteella
   */
  private static getHeatColor(intensity: number): string {
    // Sininen (kylmä) -> syaani -> vihreä -> keltainen -> punainen (kuuma)
    const r = intensity > 0.5 ? Math.floor(255 * (intensity * 2 - 1)) : 0;
    const g =
      intensity > 0.75
        ? Math.floor(255 * (1 - (intensity - 0.75) * 4))
        : intensity > 0.25
        ? Math.floor(255 * ((intensity - 0.25) * 2))
        : 0;
    const b = intensity < 0.5 ? Math.floor(255 * (1 - intensity * 2)) : 0;

    return `rgb(${r},${g},${b})`;
  }

  /**
   * Palauttaa heatmapin määritetystä huoneesta
   */
  public static getHeatmapForRoom(
    roomName: string
  ): Record<string, Record<string, number>> | null {
    return Memory.heatmap?.[roomName] || null;
  }

  /**
   * Tyhjentää heatmap-datan määritetystä huoneesta tai kaikista huoneista
   */
  public static clearHeatmap(roomName?: string): void {
    if (roomName) {
      if (Memory.heatmap?.[roomName]) {
        delete Memory.heatmap[roomName];
        console.log(`Cleared heatmap data for room ${roomName}`);
      }
    } else {
      Memory.heatmap = {};
      console.log("Cleared all heatmap data");
    }
  }

  /**
   * Ottaa käyttöön tai poistaa käytöstä path trackingin
   */
  public static setEnabled(enabled: boolean): void {
    if (!Memory.pathTracking) this.initialize();
    // Varmistetaan vielä initialize-kutsun jälkeen
    if (Memory.pathTracking) {
      Memory.pathTracking.enabled = enabled;
      console.log(`Path tracking ${enabled ? "enabled" : "disabled"}`);
    }
  }

  /**
   * Ottaa käyttöön tai poistaa käytöstä visualisoinnin
   */
  public static setVisualization(enabled: boolean): void {
    if (!Memory.pathTracking) this.initialize();
    // Varmistetaan vielä initialize-kutsun jälkeen
    if (Memory.pathTracking) {
      Memory.pathTracking.visualize = enabled;
      console.log(`Heatmap visualization ${enabled ? "enabled" : "disabled"}`);
    }
  }

  /**
   * Säätää kynnysarvoa, jonka jälkeen teitä rakennetaan
   */
  public static setRoadBuildThreshold(value: number): void {
    if (!Memory.pathTracking) this.initialize();
    // Varmistetaan vielä initialize-kutsun jälkeen
    if (Memory.pathTracking) {
      Memory.pathTracking.buildRoadThreshold = value;
      console.log(`Road build threshold set to ${value}`);
    }
  }
}
