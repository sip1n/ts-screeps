// Extend the CreepMemory interface to include the role property
interface CreepMemory {
    role: string;
    working?: boolean; // Optional boolean to track if the creep is currently working
    previousPos?: { x: number, y: number, roomName: string }; // Viimeisin sijainti heatmapia varten
}

// Muistirakenne heatmapia varten
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
    };
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
