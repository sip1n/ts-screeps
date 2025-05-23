// Extend the CreepMemory interface to include the role property
interface CreepMemory {
    role: string;
    working?: boolean; // Optional boolean to track if the creep is currently working
    previousPos?: { x: number, y: number, roomName: string }; // Viimeisin sijainti heatmapia varten
    idle?: boolean; // Whether the creep is in idle state (no tasks for its role available)
    forceIdle?: boolean; // Force the creep to be idle, ignoring all role logic
}

// Memory-järjestelmämäärittelyt
interface Memory {
    creeps: { [name: string]: CreepMemory };
    heatmap?: {
        [roomName: string]: {
            [x: number]: {
                [y: number]: number // Arvo kuvaa kuinka usein sijainnissa on käyty
            }
        }
    };
    pathTracking?: {
        enabled: boolean;           // Onko järjestelmä käytössä
        updateFrequency: number;    // Kuinka usein päivitetään (ticks)
        decayRate: number;          // Kuinka nopeasti vanhemmat reitit "jäähtyvät"
        buildRoadThreshold: number; // Kuinka korkea lämpöarvo vaaditaan tien rakentamiseen
        lastRoadBuildTime?: number; // Milloin viimeksi rakennettu tie
        roadBuildInterval: number;  // Kuinka usein rakennetaan teitä (ticks)
        visualize: boolean;         // Näytetäänkö visualisointi
        useConnectedRoads: boolean; // Rakennetaanko yhtenäisiä tieverkostoja
    };
    pathCache?: {
        [key: string]: {
            path: RoomPosition[];
            lastUsed: number;
        }
    };
    _systemsInitialized?: boolean;  // Onko järjestelmät alustettu tässä pelisessiossa
}

// Declare the global lodash variable for use in modules
declare const _: {
    // Use more permissive types that can accept Screeps' Memory object
    get<T, O = Record<string, unknown>>(object: O, path: string, defaultValue?: T): T;
    set<T, O = Record<string, unknown>>(object: O, path: string, value: T): O;
    has<O = Record<string, unknown>>(object: O, path: string): boolean;
    unset<O = Record<string, unknown>>(object: O, path: string): boolean;
    // Add more specific method signatures as needed
    [key: string]: unknown;
};
